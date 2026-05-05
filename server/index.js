const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// ─── Server Limits ──────────────────────────────────────
const MAX_ROOMS            = 50;
const MAX_PLAYERS_PER_ROOM = 10;
const MAX_FURNITURE        = 20;
const GRID_SIZE            = 64;

const FURNITURE_FOOTPRINTS = [
  { w: 1, h: 1, walkable: false }, // 0: Cube
  { w: 1, h: 1, walkable: false }, // 1: Sphere
  { w: 1, h: 1, walkable: false }, // 2: Cylinder
  { w: 1, h: 1, walkable: false }, // 3: Pyramid
  { w: 1, h: 1, walkable: true  }, // 4: Chair
  { w: 1, h: 1, walkable: false }, // 5: Plant
  { w: 1, h: 1, walkable: false }, // 6: Lamp
  { w: 2, h: 2, walkable: true  }, // 7: Rug
];

function getFootprint(type, rotation) {
  const fp = FURNITURE_FOOTPRINTS[type];
  if (!fp) return { w: 1, h: 1, walkable: false };
  const rot = (rotation || 0) % 4;
  const w = (rot % 2 === 1) ? fp.h : fp.w;
  const h = (rot % 2 === 1) ? fp.w : fp.h;
  return { w, h, walkable: fp.walkable };
}

function getCells(item) {
  const fp = getFootprint(item.t, item.r);
  const cells = [];
  for (let dx = 0; dx < fp.w; dx++) {
    for (let dy = 0; dy < fp.h; dy++) {
      cells.push(`${item.x + dx},${item.y + dy}`);
    }
  }
  return cells;
}

// ─── Room State ─────────────────────────────────────────
// rooms: Map<roomId, { players, revealedPairs }>
//   players:       Map<socketId, playerData>
//   revealedPairs: Set<string>  — "idA:idB" sorted pairs who revealed names
const rooms = new Map();

// Player colors
const PLAYER_COLORS = [
  0x00f0ff, 0xff00ff, 0x39ff14, 0xff007f, 0xffff00,
  0xff8800, 0xbd00ff, 0x0088ff, 0xff3333, 0x00ffcc,
];

// ─── Helpers ────────────────────────────────────────────

function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(id) ? generateRoomId() : id;
}

function getNextColor(room) {
  return PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
}

function findJoinableRoom() {
  const available = [];
  for (const [roomId, room] of rooms) {
    if (room.isPublic !== false && room.players.size < MAX_PLAYERS_PER_ROOM) available.push(roomId);
  }
  
  if (available.length === 0) return null;

  // Distribute the player randomly across any of the available active public rooms
  return available[Math.floor(Math.random() * available.length)];
}

/** Create a canonical pair key for two socket IDs */
function pairKey(a, b) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function removePlayerFromRoom(socket) {
  const roomId = socket.roomId;
  if (!roomId || !rooms.has(roomId)) return;

  const room = rooms.get(roomId);
  room.players.delete(socket.id);

  // Clean up revealed pairs involving this player
  for (const key of room.revealedPairs) {
    if (key.includes(socket.id)) room.revealedPairs.delete(key);
  }

  socket.to(roomId).emit('playerLeft', { id: socket.id });
  console.log(`   ↳ Removed from room ${roomId} (${room.players.size} left)`);

  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`   ↳ Room ${roomId} deleted (empty)`);
  }
}

function createRoom() {
  return { players: new Map(), revealedPairs: new Set(), occupiedCells: new Set(), blockedCells: new Set() };
}

function joinPlayerToRoom(socket, roomId, name, customization) {
  const room = rooms.get(roomId);
  const color = getNextColor(room);
  
  // Assign a unique stranger name
  const existingAliases = new Set(Array.from(room.players.values()).map(p => p.strangerName));
  let strangerName = 'Stranger X';
  for (let i = 1; i <= 1000; i++) {
     if (!existingAliases.has(`Stranger ${i}`)) {
        strangerName = `Stranger ${i}`;
        break;
     }
  }

  const playerData = {
    id: socket.id,
    name: name || 'Stranger',
    strangerName,
    x: 600,
    y: 400,
    color,
    lastActive: Date.now(),
    customization: customization || { colorIdx: 0, shape: 0, accessory: 0, pulse: 1 },
  };

  room.players.set(socket.id, playerData);
  socket.join(roomId);
  socket.roomId = roomId;
  socket.playerData = playerData;

  return playerData;
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── Socket.IO ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✦ Player connected   [${socket.id}]`);

  // ── Create Room ──
  socket.on('createRoom', ({ name, customization, isPublic }) => {
    if (rooms.size >= MAX_ROOMS) {
      socket.emit('error', { message: 'Server is full. Try again later.' });
      return;
    }
    const roomId = generateRoomId();
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: socket.id, isPublic: isPublic !== false, furniture: [], occupiedCells: new Set(), blockedCells: new Set() });
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const room = rooms.get(roomId);
    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: true,
      isPublic: room.isPublic,
      furniture: room.furniture,
    });
    console.log(`   ↳ Created room ${roomId} (name: "${playerData.name}", public: ${room.isPublic})`);
  });

  // ── Join Specific Room ──
  socket.on('joinRoom', ({ roomId, name, customization }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error', { message: `Room "${roomId}" not found.` }); return; }
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) { socket.emit('error', { message: 'That room is full.' }); return; }

    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: room.ownerId === socket.id,
      isPublic: room.isPublic !== false,
      furniture: room.furniture,
    });
    
    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined room ${roomId} (name: "${playerData.name}", total: ${room.players.size})`);
  });

  // ── Join Random Room ──
  socket.on('joinRandomRoom', ({ name, customization }) => {
    let roomId = findJoinableRoom();
    if (!roomId) {
      if (rooms.size >= MAX_ROOMS) { socket.emit('error', { message: 'Server is full. Try again later.' }); return; }
      roomId = generateRoomId();
      rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: socket.id, isPublic: true, furniture: [], occupiedCells: new Set(), blockedCells: new Set() });
      console.log(`   ↳ No open rooms, auto-created ${roomId}`);
    }

    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: room.ownerId === socket.id,
      isPublic: room.isPublic !== false,
      furniture: room.furniture,
    });
    
    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined random room ${roomId} (name: "${playerData.name}", total: ${room.players.size})`);
  });

  socket.on('fleeRoom', ({ name, customization }) => {
    removePlayerFromRoom(socket);
    const roomId = generateRoomId();
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: socket.id, isPublic: true, furniture: [], occupiedCells: new Set(), blockedCells: new Set() });
    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: true,
      isPublic: true,
      furniture: room.furniture,
    });
    console.log(`   ↳ Fled to new room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Furniture Placement ──
  socket.on('placeFurniture', ({ item }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (!item || typeof item.t !== 'number') return;
    if (room.furniture.length >= MAX_FURNITURE) {
      socket.emit('error', { message: 'Room furniture limit reached (20).' });
      return;
    }
    const maxX = Math.floor(1200 / GRID_SIZE);
    const maxY = Math.floor(800 / GRID_SIZE);
    if (item.r < 0 || item.r > 3) item.r = 0;
    if (item.t < 0 || item.t >= FURNITURE_FOOTPRINTS.length) return;

    const fp = getFootprint(item.t, item.r);
    if (item.x < 0 || item.x + fp.w > maxX || item.y < 0 || item.y + fp.h > maxY) {
      socket.emit('error', { message: 'Furniture out of bounds.' });
      return;
    }

    const cells = getCells(item);
    for (const cell of cells) {
      if (room.occupiedCells.has(cell)) {
        socket.emit('error', { message: 'Space is already occupied.' });
        return;
      }
    }

    for (const cell of cells) {
      room.occupiedCells.add(cell);
      if (!fp.walkable) room.blockedCells.add(cell);
    }

    room.furniture.push(item);
    io.in(roomId).emit('furniturePlaced', { item });
  });

  socket.on('removeFurniture', ({ index }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (index >= 0 && index < room.furniture.length) {
      const item = room.furniture[index];
      const cells = getCells(item);
      for (const cell of cells) {
        room.occupiedCells.delete(cell);
        room.blockedCells.delete(cell);
      }
      room.furniture.splice(index, 1);
      io.in(roomId).emit('furnitureRemoved', { index });
    }
  });

  // ── Player Movement ──
  socket.on('playerMove', (data) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const pd = room.players.get(socket.id);
    if (!pd) return;
    pd.x = data.x;
    pd.y = data.y;
    pd.lastActive = Date.now();
    socket.to(roomId).emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
  });

  // ── Emote ──
  socket.on('sendEmote', ({ emote }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const now = Date.now();
    if (socket._lastEmote && now - socket._lastEmote < 500) return;
    socket._lastEmote = now;
    if (socket.playerData) socket.playerData.lastActive = now;
    io.in(roomId).emit('playerEmote', { id: socket.id, emote });
  });

  // ── Sign ──
  socket.on('sendSign', ({ text }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const now = Date.now();
    if (socket._lastSign && now - socket._lastSign < 500) return;
    socket._lastSign = now;
    if (socket.playerData) socket.playerData.lastActive = now;
    const clean = String(text || '').slice(0, 10);
    if (!clean) return;

    // Send back to the sender
    io.to(socket.id).emit('playerSign', { id: socket.id, text: clean });
    
    // Only send to players who share a passed vibe check
    for (const [otherId] of room.players) {
      if (otherId !== socket.id && room.revealedPairs.has(pairKey(socket.id, otherId))) {
        io.to(otherId).emit('playerSign', { id: socket.id, text: clean });
      }
    }
  });

  // ── Vibe Check: Request ──
  // Player A clicks "Vibe Check" on Player B
  socket.on('vibeCheckRequest', ({ targetId }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Validate target exists in room
    if (!room.players.has(targetId)) return;

    // Already revealed?
    if (room.revealedPairs.has(pairKey(socket.id, targetId))) return;

    // Rate limit — 1 request per 5s
    const now = Date.now();
    if (socket._lastVibeCheck && now - socket._lastVibeCheck < 5000) return;
    socket._lastVibeCheck = now;
    if (socket.playerData) socket.playerData.lastActive = now;

    // Send prompt to target
    io.to(targetId).emit('vibeCheckPrompt', {
      fromId: socket.id,
    });

    console.log(`   ↳ Vibe Check: [${socket.id}] → [${targetId}]`);
  });

  // ── Vibe Check: Response ──
  // Player B responds yes or no
  socket.on('vibeCheckRespond', ({ fromId, accepted }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (socket.playerData) socket.playerData.lastActive = Date.now();

    if (!accepted) {
      // Silent rejection — nothing happens
      console.log(`   ↳ Vibe Check declined: [${socket.id}] rejected [${fromId}]`);
      return;
    }

    // Check both players still in room
    const requesterData = room.players.get(fromId);
    const responderData = room.players.get(socket.id);
    if (!requesterData || !responderData) return;

    // Mark as revealed
    const key = pairKey(fromId, socket.id);
    if (room.revealedPairs.has(key)) return; // already done
    room.revealedPairs.add(key);

    // Tell both players each other's real names
    io.to(fromId).emit('vibeCheckRevealed', {
      playerId: socket.id,
      name: responderData.name,
    });
    io.to(socket.id).emit('vibeCheckRevealed', {
      playerId: fromId,
      name: requesterData.name,
    });

    console.log(`   ↳ Vibe Check accepted! "${requesterData.name}" ↔ "${responderData.name}"`);
  });

  // ── Disconnect ──
  socket.on('disconnect', () => {
    console.log(`✧ Player disconnected [${socket.id}]`);
    removePlayerFromRoom(socket);
  });
});

// ── Idle Checking ──
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

setInterval(() => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    for (const [playerId, pd] of room.players.entries()) {
      if (now - pd.lastActive > IDLE_TIMEOUT_MS) {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
          socket.emit('error', { message: 'You were idle for a while, so we let you drift back to the lobby.' });
          socket.disconnect(true);
        }
      }
    }
  }
}, 60000); // Verify AFK players every minute

// ─── Start server ───────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         ✦  FreeLobby  ✦             ║
  ║   Server running on port ${PORT}        ║
  ║   http://localhost:${PORT}              ║
  ║   Max rooms: ${MAX_ROOMS}  |  Per room: ${MAX_PLAYERS_PER_ROOM}   ║
  ╚══════════════════════════════════════╝
  `);
});
