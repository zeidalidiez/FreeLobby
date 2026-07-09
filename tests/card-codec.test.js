const assert = require('node:assert/strict');
const test = require('node:test');
const { readCardData, writeCardData } = require('../public/js/card-codec');

test('room card codec round-trips theme, furniture, and interactive state', () => {
  const data = new Uint8ClampedArray(320 * 4);
  const furniture = [
    { t: 6, x: 3, y: 4, r: 1, layer: 2, on: true },
    { t: 4, x: 8, y: 2, r: 0, layer: 0, on: false },
  ];
  writeCardData(data, 0, furniture, 3);
  assert.deepEqual(readCardData(data, 0), { theme: 3, furniture });
});

test('room card codec rejects unknown versions and oversized payloads', () => {
  const data = new Uint8ClampedArray(320 * 4);
  assert.throws(() => readCardData(data, 0), /Unknown card version/);
  data[0] = 1;
  data[4] = 101;
  assert.throws(() => readCardData(data, 0), /too many items/);
});
