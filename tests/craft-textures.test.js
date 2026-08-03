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
  assert.equal(
    craft.avatarTextureKey({ colorIdx: 9, shape: 4, eyes: 5, brows: 4, mouth: 5, detail: 5 }),
    'craft-avatar-4-9-5-4-5-5',
  );
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

test('generated craft art uses high-resolution backing textures with a bounded DPR', () => {
  assert.deepEqual(craft.RENDER_RESOLUTION, {
    avatarScale: 4,
    furnitureScale: 2,
    previewSize: 512,
    maxDevicePixelRatio: 2,
  });
  assert.ok(craft.RENDER_RESOLUTION.avatarScale > 1);
  assert.ok(craft.RENDER_RESOLUTION.furnitureScale > 1);
  assert.ok(craft.RENDER_RESOLUTION.previewSize >= 48 * craft.RENDER_RESOLUTION.avatarScale);
});

test('avatar parts cover the expanded mix-and-match system', () => {
  assert.equal(craft.SHAPE_NAMES.length, 5);
  assert.equal(craft.ACCESSORY_NAMES.length, 8);
  assert.equal(craft.EYE_NAMES.length, 6);
  assert.equal(craft.BROW_NAMES.length, 5);
  assert.equal(craft.MOUTH_NAMES.length, 6);
  assert.equal(craft.DETAIL_NAMES.length, 6);
  for (const [field, names] of [
    ['shape', craft.SHAPE_NAMES],
    ['accessory', craft.ACCESSORY_NAMES],
    ['eyes', craft.EYE_NAMES],
    ['brows', craft.BROW_NAMES],
    ['mouth', craft.MOUTH_NAMES],
    ['detail', craft.DETAIL_NAMES],
  ]) {
    assert.equal(craft.AVATAR_OPTION_GLYPHS[field].length, names.length);
  }
});

test('reported avatar face choices resolve to the same named renderer options', () => {
  const customization = craft.decodeAvatarLook('A32111342');
  assert.deepEqual(craft.avatarOptionSelection(customization), {
    shape: 'diamond',
    accessory: 'headphones',
    eyes: 'sleepy',
    brows: 'worried',
    mouth: 'smirk',
    detail: 'blush',
  });
  assert.equal(craft.AVATAR_OPTION_GLYPHS.eyes[customization.eyes], '︶︶');
  assert.equal(craft.AVATAR_OPTION_GLYPHS.brows[customization.brows], '╱╲');
  assert.equal(craft.AVATAR_OPTION_GLYPHS.mouth[customization.mouth], '⌁');
});

test('avatar look codes round-trip and keep legacy four-character codes readable', () => {
  const customization = {
    colorIdx: 9,
    shape: 4,
    accessory: 7,
    pulse: 2,
    eyes: 5,
    brows: 4,
    mouth: 5,
    detail: 5,
  };
  assert.equal(craft.encodeAvatarLook(customization), 'A94725455');
  assert.deepEqual(craft.decodeAvatarLook('a94725455'), customization);
  assert.deepEqual(craft.decodeAvatarLook('9230'), {
    colorIdx: 9,
    shape: 2,
    accessory: 3,
    pulse: 0,
    eyes: 0,
    brows: 0,
    mouth: 0,
    detail: 0,
  });
  assert.equal(craft.decodeAvatarLook('AZ0000000'), null);
  assert.equal(craft.decodeAvatarLook('too-short'), null);
});

test('random avatars can reach every final option without exceeding supported ranges', () => {
  const avatar = craft.randomAvatarCustomization(() => 0.999999);
  assert.deepEqual(avatar, {
    colorIdx: 9,
    shape: 4,
    accessory: 7,
    pulse: 2,
    eyes: 5,
    brows: 4,
    mouth: 5,
    detail: 5,
  });
});
