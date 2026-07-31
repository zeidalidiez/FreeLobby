/* ═══════════════════════════════════════════════════════
   FreeLobby — Game Client (Phase 4: Vibe Check & Polish)
   ═══════════════════════════════════════════════════════ */

// ─── DOM References ────────────────────────────────────
const landingScreen      = document.getElementById('landing-screen');
const gameContainer      = document.getElementById('game-container');
const shellController    = shellState.createShellController(landingScreen, gameContainer);
const connectionStatus   = document.getElementById('connection-status');
const statusDot          = document.querySelector('.status-dot');
const statusText         = document.getElementById('status-text');
const backBtn            = document.getElementById('back-btn');
const nameInput          = document.getElementById('player-name');
const btnEnter           = document.getElementById('btn-enter');
const btnJoin            = document.getElementById('btn-join');
const btnCreate          = document.getElementById('btn-create');
const commonRoomsContainer = document.getElementById('common-rooms');
const publicRoomsContainer = document.getElementById('public-rooms');
const publicRoomsSection   = document.getElementById('public-rooms-section');
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
const srAnnouncer        = document.getElementById('sr-announcer');

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
const muteActionBtn = document.getElementById('mute-action-btn');
const vibePrompt    = document.getElementById('vibe-prompt');
const vibeAcceptBtn = document.getElementById('vibe-accept');
const vibeDeclineBtn = document.getElementById('vibe-decline');
const loveBtn       = document.getElementById('love-btn');
const loveModal     = document.getElementById('love-modal');
const loveModalClose = document.getElementById('love-modal-close');

const ownerBadge    = document.getElementById('owner-badge');
const quietBtn      = document.getElementById('quiet-btn');
const ambientPanel  = document.getElementById('ambient-panel');
const ambientMuteBtn = document.getElementById('ambient-mute');
const ambientTrackBtns = document.querySelectorAll('.ambient-track-btn');
const musicBtn      = document.getElementById('music-btn');
const musicPanel    = document.getElementById('music-panel');
const musicCloseBtn = document.getElementById('music-close');
const musicPlayBtn  = document.getElementById('music-play');
const musicBpmInput = document.getElementById('music-bpm');
const musicBpmLabel = document.getElementById('music-bpm-label');
const musicGrid     = document.getElementById('music-grid');
const bookmarkBtn   = document.getElementById('bookmark-btn');
const bookmarksList = document.getElementById('bookmarks-list');
const zoomInBtn     = document.getElementById('zoom-in');
const zoomOutBtn    = document.getElementById('zoom-out');
const zoomControls  = document.getElementById('zoom-controls');

let game = null;
let socket = null;
let playerName = 'Stranger';
let currentRoomId = null;
let joinMode = null;
let joinRoomCode = '';
let isRoomOwner = false;
let currentRoomIsPublic = true;
let quietMode = false;
const idleState = window.FreeLobbyIdle;
const furnitureCatalog = window.FreeLobbyFurniture;
const roomStyles = window.FreeLobbyRoomStyles;
const craftTextures = window.FreeLobbyCraft;
const cardCodec = window.FreeLobbyCards;

// Ambient Audio state
let ambientAudioCtx = null;
let ambientMasterGain = null;
let ambientCurrentNodes = [];
let ambientMuted = false;
let ambientTrack = 0;

// Music Maker state
const SEQ_ROWS = 4;
const SEQ_COLS = 4;
let seqGrid = Array.from({ length: SEQ_ROWS }, () => Array(SEQ_COLS).fill(false));
let seqPlaying = false;
let seqBpm = 120;
let seqCurrentBeat = 0;
let seqInterval = null;
let seqAudioCtx = null;

// Vibe Check state
let vibeTargetId = null;     // who we clicked on
let vibePromptFromId = null; // who is requesting a vibe check on us

// Phase 2 — Character Customization
const btnToggleCustomize = document.getElementById('btn-toggle-customize');
const customizePanel     = document.getElementById('customize-panel');
const avatarPreview      = document.getElementById('avatar-preview');
const btnRandomizeAvatar = document.getElementById('btn-randomize-avatar');
const btnResetAvatar     = document.getElementById('btn-reset-avatar');
const colorSwatches      = document.getElementById('color-swatches');
const shapeBtns          = document.getElementById('shape-btns');
const eyeBtns            = document.getElementById('eyes-btns');
const browBtns           = document.getElementById('brows-btns');
const mouthBtns          = document.getElementById('mouth-btns');
const detailBtns         = document.getElementById('detail-btns');
const accBtns            = document.getElementById('acc-btns');
const pulseSlider        = document.getElementById('pulse-slider');
const avatarHashInput    = document.getElementById('avatar-hash');
const btnCopyHash        = document.getElementById('btn-copy-hash');
const importHashInput    = document.getElementById('import-hash');
const btnImportHash      = document.getElementById('btn-import-hash');

const PLAYER_COLORS = [
  0x2db8b2, 0xd85a9a, 0x74b84d, 0xd94d77, 0xdfba3e,
  0xdc773c, 0x9d62c4, 0x4c7dcc, 0xd65b52, 0x34ae88,
];
const COLOR_HEX_STR = [
  '#2db8b2', '#d85a9a', '#74b84d', '#d94d77', '#dfba3e',
  '#dc773c', '#9d62c4', '#4c7dcc', '#d65b52', '#34ae88',
];

const ROOM_THEME_VISUALS = craftTextures.THEME_PALETTES;

function getRoomVisualTheme(theme) {
  if (theme && typeof theme === 'object') return roomStyles.paletteForStyle(theme);
  if (!Number.isInteger(theme) || theme < 0) return ROOM_THEME_VISUALS[0];
  return ROOM_THEME_VISUALS[theme % ROOM_THEME_VISUALS.length] || ROOM_THEME_VISUALS[0];
}

function setExpandedPanel(trigger, panel, visible) {
  if (!panel) return;
  panel.classList.toggle('visible', visible);
  panel.setAttribute('aria-hidden', String(!visible));
  if (trigger) {
    trigger.classList.toggle('active', visible);
    trigger.setAttribute('aria-expanded', String(visible));
    trigger.setAttribute('aria-pressed', String(visible));
  }
}

function refreshInterfaceIcons() {
  if (!window.lucide || typeof window.lucide.createIcons !== 'function') return;
  window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
  document.body.classList.add('lucide-ready');
}

function setIconButtonContent(button, icon, label = '', fallback = '') {
  if (!button) return;
  const iconFallback = fallback ? `<span class="icon-fallback" aria-hidden="true">${escapeHtml(fallback)}</span>` : '';
  const textLabel = label ? `<span>${escapeHtml(label)}</span>` : '';
  button.innerHTML = `${iconFallback}<i data-lucide="${icon}" aria-hidden="true"></i>${textLabel}`;
  refreshInterfaceIcons();
}

function setBookmarkButtonState(isBookmarked) {
  bookmarkBtn.classList.toggle('active', isBookmarked);
  bookmarkBtn.title = isBookmarked ? 'Remove bookmark' : 'Bookmark this room';
  bookmarkBtn.setAttribute('aria-pressed', String(isBookmarked));
  setIconButtonContent(bookmarkBtn, 'star', '', isBookmarked ? '★' : '☆');
}

function installInterfaceIcons() {
  const iconButtons = [
    ['btn-enter', 'sparkles', 'Enter The Lobby', '✦'],
    ['btn-create', 'plus', 'Create Private Room', '+'],
    ['btn-join', 'shuffle', 'Go to a Random Room', '↝'],
    ['btn-toggle-specific', 'key-round', 'Have a Room Code?', ''],
    ['btn-toggle-customize', 'palette', 'Customize Avatar', ''],
    ['back-btn', 'arrow-left', 'Lobby', '←'],
    ['flee-btn', 'door-open', 'Empty room', ''],
    ['quiet-btn', 'moon', 'Quiet', ''],
    ['build-btn', 'hammer', 'Build', ''],
    ['emote-toggle', 'smile', '', '☺'],
    ['music-btn', 'music-2', '', '♪'],
    ['love-btn', 'heart', '', '♥'],
    ['zoom-in', 'plus', '', '+'],
    ['zoom-out', 'minus', '', '-'],
    ['sign-send', 'arrow-up', '', '↑'],
    ['tool-rotate', 'rotate-cw', 'Rotate', '↻'],
    ['tool-place', 'check', 'Place', '+'],
    ['tool-remove', 'eraser', 'Remove', '-'],
    ['music-close', 'x', '', '×'],
  ];
  for (const [id, icon, label, fallback] of iconButtons) {
    setIconButtonContent(document.getElementById(id), icon, label, fallback);
  }
  setBookmarkButtonState(false);
  setIconButtonContent(copyRoomBtn, 'copy', '', '⧉');
  setIconButtonContent(ambientMuteBtn, ambientMuted ? 'volume-x' : 'volume-2', '', ambientMuted ? '×' : '◉');
  setIconButtonContent(musicPlayBtn, 'play', '', '▶');
  refreshInterfaceIcons();
}

installInterfaceIcons();

// ── Ambient Audio Engine ──
function ensureAudioContext() {
  if (!ambientAudioCtx) {
    ambientAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    ambientMasterGain = ambientAudioCtx.createGain();
    ambientMasterGain.gain.value = ambientMuted ? 0 : 0.15;
    ambientMasterGain.connect(ambientAudioCtx.destination);
  }
  if (ambientAudioCtx.state === 'suspended') {
    ambientAudioCtx.resume();
  }
}

function stopAmbient() {
  for (const node of ambientCurrentNodes) {
    try { node.stop && node.stop(); node.disconnect(); } catch (e) {}
  }
  ambientCurrentNodes = [];
}

function startAmbientRain() {
  ensureAudioContext();
  stopAmbient();
  const bufferSize = 2 * ambientAudioCtx.sampleRate;
  const buffer = ambientAudioCtx.createBuffer(1, bufferSize, ambientAudioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ambientAudioCtx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const filter = ambientAudioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 400;
  const gain = ambientAudioCtx.createGain();
  gain.gain.value = 1.0;
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ambientMasterGain);
  noise.start();
  ambientCurrentNodes.push(noise, filter, gain);
}

function startAmbientDrone() {
  ensureAudioContext();
  stopAmbient();
  const freqs = [55, 110, 165];
  for (const f of freqs) {
    const osc = ambientAudioCtx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const gain = ambientAudioCtx.createGain();
    gain.gain.value = 0.12;
    osc.connect(gain);
    gain.connect(ambientMasterGain);
    osc.start();
    ambientCurrentNodes.push(osc, gain);
  }
}

function setAmbientTrack(track) {
  ambientTrack = track;
  if (track === 1) startAmbientRain();
  else if (track === 2) startAmbientDrone();
  else stopAmbient();
  // Update UI
  ambientTrackBtns.forEach(btn => {
    const t = Number(btn.dataset.track);
    const isActive = t === track;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });
}

function setAmbientMuted(muted) {
  ambientMuted = muted;
  if (ambientMasterGain) {
    ambientMasterGain.gain.setTargetAtTime(muted ? 0 : 0.15, ambientAudioCtx.currentTime, 0.3);
  }
  ambientMuteBtn.classList.toggle('muted', muted);
  setIconButtonContent(ambientMuteBtn, muted ? 'volume-x' : 'volume-2', '', muted ? '×' : '◉');
  ambientMuteBtn.setAttribute('aria-pressed', String(muted));
}

// ── Music Maker ──
function ensureSeqAudio() {
  if (!seqAudioCtx) {
    seqAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (seqAudioCtx.state === 'suspended') seqAudioCtx.resume();
}

function seqPlayNote(row, time) {
  ensureSeqAudio();
  const osc = seqAudioCtx.createOscillator();
  const gain = seqAudioCtx.createGain();
  gain.connect(seqAudioCtx.destination);
  osc.connect(gain);

  if (row === 0) {
    // Kick
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.15);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
    osc.start(time);
    osc.stop(time + 0.15);
  } else if (row === 1) {
    // Snare
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(250, time);
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    osc.start(time);
    osc.stop(time + 0.1);
  } else if (row === 2) {
    // Hi-hat
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, time);
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
    osc.start(time);
    osc.stop(time + 0.05);
  } else if (row === 3) {
    // Synth
    osc.type = 'sine';
    const freqs = [261.63, 329.63, 392.00, 523.25];
    osc.frequency.setValueAtTime(freqs[seqCurrentBeat % 4], time);
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
  }
}

function seqTick() {
  if (!seqPlaying) return;
  const now = seqAudioCtx ? seqAudioCtx.currentTime : 0;
  for (let r = 0; r < SEQ_ROWS; r++) {
    if (seqGrid[r][seqCurrentBeat]) {
      seqPlayNote(r, now);
    }
  }
  // Visual beat indicator
  const cells = musicGrid.querySelectorAll('.music-cell');
  cells.forEach((c, i) => {
    const col = i % SEQ_COLS;
    c.classList.toggle('beat', col === seqCurrentBeat);
  });
  seqCurrentBeat = (seqCurrentBeat + 1) % SEQ_COLS;
}

function seqStart() {
  ensureSeqAudio();
  seqPlaying = true;
  setIconButtonContent(musicPlayBtn, 'pause', '', '⏸');
  musicPlayBtn.classList.add('playing');
  const ms = (60 / seqBpm) * 1000 / 2; // 8th notes feel for 4-step
  seqInterval = setInterval(seqTick, ms);
}

function seqStop() {
  seqPlaying = false;
  setIconButtonContent(musicPlayBtn, 'play', '', '▶');
  musicPlayBtn.classList.remove('playing');
  if (seqInterval) { clearInterval(seqInterval); seqInterval = null; }
  const cells = musicGrid.querySelectorAll('.music-cell');
  cells.forEach(c => c.classList.remove('beat'));
}

function buildMusicGrid() {
  musicGrid.innerHTML = '';
  for (let r = 0; r < SEQ_ROWS; r++) {
    for (let c = 0; c < SEQ_COLS; c++) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'music-cell';
      cell.setAttribute('role', 'gridcell');
      cell.setAttribute('aria-label', `Track ${r + 1}, step ${c + 1}`);
      cell.setAttribute('aria-pressed', String(seqGrid[r][c]));
      if (seqGrid[r][c]) cell.classList.add('active');
      cell.dataset.row = r;
      cell.dataset.col = c;
      cell.addEventListener('click', () => {
        seqGrid[r][c] = !seqGrid[r][c];
        cell.classList.toggle('active', seqGrid[r][c]);
        cell.setAttribute('aria-pressed', String(seqGrid[r][c]));
      });
      musicGrid.appendChild(cell);
    }
  }
}

const DEFAULT_CUSTOMIZATION = Object.freeze({
  colorIdx: 0,
  shape: 0,
  accessory: 0,
  pulse: 1,
  eyes: 3,
  brows: 0,
  mouth: 0,
  detail: 1,
});
const AVATAR_GLYPHS = Object.freeze({
  shape: ['●', '■', '◆', '♥', '✿'],
  eyes: ['••', '⌒⌒', '◉◉', '^^', '•⌒', '××'],
  brows: ['⌒', '—', '⌃', '╱╲', '▬'],
  mouth: ['⌣', '◡', '—', '○', '⌁', '⌢'],
  detail: ['–', '∴', '●', '〰', '•', '┄'],
  accessory: ['–', '🎧', '◯', '▰', '⋈', '✿', '⌐', '❧'],
});
const AVATAR_GROUPS = [
  { element: shapeBtns, field: 'shape', names: craftTextures.SHAPE_NAMES, className: 'shape-btn' },
  { element: eyeBtns, field: 'eyes', names: craftTextures.EYE_NAMES },
  { element: browBtns, field: 'brows', names: craftTextures.BROW_NAMES },
  { element: mouthBtns, field: 'mouth', names: craftTextures.MOUTH_NAMES },
  { element: detailBtns, field: 'detail', names: craftTextures.DETAIL_NAMES },
  { element: accBtns, field: 'accessory', names: craftTextures.ACCESSORY_NAMES, className: 'acc-btn' },
];

let CUSTOMIZATION = craftTextures.randomAvatarCustomization();
let avatarPreviewRevision = 0;

function encodeHash(customization) {
  return craftTextures.encodeAvatarLook(customization);
}

function decodeHash(code) {
  return craftTextures.decodeAvatarLook(code);
}

function titleCase(value) {
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function installAvatarChoiceGroup({ element, field, names, className = '' }) {
  if (!element) return;
  element.innerHTML = '';
  names.forEach((name, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `avatar-choice-btn ${className}`.trim();
    button.dataset.customizationField = field;
    button.dataset.customizationValue = String(index);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-label', `${titleCase(field)}: ${titleCase(name)}`);
    button.title = titleCase(name);

    const glyph = document.createElement('span');
    glyph.className = 'avatar-choice-glyph';
    glyph.setAttribute('aria-hidden', 'true');
    glyph.textContent = AVATAR_GLYPHS[field][index] || '•';
    button.appendChild(glyph);

    const label = document.createElement('small');
    label.textContent = titleCase(name);
    button.appendChild(label);
    element.appendChild(button);
  });

  element.addEventListener('click', event => {
    const button = event.target.closest('[data-customization-field]');
    if (!button) return;
    CUSTOMIZATION[field] = Number.parseInt(button.dataset.customizationValue, 10);
    updateCustomizationUI();
  });

  element.addEventListener('keydown', event => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const buttons = Array.from(element.querySelectorAll('[data-customization-field]'));
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[nextIndex].focus();
    buttons[nextIndex].click();
  });
}

function installAvatarChoices() {
  COLOR_HEX_STR.forEach((hex, index) => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = 'swatch';
    swatch.style.backgroundColor = hex;
    swatch.style.setProperty('--swatch-color', hex);
    swatch.dataset.customizationField = 'colorIdx';
    swatch.dataset.customizationValue = String(index);
    swatch.setAttribute('role', 'radio');
    swatch.setAttribute('aria-label', `Fabric color ${index + 1}`);
    swatch.addEventListener('click', () => {
      CUSTOMIZATION.colorIdx = index;
      updateCustomizationUI();
    });
    colorSwatches.appendChild(swatch);
  });
  AVATAR_GROUPS.forEach(installAvatarChoiceGroup);
}

async function refreshAvatarPreview() {
  if (!avatarPreview) return;
  const revision = ++avatarPreviewRevision;
  const stagingCanvas = document.createElement('canvas');
  avatarPreview.classList.add('loading');
  try {
    await craftTextures.renderAvatarPreview(stagingCanvas, CUSTOMIZATION);
    if (revision !== avatarPreviewRevision) return;
    const context = avatarPreview.getContext('2d');
    context.clearRect(0, 0, avatarPreview.width, avatarPreview.height);
    context.drawImage(stagingCanvas, 0, 0, avatarPreview.width, avatarPreview.height);
    avatarPreview.classList.remove('loading');
  } catch (error) {
    avatarPreview.classList.remove('loading');
    console.error('Avatar preview failed to render.', error);
  }
}

function updateCustomizationUI() {
  CUSTOMIZATION = craftTextures.normalizeAvatarCustomization(CUSTOMIZATION);
  avatarHashInput.value = encodeHash(CUSTOMIZATION);
  document.querySelectorAll('[data-customization-field]').forEach(element => {
    const field = element.dataset.customizationField;
    const value = Number.parseInt(element.dataset.customizationValue, 10);
    const isActive = CUSTOMIZATION[field] === value;
    element.classList.toggle('active', isActive);
    element.setAttribute('aria-checked', String(isActive));
    element.tabIndex = isActive ? 0 : -1;
  });
  pulseSlider.value = String(CUSTOMIZATION.pulse);
  refreshAvatarPreview();
}

btnToggleCustomize.addEventListener('click', () => {
  customizePanel.classList.toggle('open');
  const isOpen = customizePanel.classList.contains('open');
  customizePanel.closest('.customize-section')?.classList.toggle('expanded', isOpen);
  btnToggleCustomize.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) refreshAvatarPreview();
});

btnRandomizeAvatar.addEventListener('click', () => {
  CUSTOMIZATION = craftTextures.randomAvatarCustomization();
  updateCustomizationUI();
});

btnResetAvatar.addEventListener('click', () => {
  CUSTOMIZATION = { ...DEFAULT_CUSTOMIZATION };
  updateCustomizationUI();
});

pulseSlider.addEventListener('input', () => {
  CUSTOMIZATION.pulse = Number.parseInt(pulseSlider.value, 10);
  updateCustomizationUI();
});

async function copyAvatarLookCode() {
  const code = encodeHash(CUSTOMIZATION);
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Clipboard API unavailable');
    }
    await navigator.clipboard.writeText(code);
  } catch (error) {
    avatarHashInput.focus();
    avatarHashInput.select();
    if (!document.execCommand('copy')) {
      showError('Could not copy automatically. Select the look code and copy it.');
      return;
    }
  }
  btnCopyHash.textContent = 'Copied';
  setTimeout(() => { btnCopyHash.textContent = 'Copy'; }, 1500);
}

function importAvatarLookCode() {
  const decoded = decodeHash(importHashInput.value);
  if (!decoded) {
    showError('Use a 9-character look code, or a legacy 4-character code.');
    return;
  }
  CUSTOMIZATION = decoded;
  updateCustomizationUI();
  importHashInput.value = '';
}

btnCopyHash.addEventListener('click', copyAvatarLookCode);
btnImportHash.addEventListener('click', importAvatarLookCode);
importHashInput.addEventListener('input', () => {
  importHashInput.value = importHashInput.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
});
importHashInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') importAvatarLookCode();
});

installAvatarChoices();
updateCustomizationUI();

function showError(msg) {
  errorToast.textContent = msg;
  errorToast.classList.add('visible');
  setTimeout(() => errorToast.classList.remove('visible'), 3500);
}

// ── Screen reader announcements ──
function announce(msg) {
  if (!srAnnouncer) return;
  srAnnouncer.textContent = '';
  // Force DOM update before setting new text
  requestAnimationFrame(() => {
    srAnnouncer.textContent = msg;
  });
}

// ── Focus trap for modals ──
function trapFocus(element) {
  releaseFocus(element, false);
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  element._previousFocus = document.activeElement;
  first.focus();

  element._focusTrap = (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  element.addEventListener('keydown', element._focusTrap);
}

function releaseFocus(element, restore = true) {
  if (element._focusTrap) {
    element.removeEventListener('keydown', element._focusTrap);
    delete element._focusTrap;
  }
  if (restore && element._previousFocus && typeof element._previousFocus.focus === 'function') {
    element._previousFocus.focus();
  }
  delete element._previousFocus;
}

// ── Keyboard shortcuts ──
document.addEventListener('keydown', (e) => {
  // Ignore if typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  // Escape: close open panels
  if (e.key === 'Escape') {
    if (emoteGrid.classList.contains('open')) {
      emoteGrid.classList.remove('open');
      emoteToggle.setAttribute('aria-expanded', 'false');
      return;
    }
    if (musicPanel.classList.contains('visible')) {
      setExpandedPanel(musicBtn, musicPanel, false);
      return;
    }
    if (furniturePanel.classList.contains('visible')) {
      closeBuildDrawer();
      return;
    }
    if (vibePrompt.classList.contains('visible')) {
      vibePrompt.classList.remove('visible');
      vibePrompt.setAttribute('aria-hidden', 'true');
      releaseFocus(vibePrompt);
      vibePromptFromId = null;
      return;
    }
    if (loveModal.classList.contains('visible')) {
      loveModal.classList.remove('visible');
      loveModal.setAttribute('aria-hidden', 'true');
      releaseFocus(loveModal);
      return;
    }
    return;
  }

  // E: Toggle emote grid
  if (e.key === 'e' || e.key === 'E') {
    if (!currentRoomId) return;
    emoteGrid.classList.toggle('open');
    emoteToggle.setAttribute('aria-expanded', emoteGrid.classList.contains('open'));
    return;
  }

  // B: Toggle build mode
  if (e.key === 'b' || e.key === 'B') {
    if (!currentRoomId || !isRoomOwner) return;
    if (buildMode) closeBuildDrawer();
    else openBuildDrawer();
    return;
  }

  if (e.key === 'r' || e.key === 'R') {
    if (!currentRoomId || !isRoomOwner || !buildMode) return;
    toolRotate.click();
    return;
  }

  // M: Toggle music maker
  if (e.key === 'm' || e.key === 'M') {
    if (!currentRoomId || currentRoomIsPublic) return;
    const willOpen = !musicPanel.classList.contains('visible');
    setExpandedPanel(musicBtn, musicPanel, willOpen);
    if (willOpen && buildMode) closeBuildDrawer();
    return;
  }

  // Q: Toggle quiet mode
  if (e.key === 'q' || e.key === 'Q') {
    if (!currentRoomId) return;
    quietBtn.click();
    return;
  }

  // / or ?: Focus sign input
  if (e.key === '/' || e.key === '?') {
    if (!currentRoomId || signInput.disabled) return;
    e.preventDefault();
    signInput.focus();
    return;
  }
});

function renderCommonRooms(rooms) {
  if (!commonRoomsContainer) return;
  commonRoomsContainer.innerHTML = '';
  for (const room of rooms) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'common-room-item';
    item.dataset.room = String(room.id || '').toLowerCase();
    item.setAttribute('aria-label', `Join ${room.name}, ${room.playerCount} of ${room.maxPlayers} players`);
    item.innerHTML = `
      <div class="common-room-info">
        <span class="common-room-name">${escapeHtml(room.name)}</span>
        <span class="common-room-desc">${escapeHtml(room.description)}</span>
      </div>
      <span class="common-room-count">${room.playerCount}/${room.maxPlayers}</span>
    `;
    item.addEventListener('click', () => {
      enterGame('common', room.id);
    });
    commonRoomsContainer.appendChild(item);
  }
}

function renderPublicRooms(rooms) {
  if (!publicRoomsContainer) return;
  publicRoomsContainer.innerHTML = '';
  if (rooms.length === 0) {
    publicRoomsContainer.innerHTML = '<div class="public-room-empty">No active public rooms right now</div>';
    return;
  }
  for (const room of rooms) {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'public-room-item';
    item.setAttribute('aria-label', `Join room ${room.id}, ${room.playerCount} of ${room.maxPlayers} players`);
    item.innerHTML = `
      <span class="public-room-id">Room ${escapeHtml(room.id)}</span>
      <span class="public-room-count">${room.playerCount}/${room.maxPlayers}</span>
    `;
    item.addEventListener('click', () => {
      enterGame('code', room.id);
    });
    publicRoomsContainer.appendChild(item);
  }
}

function renderBookmarks() {
  if (!bookmarksList) return;
  bookmarksList.innerHTML = '';
  if (bookmarkedRooms.size === 0) {
    bookmarksList.innerHTML = '<div class="bookmark-empty">Bookmark rooms to find them again</div>';
    return;
  }
  for (const code of bookmarkedRooms) {
    const item = document.createElement('div');
    item.className = 'bookmark-item';
    const joinButton = document.createElement('button');
    joinButton.type = 'button';
    joinButton.className = 'bookmark-join';
    joinButton.setAttribute('aria-label', `Join bookmarked room ${code}`);
    joinButton.innerHTML = `<span class="public-room-id">Room ${escapeHtml(code)}</span>`;
    joinButton.addEventListener('click', () => enterGame('code', code));

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'bookmark-remove';
    removeButton.setAttribute('aria-label', `Remove bookmark for room ${code}`);
    removeButton.textContent = '✕';
    removeButton.addEventListener('click', () => {
      bookmarkedRooms.delete(code);
      persistBookmarks();
      renderBookmarks();
      if (currentRoomId === code) {
        setBookmarkButtonState(false);
      }
    });
    item.append(joinButton, removeButton);
    bookmarksList.appendChild(item);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Poll public rooms while on landing screen
let publicRoomsInterval = null;
function startPublicRoomsPolling() {
  if (publicRoomsInterval) return;
  publicRoomsInterval = setInterval(() => {
    if (socket && socket.connected && !currentRoomId) {
      socket.emit('getPublicRooms');
    }
  }, 3000);
}
function stopPublicRoomsPolling() {
  if (publicRoomsInterval) {
    clearInterval(publicRoomsInterval);
    publicRoomsInterval = null;
  }
}

// ─── Landing UI Logic ──────────────────────────────────

btnToggleSpecific.addEventListener('click', () => {
  joinSpecificPanel.classList.toggle('open');
  const isOpen = joinSpecificPanel.classList.contains('open');
  btnToggleSpecific.setAttribute('aria-expanded', String(isOpen));
  if (isOpen) roomCodeInput.focus();
});

roomCodeInput.addEventListener('input', () => {
  roomCodeInput.value = roomCodeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});

// ═══════════════════════════════════════════════════════
// PHASER CONFIG (must be defined before enterGame)
// ═══════════════════════════════════════════════════════

let WORLD_WIDTH  = 2000;
let WORLD_HEIGHT = 1200;
let ROOM_WIDTH  = 1200;
let ROOM_HEIGHT = 800;
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
let roomStyle = roomStyles.styleFromPreset(0);
let roomStyleSlot = 0;
let pendingRoomJoined = null;

// Idle animation state
const localIdleState = idleState.createIdleState();
const IDLE_SIT_MS = 5000; // 5 seconds of stillness before sitting

// ─── Enter / Exit Game ─────────────────────────────────

function enterGame(mode, roomCode) {
  playerName = nameInput.value.trim() || 'Stranger';
  joinMode = mode;
  joinRoomCode = roomCode || '';

  shellController.enterGame();
  connectionStatus.classList.add('visible');
  backBtn.classList.add('visible');
  roomInfo.classList.add('visible');
  playerCountEl.classList.add('visible');
  emotePanel.classList.add('visible');
  signBar.classList.add('visible');
  loveBtn.classList.add('visible');
  fleeBtn.classList.add('visible');
  quietBtn.classList.add('visible');
  if (zoomControls) zoomControls.classList.add('visible');

  // Reset sign input to blocked until vibe check
  signInput.disabled = true;
  signSendBtn.disabled = true;
  signInput.placeholder = 'Vibe Check required';

  stopPublicRoomsPolling();

  // Create or recreate the Phaser game — join is emitted from create() once ready
  if (game) { game.destroy(true); game = null; }
  game = new Phaser.Game(gameConfig);
}

function exitGame() {
  shellController.showLanding();
  connectionStatus.classList.remove('visible');
  backBtn.classList.remove('visible');
  roomInfo.classList.remove('visible');
  playerCountEl.classList.remove('visible');
  emotePanel.classList.remove('visible');
  signBar.classList.remove('visible');
  emoteGrid.classList.remove('open');
  emoteToggle.setAttribute('aria-expanded', 'false');
  loveBtn.classList.remove('visible');
  vibeAction.classList.remove('visible');
  vibePrompt.classList.remove('visible');
  vibePrompt.setAttribute('aria-hidden', 'true');
  releaseFocus(vibePrompt);
  loveModal.classList.remove('visible');
  loveModal.setAttribute('aria-hidden', 'true');
  releaseFocus(loveModal);
  fleeBtn.classList.remove('visible');
  quietBtn.classList.remove('visible');
  quietBtn.classList.remove('active');
  quietBtn.setAttribute('aria-pressed', 'false');
  quietMode = false;
  ambientPanel.classList.remove('visible');
  stopAmbient();
  musicBtn.classList.remove('visible');
  setExpandedPanel(musicBtn, musicPanel, false);
  seqStop();
  if (zoomControls) zoomControls.classList.remove('visible');
  currentZoom = 1;
  buildBtn.classList.remove('visible');
  setBuildDrawerSnap('closed');
  setExpandedPanel(buildBtn, furniturePanel, false);
  ownerBadge.classList.remove('visible');
  isRoomOwner = false;
  currentRoomIsPublic = true;
  buildMode = false;
  roomFurniture.forEach(f => {
    if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
    f.sprite.destroy();
  });
  roomFurniture = [];

  // Tell server we left the room, but KEEP socket alive for fast rejoin
  if (socket && socket.connected) {
    socket.emit('leaveRoom');
    socket.emit('getCommonRooms');
    socket.emit('getPublicRooms');
    startPublicRoomsPolling();
    renderBookmarks();
  }

  if (game) { game.destroy(true); game = null; }
  if (playerAccessory) { playerAccessory.destroy(); playerAccessory = null; }

  currentRoomId = null;
  roomIdDisplay.textContent = '----';
  otherPlayers.clear();
  mutedPlayers.clear();
  idleState.resetIdleState(localIdleState);
  player = null;
  playerAccessory = null;
  targetPosition = null;
  isPanning = false;
  pendingRoomJoined = null;
  joinMode = null;
  joinRoomCode = '';
}

// Button listeners
btnEnter.addEventListener('click', () => enterGame('common', 'LOBBY'));
btnJoin.addEventListener('click', () => enterGame('random'));
btnCreate.addEventListener('click', () => enterGame('create'));
btnJoinCode.addEventListener('click', () => {
  const code = roomCodeInput.value.trim();
  if (code.length !== 6) { showError('Room code must be 6 characters'); return; }
  enterGame('code', code);
});
backBtn.addEventListener('click', exitGame);
fleeBtn.addEventListener('click', () => {
  if (socket && socket.connected) {
    socket.emit('fleeRoom', { name: playerName, customization: CUSTOMIZATION });
    // Reset local typing lock when fleeing
    signInput.disabled = true;
    signSendBtn.disabled = true;
    signInput.placeholder = 'Vibe Check required';
  }
});

quietBtn.addEventListener('click', () => {
  quietMode = !quietMode;
  quietBtn.classList.toggle('active', quietMode);
  quietBtn.setAttribute('aria-pressed', String(quietMode));
  if (player) {
    scene.tweens.add({ targets: [player], alpha: quietMode ? 0.35 : 1, duration: 400, ease: 'Power2' });
    if (playerAccessory) scene.tweens.add({ targets: [playerAccessory], alpha: quietMode ? 0.35 : 1, duration: 400, ease: 'Power2' });
    if (nameLabel) scene.tweens.add({ targets: [nameLabel], alpha: quietMode ? 0.35 : 1, duration: 400, ease: 'Power2' });
  }
  if (socket && socket.connected) {
    socket.emit('quietMode', { enabled: quietMode });
  }
});

bookmarkBtn.addEventListener('click', () => {
  if (!currentRoomId || currentRoomId.length !== 6) return;
  if (bookmarkedRooms.has(currentRoomId)) {
    bookmarkedRooms.delete(currentRoomId);
    setBookmarkButtonState(false);
  } else {
    bookmarkedRooms.add(currentRoomId);
    setBookmarkButtonState(true);
  }
  persistBookmarks();
  renderBookmarks();
});

zoomInBtn.addEventListener('click', () => setZoom(currentZoom + 0.25));
zoomOutBtn.addEventListener('click', () => setZoom(currentZoom - 0.25));

function setZoom(z) {
  currentZoom = Math.max(0.5, Math.min(2.0, z));
  if (scene && scene.cameras && scene.cameras.main) {
    scene.cameras.main.setZoom(currentZoom);
  }
}

ambientMuteBtn.addEventListener('click', () => {
  setAmbientMuted(!ambientMuted);
});

ambientTrackBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const track = Number(btn.dataset.track);
    setAmbientTrack(track);
    if (socket && socket.connected) socket.emit('setAmbientTrack', { track });
  });
});

musicBtn.addEventListener('click', () => {
  const willOpen = !musicPanel.classList.contains('visible');
  setExpandedPanel(musicBtn, musicPanel, willOpen);
  if (willOpen && buildMode) closeBuildDrawer();
});

musicCloseBtn.addEventListener('click', () => {
  setExpandedPanel(musicBtn, musicPanel, false);
});

musicPlayBtn.addEventListener('click', () => {
  if (seqPlaying) seqStop(); else seqStart();
});

musicBpmInput.addEventListener('input', (e) => {
  seqBpm = Number(e.target.value);
  musicBpmLabel.textContent = seqBpm;
  if (seqPlaying) {
    seqStop();
    seqStart();
  }
});

nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') enterGame('common', 'LOBBY'); });
roomCodeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') btnJoinCode.click(); });

copyRoomBtn.addEventListener('click', () => {
  if (currentRoomId) {
    navigator.clipboard.writeText(currentRoomId).then(() => {
      setIconButtonContent(copyRoomBtn, 'check', '', '✓');
      setTimeout(() => { setIconButtonContent(copyRoomBtn, 'copy', '', '⧉'); }, 1500);
    });
  }
});

// ─── Emote & Sign UI ──────────────────────────────────

emoteToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  emoteGrid.classList.toggle('open');
  const isOpen = emoteGrid.classList.contains('open');
  emoteToggle.setAttribute('aria-expanded', String(isOpen));
});

emoteGrid.addEventListener('click', (e) => {
  e.stopPropagation();
  const btn = e.target.closest('.emote-btn');
  if (!btn) return;
  if (socket && socket.connected) socket.emit('sendEmote', { emote: btn.dataset.emote });
  emoteGrid.classList.remove('open');
  emoteToggle.setAttribute('aria-expanded', 'false');
});

// Keyboard navigation for emote grid
emoteGrid.addEventListener('keydown', (e) => {
  const buttons = Array.from(emoteGrid.querySelectorAll('.emote-btn'));
  const current = document.activeElement;
  const idx = buttons.indexOf(current);
  if (idx === -1) return;

  let nextIdx = idx;
  const cols = window.innerWidth <= 640 ? 5 : 6;

  switch (e.key) {
    case 'ArrowRight': nextIdx = idx + 1; break;
    case 'ArrowLeft':  nextIdx = idx - 1; break;
    case 'ArrowDown':  nextIdx = idx + cols; break;
    case 'ArrowUp':    nextIdx = idx - cols; break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      buttons[idx].click();
      return;
    case 'Escape':
      emoteGrid.classList.remove('open');
      emoteToggle.setAttribute('aria-expanded', 'false');
      emoteToggle.focus();
      return;
    default: return;
  }

  e.preventDefault();
  if (nextIdx >= 0 && nextIdx < buttons.length) {
    buttons[nextIdx].focus();
  }
});

signSendBtn.addEventListener('click', (e) => {
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

loveBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  e.preventDefault();
  loveModal.classList.add('visible');
  loveModal.setAttribute('aria-hidden', 'false');
  trapFocus(loveModal);
});
loveModalClose.addEventListener('click', () => {
  loveModal.classList.remove('visible');
  loveModal.setAttribute('aria-hidden', 'true');
  releaseFocus(loveModal);
});
loveModal.addEventListener('click', (e) => {
  if (e.target === loveModal) {
    loveModal.classList.remove('visible');
    loveModal.setAttribute('aria-hidden', 'true');
    releaseFocus(loveModal);
  }
});

// ─── Vibe Check & Mute UI ──────────────────────────────

const mutedPlayers = new Set(); // socket IDs of muted strangers
let bookmarkedRooms = loadBookmarks();
let currentZoom = 1;

function loadBookmarks() {
  try {
    const stored = JSON.parse(sessionStorage.getItem('freelobby-bookmarks') || '[]');
    if (!Array.isArray(stored)) return new Set();
    return new Set(stored.filter(code => typeof code === 'string' && /^[A-Z0-9]{6}$/.test(code)));
  } catch {
    return new Set();
  }
}

function persistBookmarks() {
  try {
    sessionStorage.setItem('freelobby-bookmarks', JSON.stringify([...bookmarkedRooms]));
  } catch {
    // Bookmarks remain available for the current page even if storage is blocked.
  }
}

// "✦ Vibe Check" button in the action popup
vibeActionBtn.addEventListener('click', () => {
  if (vibeTargetId && socket && socket.connected) {
    socket.emit('vibeCheckRequest', { targetId: vibeTargetId });
    vibeAction.classList.remove('visible');
    showEmoteBubble(player, '✦');
  }
});

// "Mute/Unmute" button in the action popup
muteActionBtn.addEventListener('click', () => {
  if (!vibeTargetId) return;
  if (mutedPlayers.has(vibeTargetId)) {
    mutedPlayers.delete(vibeTargetId);
    muteActionBtn.textContent = 'Mute';
    muteActionBtn.classList.remove('active');
  } else {
    mutedPlayers.add(vibeTargetId);
    muteActionBtn.textContent = 'Unmute';
    muteActionBtn.classList.add('active');
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
  vibePrompt.setAttribute('aria-hidden', 'true');
  releaseFocus(vibePrompt);
  vibePromptFromId = null;
});

// Decline vibe check prompt
vibeDeclineBtn.addEventListener('click', () => {
  if (vibePromptFromId && socket && socket.connected) {
    socket.emit('vibeCheckRespond', { fromId: vibePromptFromId, accepted: false });
  }
  vibePrompt.classList.remove('visible');
  vibePrompt.setAttribute('aria-hidden', 'true');
  releaseFocus(vibePrompt);
  vibePromptFromId = null;
});

// Phase 3 — Furniture Build Mode
const buildBtn         = document.getElementById('build-btn');
const furniturePanel   = document.getElementById('furniture-panel');
const furniturePalette = document.getElementById('furniture-palette');
const furnitureCategories = document.getElementById('furniture-categories');
const furnitureSearch  = document.getElementById('furniture-search');
const catalogCount     = document.getElementById('catalog-count');
const selectedFurniturePreview = document.getElementById('selected-furniture-preview');
const selectedFurnitureName = document.getElementById('selected-furniture-name');
const selectedFurnitureMeta = document.getElementById('selected-furniture-meta');
const selectedRotationLabel = document.getElementById('selected-rotation-label');
const buildDrawerTitle = document.getElementById('build-drawer-title');
const buildDrawerHandle = document.getElementById('build-drawer-handle');
const buildClose       = document.getElementById('build-close');
const buildTabFurniture = document.getElementById('build-tab-furniture');
const buildTabStyle    = document.getElementById('build-tab-style');
const furnitureView    = document.getElementById('furniture-view');
const roomStyleView    = document.getElementById('room-style-view');
const toolPlace        = document.getElementById('tool-place');
const toolRemove       = document.getElementById('tool-remove');
const toolRotate       = document.getElementById('tool-rotate');
const btnToggleHash    = document.getElementById('btn-toggle-hash');
const hashPanel        = document.getElementById('hash-panel');
const btnDownloadCard  = document.getElementById('btn-download-card');
const cardFileInput    = document.getElementById('card-file-input');
const roomStylePresets = document.getElementById('room-style-presets');
const roomWallColor    = document.getElementById('room-wall-color');
const roomFloorColor   = document.getElementById('room-floor-color');
const roomAccentColor  = document.getElementById('room-accent-color');
const roomWallValue    = document.getElementById('room-wall-value');
const roomFloorValue   = document.getElementById('room-floor-value');
const roomAccentValue  = document.getElementById('room-accent-value');
const roomIntensityOptions = document.getElementById('room-intensity-options');

let buildMode = false;
let buildTool = 'place';
let selectedFurnitureType = 20;
let selectedFurnitureRotation = 0;
let activeFurnitureCategory = 'seating';
let furnitureSearchQuery = '';
let activeBuildView = 'furniture';
let roomStyleBroadcastTimer = null;

const FURNITURE_DEFS = furnitureCatalog.ITEMS;
const FURNITURE_FOOTPRINTS = FURNITURE_DEFS.map(d => ({ w: d.w, h: d.h, walkable: d.walkable }));

function getClientFootprint(type, rotation) {
  const fp = FURNITURE_FOOTPRINTS[type];
  if (!fp) return { w: 1, h: 1, walkable: false };
  const rot = (rotation || 0) % 4;
  const w = (rot % 2 === 1) ? fp.h : fp.w;
  const h = (rot % 2 === 1) ? fp.w : fp.h;
  return { w, h, walkable: fp.walkable };
}

function renderFurnitureCategories() {
  furnitureCategories.innerHTML = '';
  const categories = [{ id: 'all', name: 'All', icon: 'layout-grid' }, ...furnitureCatalog.CATEGORIES];
  const fragment = document.createDocumentFragment();
  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'furniture-category';
    button.dataset.category = category.id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(category.id === activeFurnitureCategory));
    button.innerHTML = `<i data-lucide="${category.icon}" aria-hidden="true"></i><span>${escapeHtml(category.name)}</span>`;
    button.addEventListener('click', () => {
      activeFurnitureCategory = category.id;
      renderFurniturePalette();
    });
    fragment.appendChild(button);
  });
  furnitureCategories.appendChild(fragment);
  refreshInterfaceIcons();
}

function selectedFurnitureDefinition() {
  return FURNITURE_DEFS[selectedFurnitureType] || FURNITURE_DEFS[0];
}

function renderFurniturePalette() {
  const matches = furnitureCatalog.searchItems(furnitureSearchQuery, activeFurnitureCategory);
  furniturePalette.innerHTML = '';
  const fragment = document.createDocumentFragment();

  for (const definition of matches) {
    const button = document.createElement('button');
    const active = definition.type === selectedFurnitureType;
    button.type = 'button';
    button.className = `furn-btn${active ? ' active' : ''}`;
    button.title = definition.name;
    button.setAttribute('aria-label', `${definition.name}, ${definition.w} by ${definition.h}`);
    button.setAttribute('aria-pressed', String(active));
    button.dataset.type = String(definition.type);
    button.innerHTML = `
      <span class="furn-art"><i data-lucide="${definition.icon}" aria-hidden="true"></i></span>
      <span class="furn-name">${escapeHtml(definition.name)}</span>
    `;
    button.addEventListener('click', () => {
      selectedFurnitureType = definition.type;
      selectedFurnitureRotation = 0;
      buildTool = 'place';
      updateBuildUI();
      refreshFurniturePaletteArtwork(roomStyleSlot);
    });
    fragment.appendChild(button);
  }

  if (matches.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'catalog-empty';
    empty.textContent = 'No furniture matches that search.';
    fragment.appendChild(empty);
  }

  furniturePalette.appendChild(fragment);
  catalogCount.textContent = `${matches.length} item${matches.length === 1 ? '' : 's'}`;
  furnitureCategories.querySelectorAll('.furniture-category').forEach(button => {
    const active = button.dataset.category === activeFurnitureCategory;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  });
  const category = furnitureCatalog.CATEGORIES.find(entry => entry.id === activeFurnitureCategory);
  buildDrawerTitle.textContent = `Build · ${category ? category.name : 'All'}`;
  updateSelectedFurniturePanel();
  refreshInterfaceIcons();
  refreshFurniturePaletteArtwork(roomStyleSlot);
}

function refreshFurniturePaletteArtwork(styleSlot = 0) {
  if (!scene || !craftTextures) return;
  furniturePalette.querySelectorAll('.furn-btn').forEach(button => {
    const type = Number(button.dataset.type);
    const source = craftTextures.furniturePreviewUrl(scene, styleSlot, type);
    if (!source) return;
    const art = button.querySelector('.furn-art');
    let image = art.querySelector('.furn-preview');
    if (!image) {
      art.innerHTML = '';
      image = document.createElement('img');
      image.className = 'furn-preview';
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      art.appendChild(image);
    }
    image.src = source;
  });
  updateSelectedFurniturePanel();
}

function updateSelectedFurniturePanel() {
  const definition = selectedFurnitureDefinition();
  selectedFurnitureName.textContent = definition.name;
  const category = furnitureCatalog.CATEGORIES.find(entry => entry.id === definition.category);
  const footprint = getClientFootprint(selectedFurnitureType, selectedFurnitureRotation);
  selectedFurnitureMeta.textContent = `${category?.name || 'Furniture'} · ${footprint.w} × ${footprint.h}`;
  selectedRotationLabel.textContent = `${selectedFurnitureRotation * 90}°`;
  selectedFurniturePreview.innerHTML = '';
  if (scene) {
    const source = craftTextures.furniturePreviewUrl(scene, roomStyleSlot, selectedFurnitureType);
    if (source) {
      const image = document.createElement('img');
      image.src = source;
      image.alt = '';
      image.setAttribute('aria-hidden', 'true');
      selectedFurniturePreview.appendChild(image);
      return;
    }
  }
  selectedFurniturePreview.innerHTML = `<i data-lucide="${definition.icon}" aria-hidden="true"></i>`;
  refreshInterfaceIcons();
}

function updateBuildUI() {
  furniturePalette.querySelectorAll('.furn-btn').forEach(el => {
    const active = Number(el.dataset.type) === selectedFurnitureType && buildTool === 'place';
    el.classList.toggle('active', active);
    el.setAttribute('aria-pressed', String(active));
  });
  toolPlace.classList.toggle('active', buildTool === 'place');
  toolRemove.classList.toggle('active', buildTool === 'remove');
  toolPlace.setAttribute('aria-pressed', String(buildTool === 'place'));
  toolRemove.setAttribute('aria-pressed', String(buildTool === 'remove'));
  updateSelectedFurniturePanel();
}

function setBuildView(view) {
  activeBuildView = view === 'style' ? 'style' : 'furniture';
  const showingFurniture = activeBuildView === 'furniture';
  furnitureView.hidden = !showingFurniture;
  roomStyleView.hidden = showingFurniture;
  furnitureView.classList.toggle('active', showingFurniture);
  roomStyleView.classList.toggle('active', !showingFurniture);
  buildTabFurniture.classList.toggle('active', showingFurniture);
  buildTabStyle.classList.toggle('active', !showingFurniture);
  buildTabFurniture.setAttribute('aria-selected', String(showingFurniture));
  buildTabStyle.setAttribute('aria-selected', String(!showingFurniture));
  if (!showingFurniture) buildDrawerTitle.textContent = 'Build · Room Style';
  else {
    const category = furnitureCatalog.CATEGORIES.find(entry => entry.id === activeFurnitureCategory);
    buildDrawerTitle.textContent = `Build · ${category ? category.name : 'All'}`;
  }
}

function setBuildDrawerSnap(snap) {
  const allowed = new Set(['closed', 'peek', 'half', 'expanded']);
  furniturePanel.dataset.snap = allowed.has(snap) ? snap : 'half';
}

function openBuildDrawer() {
  buildMode = true;
  setExpandedPanel(buildBtn, furniturePanel, true);
  setBuildDrawerSnap(window.matchMedia('(max-width: 720px)').matches ? 'half' : 'expanded');
  setExpandedPanel(musicBtn, musicPanel, false);
  buildTool = 'place';
  updateBuildUI();
}

function closeBuildDrawer() {
  buildMode = false;
  setBuildDrawerSnap('closed');
  setExpandedPanel(buildBtn, furniturePanel, false);
}

function emitRoomStyleChange() {
  if (socket && socket.connected && isRoomOwner && !currentRoomIsPublic) {
    socket.emit('setRoomStyle', { style: roomStyle });
  }
}

function updateRoomStyleUI() {
  if (!roomStylePresets) return;
  roomWallColor.value = roomStyle.wall;
  roomFloorColor.value = roomStyle.floor;
  roomAccentColor.value = roomStyle.accent;
  roomWallValue.textContent = roomStyle.wall;
  roomFloorValue.textContent = roomStyle.floor;
  roomAccentValue.textContent = roomStyle.accent;

  roomStylePresets.querySelectorAll('.room-preset').forEach(button => {
    const active = Number(button.dataset.preset) === roomStyle.preset;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
    button.classList.toggle('customized', active && !roomStyles.isPresetStyle(roomStyle));
  });
  roomIntensityOptions.querySelectorAll('.room-intensity-btn').forEach(button => {
    const active = Number(button.dataset.intensity) === roomStyle.intensity;
    button.classList.toggle('active', active);
    button.setAttribute('aria-checked', String(active));
  });
}

function applyAndBroadcastRoomStyle(nextStyle, immediate = false) {
  roomStyle = roomStyles.normalizeStyle(nextStyle, roomStyle.preset);
  updateRoomStyleUI();
  clearTimeout(roomStyleBroadcastTimer);
  const apply = () => {
    applyRoomVisualStyle(roomStyle);
    emitRoomStyleChange();
  };
  if (immediate) apply();
  else roomStyleBroadcastTimer = setTimeout(apply, 140);
}

function renderRoomStyleControls() {
  roomStylePresets.innerHTML = '';
  roomStyles.PRESETS.forEach((preset, presetIndex) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-preset';
    button.dataset.preset = String(presetIndex);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.innerHTML = `
      <span class="room-preset-preview" style="--preset-wall:${preset.wall};--preset-floor:${preset.floor};--preset-accent:${preset.accent}">
        <span></span><span></span><span></span>
      </span>
      <strong>${escapeHtml(preset.name)}</strong>
      <small>${escapeHtml(preset.description)}</small>
    `;
    button.addEventListener('click', () => applyAndBroadcastRoomStyle(roomStyles.styleFromPreset(presetIndex), true));
    roomStylePresets.appendChild(button);
  });

  roomIntensityOptions.innerHTML = '';
  roomStyles.INTENSITIES.forEach((intensity, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'room-intensity-btn';
    button.dataset.intensity = String(index);
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', 'false');
    button.innerHTML = `<span aria-hidden="true">${index === 0 ? '○' : index === 1 ? '◉' : '✦'}</span>${escapeHtml(intensity.name)}`;
    button.addEventListener('click', () => applyAndBroadcastRoomStyle({ ...roomStyle, intensity: index }, true));
    roomIntensityOptions.appendChild(button);
  });
  updateRoomStyleUI();
}

buildBtn.addEventListener('click', () => {
  if (buildMode) closeBuildDrawer();
  else openBuildDrawer();
});

toolPlace.addEventListener('click', () => { buildTool = 'place'; updateBuildUI(); });
toolRemove.addEventListener('click', () => { buildTool = 'remove'; updateBuildUI(); });
toolRotate.addEventListener('click', () => {
  selectedFurnitureRotation = (selectedFurnitureRotation + 1) % 4;
  buildTool = 'place';
  updateBuildUI();
});
buildClose.addEventListener('click', closeBuildDrawer);
buildTabFurniture.addEventListener('click', () => setBuildView('furniture'));
buildTabStyle.addEventListener('click', () => setBuildView('style'));
furnitureSearch.addEventListener('input', () => {
  furnitureSearchQuery = furnitureSearch.value;
  renderFurniturePalette();
});

[
  [roomWallColor, 'wall'],
  [roomFloorColor, 'floor'],
  [roomAccentColor, 'accent'],
].forEach(([input, field]) => {
  input.addEventListener('input', () => applyAndBroadcastRoomStyle({ ...roomStyle, [field]: input.value }));
  input.addEventListener('change', () => applyAndBroadcastRoomStyle({ ...roomStyle, [field]: input.value }, true));
});

let drawerDragStart = null;
buildDrawerHandle.addEventListener('pointerdown', event => {
  if (!window.matchMedia('(max-width: 720px)').matches) return;
  drawerDragStart = { y: event.clientY, snap: furniturePanel.dataset.snap || 'half' };
  buildDrawerHandle.setPointerCapture(event.pointerId);
  furniturePanel.classList.add('dragging');
});
buildDrawerHandle.addEventListener('pointermove', event => {
  if (!drawerDragStart) return;
  const delta = event.clientY - drawerDragStart.y;
  furniturePanel.style.setProperty('--drawer-drag-y', `${delta}px`);
});
buildDrawerHandle.addEventListener('pointerup', event => {
  if (!drawerDragStart) return;
  const delta = event.clientY - drawerDragStart.y;
  const snaps = ['expanded', 'half', 'peek'];
  let index = Math.max(0, snaps.indexOf(drawerDragStart.snap));
  if (delta > 55) index = Math.min(snaps.length - 1, index + 1);
  else if (delta < -55) index = Math.max(0, index - 1);
  else if (Math.abs(delta) < 8) index = (index + 1) % snaps.length;
  setBuildDrawerSnap(snaps[index]);
  furniturePanel.style.removeProperty('--drawer-drag-y');
  furniturePanel.classList.remove('dragging');
  buildDrawerHandle.releasePointerCapture(event.pointerId);
  drawerDragStart = null;
});

renderFurnitureCategories();
renderFurniturePalette();
renderRoomStyleControls();

// ─── Room Memory Card Export / Import ──────────────────

btnToggleHash.addEventListener('click', () => {
  hashPanel.classList.toggle('open');
  btnToggleHash.setAttribute('aria-expanded', String(hashPanel.classList.contains('open')));
});

btnDownloadCard.addEventListener('click', () => {
  const items = roomFurniture.map(f => ({ ...f.item, on: f.interactiveOn === true }));
  const canvas = generateRoomCard(currentRoomId, items, roomStyle);
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
      socket.emit('setRoomFurniture', { furniture: result.furniture, theme: result.theme, style: result.style });
    }
  });
  cardFileInput.value = '';
});

// ═══════════════════════════════════════════════════════
// SCENE FUNCTIONS
// ═══════════════════════════════════════════════════════

function preload() {
  scene = this;
  craftTextures.preload(this);
}

function create() {
  scene = this;
  this.floorTiles = [];
  craftTextures.install(this, {
    footprints: FURNITURE_FOOTPRINTS,
    definitions: FURNITURE_DEFS,
    playerColors: COLOR_HEX_STR,
  });
  roomStyleSlot = craftTextures.installRoomStyle(this, roomStyle);
  refreshFurniturePaletteArtwork(roomStyleSlot);

  // Draw floor grid extending in all directions (3x the world size for generous padding)
  for (let x = -WORLD_WIDTH; x < WORLD_WIDTH * 2; x += 128) {
    for (let y = -WORLD_HEIGHT; y < WORLD_HEIGHT * 2; y += 128) {
      const tile = this.add.image(x + 64, y + 64, craftTextures.floorTextureKey(roomStyleSlot));
      tile.setDisplaySize(128, 128);
      tile.setDepth(-10);
      this.floorTiles.push(tile);
    }
  }

  const wallGroup = this.physics.add.staticGroup();
  const furnitureGroup = this.physics.add.staticGroup();
  this.wallGroup = wallGroup;
  this.furnitureGroup = furnitureGroup;

  // Initial walls at default room size (will be redrawn in roomJoined)
  this.drawRoomWalls = (w, h) => {
    wallGroup.clear(true, true);
    for (let x = 0; x < w; x += 64) {
      wallGroup.add(this.add.image(x + 32, 0, craftTextures.wallTextureKey(roomStyleSlot)).setDisplaySize(64, 64).setDepth(-5));
      wallGroup.add(this.add.image(x + 32, h, craftTextures.wallTextureKey(roomStyleSlot)).setDisplaySize(64, 64).setDepth(-5));
    }
    for (let y = 0; y < h; y += 64) {
      wallGroup.add(this.add.image(0, y + 32, craftTextures.wallTextureKey(roomStyleSlot)).setDisplaySize(64, 64).setDepth(-5));
      wallGroup.add(this.add.image(w, y + 32, craftTextures.wallTextureKey(roomStyleSlot)).setDisplaySize(64, 64).setDepth(-5));
    }
    applyRoomVisualStyle(roomStyle);
  };
  this.drawRoomWalls(ROOM_WIDTH, ROOM_HEIGHT);

  player = null;

  this.cameras.main.setBackgroundColor(getRoomVisualTheme(roomStyle).background);
  this.cameras.main.setZoom(currentZoom);
  this.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);

  cursors = this.input.keyboard.createCursorKeys();
  wasd = this.input.keyboard.addKeys({
    up:    Phaser.Input.Keyboard.KeyCodes.W,
    down:  Phaser.Input.Keyboard.KeyCodes.S,
    left:  Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D,
  });

  // Mobile Controls: Drag-to-Pan, Click-to-Move, Pinch-to-Zoom
  let pinchStartDist = 0;
  let pinchStartZoom = 1;

  this.input.on('pointerdown', (pointer) => {
    if (pointer.event.target.tagName !== 'CANVAS') return;

    // Pinch-to-zoom: if two pointers are down, start pinch
    const activePointers = this.input.manager.pointers.filter(p => p.isDown);
    if (activePointers.length === 2) {
      const p1 = activePointers[0];
      const p2 = activePointers[1];
      pinchStartDist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      pinchStartZoom = this.cameras.main.zoom;
      isPanning = false;
      return;
    }

    isPanning = false;
    panStartX = pointer.x;
    panStartY = pointer.y;
    camStartScrollX = this.cameras.main.scrollX;
    camStartScrollY = this.cameras.main.scrollY;
  });

  this.input.on('pointermove', (pointer) => {
    if (!pointer.isDown || pointer.event.target.tagName !== 'CANVAS') return;

    // Pinch-to-zoom
    const activePointers = this.input.manager.pointers.filter(p => p.isDown);
    if (activePointers.length === 2) {
      const p1 = activePointers[0];
      const p2 = activePointers[1];
      const dist = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      if (pinchStartDist > 0) {
        const scale = dist / pinchStartDist;
        setZoom(pinchStartZoom * scale);
      }
      return;
    }

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

  this.input.on('pointerup', () => {
    pinchStartDist = 0;
  });

  this.input.on('pointerup', (pointer, currentlyOver) => {
    if (pointer.event.target.tagName !== 'CANVAS') return;
    
    if (buildMode && isRoomOwner) {
      if (!isPanning) {
        const gx = Math.floor(pointer.worldX / 64);
        const gy = Math.floor(pointer.worldY / 64);
        if (buildTool === 'place') {
          const item = { t: selectedFurnitureType, x: gx, y: gy, r: selectedFurnitureRotation };
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
      const clampedX = Phaser.Math.Clamp(pointer.worldX, 24, ROOM_WIDTH - 24);
      const clampedY = Phaser.Math.Clamp(pointer.worldY, 24, ROOM_HEIGHT - 24);
      
      targetPosition = { x: clampedX, y: clampedY };
      createClickPulse(clampedX, clampedY);
      this.cameras.main.startFollow(player, true, 0.08, 0.08);
    }
    isPanning = false;
  });

  this.wallGroup = wallGroup;
  this.furnitureGroup = furnitureGroup;

  // Game is now fully ready — emit join so roomJoined arrives AFTER textures load
  if (socket && socket.connected && joinMode) {
    if (joinMode === 'random') socket.emit('joinRandomRoom', { name: playerName, customization: CUSTOMIZATION });
    else if (joinMode === 'create') socket.emit('createRoom', { name: playerName, customization: CUSTOMIZATION, isPublic: false });
    else if (joinMode === 'code') socket.emit('joinRoom', { roomId: joinRoomCode, name: playerName, customization: CUSTOMIZATION });
    else if (joinMode === 'common') socket.emit('joinCommonRoom', { roomId: joinRoomCode, name: playerName, customization: CUSTOMIZATION });
  }

  // If roomJoined arrived before create() finished, process it now
  if (pendingRoomJoined) {
    processRoomJoined(pendingRoomJoined);
    pendingRoomJoined = null;
  }
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

    // Pulse animation (skip if sitting)
    if (!localIdleState.sitting) {
      const pulseSpeeds = [0.02, 0.04, 0.08];
      const pulseT = scene.time.now / 1000;
      const pulseSpeed = pulseSpeeds[CUSTOMIZATION.pulse] || 0.04;
      const pulseScale = 1 + Math.sin(pulseT * pulseSpeed * Math.PI * 2) * 0.05;
      player.setScale(pulseScale);
      if (playerAccessory) playerAccessory.setScale(pulseScale);
    }

    const now = Date.now();
    const moved = (Math.abs(player.x - lastX) > 0.5 || Math.abs(player.y - lastY) > 0.5);
    if (socket && socket.connected && moved && now - lastSendTime > SEND_RATE) {
      socket.emit('playerMove', { x: player.x, y: player.y });
      lastX = player.x;
      lastY = player.y;
      lastSendTime = now;
    }

    // ── Idle / Sit animation for local player ──
    const isMoving = (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1 || targetPosition !== null);
    const localIdleAction = idleState.updateIdleState(localIdleState, { isMoving, now, idleMs: IDLE_SIT_MS });
    if (localIdleAction === 'sit') sitDown(player, playerAccessory);
    else if (localIdleAction === 'stand') standUp(player, playerAccessory);
  }

  for (const [id, other] of otherPlayers) {
    if (other.sprite && other.targetX !== undefined) {
      other.sprite.x += (other.targetX - other.sprite.x) * LERP_FACTOR;
      other.sprite.y += (other.targetY - other.sprite.y) * LERP_FACTOR;
      other.nameLabel.setPosition(other.sprite.x, other.sprite.y - 30);
      if (other.accessory) other.accessory.setPosition(other.sprite.x, other.sprite.y);

      // ── Idle / Sit animation for other players ──
      const now = Date.now();
      const isMovingOther = (Math.abs(other.targetX - other.sprite.x) > 1 || Math.abs(other.targetY - other.sprite.y) > 1);
      const otherIdleAction = idleState.updateIdleState(other.idleState, { isMoving: isMovingOther, now, idleMs: IDLE_SIT_MS });
      if (otherIdleAction === 'sit') sitDown(other.sprite, other.accessory);
      else if (otherIdleAction === 'stand') standUp(other.sprite, other.accessory);

      // Pulse animation (skip if sitting — sit tween handles scale)
      if (!other.idleState.sitting) {
        const pulseSpeeds = [0.02, 0.04, 0.08];
        const pulseT = scene.time.now / 1000;
        const pulseSpeed = pulseSpeeds[other.customization.pulse] || 0.04;
        const pulseScale = 1 + Math.sin(pulseT * pulseSpeed * Math.PI * 2) * 0.05;
        other.sprite.setScale(pulseScale);
        if (other.accessory) other.accessory.setScale(pulseScale);
      }
    }
  }
}

function sitDown(sprite, accessory) {
  if (!sprite) return;
  const targets = accessory ? [sprite, accessory] : [sprite];
  scene.tweens.killTweensOf(targets);
  scene.tweens.add({ targets, ...idleState.sittingTweenProps(), duration: 400, ease: 'Power2' });
}

function standUp(sprite, accessory) {
  if (!sprite) return;
  const targets = accessory ? [sprite, accessory] : [sprite];
  scene.tweens.killTweensOf(targets);
  scene.tweens.add({ targets, ...idleState.standingTweenProps(), duration: 300, ease: 'Back.easeOut' });
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

  const shapeKey = craftTextures.ensureAvatarTexture(scene, cust);
  player = scene.physics.add.sprite(data.x, data.y, shapeKey);
  player.setDisplaySize(48, 48);
  player.setCollideWorldBounds(true);
  player.setDepth(10);

  if (playerAccessory) { playerAccessory.destroy(); playerAccessory = null; }
  if (cust.accessory > 0) {
    playerAccessory = scene.add.sprite(
      data.x,
      data.y,
      craftTextures.accessoryTextureKey(cust.accessory, cust.colorIdx),
    );
    playerAccessory.setDisplaySize(48, 48);
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

  const cust = data.customization || { colorIdx: 0, shape: 0, accessory: 0, pulse: 1, eyes: 0, brows: 0, mouth: 0, detail: 0 };
  const shapeKey = craftTextures.ensureAvatarTexture(scene, cust);

  const sprite = scene.add.sprite(data.x, data.y, shapeKey);
  sprite.setDisplaySize(48, 48);
  sprite.setDepth(5);

  let accessory = null;
  if (cust.accessory > 0) {
    accessory = scene.add.sprite(
      data.x,
      data.y,
      craftTextures.accessoryTextureKey(cust.accessory, cust.colorIdx),
    );
    accessory.setDisplaySize(48, 48);
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

  const isQuiet = !!data.quietMode;
  const targetAlpha = isQuiet ? 0.35 : 1;
  sprite.setAlpha(0); sprite.setScale(0.3);
  scene.tweens.add({ targets: [sprite], alpha: targetAlpha, scale: 1, duration: 400, ease: 'Back.easeOut' });
  label.setAlpha(0);
  scene.tweens.add({ targets: [label], alpha: targetAlpha, duration: 400, delay: 150 });
  if (accessory) {
    accessory.setAlpha(0); accessory.setScale(0.3);
    scene.tweens.add({ targets: [accessory], alpha: targetAlpha, scale: 1, duration: 400, ease: 'Back.easeOut' });
  }

  sprite.setInteractive({ useHandCursor: true });
  sprite.on('pointerdown', (pointer) => {
    vibeTargetId = data.id;
    // Update mute button state for this target
    if (mutedPlayers.has(data.id)) {
      muteActionBtn.textContent = 'Unmute';
      muteActionBtn.classList.add('active');
    } else {
      muteActionBtn.textContent = 'Mute';
      muteActionBtn.classList.remove('active');
    }
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
    quietMode: isQuiet,
    customization: cust,
    idleState: idleState.createIdleState(),
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

function applyRoomVisualStyle(style) {
  if (!scene) return;
  roomStyle = roomStyles.normalizeStyle(style, roomTheme);
  roomTheme = roomStyle.preset;
  roomStyleSlot = craftTextures.installRoomStyle(scene, roomStyle);
  const visual = getRoomVisualTheme(roomStyle);
  document.body.dataset.roomTheme = visual.name;
  document.body.dataset.roomIntensity = roomStyles.INTENSITIES[roomStyle.intensity].id;
  document.documentElement.style.setProperty('--room-wall', roomStyle.wall);
  document.documentElement.style.setProperty('--room-floor', roomStyle.floor);
  document.documentElement.style.setProperty('--room-accent', roomStyle.accent);
  scene.cameras.main.setBackgroundColor(visual.background);

  if (scene.floorTiles) {
    scene.floorTiles.forEach(tile => {
      tile.setTexture(craftTextures.floorTextureKey(roomStyleSlot));
      tile.setDisplaySize(128, 128);
      tile.setAlpha(1);
    });
  }

  if (scene.wallGroup) {
    scene.wallGroup.getChildren().forEach(wall => {
      wall.setTexture(craftTextures.wallTextureKey(roomStyleSlot));
      wall.setDisplaySize(64, 64);
      wall.setAlpha(1);
    });
  }

  roomFurniture.forEach(f => {
    if (!f.sprite) return;
    f.sprite.setTexture(craftTextures.furnitureTextureKey(roomStyleSlot, f.item.t, f.interactiveOn));
    f.sprite.setDisplaySize(f.baseFp.w * 64, f.baseFp.h * 64);
  });
  refreshFurniturePaletteArtwork(roomStyleSlot);
  updateRoomStyleUI();
}

function applyRoomVisualTheme(theme) {
  applyRoomVisualStyle(roomStyles.styleFromPreset(theme));
}

const INTERACTIVE_FURNITURE_TYPES = new Set(
  FURNITURE_DEFS.map((definition, type) => definition.interactive ? type : -1).filter(type => type >= 0),
);

function setFurnitureInteractiveVisual(furniture, state, animate = false) {
  if (!furniture || !furniture.sprite) return;
  furniture.interactiveOn = state === true;
  const alpha = furniture.interactiveOn ? 0.25 : 0;
  const textureKey = craftTextures.furnitureTextureKey(
    roomStyleSlot,
    furniture.item.t,
    furniture.interactiveOn,
  );
  furniture.sprite.setTexture(textureKey);
  furniture.sprite.setDisplaySize(furniture.baseFp.w * 64, furniture.baseFp.h * 64);

  if (animate) {
    if (furniture.glow) {
      scene.tweens.add({ targets: [furniture.glow], alpha, duration: 300, ease: 'Power2' });
    }
    scene.tweens.add({
      targets: furniture.sprite,
      scaleX: furniture.sprite.scaleX * 1.04,
      scaleY: furniture.sprite.scaleY * 1.04,
      duration: 120,
      yoyo: true,
      ease: 'Sine.easeOut',
    });
  } else if (furniture.glow) {
    furniture.glow.setAlpha(alpha);
  }
}

function renderFurnitureItem(item) {
  if (!scene) return;
  const fp = getClientFootprint(item.t, item.r);
  const baseFp = getClientFootprint(item.t, 0);
  const x = item.x * 64 + (fp.w * 64) / 2;
  const y = item.y * 64 + (fp.h * 64) / 2;
  const sprite = scene.add.sprite(
    x,
    y,
    craftTextures.furnitureTextureKey(roomStyleSlot, item.t, item.on === true),
  );
  sprite.setDepth(1);
  sprite.setAlpha(1);
  // Size the unrotated recipe first; rotation then swaps rectangular bounds.
  sprite.setDisplaySize(baseFp.w * 64, baseFp.h * 64);
  if (item.r) sprite.setAngle(item.r * 90);
  if (!fp.walkable && scene.furnitureGroup) {
    scene.furnitureGroup.add(sprite);
  }

  let glow = null;
  if (INTERACTIVE_FURNITURE_TYPES.has(item.t)) {
    const definition = FURNITURE_DEFS[item.t];
    sprite.setInteractive({ useHandCursor: true });
    sprite.on('pointerdown', () => {
      if (socket && socket.connected && item.id != null) {
        socket.emit('toggleFurniture', { id: item.id });
      }
    });
    const warmGlowRecipes = new Set([
      'table-lamp', 'floor-lamp', 'sconce', 'pendant', 'lantern',
      'desk-lamp', 'candles', 'fireplace',
    ]);
    const screenGlowRecipes = new Set(['television', 'computer', 'radio', 'record-player', 'coffee-station']);
    if (warmGlowRecipes.has(definition.recipe)) {
      glow = scene.add.circle(x, y, Math.max(fp.w, fp.h) * 40, 0xffaa00, 0);
      glow.setDepth(0);
    } else if (screenGlowRecipes.has(definition.recipe)) {
      glow = scene.add.rectangle(x, y, baseFp.w * 48, baseFp.h * 32, 0x6ca9aa, 0);
      if (item.r) glow.setAngle(item.r * 90);
      glow.setDepth(0);
    }
  }

  roomFurniture.push({ sprite, item, fp, baseFp, glow, interactiveOn: false });
}

// ═══════════════════════════════════════════════════════
// ROOM MEMORY CARD
// ═══════════════════════════════════════════════════════

const CARD_WIDTH = 320;
const CARD_HEIGHT = 200;
const CARD_DATA_ROW = CARD_HEIGHT - 1;

function generateRoomCard(roomId, furniture, styleValue) {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  const style = roomStyles.normalizeStyle(styleValue);
  const visual = getRoomVisualTheme(style);
  const styleSlot = craftTextures.installRoomStyle(scene, style);

  const floorSource = scene?.textures
    .get(craftTextures.floorTextureKey(styleSlot))
    .getSourceImage();
  if (floorSource) {
    const backgroundPattern = ctx.createPattern(floorSource, 'repeat');
    ctx.fillStyle = backgroundPattern;
  } else {
    ctx.fillStyle = visual.background;
  }
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  ctx.fillStyle = 'rgba(15, 15, 16, 0.48)';
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  ctx.strokeStyle = visual.wall;
  ctx.lineWidth = 8;
  ctx.strokeRect(5, 5, CARD_WIDTH - 10, CARD_HEIGHT - 10);
  ctx.strokeStyle = visual.light;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.strokeRect(9, 9, CARD_WIDTH - 18, CARD_HEIGHT - 18);
  ctx.setLineDash([]);

  // Header text
  ctx.fillStyle = visual.light;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('FreeLobby Room Card', CARD_WIDTH / 2, 29);

  // Mini grid preview
  const previewX = 80;
  const previewY = 55;
  const previewW = 160;
  const previewH = 96;
  const cellSize = 8;

  ctx.fillStyle = visual.floor;
  ctx.fillRect(previewX, previewY, previewW, previewH);

  // Stitched grid lines
  ctx.strokeStyle = visual.seam;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([2, 2]);
  for (let gx = 0; gx <= previewW; gx += cellSize) {
    ctx.beginPath(); ctx.moveTo(previewX + gx, previewY); ctx.lineTo(previewX + gx, previewY + previewH); ctx.stroke();
  }
  for (let gy = 0; gy <= previewH; gy += cellSize) {
    ctx.beginPath(); ctx.moveTo(previewX, previewY + gy); ctx.lineTo(previewX + previewW, previewY + gy); ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  if (furniture) {
    furniture.forEach(item => {
      const px = previewX + item.x * cellSize;
      const py = previewY + item.y * cellSize;
      const fp = getClientFootprint(item.t, item.r);
      const baseFp = getClientFootprint(item.t, 0);
      const source = scene?.textures
        .get(craftTextures.furnitureTextureKey(styleSlot, item.t, item.on === true))
        .getSourceImage();
      if (source) {
        const drawWidth = baseFp.w * cellSize;
        const drawHeight = baseFp.h * cellSize;
        const rotation = ((item.r || 0) % 4 + 4) % 4;
        ctx.save();
        ctx.translate(
          px + (fp.w * cellSize) / 2,
          py + (fp.h * cellSize) / 2,
        );
        ctx.rotate(rotation * Math.PI / 2);
        ctx.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
        ctx.restore();
      }
    });
  }

  // Footer branding
  ctx.fillStyle = visual.secondary;
  ctx.font = '10px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(roomId || 'PRIVATE', CARD_WIDTH - 15, CARD_HEIGHT - 14);

  // ─── Encode data strip in bottom pixel row ───
  // We use 2 pixels per item to avoid alpha=0 corruption.
  // Format v2: style header + 2 pixels per furniture item.
  const imgData = ctx.getImageData(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const data = imgData.data;
  const rowOffset = CARD_DATA_ROW * CARD_WIDTH * 4;

  cardCodec.writeCardData(data, rowOffset, furniture || [], style);

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

        callback(cardCodec.readCardData(data, rowOffset, 100), null);
      } catch (err) {
        callback(null, err && err.message ? err.message : 'Failed to decode card data.');
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
    socket.emit('getCommonRooms');
    socket.emit('getPublicRooms');
    startPublicRoomsPolling();
    renderBookmarks();

    if (!joinMode) return; // Still on landing page

    if (joinMode === 'random') socket.emit('joinRandomRoom', { name: playerName, customization: CUSTOMIZATION });
    else if (joinMode === 'create') socket.emit('createRoom', { name: playerName, customization: CUSTOMIZATION, isPublic: false });
    else if (joinMode === 'code') socket.emit('joinRoom', { roomId: joinRoomCode, name: playerName, customization: CUSTOMIZATION });
    else if (joinMode === 'common') socket.emit('joinCommonRoom', { roomId: joinRoomCode, name: playerName, customization: CUSTOMIZATION });
  });

  socket.on('roomJoined', (data) => {
    if (!scene) {
      // Game not ready yet — queue for processing in create()
      pendingRoomJoined = data;
      return;
    }
    processRoomJoined(data);
  });

  function processRoomJoined({ roomId, you, players, isOwner, isPublic, isCommon, commonName, furniture, theme, style, interactiveStates, ambientTrack, width, height }) {
    currentRoomId = roomId;
    roomIdDisplay.textContent = roomId;
    isRoomOwner = !!isOwner;
    currentRoomIsPublic = isPublic !== false;
    roomTheme = theme || 0;
    roomStyle = roomStyles.normalizeStyle(style || roomStyles.styleFromPreset(roomTheme), roomTheme);
    quietMode = !!you.quietMode;
    quietBtn.classList.toggle('active', quietMode);
    quietBtn.setAttribute('aria-pressed', String(quietMode));
    idleState.resetIdleState(localIdleState);
    // Build mode only available in private rooms where you are the owner
    const canBuild = isRoomOwner && !isPublic;
    if (canBuild) {
      ownerBadge.classList.add('visible');
      buildBtn.classList.add('visible');
    } else {
      ownerBadge.classList.remove('visible');
      buildBtn.classList.remove('visible');
      setBuildDrawerSnap('closed');
      setExpandedPanel(buildBtn, furniturePanel, false);
      buildMode = false;
    }
    console.log(`✦ Joined room ${roomId}. Local player: ${you.name}. Owner: ${isRoomOwner}. Public: ${isPublic !== false}. Style: ${roomStyles.PRESETS[roomStyle.preset].name}.`);

    // Update room dimensions
    ROOM_WIDTH = width || 1200;
    ROOM_HEIGHT = height || 800;
    if (scene) {
      scene.physics.world.setBounds(0, 0, ROOM_WIDTH, ROOM_HEIGHT);
      // No camera bounds — camera follows player freely, panning unrestricted
      if (scene.drawRoomWalls) scene.drawRoomWalls(ROOM_WIDTH, ROOM_HEIGHT);
    }

    // Update room info display for common rooms
    if (isCommon && commonName) {
      roomIdDisplay.textContent = commonName;
    }

    // Update bookmark button state
    if (bookmarkedRooms.has(roomId)) {
      setBookmarkButtonState(true);
    } else {
      setBookmarkButtonState(false);
    }

    // Clean up previous room state if fleeing
    for (const [id, _] of otherPlayers) {
      removeOtherPlayer(id);
    }
    roomFurniture.forEach(f => {
      if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
      if (f.glow) f.glow.destroy();
    });
    roomFurniture = [];
    if (furniture) furniture.forEach(item => renderFurnitureItem(item));

    // Apply interactive states after rendering
    if (interactiveStates) {
      for (const [idStr, state] of Object.entries(interactiveStates)) {
        const id = Number(idStr);
        const f = roomFurniture.find(rf => rf.item.id === id);
        if (f) setFurnitureInteractiveVisual(f, state, false);
      }
    }

    // Ambient audio setup (private rooms only)
    if (!isPublic) {
      ambientPanel.classList.add('visible');
      ambientTrackBtns.forEach(btn => {
        btn.classList.toggle('disabled', !isRoomOwner);
        btn.disabled = !isRoomOwner;
        btn.setAttribute('aria-disabled', String(!isRoomOwner));
      });
      setAmbientTrack(ambientTrack || 0);
    } else {
      ambientPanel.classList.remove('visible');
      stopAmbient();
    }

    // Music maker only in private rooms
    if (!isPublic) {
      musicBtn.classList.add('visible');
      buildMusicGrid();
    } else {
      musicBtn.classList.remove('visible');
      setExpandedPanel(musicBtn, musicPanel, false);
      seqStop();
    }

    if (player) {
      // Reposition and keep the local craft avatar in sync.
      player.setPosition(you.x, you.y);
      myColor = you.color;
      if (nameLabel) nameLabel.setPosition(you.x, you.y - 30);
      if (playerAccessory) playerAccessory.setPosition(you.x, you.y);
      player.setAlpha(quietMode ? 0.35 : 1);
      if (playerAccessory) playerAccessory.setAlpha(quietMode ? 0.35 : 1);
      if (nameLabel) nameLabel.setAlpha(quietMode ? 0.35 : 1);
      standUp(player, playerAccessory);
    } else {
      spawnLocalPlayer(you);
    }

    for (const [id, pData] of Object.entries(players)) {
      if (id !== socket.id) spawnOtherPlayer(pData);
    }
    updatePlayerCount();

    // Announce room join to screen readers
    const roomName = isCommon && commonName ? commonName : `Room ${roomId}`;
    const playerCount = Object.keys(players).length;
    announce(`Joined ${roomName}. ${playerCount} player${playerCount !== 1 ? 's' : ''} present.`);
  }

  socket.on('commonRoomsList', (rooms) => {
    renderCommonRooms(rooms);
  });

  socket.on('publicRoomsList', (rooms) => {
    renderPublicRooms(rooms);
  });

  socket.on('playerJoined', (data) => {
    if (!scene) return;
    console.log(`✦ Player joined: ${data.strangerName || 'Stranger'} [${data.id}]`);
    spawnOtherPlayer(data);
    announce(`${data.strangerName || 'A stranger'} joined the room`);
    updatePlayerCount();
  });

  socket.on('playerLeft', ({ id }) => {
    if (!scene) return;
    console.log(`✧ Player left: [${id}]`);
    const other = otherPlayers.get(id);
    const name = other ? (other.revealed ? other.realName : other.strangerName) : 'A stranger';
    removeOtherPlayer(id);
    announce(`${name} left the room`);
    updatePlayerCount();
  });

  socket.on('playerMoved', ({ id, x, y }) => {
    if (!scene) return;
    const other = otherPlayers.get(id);
    if (other) { other.targetX = x; other.targetY = y; }
  });

  socket.on('playerQuietMode', ({ id, enabled }) => {
    if (!scene) return;
    const other = otherPlayers.get(id);
    if (!other) return;
    other.quietMode = enabled;
    const alpha = enabled ? 0.35 : 1;
    if (other.sprite) other.sprite.setAlpha(alpha);
    if (other.accessory) other.accessory.setAlpha(alpha);
    if (other.nameLabel) other.nameLabel.setAlpha(alpha);
  });

  // ── Phase 3: Emotes & Signs ──
  socket.on('playerEmote', ({ id, emote }) => {
    if (!scene) return;
    if (mutedPlayers.has(id)) return; // Mute filter
    const sprite = getSpriteForPlayer(id);
    if (sprite) showEmoteBubble(sprite, emote);
  });

  socket.on('playerSign', ({ id, text }) => {
    if (!scene) return;
    const sprite = getSpriteForPlayer(id);
    if (sprite) showSignBubble(sprite, text);
  });

  // ── Phase 4: Vibe Check ──
  socket.on('vibeCheckPrompt', ({ fromId }) => {
    if (!scene) return;
    // Someone wants to vibe check us
    vibePromptFromId = fromId;

    // Update prompt text with the stranger's name
    const other = otherPlayers.get(fromId);
    if (other) {
      const displayName = other.revealed ? other.realName : other.strangerName;
      document.getElementById('vibe-prompt-text').innerText = `${displayName} initiated a vibe check, do you wish to allow chat and share names with this user?`;
    }

    vibePrompt.classList.add('visible');
    vibePrompt.setAttribute('aria-hidden', 'false');
    trapFocus(vibePrompt);
    announce('Vibe check request received');

    // Auto-dismiss after 15s if no response
    setTimeout(() => {
      if (vibePromptFromId === fromId) {
        vibePrompt.classList.remove('visible');
        vibePrompt.setAttribute('aria-hidden', 'true');
        releaseFocus(vibePrompt);
        vibePromptFromId = null;
      }
    }, 15000);
  });

  socket.on('vibeCheckRevealed', ({ playerId, name }) => {
    if (!scene) return;
    // Mutual name reveal!
    revealPlayerName(playerId, name);
    announce(`Vibe check accepted. ${name} revealed their name.`);
  });

  socket.on('furniturePlaced', ({ item }) => {
    if (!scene) return;
    renderFurnitureItem(item);
  });

  socket.on('furnitureToggled', ({ id, state }) => {
    if (!scene) return;
    const f = roomFurniture.find(rf => rf.item.id === id);
    if (!f || !f.glow) return;
    setFurnitureInteractiveVisual(f, state, true);
  });

  socket.on('furnitureRemoved', ({ index }) => {
    if (!scene) return;
    if (index >= 0 && index < roomFurniture.length) {
      const f = roomFurniture[index];
      if (scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
      if (f.glow) f.glow.destroy();
      roomFurniture.splice(index, 1);
    }
  });

  socket.on('roomFurnitureReset', ({ furniture, theme, style, interactiveStates }) => {
    if (!scene) return;
    roomFurniture.forEach(f => {
      if (scene && scene.furnitureGroup) scene.furnitureGroup.remove(f.sprite);
      f.sprite.destroy();
      if (f.glow) f.glow.destroy();
    });
    roomFurniture = [];
    if (typeof theme === 'number') roomTheme = theme;
    roomStyle = roomStyles.normalizeStyle(style || roomStyles.styleFromPreset(roomTheme), roomTheme);
    applyRoomVisualStyle(roomStyle);
    if (furniture) furniture.forEach(item => renderFurnitureItem(item));
    if (interactiveStates) {
      for (const [idStr, state] of Object.entries(interactiveStates)) {
        const id = Number(idStr);
        const f = roomFurniture.find(rf => rf.item.id === id);
        if (f) setFurnitureInteractiveVisual(f, state, false);
      }
    }
  });

  socket.on('roomThemeChanged', ({ theme }) => {
    if (!scene) return;
    if (typeof theme === 'number') roomTheme = theme;
    applyRoomVisualTheme(roomTheme);
  });

  socket.on('roomStyleChanged', ({ theme, style }) => {
    if (!scene) return;
    if (typeof theme === 'number') roomTheme = theme;
    applyRoomVisualStyle(style || roomStyles.styleFromPreset(roomTheme));
  });

  socket.on('ambientTrackChanged', ({ track }) => {
    if (!scene) return;
    setAmbientTrack(track);
  });

  socket.on('buildError', ({ message }) => {
    if (!scene) return;
    showError(message);
  });

  socket.on('inputError', ({ message }) => {
    showError(message);
  });

  socket.on('idleTimeout', ({ message }) => {
    showError(message);
    exitGame();
    setConnectionStatus(true);
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

// Connect on page load so common rooms populate before user clicks anything
connectSocket();
renderBookmarks();
