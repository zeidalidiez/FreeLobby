(function craftTexturesModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyCraft = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCraftTexturesApi() {
  const SOURCE_MATERIALS = Object.freeze({
    denim: 'denim-dark.jpg',
    linen: 'linen.jpg',
    cotton: 'cotton.jpg',
    fleece: 'fleece.jpg',
    hessian: 'hessian.jpg',
    corduroy: 'corduroy.jpg',
    board: 'board.jpg',
  });

  const THEME_PALETTES = Object.freeze([
    {
      name: 'lobby',
      background: '#101419',
      floor: '#1c252b',
      seam: '#806d57',
      wall: '#8f6b46',
      primary: '#287f7c',
      secondary: '#d7c39c',
      accent: '#c9653f',
      dark: '#293b48',
      light: '#f0dfb8',
      leaf: '#668a54',
      water: '#4c94a0',
      wood: '#9b7047',
    },
    {
      name: 'garden',
      background: '#111711',
      floor: '#20291f',
      seam: '#766f4f',
      wall: '#8b754d',
      primary: '#5f8552',
      secondary: '#c8bd86',
      accent: '#cc7b3f',
      dark: '#314339',
      light: '#ede0bd',
      leaf: '#719b56',
      water: '#4d8f88',
      wood: '#8a6846',
    },
    {
      name: 'library',
      background: '#17131b',
      floor: '#29212d',
      seam: '#8a6a61',
      wall: '#76516a',
      primary: '#795277',
      secondary: '#c8a78e',
      accent: '#b65e45',
      dark: '#343040',
      light: '#ead9bc',
      leaf: '#687a52',
      water: '#547e90',
      wood: '#805c46',
    },
    {
      name: 'private',
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
    },
  ]);

  const SHAPE_NAMES = Object.freeze(['circle', 'square', 'diamond']);
  const ACCESSORY_NAMES = Object.freeze(['none', 'headphones', 'halo', 'beanie']);
  const DEFAULT_PLAYER_COLORS = Object.freeze([
    '#2db8b2', '#d85a9a', '#74b84d', '#d94d77', '#dfba3e',
    '#dc773c', '#9d62c4', '#4c7dcc', '#d65b52', '#34ae88',
  ]);

  const generatedPreviewUrls = new Map();

  function clamp(value, min = 0, max = 255) {
    return Math.min(max, Math.max(min, value));
  }

  function hexToRgb(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return {
        r: (value >> 16) & 255,
        g: (value >> 8) & 255,
        b: value & 255,
      };
    }

    const normalized = String(value || '').trim().replace(/^#/, '');
    if (!/^[0-9a-f]{6}$/i.test(normalized)) return { r: 128, g: 128, b: 128 };
    return {
      r: Number.parseInt(normalized.slice(0, 2), 16),
      g: Number.parseInt(normalized.slice(2, 4), 16),
      b: Number.parseInt(normalized.slice(4, 6), 16),
    };
  }

  function toHex(value) {
    const { r, g, b } = hexToRgb(value);
    return `#${[r, g, b].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  function furnitureTextureKey(theme, type, on = false) {
    const normalizedTheme = Number.isInteger(theme)
      ? ((theme % THEME_PALETTES.length) + THEME_PALETTES.length) % THEME_PALETTES.length
      : 0;
    return `craft-furn-${normalizedTheme}-${type}${on ? '-on' : ''}`;
  }

  function playerTextureKey(shape, colorIndex) {
    const shapeName = SHAPE_NAMES[shape] || SHAPE_NAMES[0];
    const normalizedColor = Number.isInteger(colorIndex) && colorIndex >= 0
      ? colorIndex % DEFAULT_PLAYER_COLORS.length
      : 0;
    return `craft-player-${shapeName}-${normalizedColor}`;
  }

  function accessoryTextureKey(accessory, colorIndex) {
    const accessoryName = ACCESSORY_NAMES[accessory] || ACCESSORY_NAMES[0];
    const normalizedColor = Number.isInteger(colorIndex) && colorIndex >= 0
      ? colorIndex % DEFAULT_PLAYER_COLORS.length
      : 0;
    return `craft-accessory-${accessoryName}-${normalizedColor}`;
  }

  function floorTextureKey(theme) {
    return `craft-floor-${Number.isInteger(theme) ? theme % THEME_PALETTES.length : 0}`;
  }

  function wallTextureKey(theme) {
    return `craft-wall-${Number.isInteger(theme) ? theme % THEME_PALETTES.length : 0}`;
  }

  function preload(scene) {
    for (const [id, filename] of Object.entries(SOURCE_MATERIALS)) {
      scene.load.image(`craft-source-${id}`, `assets/materials/${filename}`);
    }
  }

  function createCanvas(logicalWidth, logicalHeight, scale = 2) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(logicalWidth * scale));
    canvas.height = Math.max(1, Math.round(logicalHeight * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.scale(scale, scale);
    return { canvas, context, scale };
  }

  function roundedRectPath(x, y, width, height, radius) {
    const r = Math.min(Math.max(radius, 0), width / 2, height / 2);
    const path = new Path2D();
    path.moveTo(x + r, y);
    path.lineTo(x + width - r, y);
    path.quadraticCurveTo(x + width, y, x + width, y + r);
    path.lineTo(x + width, y + height - r);
    path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    path.lineTo(x + r, y + height);
    path.quadraticCurveTo(x, y + height, x, y + height - r);
    path.lineTo(x, y + r);
    path.quadraticCurveTo(x, y, x + r, y);
    path.closePath();
    return path;
  }

  function ellipsePath(cx, cy, radiusX, radiusY) {
    const path = new Path2D();
    path.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    path.closePath();
    return path;
  }

  function polygonPath(points) {
    const path = new Path2D();
    if (!Array.isArray(points) || points.length === 0) return path;
    path.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index++) {
      path.lineTo(points[index][0], points[index][1]);
    }
    path.closePath();
    return path;
  }

  function linePath(points, closed = false) {
    const path = new Path2D();
    if (!Array.isArray(points) || points.length === 0) return path;
    path.moveTo(points[0][0], points[0][1]);
    for (let index = 1; index < points.length; index++) {
      path.lineTo(points[index][0], points[index][1]);
    }
    if (closed) path.closePath();
    return path;
  }

  function centerCropImage(context, image, size) {
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const sourceSize = Math.min(sourceWidth, sourceHeight);
    const sourceX = Math.floor((sourceWidth - sourceSize) / 2);
    const sourceY = Math.floor((sourceHeight - sourceSize) / 2);
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
  }

  function makeTintedTile(image, color, contrast = 1) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    centerCropImage(context, image, size);
    const imageData = context.getImageData(0, 0, size, size);
    const pixels = imageData.data;
    let luminanceTotal = 0;
    const pixelCount = pixels.length / 4;

    for (let offset = 0; offset < pixels.length; offset += 4) {
      luminanceTotal += pixels[offset] * 0.2126
        + pixels[offset + 1] * 0.7152
        + pixels[offset + 2] * 0.0722;
    }

    const averageLuminance = luminanceTotal / Math.max(pixelCount, 1);
    const base = hexToRgb(color);
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const luminance = pixels[offset] * 0.2126
        + pixels[offset + 1] * 0.7152
        + pixels[offset + 2] * 0.0722;
      const detail = clamp(1 + ((luminance - averageLuminance) / 255) * contrast, 0.56, 1.42);
      pixels[offset] = clamp(base.r * detail);
      pixels[offset + 1] = clamp(base.g * detail);
      pixels[offset + 2] = clamp(base.b * detail);
      pixels[offset + 3] = 255;
    }

    context.putImageData(imageData, 0, 0);
    return canvas;
  }

  function patternFor(context, tile) {
    return context.createPattern(tile, 'repeat') || '#777';
  }

  function drawShadow(context, path, options = {}) {
    context.save();
    context.fillStyle = options.color || 'rgba(0, 0, 0, 0.34)';
    context.shadowColor = options.color || 'rgba(0, 0, 0, 0.34)';
    context.shadowBlur = options.blur ?? 4;
    context.shadowOffsetX = options.offsetX ?? 1.5;
    context.shadowOffsetY = options.offsetY ?? 2.5;
    context.fill(path);
    context.restore();
  }

  function fillTexture(context, path, tile, options = {}) {
    context.save();
    if (options.shadow) drawShadow(context, path, options.shadow === true ? {} : options.shadow);
    context.fillStyle = patternFor(context, tile);
    context.fill(path);
    if (options.stroke) {
      context.strokeStyle = options.stroke;
      context.lineWidth = options.lineWidth || 1;
      context.lineJoin = 'round';
      context.lineCap = 'round';
      context.stroke(path);
    }
    context.restore();
  }

  function strokeTexture(context, path, tile, width = 3) {
    context.save();
    context.strokeStyle = patternFor(context, tile);
    context.lineWidth = width;
    context.lineJoin = 'round';
    context.lineCap = 'round';
    context.stroke(path);
    context.restore();
  }

  function stitch(context, path, color, options = {}) {
    context.save();
    context.strokeStyle = color;
    context.globalAlpha = options.alpha ?? 0.9;
    context.lineWidth = options.width || 1.2;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.setLineDash(options.dash || [3, 2.5]);
    context.lineDashOffset = options.offset || 0;
    context.stroke(path);
    context.restore();
  }

  function solidStroke(context, path, color, width = 1.5) {
    context.save();
    context.strokeStyle = color;
    context.lineWidth = width;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke(path);
    context.restore();
  }

  function crossStitch(context, x, y, color, size = 2) {
    solidStroke(context, linePath([[x - size, y - size], [x + size, y + size]]), color, 0.8);
    solidStroke(context, linePath([[x + size, y - size], [x - size, y + size]]), color, 0.8);
  }

  function createThemeMaterials(sourceImages, palette) {
    return {
      floor: makeTintedTile(sourceImages.denim, palette.floor, 1.08),
      wall: makeTintedTile(sourceImages.board, palette.wall, 0.82),
      primary: makeTintedTile(sourceImages.fleece, palette.primary, 1.12),
      secondary: makeTintedTile(sourceImages.linen, palette.secondary, 0.96),
      accent: makeTintedTile(sourceImages.hessian, palette.accent, 1.05),
      dark: makeTintedTile(sourceImages.corduroy, palette.dark, 0.96),
      light: makeTintedTile(sourceImages.cotton, palette.light, 0.9),
      leaf: makeTintedTile(sourceImages.linen, palette.leaf, 1.08),
      water: makeTintedTile(sourceImages.linen, palette.water, 1.02),
      wood: makeTintedTile(sourceImages.board, palette.wood, 0.9),
    };
  }

  function drawFloor(materials, palette) {
    const { canvas, context } = createCanvas(128, 128, 2);
    fillTexture(context, roundedRectPath(0, 0, 128, 128, 0), materials.floor);

    context.save();
    context.globalAlpha = 0.045;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 128, 1);
    context.fillRect(0, 64, 128, 1);
    context.fillRect(0, 127, 128, 1);
    context.fillRect(0, 0, 1, 128);
    context.fillRect(64, 0, 1, 128);
    context.fillRect(127, 0, 1, 128);
    context.restore();

    stitch(context, linePath([[0, 64], [128, 64]]), palette.seam, { width: 1, dash: [4, 4], alpha: 0.38 });
    stitch(context, linePath([[64, 0], [64, 128]]), palette.seam, { width: 1, dash: [4, 4], alpha: 0.38, offset: 2 });
    return canvas;
  }

  function drawWall(materials, palette) {
    const { canvas, context } = createCanvas(64, 64, 2);
    const outer = roundedRectPath(1, 1, 62, 62, 6);
    const inner = roundedRectPath(7, 7, 50, 50, 4);
    fillTexture(context, outer, materials.wall, { shadow: { blur: 5, offsetY: 2 } });
    fillTexture(context, inner, materials.dark);
    stitch(context, roundedRectPath(4, 4, 56, 56, 5), palette.light, { width: 1, dash: [3, 3], alpha: 0.72 });
    return canvas;
  }

  function drawRugPattern(context, x, y, width, height, palette) {
    const rows = 3;
    for (let row = 0; row < rows; row++) {
      const yy = y + ((row + 1) * height) / (rows + 1);
      const points = [];
      for (let px = x; px <= x + width; px += 8) {
        const pointIndex = Math.round((px - x) / 8);
        points.push([px, yy + (pointIndex % 2 === 0 ? -2 : 2)]);
      }
      stitch(context, linePath(points), palette.light, { width: 1, dash: [2, 2], alpha: 0.68 });
    }
  }

  function drawFurniture(context, definition, width, height, materials, palette, interactiveOn = false) {
    const centerX = width / 2;
    const centerY = height / 2;
    const cream = palette.light;
    const ink = 'rgba(29, 24, 23, 0.72)';
    const subtleInk = 'rgba(29, 24, 23, 0.46)';
    const recipe = definition?.recipe || 'cabinet';
    const variant = definition?.variant || 0;

    switch (recipe) {
      case 'cabinet': {
        const outer = roundedRectPath(8, 8, width - 16, height - 16, 5);
        const inner = roundedRectPath(14, 14, width - 28, height - 28, 3);
        fillTexture(context, outer, materials.wood, { shadow: true });
        fillTexture(context, inner, materials.primary);
        stitch(context, inner, cream, { width: 1.2 });
        solidStroke(context, linePath([[14, 14], [22, 22], [width - 14, 14]]), subtleInk, 1);
        solidStroke(context, linePath([[14, height - 14], [22, height - 22], [22, 22]]), subtleInk, 1);
        break;
      }
      case 'ottoman': {
        const outer = ellipsePath(centerX, centerY, width * 0.39, height * 0.39);
        const inner = ellipsePath(centerX, centerY, width * 0.31, height * 0.31);
        fillTexture(context, outer, materials.accent, { shadow: true });
        fillTexture(context, inner, materials.secondary);
        stitch(context, ellipsePath(centerX, centerY, width * 0.27, height * 0.12), palette.primary, { width: 1 });
        stitch(context, linePath([[centerX, centerY - height * 0.29], [centerX, centerY + height * 0.29]]), palette.primary, { width: 1 });
        break;
      }
      case 'stool': {
        const body = roundedRectPath(15, 12, width - 30, height - 24, 10);
        fillTexture(context, body, materials.dark, { shadow: true });
        fillTexture(context, ellipsePath(centerX, 17, width * 0.26, 8), materials.light);
        fillTexture(context, ellipsePath(centerX, height - 17, width * 0.26, 8), materials.secondary);
        stitch(context, ellipsePath(centerX, 17, width * 0.22, 5), palette.accent, { width: 1 });
        stitch(context, linePath([[18, 20], [18, height - 20], [width - 18, height - 20], [width - 18, 20]]), cream, { width: 1 });
        break;
      }
      case 'cushion': {
        const outer = polygonPath([[centerX, 5], [width - 5, centerY], [centerX, height - 5], [5, centerY]]);
        const inner = polygonPath([[centerX, 12], [width - 12, centerY], [centerX, height - 12], [12, centerY]]);
        fillTexture(context, outer, materials.accent, { shadow: true });
        fillTexture(context, inner, materials.primary);
        stitch(context, inner, cream, { width: 1.1 });
        for (const point of [[centerX, 12], [width - 12, centerY], [centerX, height - 12], [12, centerY]]) {
          solidStroke(context, linePath([[centerX, centerY], point]), subtleInk, 1);
        }
        break;
      }
      case 'chair': {
        const back = roundedRectPath(11, 7, width - 22, 17, 5);
        const seatOuter = roundedRectPath(13, 20, width - 26, height - 31, 6);
        const seatInner = roundedRectPath(18, 25, width - 36, height - 41, 4);
        fillTexture(context, back, materials.wood, { shadow: true });
        fillTexture(context, seatOuter, materials.dark, { shadow: true });
        fillTexture(context, seatInner, materials.primary);
        fillTexture(context, roundedRectPath(7, 20, 8, height - 28, 4), materials.wood);
        fillTexture(context, roundedRectPath(width - 15, 20, 8, height - 28, 4), materials.wood);
        stitch(context, seatInner, cream, { width: 1 });
        break;
      }
      case 'plant': {
        const pot = ellipsePath(centerX, centerY + 9, 18, 15);
        fillTexture(context, pot, materials.accent, { shadow: true });
        const leaves = [
          [[centerX, centerY + 4], [centerX - 8, 5], [centerX + 1, 20]],
          [[centerX, centerY + 4], [centerX + 7, 4], [centerX + 4, 20]],
          [[centerX, centerY + 4], [width - 5, 14], [centerX + 9, 25]],
          [[centerX, centerY + 4], [width - 7, 37], [centerX + 8, 34]],
          [[centerX, centerY + 4], [centerX - 5, height - 4], [centerX - 2, 36]],
          [[centerX, centerY + 4], [5, 37], [centerX - 9, 33]],
          [[centerX, centerY + 4], [6, 15], [centerX - 9, 25]],
        ];
        leaves.forEach((points, index) => {
          const leaf = polygonPath(points);
          fillTexture(context, leaf, index % 2 ? materials.leaf : materials.primary);
          solidStroke(context, leaf, 'rgba(30, 45, 27, 0.66)', 0.8);
        });
        fillTexture(context, ellipsePath(centerX, centerY + 3, 5, 5), materials.light);
        break;
      }
      case 'table-lamp': {
        const shade = ellipsePath(centerX, centerY, 23, 23);
        const inner = ellipsePath(centerX, centerY, 16, 16);
        fillTexture(context, shade, interactiveOn ? materials.light : materials.secondary, { shadow: true });
        fillTexture(context, inner, interactiveOn ? materials.accent : materials.dark);
        stitch(context, ellipsePath(centerX, centerY, 19, 19), interactiveOn ? '#fff2b6' : palette.accent, { width: 1.3, dash: [2, 2] });
        for (let index = 0; index < 8; index++) {
          const angle = (index / 8) * Math.PI * 2;
          solidStroke(context, linePath([
            [centerX + Math.cos(angle) * 7, centerY + Math.sin(angle) * 7],
            [centerX + Math.cos(angle) * 15, centerY + Math.sin(angle) * 15],
          ]), interactiveOn ? '#fff2b6' : subtleInk, 1);
        }
        fillTexture(context, ellipsePath(centerX, centerY, 5, 5), materials.wood);
        break;
      }
      case 'rug': {
        const outer = roundedRectPath(3, 5, width - 6, height - 10, 8);
        const inner = roundedRectPath(9, 11, width - 18, height - 22, 5);
        fillTexture(context, outer, materials.accent, { shadow: { blur: 3, offsetY: 1 } });
        fillTexture(context, inner, materials.primary);
        stitch(context, roundedRectPath(6, 8, width - 12, height - 16, 6), cream, { width: 1.3 });
        drawRugPattern(context, 17, 21, width - 34, height - 42, palette);
        for (let x = 10; x < width - 5; x += 8) {
          solidStroke(context, linePath([[x, 2], [x, 7]]), palette.secondary, 1);
          solidStroke(context, linePath([[x, height - 7], [x, height - 2]]), palette.secondary, 1);
        }
        break;
      }
      case 'bed': {
        const frame = roundedRectPath(5, 4, width - 10, height - 8, 8);
        const mattress = roundedRectPath(10, 9, width - 20, height - 18, 6);
        fillTexture(context, frame, materials.wood, { shadow: true });
        fillTexture(context, mattress, materials.light);
        fillTexture(context, roundedRectPath(14, 13, width - 28, 27, 5), materials.secondary);
        fillTexture(context, roundedRectPath(14, 44, width - 28, height - 59, 4), materials.primary);
        fillTexture(context, roundedRectPath(18, 17, 40, 17, 6), materials.cotton || materials.light);
        fillTexture(context, roundedRectPath(width - 58, 17, 40, 17, 6), materials.cotton || materials.light);
        stitch(context, roundedRectPath(13, 12, width - 26, height - 24, 5), palette.accent, { width: 1.1 });
        stitch(context, linePath([[15, 45], [width - 15, 45]]), cream, { width: 1 });
        break;
      }
      case 'bathtub': {
        const shell = roundedRectPath(4, 8, width - 8, height - 16, 15);
        const basin = roundedRectPath(12, 15, width - 24, height - 30, 11);
        fillTexture(context, shell, materials.light, { shadow: true });
        fillTexture(context, basin, materials.water);
        stitch(context, roundedRectPath(8, 12, width - 16, height - 24, 13), palette.secondary, { width: 1.2 });
        fillTexture(context, ellipsePath(width - 19, centerY, 4, 4), materials.accent);
        solidStroke(context, linePath([[width - 19, centerY - 4], [width - 19, 10]]), ink, 1.2);
        break;
      }
      case 'sofa': {
        const body = roundedRectPath(3, 8, width - 6, height - 15, 9);
        const back = roundedRectPath(8, 8, width - 16, 16, 6);
        fillTexture(context, body, materials.dark, { shadow: true });
        fillTexture(context, back, materials.wood);
        fillTexture(context, roundedRectPath(13, 20, 31, height - 31, 5), materials.primary);
        fillTexture(context, roundedRectPath(48, 20, 31, height - 31, 5), materials.secondary);
        fillTexture(context, roundedRectPath(83, 20, width - 96, height - 31, 5), materials.primary);
        fillTexture(context, roundedRectPath(3, 16, 10, height - 24, 4), materials.accent);
        fillTexture(context, roundedRectPath(width - 13, 16, 10, height - 24, 4), materials.accent);
        stitch(context, linePath([[46, 23], [46, height - 12], [81, height - 12], [81, 23]]), cream, { width: 1 });
        break;
      }
      case 'game-console': {
        const shell = roundedRectPath(7, 13, width - 14, height - 26, 9);
        fillTexture(context, shell, materials.dark, { shadow: true });
        fillTexture(context, roundedRectPath(13, 19, width - 26, height - 38, 6), materials.primary);
        solidStroke(context, linePath([[20, centerY], [30, centerY], [25, centerY - 5], [25, centerY + 5]]), cream, 2);
        fillTexture(context, ellipsePath(width - 24, centerY - 4, 3.5, 3.5), materials.accent);
        fillTexture(context, ellipsePath(width - 17, centerY + 4, 3.5, 3.5), materials.light);
        stitch(context, shell, palette.secondary, { width: 1 });
        break;
      }
      case 'computer': {
        const monitor = roundedRectPath(8, 5, width - 16, 34, 5);
        fillTexture(context, monitor, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(13, 10, width - 26, 23, 3), materials.dark);
        fillTexture(context, roundedRectPath(17, 13, width - 34, 17, 2), materials.water);
        fillTexture(context, roundedRectPath(26, 39, 12, 7, 2), materials.wood);
        fillTexture(context, roundedRectPath(12, 47, width - 24, 10, 3), materials.secondary);
        for (let x = 17; x < width - 15; x += 7) {
          solidStroke(context, linePath([[x, 50], [x + 3, 50]]), subtleInk, 1);
        }
        break;
      }
      case 'television': {
        const casePath = roundedRectPath(4, 7, width - 8, height - 14, 7);
        const screen = roundedRectPath(10, 13, width - 32, height - 26, 4);
        fillTexture(context, casePath, materials.wood, { shadow: true });
        fillTexture(context, screen, interactiveOn ? materials.water : materials.dark);
        stitch(context, screen, interactiveOn ? '#d7f5ef' : palette.secondary, { width: 1.1, dash: [3, 2] });
        fillTexture(context, ellipsePath(width - 14, centerY - 6, 3, 3), interactiveOn ? materials.light : materials.accent);
        fillTexture(context, ellipsePath(width - 14, centerY + 5, 3, 3), materials.secondary);
        if (interactiveOn) {
          stitch(context, linePath([[17, centerY + 3], [31, centerY - 5], [45, centerY + 2], [61, centerY - 4], [78, centerY + 4]]), '#e8fff8', { width: 1.2, dash: [2, 2] });
        }
        break;
      }
      case 'toilet': {
        const tank = roundedRectPath(14, 6, width - 28, 18, 5);
        const seat = ellipsePath(centerX, 38, 19, 21);
        const bowl = ellipsePath(centerX, 39, 12, 14);
        fillTexture(context, tank, materials.light, { shadow: true });
        fillTexture(context, seat, materials.secondary, { shadow: true });
        fillTexture(context, bowl, materials.water);
        stitch(context, seat, palette.accent, { width: 1 });
        fillTexture(context, ellipsePath(centerX + 10, 13, 2.5, 2.5), materials.accent);
        break;
      }
      case 'pet': {
        if (variant === 'dog') {
          const body = roundedRectPath(18, 23, 30, 29, 12);
          const head = ellipsePath(32, 20, 14, 13);
          fillTexture(context, body, materials.accent, { shadow: true });
          fillTexture(context, head, materials.secondary);
          fillTexture(context, ellipsePath(17, 21, 8, 13), materials.dark);
          fillTexture(context, ellipsePath(47, 21, 8, 13), materials.dark);
          fillTexture(context, ellipsePath(32, 24, 4, 3), materials.dark);
          strokeTexture(context, linePath([[45, 42], [55, 36], [57, 43]]), materials.primary, 4);
          stitch(context, body, cream, { width: 0.9, dash: [2, 3] });
          break;
        }
        if (variant === 'rabbit') {
          const body = ellipsePath(32, 39, 18, 14);
          const head = ellipsePath(31, 25, 12, 11);
          fillTexture(context, body, materials.secondary, { shadow: true });
          fillTexture(context, head, materials.light);
          fillTexture(context, ellipsePath(24, 9, 5, 14), materials.secondary);
          fillTexture(context, ellipsePath(37, 9, 5, 14), materials.secondary);
          stitch(context, ellipsePath(24, 9, 2, 10), palette.accent, { width: 1, dash: [2, 2] });
          stitch(context, ellipsePath(37, 9, 2, 10), palette.accent, { width: 1, dash: [2, 2] });
          fillTexture(context, ellipsePath(28, 24, 1.5, 1.5), materials.dark);
          fillTexture(context, ellipsePath(35, 24, 1.5, 1.5), materials.dark);
          fillTexture(context, ellipsePath(50, 39, 6, 6), materials.light);
          break;
        }
        if (variant === 'bird') {
          const body = ellipsePath(centerX, 34, 16, 19);
          const wing = ellipsePath(centerX - 5, 36, 8, 12);
          fillTexture(context, body, materials.primary, { shadow: true });
          fillTexture(context, wing, materials.secondary);
          fillTexture(context, ellipsePath(centerX + 4, 19, 10, 9), materials.accent);
          fillTexture(context, polygonPath([[centerX + 13, 20], [width - 4, 24], [centerX + 13, 27]]), materials.light);
          fillTexture(context, ellipsePath(centerX + 6, 18, 1.4, 1.4), materials.dark);
          strokeTexture(context, linePath([[centerX - 5, 50], [centerX - 9, 57]]), materials.wood, 2);
          strokeTexture(context, linePath([[centerX + 3, 50], [centerX + 7, 57]]), materials.wood, 2);
          stitch(context, wing, cream, { width: 0.9, dash: [2, 2] });
          break;
        }
        if (variant === 'turtle') {
          const shell = ellipsePath(centerX, centerY + 2, 22, 17);
          fillTexture(context, shell, materials.leaf, { shadow: true });
          fillTexture(context, ellipsePath(centerX, centerY + 2, 15, 11), materials.primary);
          stitch(context, linePath([
            [centerX - 14, centerY + 2],
            [centerX, centerY - 9],
            [centerX + 14, centerY + 2],
            [centerX, centerY + 12],
            [centerX - 14, centerY + 2],
          ]), cream, { width: 1, dash: [2, 2] });
          fillTexture(context, ellipsePath(width - 9, centerY + 2, 8, 7), materials.leaf);
          fillTexture(context, ellipsePath(width - 7, centerY, 1.2, 1.2), materials.dark);
          for (const [x, y] of [[15, 16], [15, 48], [44, 16], [44, 48]]) {
            fillTexture(context, ellipsePath(x, y, 5, 4), materials.leaf);
          }
          break;
        }
        const body = ellipsePath(34, 37, 19, 15);
        const head = ellipsePath(23, 22, 12, 11);
        fillTexture(context, body, materials.primary, { shadow: true });
        fillTexture(context, head, materials.primary);
        fillTexture(context, polygonPath([[14, 17], [14, 6], [22, 14]]), materials.accent);
        fillTexture(context, polygonPath([[26, 13], [34, 7], [33, 19]]), materials.accent);
        strokeTexture(context, linePath([[44, 39], [54, 34], [56, 43], [49, 49]]), materials.accent, 5);
        solidStroke(context, linePath([[19, 23], [20, 23], [27, 23], [28, 23]]), ink, 1.5);
        stitch(context, body, cream, { width: 0.9, dash: [2, 3] });
        break;
      }
      case 'armchair': {
        const wings = variant === 1 ? 12 : 7;
        const back = roundedRectPath(10, 5, width - 20, 24 + (variant === 1 ? 8 : 0), 8);
        const seat = roundedRectPath(13, 22, width - 26, height - 31, 8);
        fillTexture(context, back, variant === 2 ? materials.secondary : materials.dark, { shadow: true });
        fillTexture(context, seat, materials.primary, { shadow: true });
        fillTexture(context, roundedRectPath(6, 18, wings, height - 25, 5), materials.wood);
        fillTexture(context, roundedRectPath(width - 6 - wings, 18, wings, height - 25, 5), materials.wood);
        stitch(context, roundedRectPath(16, 25, width - 32, height - 38, 5), cream, { width: 1 });
        if (variant === 1) {
          fillTexture(context, polygonPath([[10, 8], [3, 15], [10, 29]]), materials.accent);
          fillTexture(context, polygonPath([[width - 10, 8], [width - 3, 15], [width - 10, 29]]), materials.accent);
        }
        break;
      }
      case 'cane-chair': {
        const frame = roundedRectPath(8, 7, width - 16, height - 14, 9);
        const seat = roundedRectPath(14, 22, width - 28, height - 32, 6);
        fillTexture(context, frame, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(14, 10, width - 28, 18, 6), materials.secondary);
        fillTexture(context, seat, materials.light);
        for (let x = 17; x < width - 16; x += 6) {
          solidStroke(context, linePath([[x, 12], [x + 8, 26]]), palette.wood, 0.8);
          solidStroke(context, linePath([[x + 8, 12], [x, 26]]), palette.wood, 0.8);
        }
        stitch(context, seat, palette.accent, { width: 1 });
        break;
      }
      case 'desk-chair': {
        fillTexture(context, roundedRectPath(16, 6, width - 32, 21, 7), materials.dark, { shadow: true });
        fillTexture(context, ellipsePath(centerX, centerY + 6, 18, 16), materials.primary, { shadow: true });
        solidStroke(context, linePath([[centerX, centerY + 20], [centerX, height - 7]]), palette.wood, 3);
        for (let index = 0; index < 5; index++) {
          const angle = (index / 5) * Math.PI * 2;
          solidStroke(context, linePath([
            [centerX, height - 9],
            [centerX + Math.cos(angle) * 19, height - 9 + Math.sin(angle) * 8],
          ]), palette.wood, 2);
        }
        stitch(context, ellipsePath(centerX, centerY + 6, 14, 12), cream, { width: 1 });
        break;
      }
      case 'bench': {
        const frame = roundedRectPath(5, 11, width - 10, height - 19, 7);
        fillTexture(context, frame, materials.wood, { shadow: true });
        const cushion = roundedRectPath(10, variant === 1 ? 8 : 16, width - 20, height - 31, 7);
        fillTexture(context, cushion, variant === 1 ? materials.secondary : materials.primary);
        stitch(context, cushion, cream, { width: 1.1 });
        if (variant === 1) {
          fillTexture(context, roundedRectPath(10, height - 19, width - 20, 8, 3), materials.accent);
          for (let x = 22; x < width - 15; x += 22) crossStitch(context, x, centerY, palette.accent, 1.5);
        } else {
          for (let x = 18; x < width - 14; x += 22) {
            solidStroke(context, linePath([[x, 17], [x, height - 17]]), subtleInk, 1);
          }
        }
        break;
      }
      case 'sectional': {
        const horizontal = roundedRectPath(4, 8, width - 8, Math.min(58, height * 0.48), 10);
        const vertical = roundedRectPath(4, 8, Math.min(62, width * 0.35), height - 16, 10);
        fillTexture(context, horizontal, materials.dark, { shadow: true });
        fillTexture(context, vertical, materials.dark, { shadow: true });
        fillTexture(context, roundedRectPath(12, 19, width - 24, 30, 6), materials.primary);
        fillTexture(context, roundedRectPath(12, 51, 38, height - 63, 6), materials.secondary);
        stitch(context, roundedRectPath(15, 22, width - 30, 24, 5), cream, { width: 1 });
        stitch(context, roundedRectPath(15, 54, 32, height - 69, 5), cream, { width: 1 });
        for (let x = 54; x < width - 10; x += 38) {
          solidStroke(context, linePath([[x, 20], [x, 48]]), subtleInk, 1);
        }
        break;
      }
      case 'chaise': {
        const body = roundedRectPath(5, 10, width - 10, height - 20, 12);
        fillTexture(context, body, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 14, width - 24, height - 28, 9), materials.primary);
        fillTexture(context, roundedRectPath(12, 13, 35, height - 26, 9), materials.secondary);
        fillTexture(context, ellipsePath(30, centerY, 12, Math.max(8, height * 0.23)), materials.accent);
        stitch(context, roundedRectPath(51, 18, width - 66, height - 36, 6), cream, { width: 1 });
        break;
      }
      case 'table': {
        const inset = variant === 3 ? 8 : 6;
        const top = roundedRectPath(inset, inset, width - inset * 2, height - inset * 2, variant === 1 ? 10 : 5);
        fillTexture(context, top, variant === 1 ? materials.secondary : materials.wood, { shadow: true });
        stitch(context, roundedRectPath(inset + 4, inset + 4, width - (inset + 4) * 2, height - (inset + 4) * 2, 4), palette.light, { width: 1, alpha: 0.65 });
        if (variant === 0) {
          fillTexture(context, roundedRectPath(width * 0.35, height * 0.28, width * 0.3, height * 0.44, 5), materials.dark);
        } else if (variant === 1) {
          fillTexture(context, ellipsePath(centerX, centerY, Math.max(5, width * 0.12), Math.max(5, height * 0.18)), materials.accent);
        } else if (variant === 2) {
          solidStroke(context, linePath([[15, centerY], [width - 15, centerY]]), subtleInk, 1.3);
        } else {
          for (let x = 24; x < width - 15; x += 28) crossStitch(context, x, centerY, palette.accent, 1.6);
        }
        break;
      }
      case 'round-table': {
        const radiusX = width * 0.42;
        const radiusY = height * 0.42;
        const top = ellipsePath(centerX, centerY, radiusX, radiusY);
        fillTexture(context, top, materials.wood, { shadow: true });
        fillTexture(context, ellipsePath(centerX, centerY, radiusX * 0.78, radiusY * 0.78), variant === 2 ? materials.secondary : materials.primary);
        stitch(context, ellipsePath(centerX, centerY, radiusX * 0.7, radiusY * 0.7), cream, { width: 1.1 });
        fillTexture(context, ellipsePath(centerX, centerY, Math.max(4, radiusX * 0.12), Math.max(4, radiusY * 0.12)), materials.accent);
        break;
      }
      case 'nesting-tables': {
        const large = roundedRectPath(6, 6, width - 23, height - 23, 6);
        const small = roundedRectPath(23, 23, width - 29, height - 29, 6);
        fillTexture(context, large, materials.wood, { shadow: true });
        fillTexture(context, small, materials.secondary, { shadow: true });
        stitch(context, large, cream, { width: 1 });
        stitch(context, small, palette.accent, { width: 1 });
        break;
      }
      case 'desk': {
        const top = roundedRectPath(5, 9, width - 10, height - 18, 6);
        fillTexture(context, top, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 15, width - 24, height - 30, 4), materials.secondary);
        const drawerWidth = Math.min(42, width * 0.3);
        fillTexture(context, roundedRectPath(16, centerY - 8, drawerWidth, 16, 3), materials.dark);
        fillTexture(context, ellipsePath(16 + drawerWidth / 2, centerY, 2, 2), materials.accent);
        if (variant === 1) {
          fillTexture(context, ellipsePath(width - 34, centerY, 22, Math.max(12, height * 0.3)), materials.light);
          stitch(context, ellipsePath(width - 34, centerY, 17, Math.max(9, height * 0.22)), palette.accent, { width: 1 });
        } else {
          solidStroke(context, linePath([[width - 55, centerY - 8], [width - 18, centerY - 8]]), subtleInk, 1);
          solidStroke(context, linePath([[width - 55, centerY], [width - 24, centerY]]), subtleInk, 1);
          solidStroke(context, linePath([[width - 55, centerY + 8], [width - 30, centerY + 8]]), subtleInk, 1);
        }
        break;
      }
      case 'canopy-bed': {
        const frame = roundedRectPath(6, 6, width - 12, height - 12, 8);
        fillTexture(context, frame, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(13, 13, width - 26, height - 26, 6), materials.light);
        fillTexture(context, roundedRectPath(17, 18, width - 34, 31, 5), materials.secondary);
        fillTexture(context, roundedRectPath(17, 52, width - 34, height - 70, 5), materials.primary);
        for (const [x, y] of [[8, 8], [width - 8, 8], [8, height - 8], [width - 8, height - 8]]) {
          fillTexture(context, ellipsePath(x, y, 5, 5), materials.accent);
        }
        solidStroke(context, linePath([[8, 8], [width - 8, 8], [width - 8, height - 8], [8, height - 8], [8, 8]]), palette.wood, 2);
        stitch(context, roundedRectPath(16, 16, width - 32, height - 32, 5), palette.accent, { width: 1 });
        break;
      }
      case 'daybed': {
        const frame = roundedRectPath(5, 7, width - 10, height - 14, 9);
        fillTexture(context, frame, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 13, width - 24, height - 26, 7), materials.primary);
        fillTexture(context, roundedRectPath(12, 11, 26, height - 22, 7), materials.secondary);
        fillTexture(context, roundedRectPath(width - 38, 11, 26, height - 22, 7), materials.secondary);
        stitch(context, linePath([[42, 17], [width - 42, 17], [width - 42, height - 17], [42, height - 17]]), cream, { width: 1 });
        break;
      }
      case 'bunk-bed': {
        const frame = roundedRectPath(5, 6, width - 10, height - 12, 5);
        fillTexture(context, frame, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 11, width - 24, 18, 4), materials.light);
        fillTexture(context, roundedRectPath(12, height - 29, width - 24, 18, 4), materials.primary);
        for (let x = 16; x < width - 12; x += 14) {
          solidStroke(context, linePath([[x, 13], [x, 27]]), palette.accent, 1);
          solidStroke(context, linePath([[x, height - 27], [x, height - 13]]), cream, 1);
        }
        solidStroke(context, linePath([[width - 18, 8], [width - 18, height - 8]]), palette.light, 2);
        for (let y = 17; y < height - 10; y += 10) solidStroke(context, linePath([[width - 25, y], [width - 11, y]]), palette.light, 1.5);
        break;
      }
      case 'rollaway-bed': {
        fillTexture(context, roundedRectPath(8, 5, width - 16, height - 15, 7), materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(13, 10, width - 26, height - 25, 6), materials.light);
        fillTexture(context, roundedRectPath(16, 14, width - 32, 27, 5), materials.secondary);
        fillTexture(context, roundedRectPath(16, 44, width - 32, height - 62, 5), materials.primary);
        for (const x of [15, width - 15]) fillTexture(context, ellipsePath(x, height - 7, 5, 5), materials.dark);
        solidStroke(context, linePath([[11, centerY], [width - 11, centerY]]), palette.accent, 1.5);
        break;
      }
      case 'wardrobe': {
        const shell = roundedRectPath(5, 5, width - 10, height - 10, 7);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 12, width - 24, height - 24, 4), materials.dark);
        solidStroke(context, linePath([[centerX, 13], [centerX, height - 13]]), palette.light, 1.2);
        fillTexture(context, ellipsePath(centerX - 7, centerY, 2.5, 2.5), materials.accent);
        fillTexture(context, ellipsePath(centerX + 7, centerY, 2.5, 2.5), materials.accent);
        stitch(context, roundedRectPath(9, 9, width - 18, height - 18, 5), cream, { width: 1 });
        break;
      }
      case 'dresser': {
        const shell = roundedRectPath(5, 8, width - 10, height - 16, 6);
        fillTexture(context, shell, materials.wood, { shadow: true });
        const columns = width > 96 ? 3 : 2;
        const rows = 2;
        const gap = 5;
        const drawerWidth = (width - 20 - gap * (columns - 1)) / columns;
        const drawerHeight = (height - 26 - gap) / rows;
        for (let row = 0; row < rows; row++) {
          for (let column = 0; column < columns; column++) {
            const x = 10 + column * (drawerWidth + gap);
            const y = 13 + row * (drawerHeight + gap);
            const drawer = roundedRectPath(x, y, drawerWidth, drawerHeight, 3);
            fillTexture(context, drawer, variant ? materials.secondary : materials.dark);
            fillTexture(context, ellipsePath(x + drawerWidth / 2, y + drawerHeight / 2, 2, 2), materials.accent);
          }
        }
        break;
      }
      case 'bookcase': {
        const shell = roundedRectPath(5, 5, width - 10, height - 10, 5);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(10, 10, width - 20, height - 20, 3), materials.dark);
        const shelves = height > width ? 5 : 3;
        for (let shelf = 1; shelf <= shelves; shelf++) {
          const y = 10 + (shelf * (height - 20)) / (shelves + 1);
          solidStroke(context, linePath([[10, y], [width - 10, y]]), palette.wood, 3);
          for (let x = 14; x < width - 12; x += 9) {
            const bookHeight = 7 + ((x + shelf * 3) % 8);
            fillTexture(context, roundedRectPath(x, y - bookHeight, 6, bookHeight - 1, 1), (x + shelf) % 3 === 0 ? materials.accent : ((x + shelf) % 2 ? materials.primary : materials.secondary));
          }
        }
        break;
      }
      case 'trunk': {
        const shell = roundedRectPath(5, 8, width - 10, height - 16, 7);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(10, 13, width - 20, height - 26, 5), materials.dark);
        solidStroke(context, linePath([[centerX, 13], [centerX, height - 13]]), palette.accent, 3);
        for (const x of [17, width - 17]) solidStroke(context, linePath([[x, 11], [x, height - 11]]), palette.light, 2);
        fillTexture(context, roundedRectPath(centerX - 7, centerY - 5, 14, 10, 2), materials.accent);
        break;
      }
      case 'safe': {
        const shell = roundedRectPath(6, 6, width - 12, height - 12, 7);
        fillTexture(context, shell, materials.dark, { shadow: true });
        fillTexture(context, roundedRectPath(12, 12, width - 24, height - 24, 4), materials.secondary);
        fillTexture(context, ellipsePath(centerX, centerY, 13, 13), interactiveOn ? materials.accent : materials.wood);
        for (let index = 0; index < 6; index++) {
          const angle = (index / 6) * Math.PI * 2;
          solidStroke(context, linePath([[centerX, centerY], [centerX + Math.cos(angle) * 10, centerY + Math.sin(angle) * 10]]), cream, 1);
        }
        fillTexture(context, ellipsePath(centerX, centerY, 3, 3), materials.dark);
        break;
      }
      case 'luggage-rack': {
        solidStroke(context, linePath([[9, 10], [width - 9, height - 10]]), palette.wood, 5);
        solidStroke(context, linePath([[width - 9, 10], [9, height - 10]]), palette.wood, 5);
        for (let y = 17; y < height - 10; y += 9) {
          solidStroke(context, linePath([[12, y], [width - 12, y]]), palette.secondary, 3);
        }
        stitch(context, roundedRectPath(9, 8, width - 18, height - 16, 4), palette.accent, { width: 1 });
        break;
      }
      case 'floor-lamp': {
        const baseY = height - 12;
        fillTexture(context, ellipsePath(centerX, baseY, 17, 8), materials.wood, { shadow: true });
        solidStroke(context, linePath([[centerX, baseY - 3], [centerX + (variant ? 9 : 0), 23]]), palette.wood, 4);
        const shadeX = centerX + (variant ? 13 : 0);
        const shade = polygonPath([[shadeX - 20, 9], [shadeX + 20, 9], [shadeX + 14, 28], [shadeX - 14, 28]]);
        fillTexture(context, shade, interactiveOn ? materials.light : materials.secondary, { shadow: true });
        stitch(context, shade, interactiveOn ? '#fff3b8' : palette.accent, { width: 1 });
        break;
      }
      case 'sconce': {
        fillTexture(context, roundedRectPath(centerX - 7, 11, 14, height - 22, 5), materials.wood, { shadow: true });
        const shade = polygonPath([[centerX - 20, 13], [centerX + 20, 13], [centerX + 14, centerY + 10], [centerX - 14, centerY + 10]]);
        fillTexture(context, shade, interactiveOn ? materials.light : materials.secondary);
        stitch(context, shade, palette.accent, { width: 1 });
        fillTexture(context, ellipsePath(centerX, height - 15, 7, 7), materials.accent);
        break;
      }
      case 'pendant': {
        const radius = Math.min(width, height) * (variant === 1 ? 0.38 : 0.3);
        solidStroke(context, linePath([[centerX, 3], [centerX, centerY - radius]]), palette.wood, 2);
        fillTexture(context, ellipsePath(centerX, centerY, radius, radius), interactiveOn ? materials.light : materials.secondary, { shadow: true });
        stitch(context, ellipsePath(centerX, centerY, radius * 0.76, radius * 0.76), interactiveOn ? '#fff3b8' : palette.accent, { width: 1.2 });
        const arms = variant === 1 ? 8 : 4;
        for (let index = 0; index < arms; index++) {
          const angle = (index / arms) * Math.PI * 2;
          solidStroke(context, linePath([
            [centerX, centerY],
            [centerX + Math.cos(angle) * radius * 0.72, centerY + Math.sin(angle) * radius * 0.72],
          ]), palette.wood, 1.2);
        }
        break;
      }
      case 'lantern': {
        const shell = roundedRectPath(13, 7, width - 26, height - 14, 12);
        fillTexture(context, shell, interactiveOn ? materials.light : materials.secondary, { shadow: true });
        solidStroke(context, linePath([[20, 8], [20, height - 8], [width - 20, height - 8], [width - 20, 8]]), palette.wood, 3);
        stitch(context, roundedRectPath(18, 12, width - 36, height - 24, 8), palette.accent, { width: 1 });
        fillTexture(context, ellipsePath(centerX, centerY, 7, 12), interactiveOn ? materials.accent : materials.dark);
        break;
      }
      case 'desk-lamp': {
        fillTexture(context, ellipsePath(18, height - 13, 14, 8), materials.wood, { shadow: true });
        solidStroke(context, linePath([[18, height - 17], [30, centerY], [41, 19]]), palette.wood, 4);
        const shade = polygonPath([[32, 12], [53, 12], [48, 30], [37, 30]]);
        fillTexture(context, shade, interactiveOn ? materials.light : materials.secondary);
        stitch(context, shade, palette.accent, { width: 1 });
        break;
      }
      case 'candles': {
        const candles = [
          [centerX - 14, centerY + 5, 10, 24],
          [centerX, centerY - 2, 11, 34],
          [centerX + 15, centerY + 8, 9, 20],
        ];
        candles.forEach(([x, y, candleWidth, candleHeight], index) => {
          fillTexture(context, roundedRectPath(x - candleWidth / 2, y - candleHeight / 2, candleWidth, candleHeight, 3), index % 2 ? materials.light : materials.secondary, { shadow: true });
          const flame = polygonPath([[x, y - candleHeight / 2 - 9], [x + 4, y - candleHeight / 2 - 2], [x, y - candleHeight / 2 + 2], [x - 4, y - candleHeight / 2 - 2]]);
          fillTexture(context, flame, interactiveOn ? materials.accent : materials.dark);
        });
        fillTexture(context, ellipsePath(centerX, height - 9, 26, 7), materials.wood);
        break;
      }
      case 'mirror': {
        const frame = roundedRectPath(6, 5, width - 12, height - 10, width * 0.32);
        fillTexture(context, frame, materials.wood, { shadow: true });
        const glass = roundedRectPath(12, 11, width - 24, height - 22, width * 0.25);
        fillTexture(context, glass, materials.water);
        stitch(context, glass, palette.light, { width: 1.2 });
        solidStroke(context, linePath([[18, height * 0.66], [width - 18, height * 0.28]]), 'rgba(255,255,255,0.55)', 2);
        break;
      }
      case 'art': {
        const frame = roundedRectPath(5, 7, width - 10, height - 14, 5);
        fillTexture(context, frame, materials.wood, { shadow: true });
        const art = roundedRectPath(12, 14, width - 24, height - 28, 3);
        fillTexture(context, art, variant === 1 ? materials.primary : materials.secondary);
        if (variant === 1) {
          for (let x = 18; x < width - 15; x += 12) {
            stitch(context, linePath([[x, 18], [x + 7, centerY], [x, height - 18]]), x % 3 ? palette.accent : palette.light, { width: 1, dash: [2, 2] });
          }
        } else {
          fillTexture(context, ellipsePath(width * 0.73, height * 0.32, 9, 9), materials.accent);
          fillTexture(context, polygonPath([[14, height - 16], [width * 0.38, centerY], [width * 0.55, height - 16]]), materials.leaf);
          fillTexture(context, polygonPath([[width * 0.38, height - 16], [width * 0.68, centerY - 3], [width - 14, height - 16]]), materials.dark);
        }
        break;
      }
      case 'clock': {
        const outer = ellipsePath(centerX, centerY, width * 0.42, height * 0.42);
        fillTexture(context, outer, materials.wood, { shadow: true });
        fillTexture(context, ellipsePath(centerX, centerY, width * 0.34, height * 0.34), materials.light);
        for (let index = 0; index < 12; index++) {
          const angle = (index / 12) * Math.PI * 2 - Math.PI / 2;
          fillTexture(context, ellipsePath(centerX + Math.cos(angle) * width * 0.27, centerY + Math.sin(angle) * height * 0.27, 1.2, 1.2), materials.dark);
        }
        solidStroke(context, linePath([[centerX, centerY], [centerX, centerY - height * 0.2]]), palette.dark, 2);
        solidStroke(context, linePath([[centerX, centerY], [centerX + width * 0.18, centerY + height * 0.08]]), palette.accent, 2);
        break;
      }
      case 'divider': {
        const panelWidth = (width - 18) / 3;
        for (let panel = 0; panel < 3; panel++) {
          const x = 5 + panel * (panelWidth + 4);
          const shell = roundedRectPath(x, 5, panelWidth, height - 10, 5);
          fillTexture(context, shell, materials.wood, { shadow: true });
          fillTexture(context, roundedRectPath(x + 5, 10, panelWidth - 10, height - 20, 3), panel % 2 ? materials.secondary : materials.primary);
          stitch(context, roundedRectPath(x + 7, 12, panelWidth - 14, height - 24, 2), cream, { width: 1 });
        }
        break;
      }
      case 'fireplace': {
        const mantle = roundedRectPath(4, 5, width - 8, height - 10, 6);
        fillTexture(context, mantle, materials.wood, { shadow: true });
        const hearth = roundedRectPath(14, 15, width - 28, height - 25, 8);
        fillTexture(context, hearth, materials.dark);
        const flame = polygonPath([
          [centerX, height - 15],
          [centerX - 18, height - 26],
          [centerX - 7, centerY],
          [centerX, centerY + 7],
          [centerX + 8, centerY - 3],
          [centerX + 18, height - 26],
        ]);
        fillTexture(context, flame, interactiveOn ? materials.accent : materials.secondary);
        stitch(context, hearth, palette.light, { width: 1 });
        solidStroke(context, linePath([[10, 13], [width - 10, 13]]), palette.light, 4);
        break;
      }
      case 'radio': {
        const shell = roundedRectPath(7, 12, width - 14, height - 24, 7);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(13, 18, width * 0.52, height - 36, 4), materials.secondary);
        for (let x = 17; x < width * 0.52; x += 5) {
          solidStroke(context, linePath([[x, 21], [x, height - 21]]), subtleInk, 0.8);
        }
        fillTexture(context, ellipsePath(width - 18, centerY - 7, 5, 5), interactiveOn ? materials.accent : materials.dark);
        fillTexture(context, ellipsePath(width - 18, centerY + 8, 4, 4), materials.primary);
        stitch(context, shell, cream, { width: 1 });
        break;
      }
      case 'record-player': {
        const shell = roundedRectPath(6, 7, width - 12, height - 14, 6);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, ellipsePath(centerX - 5, centerY, 19, 19), materials.dark);
        fillTexture(context, ellipsePath(centerX - 5, centerY, 5, 5), interactiveOn ? materials.accent : materials.secondary);
        solidStroke(context, linePath([[width - 17, 16], [width - 25, centerY + 7]]), palette.light, 2);
        fillTexture(context, ellipsePath(width - 25, centerY + 8, 3, 3), materials.accent);
        break;
      }
      case 'telephone': {
        const base = roundedRectPath(10, 20, width - 20, height - 31, 9);
        fillTexture(context, base, materials.dark, { shadow: true });
        fillTexture(context, ellipsePath(centerX, centerY + 6, 13, 13), materials.secondary);
        for (let index = 0; index < 8; index++) {
          const angle = (index / 8) * Math.PI * 2;
          fillTexture(context, ellipsePath(centerX + Math.cos(angle) * 9, centerY + 6 + Math.sin(angle) * 9, 1.3, 1.3), materials.dark);
        }
        const receiver = roundedRectPath(8, 7, width - 16, 16, 8);
        fillTexture(context, receiver, materials.primary, { shadow: true });
        stitch(context, receiver, cream, { width: 1 });
        break;
      }
      case 'tea-service': {
        fillTexture(context, ellipsePath(centerX, centerY, 27, 22), materials.wood, { shadow: true });
        fillTexture(context, ellipsePath(centerX - 5, centerY, 10, 12), materials.light);
        fillTexture(context, roundedRectPath(centerX - 12, centerY - 13, 14, 7, 3), materials.accent);
        solidStroke(context, linePath([[centerX + 4, centerY - 3], [centerX + 18, centerY - 8], [centerX + 21, centerY - 1]]), palette.accent, 2);
        for (const [x, y] of [[16, 19], [45, 43]]) {
          fillTexture(context, ellipsePath(x, y, 7, 7), materials.secondary);
          fillTexture(context, ellipsePath(x, y, 4, 4), materials.water);
        }
        break;
      }
      case 'round-rug': {
        const outer = ellipsePath(centerX, centerY, width * 0.47, height * 0.47);
        const inner = ellipsePath(centerX, centerY, width * 0.39, height * 0.39);
        fillTexture(context, outer, variant === 1 ? materials.leaf : materials.accent, { shadow: { blur: 3, offsetY: 1 } });
        fillTexture(context, inner, variant === 2 ? materials.secondary : materials.primary);
        stitch(context, ellipsePath(centerX, centerY, width * 0.33, height * 0.33), cream, { width: 1.2 });
        const spokes = variant === 1 ? 10 : 6;
        for (let index = 0; index < spokes; index++) {
          const angle = (index / spokes) * Math.PI * 2;
          stitch(context, linePath([
            [centerX, centerY],
            [centerX + Math.cos(angle) * width * 0.31, centerY + Math.sin(angle) * height * 0.31],
          ]), palette.accent, { width: 0.9, dash: [2, 2] });
        }
        break;
      }
      case 'cactus': {
        fillTexture(context, ellipsePath(centerX, height - 14, 18, 11), materials.accent, { shadow: true });
        fillTexture(context, roundedRectPath(centerX - 8, 8, 16, height - 27, 8), materials.leaf);
        fillTexture(context, roundedRectPath(centerX - 22, centerY - 7, 15, 25, 7), materials.leaf);
        fillTexture(context, roundedRectPath(centerX + 7, centerY - 15, 15, 25, 7), materials.leaf);
        for (let y = 16; y < height - 20; y += 9) {
          crossStitch(context, centerX, y, palette.light, 1);
        }
        break;
      }
      case 'flowers': {
        fillTexture(context, ellipsePath(centerX, height - 14, 14, 10), materials.water, { shadow: true });
        for (let index = 0; index < 7; index++) {
          const angle = (index / 7) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * 15;
          const y = centerY - 8 + Math.sin(angle) * 12;
          solidStroke(context, linePath([[centerX, height - 17], [x, y]]), palette.leaf, 2);
          fillTexture(context, ellipsePath(x, y, 6, 6), index % 2 ? materials.accent : materials.secondary);
          fillTexture(context, ellipsePath(x, y, 2, 2), materials.light);
        }
        break;
      }
      case 'bonsai': {
        fillTexture(context, roundedRectPath(centerX - 19, height - 17, 38, 12, 4), materials.accent, { shadow: true });
        strokeTexture(context, linePath([[centerX, height - 18], [centerX - 4, centerY], [centerX + 7, 19], [centerX + 4, 9]]), materials.wood, 6);
        for (const [x, y, rx, ry] of [[20, 24, 14, 9], [39, 19, 17, 10], [31, 10, 12, 8]]) {
          fillTexture(context, ellipsePath(x, y, rx, ry), materials.leaf, { shadow: true });
          stitch(context, ellipsePath(x, y, rx - 3, ry - 2), palette.light, { width: 0.7, dash: [2, 3] });
        }
        break;
      }
      case 'minibar': {
        const shell = roundedRectPath(5, 7, width - 10, height - 14, 6);
        fillTexture(context, shell, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(11, 13, width * 0.42, height - 26, 4), materials.dark);
        solidStroke(context, linePath([[width * 0.5, 12], [width * 0.5, height - 12]]), palette.light, 1.5);
        const bottleColors = [materials.leaf, materials.accent, materials.water, materials.secondary];
        bottleColors.forEach((material, index) => {
          const x = width * 0.58 + index * 11;
          fillTexture(context, roundedRectPath(x, centerY - 10, 7, 21, 2), material);
          fillTexture(context, roundedRectPath(x + 2, centerY - 15, 3, 6, 1), materials.light);
        });
        fillTexture(context, ellipsePath(width * 0.28, centerY, 3, 3), interactiveOn ? materials.accent : materials.secondary);
        break;
      }
      case 'reception': {
        const desk = roundedRectPath(5, 7, width - 10, height - 14, 10);
        fillTexture(context, desk, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 14, width - 24, height - 28, 7), materials.dark);
        fillTexture(context, roundedRectPath(16, 18, width - 32, height - 36, 5), materials.primary);
        solidStroke(context, linePath([[width * 0.66, 15], [width * 0.66, height - 15]]), palette.light, 1);
        fillTexture(context, ellipsePath(width * 0.77, centerY, 8, 8), materials.accent);
        stitch(context, roundedRectPath(9, 11, width - 18, height - 22, 8), cream, { width: 1.2 });
        break;
      }
      case 'luggage-cart': {
        fillTexture(context, roundedRectPath(9, height - 21, width - 18, 13, 5), materials.wood, { shadow: true });
        solidStroke(context, linePath([[17, height - 20], [17, 18], [centerX, 7], [width - 17, 18], [width - 17, height - 20]]), '#b98734', 4);
        fillTexture(context, roundedRectPath(27, centerY - 7, 33, 27, 5), materials.dark);
        fillTexture(context, roundedRectPath(64, centerY - 14, 38, 34, 5), materials.accent);
        stitch(context, roundedRectPath(30, centerY - 4, 27, 21, 3), cream, { width: 1 });
        for (const x of [20, width - 20]) fillTexture(context, ellipsePath(x, height - 7, 6, 6), materials.dark);
        break;
      }
      case 'bell-stand': {
        fillTexture(context, ellipsePath(centerX, height - 12, 22, 8), materials.wood, { shadow: true });
        solidStroke(context, linePath([[centerX, height - 15], [centerX, centerY + 4]]), palette.wood, 4);
        fillTexture(context, ellipsePath(centerX, centerY - 2, 19, 13), interactiveOn ? materials.accent : materials.secondary, { shadow: true });
        fillTexture(context, ellipsePath(centerX, centerY - 15, 4, 4), materials.dark);
        stitch(context, ellipsePath(centerX, centerY - 2, 15, 9), cream, { width: 1 });
        break;
      }
      case 'key-rack': {
        const board = roundedRectPath(5, 7, width - 10, height - 14, 6);
        fillTexture(context, board, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(11, 13, width - 22, height - 26, 4), materials.dark);
        const columns = 6;
        for (let index = 0; index < columns; index++) {
          const x = 20 + index * ((width - 40) / (columns - 1));
          fillTexture(context, ellipsePath(x, centerY - 8, 3, 3), materials.accent);
          solidStroke(context, linePath([[x, centerY - 5], [x, centerY + 10], [x + 5, centerY + 14]]), palette.light, 1.5);
        }
        stitch(context, board, cream, { width: 1 });
        break;
      }
      case 'service-cart': {
        const tray = roundedRectPath(6, 10, width - 12, height - 25, 8);
        fillTexture(context, tray, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 16, width - 24, height - 37, 6), materials.light);
        fillTexture(context, ellipsePath(centerX - 20, centerY, 16, 12), materials.secondary);
        fillTexture(context, ellipsePath(centerX - 20, centerY, 10, 7), materials.accent);
        for (const [x, y] of [[centerX + 9, centerY - 7], [centerX + 29, centerY + 7]]) {
          fillTexture(context, ellipsePath(x, y, 7, 7), materials.water);
          solidStroke(context, linePath([[x + 7, y], [x + 12, y + 3]]), palette.wood, 1.5);
        }
        for (const x of [17, width - 17]) fillTexture(context, ellipsePath(x, height - 7, 6, 6), materials.dark);
        break;
      }
      case 'coffee-station': {
        const counter = roundedRectPath(5, 8, width - 10, height - 16, 7);
        fillTexture(context, counter, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(13, 15, width * 0.42, height - 30, 5), materials.dark);
        fillTexture(context, roundedRectPath(19, 20, width * 0.29, 19, 4), interactiveOn ? materials.water : materials.secondary);
        fillTexture(context, roundedRectPath(24, 39, width * 0.2, 9, 3), materials.accent);
        for (const x of [width * 0.63, width * 0.78, width * 0.9]) {
          fillTexture(context, ellipsePath(x, centerY, 8, 8), materials.light);
          solidStroke(context, linePath([[x + 7, centerY], [x + 12, centerY + 3]]), palette.accent, 1.5);
        }
        break;
      }
      case 'housekeeping': {
        const cart = roundedRectPath(5, 8, width - 10, height - 22, 7);
        fillTexture(context, cart, materials.wood, { shadow: true });
        fillTexture(context, roundedRectPath(12, 15, width * 0.55, height - 36, 5), materials.light);
        for (let y = 20; y < height - 20; y += 12) {
          solidStroke(context, linePath([[17, y], [width * 0.51, y]]), palette.accent, 1);
        }
        fillTexture(context, roundedRectPath(width * 0.64, 14, width * 0.27, height - 34, 7), materials.primary);
        stitch(context, roundedRectPath(width * 0.68, 18, width * 0.19, height - 42, 5), cream, { width: 1 });
        for (const x of [18, width - 18]) fillTexture(context, ellipsePath(x, height - 7, 6, 6), materials.dark);
        break;
      }
      case 'luggage': {
        fillTexture(context, roundedRectPath(9, 24, width - 18, height - 32, 6), materials.dark, { shadow: true });
        fillTexture(context, roundedRectPath(16, 8, width - 29, 30, 6), materials.accent, { shadow: true });
        fillTexture(context, roundedRectPath(23, 3, 18, 8, 3), materials.wood);
        solidStroke(context, linePath([[20, 11], [20, 35], [width - 20, 35], [width - 20, 11]]), palette.light, 1.5);
        stitch(context, roundedRectPath(12, 27, width - 24, height - 38, 4), cream, { width: 1 });
        break;
      }
      case 'towel-rack': {
        solidStroke(context, linePath([[13, 9], [13, height - 9], [width - 13, height - 9], [width - 13, 9]]), palette.wood, 4);
        fillTexture(context, roundedRectPath(18, 14, width - 36, height - 28, 5), materials.light, { shadow: true });
        fillTexture(context, roundedRectPath(22, 18, width - 44, height * 0.25, 3), materials.secondary);
        stitch(context, linePath([[22, centerY], [width - 22, centerY]]), palette.accent, { width: 1, dash: [3, 3] });
        break;
      }
      case 'fishbowl': {
        const bowlOuter = ellipsePath(centerX, centerY + 2, 24, 22);
        const water = ellipsePath(centerX, centerY + 5, 19, 16);
        fillTexture(context, bowlOuter, materials.light, { shadow: true });
        fillTexture(context, water, materials.water);
        fillTexture(context, ellipsePath(centerX - 3, centerY + 3, 7, 4), materials.accent);
        fillTexture(context, polygonPath([[centerX + 4, centerY + 3], [centerX + 12, centerY - 2], [centerX + 12, centerY + 8]]), materials.accent);
        fillTexture(context, ellipsePath(centerX - 6, centerY + 2, 1, 1), materials.dark);
        stitch(context, bowlOuter, palette.primary, { width: 1, dash: [2, 2], alpha: 0.75 });
        solidStroke(context, linePath([[centerX - 18, centerY - 9], [centerX + 18, centerY - 9]]), cream, 1.2);
        break;
      }
      default: {
        const fallback = roundedRectPath(7, 7, width - 14, height - 14, 6);
        fillTexture(context, fallback, materials.primary, { shadow: true });
        stitch(context, fallback, cream);
      }
    }
  }

  function drawFurnitureCanvas(definition, footprint, materials, palette, interactiveOn = false) {
    const logicalWidth = Math.max(1, footprint.w) * 64;
    const logicalHeight = Math.max(1, footprint.h) * 64;
    const { canvas, context } = createCanvas(logicalWidth, logicalHeight, 1);
    drawFurniture(context, definition, logicalWidth, logicalHeight, materials, palette, interactiveOn);
    return canvas;
  }

  function drawAvatar(shape, color, sourceImages, palette) {
    const { canvas, context } = createCanvas(48, 48, 1);
    const patch = makeTintedTile(sourceImages.fleece, color, 1.18);
    const border = makeTintedTile(sourceImages.cotton, palette.light, 0.86);
    let outer;
    let inner;

    if (shape === 1) {
      outer = roundedRectPath(3, 3, 42, 42, 7);
      inner = roundedRectPath(7, 7, 34, 34, 5);
    } else if (shape === 2) {
      outer = polygonPath([[24, 1], [47, 24], [24, 47], [1, 24]]);
      inner = polygonPath([[24, 6], [42, 24], [24, 42], [6, 24]]);
    } else {
      outer = ellipsePath(24, 24, 22, 22);
      inner = ellipsePath(24, 24, 17.5, 17.5);
    }

    fillTexture(context, outer, border, { shadow: { blur: 5, offsetY: 2 } });
    fillTexture(context, inner, patch);
    stitch(context, inner, palette.light, { width: 1.2, dash: [2.5, 2.5] });
    fillTexture(context, ellipsePath(19, 21, 1.5, 1.5), makeTintedTile(sourceImages.corduroy, palette.dark, 0.8));
    fillTexture(context, ellipsePath(29, 21, 1.5, 1.5), makeTintedTile(sourceImages.corduroy, palette.dark, 0.8));
    stitch(context, linePath([[19, 29], [24, 31], [29, 29]]), palette.dark, { width: 1, dash: [2, 1] });
    return canvas;
  }

  function drawAccessory(accessory, color, sourceImages, palette) {
    const { canvas, context } = createCanvas(48, 48, 1);
    const patch = makeTintedTile(sourceImages.corduroy, color, 1.05);
    const thread = makeTintedTile(sourceImages.cotton, palette.light, 0.82);

    if (accessory === 1) {
      const band = new Path2D();
      band.arc(24, 23, 15, Math.PI, 0);
      strokeTexture(context, band, thread, 4);
      fillTexture(context, roundedRectPath(6, 20, 7, 14, 3), patch, { shadow: { blur: 2, offsetY: 1 } });
      fillTexture(context, roundedRectPath(35, 20, 7, 14, 3), patch, { shadow: { blur: 2, offsetY: 1 } });
      stitch(context, roundedRectPath(7, 21, 5, 12, 2), palette.light, { width: 0.8, dash: [2, 2] });
      stitch(context, roundedRectPath(36, 21, 5, 12, 2), palette.light, { width: 0.8, dash: [2, 2] });
    } else if (accessory === 2) {
      const halo = ellipsePath(24, 8, 15, 4);
      strokeTexture(context, halo, thread, 4);
      stitch(context, halo, color, { width: 1, dash: [2, 2] });
    } else if (accessory === 3) {
      fillTexture(context, roundedRectPath(8, 3, 32, 14, 7), patch, { shadow: { blur: 2, offsetY: 1 } });
      fillTexture(context, roundedRectPath(6, 13, 36, 7, 3), thread);
      stitch(context, linePath([[11, 15], [37, 15]]), color, { width: 1, dash: [2, 2] });
      crossStitch(context, 24, 7, palette.light, 1.5);
    }

    return canvas;
  }

  function addCanvasTexture(scene, key, canvas) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, canvas);
  }

  function install(scene, options = {}) {
    if (!scene || !scene.textures) throw new Error('A Phaser scene is required.');
    const footprints = Array.isArray(options.footprints) ? options.footprints : [];
    if (footprints.length === 0) throw new Error('Furniture footprints are required.');
    const definitions = Array.isArray(options.definitions) ? options.definitions : [];
    if (definitions.length !== footprints.length) throw new Error('Furniture definitions must match footprints.');

    const sourceImages = {};
    for (const id of Object.keys(SOURCE_MATERIALS)) {
      const texture = scene.textures.get(`craft-source-${id}`);
      const image = texture && texture.getSourceImage();
      if (!image || !image.width || !image.height) {
        throw new Error(`Craft material did not load: ${id}`);
      }
      sourceImages[id] = image;
    }

    const playerColors = (Array.isArray(options.playerColors) && options.playerColors.length > 0
      ? options.playerColors
      : DEFAULT_PLAYER_COLORS).map(toHex);

    THEME_PALETTES.forEach((palette, themeIndex) => {
      const materials = createThemeMaterials(sourceImages, palette);
      addCanvasTexture(scene, floorTextureKey(themeIndex), drawFloor(materials, palette));
      addCanvasTexture(scene, wallTextureKey(themeIndex), drawWall(materials, palette));

      footprints.forEach((footprint, type) => {
        const definition = definitions[type];
        addCanvasTexture(
          scene,
          furnitureTextureKey(themeIndex, type, false),
          drawFurnitureCanvas(definition, footprint, materials, palette, false),
        );
        if (definition.interactive === true) {
          addCanvasTexture(
            scene,
            furnitureTextureKey(themeIndex, type, true),
            drawFurnitureCanvas(definition, footprint, materials, palette, true),
          );
        }
      });
    });

    playerColors.forEach((color, colorIndex) => {
      SHAPE_NAMES.forEach((_shapeName, shapeIndex) => {
        addCanvasTexture(
          scene,
          playerTextureKey(shapeIndex, colorIndex),
          drawAvatar(shapeIndex, color, sourceImages, THEME_PALETTES[0]),
        );
      });
      for (let accessory = 1; accessory < ACCESSORY_NAMES.length; accessory++) {
        addCanvasTexture(
          scene,
          accessoryTextureKey(accessory, colorIndex),
          drawAccessory(accessory, color, sourceImages, THEME_PALETTES[0]),
        );
      }
    });

    generatedPreviewUrls.clear();
    return {
      themes: THEME_PALETTES.length,
      furnitureTypes: footprints.length,
      playerColors: playerColors.length,
    };
  }

  function furniturePreviewUrl(scene, theme, type) {
    const key = furnitureTextureKey(theme, type, false);
    if (generatedPreviewUrls.has(key)) return generatedPreviewUrls.get(key);
    const source = scene && scene.textures.get(key).getSourceImage();
    if (!source || typeof source.toDataURL !== 'function') return '';
    const url = source.toDataURL('image/png');
    generatedPreviewUrls.set(key, url);
    return url;
  }

  function validateMaterialManifest(manifest) {
    const errors = [];
    if (!manifest || typeof manifest !== 'object') return ['Manifest must be an object.'];
    if (manifest.license?.id !== 'CC0-1.0') errors.push('Manifest license must be CC0-1.0.');
    if (!Array.isArray(manifest.materials) || manifest.materials.length === 0) {
      errors.push('Manifest must contain materials.');
      return errors;
    }

    const ids = new Set();
    const files = new Set();
    for (const material of manifest.materials) {
      if (!material || typeof material !== 'object') {
        errors.push('Every material must be an object.');
        continue;
      }
      if (!material.id || ids.has(material.id)) errors.push(`Duplicate or missing material id: ${material.id || '(missing)'}.`);
      if (!material.file || files.has(material.file)) errors.push(`Duplicate or missing material file: ${material.file || '(missing)'}.`);
      if (!/^https:\/\/polyhaven\.com\/a\//.test(material.sourceAssetUrl || '')) {
        errors.push(`Material ${material.id || '(missing)'} needs a Poly Haven source page.`);
      }
      if (!/^[a-f0-9]{64}$/.test(material.sha256 || '')) {
        errors.push(`Material ${material.id || '(missing)'} needs a SHA-256 hash.`);
      }
      ids.add(material.id);
      files.add(material.file);
    }
    return errors;
  }

  return {
    ACCESSORY_NAMES,
    DEFAULT_PLAYER_COLORS,
    SHAPE_NAMES,
    SOURCE_MATERIALS,
    THEME_PALETTES,
    accessoryTextureKey,
    floorTextureKey,
    furniturePreviewUrl,
    furnitureTextureKey,
    hexToRgb,
    install,
    playerTextureKey,
    preload,
    validateMaterialManifest,
    wallTextureKey,
  };
});
