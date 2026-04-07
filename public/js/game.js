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

let game = null;
let socket = null;
let playerName = 'Stranger';
let currentRoomId = null;
let joinMode = 'random';
let joinRoomCode = '';

// Vibe Check state
let vibeTargetId = null;     // who we clicked on
let vibePromptFromId = null; // who is requesting a vibe check on us

// ─── Landing UI Logic ──────────────────────────────────

btnToggleSpecific.addEventListener('click', () => {
  joinSpecificPanel.classList.toggle('open');
  roomCodeInput.focus();
});

roomCodeInput.addEventListener('input', () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

// ─── Enter / Exit Game ─────────────────────────────────

function enterGame(mode, roomCode) {
  playerName = nameInput.value.trim() || 'Stranger';
  joinMode = mode;
  joinRoomCode = roomCode || '';

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

  if (game) { game.destroy(true); game = null; }
  if (socket) { socket.disconnect(); socket = null; }

  currentRoomId = null;
  roomIdDisplay.textContent = '----';
  otherPlayers.clear();
  player = null;
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
    socket.emit('fleeRoom', { name: playerName });
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

function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.add('visible');
  setTimeout(() => errorToast.classList.remove('visible'), 3500);
}

// ─── Emote & Sign UI ──────────────────────────────────

emoteToggle.addEventListener('click', () => emoteGrid.classList.toggle('open'));

emoteGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.emote-btn');
  if (!btn) return;
  if (socket && socket.connected) socket.emit('sendEmote', { emote: btn.dataset.emote });
  emoteGrid.classList.remove('open');
});

signSendBtn.addEventListener('click', sendSign);
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

// ─── Vibe Check UI ─────────────────────────────────────

// "✦ Vibe Check" button in the action popup
vibeActionBtn.addEventListener('click', () => {
  if (vibeTargetId && socket && socket.connected) {
    socket.emit('vibeCheckRequest', { targetId: vibeTargetId });
    vibeAction.classList.remove('visible');

    // Show brief feedback
    showEmoteBubble(player, '✦');
  }
});

// Close action popup when clicking elsewhere
document.addEventListener('pointerdown', (e) => {
  if (!vibeAction.contains(e.target)) {
    vibeAction.classList.remove('visible');
    vibeTargetId = null;
  }
});

// Accept vibe check prompt
vibeAcceptBtn.addEventListener('click', () => {
  if (vibePromptFromId && socket && socket.connected) {
    socket.emit('vibeCheckRespond', { fromId: vibePromptFromId, accepted: true });
  }
  vibePrompt.classList.remove('visible');
  vibePromptFromId = null;
});

// Decline vibe check prompt
vibeDeclineBtn.addEventListener('click', () => {
  if (vibePromptFromId && socket && socket.connected) {
    socket.emit('vibeCheckRespond', { fromId: vibePromptFromId, accepted: false });
  }
  vibePrompt.classList.remove('visible');
  vibePromptFromId = null;
});

// ─── Made with Love Modal ──────────────────────────────

loveBtn.addEventListener('click', () => loveModal.classList.add('visible'));
loveModalClose.addEventListener('click', () => loveModal.classList.remove('visible'));
loveModal.addEventListener('click', (e) => {
  if (e.target === loveModal) loveModal.classList.remove('visible');
});

// ═══════════════════════════════════════════════════════
// PHASER CONFIG
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
  backgroundColor: '#0c0c0e',
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

// Other players: Map<socketId, { sprite, nameLabel, targetX, targetY, revealed }>
const otherPlayers = new Map();

let lastSendTime = 0;
let lastX = -1;
let lastY = -1;

let scene;

// ═══════════════════════════════════════════════════════
// SCENE FUNCTIONS
// ═══════════════════════════════════════════════════════

function preload() {
  scene = this;

  const gfx = this.make.graphics({ add: false });
  gfx.fillStyle(0xffffff, 0.15); gfx.fillCircle(24, 24, 24);
  gfx.fillStyle(0xffffff, 0.3);  gfx.fillCircle(24, 24, 18);
  gfx.fillStyle(0xffffff, 1);    gfx.fillCircle(24, 24, 12);
  gfx.fillStyle(0xffffff, 0.7);  gfx.fillCircle(22, 20, 5);
  gfx.generateTexture('player-sprite', 48, 48);
  gfx.destroy();

  const floor = this.make.graphics({ add: false });
  floor.fillStyle(0x18181a, 1); floor.fillRect(0, 0, 64, 64);
  floor.lineStyle(1, 0x222224, 0.4); floor.strokeRect(0, 0, 64, 64);
  floor.generateTexture('floor-tile', 64, 64);
  floor.destroy();

  const wall = this.make.graphics({ add: false });
  wall.fillStyle(0x222224, 1); wall.fillRect(0, 0, 64, 64);
  wall.lineStyle(2, 0x2a2a2e, 0.6); wall.strokeRect(0, 0, 64, 64);
  wall.generateTexture('wall-tile', 64, 64);
  wall.destroy();
}

function create() {
  scene = this;

  for (let x = 0; x < WORLD_WIDTH; x += 64) {
    for (let y = 0; y < WORLD_HEIGHT; y += 64) {
      this.add.image(x + 32, y + 32, 'floor-tile');
    }
  }

  const wallGroup = this.physics.add.staticGroup();
  for (let x = 0; x < WORLD_WIDTH; x += 64) {
    wallGroup.add(this.add.image(x + 32, 0, 'wall-tile'));
    wallGroup.add(this.add.image(x + 32, WORLD_HEIGHT, 'wall-tile'));
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 64) {
    wallGroup.add(this.add.image(0, y + 32, 'wall-tile'));
    wallGroup.add(this.add.image(WORLD_WIDTH, y + 32, 'wall-tile'));
  }

  player = null;

  this.cameras.main.setBackgroundColor('#0c0c0e');
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

  this.input.on('pointerup', (pointer) => {
    if (pointer.event.target.tagName !== 'CANVAS') return;
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
    }
  }
}

function createClickPulse(x, y) {
  if (!scene) return;
  const pulse = scene.add.circle(x, y, 5, 0xffffff, 0.4).setDepth(2);
  pulse.setStrokeStyle(2, 0xffffff, 0.8);
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
  myColor = data.color;

  player = scene.physics.add.sprite(data.x, data.y, 'player-sprite');
  player.setTint(data.color);
  player.setCollideWorldBounds(true);
  player.setDepth(10);

  scene.physics.add.collider(player, scene.wallGroup);

  // Local player sees own real name
  nameLabel = scene.add.text(data.x, data.y - 30, playerName, {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#e2e8f0',
    align: 'center',
    stroke: '#0c0c0e',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(11);

  scene.cameras.main.startFollow(player, true, 0.08, 0.08);

  player.setAlpha(0); player.setScale(0.3);
  scene.tweens.add({ targets: [player], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  nameLabel.setAlpha(0);
  scene.tweens.add({ targets: [nameLabel], alpha: 1, duration: 400, delay: 150 });
}

function spawnOtherPlayer(data) {
  if (data.id === socket.id) return;
  if (otherPlayers.has(data.id)) return;

  const sprite = scene.add.sprite(data.x, data.y, 'player-sprite');
  sprite.setTint(data.color);
  sprite.setDepth(5);

  // Others appear as "Stranger" until vibe check is accepted
  const label = scene.add.text(data.x, data.y - 30, 'Stranger', {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    color: '#94a3b8',
    align: 'center',
    stroke: '#0c0c0e',
    strokeThickness: 3,
  }).setOrigin(0.5).setDepth(6);

  // Entrance animation
  sprite.setAlpha(0); sprite.setScale(0.3);
  scene.tweens.add({ targets: [sprite], alpha: 1, scale: 1, duration: 400, ease: 'Back.easeOut' });
  label.setAlpha(0);
  scene.tweens.add({ targets: [label], alpha: 1, duration: 400, delay: 150 });

  // Make sprite interactive — clicking opens Vibe Check popup
  sprite.setInteractive({ useHandCursor: true });
  sprite.on('pointerdown', (pointer) => {
    vibeTargetId = data.id;

    // Position the popup near the click, but offset to avoid overlap
    const screenX = pointer.event.clientX;
    const screenY = pointer.event.clientY;
    vibeAction.style.left = `${screenX + 10}px`;
    vibeAction.style.top  = `${screenY - 40}px`;
    vibeAction.classList.add('visible');
  });

  otherPlayers.set(data.id, {
    sprite,
    nameLabel: label,
    targetX: data.x,
    targetY: data.y,
    revealed: false,
    realName: data.name,
  });

  updatePlayerCount();
}

function removeOtherPlayer(id) {
  const other = otherPlayers.get(id);
  if (!other) return;

  scene.tweens.add({
    targets: [other.sprite, other.nameLabel],
    alpha: 0, scale: 0.3, duration: 300, ease: 'Power2',
    onComplete: () => { other.sprite.destroy(); other.nameLabel.destroy(); },
  });

  otherPlayers.delete(id);
  updatePlayerCount();
}

function updatePlayerCount() {
  const total = 1 + otherPlayers.size;
  playerCountText.textContent = total === 1 ? '1 player' : `${total} players`;
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
      other.nameLabel.setColor('#e2e8f0'); // brighter, like local player
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

    if (joinMode === 'random') socket.emit('joinRandomRoom', { name: playerName });
    else if (joinMode === 'create') socket.emit('createRoom', { name: playerName });
    else if (joinMode === 'code') socket.emit('joinRoom', { roomId: joinRoomCode, name: playerName });
  });

  socket.on('roomJoined', ({ roomId, you, players }) => {
    currentRoomId = roomId;
    roomIdDisplay.textContent = roomId;
    console.log(`✦ Joined room ${roomId}`, players);

    // Clean up previous room state if fleeing
    for (const [id, _] of otherPlayers) {
      removeOtherPlayer(id);
    }

    if (player) {
      // Reposition and update color for local player
      player.setPosition(you.x, you.y);
      player.setTint(you.color);
      myColor = you.color;
      if (nameLabel) nameLabel.setPosition(you.x, you.y - 30);
    } else {
      spawnLocalPlayer(you);
    }

    for (const [id, pData] of Object.entries(players)) {
      if (id !== socket.id) spawnOtherPlayer(pData);
    }
    updatePlayerCount();
  });

  socket.on('playerJoined', (data) => {
    console.log(`✦ Player joined: ${data.name} [${data.id}]`);
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
