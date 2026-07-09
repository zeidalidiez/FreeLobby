const DEFAULT_MAX_PLAYERS_PER_ROOM = 10;
const DEFAULT_ROOM_WIDTH = 1200;
const DEFAULT_ROOM_HEIGHT = 800;
const DEFAULT_PLAYER_MARGIN = 24;
const DEFAULT_GRID_SIZE = 64;
const DEFAULT_CUSTOMIZATION = Object.freeze({ colorIdx: 0, shape: 0, accessory: 0, pulse: 1 });

const APPROVED_EMOTES = new Set([
  '😊', '👋', '☕', '😴', '❤️', '😂', '🎵', '✨', '🤔', '👍',
  '🌙', '🔥', '🎮', '📖', '🐱', '🌿', '🎧', '💤', '🫂', '🍵',
  '🌸', '😌', '🎨', '🧸', '🍃', '💫', '🎶', '🌈', '🕯️', '🤗',
]);

function findJoinableRoom(rooms, options = {}) {
  const maxPlayersPerRoom = options.maxPlayersPerRoom || DEFAULT_MAX_PLAYERS_PER_ROOM;
  const rng = options.rng || Math.random;
  const available = [];

  for (const [roomId, room] of rooms) {
    if (!room) continue;
    if (room.isCommon) continue;
    if (room.isPublic === false) continue;

    const max = room.maxPlayers || maxPlayersPerRoom;
    if (room.players && room.players.size < max) available.push(roomId);
  }

  if (available.length === 0) return null;

  const index = Math.min(Math.floor(rng() * available.length), available.length - 1);
  return available[index];
}

function asEventObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return {};
  return value;
}

function normalizeCustomization(value) {
  const customization = asEventObject(value);
  const ranges = {
    colorIdx: [0, 9],
    shape: [0, 2],
    accessory: [0, 3],
    pulse: [0, 2],
  };
  const normalized = {};

  for (const [key, [min, max]] of Object.entries(ranges)) {
    const candidate = customization[key];
    normalized[key] = Number.isInteger(candidate) && candidate >= min && candidate <= max
      ? candidate
      : DEFAULT_CUSTOMIZATION[key];
  }

  return normalized;
}

function normalizeFurnitureItem(value, options = {}) {
  const item = asEventObject(value);
  const typeCount = options.typeCount || 0;
  if (!Number.isInteger(item.t) || item.t < 0 || item.t >= typeCount) return null;
  if (!Number.isInteger(item.x) || !Number.isInteger(item.y)) return null;
  if (!Number.isInteger(item.r) || item.r < 0 || item.r > 3) return null;
  if ('layer' in item && (!Number.isInteger(item.layer) || item.layer < 0 || item.layer > 255)) return null;
  if ('on' in item && typeof item.on !== 'boolean') return null;

  const normalized = { t: item.t, x: item.x, y: item.y, r: item.r };
  if (Number.isInteger(item.layer) && item.layer >= 0 && item.layer <= 255) {
    normalized.layer = item.layer;
  }
  if (item.on === true) normalized.on = true;
  return normalized;
}

function canCreateRoomAfterLeaving(rooms, socket, maxRooms) {
  if (rooms.size < maxRooms) return true;
  if (!socket || !socket.roomId) return false;
  const current = rooms.get(socket.roomId);
  return Boolean(current && !current.isCommon && current.players && current.players.size === 1);
}

function createRateLimiter(now = Date.now) {
  const windows = new Map();

  return function allow(key, limit, windowMs) {
    const currentMs = now();
    const existing = windows.get(key);
    if (!existing || currentMs - existing.startMs >= windowMs) {
      windows.set(key, { startMs: currentMs, count: 1 });
      return true;
    }
    if (existing.count >= limit) return false;
    existing.count += 1;
    return true;
  };
}

function vibeKey(fromId, targetId) {
  return `${fromId}:${targetId}`;
}

function createPendingVibeChecks(options = {}) {
  const pending = new Map();
  const now = options.now || Date.now;
  const ttlMs = options.ttlMs || 15000;

  return {
    add(fromId, targetId) {
      pending.set(vibeKey(fromId, targetId), now() + ttlMs);
    },

    has(fromId, targetId) {
      const key = vibeKey(fromId, targetId);
      const expiresAt = pending.get(key);
      if (!expiresAt || expiresAt <= now()) {
        pending.delete(key);
        return false;
      }
      return true;
    },

    consume(fromId, targetId) {
      const key = vibeKey(fromId, targetId);
      if (!this.has(fromId, targetId)) return false;
      pending.delete(key);
      return true;
    },

    clearForPlayer(playerId) {
      for (const key of pending.keys()) {
        const [fromId, targetId] = key.split(':');
        if (fromId === playerId || targetId === playerId) pending.delete(key);
      }
    },
  };
}

function clearRevealedPairsForPlayer(revealedPairs, playerId) {
  if (!revealedPairs || !playerId) return;

  for (const key of [...revealedPairs]) {
    const [firstId, secondId] = key.split(':');
    if (firstId === playerId || secondId === playerId) revealedPairs.delete(key);
  }
}

function shouldLeaveRoomBeforeJoin(currentRoomId, nextRoomId) {
  return Boolean(currentRoomId && nextRoomId && currentRoomId !== nextRoomId);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizePlayerMove(data, room, options = {}) {
  if (!data || typeof data.x !== 'number' || typeof data.y !== 'number') return null;
  if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return null;

  const margin = options.margin || DEFAULT_PLAYER_MARGIN;
  const width = (room && room.width) || options.width || DEFAULT_ROOM_WIDTH;
  const height = (room && room.height) || options.height || DEFAULT_ROOM_HEIGHT;
  const gridSize = options.gridSize || DEFAULT_GRID_SIZE;
  const x = clamp(data.x, margin, width - margin);
  const y = clamp(data.y, margin, height - margin);

  const blockedCells = room && room.blockedCells;
  if (blockedCells && blockedCells.has(`${Math.floor(x / gridSize)},${Math.floor(y / gridSize)}`)) {
    return null;
  }

  return { x, y };
}

function isAllowedEmote(emote) {
  return typeof emote === 'string' && APPROVED_EMOTES.has(emote);
}

function sanitizeSignText(text) {
  return Array.from(String(text ?? '')
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .trim())
    .slice(0, 10)
    .join('');
}

module.exports = {
  APPROVED_EMOTES,
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
};
