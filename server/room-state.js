const DEFAULT_MAX_PLAYERS_PER_ROOM = 10;
const DEFAULT_ROOM_WIDTH = 1200;
const DEFAULT_ROOM_HEIGHT = 800;
const DEFAULT_PLAYER_MARGIN = 24;
const DEFAULT_GRID_SIZE = 64;

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

function vibeKey(fromId, targetId) {
  return `${fromId}:${targetId}`;
}

function createPendingVibeChecks() {
  const pending = new Set();

  return {
    add(fromId, targetId) {
      pending.add(vibeKey(fromId, targetId));
    },

    has(fromId, targetId) {
      return pending.has(vibeKey(fromId, targetId));
    },

    consume(fromId, targetId) {
      const key = vibeKey(fromId, targetId);
      if (!pending.has(key)) return false;
      pending.delete(key);
      return true;
    },

    clearForPlayer(playerId) {
      for (const key of pending) {
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
  clearRevealedPairsForPlayer,
  createPendingVibeChecks,
  findJoinableRoom,
  isAllowedEmote,
  normalizePlayerMove,
  sanitizeSignText,
  shouldLeaveRoomBeforeJoin,
};
