# FreeLobby — Asset Spec for External Artists

> **For:** AI image generators, pixel artists, or contributors creating placeholder-to-final art  
> **Style:** Retro-futuristic / Tron / Cyberpunk / Minimalist  
> **Engine:** Phaser 3 (WebGL/Canvas)  
> **Last updated:** 2026-07-09

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
- Keep gradients limited to restrained cyan edge glow; room color comes from Phaser tinting.
- Keep silhouettes centered and readable when Phaser scales them down to the 64px gameplay grid.

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

### C. Furniture (20 types)
**Current source size:** 256×256. Phaser fits each source to its one- or multi-cell footprint with `setDisplaySize()`. The higher-resolution source preserves clean linework at different camera zoom levels.

The checked-in furniture was originally rendered onto opaque dark/white mattes. `public/js/asset-normalizer.js` converts those neutral matte pixels to alpha at load time while retaining cyan antialiasing and glow. New contributions should use real alpha directly; the normalizer remains a compatibility safety net.

| ID | Name | File | Size | Walkable? | Style notes |
|----|------|------|------|-----------|-------------|
| 0 | Cube | `assets/furn-cube.png` | 256×256 | No | Wireframe cube, cyan outline, hollow center |
| 1 | Sphere | `assets/furn-sphere.png` | 256×256 | No | Wireframe sphere, cross-section rings |
| 2 | Cylinder | `assets/furn-cylinder.png` | 256×256 | No | Wireframe cylinder, top ellipse visible |
| 3 | Pyramid | `assets/furn-pyramid.png` | 256×256 | No | Wireframe 4-sided pyramid |
| 4 | Chair | `assets/furn-chair.png` | 256×256 | Yes | Simple blocky chair, open seat (no back blocking walk) |
| 5 | Plant | `assets/furn-plant.png` | 256×256 | No | Spiky neon succulent or wireframe fractal leaf |
| 6 | Lamp | `assets/furn-lamp.png` | 256×256 | No | Tall thin stand with glowing bulb top |
| 7 | Rug | `assets/furn-rug.png` | 256×256 | Yes | Flat grid-pattern mat. Displayed across 2×2 cells. |
| 8 | Bed | `assets/furn-bed.png` | 256×256 | Yes | Low platform bed, displayed across 2×2 cells |
| 9 | Bathtub | `assets/furn-bathtub.png` | 256×256 | No | Wireframe tub silhouette, displayed across 2×1 cells |
| 10 | Couch | `assets/furn-couch.png` | 256×256 | Yes | Low neon couch, displayed across 2×1 cells |
| 11 | Console | `assets/furn-console.png` | 256×256 | No | Small game console or control deck |
| 12 | Computer | `assets/furn-computer.png` | 256×256 | No | Monitor and keyboard, readable at gameplay zoom |
| 13 | TV | `assets/furn-tv.png` | 256×256 | No | Wide screen, displayed across 2×1 cells, interactive toggle |
| 14 | Toilet | `assets/furn-toilet.png` | 256×256 | No | Simple iconic outline |
| 15 | Cat | `assets/pet-cat.png` | 256×256 | Yes | Small pet silhouette, readable as a cat |
| 16 | Dog | `assets/pet-dog.png` | 256×256 | Yes | Small pet silhouette, readable as a dog |
| 17 | Rabbit | `assets/pet-rabbit.png` | 256×256 | Yes | Small pet silhouette with clear ears |
| 18 | Fishbowl | `assets/pet-fishbowl.png` | 256×256 | No | Small bowl, solid collision |
| 19 | Bird | `assets/pet-bird.png` | 256×256 | Yes | Small perched bird silhouette |

**Furniture rules:**
- Transparent background (`.png` with alpha).
- White/cyan base. Phaser tints at runtime to the room owner's chosen accent (or default cyan).
- Keep line weight consistent: 2px outer, 1px inner detail.
- Keep baked glow restrained. Lamp/TV on-state glow and room tinting are added by Phaser.

### D. Floor & Wall Tiles

**Status:** Both are generated in `public/js/game.js`; there are no checked-in floor or wall PNGs. The floor texture is 128×128 and the wall texture is 64×64 before room-specific tinting.

### E. UI / Icons (optional upgrades)
| Name | File | Size | Notes |
|------|------|------|-------|
| Emote bubble | `assets/emote-bubble.png` | 48×48 | Tiny floating circle for emote background. Optional — currently code-drawn. |
| Click pulse | `assets/click-pulse.png` | 32×32 | Expanding ring for click-to-move feedback. Optional. |
| Memory card template | `assets/card-bg.png` | 320×200 | Background art for the Room Memory Card export. Dark with corner brackets, cyan border. Optional — currently code-drawn. |

---

## 3. Technical Constraints

**Format:** PNG-24 with alpha channel. No JPEG.

**Scaling:** Phaser uses `setDisplaySize()` to fit furniture to its cell footprint. Keep the silhouette centered with useful padding so single-cell items remain readable at 64px.

**Tinting:** All gameplay sprites (avatars, accessories, furniture) are tinted at runtime. Base PNG should be **white/neutral** with transparency. The engine multiplies the sprite color by the tint color.

**File location:** Drop finished furniture assets in `public/assets/` using the names above. `preload()` loads every entry in `FURNITURE_DEFS`, and `asset-normalizer.js` prepares the texture before the room renders.

**Performance target:** Keep each source under 80KB and the complete furniture set at or below 1MB. The current set is approximately 981KiB. Assets are cached by the server for one day.

---

## 4. Example Prompt for AI Image Generators

> "A minimalist Tron-style wireframe cube centered on a transparent 256x256 canvas, crisp electric cyan outline, hollow center, restrained cyan edge glow, solid graphic shapes, retro-futuristic, readable when scaled to 64 pixels"

---

## 5. What NOT to do

- Do not bake player colors into avatars — the engine tints them.
- Do not add opaque matte backgrounds, cast shadows, or complex scene lighting.
- Do not exceed 256×256 for furniture source art.
- Do not use photographic textures or photorealism. Keep it iconic and symbolic.
- Do not create animated sprites (gifs). Phaser handles animation via code tweening.
