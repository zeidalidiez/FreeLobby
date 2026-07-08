const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createPendingVibeChecks,
  findJoinableRoom,
} = require('../server/room-state');

function makeRoom({ isPublic = true, isCommon = false, players = 0, maxPlayers = 10 } = {}) {
  return {
    isPublic,
    isCommon,
    maxPlayers,
    players: { size: players },
  };
}

test('random matchmaking skips common and private rooms', () => {
  const rooms = new Map([
    ['LOBBY', makeRoom({ isCommon: true, players: 0, maxPlayers: 25 })],
    ['PRIVATE', makeRoom({ isPublic: false, players: 0 })],
    ['RANDOM', makeRoom({ players: 2, maxPlayers: 10 })],
  ]);

  assert.equal(findJoinableRoom(rooms, { rng: () => 0 }), 'RANDOM');
});

test('random matchmaking returns null when only common rooms are available', () => {
  const rooms = new Map([
    ['LOBBY', makeRoom({ isCommon: true, players: 0, maxPlayers: 25 })],
    ['GARDEN', makeRoom({ isCommon: true, players: 5, maxPlayers: 20 })],
  ]);

  assert.equal(findJoinableRoom(rooms, { rng: () => 0 }), null);
});

test('random matchmaking skips full public rooms', () => {
  const rooms = new Map([
    ['FULL', makeRoom({ players: 10, maxPlayers: 10 })],
    ['OPEN', makeRoom({ players: 9, maxPlayers: 10 })],
  ]);

  assert.equal(findJoinableRoom(rooms, { rng: () => 0 }), 'OPEN');
});

test('pending vibe checks must exist before a response can reveal names', () => {
  const pending = createPendingVibeChecks();

  assert.equal(pending.consume('requester', 'target'), false);

  pending.add('requester', 'target');
  assert.equal(pending.consume('requester', 'target'), true);
  assert.equal(pending.consume('requester', 'target'), false);
});

test('pending vibe checks are cleared when a player leaves', () => {
  const pending = createPendingVibeChecks();

  pending.add('alice', 'bob');
  pending.add('charlie', 'bob');
  pending.add('alice', 'dana');
  pending.clearForPlayer('bob');

  assert.equal(pending.consume('alice', 'bob'), false);
  assert.equal(pending.consume('charlie', 'bob'), false);
  assert.equal(pending.consume('alice', 'dana'), true);
});
