const test = require('node:test');
const assert = require('node:assert/strict');

const catalog = require('../public/js/furniture-catalog');

test('hotel craft catalog contains exactly 100 valid items', () => {
  assert.equal(catalog.ITEMS.length, 100);
  assert.deepEqual(catalog.validateCatalog(), []);
});

test('catalog covers every chooser category with recognizable hotel inventory', () => {
  const counts = new Map(catalog.CATEGORIES.map(category => [category.id, 0]));
  for (const item of catalog.ITEMS) counts.set(item.category, counts.get(item.category) + 1);

  for (const category of catalog.CATEGORIES) {
    assert.ok(counts.get(category.id) >= 6, `${category.name} needs at least six items`);
  }

  const requiredIds = [
    'stocked-minibar',
    'reception-desk',
    'brass-luggage-cart',
    'room-service-cart',
    'coffee-station',
    'corner-sectional',
    'canopy-bed',
    'wardrobe',
  ];
  for (const id of requiredIds) {
    assert.ok(catalog.ITEMS.some(item => item.id === id), `missing ${id}`);
  }
});

test('catalog search combines category, names, ids, and tags', () => {
  assert.ok(catalog.searchItems('luggage').length >= 4);
  assert.ok(catalog.searchItems('', 'hotel').length >= 10);
  assert.ok(catalog.searchItems('sofa', 'seating').some(item => item.id === 'three-seat-sofa'));
  assert.deepEqual(catalog.searchItems('minibar', 'pets'), []);
});
