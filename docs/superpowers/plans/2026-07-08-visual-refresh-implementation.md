# Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the first FreeLobby look-and-feel pass from the local visual audit while preserving all existing room, consent, movement, build, audio, and Vibe Check behavior.

**Architecture:** Keep the existing vanilla HTML/CSS/Phaser structure. Recompose the visible overlay system through CSS-first landing, HUD, and dock treatment; use small JS helpers for icon refresh, bookmark states, and Phaser room theme tinting.

**Tech Stack:** Node.js, Express, Socket.IO, Phaser 3, vanilla JavaScript, CSS, Lucide browser icons from CDN.

---

### Task 1: Landing And Shell

**Files:**
- Modify: `public/index.html`
- Modify: `public/css/style.css`

- [x] Rework the landing presentation into a left identity/entry rail plus a right room-selection panel while keeping the existing DOM wiring stable.
- [x] Keep existing IDs (`player-name`, `btn-enter`, `common-rooms`, `btn-create`, `btn-join`, `room-code-input`, avatar controls) so current JS listeners continue to work.
- [x] Add CSS for stable desktop and mobile layout, reducing the old single-card scroll problem.

### Task 2: HUD, Dock, And Panels

**Files:**
- Modify: `public/index.html`
- Modify: `public/css/style.css`
- Modify: `public/js/game.js`

- [x] Visually group room status, player count, connection, Back, Flee, Quiet, and Build into one top HUD system.
- [x] Visually group emotes, sign input, music, and support into a bottom dock.
- [x] Restyle furniture, ambience, music, Vibe Check, and toast surfaces around shared panel/button patterns.
- [x] Preserve all visible class toggles used by `game.js`.

### Task 3: Icons And Common-Room Mood

**Files:**
- Modify: `public/index.html`
- Modify: `public/js/game.js`
- Modify: `server/index.js`

- [x] Add Lucide icons for controls where a real icon is clearer than a text glyph.
- [x] Keep emoji only where they are actual emote content or avatar accessory choices.
- [x] Give The Lobby, Zen Garden, and The Library distinct theme ids.
- [x] Apply theme-specific floor, wall, camera, and furniture tinting in the Phaser scene.

### Task 4: Docs And Verification

**Files:**
- Modify: `README.md`
- Modify: `AI.MD`
- Create: `docs/superpowers/plans/2026-07-08-visual-refresh-implementation.md`

- [x] Document the visual refresh state for users and future agents.
- [x] Run syntax checks and test suite:
  - `node --check server/index.js`
  - `node --check public/js/idle-state.js`
  - `node --check public/js/game.js`
  - `npm test`
- [x] Run browser smoke on desktop and mobile viewports before commit.
