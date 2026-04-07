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

// ─── Room State ─────────────────────────────────────────
// rooms: Map<roomId, { players, revealedPairs }>
//   players:       Map<socketId, playerData>
//   revealedPairs: Set<string>  — "idA:idB" sorted pairs who revealed names
const rooms = new Map();

// Player colors
const PLAYER_COLORS = [
  0xa78bfa, 0xf59e0b, 0x34d399, 0xf472b6, 0x38bdf8,
  0xfb923c, 0x818cf8, 0xa3e635, 0xe879f9, 0x2dd4bf,
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
  for (const [roomId, room] of rooms) {
    if (room.players.size < MAX_PLAYERS_PER_ROOM) return roomId;
  }
  return null;
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
  return { players: new Map(), revealedPairs: new Set() };
}

function joinPlayerToRoom(socket, roomId, name) {
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
  socket.on('createRoom', ({ name }) => {
    if (rooms.size >= MAX_ROOMS) {
      socket.emit('error', { message: 'Server is full. Try again later.' });
      return;
    }
    const roomId = generateRoomId();
    rooms.set(roomId, createRoom());
    const playerData = joinPlayerToRoom(socket, roomId, name);

    const room = rooms.get(roomId);
    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
    });
    console.log(`   ↳ Created room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Join Specific Room ──
  socket.on('joinRoom', ({ roomId, name }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error', { message: `Room "${roomId}" not found.` }); return; }
    if (room.players.size >= MAX_PLAYERS_PER_ROOM) { socket.emit('error', { message: 'That room is full.' }); return; }

    const playerData = joinPlayerToRoom(socket, roomId, name);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
    });
    
    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined room ${roomId} (name: "${playerData.name}", total: ${room.players.size})`);
  });

  // ── Join Random Room ──
  socket.on('joinRandomRoom', ({ name }) => {
    let roomId = findJoinableRoom();
    if (!roomId) {
      if (rooms.size >= MAX_ROOMS) { socket.emit('error', { message: 'Server is full. Try again later.' }); return; }
      roomId = generateRoomId();
      rooms.set(roomId, createRoom());
      console.log(`   ↳ No open rooms, auto-created ${roomId}`);
    }

    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
    });
    
    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined random room ${roomId} (name: "${playerData.name}", total: ${room.players.size})`);
  });

  socket.on('fleeRoom', ({ name }) => {
    removePlayerFromRoom(socket);
    const roomId = generateRoomId();
    rooms.set(roomId, createRoom());
    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
    });
    console.log(`   ↳ Fled to new room ${roomId} (name: "${playerData.name}")`);
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
    socket.to(roomId).emit('playerMoved', { id: socket.id, x: data.x, y: data.y });
  });

  // ── Emote ──
  socket.on('sendEmote', ({ emote }) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    const now = Date.now();
    if (socket._lastEmote && now - socket._lastEmote < 500) return;
    socket._lastEmote = now;
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
