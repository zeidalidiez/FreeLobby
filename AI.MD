# FreeLobby — AI Living Document

> **Project:** FreeLobby  
> **Repo:** https://github.com/zeidalidiez/FreeLobby  
> **Live:** https://freelobby.zeiddiez.com/  
> **Stack:** Node.js + Express + Socket.IO + Phaser 3  
> **License:** MIT (FOSS — non-commercial ethos)  
> **Updated:** 2026-05-04

---

## 1. Core Philosophy

FreeLobby is a **safe, consent-first social space** for introverts and anyone seeking low-pressure human connection. It is explicitly *not* a commercial product. It is a public good.

- **No login, no passwords, no tracking.**
- **No one can communicate with you without your explicit consent.** The "Vibe Check" is the central gatekeeper for all text.
- **Minimalist but atmospheric.** Low-fi, procedural graphics. No user-uploaded assets (moderation nightmare).
- **Ephemeral by default.** Rooms die when empty. No persistent database required for core experience.
- **Introvert-friendly.** Lurking is a valid playstyle. Silence is not awkward here.

---

## 2. Tech Stack & Constraints

| Layer | Tech |
|-------|------|
| Frontend | Phaser 3 (Canvas/WebGL), vanilla JS, HTML/CSS overlays |
| Backend | Node.js, Express, Socket.IO |
| Hosting | Oracle Cloud Free Tier (1 vCPU, ~5GB disk, Ubuntu) |
| Process Manager | PM2 |
| Assets | **Procedural / Code-generated only.** No user uploads. Minimal static images if absolutely necessary. |

**Server Hard Limits (Current):**
- Max 50 concurrent rooms
- Max 10 players per room
- Player idle timeout: 15 minutes
- All state lives in-memory (`Map` objects). No database for core loop.

---

## 3. Visual Identity: Neon/Tron Aesthetic

The game world is a **retro-futuristic wireframe grid**.

### Palette
- **Background:** Deep black/void (`#050508` to `#0a0a10`)
- **Grid Lines:** Electric cyan/blue (`#00f0ff`, `#0088ff`) with low opacity, pulsing subtly
- **Accents:** Neon Magenta (`#ff00ff`), Lime (`#39ff14`), Hot Pink (`#ff007f`), Electric Yellow (`#ffff00`), Cyan (`#00ffff`)
- **UI:** Glassmorphism dark panels with neon borders
- **Text:** Cool whites (`#e0f7ff`), muted blues for secondary

### Player Avatars
- Procedurally drawn glowing circles or geometric shapes.
- Customizable via **safe, procedural options only** (color, glow intensity, shape variant, tiny accessories like pixel headphones or a halo — all drawn in code).
- **NO user-uploaded sprites.** This is a hard rule to prevent offensive imagery.

### Environment
- Floor is an infinite-feeling **perspective grid** or flat Tron-style tile grid.
- Walls are glowing neon barriers.
- Furniture (future) will be glowing wireframe primitives (cube, sphere, cylinder) in neon colors.

---

## 4. Safety & Consent Architecture

This is non-negotiable. Every AI working on this must preserve these mechanics.

1. **Anonymity by Default:** All players appear as "Stranger N" until a mutual Vibe Check passes.
2. **Vibe Check Gate:** All text chat (`sendSign`) is only visible between pairs who have mutually accepted a Vibe Check.
3. **Silent Rejection:** Declining a Vibe Check gives zero feedback to the requester. No guilt, no pressure.
4. **Flee Button:** One-click escape to a new, empty room. Always available.
5. **Rate Limiting:** Emotes (500ms), Signs (500ms), Vibe Checks (5s).

**Rule:** Do NOT implement global chat, room chat, or any text communication that bypasses the Vibe Check pair system.

---

## 5. Feature Roadmap

### Phase 1: Neon/Tron Visual Overhaul *(COMPLETE)*
- [x] Rewrite CSS for neon blue/cyan theme
- [x] Rewrite Phaser graphics for glowing neon avatars
- [x] Implement animated grid floor
- [x] Implement glowing neon walls
- [x] Update player color palette to neon set

### Phase 2: Character Customization *(COMPLETE)*
- [x] Pre-lobby customization panel (toggleable)
- [x] Options: Neon color swatch, Shape (Circle/Square/Diamond), Accessory (Headphones/Halo/Beanie), Glow pulse speed
- [x] Procedural sprite generation for each shape + accessory combo
- [x] **Avatar Hash:** Compact 4-char string encoding all choices (e.g., `0c10`)
- [x] Copy/paste hash UI for saving and sharing avatars
- [x] Send customization data to server so others see your avatar correctly
- [x] Subtle glow pulse animation in-game

### Phase 3: Private Rooms & Furniture *(IN PROGRESS)*
- [x] Room ownership: Creator is the owner
- [x] Room settings: Public (joinable by code/random) or Private (invite only)
- [x] Furniture system: Owner can place wireframe primitives from a palette
- [x] **Grid-based placement:** All furniture snaps to a 64px grid
- [x] **Placement limit:** 20 items per room (enforced server-side)
- [x] Procedural neon furniture rendering (8 types: Cube, Sphere, Cylinder, Pyramid, Chair, Plant, Lamp, Rug)
- [x] Owner-only build mode with place/remove tools
- [ ] **Room Hash:** Export/import UI (Base64 JSON)
- [x] All furniture unlocked for all users
- [x] Non-owners can view furniture but cannot move it
- [ ] "Invite to Room" via Vibe Check context menu

### Phase 4: Indirect Communication & Audio
- [ ] "Leave a Note": One sticky note per player per room (10 chars), visible to all, no Vibe Check needed
- [ ] Sit/Idle animations: Avatar sits down after inactivity
- [ ] Shared ambient audio: Optional toggle for very quiet cyberpunk drone/lo-fi
- [ ] Light music maker: Simple shared sequencer (e.g., 4x4 grid of notes) that plays for everyone in the room — purely indirect communication via sound

### Phase 5: Community & Polish
- [ ] Public Hub Rooms: Always-on rooms with higher caps (The Lobby, The Zen Garden)
- [ ] Room Bookmarks: `localStorage` save for favorite room codes
- [ ] Mobile optimization pass: Ensure touch controls feel native
- [ ] Accessibility: High contrast mode, reduced motion

---

## 6. Build Conventions for AI Agents

- **Minimal changes.** Do not refactor working code unless necessary. Prefer additive changes.
- **No new dependencies** without explicit user approval. Keep the bundle light.
- **No databases.** If persistence is needed, use flat files or SQLite only, and debate it first.
- **Procedural assets > Static assets.** If you need an image, draw it in Phaser's `Graphics` first.
- **Mobile-first overlays.** All HTML UI must respect `env(safe-area-inset-*)`.
- **Preserve existing Socket.IO events.** New events are fine; changing old ones requires updating both client and server.
- **Test locally** with `npm run dev` before considering a step done.

---

## 7. Furniture Developer Guide

This section explains how to add new furniture types, modify footprints, and understand the grid occupancy system.

### Overview

Furniture uses a **grid occupancy system** similar to The Sims or Habbo Hotel. Every piece of furniture occupies one or more cells on a 64px grid. Cells can be:
- **Occupied** — another furniture item cannot be placed here.
- **Blocked** — players cannot walk through here (unless the furniture is `walkable`).
- **Walkable** — players can walk through (e.g., chairs, rugs) but furniture still cannot overlap.

### Architecture

The system spans three areas: **Server validation**, **Client rendering**, and **Client physics**.

#### 1. Server: `server/index.js`

**Footprint Registry:**
```js
const FURNITURE_FOOTPRINTS = [
  { w: 1, h: 1, walkable: false }, // 0: Cube
  { w: 1, h: 1, walkable: false }, // 1: Sphere
  { w: 1, h: 1, walkable: false }, // 2: Cylinder
  { w: 1, h: 1, walkable: false }, // 3: Pyramid
  { w: 1, h: 1, walkable: true  }, // 4: Chair
  { w: 1, h: 1, walkable: false }, // 5: Plant
  { w: 1, h: 1, walkable: false }, // 6: Lamp
  { w: 2, h: 2, walkable: true  }, // 7: Rug
];
```

| Property | Type | Description |
|----------|------|-------------|
| `w` | integer | Width in grid cells |
| `h` | integer | Height in grid cells |
| `walkable` | boolean | `true` = players can walk through it |

**Rotation handling:** The footprint is automatically swapped (`w ↔ h`) when rotated 90° or 270° (`r = 1` or `r = 3`). This is handled by `getFootprint()` and `getCells()`.

**Occupancy Tracking:** Every room maintains two `Set`s:
- `room.occupiedCells` — all cells taken by furniture (prevents overlapping placement)
- `room.blockedCells` — cells that block player movement (only non-walkable furniture)

On placement, the server checks:
1. Bounds: `x + w` and `y + h` must fit inside the world.
2. Overlap: No cell in the footprint may already exist in `occupiedCells`.
3. Limit: Max 20 items per room.

On removal, all cells for that item are removed from both sets.

#### 2. Client: `public/js/game.js`

**Client Footprint Mirror:**
The client mirrors the server's footprint array in `FURNITURE_FOOTPRINTS` and `getClientFootprint()`. These **must stay in sync** with the server array.

**Texture Generation:**
In `preload()`, furniture textures are drawn procedurally using Phaser's `Graphics`.
```js
const furnGfx = this.make.graphics({ add: false });
// 0: Cube
furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9); furnGfx.strokeRect(0, 0, 64, 64);
furnGfx.generateTexture('furn-0', 64, 64);
```

**Important:** All furniture textures should be generated at **64×64 base resolution**. The renderer scales them by `(w, h)` to match the footprint. A 2×2 rug uses `sprite.setScale(2, 2)`.

**Rendering:** `renderFurnitureItem(item)` calculates the sprite position as:
```js
x = item.x * 64 + (fp.w * 64) / 2;
y = item.y * 64 + (fp.h * 64) / 2;
```

**Physics:** Non-walkable furniture sprites are added to `scene.furnitureGroup` (a Phaser `staticGroup`), which collides with the player. Walkable furniture is NOT added to the physics group.

**Build Mode Click Handler:** When the owner clicks in build mode, the client calculates the grid cell from `pointer.worldX / 64` and `pointer.worldY / 64`. For removal, it finds any furniture whose footprint contains the clicked cell.

#### 3. UI: `public/index.html` & `public/css/style.css`

The build palette is generated dynamically in JavaScript. To add a new furniture button to the palette, push a new icon to `FURNITURE_ICONS` and name to `FURNITURE_NAMES`.

### How to Add a New Furniture Type

**Step 1 — Server footprint:**
Add a new entry to `FURNITURE_FOOTPRINTS` in `server/index.js`:
```js
{ w: 2, h: 1, walkable: false }, // 8: Neon Sofa
```

**Step 2 — Client footprint:**
Mirror it in `public/js/game.js` inside `FURNITURE_FOOTPRINTS` at the same index.

**Step 3 — Texture:**
In `preload()`, draw the new texture:
```js
// 8: Sofa
furnGfx.clear(); furnGfx.lineStyle(2, 0xffffff, 0.9);
furnGfx.strokeRect(0, 8, 64, 48); furnGfx.lineBetween(32, 8, 32, 56);
furnGfx.generateTexture('furn-8', 64, 64);
```

**Step 4 — UI palette:**
Add an icon and name:
```js
const FURNITURE_NAMES = ['Cube', ..., 'Rug', 'Sofa'];
const FURNITURE_ICONS = ['🟦', ..., '🟩', '🛋️'];
```

**Step 5 — Test:**
Boot the server, create a room, enter build mode, and verify placement, collision, and removal work correctly.

### Switching from Procedural to Image Assets

If you later want to use PNG sprites instead of procedural graphics:
1. Remove the `generateTexture('furn-N')` call.
2. Add a standard `this.load.image('furn-N', 'assets/furniture/sofa.png')`.
3. Keep the footprint system, physics group logic, and rendering math exactly the same.
4. The `setScale(w, h)` call will stretch the image to fit multi-cell footprints. For pixel-art, use `setScale(w, h)` with `sprite.texture.setFilter(Phaser.Textures.NEAREST)`.

---

## 8. Deployment Notes

```bash
# Local dev
npm install
npm run dev

# Deploy to Oracle Cloud
ssh ubuntu@147.224.35.250 -i "C:\Users\zeidd\.ssh\ssh.key"
cd ~/FreeLobby
git pull
pm2 restart freelobby
```

---

## 9. Data Format Specifications (Open Standards)

These formats are documented so users can build their own tools, bots, and room editors.

### Avatar Hash (4 characters)
`[Color][Shape][Accessory][Pulse]`

| Char | Meaning | Values |
|------|---------|--------|
| 1 | Color Index | `0-9` (maps to PLAYER_COLORS array) |
| 2 | Shape | `0`=Circle, `1`=Square, `2`=Diamond |
| 3 | Accessory | `0`=None, `1`=Headphones, `2`=Halo, `3`=Beanie |
| 4 | Pulse Speed | `0`=Slow, `1`=Normal, `2`=Fast |

**Example:** `0101` = Color 0 (Cyan), Shape 1 (Square), Accessory 0 (None), Pulse 1 (Normal).

### Room Hash (Base64 JSON)
A Base64-encoded JSON array of furniture objects.

```json
[
  { "t": 0, "x": 3, "y": 4, "r": 0 },
  { "t": 1, "x": 5, "y": 2, "r": 1 }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `t` | integer | Furniture type ID |
| `x` | integer | Grid X coordinate (0 = left edge) |
| `y` | integer | Grid Y coordinate (0 = top edge) |
| `r` | integer | Rotation in 90° increments (0, 1, 2, 3) |

**Grid cell size:** 64px. World bounds 1200×800 → Grid approx 18×12.  
**Max items per room:** 20 (enforced by server & client).

**Furniture Type IDs:**
| ID | Name | Footprint | Walkable |
|----|------|-----------|----------|
| 0 | Neon Cube | 1×1 | No |
| 1 | Neon Sphere | 1×1 | No |
| 2 | Neon Cylinder | 1×1 | No |
| 3 | Neon Pyramid | 1×1 | No |
| 4 | Neon Chair | 1×1 | Yes |
| 5 | Neon Plant | 1×1 | No |
| 6 | Neon Lamp | 1×1 | No |
| 7 | Neon Rug | 2×2 | Yes |

---

## 10. Open Questions & Ideas Backlog

- Should we add a simple "Report" button for trolls who emote-spam?
- Could we implement a "Do Not Disturb" mode where your avatar appears semi-transparent and Vibe Checks are auto-declined?
- Should rooms have a "capacity" setting (e.g., 2 people for intimate 1-on-1, 10 for a party)?
- Can we do a simple synced particle effect when two Vibe-Checked players stand close together for 10s? (A "resonance" effect.)
