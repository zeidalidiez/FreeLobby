const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const furnitureCatalog = require('../public/js/furniture-catalog');
const roomStyles = require('../public/js/room-style');
const {
  asEventObject,
  canCreateRoomAfterLeaving,
  clearRevealedPairsForPlayer,
  createPendingVibeChecks,
  createRateLimiter,
  findJoinableRoom,
  isAllowedEmote,
  normalizeCustomization,
  normalizeFurnitureItem,
  normalizePlayerMove,
  sanitizeSignText,
  shouldLeaveRoomBeforeJoin,
} = require('./room-state');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 32 * 1024,
  perMessageDeflate: false,
});

const PORT = process.env.PORT || 3000;

// ─── Server Limits ──────────────────────────────────────
const MAX_ROOMS            = 50;
const MAX_PLAYERS_PER_ROOM = 10;
const MAX_PLAYERS_PER_COMMON_ROOM = 25;
const MAX_FURNITURE        = 100;
const GRID_SIZE            = 64;
const ROOM_EMOTE_CAP_PER_SEC = 30;
const DEFAULT_PRIVATE_ROOM_THEME = 0;
const ROOM_THEME_COUNT = 4;
const MAX_LEGACY_HASH_BYTES = 64 * 1024;

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
    theme: 1,
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
    theme: 3,
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

const FURNITURE_FOOTPRINTS = furnitureCatalog.ITEMS.map(
  definition => ({ w: definition.w, h: definition.h, walkable: definition.walkable }),
);

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
  0x2db8b2, 0xd85a9a, 0x74b84d, 0xd94d77, 0xdfba3e,
  0xdc773c, 0x9d62c4, 0x4c7dcc, 0xd65b52, 0x34ae88,
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

  clearRevealedPairsForPlayer(room.revealedPairs, socket.id);
  if (room.pendingVibeChecks) room.pendingVibeChecks.clearForPlayer(socket.id);

  socket.to(roomId).emit('playerLeft', { id: socket.id });
  socket.leave(roomId);
  socket.roomId = null;
  socket.playerData = null;
  console.log(`   ↳ Removed from room ${roomId} (${room.players.size} left)`);

  // Common rooms never die
  if (room.isCommon) return;

  if (room.players.size === 0) {
    rooms.delete(roomId);
    console.log(`   ↳ Room ${roomId} deleted (empty)`);
  }
}

function createRoom() {
  return { players: new Map(), revealedPairs: new Set(), pendingVibeChecks: createPendingVibeChecks(), occupiedCells: new Set(), blockedCells: new Set(), theme: 0, style: roomStyles.styleFromPreset(0), emoteWindow: { startMs: 0, count: 0 }, width: 1200, height: 800 };
}

function initCommonRooms() {
  for (const def of COMMON_ROOMS_DEF) {
    const room = {
      players: new Map(),
      revealedPairs: new Set(),
      pendingVibeChecks: createPendingVibeChecks(),
      ownerId: null,
      isPublic: true,
      isCommon: true,
      furniture: [],
      occupiedCells: new Set(),
      blockedCells: new Set(),
      theme: def.theme || 0,
      style: roomStyles.styleFromPreset(def.theme || 0),
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
    .trim();
  const clipped = Array.from(cleaned).slice(0, 24).join('');
  return clipped.length > 0 ? clipped : 'Anon';
}

function joinPlayerToRoom(socket, roomId, name, customization) {
  if (shouldLeaveRoomBeforeJoin(socket.roomId, roomId)) removePlayerFromRoom(socket);

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
    customization: normalizeCustomization(customization),
    quietMode: false,
  };

  room.players.set(socket.id, playerData);
  socket.join(roomId);
  socket.roomId = roomId;
  socket.playerData = playerData;

  return playerData;
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws: wss:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; '));
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

const vendorFiles = {
  '/vendor/lucide.min.js': require.resolve('lucide/dist/umd/lucide.min.js'),
  '/vendor/phaser.min.js': require.resolve('phaser/dist/phaser.min.js'),
  '/vendor/socket.io.min.js': path.resolve(
    path.dirname(require.resolve('socket.io-client')),
    '..', '..', 'dist', 'socket.io.min.js',
  ),
};
for (const [route, file] of Object.entries(vendorFiles)) {
  app.get(route, (_req, res) => res.sendFile(file, { maxAge: '1d', immutable: true }));
}

// Serve static frontend files. HTML stays fresh; fingerprint-free assets get a short cache.
app.use(express.static(path.join(__dirname, '..', 'public'), {
  etag: true,
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ─── Socket.IO ──────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`✦ Player connected   [${socket.id}]`);
  const allowEvent = createRateLimiter();
  const objectPayloadEvents = new Set([
    'createRoom', 'joinRoom', 'joinRandomRoom', 'fleeRoom', 'joinCommonRoom',
    'placeFurniture', 'removeFurniture', 'toggleFurniture', 'importRoomHash',
    'setRoomFurniture', 'setRoomTheme', 'setAmbientTrack', 'playerMove',
    'sendEmote', 'sendSign', 'quietMode', 'vibeCheckRequest', 'vibeCheckRespond',
  ]);

  socket.use(([eventName, payload], next) => {
    if (objectPayloadEvents.has(eventName) && asEventObject(payload) !== payload) {
      socket.emit('inputError', { message: 'That request could not be understood.' });
      return;
    }
    next();
  });

  function withinRateLimit(key, limit, windowMs) {
    return allowEvent(key, limit, windowMs);
  }

  // ── Create Room ──
  socket.on('createRoom', (payload) => {
    if (!withinRateLimit('room-change', 5, 10000)) return;
    const { name, customization } = asEventObject(payload);
    if (!canCreateRoomAfterLeaving(rooms, socket, MAX_ROOMS)) {
      socket.emit('error', { message: 'Server is full. Try again later.' });
      return;
    }
    removePlayerFromRoom(socket);
    const roomId = generateRoomId();
    // Create Room always creates a PRIVATE room with the creator as owner
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), pendingVibeChecks: createPendingVibeChecks(), ownerId: socket.id, isPublic: false, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: DEFAULT_PRIVATE_ROOM_THEME, style: roomStyles.styleFromPreset(DEFAULT_PRIVATE_ROOM_THEME), emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
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
      style: room.style || roomStyles.styleFromPreset(room.theme),
      interactiveStates: interactiveStatesObj,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
    });
    console.log(`   ↳ Created private room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Join Specific Room ──
  socket.on('joinRoom', (payload) => {
    if (!withinRateLimit('room-change', 5, 10000)) return;
    const { roomId: rawRoomId, name, customization } = asEventObject(payload);
    const roomId = typeof rawRoomId === 'string' ? rawRoomId.toUpperCase() : '';
    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      socket.emit('error', { message: 'Room code must be 6 letters or numbers.' });
      return;
    }
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
      style: room.style || roomStyles.styleFromPreset(room.theme),
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
  socket.on('joinRandomRoom', (payload) => {
    if (!withinRateLimit('room-change', 5, 10000)) return;
    const { name, customization } = asEventObject(payload);
    let roomId = findJoinableRoom(rooms, { maxPlayersPerRoom: MAX_PLAYERS_PER_ROOM });
    if (!roomId) {
      if (rooms.size >= MAX_ROOMS) { socket.emit('error', { message: 'Server is full. Try again later.' }); return; }
      roomId = generateRoomId();
      // Auto-created random rooms have NO owner and are PUBLIC
      rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), pendingVibeChecks: createPendingVibeChecks(), ownerId: null, isPublic: true, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: 0, style: roomStyles.styleFromPreset(0), emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
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
      style: room.style || roomStyles.styleFromPreset(room.theme),
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

  socket.on('fleeRoom', (payload) => {
    if (!withinRateLimit('room-change', 5, 10000)) return;
    const { name, customization } = asEventObject(payload);
    if (!canCreateRoomAfterLeaving(rooms, socket, MAX_ROOMS)) {
      socket.emit('error', { message: 'Server is full. Try again later.' });
      return;
    }
    removePlayerFromRoom(socket);
    const roomId = generateRoomId();
    // Flee always creates a PRIVATE room owned by the fleer
    rooms.set(roomId, { players: new Map(), revealedPairs: new Set(), pendingVibeChecks: createPendingVibeChecks(), ownerId: socket.id, isPublic: false, furniture: [], occupiedCells: new Set(), blockedCells: new Set(), theme: DEFAULT_PRIVATE_ROOM_THEME, style: roomStyles.styleFromPreset(DEFAULT_PRIVATE_ROOM_THEME), emoteWindow: { startMs: 0, count: 0 }, nextFurnitureId: 1, interactiveStates: new Map(), ambientTrack: 0 });
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
      style: room.style || roomStyles.styleFromPreset(room.theme),
      interactiveStates: interactiveStatesObj4,
      ambientTrack: room.ambientTrack || 0,
      width: room.width || 1200,
      height: room.height || 800,
    });
    console.log(`   ↳ Fled to private room ${roomId} (name: "${playerData.name}")`);
  });

  // ── Get Common Rooms ──
  socket.on('getCommonRooms', () => {
    if (!withinRateLimit('room-lists', 10, 5000)) return;
    socket.emit('commonRoomsList', getCommonRoomsList());
  });

  // ── Get Public Rooms ──
  socket.on('getPublicRooms', () => {
    if (!withinRateLimit('room-lists', 10, 5000)) return;
    socket.emit('publicRoomsList', getPublicRoomsList());
  });

  // ── Join Common Room ──
  socket.on('joinCommonRoom', (payload) => {
    if (!withinRateLimit('room-change', 5, 10000)) return;
    const { roomId, name, customization } = asEventObject(payload);
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
      style: room.style || roomStyles.styleFromPreset(room.theme),
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
  socket.on('placeFurniture', (payload) => {
    if (!withinRateLimit('furniture-edit', 60, 5000)) return;
    const rawItem = asEventObject(payload).item;
    const item = normalizeFurnitureItem(rawItem, { typeCount: FURNITURE_FOOTPRINTS.length });
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    // Build mode only works in private rooms with an owner
    if (room.isPublic || room.ownerId !== socket.id) return;
    if (!item) {
      socket.emit('buildError', { message: 'Invalid furniture item.' });
      return;
    }
    if (room.furniture.length >= MAX_FURNITURE) {
      socket.emit('buildError', { message: `Room furniture limit reached (${MAX_FURNITURE}).` });
      return;
    }
    const maxX = Math.floor(1200 / GRID_SIZE);
    const maxY = Math.floor(800 / GRID_SIZE);
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

  socket.on('removeFurniture', (payload) => {
    if (!withinRateLimit('furniture-edit', 60, 5000)) return;
    const { index } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    // Build mode only works in private rooms with an owner
    if (room.isPublic || room.ownerId !== socket.id) return;
    if (Number.isInteger(index) && index >= 0 && index < room.furniture.length) {
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
  const INTERACTIVE_TYPES = new Set(
    furnitureCatalog.ITEMS
      .map((definition, type) => definition.interactive ? type : -1)
      .filter(type => type >= 0),
  );
  socket.on('toggleFurniture', (payload) => {
    if (!withinRateLimit('furniture-toggle', 20, 5000)) return;
    const { id } = asEventObject(payload);
    if (!Number.isInteger(id)) return;
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
    const normalizedFurniture = [];
    const interactiveFlags = [];

    for (const rawItem of furniture) {
      const item = normalizeFurnitureItem(rawItem, { typeCount: FURNITURE_FOOTPRINTS.length });
      if (!item) return { ok: false, error: 'Invalid furniture item.' };

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
      interactiveFlags.push(item.on === true && INTERACTIVE_TYPES.has(item.t));
      delete item.on;
      normalizedFurniture.push(item);
    }
    return { ok: true, furniture: normalizedFurniture, interactiveFlags, occupied: newOccupied, blocked: newBlocked };
  }

  function resetRoomFurniture(room, result) {
    room.nextFurnitureId = 1;
    room.interactiveStates = new Map();
    for (let index = 0; index < result.furniture.length; index++) {
      const item = result.furniture[index];
      item.id = room.nextFurnitureId++;
      if (result.interactiveFlags[index]) room.interactiveStates.set(item.id, true);
    }
    room.furniture = result.furniture;
    room.occupiedCells = result.occupied;
    room.blockedCells = result.blocked;
  }

  function interactiveStatesObject(room) {
    return Object.fromEntries(room.interactiveStates.entries());
  }

  // ── Import Room Hash (Legacy Base64 JSON) ──
  socket.on('importRoomHash', (payload) => {
    if (!withinRateLimit('furniture-import', 3, 10000)) return;
    const { hash } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;

    if (typeof hash !== 'string' || hash.length > MAX_LEGACY_HASH_BYTES) {
      socket.emit('buildError', { message: 'Invalid room hash.' });
      return;
    }

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

    resetRoomFurniture(room, result);
    io.in(roomId).emit('roomFurnitureReset', {
      furniture: room.furniture,
      theme: room.theme,
      style: room.style || roomStyles.styleFromPreset(room.theme),
      interactiveStates: interactiveStatesObject(room),
    });
  });

  // ── Set Room Furniture (raw array from decoded memory card) ──
  socket.on('setRoomFurniture', (payload) => {
    if (!withinRateLimit('furniture-import', 3, 10000)) return;
    const { furniture, theme, style } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;

    const result = validateFurnitureArray(furniture);
    if (!result.ok) { socket.emit('buildError', { message: result.error }); return; }

    if (theme !== undefined && (!Number.isInteger(theme) || theme < 0 || theme >= ROOM_THEME_COUNT)) {
      socket.emit('buildError', { message: 'Unknown room theme.' });
      return;
    }
    if (style !== undefined) {
      const styleErrors = roomStyles.validateStyle(style);
      if (styleErrors.length > 0) {
        socket.emit('buildError', { message: styleErrors[0] });
        return;
      }
      room.style = roomStyles.normalizeStyle(style);
      room.theme = room.style.preset;
    } else if (theme !== undefined) {
      room.theme = theme;
      room.style = roomStyles.styleFromPreset(theme);
    }

    resetRoomFurniture(room, result);
    io.in(roomId).emit('roomFurnitureReset', {
      furniture: room.furniture,
      theme: room.theme,
      style: room.style || roomStyles.styleFromPreset(room.theme),
      interactiveStates: interactiveStatesObject(room),
    });
  });

  // ── Set Room Theme ──
  socket.on('setRoomTheme', (payload) => {
    const { theme } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (Number.isInteger(theme) && theme >= 0 && theme < ROOM_THEME_COUNT) {
      room.theme = theme;
      room.style = roomStyles.styleFromPreset(theme);
      io.in(roomId).emit('roomStyleChanged', { theme: room.theme, style: room.style });
    }
  });

  socket.on('setRoomStyle', (payload) => {
    if (!withinRateLimit('room-style', 20, 5000)) return;
    const { style } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id || room.isPublic) return;
    const errors = roomStyles.validateStyle(style);
    if (errors.length > 0) {
      socket.emit('buildError', { message: errors[0] });
      return;
    }
    room.style = roomStyles.normalizeStyle(style);
    room.theme = room.style.preset;
    io.in(roomId).emit('roomStyleChanged', { theme: room.theme, style: room.style });
  });

  // ── Ambient Audio Track ──
  socket.on('setAmbientTrack', (payload) => {
    const { track } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (room.ownerId !== socket.id) return;
    if (!Number.isInteger(track) || track < 0 || track > 2) return;
    room.ambientTrack = track;
    io.in(roomId).emit('ambientTrackChanged', { track });
    console.log(`   ↳ Ambient track set to ${track} in room ${roomId}`);
  });

  // ── Player Movement ──
  socket.on('playerMove', (data) => {
    if (!withinRateLimit('player-move', 30, 1000)) return;
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const pd = room.players.get(socket.id);
    if (!pd) return;
    const position = normalizePlayerMove(data, room, { gridSize: GRID_SIZE });
    if (!position) return;
    pd.x = position.x;
    pd.y = position.y;
    pd.lastActive = Date.now();
    socket.to(roomId).emit('playerMoved', { id: socket.id, x: position.x, y: position.y });
  });

  // ── Emote ──
  socket.on('sendEmote', (payload) => {
    const { emote } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    if (!isAllowedEmote(emote)) return;
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
  socket.on('sendSign', (payload) => {
    const { text } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    const clean = sanitizeSignText(text);
    if (!clean) return;
    const now = Date.now();
    if (socket._lastSign && now - socket._lastSign < 500) return;
    socket._lastSign = now;
    if (socket.playerData) socket.playerData.lastActive = now;

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
  socket.on('quietMode', (payload) => {
    const { enabled } = asEventObject(payload);
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
  socket.on('vibeCheckRequest', (payload) => {
    const { targetId } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Validate target exists in room
    if (typeof targetId !== 'string' || targetId === socket.id || !room.players.has(targetId)) return;

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

    room.pendingVibeChecks.add(socket.id, targetId);

    // Send prompt to target
    io.to(targetId).emit('vibeCheckPrompt', {
      fromId: socket.id,
    });

    console.log(`   ↳ Vibe Check: [${socket.id}] → [${targetId}]`);
  });

  // ── Vibe Check: Response ──
  // Player B responds yes or no
  socket.on('vibeCheckRespond', (payload) => {
    const { fromId, accepted } = asEventObject(payload);
    const roomId = socket.roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);
    if (socket.playerData) socket.playerData.lastActive = Date.now();

    if (typeof fromId !== 'string' || typeof accepted !== 'boolean') return;
    if (!room.pendingVibeChecks.consume(fromId, socket.id)) return;

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

function evictIdlePlayers(now = Date.now()) {
  for (const [roomId, room] of rooms.entries()) {
    for (const [playerId, pd] of room.players.entries()) {
      if (now - pd.lastActive > IDLE_TIMEOUT_MS) {
        const socket = io.sockets.sockets.get(playerId);
        if (socket) {
          removePlayerFromRoom(socket);
          socket.emit('idleTimeout', { message: 'You were idle for a while, so we let you drift back to the lobby.' });
        }
      }
    }
  }
}

const idleCheckInterval = setInterval(evictIdlePlayers, 60000); // Verify AFK players every minute
idleCheckInterval.unref();

// ─── Initialize Common Rooms ────────────────────────────
initCommonRooms();

// ─── Start server ───────────────────────────────────────
function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => {
      server.removeListener('error', reject);
      const address = server.address();
      const actualPort = typeof address === 'object' && address ? address.port : port;
      console.log(`✦ FreeLobby listening on http://localhost:${actualPort}`);
      console.log(`  Max rooms: ${MAX_ROOMS} | Private cap: ${MAX_PLAYERS_PER_ROOM} | Common cap: ${MAX_PLAYERS_PER_COMMON_ROOM}`);
      resolve(actualPort);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start FreeLobby:', error);
    process.exitCode = 1;
  });
}

module.exports = { app, evictIdlePlayers, io, rooms, server, startServer };
