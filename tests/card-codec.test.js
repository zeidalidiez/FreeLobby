const assert = require('node:assert/strict');
const test = require('node:test');
const { LEGACY_VERSION, readCardData, writeCardData } = require('../public/js/card-codec');
const roomStyles = require('../public/js/room-style');

test('room card codec round-trips room style, furniture, and interactive state', () => {
  const data = new Uint8ClampedArray(320 * 4);
  const furniture = [
    { t: 6, x: 3, y: 4, r: 1, layer: 2, on: true },
    { t: 99, x: 8, y: 2, r: 0, layer: 0, on: false },
  ];
  const style = {
    preset: 2,
    wall: '#dec0de',
    floor: '#986744',
    accent: '#346f75',
    intensity: 2,
  };
  writeCardData(data, 0, furniture, style);
  assert.deepEqual(readCardData(data, 0), { theme: 2, style, furniture });
});

test('room card codec still imports v1 theme cards', () => {
  const data = new Uint8ClampedArray(320 * 4);
  data[0] = LEGACY_VERSION;
  data[1] = 3;
  data[3] = 255;
  data[4] = 1;
  data[7] = 255;
  data[8] = 10;
  data[9] = 2;
  data[10] = 3;
  data[11] = 255;
  data[12] = 1;
  data[15] = 255;
  assert.deepEqual(readCardData(data, 0), {
    theme: 3,
    style: roomStyles.styleFromPreset(3),
    furniture: [{ t: 10, x: 2, y: 3, r: 1, layer: 0, on: false }],
  });
});

test('room card codec rejects unknown versions and oversized payloads', () => {
  const data = new Uint8ClampedArray(320 * 4);
  assert.throws(() => readCardData(data, 0), /Unknown card version/);
  data[0] = LEGACY_VERSION;
  data[4] = 101;
  assert.throws(() => readCardData(data, 0), /too many items/);
});
