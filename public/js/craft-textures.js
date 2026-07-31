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

  function drawFurniture(context, type, width, height, materials, palette, interactiveOn = false) {
    const centerX = width / 2;
    const centerY = height / 2;
    const cream = palette.light;
    const ink = 'rgba(29, 24, 23, 0.72)';
    const subtleInk = 'rgba(29, 24, 23, 0.46)';

    switch (type) {
      case 0: { // Cube
        const outer = roundedRectPath(8, 8, width - 16, height - 16, 5);
        const inner = roundedRectPath(14, 14, width - 28, height - 28, 3);
        fillTexture(context, outer, materials.wood, { shadow: true });
        fillTexture(context, inner, materials.primary);
        stitch(context, inner, cream, { width: 1.2 });
        solidStroke(context, linePath([[14, 14], [22, 22], [width - 14, 14]]), subtleInk, 1);
        solidStroke(context, linePath([[14, height - 14], [22, height - 22], [22, 22]]), subtleInk, 1);
        break;
      }
      case 1: { // Sphere
        const outer = ellipsePath(centerX, centerY, width * 0.39, height * 0.39);
        const inner = ellipsePath(centerX, centerY, width * 0.31, height * 0.31);
        fillTexture(context, outer, materials.accent, { shadow: true });
        fillTexture(context, inner, materials.secondary);
        stitch(context, ellipsePath(centerX, centerY, width * 0.27, height * 0.12), palette.primary, { width: 1 });
        stitch(context, linePath([[centerX, centerY - height * 0.29], [centerX, centerY + height * 0.29]]), palette.primary, { width: 1 });
        break;
      }
      case 2: { // Cylinder
        const body = roundedRectPath(15, 12, width - 30, height - 24, 10);
        fillTexture(context, body, materials.dark, { shadow: true });
        fillTexture(context, ellipsePath(centerX, 17, width * 0.26, 8), materials.light);
        fillTexture(context, ellipsePath(centerX, height - 17, width * 0.26, 8), materials.secondary);
        stitch(context, ellipsePath(centerX, 17, width * 0.22, 5), palette.accent, { width: 1 });
        stitch(context, linePath([[18, 20], [18, height - 20], [width - 18, height - 20], [width - 18, 20]]), cream, { width: 1 });
        break;
      }
      case 3: { // Pyramid
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
      case 4: { // Chair
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
      case 5: { // Plant
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
      case 6: { // Lamp
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
      case 7: { // Rug
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
      case 8: { // Bed
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
      case 9: { // Bathtub
        const shell = roundedRectPath(4, 8, width - 8, height - 16, 15);
        const basin = roundedRectPath(12, 15, width - 24, height - 30, 11);
        fillTexture(context, shell, materials.light, { shadow: true });
        fillTexture(context, basin, materials.water);
        stitch(context, roundedRectPath(8, 12, width - 16, height - 24, 13), palette.secondary, { width: 1.2 });
        fillTexture(context, ellipsePath(width - 19, centerY, 4, 4), materials.accent);
        solidStroke(context, linePath([[width - 19, centerY - 4], [width - 19, 10]]), ink, 1.2);
        break;
      }
      case 10: { // Couch
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
      case 11: { // Console
        const shell = roundedRectPath(7, 13, width - 14, height - 26, 9);
        fillTexture(context, shell, materials.dark, { shadow: true });
        fillTexture(context, roundedRectPath(13, 19, width - 26, height - 38, 6), materials.primary);
        solidStroke(context, linePath([[20, centerY], [30, centerY], [25, centerY - 5], [25, centerY + 5]]), cream, 2);
        fillTexture(context, ellipsePath(width - 24, centerY - 4, 3.5, 3.5), materials.accent);
        fillTexture(context, ellipsePath(width - 17, centerY + 4, 3.5, 3.5), materials.light);
        stitch(context, shell, palette.secondary, { width: 1 });
        break;
      }
      case 12: { // Computer
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
      case 13: { // TV
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
      case 14: { // Toilet
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
      case 15: { // Cat
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
      case 16: { // Dog
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
      case 17: { // Rabbit
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
      case 18: { // Fishbowl
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
      case 19: { // Bird
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
      default: {
        const fallback = roundedRectPath(7, 7, width - 14, height - 14, 6);
        fillTexture(context, fallback, materials.primary, { shadow: true });
        stitch(context, fallback, cream);
      }
    }
  }

  function drawFurnitureCanvas(type, footprint, materials, palette, interactiveOn = false) {
    const logicalWidth = Math.max(1, footprint.w) * 64;
    const logicalHeight = Math.max(1, footprint.h) * 64;
    const { canvas, context } = createCanvas(logicalWidth, logicalHeight, 2);
    drawFurniture(context, type, logicalWidth, logicalHeight, materials, palette, interactiveOn);
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
        addCanvasTexture(
          scene,
          furnitureTextureKey(themeIndex, type, false),
          drawFurnitureCanvas(type, footprint, materials, palette, false),
        );
        if (type === 6 || type === 13) {
          addCanvasTexture(
            scene,
            furnitureTextureKey(themeIndex, type, true),
            drawFurnitureCanvas(type, footprint, materials, palette, true),
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
