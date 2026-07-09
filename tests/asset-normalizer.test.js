const assert = require('node:assert/strict');
const test = require('node:test');
const { matteToAlpha } = require('../public/js/asset-normalizer');

test('asset normalizer removes neutral mattes and preserves cyan linework', () => {
  const pixels = new Uint8ClampedArray([
    5, 6, 8, 255,
    255, 255, 255, 255,
    0, 240, 255, 255,
    0, 20, 28, 255,
  ]);

  matteToAlpha(pixels);

  assert.equal(pixels[3], 0);
  assert.equal(pixels[7], 0);
  assert.equal(pixels[11], 255);
  assert.ok(pixels[15] > 0 && pixels[15] < 255);
});
