# FreeLobby AI Handoff

> Updated: 2026-07-07
> Stack: Node.js + Express + Socket.IO + Phaser 3
> Current focus: stabilization complete, visual refresh next

FreeLobby is a no-login browser hangout for low-pressure anonymous presence. The core promise is consent-first: users can share space non-verbally, but names and text are gated by mutual Vibe Check.

## Current Architecture

- `server/index.js` owns in-memory rooms, player state, Socket.IO events, furniture validation, Vibe Check routing, ambient track state, and common-room bootstrap.
- `server/room-state.js` contains testable room-state helpers:
  - `findJoinableRoom(rooms, options)` chooses only random/public non-common rooms for matchmaking.
  - `createPendingVibeChecks()` tracks request/response state so a response cannot reveal names unless the target received a pending prompt.
- `public/index.html` is the DOM shell and HUD.
- `public/css/style.css` owns landing, HUD, panel, mobile, accessibility, and visual styling.
- `public/js/game.js` owns Phaser rendering, movement, room UI, Socket.IO client handling, furniture rendering, cards, emotes, signs, audio, and sequencer.
- `public/js/idle-state.js` contains testable idle/sit state helpers used by `game.js`.
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

## Movement / Idle Details

The old idle animation used one global `isLocalSitting` flag inside shared `sitDown()` / `standUp()` helpers. Those helpers were also called for remote players, so remote movement could reset local sitting state. Because `sitDown()` tweened `sprite.y + 10`, the local player could repeatedly drift downward while idle and bypass Arcade physics collision.

Current rules:

- Local idle state lives in `localIdleState`.
- Each remote player gets its own `idleState`.
- `sitDown()` and `standUp()` apply only visual `scaleY` tweens.
- Never tween a physics-controlled player's `x` or `y` for idle animation.
- If a future visual needs a vertical offset, apply it to a non-physics child/overlay, not the physics body.

## Verification

Run these before claiming changes are good:

```bash
node --check server/index.js
node --check public/js/idle-state.js
node --check public/js/game.js
node --test tests/*.test.js
```

For browser smoke:

- Landing at 1280x720 should show the title and allow scrolling to all controls.
- Enter The Lobby should still join a common room.
- Go to a Random Room should create/join a random room ID, not show a common room name.
- A private room owner should see Build, Ambience, and Music controls.
- Idle for 5 seconds should squash the avatar without changing its map position.

## Docs To Keep Current

- Update `README.md` for user-facing feature changes.
- Update `ASSETS.md` when asset inventory, file names, sizes, or tinting rules change.
- Update `DesignDoc` when product behavior or safety architecture changes.
- Update this file whenever code behavior changes in a meaningful way.

## Good Next Step

The code is now in a better state for a look-and-feel pass. Start with the landing/HUD visual system and keep the consent and room taxonomy intact.
