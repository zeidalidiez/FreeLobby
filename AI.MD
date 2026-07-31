# FreeLobby AI Handoff

> Updated: 2026-07-30
> Stack: Node.js + Express + Socket.IO + Phaser 3
> Current focus: CC0 craft-material rendering is implemented; preserve the compositor contract while extending it

FreeLobby is a no-login browser hangout for low-pressure anonymous presence. The core promise is consent-first: users can share space non-verbally, but names and text are gated by mutual Vibe Check.

## Current Architecture

- `server/index.js` owns in-memory rooms, player state, Socket.IO events, furniture validation, Vibe Check routing, ambient track state, and common-room bootstrap.
- `server/room-state.js` contains testable room-state helpers:
  - `findJoinableRoom(rooms, options)` chooses only random/public non-common rooms for matchmaking.
  - `createPendingVibeChecks()` tracks request/response state so a response cannot reveal names unless the target received a pending prompt.
  - Movement, emote, sign, reveal-cleanup, and room-switch hardening helpers used by `server/index.js`.
- `public/index.html` is the DOM shell and HUD.
- `public/css/style.css` owns landing, HUD, panel, mobile, accessibility, and visual styling.
- `public/js/game.js` owns Phaser rendering, movement, room UI, Socket.IO client handling, furniture rendering, cards, emotes, signs, audio, and sequencer.
- `public/js/idle-state.js` contains testable idle/sit state helpers used by `game.js`.
- `public/js/craft-textures.js` loads seven self-hosted CC0 material scans and composes floors, walls, avatars, accessories, all 20 furniture/pet types, interactive states, build previews, and Memory Card art as layered Phaser textures. Its manifest and key contracts are unit-tested.
- `public/assets/materials/materials.json` is the canonical license, provenance, source-checksum, and checked-in-hash inventory for the craft scans.
- `public/js/card-codec.js` owns the tested pixel-row Memory Card format, including theme, layout, rotation/layer metadata, and lamp/TV on-state.
- `public/js/shell-state.js` owns the tested landing/game visibility transition, including `hidden`, `inert`, and `aria-hidden` state.
- `tests/*.test.js` uses Node's built-in test runner. Run `node --test tests/*.test.js`.

There is still no database. Common rooms persist in memory for the life of the server process. Random and private rooms are deleted when empty.

## Non-Negotiable Consent Rules

1. No global chat and no room chat.
2. Text-shaped communication visible to another user requires an accepted Vibe Check pair.
3. Declines and Quiet Mode auto-declines stay silent.
4. Consent for a Vibe Check means mutual name/text reveal only. It does not imply room movement, invites, broadcasts, or other trust.
5. User-uploaded gameplay assets remain out of scope.

## Room Taxonomy

| Type | Owner | Matchmaker | Discovery | Decoration |
| ---- | ----- | ---------- | --------- | ---------- |
| Common | Server | No | Common room list / default lobby | Curated server furniture only |
| Random | None | Yes | "Go to a Random Room" | None |
| Private | Creator | No | Room code / bookmarks | Owner-only build mode and Memory Cards |

Important: common rooms are public in the broad sense, but they are not random-matchmaker targets. `findJoinableRoom()` must continue to exclude `room.isCommon`.

## Latest Stabilization Changes

- Added `server/room-state.js` and regression tests for matchmaking and pending Vibe Check state.
- Fixed random matchmaking so "Go to a Random Room" no longer sends users into The Lobby, Zen Garden, or The Library.
- Added pending Vibe Check tracking. A custom client can no longer emit `vibeCheckRespond` to force a name reveal without a matching pending request.
- Added `public/js/idle-state.js` and regression tests for independent idle state.
- Fixed the sliding idle bug by removing global cross-player sitting state and stopping sit/stand animation from tweening the physics sprite's `y` position.
- Added `public/js/idle-state.js` to `public/index.html` before `game.js`.
- Added `npm test` as `node --test tests/*.test.js`.
- Fixed landing layout clipping by allowing the fixed landing screen to scroll vertically when the card is taller than the viewport.
- Hardened server-side room events with tested helpers in `server/room-state.js`:
  - `normalizePlayerMove()` rejects non-finite coordinates, clamps player positions to room bounds, and rejects target positions inside blocked furniture cells.
  - `isAllowedEmote()` restricts custom clients to the approved emote palette from the UI.
  - `sanitizeSignText()` strips control/zero-width characters, trims whitespace, and limits signs to 10 Unicode code points.
  - `clearRevealedPairsForPlayer()` removes Vibe Check reveal state by exact socket id instead of substring matching.
  - `shouldLeaveRoomBeforeJoin()` keeps successful room transitions from leaving a socket joined to an old room.

## Latest Visual Refresh Changes

- Replaced the neon sprite pipeline with a reusable handmade/DIY material system. The runtime clips recolored CC0 denim, linen, cotton, fleece, hessian, corduroy, and board scans into independently editable shape layers.
- `craft-textures.js` owns four semantic palettes and the rendering recipes. Preserve the separation between source material, geometry, palette, and edge/seam treatment.
- All 20 furniture/pet entries are recognizable object recipes rather than abstract stand-ins. Their server ids, footprints, collision rules, and Memory Card encoding did not change.
- Avatars are 48-pixel fabric patches with faces and accessory overlays, keeping them visually distinct from furniture while sharing its material grammar.
- The build palette uses data URLs made from the exact installed furniture textures, so previews cannot drift from in-room art.
- Floors use material grain with a low-contrast stitched placement grid; walls use layered textile/board tiles. `applyRoomVisualTheme()` swaps generated floor, wall, furniture, and interactive textures instead of tinting old PNGs.
- The landing, in-room HUD, owner tools, and export card use cloth grain, warm structural borders, and stitch details without changing the DOM or event wiring.
- Existing `.visible` class toggles still drive whether controls render; do not replace those toggles without checking every caller in `public/js/game.js`.
- Added Lucide icons through `public/index.html`. `installInterfaceIcons()`, `setIconButtonContent()`, and `setBookmarkButtonState()` in `public/js/game.js` rewrite icon button contents and refresh Lucide after state changes.
- For icon-managed buttons, avoid direct `textContent` updates. Use `setIconButtonContent(button, icon, label, fallback)` so the SVG icon, fallback glyph, and accessible text stay in sync.
- Room visual theme metadata in `ROOM_THEME_VISUALS` maps theme `0` to lobby/teal, `1` to garden/green, `2` to library/plum, and `3` to private/blue.
- `server/index.js` now assigns distinct theme ids to the common rooms: `LOBBY` -> `0`, `GARDEN` -> `1`, `LIBRARY` -> `2`.
- The mobile refresh keeps the private-room Music button reachable above the emote control. Do not hide `.music-btn` globally on mobile; private rooms depend on it.
- Disabled sign input copy is intentionally short (`Vibe Check required`) so it fits inside the mobile bottom dock.

## Repository Stabilization Pass

- Browser dependencies are pinned in `package.json` and served through exact `/vendor/*` routes. Normal page load no longer contacts Google Fonts, unpkg, jsDelivr, or cdn.socket.io.
- Express is pinned to 4.22.2 and `ws` is overridden to 8.21.0, the compatible patched release used by both server and browser Socket.IO trees. As of 2026-07-30, `npm audit --omit=dev` separately flags the transitive Engine.IO polling-exhaustion advisory; keep dependency remediation distinct from visual-system work.
- Socket.IO limits messages to 32KB and disables per-message deflate. Every state-changing event that expects an object is rejected at socket middleware when it receives `null`, an array, or another malformed envelope.
- `normalizeCustomization()` and `normalizeFurnitureItem()` are the canonical trust-boundary helpers. Furniture types, integer coordinates, rotations, optional layers, and interactive flags must be valid before room state changes.
- `createRateLimiter()` provides per-socket event windows. Room changes/lists, movement, furniture editing, toggles, and imports are bounded; the existing emote, sign, and Vibe Check cooldowns remain in place.
- Room creation at the server cap now accounts for whether the player's current non-common room will be deleted. `fleeRoom` can no longer grow the room map beyond `MAX_ROOMS`.
- Pending Vibe Checks expire after the same 15-second window used by the client prompt, so dismissed requests cannot be accepted later by a custom client.
- Idle expiry removes the player from the room and emits `idleTimeout`; it does not server-disconnect the socket. The client returns to landing and can immediately re-enter.
- Security headers set CSP, no-referrer, no-sniff, no-framing, and deny camera/microphone/geolocation. HTML/CSS/JS use revalidation; furniture assets cache for one day; pinned vendor files are immutable for one day.
- Room Memory Cards now encode lamp/TV on-state in the second metadata pixel. The server reconstructs `interactiveStates`, and `roomFurnitureReset` sends and applies those states.
- Furniture reset destroys glow objects as well as sprites, closing the prior visual/object leak.
- Landing cards are non-shrinking and scroll cleanly at 1280x720. Mobile furniture/music panels sit above ambience instead of overlapping it.
- Common/public room cards, bookmark joins, and sequencer cells are real buttons. Bookmarks use `sessionStorage`, visible dialogs synchronize `aria-hidden`, owner ambience controls use real disabled state, and browser zoom is no longer disabled.
- Music and Build panels are mutually exclusive. The `M` shortcut is ignored outside private rooms.
- The former 256px furniture/pet PNGs and matte-normalization compatibility module were removed. Do not restore that parallel pipeline; extend the craft recipes or audited material inventory instead.
- `tests/socket-integration.test.js` starts the real server and uses two Socket.IO clients to prove malformed payload rejection, invalid furniture rejection, and consent-gated sign delivery.
- `.github/workflows/ci.yml` runs syntax checks and the full suite on Node.js 20 and 22 for every pull request and push to `main`.
- Room entry now makes the fading landing screen inert immediately and applies the semantic `hidden` state after its 600ms transition. Returning cancels pending removal, restores the landing screen, and hides the game application from assistive technology.
- The HTTP integration test requests Lucide, Phaser, and Socket.IO vendor bundles. This guards the exact deep-package paths used at startup; Lucide 1.24.0 publishes `dist/umd/lucide.min.js` and the route returns 200.

## Movement / Idle Details

The old idle animation used one global `isLocalSitting` flag inside shared `sitDown()` / `standUp()` helpers. Those helpers were also called for remote players, so remote movement could reset local sitting state. Because `sitDown()` tweened `sprite.y + 10`, the local player could repeatedly drift downward while idle and bypass Arcade physics collision.

Current rules:

- Local idle state lives in `localIdleState`.
- Each remote player gets its own `idleState`.
- `sitDown()` and `standUp()` apply only visual `scaleY` tweens.
- Never tween a physics-controlled player's `x` or `y` for idle animation.
- If a future visual needs a vertical offset, apply it to a non-physics child/overlay, not the physics body.

Server movement rules:

- The server is not a full pathfinding authority, but it now rejects malformed movement and target positions inside blocked furniture cells.
- Client movement should still use Phaser Arcade collision for feel, but do not remove server-side `normalizePlayerMove()` checks unless replacing them with stronger authoritative movement.
- Room changes should go through `joinPlayerToRoom()` so sockets leave their previous room before joining a different one.

## Verification

Run these before claiming changes are good:

```bash
node --check server/index.js
node --check public/js/idle-state.js
node --check public/js/craft-textures.js
node --check public/js/card-codec.js
node --check public/js/shell-state.js
node --check public/js/game.js
node --test tests/*.test.js
npm audit --omit=dev
```

On Windows PowerShell, `npm test` may be blocked by the `npm.ps1` execution policy. Use `npm.cmd test` when that happens.

For browser smoke:

- Landing at 1280x720 should show the title and allow scrolling to all controls.
- Enter The Lobby should still join a common room.
- Go to a Random Room should create/join a random room ID, not show a common room name.
- A private room owner should see Build, Ambience, and Music controls.
- Idle for 5 seconds should squash the avatar without changing its map position.
- On 390x844, Build/Music panels must not overlap the ambience or sign controls.
- Common-room `M` must not open the sequencer; private-room Music must set `aria-hidden="false"` while open.
- Reloading the landing page in the same tab must retain session bookmarks.
- After a room join and the 600ms fade, `#landing-screen` must compute to `display: none`, remain inert/`aria-hidden`, and `#game-container` must compute to `display: block`.
- Chromium may emit `GPU stall due to ReadPixels` only while the test harness captures the WebGL canvas. Treat that specific screenshot-time message as a headless capture artifact; the app has no `readPixels` call. Continue failing smoke tests on every other console warning or error.

## Visual Refresh Audit

A local screenshot-backed audit for the next look-and-feel pass lives at:

`docs/visual-audit/2026-07-08-visual-overhaul/visual-overhaul-audit.md`

Captured states cover desktop/mobile landing, common rooms, private rooms, emotes, build mode, music, and mobile HUD density. That audit predates the craft-material migration, but its layout, accessibility, and mobile findings still apply.

When extending the visual system:

- Preserve the consent rules and room taxonomy above.
- Extend the shared design tokens and reusable HUD/panel/button classes in `public/css/style.css` instead of adding one-off styles earlier in the file.
- Keep the landing, room HUD, and tool panels aligned with the current textured craft treatment.
- Keep Flee, Quiet Mode, and Vibe Check visually obvious.
- Do not introduce user-uploaded gameplay assets.
- Require documented CC0 sources for additional materials and update both `materials.json` and its hash tests.

## Docs To Keep Current

- Update `README.md` for user-facing feature changes.
- Update `ASSETS.md` when asset inventory, file names, sizes, or tinting rules change.
- Update `DesignDoc` when product behavior or safety architecture changes.
- Update this file whenever code behavior changes in a meaningful way.

## Good Next Step

Extend the existing recipe library with alternate material/layer combinations or
additional semantic palettes. Preserve the corrected responsive/ARIA behavior,
the stable furniture protocol, and the consent/security tests.

## Remaining System Improvement Targets

- `public/js/game.js` remains the largest risk surface. `idle-state.js`, `craft-textures.js`, and `card-codec.js` demonstrate the preferred UMD/CommonJS extraction pattern; next candidates are audio and overlay state.
- Expand Socket.IO integration coverage beyond the new consent/sign case. Good next cases are Quiet Mode auto-decline, furniture collision placement, room-cap behavior, owner disconnect, and idle-timeout readmission.
- Server-side furniture validation still lives inside `server/index.js`. If build tools expand, move furniture footprints and validation into a testable helper module.
