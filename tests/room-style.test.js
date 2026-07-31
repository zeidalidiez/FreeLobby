const test = require('node:test');
const assert = require('node:assert/strict');

const roomStyles = require('../public/js/room-style');

test('room style presets provide four complete warm-to-muted choices', () => {
  assert.deepEqual(roomStyles.PRESETS.map(preset => preset.id), [
    'welcome-inn',
    'garden-suite',
    'sunroom',
    'midnight',
  ]);
  for (let index = 0; index < roomStyles.PRESETS.length; index++) {
    assert.deepEqual(roomStyles.validateStyle(roomStyles.styleFromPreset(index)), []);
  }
});

test('room styles normalize custom colors and reject malformed payloads', () => {
  const style = roomStyles.normalizeStyle({
    preset: 2,
    wall: '#ABCDEF',
    floor: '#123456',
    accent: '#fedcba',
    intensity: 2,
  });
  assert.deepEqual(style, {
    preset: 2,
    wall: '#abcdef',
    floor: '#123456',
    accent: '#fedcba',
    intensity: 2,
  });
  assert.deepEqual(roomStyles.validateStyle(style), []);
  assert.ok(roomStyles.validateStyle({ preset: 9 }).length >= 4);
});

test('custom style palettes make all direct controls visible', () => {
  const style = {
    preset: 0,
    wall: '#dec0de',
    floor: '#a06744',
    accent: '#346f75',
    intensity: 2,
  };
  const palette = roomStyles.paletteForStyle(style);
  assert.equal(palette.wall, style.wall);
  assert.equal(palette.floor, style.floor);
  assert.equal(palette.accent, style.accent);
  assert.equal(palette.intensity, 2);
  assert.ok(palette.textureContrast > 1);
  assert.equal(roomStyles.isPresetStyle(style), false);
});
