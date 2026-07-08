(function idleStateModule(root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.FreeLobbyIdle = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createIdleStateApi() {
  function createIdleState() {
    return { idleSince: null, sitting: false };
  }

  function resetIdleState(state) {
    state.idleSince = null;
    state.sitting = false;
  }

  function updateIdleState(state, { isMoving, now, idleMs }) {
    if (isMoving) {
      state.idleSince = null;
      if (state.sitting) {
        state.sitting = false;
        return 'stand';
      }
      return 'none';
    }

    if (state.idleSince === null || state.idleSince === undefined) {
      state.idleSince = now;
    }

    if (!state.sitting && now - state.idleSince > idleMs) {
      state.sitting = true;
      return 'sit';
    }

    return 'none';
  }

  function sittingTweenProps() {
    return { scaleY: 0.7 };
  }

  function standingTweenProps() {
    return { scaleY: 1 };
  }

  return {
    createIdleState,
    resetIdleState,
    sittingTweenProps,
    standingTweenProps,
    updateIdleState,
  };
});
