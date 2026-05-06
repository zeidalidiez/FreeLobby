# FreeLobby — Work In Progress (Phase 3.5 Hardening)

> **Project:** FreeLobby  
> **Repo:** https://github.com/zeidalidiez/FreeLobby  
> **Stack:** Node.js + Express + Socket.IO + Phaser 3  
> **Updated:** 2026-05-06  
> **Owner:** Zeid  
> **Coding agent:** Kimi K2.6 via opencode

---

## 0. Read this first

This document is a focused punch-list of fixes between Phase 3 (shipped) and Phase 4 (presence enrichment, not started). Do these tasks **in the order listed**. They've been prioritized by a strategic review and are designed to harden the existing surface before new features layer on top.

**Hard rules from `AI.MD §4 (Safety & Consent Architecture)` are non-negotiable.** If any task below seems to require violating them — global chat, message bypassing the Vibe Check pair gate, user-uploaded sprites, broken silent-rejection, etc. — stop and flag it. Do not ship.

**Locked-in room taxonomy (governs Tasks 7 and 9):**

| Room type | Owner | User decoration | Matchmaker | Discovery |
|-----------|-------|-----------------|------------|-----------|
| **Common** | None (server) | None — Phase 5a, not in this WIP | No | Browse list (Phase 5a) |
| **Random** | None | None — always empty | Yes | Random join only |
| **Private** | The creator | Owner-only build mode, Memory-Card-savable | No | Code only |

The structural rule: **decoration requires individual ownership; only private rooms have an individual owner; therefore only private rooms allow user-placed furniture.**

**Three design lenses (every new feature must pass ALL three):**

1. **Verbal vs. non-verbal wall (Lens 1, the most fundamental):** The Vibe Check is the wall between *verbal/textual* (gated, only between consented pairs — Signs) and *non-verbal* (open to all — emotes, sounds, music, lights, room reactions, animations). Any text-shaped feature visible outside a Vibe-Checked pair is a violation, regardless of length. *Length doesn't matter; category matters.*

2. **Summons vs. information (Lens 2):** Notifications that demand a decision (a toast asking accept/decline) are pressure. Information that can be acted on or ignored (a Sign saying "come hang — abcd") is not. Friction is the feature.

3. **Consent doesn't generalize (Lens 3):** Consent for X does not authorize Y. A Vibe Check authorizes mutual conversation only — it doesn't authorize being moved into someone else's controlled space, being subscribed to broadcasts, or anything else. Each new dimension of trust needs its own gate.

Reconsidered features that violated these lenses (Invite to Room, Leave-a-Note) are recorded in the strategy doc under *Reconsidered features (for the record)*.

When you finish each task, update its checkbox in §3 below and append a one-line note to §6.

---

## 1. Already done (don't redo)

These were handled outside opencode and are already in the repo or are committed alongside this WIP doc. Do not reimplement.

- [x] **README cleanup** — production server IP and personal SSH key path scrubbed and replaced with `<your-server-ip>` / `<path-to-your-key>` placeholders. New `Special Thanks` section added at the bottom (Top Notch QA listed there as personal thanks, with explicit "no paid placement" line). Brief production-note paragraph added under `First-Time Server Setup` mentioning that TLS lives at a reverse proxy.

---

## 2. Out of scope for this WIP

To avoid drift, do **not** start any of these in this pass — they belong to later phases:

- Phase 4 (the room as instrument): interactive ambient objects (lights, minibars, bells, record players, lava lamps), sit/idle animations, Quiet Mode (avatar semi-transparent, auto-decline Vibe Checks), shared ambient audio, light music maker (4×4 sequencer). NOTE: "Leave a Note" was reconsidered and dropped — text visible outside a Vibe-Checked pair breaches Lens 1 regardless of length.
- Phase 5: Common Rooms (server-curated themed rooms — The Lobby / Zen Garden / Library), Room Bookmarks, mobile pass, accessibility
- Docker / containerization (separate WIP coming)
- Federation, multi-instance discovery, contributor governance docs

---

## 3. Task list (COMPLETED)

- [x] Task 1 — Remove Top Notch QA sponsor block
- [x] Task 2 — Add MIT LICENSE file
- [x] Task 3 — Fix furniture limit string (interpolated `MAX_FURNITURE`)
- [x] Task 4 — Server-side name sanitization (`sanitizeName()`)
- [x] Task 5 — Per-room emote rate cap (30/sec silent drop)
- [x] Task 6 — Mute Stranger N toggle (client-side, session-only)
- [x] Task 7 — Build mode restricted to private rooms only
- [x] Task 8 — Invite to Room (PAUSED — consent concern)
- [x] Task 9 — Flee Button creates private room
- [x] Task 10 — Fix `.vscode/launch.json` port (8080 → 3000)

---

## 3. Task list (do in order) [ARCHIVED]

### Task 1 — Remove the Top Notch QA sponsor block from the love modal

**What:** Delete the sponsor block currently embedded inside the "Made with Love" modal. Top Notch QA has been moved to a `Special Thanks` section in the README; the in-product placement is being retired to keep the project's anti-commercial positioning honest.

**Where:** `public/index.html`, lines 238–244 (between the closing `<p class="love-modal-thanks">` tag on line 237 and the closing `</div>` of `.love-modal` on line 245). The exact block to remove:

```html
      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
        <p style="font-size: 0.85rem; color: #a1a1aa; margin-bottom: 10px;">Looking for the world's best QA team? Consider <a href="https://topnotchqa.com" target="_blank" style="color: #fff; text-decoration: none;">Top Notch QA</a></p>
        <a href="https://topnotchqa.com" target="_blank">
          <img src="https://topnotchqa.com/wp-content/uploads/2018/05/tn-logo-small-white.png" alt="Top Notch QA Logo" style="height: 35px; opacity: 0.9;">
        </a>
      </div>
```

Plus the blank line above it (line 238).

**Acceptance:**
- The love modal no longer contains the QA block, the QA logo image, or any reference to topnotchqa.com.
- The rest of the modal (heart icon, title, support copy, Ko-fi link, "Thank you for being here" line) is unchanged.
- No broken layout: trailing whitespace cleaned, no orphan `<div>`s.
- Verify by clicking the heart icon in the running game — modal opens, no sponsor block visible.

---

### Task 2 — Add a `LICENSE` file (MIT)

**What:** The README and `package.json` declare MIT, but there is no `LICENSE` file in the repo root. GitHub doesn't recognize the license without it (no license badge in the repo sidebar). FOSS scanners flag the repo as unlicensed.

**Where:** Create `/LICENSE` at repo root.

**Acceptance:**
- File contains the standard MIT License text with copyright `Copyright (c) 2026 Zeid Diez` (adjust year/name as preferred).
- After commit + push, GitHub displays "MIT License" in the repo sidebar.

**Reference text:** https://opensource.org/license/mit/ — copy the canonical block, fill in the year and copyright holder line.

---

### Task 3 — Fix the furniture-limit error string

**What:** Server emits an error message saying the furniture limit is `20`, but the actual `MAX_FURNITURE` constant is `100`. Stale string left over from an earlier limit. Players currently see a wrong number in the error toast.

**Where:** `server/index.js`. Search for the string `Room furniture limit reached (20)` and replace with `Room furniture limit reached (100)` — or, better, interpolate the constant so this can't drift again: `` `Room furniture limit reached (${MAX_FURNITURE}).` ``.

**Acceptance:**
- No string in the server file mentions `(20)` as a furniture cap.
- If you place 101+ furniture items, the error toast shows `(100)` (or the current `MAX_FURNITURE` value).

---

### Task 4 — Server-side name sanitization

**What:** The 24-character player-name limit is enforced only via the HTML `<input maxlength>` attribute on the landing page. A custom Socket.IO client could send any string. Currently safe because Phaser renders names to canvas (not DOM), but this is a footgun for any future feature that touches the DOM.

**Where:** `server/index.js`, in the handler where the player provides their name on join (search for where `playerData.name` is first assigned from the socket payload).

**Implementation:**
```js
function sanitizeName(raw) {
  if (typeof raw !== 'string') return 'Anon';
  // Strip control characters and zero-width characters, then clip to 24.
  const cleaned = raw
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\uFEFF]/g, '')
    .trim()
    .slice(0, 24);
  return cleaned.length > 0 ? cleaned : 'Anon';
}
```

Apply `sanitizeName(payload.name)` before storing.

**Acceptance:**
- A custom client sending a 1000-character name results in a stored name of 24 chars max.
- A client sending control characters, zero-width spaces, or BOM gets them stripped server-side.
- Empty / non-string input falls back to `'Anon'` rather than crashing or accepting garbage.
- Existing players with valid names see no behavior change.

---

### Task 5 — Per-room emote rate cap

**What:** Emotes are room-broadcast and gated only by a per-user 500ms rate limit. A determined user (or a botted client) can still flood a room with emotes at 2/second, and there's no remedy beyond Flee. Add a per-room aggregate cap so a single bad actor can't dominate the visual channel.

**Design:**
- Track per-room emote count in a sliding 1-second window.
- Cap at e.g. **30 emotes per room per second** total (across all users in the room).
- When the cap is exceeded, **silently drop** further emotes for the rest of that window. Do not notify anyone — silent dropping is consistent with the "silent rejection" posture.
- The 500ms per-user rate limit stays in place. This is an additional layer, not a replacement.

**Where:** `server/index.js`, in the `sendEmote` handler.

**Implementation sketch:**
```js
// Add to room state:
// room.emoteWindow = { startMs: 0, count: 0 };

const ROOM_EMOTE_CAP_PER_SEC = 30;
const now = Date.now();
if (now - room.emoteWindow.startMs > 1000) {
  room.emoteWindow.startMs = now;
  room.emoteWindow.count = 0;
}
if (room.emoteWindow.count >= ROOM_EMOTE_CAP_PER_SEC) {
  return; // silent drop
}
room.emoteWindow.count += 1;
// existing broadcast logic continues
```

**Acceptance:**
- With 1 normal user emoting, behavior is unchanged.
- With a scripted client trying to flood emotes, the room never displays more than ~30 emotes/sec total.
- The flooding client gets no error and no notification — emotes simply stop appearing.
- Tune the cap value with a comment if you find 30 too tight or too loose at low player counts.

---

### Task 6 — "Mute Stranger N" personal toggle

**What:** A user-side option to silently hide all emotes (and any future ungated signals) coming from a specific stranger. Architecture-consistent with silent rejection: opt-in, no notification to the muted party, reversible.

**Design:**
- Right-click (or long-press on touch) on a stranger's avatar → context menu adds a "Mute" option (alongside the existing "Vibe Check" option).
- Mute state is stored client-side only in the Phaser scene's player object. **It does not need to be sent to the server.** The client filters incoming `playerEmote` (and similar) events for muted player IDs and ignores them.
- Mute persists for the current session only. Disconnect = mute clears. Match the project's ephemeral posture.
- An "Unmute" option appears when right-clicking an already-muted stranger.
- Muted strangers' avatars render normally — no visual indication. Silent.

**Where:** `public/js/game.js` — wherever the avatar context menu is built and wherever incoming emote events are handled.

**Acceptance:**
- Muting Stranger 2 → their emotes stop appearing for me.
- They see no notification, no greyed avatar, nothing.
- I can still see Stranger 2's movement, sit/idle state, name (if Vibe-Checked), etc. — only the ungated signal channels (emotes, future notes) are filtered.
- Refreshing the page or rejoining the room clears all mutes.
- Ideally, a future Vibe Check from a muted player still arrives normally (mute applies to ungated channels, not the consent channel itself).

---

### Task 7 — Restrict build mode to private rooms only

**What:** Decouple ownership and build-mode from random rooms. Today, when someone clicks "Create Public Room" or first lands in an auto-created random room, they become `ownerId` and get build-mode access. Under the locked-in room taxonomy, **only private rooms have owners and only private rooms allow decoration.** Random rooms become genuinely empty default boxes.

**Why:** Cleaner architectural model: "decoration requires individual ownership; only private rooms have an individual owner; therefore only private rooms allow user-placed furniture." Eliminates a small abuse surface (a bad actor placing hostile/intimidating furniture and waiting for randoms to land in the room). Lets random rooms be genuinely public meeting spots without the ambient expectation of "whose space is this."

**Where:**

`server/index.js`:
- **`createRoom` handler** — when `isPublic !== false`, set `ownerId: null` (currently sets `ownerId: socket.id` unconditionally). The path from "Create Public Room" should produce a no-owner room.
- **`joinRandomRoom` auto-create branch** — set `ownerId: null` (currently sets `ownerId: socket.id`).
- **All furniture event handlers** — `addFurniture`, `removeFurniture`, theme changes, anything that mutates room layout — guard with `if (room.isPublic) return;` (silent drop, no error to client). This is server-authoritative: even a custom Socket.IO client cannot cause furniture mutation in a public/random room.
- **Joined-event payload** — when emitting `joinedRoom` / similar, ensure `isOwner` is `false` whenever `ownerId === null`. Should already be true via `room.ownerId === socket.id` returning false, but verify.

`public/js/game.js`:
- When the joined event indicates `isPublic: true` (or `isOwner: false`), **hide the build-mode entry/UI entirely**. The build palette button should not appear at all in random rooms — not even greyed out.
- **Memory Card download/upload UI** — also hidden in non-private rooms (no layout to save, no layout to load into).

`public/index.html` (landing page):
- The "Create Room" path should default to creating a **private** room. If there's currently a public/private toggle on creation, replace it: the `Create` action always produces a private room with an owner. Public rooms are no longer user-creatable — they only come into existence via the `joinRandomRoom` auto-create path.
- Update copy / button labels to match: `Create Private Room` is clearer than `Create Room`.

**Acceptance:**
- Creating a private room → owner can build, guests cannot, Memory Card works (current behavior preserved for the private flow).
- Joining a random room (via "Join Random") → no one can build. No build-mode button visible. No "you are owner" indicator.
- Server silently rejects furniture events from any client when `room.isPublic` is true. An attempted `addFurniture` via a custom Socket.IO client in a random room produces no state change on the server and no other clients see anything.
- Auto-created random rooms (when the matchmaker has no available rooms) have `ownerId: null`. The first arrival is just a guest — they cannot build, and a second arrival has equivalent permissions.
- Existing live behavior preserved: random rooms still match-make correctly, private rooms still get codes, Vibe Check still works in both.

**Notes for Kimi:**
- This is the largest task in the WIP. Do it as one logical commit.
- Coordinates with Task 9 (Flee → private). Once both ship, the only paths to a buildable room are *Create Private Room* or *Flee*. Random rooms are permanently empty.
- The strategy doc (Co-Founder Strategy Brief, "Room Taxonomy" section) is the canonical reference for the room model.

---

### Task 8 — ~~Phase 3 closeout: "Invite to Room" via Vibe Check context menu~~ **PAUSED**

**Status:** Punted. The user (Zeid) is second-guessing whether this fits the consent ethos. 

**Concern:** Even with the Vibe Check gate, an "Invite to Room" creates a coercion vector — someone who feels social pressure to accept a Vibe Check may then feel pressured to enter a private space they don't control. The Vibe Check unlocks *conversation*, not *proximity in a controlled environment*. 

**Decision:** Do not implement unless a safer design emerges (e.g., opt-in room discovery where users browse available rooms voluntarily, rather than receiving direct invites).

---

### Task 9 — Flee Button privacy default

**What:** When a user clicks Flee, the new room they land in defaults to **private** (`isPublic: false`) so the random matchmaker can never drop strangers into their escape. The fleer becomes the owner of their new private retreat — they can build there, share the code, or just sit alone.

**Why:** The Flee Button is a panic button. Panic buttons should default to the safer state without making the user think or click again. Today, fled-into rooms are `isPublic: true` which means the random matchmaker can place new strangers into the fleer's "escape" space silently. This undoes the flee.

This decision falls out structurally from the locked-in room taxonomy: there are exactly three room types, and only Private fits the semantics of Flee.

**Where:** `server/index.js`, in the `fleeRoom` handler. Around line 245.

**Implementation:** Change the room creation to:
```js
rooms.set(roomId, {
  players: new Map(),
  revealedPairs: new Set(),
  ownerId: socket.id,        // fleer is owner of their private retreat
  isPublic: false,           // not in matchmaker pool — invisible to random join
  furniture: [],
  occupiedCells: new Set(),
  blockedCells: new Set(),
  theme: 0
});
```

The `socket.emit('joinedRoom', { ... isPublic: false, isOwner: true ... })` payload should naturally reflect this. Verify the client UI shows the room as private (no "Public" indicator), the fleer has access to build mode (consistent with Task 7 — they own a private room, so they can build).

**Acceptance:**
- After Flee, the user is alone in the new room.
- They are the owner (build palette appears for them — consistent with Task 7's private-rooms-only build rule).
- If a different user clicks "Join Random Room" while the fleer is alone in their fled-into room, the matchmaker does NOT drop the random user into the fleer's room. Verify by opening a second browser tab and clicking Join Random — should not match into the fleer's room.
- The fleer can flip the room to public via room settings if such a toggle exists (current behavior preserved if it does; not a new requirement).
- No regression in Flee's existing UX: button is still always available, transition is fast, old room is properly cleaned up.

---

### Task 10 — Bonus: fix `.vscode/launch.json` port

**What:** The Chrome debugger config points at `localhost:8080`, but the server runs on port 3000. Cosmetic dev-tooling inconsistency that would confuse a new contributor.

**Where:** `.vscode/launch.json`.

**Acceptance:** Replace `8080` with `3000`. Verify by running the game locally and clicking the VS Code "Debug" entry — the browser opens to the actual app, not a 404.

---

## 4. Done definition (whole WIP)

- All required tasks (1–9) green-checked, plus Task 10 if you want the cosmetic fix.
- Local manual smoke test:
  - Open two browser tabs as two players.
  - Both can see each other.
  - Vibe Check accept / silent decline still works.
  - Emote spam from one client gets dropped after the cap.
  - Mute toggle hides emotes for the muting client only.
  - Creating a private room → owner can build. Joining a random room → no one can build, no build UI.
  - Fleeing → new room is private, fleer is alone, second tab's "Join Random" does not match in.
  - Invite (after mutual Vibe Check, from inviter's private room) moves the invitee correctly.
- README looks correct on GitHub (license badge present, no IP address visible).
- Git push, `pm2 restart freelobby` on the live server, verify `https://freelobby.zeiddiez.com/` still loads.
- Tag this milestone as `v0.4.0`.

---

## 5. Notes for Kimi

- This is a **single-purpose hardening pass.** Resist the temptation to refactor `game.js` into modules during this WIP — that's a Phase 5/6 concern. Keep changes surgical.
- All consent-architecture rules in `AI.MD §4` apply. If a task seems to require relaxing them, stop.
- The locked-in room taxonomy (top of this doc + strategy brief) governs Tasks 7 and 9. If you find code that contradicts the taxonomy outside those tasks, note it in §6 — don't auto-expand scope.
- Prefer small commits per task with the task number in the subject line, e.g. `WIP §3.4: server-side name sanitization`.
- If you discover something else broken while doing one of these tasks, **note it at the bottom of this file** under §6 — don't auto-expand scope.

---

## 6. Completion log

- Task 1 done. Sponsor block removed from love modal. Modal renders cleanly.
- Task 2 done. MIT LICENSE file created at repo root.
- Task 3 done. Furniture limit string now interpolates `MAX_FURNITURE` (currently 100).
- Task 4 done. `sanitizeName()` strips control chars, zero-width spaces, BOM; clips to 24 chars; falls back to 'Anon'.
- Task 5 done. Per-room emote sliding window cap: 30/sec. Silent drop when exceeded.
- Task 6 done. Mute toggle in vibe-action popup. Client-side only, session-only. Filters `playerEmote` events.
- Task 7 done. Build mode and Memory Cards restricted to private rooms. Random rooms have `ownerId: null`.
- Task 8 PAUSED. Invite to Room feature punted due to consent/coercion concerns.
- Task 9 done. Flee Button now creates a private room (`isPublic: false`, owner = fleer).
- Task 10 done. VS Code launch.json port corrected: 8080 → 3000.
