const DEFAULT_MAX_PLAYERS_PER_ROOM = 10;

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

module.exports = {
  createPendingVibeChecks,
  findJoinableRoom,
};
