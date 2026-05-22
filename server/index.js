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
const MAX_PLAYERS_PER_COMMON_ROOM = 25;
const MAX_FURNITURE        = 100;
const GRID_SIZE            = 64;
const ROOM_EMOTE_CAP_PER_SEC = 30;

// ─── Common Room Definitions ────────────────────────────
// Common rooms are server-curated, persistent, and never die when empty.
// They have larger dimensions and higher player caps.
const COMMON_ROOMS_DEF = [
  {
    id: 'LOBBY',
    name: 'The Lobby',
    description: 'A welcoming space for new arrivals',
    theme: 0,
    width: 1600,
    height: 1000,
    maxPlayers: 25,
    furniture: [
      { t: 7, x: 10, y: 6, r: 0 },   // rug center
      { t: 4, x: 11, y: 7, r: 0 },   // chair
      { t: 4, x: 14, y: 7, r: 0 },   // chair
      { t: 4, x: 11, y: 10, r: 2 },  // chair
      { t: 4, x: 14, y: 10, r: 2 },  // chair
      { t: 10, x: 12, y: 8, r: 0 },  // couch
      { t: 6, x: 9, y: 5, r: 0 },    // lamp
      { t: 6, x: 17, y: 5, r: 0 },   // lamp
      { t: 5, x: 8, y: 12, r: 0 },   // plant
      { t: 5, x: 18, y: 12, r: 0 },  // plant
      { t: 13, x: 15, y: 4, r: 0 },  // tv
      { t: 11, x: 20, y: 8, r: 0 },  // console
      { t: 15, x: 22, y: 6, r: 0 },  // cat
      { t: 16, x: 7, y: 9, r: 0 },   // dog
      { t: 0, x: 5, y: 5, r: 0 },    // cube decor
      { t: 1, x: 5, y: 13, r: 0 },   // sphere decor
      { t: 2, x: 21, y: 13, r: 0 },  // cylinder decor
      { t: 3, x: 21, y: 5, r: 0 },   // pyramid decor
    ],
  },
  {
    id: 'GARDEN',
    name: 'Zen Garden',
    description: 'A quiet corner with soft light',
    theme: 0,
    width: 1600,
    height: 1000,
    maxPlayers: 20,
    furniture: [
      { t: 7, x: 8, y: 4, r: 0 },    // rug
      { t: 7, x: 14, y: 10, r: 0 },  // rug
      { t: 4, x: 9, y: 5, r: 0 },    // chair
      { t: 4, x: 15, y: 11, r: 2 },  // chair
      { t: 5, x: 7, y: 3, r: 0 },    // plant
      { t: 5, x: 12, y: 7, r: 0 },   // plant
      { t: 5, x: 18, y: 12, r: 0 },  // plant
      { t: 5, x: 20, y: 4, r: 0 },   // plant
      { t: 6, x: 10, y: 8, r: 0 },   // lamp
      { t: 6, x: 16, y: 6, r: 0 },   // lamp
      { t: 15, x: 11, y: 9, r: 0 },  // cat
      { t: 17, x: 19, y: 8, r: 0 },  // rabbit
      { t: 18, x: 6, y: 11, r: 0 },  // fishbowl
      { t: 0, x: 5, y: 7, r: 0 },    // cube
      { t: 1, x: 21, y: 10, r: 0 },  // sphere
    ],
  },
  {
    id: 'LIBRARY',
    name: 'The Library',
    description: 'Low light, soft chairs, good for lurking',
    theme: 0,
    width: 1600,
    height: 1000,
    maxPlayers: 20,
    furniture: [
      { t: 7, x: 6, y: 5, r: 0 },    // rug
      { t: 7, x: 16, y: 5, r: 0 },   // rug
      { t: 7, x: 11, y: 11, r: 0 },  // rug
      { t: 4, x: 7, y: 6, r: 0 },    // chair
      { t: 4, x: 17, y: 6, r: 0 },   // chair
      { t: 4, x: 12, y: 12, r: 2 },  // chair
      { t: 10, x: 9, y: 5, r: 0 },   // couch
      { t: 10, x: 19, y: 5, r: 0 },  // couch
      { t: 6, x: 8, y: 4, r: 0 },    // lamp
      { t: 6, x: 18, y: 4, r: 0 },   // lamp
      { t: 6, x: 13, y: 10, r: 0 },  // lamp
      { t: 5, x: 5, y: 10, r: 0 },   // plant
      { t: 5, x: 22, y: 10, r: 0 },  // plant
      { t: 13, x: 14, y: 3, r: 0 },  // tv
      { t: 12, x: 10, y: 8, r: 0 },  // computer
      { t: 15, x: 20, y: 9, r: 0 },  // cat
      { t: 16, x: 6, y: 9, r: 0 },   // dog
    ],
  },
];

const FURNITURE_FOOTPRINTS = [
  { w: 1, h: 1, walkable: false }, // 0: Cube
  { w: 1, h: 1, walkable: false }, // 1: Sphere
  { w: 1, h: 1, walkable: false }, // 2: Cylinder
  { w: 1, h: 1, walkable: false }, // 3: Pyramid
  { w: 1, h: 1, walkable: true  }, // 4: Chair
  { w: 1, h: 1, walkable: false }, // 5: Plant
  { w: 1, h: 1, walkable: false }, // 6: Lamp
  { w: 2, h: 2, walkable: true  }, // 7: Rug
  { w: 2, h: 2, walkable: true  }, // 8: Bed
  { w: 2, h: 1, walkable: false }, // 9: Bathtub
  { w: 2, h: 1, walkable: true  }, // 10: Couch
  { w: 1, h: 1, walkable: false }, // 11: Console
  { w: 1, h: 1, walkable: false }, // 12: Computer
  { w: 2, h: 1, walkable: false }, // 13: TV
  { w: 1, h: 1, walkable: false }, // 14: Toilet
  { w: 1, h: 1, walkable: true  }, // 15: Cat
  { w: 1, h: 1, walkable: true  }, // 16: Dog
  { w: 1, h: 1, walkable: true  }, // 17: Rabbit
  { w: 1, h: 1, walkable: false }, // 18: Fishbowl
  { w: 1, h: 1, walkable: true  }, // 19: Bird
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
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return rooms.has(id) ? generateRoomId() : id;
}

function getNextColor(room) {
  return PLAYER_COLORS[room.players.size % PLAYER_COLORS.length];
}

function findJoinableRoom() {
  const available = [];
  for (const [roomId, room] of rooms) {
    const max = room.maxPlayers || MAX_PLAYERS_PER_ROOM;
    if (room.isPublic !== false && room.players.size < max) available.push(roomId);
  }

  if (available.length === 0) return null;

  // Distribute the player randomly across any of the available active public rooms
  return available[Math.floor(Math.random() * available.length)];
}

function getCommonRoomsList() {
  return COMMON_ROOMS_DEF.map(def => {
    const room = rooms.get(def.id);
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      playerCount: room ? room.players.size : 0,
      maxPlayers: def.maxPlayers || MAX_PLAYERS_PER_COMMON_ROOM,
    };
  });
}

function getPublicRoomsList() {
  const list = [];
  for (const [roomId, room] of rooms) {
    if (room.isCommon) continue;
    if (!room.isPublic) continue;
    if (room.players.size === 0) continue;
    list.push({
      id: roomId,
      playerCount: room.players.size,
      maxPlayers: room.maxPlayers || MAX_PLAYERS_PER_ROOM,
    });
  }
  return list;
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
  socket.leave(roomId);
  console.log(`   ↳ Removed from room ${roomId} (${room.players.size} left)`);

  // Common rooms never die
  if (room.isCommon) return;

  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`   ↳ Room ${roomId} deleted (empty)`);
  }
}

function createRoom() {
  return { players: new Map(), revealedPairs: new Set(), occupiedCells: new Set(), blockedCells: new Set(), theme: 0, emoteWindow: { startMs: 0, count: 0 }, width: 1200, height: 800 };
}

function initCommonRooms() {
  for (const def of COMMON_ROOMS_DEF) {
    const room = {
      players: new Map(),
      revealedPairs: new Set(),
      ownerId: null,
      isPublic: true,
      isCommon: true,
      furniture: [],
      occupiedCells: new Set(),
      blockedCells: new Set(),
      theme: def.theme || 0,
      emoteWindow: { startMs: 0, count: 0 },
      nextFurnitureId: 1,
      interactiveStates: new Map(),
      ambientTrack: 0,
      width: def.width || 1600,
      height: def.height || 1000,
      maxPlayers: def.maxPlayers || MAX_PLAYERS_PER_COMMON_ROOM,
      commonName: def.name,
      commonDescription: def.description,
    };

    // Pre-place furniture
    for (const item of def.furniture) {
      const fp = getFootprint(item.t, item.r);
      const cells = getCells(item);
      for (const cell of cells) {
        room.occupiedCells.add(cell);
        if (!fp.walkable) room.blockedCells.add(cell);
      }
      item.id = room.nextFurnitureId++;
      room.furniture.push(item);
    }

    rooms.set(def.id, room);
    console.log(`   ↳ Common room created: ${def.name} (${def.id}) ${def.width}x${def.height}`);
  }
}

function sanitizeName(raw) {
  if (typeof raw !== 'string') return 'Anon';
  // Strip control characters and zero-width characters, then clip to 24.
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .trim()
    .slice(0, 24);
  return cleaned.length > 0 ? cleaned : 'Anon';
}

function joinPlayerToRoom(socket, roomId, name, customization) {
  const room = rooms.get(roomId);
  const color = getNextColor(room);
  const safeName = sanitizeName(name);

  // Assign a unique stranger name
  const existingAliases = new Set(Array.from(room.players.values()).map(p => p.strangerName));
  let strangerName = 'Stranger X';
  for (let i = 1; i <= 1000; i++) {
     if (!existingAliases.has(`Stranger ${i}`)) {
        strangerName = `Stranger ${i}`;
        break;
     }
  }

  const spawnX = (room.width || 1200) / 2;
  const spawnY = (room.height || 800) / 2;

  const playerData = {
    id: socket.id,
    name: safeName,
    strangerName,
    x: spawnX,
    y: spawnY,
    color,
    lastActive: Date.now(),
    customization: customization || { colorIdx: 0, shape: 0, accessory: 0, pulse: 1 },
    quietMode: false,
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
  socket.on('createRoom', ({ name, customization }) => {
    if (rooms.size >= MAX_ROOMS) {
      socket.emit('error', { message: 'Server is full. Try again later.' });
      return;
    }
    const roomId = generateRoomId();
    // Create Room always creates a PRIVATE room with the creator as owner
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: socket.id, isPublic: false, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: 0, emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const room = rooms.get(roomId);
    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    const interactiveStatesObj = {};
    for (const [k, v] of room.interactiveStates) interactiveStatesObj[k] = v;
    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: true,
      isPublic: false,
      isCommon: false,
      furniture: room.furniture,
      theme: room.theme,
      interactiveStates: interactiveStatesObj,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
    });
    console.log(`   ↳ Created private room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Join Specific Room ──
  socket.on('joinRoom', ({ roomId, name, customization }) => {
    const room = rooms.get(roomId);
    if (!room) { socket.emit('error', { message: `Room "${roomId}" not found.` }); return; }
    const maxPlayers = room.maxPlayers || MAX_PLAYERS_PER_ROOM;
    if (room.players.size >= maxPlayers) { socket.emit('error', { message: 'That room is full.' }); return; }

    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    const interactiveStatesObj2 = {};
    for (const [k, v] of room.interactiveStates) interactiveStatesObj2[k] = v;
    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: room.ownerId === socket.id,
      isPublic: room.isPublic !== false,
      isCommon: !!room.isCommon,
      commonName: room.commonName || null,
      furniture: room.furniture,
      theme: room.theme,
      interactiveStates: interactiveStatesObj2,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
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
      // Auto-created random rooms have NO owner and are PUBLIC
      rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: null, isPublic: true, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: 0, emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
      console.log(`   ↳ No open rooms, auto-created random ${roomId}`);
    }

    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    const interactiveStatesObj3 = {};
    for (const [k, v] of room.interactiveStates) interactiveStatesObj3[k] = v;
    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: room.ownerId === socket.id,
      isPublic: room.isPublic !== false,
      isCommon: !!room.isCommon,
      commonName: room.commonName || null,
      furniture: room.furniture,
      theme: room.theme,
      interactiveStates: interactiveStatesObj3,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
    });
    
    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined random room ${roomId} (name: "${playerData.name}", total: ${room.players.size})`);
  });

  socket.on('leaveRoom', () => {
    removePlayerFromRoom(socket);
    socket.roomId = null;
  });

  socket.on('fleeRoom', ({ name, customization }) => {
    removePlayerFromRoom(socket);
    const roomId = generateRoomId();
    // Flee always creates a PRIVATE room owned by the fleer
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), ownerId: socket.id, isPublic: false, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: 0, emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
    const room = rooms.get(roomId);
    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    const interactiveStatesObj4 = {};
    for (const [k, v] of room.interactiveStates) interactiveStatesObj4[k] = v;
    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: true,
      isPublic: false,
      isCommon: false,
      furniture: room.furniture,
      theme: room.theme,
      interactiveStates: interactiveStatesObj4,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
    });
    console.log(`   ↳ Fled to private room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Get Common Rooms ──
  socket.on('getCommonRooms', () => {
    socket.emit('commonRoomsList', getCommonRoomsList());
  });

  // ── Get Public Rooms ──
  socket.on('getPublicRooms', () => {
    socket.emit('publicRoomsList', getPublicRoomsList());
  });

  // ── Join Common Room ──
  socket.on('joinCommonRoom', ({ roomId, name, customization }) => {
    const room = rooms.get(roomId);
    if (!room || !room.isCommon) { socket.emit('error', { message: 'Common room not found.' }); return; }
    const maxPlayers = room.maxPlayers || MAX_PLAYERS_PER_COMMON_ROOM;
    if (room.players.size >= maxPlayers) { socket.emit('error', { message: 'That room is full.' }); return; }

    const playerData = joinPlayerToRoom(socket, roomId, name, customization);

    const sanitizedPlayers = {};
    for (const [id, pd] of room.players.entries()) {
      sanitizedPlayers[id] = id === socket.id ? pd : { ...pd, name: pd.strangerName };
    }

    const interactiveStatesObjC = {};
    for (const [k, v] of room.interactiveStates) interactiveStatesObjC[k] = v;
    socket.emit('roomJoined', {
      roomId, you: playerData,
      players: sanitizedPlayers,
      isOwner: false,
      isPublic: true,
      isCommon: true,
      commonName: room.commonName || null,
      furniture: room.furniture,
      theme: room.theme,
      interactiveStates: interactiveStatesObjC,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1600,
      height: room.height || 1000,
    });

    const scrubbedPlayerData = { ...playerData, name: playerData.strangerName };
    socket.to(roomId).emit('playerJoined', scrubbedPlayerData);
    console.log(`   ↳ Joined common room ${roomId} (${room.commonName}) (name: "${playerData.name}", total: ${room.players.size})`);
  });

  // ── Furniture Placement ──
  socket.on('placeFurniture', ({ item }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    // Build mode only works in private rooms with an owner
    if (room.isPublic || room.ownerId !== socket.id) return;
    if (!item || typeof item.t !== 'number') return;
    if (room.furniture.length >= MAX_FURNITURE) {
      socket.emit('buildError', { message: `Room furniture limit reached (${MAX_FURNITURE}).` });
      return;
    }
    const maxX = Math.floor(1200 / GRID_SIZE);
    const maxY = Math.floor(800 / GRID_SIZE);
    if (item.r < 0 || item.r > 3) item.r = 0;
    if (item.t < 0 || item.t >= FURNITURE_FOOTPRINTS.length) return;

    const fp = getFootprint(item.t, item.r);
    if (item.x < 0 || item.x + fp.w > maxX || item.y < 0 || item.y + fp.h > maxY) {
      socket.emit('buildError', { message: 'Furniture out of bounds.' });
      return;
    }

    const cells = getCells(item);
    for (const cell of cells) {
      if (room.occupiedCells.has(cell)) {
        socket.emit('buildError', { message: 'Space is already occupied.' });
        return;
      }
    }

    for (const cell of cells) {
      room.occupiedCells.add(cell);
      if (!fp.walkable) room.blockedCells.add(cell);
    }

    item.id = room.nextFurnitureId++;
    room.furniture.push(item);
    io.in(roomId).emit('furniturePlaced', { item });
  });

  socket.on('removeFurniture', ({ index }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    // Build mode only works in private rooms with an owner
    if (room.isPublic || room.ownerId !== socket.id) return;
    if (index >= 0 && index < room.furniture.length) {
      const item = room.furniture[index];
      const cells = getCells(item);
      for (const cell of cells) {
        room.occupiedCells.delete(cell);
        room.blockedCells.delete(cell);
      }
      if (item.id != null) room.interactiveStates.delete(item.id);
      room.furniture.splice(index, 1);
      io.in(roomId).emit('furnitureRemoved', { index });
    }
  });

  // ── Toggle Interactive Furniture ──
  const INTERACTIVE_TYPES = new Set([6, 13]); // Lamp, TV
  socket.on('toggleFurniture', ({ id }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const item = room.furniture.find(f => f.id === id);
    if (!item || !INTERACTIVE_TYPES.has(item.t)) return;
    const current = room.interactiveStates.get(id);
    const next = !current;
    room.interactiveStates.set(id, next);
    io.in(roomId).emit('furnitureToggled', { id, state: next });
    console.log(`   ↳ Furniture toggled: id=${id} type=${item.t} state=${next}`);
  });

  // ── Helper: validate & compute occupancy for a furniture array ──
  function validateFurnitureArray(furniture) {
    if (!Array.isArray(furniture)) return { ok: false, error: 'Invalid furniture format.' };
    if (furniture.length > MAX_FURNITURE) return { ok: false, error: `Too many items (max ${MAX_FURNITURE}).` };

    const maxX = Math.floor(1200 / GRID_SIZE);
    const maxY = Math.floor(800 / GRID_SIZE);
    const newOccupied = new Set();
    const newBlocked = new Set();

    for (const item of furniture) {
      if (!item || typeof item.t !== 'number') return { ok: false, error: 'Invalid furniture item.' };
      if (item.t < 0 || item.t >= FURNITURE_FOOTPRINTS.length) return { ok: false, error: 'Unknown furniture type.' };
      if (item.r < 0 || item.r > 3) item.r = 0;

      const fp = getFootprint(item.t, item.r);
      if (item.x < 0 || item.x + fp.w > maxX || item.y < 0 || item.y + fp.h > maxY) {
        return { ok: false, error: 'Furniture out of bounds.' };
      }

      const cells = getCells(item);
      for (const cell of cells) {
        if (newOccupied.has(cell)) return { ok: false, error: 'Overlapping furniture.' };
        newOccupied.add(cell);
        if (!fp.walkable) newBlocked.add(cell);
      }
    }
    return { ok: true, occupied: newOccupied, blocked: newBlocked };
  }

  // ── Import Room Hash (Legacy Base64 JSON) ──
  socket.on('importRoomHash', ({ hash }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;

    let furniture;
    try {
      const json = Buffer.from(hash, 'base64').toString('utf-8');
      furniture = JSON.parse(json);
    } catch {
      socket.emit('buildError', { message: 'Invalid room hash.' });
      return;
    }

    const result = validateFurnitureArray(furniture);
    if (!result.ok) { socket.emit('buildError', { message: result.error }); return; }

    // Reassign IDs on import
    room.nextFurnitureId = 1;
    room.interactiveStates = new Map();
    for (const item of furniture) item.id = room.nextFurnitureId++;
    room.furniture = furniture;
    room.occupiedCells = result.occupied;
    room.blockedCells = result.blocked;
    io.in(roomId).emit('roomFurnitureReset', { furniture, theme: room.theme });
  });

  // ── Set Room Furniture (raw array from decoded memory card) ──
  socket.on('setRoomFurniture', ({ furniture, theme }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;

    const result = validateFurnitureArray(furniture);
    if (!result.ok) { socket.emit('buildError', { message: result.error }); return; }

    if (typeof theme === 'number' && theme >= 0) room.theme = theme;

    // Reassign IDs on load
    room.nextFurnitureId = 1;
    room.interactiveStates = new Map();
    for (const item of furniture) item.id = room.nextFurnitureId++;
    room.furniture = furniture;
    room.occupiedCells = result.occupied;
    room.blockedCells = result.blocked;
    io.in(roomId).emit('roomFurnitureReset', { furniture, theme: room.theme });
  });

  // ── Set Room Theme ──
  socket.on('setRoomTheme', ({ theme }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (typeof theme === 'number' && theme >= 0) {
      room.theme = theme;
      io.in(roomId).emit('roomThemeChanged', { theme: room.theme });
    }
  });

  // ── Ambient Audio Track ──
  socket.on('setAmbientTrack', ({ track }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (typeof track !== 'number' || track < 0 || track > 2) return;
    room.ambientTrack = track;
    io.in(roomId).emit('ambientTrackChanged', { track });
    console.log(`   ↳ Ambient track set to ${track} in room ${roomId}`);
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
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const now = Date.now();
    // Per-user rate limit (500ms)
    if (socket._lastEmote && now - socket._lastEmote < 500) return;
    socket._lastEmote = now;
    // Per-room aggregate cap (30/sec sliding window) — silent drop
    if (now - room.emoteWindow.startMs > 1000) {
      room.emoteWindow.startMs = now;
      room.emoteWindow.count = 0;
    }
    if (room.emoteWindow.count >= ROOM_EMOTE_CAP_PER_SEC) return;
    room.emoteWindow.count += 1;
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

  // ── Quiet Mode ──
  socket.on('quietMode', ({ enabled }) => {
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (socket.playerData) {
      socket.playerData.quietMode = !!enabled;
      socket.playerData.lastActive = Date.now();
    }
    socket.to(roomId).emit('playerQuietMode', { id: socket.id, enabled: !!enabled });
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

    // Auto-decline if target is in quiet mode
    const targetData = room.players.get(targetId);
    if (targetData && targetData.quietMode) {
      console.log(`   ↳ Vibe Check auto-declined: [${targetId}] is in quiet mode`);
      return;
    }

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

// ─── Initialize Common Rooms ────────────────────────────
initCommonRooms();

// ─── Start server ───────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         ✦  FreeLobby  ✦             ║
  ║   Server running on port ${PORT}        ║
  ║   http://localhost:${PORT}              ║
  ║   Max rooms: ${MAX_ROOMS}  |  Private: ${MAX_PLAYERS_PER_ROOM}  |  Common: ${MAX_PLAYERS_PER_COMMON_ROOM}   ║
  ╚══════════════════════════════════════╝
  `);
});
