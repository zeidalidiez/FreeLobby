# FreeLobby — Asset Spec for External Artists

> **For:** AI image generators, pixel artists, or contributors creating placeholder-to-final art  
> **Style:** Retro-futuristic / Tron / Cyberpunk / Minimalist  
> **Engine:** Phaser 3 (WebGL/Canvas)  
> **Last updated:** 2026-05-06

---

## 1. Visual Identity (Non-Negotiable)

**Palette**
- Background: `#050508` (deep void black)
- Grid/accents: `#00f0ff` (electric cyan)
- Neon highlight: `#ffffff` (pure white, used for bright edges)
- Player colors: 10 neon swatches — cyan `#00f0ff`, magenta `#ff00ff`, lime `#39ff14`, hot pink `#ff007f`, yellow `#ffff00`, orange `#ff8800`, purple `#bd00ff`, blue `#0088ff`, red `#ff3333`, teal `#00ffcc`
- Everything glows. No flat fills. Every sprite needs a bright outer rim and a softer inner core.

**Aesthetic rules**
- Wireframe / outline-first. Think Tron lightcycles, not solid cartoons.
- 1px–2px bright outlines, semi-transparent inner fill.
- No gradients (Phaser handles tinting). Solid color regions only.
- Pixel-perfect alignment. Phaser scales sprites by integer multiples.

---

## 2. Asset Inventory

### A. Player Avatars (Procedural base shapes)
**Status:** Currently code-generated. **If replacing with sprites**, provide:

| Shape | File | Size | Notes |
|-------|------|------|-------|
| Circle | `assets/player-circle.png` | 64×64 | Centered. Outer 2px glow ring, inner white core. Transparent background. |
| Square | `assets/player-square.png` | 64×64 | Same glow structure. Slight rounded corners (2px radius) acceptable. |
| Diamond | `assets/player-diamond.png` | 64×64 | 45° rotated square. Same glow. |

**Tinting:** Phaser tints these white base sprites to the player's chosen neon color at runtime. So the base PNG should be **white/cyan-tinted** with transparency. Do NOT bake player colors into the sprite.

### B. Accessories (Overlays)
| Name | File | Size | Anchor Point |
|------|------|------|-------------|
| Headphones | `assets/acc-headphones.png` | 64×64 | Centered on top of head (around y≈16 on a 64×64 canvas) |
| Halo | `assets/acc-halo.png` | 64×64 | Floating above head (y≈8) |
| Beanie | `assets/acc-beanie.png` | 64×64 | Top of head (y≈4) |

**Rules:** Accessories are rendered *on top* of the player sprite at the same scale. Keep line art consistent with the avatar glow style (2px white outline). Phaser tints them to match the player's color.

### C. Furniture (8 types)
**Base size:** 64×64 per grid cell. Multi-cell items (e.g., 2×2 rug) are still delivered as 64×64 and scaled up in-engine.

| ID | Name | File | Size | Walkable? | Style notes |
|----|------|------|------|-----------|-------------|
| 0 | Cube | `assets/furn-cube.png` | 64×64 | No | Wireframe cube, 2px cyan outline, hollow center |
| 1 | Sphere | `assets/furn-sphere.png` | 64×64 | No | Wireframe sphere, cross-section rings |
| 2 | Cylinder | `assets/furn-cylinder.png` | 64×64 | No | Wireframe cylinder, top ellipse visible |
| 3 | Pyramid | `assets/furn-pyramid.png` | 64×64 | No | Wireframe 4-sided pyramid |
| 4 | Chair | `assets/furn-chair.png` | 64×64 | Yes | Simple blocky chair, open seat (no back blocking walk) |
| 5 | Plant | `assets/furn-plant.png` | 64×64 | No | Spiky neon succulent or wireframe fractal leaf |
| 6 | Lamp | `assets/furn-lamp.png` | 64×64 | No | Tall thin stand with glowing bulb top |
| 7 | Rug | `assets/furn-rug.png` | 64×64 | Yes | Flat grid-pattern mat. Scaled 2×2 in engine. |

**Furniture rules:**
- Transparent background (`.png` with alpha).
- White/cyan base. Phaser tints at runtime to the room owner's chosen accent (or default cyan).
- Keep line weight consistent: 2px outer, 1px inner detail.
- **Do NOT** add drop shadows or glow effects baked into the PNG — Phaser handles glow via `setAlpha(0.8)` and additive blending.

### D. Floor & Wall Tiles
| Name | File | Size | Notes |
|------|------|------|-------|
| Floor tile | `assets/floor-tile.png` | 128×128 | Dark void fill `#050508`, 1px cyan grid lines at 50% opacity. Repeating tile. |
| Wall tile | `assets/wall-tile.png` | 64×64 | Slightly darker fill, 2px bright cyan border. Used for room perimeter only. |

### E. UI / Icons (optional upgrades)
| Name | File | Size | Notes |
|------|------|------|-------|
| Emote bubble | `assets/emote-bubble.png` | 48×48 | Tiny floating circle for emote background. Optional — currently code-drawn. |
| Click pulse | `assets/click-pulse.png` | 32×32 | Expanding ring for click-to-move feedback. Optional. |
| Memory card template | `assets/card-bg.png` | 320×200 | Background art for the Room Memory Card export. Dark with corner brackets, cyan border. Optional — currently code-drawn. |

---

## 3. Technical Constraints

**Format:** PNG-24 with alpha channel. No JPEG.

**Scaling:** Phaser uses `setScale()` for multi-cell furniture (e.g., rug 2×2). Provide crisp 1:1 pixel art so scaling doesn't blur.

**Tinting:** All gameplay sprites (avatars, accessories, furniture) are tinted at runtime. Base PNG should be **white/neutral** with transparency. The engine multiplies the sprite color by the tint color.

**File location:** Drop finished assets in `public/assets/`. The `preload()` function in `public/js/game.js` already has hooks for procedural generation; replacing them with `this.load.image('key', 'assets/file.png')` is a 1-line swap.

**Performance target:** Each sprite sheet should be under 50KB. Total asset budget: <500KB. This runs on a free Oracle instance with 1 vCPU.

---

## 4. Example Prompt for AI Image Generators

> "A minimalist Tron-style wireframe cube on a transparent background, 64x64 pixels, 2-pixel electric cyan outline, hollow center, no gradients, pixel art, solid colors only, retro-futuristic, neon glow aesthetic"

---

## 5. What NOT to do

- Do not bake player colors into avatars — the engine tints them.
- Do not add gradients, shadows, or complex lighting — keep it flat and graphic.
- Do not exceed 64×64 for single-cell items. Bigger = blurrier when scaled.
- Do not use photographic textures or photorealism. Keep it iconic and symbolic.
- Do not create animated sprites (gifs). Phaser handles animation via code tweening.
