const assert = require('node:assert/strict');
const { after, before, test } = require('node:test');
const { io: createClient } = require('socket.io-client');
const furnitureCatalog = require('../public/js/furniture-catalog');
const { evictIdlePlayers, io, rooms, server, startServer } = require('../server/index');

let baseUrl;
const clients = [];

function waitForEvent(socket, eventName, timeoutMs = 1000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(eventName, onEvent);
      reject(new Error(`Timed out waiting for ${eventName}`));
    }, timeoutMs);
    const onEvent = (payload) => {
      clearTimeout(timeout);
      resolve(payload);
    };
    socket.once(eventName, onEvent);
  });
}

async function connectClient() {
  const socket = createClient(baseUrl, {
    forceNew: true,
    reconnection: false,
    transports: ['websocket'],
  });
  clients.push(socket);
  await waitForEvent(socket, 'connect');
  return socket;
}

before(async () => {
  const port = await startServer(0);
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  for (const socket of clients) socket.disconnect();
  await new Promise(resolve => io.close(resolve));
  if (server.listening) await new Promise(resolve => server.close(resolve));
});

test('HTTP shell is self-hosted and sends restrictive security headers', async () => {
  const response = await fetch(`${baseUrl}/`);
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-powered-by'), null);
  assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.match(response.headers.get('cache-control'), /no-cache/);
  assert.doesNotMatch(html, /<script[^>]+https:\/\//);

  for (const vendorFile of ['lucide.min.js', 'phaser.min.js', 'socket.io.min.js']) {
    const vendorResponse = await fetch(`${baseUrl}/vendor/${vendorFile}`);
    assert.equal(vendorResponse.status, 200, `${vendorFile} should be served`);
    assert.match(vendorResponse.headers.get('cache-control'), /immutable/);
  }
});

test('curated common rooms showcase the expanded hotel catalog', () => {
  const commonRooms = ['LOBBY', 'GARDEN', 'LIBRARY', 'SUITE'].map(id => rooms.get(id));
  assert.ok(commonRooms.every(Boolean));
  assert.ok(commonRooms.every(room => room.furniture.length >= 20));

  const showcasedTypes = new Set(commonRooms.flatMap(room => room.furniture.map(item => item.t)));
  for (const type of [20, 27, 42, 50, 70, 77, 82, 89, 90, 91, 94, 95, 99]) {
    assert.ok(showcasedTypes.has(type), `${furnitureCatalog.ITEMS[type].name} should be showcased`);
  }

  for (const room of commonRooms) {
    for (const item of room.furniture) {
      assert.ok(furnitureCatalog.ITEMS[item.t], `unknown type ${item.t}`);
      assert.ok(item.x >= 0 && item.x < room.width / 64);
      assert.ok(item.y >= 0 && item.y < room.height / 64);
    }
  }
});

test('socket boundary rejects malformed payloads and preserves consent-gated signs', async () => {
  const malformedClient = await connectClient();
  const inputError = waitForEvent(malformedClient, 'inputError');
  malformedClient.emit('createRoom', null);
  assert.equal((await inputError).message, 'That request could not be understood.');
  assert.equal(malformedClient.connected, true);

  const owner = await connectClient();
  const guest = await connectClient();
  const ownerJoined = waitForEvent(owner, 'roomJoined');
  owner.emit('createRoom', {
    name: 'Owner',
    customization: { colorIdx: 1, shape: 1, accessory: 0, pulse: 1 },
  });
  const { roomId } = await ownerJoined;

  const invalidFurniture = waitForEvent(owner, 'buildError');
  owner.emit('placeFurniture', { item: { t: 0, x: null, y: 2, r: 0 } });
  assert.equal((await invalidFurniture).message, 'Invalid furniture item.');

  const furnitureReset = waitForEvent(owner, 'roomFurnitureReset');
  owner.emit('setRoomFurniture', {
    furniture: [{ t: 6, x: 1, y: 1, r: 0, on: true }],
    theme: 3,
  });
  assert.deepEqual((await furnitureReset).interactiveStates, { 1: true });

  const guestJoined = waitForEvent(guest, 'roomJoined');
  guest.emit('joinRoom', {
    roomId,
    name: 'Guest',
    customization: {
      colorIdx: 2,
      shape: 4,
      accessory: 7,
      pulse: 1,
      eyes: 5,
      brows: 4,
      mouth: 5,
      detail: 5,
    },
  });
  const guestRoom = await guestJoined;
  assert.deepEqual(guestRoom.you.customization, {
    colorIdx: 2,
    shape: 4,
    accessory: 7,
    pulse: 1,
    eyes: 5,
    brows: 4,
    mouth: 5,
    detail: 5,
  });

  const customStyle = {
    preset: 1,
    intensity: 0,
    wall: '#f0dfc4',
    floor: '#8f7658',
    accent: '#64846f',
  };
  const styleChanged = waitForEvent(guest, 'roomStyleChanged');
  owner.emit('setRoomStyle', { style: customStyle });
  assert.deepEqual((await styleChanged).style, customStyle);

  const invalidStyle = waitForEvent(owner, 'buildError');
  owner.emit('setRoomStyle', { style: { ...customStyle, wall: 'not-a-color' } });
  assert.match((await invalidStyle).message, /wall/i);

  let leakedSign = false;
  guest.once('playerSign', () => { leakedSign = true; });
  owner.emit('sendSign', { text: 'blocked' });
  await new Promise(resolve => setTimeout(resolve, 100));
  assert.equal(leakedSign, false);

  const prompt = waitForEvent(guest, 'vibeCheckPrompt');
  owner.emit('vibeCheckRequest', { targetId: guest.id });
  const { fromId } = await prompt;
  const ownerReveal = waitForEvent(owner, 'vibeCheckRevealed');
  const guestReveal = waitForEvent(guest, 'vibeCheckRevealed');
  guest.emit('vibeCheckRespond', { fromId, accepted: true });
  await Promise.all([ownerReveal, guestReveal]);

  await new Promise(resolve => setTimeout(resolve, 450));
  const visibleSign = waitForEvent(guest, 'playerSign');
  owner.emit('sendSign', { text: 'hello' });
  assert.deepEqual(await visibleSign, { id: owner.id, text: 'hello' });

  const idleTimeout = waitForEvent(owner, 'idleTimeout');
  evictIdlePlayers(Date.now() + 16 * 60 * 1000);
  assert.match((await idleTimeout).message, /idle for a while/);
  assert.equal(owner.connected, true);
});
