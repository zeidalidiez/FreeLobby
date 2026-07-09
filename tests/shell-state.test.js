const assert = require('node:assert/strict');
const test = require('node:test');
const { createShellController } = require('../public/js/shell-state');

function createElement() {
  const classes = new Set();
  const attributes = new Map();
  return {
    hidden: false,
    inert: false,
    classList: {
      add: value => classes.add(value),
      contains: value => classes.has(value),
      remove: value => classes.delete(value),
    },
    getAttribute: name => attributes.get(name),
    hasAttribute: name => attributes.has(name),
    removeAttribute: name => attributes.delete(name),
    setAttribute: (name, value) => attributes.set(name, value),
  };
}

test('game entry removes the landing screen from layout after its transition', () => {
  const landing = createElement();
  const game = createElement();
  let finishTransition;
  const controller = createShellController(landing, game, {
    schedule(callback) {
      finishTransition = callback;
      return 1;
    },
    cancel() {},
  });

  controller.enterGame();
  assert.equal(landing.hidden, false);
  assert.equal(landing.hasAttribute('inert'), true);
  assert.equal(landing.classList.contains('hidden'), true);
  assert.equal(landing.getAttribute('aria-hidden'), 'true');
  assert.equal(game.classList.contains('active'), true);
  assert.equal(game.getAttribute('aria-hidden'), 'false');

  finishTransition();
  assert.equal(landing.hidden, true);
});

test('returning to landing cancels removal and restores accessibility state', () => {
  const landing = createElement();
  const game = createElement();
  let staleTransition;
  let cancelledTimer;
  const controller = createShellController(landing, game, {
    schedule(callback) {
      staleTransition = callback;
      return 7;
    },
    cancel(timer) {
      cancelledTimer = timer;
    },
  });

  controller.enterGame();
  controller.showLanding();
  staleTransition();

  assert.equal(cancelledTimer, 7);
  assert.equal(landing.hidden, false);
  assert.equal(landing.hasAttribute('inert'), false);
  assert.equal(landing.classList.contains('hidden'), false);
  assert.equal(landing.getAttribute('aria-hidden'), 'false');
  assert.equal(game.classList.contains('active'), false);
  assert.equal(game.getAttribute('aria-hidden'), 'true');
});
