(function cardCodecModule(root, factory) {
  const roomStyles = typeof module !== 'undefined' && module.exports
    ? require('./room-style')
    : root.FreeLobbyRoomStyles;
  const api = factory(roomStyles);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyCards = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCardCodecApi(roomStyles) {
  const VERSION = 2;
  const LEGACY_VERSION = 1;

  function colorChannels(value) {
    const normalized = roomStyles.normalizeHex(value, '#000000').slice(1);
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  }

  function channelsToHex(red, green, blue) {
    return `#${[red, green, blue].map(channel => channel.toString(16).padStart(2, '0')).join('')}`;
  }

  function writePixel(data, offset, values) {
    data[offset] = values[0];
    data[offset + 1] = values[1];
    data[offset + 2] = values[2];
    data[offset + 3] = 255;
  }

  function writeCardData(data, rowOffset, furniture = [], styleValue = 0) {
    const style = typeof styleValue === 'number'
      ? roomStyles.styleFromPreset(styleValue)
      : roomStyles.normalizeStyle(styleValue);
    data[rowOffset] = VERSION;
    data[rowOffset + 1] = style.preset;
    data[rowOffset + 2] = style.intensity;
    data[rowOffset + 3] = 255;
    data[rowOffset + 4] = furniture.length;
    data[rowOffset + 5] = 0;
    data[rowOffset + 6] = 0;
    data[rowOffset + 7] = 255;
    writePixel(data, rowOffset + 8, colorChannels(style.wall));
    writePixel(data, rowOffset + 12, colorChannels(style.floor));
    writePixel(data, rowOffset + 16, colorChannels(style.accent));

    furniture.forEach((item, index) => {
      const dataOffset = rowOffset + (index * 2 + 5) * 4;
      data[dataOffset] = item.t;
      data[dataOffset + 1] = item.x;
      data[dataOffset + 2] = item.y;
      data[dataOffset + 3] = 255;

      const metadataOffset = rowOffset + (index * 2 + 6) * 4;
      data[metadataOffset] = item.r || 0;
      data[metadataOffset + 1] = item.layer || 0;
      data[metadataOffset + 2] = item.on === true ? 1 : 0;
      data[metadataOffset + 3] = 255;
    });
  }

  function readCardData(data, rowOffset, maxFurniture = 100) {
    const version = data[rowOffset];
    if (version !== VERSION && version !== LEGACY_VERSION) {
      throw new Error('Unknown card version or corrupted data.');
    }
    const theme = data[rowOffset + 1];
    const count = data[rowOffset + 4];
    if (count > maxFurniture) throw new Error(`Card contains too many items (max ${maxFurniture}).`);
    const style = version === LEGACY_VERSION
      ? roomStyles.styleFromPreset(theme)
      : roomStyles.normalizeStyle({
        preset: theme,
        intensity: data[rowOffset + 2],
        wall: channelsToHex(data[rowOffset + 8], data[rowOffset + 9], data[rowOffset + 10]),
        floor: channelsToHex(data[rowOffset + 12], data[rowOffset + 13], data[rowOffset + 14]),
        accent: channelsToHex(data[rowOffset + 16], data[rowOffset + 17], data[rowOffset + 18]),
      }, theme);
    const itemPixelOffset = version === LEGACY_VERSION ? 2 : 5;

    const furniture = [];
    for (let index = 0; index < count; index++) {
      const dataOffset = rowOffset + (index * 2 + itemPixelOffset) * 4;
      const metadataOffset = rowOffset + (index * 2 + itemPixelOffset + 1) * 4;
      furniture.push({
        t: data[dataOffset],
        x: data[dataOffset + 1],
        y: data[dataOffset + 2],
        r: data[metadataOffset],
        layer: data[metadataOffset + 1],
        on: data[metadataOffset + 2] === 1,
      });
    }
    return { theme: style.preset, style, furniture };
  }

  return { LEGACY_VERSION, VERSION, readCardData, writeCardData };
});
