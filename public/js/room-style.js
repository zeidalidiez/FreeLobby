(function roomStyleModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyRoomStyles = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRoomStyleApi() {
  const INTENSITIES = Object.freeze([
    { id: 'quiet', name: 'Quiet' },
    { id: 'cozy', name: 'Cozy' },
    { id: 'layered', name: 'Layered' },
  ]);

  const PRESETS = Object.freeze([
    Object.freeze({
      id: 'welcome-inn',
      name: 'Welcome Inn',
      description: 'Oatmeal, walnut, sage, and a little rust.',
      wall: '#eadfc8',
      floor: '#9a7654',
      accent: '#4f8079',
      intensity: 1,
      palette: Object.freeze({
        name: 'welcome-inn',
        background: '#261f19',
        floor: '#9a7654',
        seam: '#745d47',
        wall: '#eadfc8',
        primary: '#75846a',
        secondary: '#d8c49d',
        accent: '#b86645',
        dark: '#3f4c49',
        light: '#f8ecd3',
        leaf: '#657f58',
        water: '#608e8d',
        wood: '#805737',
      }),
    }),
    Object.freeze({
      id: 'garden-suite',
      name: 'Garden Suite',
      description: 'Soft moss, washed linen, and terracotta.',
      wall: '#dfe3c6',
      floor: '#7e7754',
      accent: '#68865f',
      intensity: 1,
      palette: Object.freeze({
        name: 'garden-suite',
        background: '#20251b',
        floor: '#7e7754',
        seam: '#666047',
        wall: '#dfe3c6',
        primary: '#718f66',
        secondary: '#d7cca5',
        accent: '#bd7145',
        dark: '#3d4b3e',
        light: '#f3ead1',
        leaf: '#638c55',
        water: '#668d84',
        wood: '#7f6042',
      }),
    }),
    Object.freeze({
      id: 'sunroom',
      name: 'Sunroom',
      description: 'Warm canvas, pale wood, teal, and marigold.',
      wall: '#f2e5c6',
      floor: '#c69a62',
      accent: '#d3933d',
      intensity: 1,
      palette: Object.freeze({
        name: 'sunroom',
        background: '#3b2d1e',
        floor: '#c69a62',
        seam: '#8c6b49',
        wall: '#f2e5c6',
        primary: '#4f8b86',
        secondary: '#ead3a4',
        accent: '#d3933d',
        dark: '#465958',
        light: '#fff2d4',
        leaf: '#6e8d58',
        water: '#64a0a0',
        wood: '#9a6c3f',
      }),
    }),
    Object.freeze({
      id: 'midnight',
      name: 'Midnight',
      description: 'The original low-light blue room.',
      wall: '#655c72',
      floor: '#1d2330',
      accent: '#4d6f91',
      intensity: 0,
      palette: Object.freeze({
        name: 'midnight',
        background: '#12151c',
        floor: '#1d2330',
        seam: '#776b68',
        wall: '#655c72',
        primary: '#4d6f91',
        secondary: '#b9a989',
        accent: '#bd664e',
        dark: '#2d3545',
        light: '#eadcbf',
        leaf: '#607f58',
        water: '#4f8497',
        wood: '#87634a',
      }),
    }),
  ]);

  function isPlainObject(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function normalizeHex(value, fallback) {
    const candidate = String(value || '').trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(candidate) ? candidate : fallback;
  }

  function styleFromPreset(preset = 0) {
    const index = Number.isInteger(preset) && preset >= 0 && preset < PRESETS.length ? preset : 0;
    const definition = PRESETS[index];
    return {
      preset: index,
      wall: definition.wall,
      floor: definition.floor,
      accent: definition.accent,
      intensity: definition.intensity,
    };
  }

  function normalizeStyle(value, fallbackPreset = 0) {
    const source = isPlainObject(value) ? value : {};
    const preset = Number.isInteger(source.preset) && source.preset >= 0 && source.preset < PRESETS.length
      ? source.preset
      : (Number.isInteger(fallbackPreset) && fallbackPreset >= 0 && fallbackPreset < PRESETS.length ? fallbackPreset : 0);
    const fallback = styleFromPreset(preset);
    return {
      preset,
      wall: normalizeHex(source.wall, fallback.wall),
      floor: normalizeHex(source.floor, fallback.floor),
      accent: normalizeHex(source.accent, fallback.accent),
      intensity: Number.isInteger(source.intensity) && source.intensity >= 0 && source.intensity < INTENSITIES.length
        ? source.intensity
        : fallback.intensity,
    };
  }

  function validateStyle(value) {
    if (!isPlainObject(value)) return ['Room style must be an object.'];
    const errors = [];
    if (!Number.isInteger(value.preset) || value.preset < 0 || value.preset >= PRESETS.length) {
      errors.push('Unknown room style preset.');
    }
    for (const field of ['wall', 'floor', 'accent']) {
      if (typeof value[field] !== 'string' || !/^#[0-9a-f]{6}$/i.test(value[field])) {
        errors.push(`Room style ${field} must be a six-digit hex color.`);
      }
    }
    if (!Number.isInteger(value.intensity) || value.intensity < 0 || value.intensity >= INTENSITIES.length) {
      errors.push('Unknown room style intensity.');
    }
    return errors;
  }

  function hexToRgb(value) {
    const normalized = normalizeHex(value, '#808080').slice(1);
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function rgbToHex({ r, g, b }) {
    return `#${[r, g, b].map(channel => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')).join('')}`;
  }

  function mix(first, second, amount = 0.5) {
    const a = hexToRgb(first);
    const b = hexToRgb(second);
    const t = Math.max(0, Math.min(1, amount));
    return rgbToHex({
      r: a.r + (b.r - a.r) * t,
      g: a.g + (b.g - a.g) * t,
      b: a.b + (b.b - a.b) * t,
    });
  }

  function paletteForStyle(value) {
    const style = normalizeStyle(value);
    const base = PRESETS[style.preset].palette;
    const accentMix = [0.08, 0.2, 0.36][style.intensity];
    const contrast = [0.58, 0.94, 1.24][style.intensity];
    return {
      ...base,
      name: PRESETS[style.preset].id,
      background: mix(style.floor, '#15110e', style.intensity === 0 ? 0.74 : 0.66),
      floor: style.floor,
      wall: style.wall,
      accent: style.accent,
      primary: mix(base.primary, style.accent, accentMix),
      seam: style.intensity === 0 ? mix(style.floor, style.wall, 0.22) : mix(base.seam, style.accent, 0.12),
      light: style.intensity === 0 ? mix(base.light, style.wall, 0.4) : base.light,
      textureContrast: contrast,
      intensity: style.intensity,
    };
  }

  function isPresetStyle(value) {
    const style = normalizeStyle(value);
    const presetStyle = styleFromPreset(style.preset);
    return style.wall === presetStyle.wall
      && style.floor === presetStyle.floor
      && style.accent === presetStyle.accent
      && style.intensity === presetStyle.intensity;
  }

  function styleSignature(value) {
    const style = normalizeStyle(value);
    return `${style.preset}:${style.wall}:${style.floor}:${style.accent}:${style.intensity}`;
  }

  return {
    INTENSITIES,
    PRESETS,
    isPresetStyle,
    mix,
    normalizeHex,
    normalizeStyle,
    paletteForStyle,
    styleFromPreset,
    styleSignature,
    validateStyle,
  };
});
