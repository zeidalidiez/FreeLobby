const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createIdleState,
  sittingTweenProps,
  standingTweenProps,
  updateIdleState,
} = require('../public/js/idle-state');

test('idle state emits one sit action until movement wakes it', () => {
  const state = createIdleState();

  assert.equal(updateIdleState(state, { isMoving: false, now: 0, idleMs: 5000 }), 'none');
  assert.equal(updateIdleState(state, { isMoving: false, now: 5001, idleMs: 5000 }), 'sit');
  assert.equal(updateIdleState(state, { isMoving: false, now: 6000, idleMs: 5000 }), 'none');
  assert.equal(updateIdleState(state, { isMoving: true, now: 7000, idleMs: 5000 }), 'stand');
  assert.equal(updateIdleState(state, { isMoving: true, now: 7100, idleMs: 5000 }), 'none');
});

test('separate idle states cannot reset each other', () => {
  const local = createIdleState();
  const remote = createIdleState();

  assert.equal(updateIdleState(local, { isMoving: false, now: 0, idleMs: 5000 }), 'none');
  assert.equal(updateIdleState(local, { isMoving: false, now: 5001, idleMs: 5000 }), 'sit');
  assert.equal(updateIdleState(remote, { isMoving: false, now: 0, idleMs: 5000 }), 'none');
  assert.equal(updateIdleState(remote, { isMoving: false, now: 5001, idleMs: 5000 }), 'sit');
  assert.equal(updateIdleState(remote, { isMoving: true, now: 5100, idleMs: 5000 }), 'stand');

  assert.equal(local.sitting, true);
  assert.equal(updateIdleState(local, { isMoving: false, now: 5200, idleMs: 5000 }), 'none');
});

test('sit and stand visuals never tween physics position', () => {
  assert.deepEqual(sittingTweenProps(), { scaleY: 0.7 });
  assert.deepEqual(standingTweenProps(), { scaleY: 1 });
});
