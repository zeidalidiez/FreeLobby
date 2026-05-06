/* ═══════════════════════════════════════════════════════
   FreeLobby — Game Client (Phase 4: Vibe Check & Polish)
   ═══════════════════════════════════════════════════════ */

// ─── DOM References ────────────────────────────────────
const landingScreen      = document.getElementById('landing-screen');
const gameContainer      = document.getElementById('game-container');
const connectionStatus   = document.getElementById('connection-status');
const statusDot          = document.querySelector('.status-dot');
const statusText         = document.getElementById('status-text');
const backBtn            = document.getElementById('back-btn');
const nameInput          = document.getElementById('player-name');
const btnJoin            = document.getElementById('btn-join');
const btnCreate          = document.getElementById('btn-create');
const fleeBtn            = document.getElementById('flee-btn');
const btnToggleSpecific  = document.getElementById('btn-toggle-specific');
const joinSpecificPanel  = document.getElementById('join-specific-panel');
const roomCodeInput      = document.getElementById('room-code-input');
const btnJoinCode        = document.getElementById('btn-join-code');
const roomIdDisplay      = document.getElementById('room-id-display');
const roomInfo           = document.getElementById('room-info');
const playerCountEl      = document.getElementById('player-count');
const playerCountText    = document.getElementById('player-count-text');
const copyRoomBtn        = document.getElementById('copy-room-btn');
const errorToast         = document.getElementById('error-toast');

// Phase 3 — Emote & Sign
const emotePanel   = document.getElementById('emote-panel');
const emoteToggle  = document.getElementById('emote-toggle');
const emoteGrid    = document.getElementById('emote-grid');
const signBar      = document.getElementById('sign-bar');
const signInput    = document.getElementById('sign-input');
const signSendBtn  = document.getElementById('sign-send');

// Phase 4 — Vibe Check & Love
const vibeAction    = document.getElementById('vibe-action');
const vibeActionBtn = document.getElementById('vibe-action-btn');
const vibePrompt    = document.getElementById('vibe-prompt');
const vibeAcceptBtn = document.getElementById('vibe-accept');
const vibeDeclineBtn = document.getElementById('vibe-decline');
const loveBtn       = document.getElementById('love-btn');
const loveModal     = document.getElementById('love-modal');
const loveModalClose = document.getElementById('love-modal-close');

const btnPublic     = document.getElementById('btn-public');
const btnPrivate    = document.getElementById('btn-private');
const ownerBadge    = document.getElementById('owner-badge');

let game = null;
let socket = null;
let playerName = 'Stranger';
let currentRoomId = null;
let joinMode = 'random';
let joinRoomCode = '';
let isRoomOwner = false;
let createRoomPublic = true;

// Vibe Check state
let vibeTargetId = null;     // who we clicked on
let vibePromptFromId = null; // who is requesting a vibe check on us

// Phase 2 — Character Customization
const btnToggleCustomize = document.getElementById('btn-toggle-customize');
const customizePanel     = document.getElementById('customize-panel');
const colorSwatches      = document.getElementById('color-swatches');
const shapeBtns          = document.getElementById('shape-btns');
const accBtns            = document.getElementById('acc-btns');
const pulseSlider        = document.getElementById('pulse-slider');
const avatarHashInput    = document.getElementById('avatar-hash');
const btnCopyHash        = document.getElementById('btn-copy-hash');
const importHashInput    = document.getElementById('import-hash');
const btnImportHash      = document.getElementById('btn-import-hash');

const PLAYER_COLORS = [
  0x00f0ff, 0xff00ff, 0x39ff14, 0xff007f, 0xffff00,
  0xff8800, 0xbd00ff, 0x0088ff, 0xff3333, 0x00ffcc,
];
const COLOR_HEX_STR = [
  '#00f0ff', '#ff00ff', '#39ff14', '#ff007f', '#ffff00',
  '#ff8800', '#bd00ff', '#0088ff', '#ff3333', '#00ffcc',
];

let CUSTOMIZATION = { colorIdx: 0, shape: 0, accessory: 0, pulse: 1 };

function encodeHash(c) {
  const chars = '0123456789abcdef';
  return chars[c.colorIdx] + String(c.shape) + String(c.accessory) + String(c.pulse);
}
function decodeHash(str) {
  const chars = '0123456789abcdef';
  const c = { colorIdx: 0, shape: 0, accessory: 0, pulse: 1 };
  if (str.length !== 4) return c;
  c.colorIdx = chars.indexOf(str[0].toLowerCase());
  if (c.colorIdx < 0) c.colorIdx = 0;
  c.shape = parseInt(str[1], 10) || 0;
  c.accessory = parseInt(str[2], 10) || 0;
  c.pulse = parseInt(str[3], 10);
  if (isNaN(c.pulse)) c.pulse = 1;
  c.colorIdx = Math.max(0, Math.min(9, c.colorIdx));
  c.shape = Math.max(0, Math.min(2, c.shape));
  c.accessory = Math.max(0, Math.min(3, c.accessory));
  c.pulse = Math.max(0, Math.min(2, c.pulse));
  return c;
}
function updateCustomizationUI() {
  avatarHashInput.value = encodeHash(CUSTOMIZATION);
  colorSwatches.querySelectorAll('.swatch').forEach((el, i) => {
    el.classList.toggle('active', i === CUSTOMIZATION.colorIdx);
  });
  shapeBtns.querySelectorAll('.shape-btn').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.shape, 10) === CUSTOMIZATION.shape);
  });
  accBtns.querySelectorAll('.acc-btn').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.acc, 10) === CUSTOMIZATION.accessory);
  });
  pulseSlider.value = CUSTOMIZATION.pulse;
}

COLOR_HEX_STR.forEach((hex, i) => {
  const sw = document.createElement('div');
  sw.className = 'swatch' + (i === 0 ? ' active' : '');
  sw.style.backgroundColor = hex;
  sw.style.boxShadow = `0 0 8px ${hex}66`;
  sw.addEventListener('click', () => {
    CUSTOMIZATION.colorIdx = i;
    updateCustomizationUI();
  });
  colorSwatches.appendChild(sw);
});

btnToggleCustomize.addEventListener('click', () => customizePanel.classList.toggle('open'));

shapeBtns.addEventListener('click', (e) => {
  const btn = e.target.closest('.shape-btn');
  if (!btn) return;
  CUSTOMIZATION.shape = parseInt(btn.dataset.shape, 10);
  updateCustomizationUI();
});

accBtns.addEventListener('click', (e) => {
  const btn = e.target.closest('.acc-btn');
  if (!btn) return;
  CUSTOMIZATION.accessory = parseInt(btn.dataset.acc, 10);
  updateCustomizationUI();
});

pulseSlider.addEventListener('input', () => {
  CUSTOMIZATION.pulse = parseInt(pulseSlider.value, 10);
  updateCustomizationUI();
});

btnCopyHash.addEventListener('click', () => {
  navigator.clipboard.writeText(encodeHash(CUSTOMIZATION)).then(() => {
    btnCopyHash.textContent = '✓';
    setTimeout(() => btnCopyHash.textContent = 'Copy', 1500);
  });
});

btnImportHash.addEventListener('click', () => {
  const str = importHashInput.value.trim();
  if (str.length === 4) {
    CUSTOMIZATION = decodeHash(str);
    updateCustomizationUI();
    importHashInput.value = '';
  } else {
    showError('Hash must be 4 characters');
  }
});

function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.add('visible');
  setTimeout(() => errorToast.classList.remove('visible'), 3500);
}

// ─── Landing UI Logic ──────────────────────────────────

btnToggleSpecific.addEventListener('click', () => {
  joinSpecificPanel.classList.toggle('open');
  roomCodeInput.focus();
});

roomCodeInput.addEventListener('input', () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

// ═══════════════════════════════════════════════════════
// PHASER CONFIG (must be defined before enterGame)
// ═══════════════════════════════════════════════════════

const WORLD_WIDTH  = 1200;
const WORLD_HEIGHT = 800;
const PLAYER_SPEED = 220;
const LERP_FACTOR  = 0.15;
const SEND_RATE    = 50;

const gameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#050508',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: { preload, create, update },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// ═══════════════════════════════════════════════════════
// SCENE STATE
// ═══════════════════════════════════════════════════════

let player;
let playerAccessory = null;
let cursors;
let targetPosition = null;
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let camStartScrollX = 0;
let camStartScrollY = 0;
let wasd;
let nameLabel;
let myColor = 0xa78bfa;

const otherPlayers = new Map();

let lastSendTime = 0;
let lastX = -1;
let lastY = -1;

let scene;
let roomFurniture = [];
let roomTheme = 0;

// ─── Enter / Exit Game ─────────────────────────────────

function enterGame(mode, roomCode) {
  playerName = nameInput.value.trim() || 'Stranger';
  joinMode = mode;
  joinRoomCode = roomCode || '';
  createRoomPublic = btnPublic.classList.contains('active');

  landingScreen.classList.add('hidden');
  gameContainer.classList.add('active');
  connectionStatus.classList.add('visible');
  backBtn.classList.add('visible');
  roomInfo.classList.add('visible');
  playerCountEl.classList.add('visible');
  emotePanel.classList.add('visible');
  signBar.classList.add('visible');
  loveBtn.classList.add('visible');
  fleeBtn.classList.add('visible');

  // Reset sign input to blocked until vibe check
  signInput.disabled = true;
  signSendBtn.disabled = true;
  signInput.placeholder = 'Pass a Vibe Check to type…';

  if (!game) {
    game = new Phaser.Game(gameConfig);
  }
}

function exitGame() {
  landingScreen.classList.remove('hidden');
  gameContainer.classList.remove('active');
  connectionStatus.classList.remove('visible');
  backBtn.classList.remove('visible');
  roomInfo.classList.remove('visible');
  playerCountEl.classList.remove('visible');
  emotePanel.classList.remove('visible');
  signBar.classList.remove('visible');
  emoteGrid.classList.remove('open');
  loveBtn.classList.remove('visible');
  vibeAction.classList.remove('visible');
  vibePrompt.classList.remove('visible');
  loveModal.classList.remove('visible');
  fleeBtn.classList.remove('visible');
  buildBtn.classList.remove('visible');
  buildBtn.classList.remove('active');
  furniturePanel.classList.remove('visible');
  ownerBadge.classList.remove('visible');
  isRoomOwner = false;
  buildMode = false;
  roomFurniture.forEach(f => {
    if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
    f.sprite.destroy();
  });
  roomFurniture = [];

  if (game) { game.destroy(true); game = null; }
  if (socket) { socket.disconnect(); socket = null; }
  if (playerAccessory) { playerAccessory.destroy(); playerAccessory = null; }

  currentRoomId = null;
  roomIdDisplay.textContent = '----';
  otherPlayers.clear();
  player = null;
  playerAccessory = null;
  targetPosition = null;
  isPanning = false;
}

// Button listeners
btnJoin.addEventListener('click', () => enterGame('random'));
btnCreate.addEventListener('click', () => enterGame('create'));
btnJoinCode.addEventListener('click', () => {
  const code = roomCodeInput.value.trim();
  if (code.length !== 4) { showError('Room code must be 4 characters'); return; }
  enterGame('code', code);
});
backBtn.addEventListener('click', exitGame);
fleeBtn.addEventListener('click', () => {
  if (socket && socket.connected) {
    socket.emit('fleeRoom', { name: playerName, customization: CUSTOMIZATION });
    // Reset local typing lock when fleeing
    signInput.disabled = true;
    signSendBtn.disabled = true;
    signInput.placeholder = 'Pass a Vibe Check to type…';
  }
});

nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterGame('random'); });
roomCodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnJoinCode.click(); });

copyRoomBtn.addEventListener('click', () => {
  if (currentRoomId) {
    navigator.clipboard.writeText(currentRoomId).then(() => {
      copyRoomBtn.textContent = '✓';
      setTimeout(() => { copyRoomBtn.textContent = '📋'; }, 1500);
    });
  }
});

// ─── Emote & Sign UI ──────────────────────────────────

emoteToggle.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  emoteGrid.classList.toggle('open');
});

emoteGrid.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  const btn = e.target.closest('.emote-btn');
  if (!btn) return;
  if (socket && socket.connected) socket.emit('sendEmote', { emote: btn.dataset.emote });
  emoteGrid.classList.remove('open');
});

signSendBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  sendSign();
});
signInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendSign();
  e.stopPropagation();
});
signInput.addEventListener('keyup', (e) => e.stopPropagation());
signInput.addEventListener('keypress', (e) => e.stopPropagation());

function sendSign() {
  const text = signInput.value.trim().slice(0, 10);
  if (!text) return;
  if (socket && socket.connected) socket.emit('sendSign', { text });
  signInput.value = '';
  signInput.blur();
}

// ─── Made with Love Modal ──────────────────────────────

loveBtn.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  e.preventDefault();
  loveModal.classList.add('visible');
});
loveModalClose.addEventListener('click', () => loveModal.classList.remove('visible'));
loveModal.addEventListener('click', (e) => {
  if (e.target === loveModal) loveModal.classList.remove('visible');
});

// Phase 3 — Furniture Build Mode
const buildBtn         = document.getElementById('build-btn');
const furniturePanel   = document.getElementById('furniture-panel');
const furniturePalette = document.getElementById('furniture-palette');
const toolPlace        = document.getElementById('tool-place');
const toolRemove       = document.getElementById('tool-remove');
const btnToggleHash    = document.getElementById('btn-toggle-hash');
const hashPanel        = document.getElementById('hash-panel');
const btnDownloadCard  = document.getElementById('btn-download-card');
const cardFileInput    = document.getElementById('card-file-input');

let buildMode = false;
let buildTool = 'place';
let selectedFurnitureType = 0;
const FURNITURE_NAMES = ['Cube', 'Sphere', 'Cylinder', 'Pyramid', 'Chair', 'Plant', 'Lamp', 'Rug'];
const FURNITURE_FOOTPRINTS = [
  { w: 1, h: 1, walkable: false }, // 0: Cube
  { w: 1, h: 1, walkable: false }, // 1: Sphere
  { w: 1, h: 1, walkable: false }, // 2: Cylinder
  { w: 1, h: 1, walkable: false }, // 3: Pyramid
  { w: 1, h: 1, walkable: true  }, // 4: Chair
  { w: 1, h: 1, walkable: false }, // 5: Plant
  { w: 1, h: 1, walkable: false }, // 6: Lamp
  { w: 2, h: 2, walkable: true  }, // 7: Rug
];

function getClientFootprint(type, rotation) {
  const fp = FURNITURE_FOOTPRINTS[type];
  if (!fp) return { w: 1, h: 1, walkable: false };
  const rot = (rotation || 0) % 4;
  const w = (rot % 2 === 1) ? fp.h : fp.w;
  const h = (rot % 2 === 1) ? fp.w : fp.h;
  return { w, h, walkable: fp.walkable };
}

// Generate furniture palette
const FURNITURE_ICONS = ['🟦','⚪','⏺️','🔺','🪑','🌱','💡','🟩'];
FURNITURE_NAMES.forEach((name, i) => {
  const btn = document.createElement('button');
  btn.className = 'furn-btn' + (i === 0 ? ' active' : '');
  btn.title = name;
  btn.dataset.type = String(i);
  btn.textContent = FURNITURE_ICONS[i];
  btn.addEventListener('click', () => {
    selectedFurnitureType = i;
    buildTool = 'place';
    updateBuildUI();
  });
  furniturePalette.appendChild(btn);
});

function updateBuildUI() {
  furniturePalette.querySelectorAll('.furn-btn').forEach((el, i) => {
    el.classList.toggle('active', i === selectedFurnitureType && buildTool === 'place');
  });
  toolPlace.classList.toggle('active', buildTool === 'place');
  toolRemove.classList.toggle('active', buildTool === 'remove');
}

buildBtn.addEventListener('click', () => {
  buildMode = !buildMode;
  buildBtn.classList.toggle('active', buildMode);
  furniturePanel.classList.toggle('visible', buildMode);
  if (buildMode) buildTool = 'place';
  updateBuildUI();
});

toolPlace.addEventListener('click', () => { buildTool = 'place'; updateBuildUI(); });
toolRemove.addEventListener('click', () => { buildTool = 'remove'; updateBuildUI(); });

// ─── Room Memory Card Export / Import ──────────────────

btnToggleHash.addEventListener('click', () => {
  hashPanel.classList.toggle('open');
});

btnDownloadCard.addEventListener('click', () => {
  const items = roomFurniture.map(f => f.item);
  const canvas = generateRoomCard(currentRoomId, items, roomTheme);
  const link = document.createElement('a');
  link.download = `freelobby-room-${currentRoomId || 'card'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
});

cardFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  decodeRoomCard(file, (result, error) => {
    if (error) { showError(error); return; }
    if (socket && socket.connected) {
      socket.emit('setRoomFurniture', { furniture: result.furniture, theme: result.theme });
    }
  });
  cardFileInput.value = '';
});

// ═══════════════════════════════════════════════════════
// SCENE FUNCTIONS
// ═══════════════════════════════════════════════════════

function preload() {
  scene = this;

  // Generate base shapes
  ['circle', 'square', 'diamond'].forEach((shape) => {
    const g = this.make.graphics({ add: false });
    if (shape === 'circle') {
      g.fillStyle(0xffffff, 0.15); g.fillCircle(24, 24, 24);
      g.fillStyle(0xffffff, 0.4);  g.fillCircle(24, 24, 18);
      g.fillStyle(0xffffff, 0.9);  g.fillCircle(24, 24, 10);
      g.fillStyle(0xffffff, 1.0);  g.fillCircle(24, 24, 5);
    } else if (shape === 'square') {
      g.fillStyle(0xffffff, 0.15); g.fillRect(0, 0, 48, 48);
      g.fillStyle(0xffffff, 0.4);  g.fillRect(6, 6, 36, 36);
      g.fillStyle(0xffffff, 0.9);  g.fillRect(14, 14, 20, 20);
      g.fillStyle(0xffffff, 1.0);  g.fillRect(19, 19, 10, 10);
    } else if (shape === 'diamond') {
      const drawD = (r) => { g.beginPath(); g.moveTo(24, 24-r); g.lineTo(24+r, 24); g.lineTo(24, 24+r); g.lineTo(24-r, 24); g.closePath(); g.fillPath(); };
      g.fillStyle(0xffffff, 0.15); drawD(24);
      g.fillStyle(0xffffff, 0.4);  drawD(18);
      g.fillStyle(0xffffff, 0.9);  drawD(10);
      g.fillStyle(0xffffff, 1.0);  drawD(5);
    }
    g.generateTexture(`player-${shape}`, 48, 48);
    g.destroy();
  });

  // Accessories
  const accG = this.make.graphics({ add: false });
  // Headphones
  accG.clear(); accG.lineStyle(3, 0xffffff, 0.9); accG.beginPath(); accG.arc(24, 22, 12, Math.PI, 0); accG.strokePath();
  accG.fillStyle(0xffffff, 0.9); accG.fillRect(10, 20, 5, 10); accG.fillRect(33, 20, 5, 10);
  accG.generateTexture('acc-headphones', 48, 48);
  // Halo
  accG.clear(); accG.lineStyle(2, 0xffffff, 0.9); accG.strokeEllipse(24, 10, 28, 8);
  accG.generateTexture('acc-halo', 48, 48);
  // Beanie
  accG.clear(); accG.fillStyle(0xffffff, 0.9); accG.fillRect(10, 4, 28, 10); accG.fillRect(8, 10, 32, 4);
  accG.generateTexture('acc-beanie', 48, 48);
  accG.destroy();

  // Furniture (64x64 textures for clean integer scaling)
  const furnGfx = this.make.graphics({ add: false });
  // 0: Cube
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.strokeRect(0, 0, 64, 64); furnGfx.lineStyle(1, 0xffffff, 0.5); furnGfx.strokeRect(12, 12, 40, 40);
  furnGfx.generateTexture('furn-0', 64, 64);
  // 1: Sphere
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.strokeCircle(32, 32, 28); furnGfx.lineStyle(1, 0xffffff, 0.5); furnGfx.strokeCircle(32, 32, 14);
  furnGfx.generateTexture('furn-1', 64, 64);
  // 2: Cylinder
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.strokeEllipse(32, 32, 56, 40); furnGfx.lineStyle(1, 0xffffff, 0.5); furnGfx.lineBetween(4, 32, 60, 32);
  furnGfx.generateTexture('furn-2', 64, 64);
  // 3: Pyramid
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.beginPath(); furnGfx.moveTo(32, 4); furnGfx.lineTo(56, 52); furnGfx.lineTo(8, 52); furnGfx.closePath(); furnGfx.strokePath();
  furnGfx.generateTexture('furn-3', 64, 64);
  // 4: Chair
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.strokeRect(16, 28, 32, 24); furnGfx.lineBetween(16, 28, 16, 8); furnGfx.lineBetween(48, 28, 48, 8); furnGfx.lineBetween(16, 8, 48, 8);
  furnGfx.generateTexture('furn-4', 64, 64);
  // 5: Plant
  furnGfx.clear(); furnGfx.lineStyle(2, 0x39ff14, 0.9); furnGfx.strokeCircle(32, 22, 14); furnGfx.lineStyle(2, 0xffffff, 0.6); furnGfx.lineBetween(32, 36, 32, 56);
  furnGfx.generateTexture('furn-5', 64, 64);
  // 6: Lamp
  furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.6); furnGfx.lineBetween(32, 4, 32, 44); furnGfx.fillStyle(0xffff00, 0.8); furnGfx.fillCircle(32, 6, 6);
  furnGfx.generateTexture('furn-6', 64, 64);
  // 7: Rug
  furnGfx.clear(); furnGfx.fillStyle(0xffffff, 0.15); furnGfx.fillRect(0, 16, 64, 32); furnGfx.lineStyle(1, 0xffffff, 0.4); furnGfx.strokeRect(0, 16, 64, 32);
  furnGfx.generateTexture('furn-7', 64, 64);
  furnGfx.destroy();

  const floor = this.make.graphics({ add: false });
  floor.fillStyle(0x050508, 1); floor.fillRect(0, 0, 128, 128);
  floor.lineStyle(2, 0x00f0ff, 0.2); floor.strokeRect(0, 0, 128, 128);
  floor.lineStyle(1, 0x00f0ff, 0.05);
  floor.lineBetween(64, 0, 64, 128);
  floor.lineBetween(0, 64, 128, 64);
  floor.generateTexture('floor-tile', 128, 128);
  floor.destroy();

  const wall = this.make.graphics({ add: false });
  wall.fillStyle(0x020205, 0.8); wall.fillRect(0, 0, 64, 64);
  wall.lineStyle(3, 0x00f0ff, 0.6); wall.strokeRect(0, 0, 64, 64);
  wall.lineStyle(1, 0xffffff, 0.8); wall.strokeRect(0, 0, 64, 64);
  wall.generateTexture('wall-tile', 64, 64);
  wall.destroy();
}

function create() {
  scene = this;

  for (let x = 0; x < WORLD_WIDTH; x += 128) {
    for (let y = 0; y < WORLD_HEIGHT; y += 128) {
      this.add.image(x + 64, y + 64, 'floor-tile');
    }
  }

  const wallGroup = this.physics.add.staticGroup();
  const furnitureGroup = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_WIDTH; x += 64) {
    wallGroup.add(this.add.image(x + 32, 0, 'wall-tile'));
    wallGroup.add(this.add.image(x + 32, WORLD_HEIGHT, 'wall-tile'));
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 64) {
    wallGroup.add(this.add.image(0, y + 32, 'wall-tile'));
    wallGroup.add(this.add.image(WORLD_WIDTH, y + 32, 'wall-tile'));
  }

  player = null;

  this.cameras.main.setBackgroundColor('#050508');
  this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up:    Phaser.Input.Keyboard.KeyCodes.W,
    down:  Phaser.Input.Keyboard.KeyCodes.S,
    left:  Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  // Mobile Controls: Drag-to-Pan & Click-to-Move
  this.input.on('pointerdown', (pointer) => {
    if (pointer.event.target.tagName !== 'CANVAS') return;
    isPanning = false;
    panStartX = pointer.x;
    panStartY = pointer.y;
    camStartScrollX = this.cameras.main.scrollX;
    camStartScrollY = this.cameras.main.scrollY;
  });

  this.input.on('pointermove', (pointer) => {
    if (!pointer.isDown || pointer.event.target.tagName !== 'CANVAS') return;
    const dist = Phaser.Math.Distance.Between(panStartX, panStartY, pointer.x, pointer.y);
    if (dist > 10) {
      if (!isPanning) {
        isPanning = true;
        this.cameras.main.stopFollow();
      }
      this.cameras.main.scrollX = camStartScrollX + (panStartX - pointer.x) / this.cameras.main.zoom;
      this.cameras.main.scrollY = camStartScrollY + (panStartY - pointer.y) / this.cameras.main.zoom;
    }
  });

  this.input.on('pointerup', (pointer, currentlyOver) => {
    if (pointer.event.target.tagName !== 'CANVAS') return;
    
    if (buildMode && isRoomOwner) {
      if (!isPanning) {
        const gx = Math.floor(pointer.worldX / 64);
        const gy = Math.floor(pointer.worldY / 64);
        if (buildTool === 'place') {
          const item = { t: selectedFurnitureType, x: gx, y: gy, r: 0 };
          socket.emit('placeFurniture', { item });
        } else if (buildTool === 'remove') {
          const idx = roomFurniture.findIndex(f => {
            const fp = getClientFootprint(f.item.t, f.item.r);
            return gx >= f.item.x && gx < f.item.x + fp.w && gy >= f.item.y && gy < f.item.y + fp.h;
          });
          if (idx >= 0) socket.emit('removeFurniture', { index: idx });
        }
      }
      isPanning = false;
      return;
    }

    // Disable walking if clicking on an interactive element (like a player sprite)
    if (currentlyOver && currentlyOver.length > 0) return;

    if (!isPanning && player) {
      // Clamp target to map bounds
      const clampedX = Phaser.Math.Clamp(pointer.worldX, 24, WORLD_WIDTH - 24);
      const clampedY = Phaser.Math.Clamp(pointer.worldY, 24, WORLD_HEIGHT - 24);
      
      targetPosition = { x: clampedX, y: clampedY };
      createClickPulse(clampedX, clampedY);
      this.cameras.main.startFollow(player, true, 0.08, 0.08);
    }
    isPanning = false;
  });

  connectSocket();
  this.wallGroup = wallGroup;
  this.furnitureGroup = furnitureGroup;
}

function update(_time, _delta) {
  if (player && player.body) {
    const signFocused = document.activeElement === signInput;
    let vx = 0;
    let vy = 0;
    let usingKeyboard = false;

    if (!signFocused) {
      if (cursors.left.isDown  || wasd.left.isDown)  { vx = -PLAYER_SPEED; usingKeyboard = true; }
      if (cursors.right.isDown || wasd.right.isDown) { vx =  PLAYER_SPEED; usingKeyboard = true; }
      if (cursors.up.isDown    || wasd.up.isDown)    { vy = -PLAYER_SPEED; usingKeyboard = true; }
      if (cursors.down.isDown  || wasd.down.isDown)  { vy =  PLAYER_SPEED; usingKeyboard = true; }

      if (vx !== 0 && vy !== 0) {
        vx *= Math.SQRT1_2;
        vy *= Math.SQRT1_2;
      }
    }

    if (usingKeyboard) {
      targetPosition = null; // Keyboard overrides click-to-move
      scene.cameras.main.startFollow(player, true, 0.08, 0.08); // Ensure camera follows again
    } else if (targetPosition) {
      // Click-to-move logic
      const dist = Phaser.Math.Distance.Between(player.x, player.y, targetPosition.x, targetPosition.y);
      if (dist < 5) {
        targetPosition = null; // Reached destination
      } else {
        const angle = Phaser.Math.Angle.Between(player.x, player.y, targetPosition.x, targetPosition.y);
        vx = Math.cos(angle) * PLAYER_SPEED;
        vy = Math.sin(angle) * PLAYER_SPEED;
      }
    }

    player.setVelocity(vx, vy);
    nameLabel.setPosition(player.x, player.y - 30);
    if (playerAccessory) playerAccessory.setPosition(player.x, player.y);

    // Pulse animation
    const pulseSpeeds = [0.02, 0.04, 0.08];
    const pulseT = scene.time.now / 1000;
    const pulseSpeed = pulseSpeeds[CUSTOMIZATION.pulse] || 0.04;
    const pulseScale = 1 + Math.sin(pulseT * pulseSpeed * Math.PI * 2) * 0.05;
    player.setScale(pulseScale);
    if (playerAccessory) playerAccessory.setScale(pulseScale);

    const now = Date.now();
    const moved = (Math.abs(player.x - lastX) > 0.5 || Math.abs(player.y - lastY) > 0.5);
    if (socket && socket.connected && moved && now - lastSendTime > SEND_RATE) {
      socket.emit('playerMove', { x: player.x, y: player.y });
      lastX = player.x;
      lastY = player.y;
      lastSendTime = now;
    }
  }

  for (const [id, other] of otherPlayers) {
    if (other.sprite && other.targetX !== undefined) {
      other.sprite.x += (other.targetX - other.sprite.x) * LERP_FACTOR;
      other.sprite.y += (other.targetY - other.sprite.y) * LERP_FACTOR;
      other.nameLabel.setPosition(other.sprite.x, other.sprite.y - 30);
      if (other.accessory) other.accessory.setPosition(other.sprite.x, other.sprite.y);

      // Pulse animation
      const pulseSpeeds = [0.02, 0.04, 0.08];
      const pulseT = scene.time.now / 1000;
      const pulseSpeed = pulseSpeeds[other.customization.pulse] || 0.04;
      const pulseScale = 1 + Math.sin(pulseT * pulseSpeed * Math.PI * 2) * 0.05;
      other.sprite.setScale(pulseScale);
      if (other.accessory) other.accessory.setScale(pulseScale);
    }
  }
}

function createClickPulse(x, y) {
  if (!scene) return;
  const pulse = scene.add.circle(x, y, 5, 0x00f0ff, 0.4).setDepth(2);
  pulse.setStrokeStyle(2, 0x00f0ff, 0.8);
  scene.tweens.add({
    targets: pulse,
    radius: 18,
    alpha: 0,
    duration: 350,
    ease: 'Quad.easeOut',
    onComplete: () => pulse.destroy()
  });
}

// ═══════════════════════════════════════════════════════
// PLAYER MANAGEMENT
// ═══════════════════════════════════════════════════════

function spawnLocalPlayer(data) {
  if (player) return;
  const cust = data.customization || CUSTOMIZATION;
  myColor = PLAYER_COLORS[cust.colorIdx] || data.color;

  const shapeKey = ['player-circle', 'player-square', 'player-diamond'][cust.shape] || 'player-circle';
  player = scene.physics.add.sprite(data.x, data.y, shapeKey);
  player.setTint(myColor);
  player.setCollideWorldBounds(true);
  player.setDepth(10);

  if (playerAccessory) { playerAccessory.destroy(); playerAccessory = null; }
  if (cust.accessory > 0) {
    const accKeys = ['', 'acc-headphones', 'acc-halo', 'acc-beanie'];
    playerAccessory = scene.add.sprite(data.x, data.y, accKeys[cust.accessory]);
    playerAccessory.setTint(myColor);
    playerAccessory.setDepth(11);
  }

  scene.physics.add.collider(player, scene.wallGroup);
  scene.physics.add.collider(player, scene.furnitureGroup);

  nameLabel = scene.add.text(data.x, data.y - 30, playerName, {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#e0f7ff',
    align: 'center',
    stroke: '#050508',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(12);

  scene.cameras.main.startFollow(player, true, 0.08, 0.08);

  player.setAlpha(0); player.setScale(0.3);
  scene.tweens.add({ targets: [player], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  nameLabel.setAlpha(0);
  scene.tweens.add({ targets: [nameLabel], alpha: 1, duration: 400, delay: 150 });
  if (playerAccessory) {
    playerAccessory.setAlpha(0); playerAccessory.setScale(0.3);
    scene.tweens.add({ targets: [playerAccessory], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  }
}

function spawnOtherPlayer(data) {
  if (data.id === socket.id) return;
  if (otherPlayers.has(data.id)) return;

  const cust = data.customization || { colorIdx: 0, shape: 0, accessory: 0, pulse: 1 };
  const color = PLAYER_COLORS[cust.colorIdx] || data.color;
  const shapeKey = ['player-circle', 'player-square', 'player-diamond'][cust.shape] || 'player-circle';

  const sprite = scene.add.sprite(data.x, data.y, shapeKey);
  sprite.setTint(color);
  sprite.setDepth(5);

  let accessory = null;
  if (cust.accessory > 0) {
    const accKeys = ['', 'acc-headphones', 'acc-halo', 'acc-beanie'];
    accessory = scene.add.sprite(data.x, data.y, accKeys[cust.accessory]);
    accessory.setTint(color);
    accessory.setDepth(6);
  }

  const label = scene.add.text(data.x, data.y - 30, data.strangerName || 'Stranger', {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#8aaabf',
    align: 'center',
    stroke: '#050508',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(7);

  sprite.setAlpha(0); sprite.setScale(0.3);
  scene.tweens.add({ targets: [sprite], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  label.setAlpha(0);
  scene.tweens.add({ targets: [label], alpha: 1, duration: 400, delay: 150 });
  if (accessory) {
    accessory.setAlpha(0); accessory.setScale(0.3);
    scene.tweens.add({ targets: [accessory], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  }

  sprite.setInteractive({ useHandCursor: true });
  sprite.on('pointerdown', (pointer) => {
    vibeTargetId = data.id;
    const screenX = pointer.event.clientX ?? pointer.x;
    const screenY = pointer.event.clientY ?? pointer.y;
    vibeAction.style.left = `${Math.min(screenX + 10, window.innerWidth - 140)}px`;
    vibeAction.style.top  = `${Math.max(screenY - 40, 10)}px`;
    vibeAction.classList.add('visible');
  });

  otherPlayers.set(data.id, {
    sprite,
    accessory,
    nameLabel: label,
    targetX: data.x,
    targetY: data.y,
    revealed: false,
    realName: data.name,
    strangerName: data.strangerName || 'Stranger',
    customization: cust,
  });

  updatePlayerCount();
}

function removeOtherPlayer(id) {
  const other = otherPlayers.get(id);
  if (!other) return;

  const targets = [other.sprite, other.nameLabel];
  if (other.accessory) targets.push(other.accessory);

  scene.tweens.add({
    targets,
    alpha: 0, scale: 0.3, duration: 300, ease: 'Power2',
    onComplete: () => {
      other.sprite.destroy();
      other.nameLabel.destroy();
      if (other.accessory) other.accessory.destroy();
    },
  });

  otherPlayers.delete(id);
  updatePlayerCount();
}

function updatePlayerCount() {
  const total = 1 + otherPlayers.size;
  playerCountText.textContent = total === 1 ? '1 player' : `${total} players`;
}

function renderFurnitureItem(item) {
  if (!scene) return;
  const fp = getClientFootprint(item.t, item.r);
  const x = item.x * 64 + (fp.w * 64) / 2;
  const y = item.y * 64 + (fp.h * 64) / 2;
  const sprite = scene.add.sprite(x, y, `furn-${item.t}`);
  sprite.setDepth(1);
  sprite.setAlpha(0.8);
  sprite.setScale(fp.w, fp.h);
  if (item.r) sprite.setAngle(item.r * 90);
  if (!fp.walkable && scene.furnitureGroup) {
    scene.furnitureGroup.add(sprite);
  }
  roomFurniture.push({ sprite, item, fp });
}

// ═══════════════════════════════════════════════════════
// ROOM MEMORY CARD
// ═══════════════════════════════════════════════════════

const CARD_WIDTH = 320;
const CARD_HEIGHT = 200;
const CARD_DATA_ROW = CARD_HEIGHT - 1;

function generateRoomCard(roomId, furniture, theme) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#050508';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  // Neon border
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, CARD_WIDTH - 8, CARD_HEIGHT - 8);

  // Corner brackets
  ctx.lineWidth = 3;
  const cornerSize = 12;
  // Top-left
  ctx.beginPath(); ctx.moveTo(4, 16); ctx.lineTo(4, 4); ctx.lineTo(16, 4); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(CARD_WIDTH - 4, 16); ctx.lineTo(CARD_WIDTH - 4, 4); ctx.lineTo(CARD_WIDTH - 16, 4); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(4, CARD_HEIGHT - 16); ctx.lineTo(4, CARD_HEIGHT - 4); ctx.lineTo(16, CARD_HEIGHT - 4); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(CARD_WIDTH - 4, CARD_HEIGHT - 16); ctx.lineTo(CARD_WIDTH - 4, CARD_HEIGHT - 4); ctx.lineTo(CARD_WIDTH - 16, CARD_HEIGHT - 4); ctx.stroke();

  // Header text
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ROOM CARD', CARD_WIDTH / 2, 28);

  // Mini grid preview
  const previewX = 80;
  const previewY = 55;
  const previewW = 160;
  const previewH = 96;
  const cellSize = 8;

  // Floor background based on theme
  const themeColors = ['#0a0a12', '#1a0a0a', '#0a1a0a', '#0a0a1a'];
  ctx.fillStyle = themeColors[theme % themeColors.length] || themeColors[0];
  ctx.fillRect(previewX, previewY, previewW, previewH);

  // Grid lines
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx <= previewW; gx += cellSize) {
    ctx.beginPath(); ctx.moveTo(previewX + gx, previewY); ctx.lineTo(previewX + gx, previewY + previewH); ctx.stroke();
  }
  for (let gy = 0; gy <= previewH; gy += cellSize) {
    ctx.beginPath(); ctx.moveTo(previewX, previewY + gy); ctx.lineTo(previewX + previewW, previewY + gy); ctx.stroke();
  }

  // Draw furniture icons on preview
  const furniturePreviewColors = [
    '#00f0ff', '#ff00ff', '#39ff14', '#ff007f',
    '#ffff00', '#ff8800', '#bd00ff', '#0088ff'
  ];
  if (furniture) {
    furniture.forEach(item => {
      const px = previewX + item.x * cellSize;
      const py = previewY + item.y * cellSize;
      const fp = getClientFootprint(item.t, item.r);
      ctx.fillStyle = furniturePreviewColors[item.t % furniturePreviewColors.length];
      ctx.globalAlpha = 0.6;
      ctx.fillRect(px, py, fp.w * cellSize, fp.h * cellSize);
      ctx.globalAlpha = 1.0;
    });
  }

  // Footer branding
  ctx.fillStyle = '#445566';
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('FreeLobby', CARD_WIDTH - 12, CARD_HEIGHT - 12);

  // ─── Encode data strip in bottom pixel row ───
  // We use 2 pixels per item to avoid alpha=0 corruption.
  // Format: [version][theme][0][255] [count][0][0][255] [t][x][y][255] [r][layer][0][255] ...
  const imgData = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const data = imgData.data;
  const rowOffset = CARD_DATA_ROW * CARD_WIDTH * 4;

  // Pixel 0: version + theme
  data[rowOffset + 0] = 1; // version
  data[rowOffset + 1] = theme || 0;
  data[rowOffset + 2] = 0;
  data[rowOffset + 3] = 255;

  // Pixel 1: count
  const count = furniture ? furniture.length : 0;
  data[rowOffset + 4] = count;
  data[rowOffset + 5] = 0;
  data[rowOffset + 6] = 0;
  data[rowOffset + 7] = 255;

  // Pixels 2...N: each furniture item (2 pixels each)
  if (furniture) {
    console.log('[CardEncode] encoding', furniture.length, 'items');
    furniture.forEach((item, i) => {
      const dataOff = rowOffset + (i * 2 + 2) * 4;
      data[dataOff + 0] = item.t;
      data[dataOff + 1] = item.x;
      data[dataOff + 2] = item.y;
      data[dataOff + 3] = 255;

      const metaOff = rowOffset + (i * 2 + 3) * 4;
      data[metaOff + 0] = item.r || 0;
      data[metaOff + 1] = item.layer || 0;
      data[metaOff + 2] = 0;
      data[metaOff + 3] = 255;

      console.log(`[CardEncode] item ${i}: t=${item.t} x=${item.x} y=${item.y} r=${item.r} layer=${item.layer}`);
    });
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

function decodeRoomCard(imageFile, callback) {
  const img = new Image();
  const reader = new FileReader();

  reader.onload = (e) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = CARD_WIDTH;
      canvas.height = CARD_HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0, CARD_WIDTH, CARD_HEIGHT);

      try {
        const imgData = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
        const data = imgData.data;
        const rowOffset = CARD_DATA_ROW * CARD_WIDTH * 4;

        const version = data[rowOffset + 0];
        console.log('[CardDecode] version:', version, 'first bytes:', data[rowOffset], data[rowOffset+1], data[rowOffset+2], data[rowOffset+3]);
        if (version !== 1) {
          callback(null, 'Unknown card version or corrupted data.');
          return;
        }

        const theme = data[rowOffset + 1];
        const count = data[rowOffset + 4];
        console.log('[CardDecode] theme:', theme, 'count:', count);

        if (count > 100) {
          callback(null, 'Card contains too many items (max 100).');
          return;
        }

        const furniture = [];
        for (let i = 0; i < count; i++) {
          const dataOff = rowOffset + (i * 2 + 2) * 4;
          const metaOff = rowOffset + (i * 2 + 3) * 4;
          const t = data[dataOff + 0];
          const x = data[dataOff + 1];
          const y = data[dataOff + 2];
          const r = data[metaOff + 0];
          const layer = data[metaOff + 1];
          console.log(`[CardDecode] item ${i}: t=${t} x=${x} y=${y} r=${r} layer=${layer}`);
          furniture.push({ t, x, y, r, layer });
        }

        callback({ theme, furniture }, null);
      } catch (err) {
        console.error('[CardDecode] error:', err);
        callback(null, 'Failed to decode card data.');
      }
    };
    img.onerror = () => callback(null, 'Failed to load image.');
    img.src = e.target.result;
  };

  reader.onerror = () => callback(null, 'Failed to read image file.');
  reader.readAsDataURL(imageFile);
}

// ═══════════════════════════════════════════════════════
// EMOTE & SIGN DISPLAY
// ═══════════════════════════════════════════════════════

function showEmoteBubble(targetSprite, emote) {
  if (!scene || !targetSprite) return;

  const bubble = scene.add.text(
    targetSprite.x, targetSprite.y - 50, emote,
    { fontSize: '28px', align: 'center' }
  ).setOrigin(0.5).setDepth(100);

  bubble.setScale(0.2); bubble.setAlpha(0);
  scene.tweens.add({
    targets: bubble, scale: 1, alpha: 1,
    y: targetSprite.y - 70, duration: 300, ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: bubble, alpha: 0, y: bubble.y - 20,
        duration: 600, delay: 1800, ease: 'Power2',
        onComplete: () => bubble.destroy(),
      });
    },
  });
}

function showSignBubble(targetSprite, text) {
  if (!scene || !targetSprite) return;

  const label = scene.add.text(
    targetSprite.x, targetSprite.y - 55, text,
    {
      fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#f1f5f9',
      backgroundColor: '#18181acc',
      padding: { x: 8, y: 4 }, stroke: '#222224', strokeThickness: 1,
    }
  ).setOrigin(0.5).setDepth(100);

  label.setScale(0.5); label.setAlpha(0);
  scene.tweens.add({
    targets: label, scale: 1, alpha: 1,
    y: targetSprite.y - 65, duration: 250, ease: 'Back.easeOut',
    onComplete: () => {
      const followTimer = scene.time.addEvent({
        delay: 16, repeat: 250,
        callback: () => {
          if (targetSprite && targetSprite.active) label.setPosition(targetSprite.x, targetSprite.y - 65);
        },
      });
      scene.tweens.add({
        targets: label, alpha: 0, delay: 3500, duration: 500, ease: 'Power2',
        onComplete: () => { followTimer.remove(); label.destroy(); },
      });
    },
  });
}

function getSpriteForPlayer(playerId) {
  if (socket && playerId === socket.id) return player;
  const other = otherPlayers.get(playerId);
  return other ? other.sprite : null;
}

// ═══════════════════════════════════════════════════════
// VIBE CHECK — NAME REVEAL
// ═══════════════════════════════════════════════════════

function revealPlayerName(playerId, name) {
  const other = otherPlayers.get(playerId);
  if (!other) return;

  other.revealed = true;
  other.realName = name;

  // Animate name label change
  scene.tweens.add({
    targets: other.nameLabel,
    alpha: 0,
    duration: 200,
    onComplete: () => {
      other.nameLabel.setText(name);
      other.nameLabel.setColor('#e0f7ff'); // brighter, like local player
      scene.tweens.add({ targets: other.nameLabel, alpha: 1, duration: 300 });
    },
  });

  // Show a sparkle effect on the revealed player
  showEmoteBubble(other.sprite, '✨');

  // Unlock typing input for local player
  signInput.disabled = false;
  signSendBtn.disabled = false;
  signInput.placeholder = 'Say something…';
}

// ═══════════════════════════════════════════════════════
// SOCKET.IO
// ═══════════════════════════════════════════════════════

function connectSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('✦ Connected to FreeLobby server:', socket.id);
    setConnectionStatus(true);

    if (joinMode === 'random') socket.emit('joinRandomRoom', { name: playerName, customization: CUSTOMIZATION });
    else if (joinMode === 'create') socket.emit('createRoom', { name: playerName, customization: CUSTOMIZATION, isPublic: createRoomPublic });
    else if (joinMode === 'code') socket.emit('joinRoom', { roomId: joinRoomCode, name: playerName, customization: CUSTOMIZATION });
  });

  socket.on('roomJoined', ({ roomId, you, players, isOwner, isPublic, furniture, theme }) => {
    currentRoomId = roomId;
    roomIdDisplay.textContent = roomId;
    isRoomOwner = !!isOwner;
    roomTheme = theme || 0;
    if (isRoomOwner) { ownerBadge.classList.add('visible'); buildBtn.classList.add('visible'); }
    else { ownerBadge.classList.remove('visible'); buildBtn.classList.remove('visible'); buildBtn.classList.remove('active'); furniturePanel.classList.remove('visible'); buildMode = false; }
    console.log(`✦ Joined room ${roomId}. Local player: ${you.name}. Owner: ${isRoomOwner}. Public: ${isPublic !== false}. Theme: ${roomTheme}.`);

    // Clean up previous room state if fleeing
    for (const [id, _] of otherPlayers) {
      removeOtherPlayer(id);
    }
    roomFurniture.forEach(f => {
      if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
    });
    roomFurniture = [];
    if (furniture) furniture.forEach(item => renderFurnitureItem(item));

    if (player) {
      // Reposition and update color for local player
      player.setPosition(you.x, you.y);
      player.setTint(you.color);
      myColor = you.color;
      if (nameLabel) nameLabel.setPosition(you.x, you.y - 30);
      if (playerAccessory) playerAccessory.setPosition(you.x, you.y);
    } else {
      spawnLocalPlayer(you);
    }

    for (const [id, pData] of Object.entries(players)) {
      if (id !== socket.id) spawnOtherPlayer(pData);
    }
    updatePlayerCount();
  });

  socket.on('playerJoined', (data) => {
    console.log(`✦ Player joined: ${data.strangerName || 'Stranger'} [${data.id}]`);
    spawnOtherPlayer(data);
  });

  socket.on('playerLeft', ({ id }) => {
    console.log(`✧ Player left: [${id}]`);
    removeOtherPlayer(id);
  });

  socket.on('playerMoved', ({ id, x, y }) => {
    const other = otherPlayers.get(id);
    if (other) { other.targetX = x; other.targetY = y; }
  });

  // ── Phase 3: Emotes & Signs ──
  socket.on('playerEmote', ({ id, emote }) => {
    const sprite = getSpriteForPlayer(id);
    if (sprite) showEmoteBubble(sprite, emote);
  });

  socket.on('playerSign', ({ id, text }) => {
    const sprite = getSpriteForPlayer(id);
    if (sprite) showSignBubble(sprite, text);
  });

  // ── Phase 4: Vibe Check ──
  socket.on('vibeCheckPrompt', ({ fromId }) => {
    // Someone wants to vibe check us
    vibePromptFromId = fromId;
    
    // Update prompt text with the stranger's name
    const other = otherPlayers.get(fromId);
    if (other) {
      const displayName = other.revealed ? other.realName : other.strangerName;
      document.getElementById('vibe-prompt-text').innerText = `${displayName} initiated a vibe check, do you wish to allow chat and share names with this user?`;
    }
    
    vibePrompt.classList.add('visible');

    // Auto-dismiss after 15s if no response
    setTimeout(() => {
      if (vibePromptFromId === fromId) {
        vibePrompt.classList.remove('visible');
        vibePromptFromId = null;
      }
    }, 15000);
  });

  socket.on('vibeCheckRevealed', ({ playerId, name }) => {
    // Mutual name reveal!
    revealPlayerName(playerId, name);
  });

  socket.on('furniturePlaced', ({ item }) => {
    renderFurnitureItem(item);
  });

  socket.on('furnitureRemoved', ({ index }) => {
    if (index >= 0 && index < roomFurniture.length) {
      const f = roomFurniture[index];
      if (scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
      roomFurniture.splice(index, 1);
    }
  });

  socket.on('roomFurnitureReset', ({ furniture, theme }) => {
    roomFurniture.forEach(f => {
      if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
    });
    roomFurniture = [];
    if (furniture) furniture.forEach(item => renderFurnitureItem(item));
    if (typeof theme === 'number') roomTheme = theme;
  });

  socket.on('roomThemeChanged', ({ theme }) => {
    if (typeof theme === 'number') roomTheme = theme;
  });

  socket.on('error', ({ message }) => {
    showError(message);
    exitGame();
  });

  socket.on('disconnect', () => {
    console.log('✧ Disconnected from server');
    setConnectionStatus(false);
  });
}

function setConnectionStatus(connected) {
  if (connected) {
    statusDot.classList.remove('disconnected');
    statusText.textContent = 'Connected';
  } else {
    statusDot.classList.add('disconnected');
    statusText.textContent = 'Reconnecting…';
  }
}
