const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const craft = require('../public/js/craft-textures');

const materialsDirectory = path.join(__dirname, '..', 'public', 'assets', 'materials');
const manifest = JSON.parse(
  fs.readFileSync(path.join(materialsDirectory, 'materials.json'), 'utf8'),
);

test('craft material manifest is complete and limited to approved CC0 sources', () => {
  assert.deepEqual(craft.validateMaterialManifest(manifest), []);
  assert.equal(manifest.materials.length, Object.keys(craft.SOURCE_MATERIALS).length);

  const manifestFiles = new Set(manifest.materials.map(material => material.file));
  assert.deepEqual(manifestFiles, new Set(Object.values(craft.SOURCE_MATERIALS)));
});

test('craft source files match their recorded SHA-256 hashes', () => {
  for (const material of manifest.materials) {
    const contents = fs.readFileSync(path.join(materialsDirectory, material.file));
    const actualHash = crypto.createHash('sha256').update(contents).digest('hex');
    assert.equal(actualHash, material.sha256, material.id);
  }
});

test('craft texture keys are deterministic and theme-normalized', () => {
  assert.equal(craft.furnitureTextureKey(0, 10), 'craft-furn-0-10');
  assert.equal(craft.furnitureTextureKey(4, 10), 'craft-furn-0-10');
  assert.equal(craft.furnitureTextureKey(2, 13, true), 'craft-furn-2-13-on');
  assert.equal(craft.playerTextureKey(2, 9), 'craft-player-diamond-9');
  assert.equal(craft.accessoryTextureKey(1, 3), 'craft-accessory-headphones-3');
});

test('all four craft themes expose the complete semantic palette', () => {
  const required = [
    'name', 'background', 'floor', 'seam', 'wall', 'primary',
    'secondary', 'accent', 'dark', 'light', 'leaf', 'water', 'wood',
  ];
  assert.equal(craft.THEME_PALETTES.length, 4);
  for (const theme of craft.THEME_PALETTES) {
    for (const key of required) assert.ok(theme[key], `${theme.name}.${key}`);
  }
});
