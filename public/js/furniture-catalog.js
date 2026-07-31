(function furnitureCatalogModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.FreeLobbyFurniture = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createFurnitureCatalogApi() {
  const CATEGORIES = Object.freeze([
    { id: 'seating', name: 'Seating', icon: 'armchair' },
    { id: 'tables', name: 'Tables', icon: 'table-2' },
    { id: 'beds', name: 'Beds', icon: 'bed-double' },
    { id: 'storage', name: 'Storage', icon: 'archive' },
    { id: 'lighting', name: 'Lighting', icon: 'lamp-floor' },
    { id: 'decor', name: 'Decor', icon: 'frame' },
    { id: 'rugs', name: 'Rugs', icon: 'rectangle-horizontal' },
    { id: 'plants', name: 'Plants', icon: 'sprout' },
    { id: 'hotel', name: 'Hotel', icon: 'concierge-bell' },
    { id: 'pets', name: 'Pets', icon: 'paw-print' },
  ]);

  function item(id, name, category, recipe, width = 1, height = 1, options = {}) {
    return Object.freeze({
      id,
      name,
      category,
      recipe,
      w: width,
      h: height,
      walkable: options.walkable === true,
      interactive: options.interactive === true,
      variant: options.variant || 0,
      tags: Object.freeze(options.tags || []),
      icon: options.icon || 'square',
    });
  }

  // Keep types 0–19 compatible with existing rooms and Memory Cards.
  // Everything after that extends the same numeric type namespace.
  const ITEMS = Object.freeze([
    item('storage-cube', 'Storage Cube', 'storage', 'cabinet', 1, 1, { icon: 'box', tags: ['cube', 'small'] }),
    item('round-pouf', 'Round Pouf', 'seating', 'ottoman', 1, 1, { walkable: true, icon: 'circle', tags: ['seat', 'round'] }),
    item('counter-stool', 'Counter Stool', 'seating', 'stool', 1, 1, { walkable: true, icon: 'circle-dot', tags: ['bar', 'seat'] }),
    item('floor-cushion', 'Floor Cushion', 'seating', 'cushion', 1, 1, { walkable: true, icon: 'diamond', tags: ['pillow', 'seat'] }),
    item('dining-chair', 'Dining Chair', 'seating', 'chair', 1, 1, { walkable: true, icon: 'armchair', tags: ['wood', 'seat'] }),
    item('potted-plant', 'Potted Plant', 'plants', 'plant', 1, 1, { icon: 'sprout', tags: ['leafy', 'green'] }),
    item('drum-lamp', 'Drum Lamp', 'lighting', 'table-lamp', 1, 1, { interactive: true, icon: 'lamp', tags: ['light', 'table'] }),
    item('patchwork-rug', 'Patchwork Rug', 'rugs', 'rug', 2, 2, { walkable: true, icon: 'rectangle-horizontal', tags: ['large', 'pattern'] }),
    item('double-bed', 'Double Bed', 'beds', 'bed', 2, 2, { walkable: true, icon: 'bed-double', tags: ['hotel', 'sleep'] }),
    item('soaking-tub', 'Soaking Tub', 'hotel', 'bathtub', 2, 1, { icon: 'bath', tags: ['bathroom', 'spa'] }),
    item('three-seat-sofa', 'Three-Seat Sofa', 'seating', 'sofa', 2, 1, { walkable: true, icon: 'sofa', tags: ['couch', 'lounge'] }),
    item('game-console', 'Game Console', 'decor', 'game-console', 1, 1, { icon: 'gamepad-2', tags: ['games', 'media'] }),
    item('guest-computer', 'Guest Computer', 'decor', 'computer', 1, 1, { icon: 'monitor', tags: ['desk', 'business'] }),
    item('hotel-television', 'Hotel Television', 'decor', 'television', 2, 1, { interactive: true, icon: 'tv', tags: ['media', 'screen'] }),
    item('private-bathroom', 'Private Bathroom', 'hotel', 'toilet', 1, 1, { icon: 'bath', tags: ['bathroom'] }),
    item('patchwork-cat', 'Patchwork Cat', 'pets', 'pet', 1, 1, { walkable: true, variant: 'cat', icon: 'cat', tags: ['animal'] }),
    item('patchwork-dog', 'Patchwork Dog', 'pets', 'pet', 1, 1, { walkable: true, variant: 'dog', icon: 'dog', tags: ['animal'] }),
    item('patchwork-rabbit', 'Patchwork Rabbit', 'pets', 'pet', 1, 1, { walkable: true, variant: 'rabbit', icon: 'rabbit', tags: ['animal'] }),
    item('guest-fishbowl', 'Guest Fishbowl', 'pets', 'fishbowl', 1, 1, { icon: 'fish', tags: ['animal', 'water'] }),
    item('patchwork-bird', 'Patchwork Bird', 'pets', 'pet', 1, 1, { walkable: true, variant: 'bird', icon: 'bird', tags: ['animal'] }),

    item('club-chair', 'Club Chair', 'seating', 'armchair', 1, 1, { walkable: true, variant: 0, icon: 'armchair', tags: ['lounge', 'plush'] }),
    item('wingback-chair', 'Wingback Chair', 'seating', 'armchair', 1, 1, { walkable: true, variant: 1, icon: 'armchair', tags: ['classic', 'tall'] }),
    item('slipper-chair', 'Slipper Chair', 'seating', 'armchair', 1, 1, { walkable: true, variant: 2, icon: 'armchair', tags: ['compact'] }),
    item('cane-chair', 'Cane Chair', 'seating', 'cane-chair', 1, 1, { walkable: true, icon: 'armchair', tags: ['woven', 'rattan'] }),
    item('desk-chair', 'Desk Chair', 'seating', 'desk-chair', 1, 1, { walkable: true, icon: 'armchair', tags: ['office', 'work'] }),
    item('lobby-bench', 'Lobby Bench', 'seating', 'bench', 2, 1, { walkable: true, variant: 0, icon: 'sofa', tags: ['entry', 'wood'] }),
    item('window-bench', 'Window Bench', 'seating', 'bench', 2, 1, { walkable: true, variant: 1, icon: 'sofa', tags: ['cushion', 'window'] }),
    item('hotel-loveseat', 'Hotel Loveseat', 'seating', 'sofa', 2, 1, { walkable: true, variant: 1, icon: 'sofa', tags: ['small', 'couch'] }),
    item('corner-sectional', 'Corner Sectional', 'seating', 'sectional', 3, 2, { walkable: true, icon: 'sofa', tags: ['large', 'corner'] }),
    item('reading-chaise', 'Reading Chaise', 'seating', 'chaise', 2, 1, { walkable: true, icon: 'sofa', tags: ['lounge', 'long'] }),

    item('coffee-table', 'Coffee Table', 'tables', 'table', 2, 1, { variant: 0, icon: 'table-2', tags: ['low', 'lounge'] }),
    item('round-coffee-table', 'Round Coffee Table', 'tables', 'round-table', 1, 1, { variant: 0, icon: 'circle', tags: ['low', 'lounge'] }),
    item('side-table', 'Side Table', 'tables', 'table', 1, 1, { variant: 1, icon: 'table-2', tags: ['small', 'bedside'] }),
    item('pedestal-table', 'Pedestal Table', 'tables', 'round-table', 1, 1, { variant: 1, icon: 'circle', tags: ['bistro', 'round'] }),
    item('nesting-tables', 'Nesting Tables', 'tables', 'nesting-tables', 1, 1, { icon: 'layers-3', tags: ['small', 'pair'] }),
    item('console-table', 'Console Table', 'tables', 'table', 2, 1, { variant: 2, icon: 'table-2', tags: ['hall', 'narrow'] }),
    item('dining-table', 'Dining Table', 'tables', 'table', 3, 2, { variant: 3, icon: 'table-2', tags: ['large', 'meal'] }),
    item('writing-desk', 'Writing Desk', 'tables', 'desk', 2, 1, { variant: 0, icon: 'table-2', tags: ['work', 'drawer'] }),
    item('vanity-table', 'Vanity Table', 'tables', 'desk', 2, 1, { variant: 1, icon: 'table-2', tags: ['mirror', 'bedroom'] }),
    item('bistro-table', 'Bistro Table', 'tables', 'round-table', 2, 2, { variant: 2, icon: 'circle', tags: ['dining', 'cafe'] }),

    item('single-bed', 'Single Bed', 'beds', 'bed', 1, 2, { walkable: true, variant: 1, icon: 'bed-single', tags: ['sleep', 'compact'] }),
    item('queen-bed', 'Queen Bed', 'beds', 'bed', 2, 2, { walkable: true, variant: 2, icon: 'bed-double', tags: ['sleep', 'hotel'] }),
    item('king-bed', 'King Bed', 'beds', 'bed', 3, 2, { walkable: true, variant: 3, icon: 'bed-double', tags: ['sleep', 'suite'] }),
    item('canopy-bed', 'Canopy Bed', 'beds', 'canopy-bed', 2, 2, { walkable: true, icon: 'bed-double', tags: ['romantic', 'suite'] }),
    item('daybed', 'Daybed', 'beds', 'daybed', 2, 1, { walkable: true, icon: 'bed-single', tags: ['sofa', 'sleep'] }),
    item('bunk-bed', 'Bunk Bed', 'beds', 'bunk-bed', 2, 1, { walkable: true, icon: 'bed-double', tags: ['shared', 'sleep'] }),
    item('rollaway-bed', 'Rollaway Bed', 'beds', 'rollaway-bed', 1, 2, { walkable: true, icon: 'bed-single', tags: ['portable', 'guest'] }),

    item('wardrobe', 'Wardrobe', 'storage', 'wardrobe', 2, 1, { icon: 'archive', tags: ['clothes', 'tall'] }),
    item('six-drawer-dresser', 'Six-Drawer Dresser', 'storage', 'dresser', 2, 1, { icon: 'archive', tags: ['drawers', 'bedroom'] }),
    item('hotel-nightstand', 'Hotel Nightstand', 'storage', 'cabinet', 1, 1, { variant: 1, icon: 'archive', tags: ['bedside', 'drawer'] }),
    item('tall-bookcase', 'Tall Bookcase', 'storage', 'bookcase', 1, 2, { icon: 'library', tags: ['books', 'shelf'] }),
    item('open-shelving', 'Open Shelving', 'storage', 'bookcase', 2, 1, { variant: 1, icon: 'library', tags: ['display', 'shelf'] }),
    item('lobby-sideboard', 'Lobby Sideboard', 'storage', 'dresser', 2, 1, { variant: 1, icon: 'archive', tags: ['hall', 'cabinet'] }),
    item('travel-trunk', 'Travel Trunk', 'storage', 'trunk', 2, 1, { icon: 'briefcase', tags: ['luggage', 'vintage'] }),
    item('room-safe', 'Room Safe', 'storage', 'safe', 1, 1, { interactive: true, icon: 'lock-keyhole', tags: ['secure', 'hotel'] }),
    item('folding-luggage-rack', 'Folding Luggage Rack', 'storage', 'luggage-rack', 1, 1, { walkable: true, icon: 'briefcase', tags: ['suitcase', 'hotel'] }),

    item('bedside-lamp', 'Bedside Lamp', 'lighting', 'table-lamp', 1, 1, { interactive: true, variant: 1, icon: 'lamp', tags: ['small', 'warm'] }),
    item('floor-lamp', 'Floor Lamp', 'lighting', 'floor-lamp', 1, 1, { interactive: true, variant: 0, icon: 'lamp-floor', tags: ['tall', 'warm'] }),
    item('reading-lamp', 'Reading Lamp', 'lighting', 'floor-lamp', 1, 1, { interactive: true, variant: 1, icon: 'lamp-desk', tags: ['angled', 'chair'] }),
    item('wall-sconce', 'Wall Sconce', 'lighting', 'sconce', 1, 1, { interactive: true, icon: 'lamp-wall-up', tags: ['wall', 'warm'] }),
    item('fabric-pendant', 'Fabric Pendant', 'lighting', 'pendant', 1, 1, { interactive: true, variant: 0, icon: 'lamp-ceiling', tags: ['ceiling', 'shade'] }),
    item('lobby-chandelier', 'Lobby Chandelier', 'lighting', 'pendant', 2, 2, { interactive: true, variant: 1, icon: 'lamp-ceiling', tags: ['large', 'ceiling'] }),
    item('paper-lantern', 'Paper Lantern', 'lighting', 'lantern', 1, 1, { interactive: true, icon: 'lamp', tags: ['soft', 'paper'] }),
    item('desk-lamp', 'Desk Lamp', 'lighting', 'desk-lamp', 1, 1, { interactive: true, icon: 'lamp-desk', tags: ['work', 'task'] }),
    item('candle-cluster', 'Candle Cluster', 'lighting', 'candles', 1, 1, { interactive: true, icon: 'flame', tags: ['cozy', 'small'] }),

    item('arched-mirror', 'Arched Mirror', 'decor', 'mirror', 1, 2, { icon: 'scan', tags: ['wall', 'reflection'] }),
    item('landscape-print', 'Landscape Print', 'decor', 'art', 2, 1, { variant: 0, icon: 'image', tags: ['wall', 'picture'] }),
    item('woven-tapestry', 'Woven Tapestry', 'decor', 'art', 2, 1, { variant: 1, icon: 'image', tags: ['wall', 'textile'] }),
    item('lobby-clock', 'Lobby Clock', 'decor', 'clock', 1, 1, { icon: 'clock-3', tags: ['wall', 'time'] }),
    item('folding-screen', 'Folding Screen', 'decor', 'divider', 3, 1, { icon: 'panels-top-left', tags: ['privacy', 'divider'] }),
    item('hotel-fireplace', 'Hotel Fireplace', 'decor', 'fireplace', 2, 1, { interactive: true, icon: 'flame', tags: ['warm', 'hearth'] }),
    item('table-radio', 'Table Radio', 'decor', 'radio', 1, 1, { interactive: true, icon: 'radio', tags: ['music', 'retro'] }),
    item('record-player', 'Record Player', 'decor', 'record-player', 1, 1, { interactive: true, icon: 'disc-3', tags: ['music', 'vinyl'] }),
    item('room-telephone', 'Room Telephone', 'decor', 'telephone', 1, 1, { icon: 'phone', tags: ['hotel', 'desk'] }),
    item('tea-service', 'Tea Service', 'decor', 'tea-service', 1, 1, { walkable: true, icon: 'coffee', tags: ['tray', 'cups'] }),

    item('hall-runner', 'Hall Runner', 'rugs', 'rug', 1, 3, { walkable: true, variant: 1, icon: 'rectangle-vertical', tags: ['long', 'hall'] }),
    item('round-lobby-rug', 'Round Lobby Rug', 'rugs', 'round-rug', 2, 2, { walkable: true, variant: 0, icon: 'circle', tags: ['round', 'large'] }),
    item('grand-lounge-rug', 'Grand Lounge Rug', 'rugs', 'rug', 3, 2, { walkable: true, variant: 2, icon: 'rectangle-horizontal', tags: ['large', 'lounge'] }),
    item('geometric-rug', 'Geometric Rug', 'rugs', 'rug', 2, 2, { walkable: true, variant: 3, icon: 'rectangle-horizontal', tags: ['pattern', 'modern'] }),
    item('floral-rug', 'Floral Rug', 'rugs', 'round-rug', 2, 2, { walkable: true, variant: 1, icon: 'flower-2', tags: ['pattern', 'flower'] }),
    item('striped-rug', 'Striped Rug', 'rugs', 'rug', 2, 1, { walkable: true, variant: 4, icon: 'rectangle-horizontal', tags: ['stripe', 'small'] }),
    item('shag-rug', 'Shag Rug', 'rugs', 'round-rug', 1, 1, { walkable: true, variant: 2, icon: 'circle', tags: ['soft', 'small'] }),

    item('monstera', 'Monstera', 'plants', 'plant', 1, 1, { variant: 'monstera', icon: 'sprout', tags: ['leafy', 'large'] }),
    item('parlor-palm', 'Parlor Palm', 'plants', 'plant', 1, 2, { variant: 'palm', icon: 'trees', tags: ['tall', 'leafy'] }),
    item('button-fern', 'Button Fern', 'plants', 'plant', 1, 1, { variant: 'fern', icon: 'leaf', tags: ['soft', 'leafy'] }),
    item('rubber-plant', 'Rubber Plant', 'plants', 'plant', 1, 2, { variant: 'rubber', icon: 'trees', tags: ['tall', 'leafy'] }),
    item('patched-cactus', 'Patched Cactus', 'plants', 'cactus', 1, 1, { icon: 'flower-2', tags: ['desert', 'small'] }),
    item('fresh-flowers', 'Fresh Flowers', 'plants', 'flowers', 1, 1, { icon: 'flower-2', tags: ['vase', 'colorful'] }),
    item('lobby-bonsai', 'Lobby Bonsai', 'plants', 'bonsai', 1, 1, { icon: 'tree-pine', tags: ['small', 'tree'] }),

    item('stocked-minibar', 'Stocked Minibar', 'hotel', 'minibar', 2, 1, { interactive: true, icon: 'refrigerator', tags: ['drinks', 'cabinet'] }),
    item('reception-desk', 'Reception Desk', 'hotel', 'reception', 3, 1, { icon: 'concierge-bell', tags: ['lobby', 'front desk'] }),
    item('brass-luggage-cart', 'Brass Luggage Cart', 'hotel', 'luggage-cart', 2, 1, { walkable: true, icon: 'luggage', tags: ['bags', 'bellhop'] }),
    item('concierge-bell', 'Concierge Bell Stand', 'hotel', 'bell-stand', 1, 1, { interactive: true, icon: 'concierge-bell', tags: ['lobby', 'bell'] }),
    item('room-key-rack', 'Room Key Rack', 'hotel', 'key-rack', 2, 1, { icon: 'key-round', tags: ['lobby', 'keys'] }),
    item('room-service-cart', 'Room-Service Cart', 'hotel', 'service-cart', 2, 1, { walkable: true, icon: 'utensils', tags: ['food', 'wheels'] }),
    item('coffee-station', 'Coffee Station', 'hotel', 'coffee-station', 2, 1, { interactive: true, icon: 'coffee', tags: ['drinks', 'breakfast'] }),
    item('housekeeping-cart', 'Housekeeping Cart', 'hotel', 'housekeeping', 2, 1, { walkable: true, icon: 'sparkles', tags: ['linen', 'cleaning'] }),
    item('suitcase-stack', 'Suitcase Stack', 'hotel', 'luggage', 1, 1, { icon: 'luggage', tags: ['bags', 'travel', 'luggage'] }),
    item('towel-rack', 'Towel Rack', 'hotel', 'towel-rack', 1, 1, { walkable: true, icon: 'align-justify', tags: ['bathroom', 'linen'] }),

    item('patchwork-turtle', 'Patchwork Turtle', 'pets', 'pet', 1, 1, { walkable: true, variant: 'turtle', icon: 'turtle', tags: ['animal', 'slow'] }),
  ]);

  const CATEGORY_IDS = new Set(CATEGORIES.map(category => category.id));

  function validateCatalog(items = ITEMS) {
    const errors = [];
    const ids = new Set();
    if (!Array.isArray(items)) return ['Catalog must be an array.'];
    if (items.length < 80 || items.length > 100) {
      errors.push(`Catalog must contain 80–100 items; received ${items.length}.`);
    }
    items.forEach((definition, type) => {
      if (!definition || typeof definition !== 'object') {
        errors.push(`Item ${type} must be an object.`);
        return;
      }
      if (!definition.id || ids.has(definition.id)) errors.push(`Duplicate or missing id at type ${type}.`);
      if (!definition.name) errors.push(`Item ${type} is missing a name.`);
      if (!CATEGORY_IDS.has(definition.category)) errors.push(`Item ${type} has unknown category ${definition.category}.`);
      if (!definition.recipe) errors.push(`Item ${type} is missing a recipe.`);
      if (!Number.isInteger(definition.w) || definition.w < 1 || definition.w > 3) errors.push(`Item ${type} has invalid width.`);
      if (!Number.isInteger(definition.h) || definition.h < 1 || definition.h > 3) errors.push(`Item ${type} has invalid height.`);
      ids.add(definition.id);
    });
    return errors;
  }

  function searchItems(query = '', category = 'all') {
    const normalizedQuery = String(query).trim().toLowerCase();
    return ITEMS.map((definition, type) => ({ ...definition, type })).filter(definition => {
      if (category !== 'all' && definition.category !== category) return false;
      if (!normalizedQuery) return true;
      return [
        definition.name,
        definition.id,
        definition.category,
        ...definition.tags,
      ].some(value => String(value).toLowerCase().includes(normalizedQuery));
    });
  }

  return {
    CATEGORIES,
    ITEMS,
    searchItems,
    validateCatalog,
  };
});
