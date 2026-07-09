(function assetNormalizerModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyAssets = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAssetNormalizerApi() {
  function matteToAlpha(pixels) {
    for (let offset = 0; offset < pixels.length; offset += 4) {
      const red = pixels[offset];
      const green = pixels[offset + 1];
      const blue = pixels[offset + 2];
      const maxChannel = Math.max(red, green, blue);
      const minChannel = Math.min(red, green, blue);
      const saturation = maxChannel - minChannel;
      const alpha = saturation < 14 ? 0 : Math.min(255, Math.max(0, (maxChannel - 8) * 4));
      pixels[offset + 3] = Math.min(pixels[offset + 3], alpha);
    }
    return pixels;
  }

  function normalizeFurnitureTextures(phaserScene, textureCount) {
    for (let index = 0; index < textureCount; index++) {
      const key = `furn-${index}`;
      const source = phaserScene.textures.get(key).getSourceImage();
      if (!source || !source.width || !source.height) continue;

      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(source, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      matteToAlpha(imageData.data);
      context.putImageData(imageData, 0, 0);
      phaserScene.textures.remove(key);
      phaserScene.textures.addCanvas(key, canvas);
    }
  }

  return { matteToAlpha, normalizeFurnitureTextures };
});
