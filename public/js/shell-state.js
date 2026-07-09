(function attachShellState(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.shellState = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createShellStateApi() {
  const LANDING_TRANSITION_MS = 600;

  function createShellController(landingScreen, gameContainer, options = {}) {
    const schedule = options.schedule || setTimeout;
    const cancel = options.cancel || clearTimeout;
    const transitionMs = options.transitionMs ?? LANDING_TRANSITION_MS;
    let removalTimer = null;

    function cancelPendingRemoval() {
      if (removalTimer === null) return;
      cancel(removalTimer);
      removalTimer = null;
    }

    function enterGame() {
      cancelPendingRemoval();
      landingScreen.hidden = false;
      landingScreen.setAttribute('inert', '');
      landingScreen.classList.add('hidden');
      landingScreen.setAttribute('aria-hidden', 'true');
      gameContainer.classList.add('active');
      gameContainer.setAttribute('aria-hidden', 'false');

      removalTimer = schedule(() => {
        removalTimer = null;
        if (landingScreen.classList.contains('hidden')) landingScreen.hidden = true;
      }, transitionMs);
    }

    function showLanding() {
      cancelPendingRemoval();
      landingScreen.hidden = false;
      landingScreen.removeAttribute('inert');
      landingScreen.classList.remove('hidden');
      landingScreen.setAttribute('aria-hidden', 'false');
      gameContainer.classList.remove('active');
      gameContainer.setAttribute('aria-hidden', 'true');
    }

    return { enterGame, showLanding };
  }

  return { createShellController };
}));
