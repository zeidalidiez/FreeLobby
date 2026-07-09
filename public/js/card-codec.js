(function cardCodecModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyCards = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCardCodecApi() {
  const VERSION = 1;

  function writeCardData(data, rowOffset, furniture = [], theme = 0) {
    data[rowOffset] = VERSION;
    data[rowOffset + 1] = theme;
    data[rowOffset + 2] = 0;
    data[rowOffset + 3] = 255;
    data[rowOffset + 4] = furniture.length;
    data[rowOffset + 5] = 0;
    data[rowOffset + 6] = 0;
    data[rowOffset + 7] = 255;

    furniture.forEach((item, index) => {
      const dataOffset = rowOffset + (index * 2 + 2) * 4;
      data[dataOffset] = item.t;
      data[dataOffset + 1] = item.x;
      data[dataOffset + 2] = item.y;
      data[dataOffset + 3] = 255;

      const metadataOffset = rowOffset + (index * 2 + 3) * 4;
      data[metadataOffset] = item.r || 0;
      data[metadataOffset + 1] = item.layer || 0;
      data[metadataOffset + 2] = item.on === true ? 1 : 0;
      data[metadataOffset + 3] = 255;
    });
  }

  function readCardData(data, rowOffset, maxFurniture = 100) {
    const version = data[rowOffset];
    if (version !== VERSION) throw new Error('Unknown card version or corrupted data.');
    const theme = data[rowOffset + 1];
    const count = data[rowOffset + 4];
    if (count > maxFurniture) throw new Error(`Card contains too many items (max ${maxFurniture}).`);

    const furniture = [];
    for (let index = 0; index < count; index++) {
      const dataOffset = rowOffset + (index * 2 + 2) * 4;
      const metadataOffset = rowOffset + (index * 2 + 3) * 4;
      furniture.push({
        t: data[dataOffset],
        x: data[dataOffset + 1],
        y: data[dataOffset + 2],
        r: data[metadataOffset],
        layer: data[metadataOffset + 1],
        on: data[metadataOffset + 2] === 1,
      });
    }
    return { theme, furniture };
  }

  return { VERSION, readCardData, writeCardData };
});
