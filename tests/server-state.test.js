const assert = require('node:assert/strict');
const test = require('node:test');

const {
  clearRevealedPairsForPlayer,
  createPendingVibeChecks,
  findJoinableRoom,
  isAllowedEmote,
  normalizePlayerMove,
  sanitizeSignText,
  shouldLeaveRoomBeforeJoin,
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

test('room switching only leaves when joining a different room', () => {
  assert.equal(shouldLeaveRoomBeforeJoin(null, 'LOBBY'), false);
  assert.equal(shouldLeaveRoomBeforeJoin('LOBBY', 'LOBBY'), false);
  assert.equal(shouldLeaveRoomBeforeJoin('LOBBY', 'GARDEN'), true);
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

test('revealed pairs are cleared for exact player ids only', () => {
  const revealedPairs = new Set([
    'alice:bob',
    'alice:bob2',
    'carol:dana',
    'bobcat:dana',
  ]);

  clearRevealedPairsForPlayer(revealedPairs, 'bob');

  assert.deepEqual([...revealedPairs].sort(), [
    'alice:bob2',
    'bobcat:dana',
    'carol:dana',
  ]);
});

test('player movement is finite and clamped to room bounds', () => {
  const room = { width: 1200, height: 800, blockedCells: new Set() };

  assert.deepEqual(normalizePlayerMove({ x: -100, y: 900 }, room), { x: 24, y: 776 });
  assert.deepEqual(normalizePlayerMove({ x: 500.25, y: 300.75 }, room), { x: 500.25, y: 300.75 });
  assert.equal(normalizePlayerMove({ x: Number.NaN, y: 300 }, room), null);
  assert.equal(normalizePlayerMove({ x: 300, y: Number.POSITIVE_INFINITY }, room), null);
});

test('player movement rejects blocked furniture cells', () => {
  const room = {
    width: 1200,
    height: 800,
    blockedCells: new Set(['2,3']),
  };

  assert.equal(normalizePlayerMove({ x: 2 * 64 + 32, y: 3 * 64 + 32 }, room), null);
  assert.deepEqual(normalizePlayerMove({ x: 4 * 64 + 32, y: 3 * 64 + 32 }, room), {
    x: 288,
    y: 224,
  });
});

test('emotes are restricted to the approved palette', () => {
  assert.equal(isAllowedEmote('😊'), true);
  assert.equal(isAllowedEmote('🕯️'), true);
  assert.equal(isAllowedEmote('hello'), false);
  assert.equal(isAllowedEmote('<img src=x onerror=alert(1)>'), false);
});

test('sign text is stripped, trimmed, and limited by code point', () => {
  assert.equal(sanitizeSignText('  hello  '), 'hello');
  assert.equal(sanitizeSignText('a\u0000b\u200bc'), 'abc');
  assert.equal(sanitizeSignText('😀😃😄😁😆😅😂🤣😊😇🙂'), '😀😃😄😁😆😅😂🤣😊😇');
  assert.equal(sanitizeSignText('     '), '');
});
