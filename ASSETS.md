# FreeLobby Craft Asset System

> **Engine:** Phaser 3 + Canvas 2D texture compositor
> **Source license:** CC0 1.0 Universal
> **Last updated:** 2026-07-31

FreeLobby does not ship one finished image per object. It ships a small set of
CC0 material scans, then `public/js/craft-textures.js` clips, recolors, layers,
outlines, and stitches those materials into every gameplay texture at startup.
The result is a handmade/DIY visual language whose parts can be changed
independently.

## Source materials

The canonical inventory is
`public/assets/materials/materials.json`. It records the original Poly Haven
asset and download URLs, authors, license, retrieval date, source MD5, and
checked-in SHA-256 for every file.

| Material id | File | Typical use |
| --- | --- | --- |
| `denim` | `denim-dark.jpg` | floors, dark structural pieces |
| `linen` | `linen.jpg` | upholstery, panels, broad light pieces |
| `cotton` | `cotton.jpg` | UI surfaces, cushions, avatar patches |
| `fleece` | `fleece.jpg` | soft pet and accessory details |
| `hessian` | `hessian.jpg` | rough rugs and natural objects |
| `corduroy` | `corduroy.jpg` | ribbed upholstery and accents |
| `board` | `board.jpg` | frames, legs, shelves, appliance bodies |

All seven files are unmodified 1K diffuse JPGs released by Poly Haven under
CC0. They are self-hosted; the running application never contacts Poly Haven.
Attribution is not required, but provenance is retained so a source can always
be audited or replaced.

## Composition model

`craft-textures.js` is the single source of truth for art recipes. Each recipe
uses ordinary Canvas paths plus one or more material fills:

1. Pick a semantic material and palette color.
2. Create a recolored tile while preserving the scan's luminance and texture.
3. Clip the tile into a readable top-down shape.
4. Layer structural, soft, inset, and detail pieces.
5. Add borders, seams, stitches, facial marks, or highlights where useful.
6. install the finished canvas as a Phaser texture.

The source scans, shape geometry, colors, and edge treatments remain separate.
Changing a couch fabric therefore does not require redrawing the couch, and a
recipe can be generated, edited, or remixed without touching a fixed sprite
sheet.

## Generated inventory

### Rooms

- Four 128×128 floor textures with material grain and a low-contrast stitched
  64-pixel placement grid.
- Four 64×64 wall textures with layered textile/board construction.
- Semantic palettes for Welcome Inn, Garden Suite, Sunroom, and Midnight.
- Each preset exposes wall, floor, and accent colors plus Quiet, Cozy, and
  Layered material intensity. A non-preset combination is generated lazily as
  the room's `custom` texture slot.
- A style change swaps the generated floor, wall, furniture, and interactive
  textures without changing object ids or placement state.

### Avatars

- 5 silhouettes: circle, square, diamond, heart, and scallop.
- 10 fabric colors.
- 6 eye sets, 5 brow sets, 6 mouths, and 6 face-detail choices.
- 7 accessory overlays plus none: headphones, halo, beanie, bow, flower,
  glasses, and leaf.
- The base body/face texture is composed lazily for the combinations that
  actually enter a room; accessories remain reusable overlays and pulse remains
  animation state. This avoids prebuilding every possible permutation.
- The same composer renders the landing-page preview and the Phaser player
  texture, so the customizer cannot drift from the in-room avatar.
- Fabric borders and facial marks keep avatars readable as people rather than
  furniture.

### Furniture and pets

`public/js/furniture-catalog.js` is the canonical 100-item metadata inventory.
It defines display name, category, footprint, walkability, icon, search tags,
drawing recipe, variant, and synchronized interaction support. Numeric ids
`0–19` remain backward-compatible with earlier rooms and Memory Cards; ids
`20–99` extend the protocol without a parallel asset pipeline.

The catalog is intentionally hotel-shaped:

| Category | Count | Examples |
| --- | ---: | --- |
| Seating | 15 | club and wingback chairs, lobby benches, sectional, chaise |
| Tables | 10 | coffee, side, dining, console, writing, vanity, bistro |
| Beds | 8 | single, queen, king, canopy, daybed, bunk, rollaway |
| Storage | 10 | wardrobe, dresser, bookcase, trunk, room safe, luggage rack |
| Lighting | 10 | bedside/floor/reading lamps, sconces, chandelier, lantern |
| Decor | 13 | mirrors, art, fireplace, radio, record player, telephone |
| Rugs | 8 | runner, round, lounge, geometric, floral, striped, shag |
| Plants | 8 | monstera, palms, fern, cactus, flowers, bonsai |
| Hotel | 12 | minibar, reception desk, luggage and service carts, key rack |
| Pets | 6 | cat, dog, rabbit, fishbowl, bird, turtle |

Sixty-six explicit recipe branches cover the 100 definitions; variants share
geometry only when their real-world construction warrants it. The catalog
validator requires 80–100 entries, unique ids, valid footprints, known
categories, and complete recipe metadata.

The original ids remain useful as a compatibility reference:

| ID | Name | Footprint | Walkable | Recipe intent |
| ---: | --- | --- | :---: | --- |
| 0 | Storage Cube | 1×1 | No | soft storage cube with inset top |
| 1 | Round Pouf | 1×1 | Yes | stitched round pouf |
| 2 | Counter Stool | 1×1 | Yes | layered cylindrical stool |
| 3 | Floor Cushion | 1×1 | Yes | diamond floor cushion |
| 4 | Dining Chair | 1×1 | Yes | wooden frame and upholstered seat |
| 5 | Potted Plant | 1×1 | No | board pot with layered cloth leaves |
| 6 | Drum Lamp | 1×1 | No | base, stem, and shade; off/on variants |
| 7 | Patchwork Rug | 2×2 | Yes | textile field, border, fringe, stitch motif |
| 8 | Double Bed | 2×2 | Yes | frame, mattress, blanket, pillow |
| 9 | Soaking Tub | 2×1 | No | rim, water inset, small fittings |
| 10 | Three-Seat Sofa | 2×1 | Yes | frame, arms, three separate cushions |
| 11 | Game Console | 1×1 | No | compact control deck with buttons |
| 12 | Guest Computer | 1×1 | No | monitor, screen inset, stand, keyboard |
| 13 | Hotel Television | 2×1 | No | wide framed screen; off/on variants |
| 14 | Private Bathroom | 1×1 | No | tank, seat, bowl |
| 15 | Patchwork Cat | 1×1 | Yes | body, head, ears, tail, face |
| 16 | Patchwork Dog | 1×1 | Yes | body, head, ears, muzzle, tail |
| 17 | Patchwork Rabbit | 1×1 | Yes | body, head, long ears, tail |
| 18 | Guest Fishbowl | 1×1 | No | rim, glass/water field, fish |
| 19 | Patchwork Bird | 1×1 | Yes | body, wing, head, beak, legs |

The owner build drawer renders previews from these exact installed textures,
including the current preset or custom style, so its thumbnail cannot drift
from the in-room object.

### Interface and Memory Cards

The HTML/CSS shell uses the same local material files beneath translucent color
layers. Panels use cloth grain, warm borders, and dashed stitch outlines. The
desktop builder is a wide categorized/searchable drawer; mobile uses the same
DOM as a snapping bottom sheet. Room Memory Card previews call the furniture
recipes rather than drawing abstract placeholder marks, and the version 2
pixel-row payload stores preset, intensity, direct colors, layout, rotation,
layer metadata, and interactive state.

## Technical rules

- Do not add downloaded art unless its redistribution license is verified and
  recorded in `materials.json`. CC0 is the default requirement.
- Keep source materials self-hosted and deterministic. Normal page load must not
  contact an asset CDN.
- Add or change object geometry in `craft-textures.js`; do not reintroduce one
  opaque PNG per furniture item.
- Preserve existing furniture ids and footprints because the server protocol
  and Memory Cards encode them numerically. Add new items at the end.
- Floors and walls use a 2× backing resolution. Furniture and 48-pixel avatar
  layers use a 1× backing resolution to keep the four-preset × 100-item texture
  library within a reasonable memory budget.
- Keep important silhouettes readable at one 64×64 cell. Texture is detail, not
  a substitute for shape.
- Add an off/on derivative for any new synchronized interactive object.
- Update the catalog, craft, room-style, card-codec, and server tests whenever
  their corresponding metadata or protocol changes. Update manifest hashes
  whenever source files change.

## Adding a material

1. Download a diffuse/albedo image from a verified CC0 source.
2. Place it in `public/assets/materials/` with a stable descriptive name.
3. Record license, provenance, authors, source checksum, and checked-in SHA-256
   in `materials.json`.
4. Register the file in `SOURCE_MATERIALS`.
5. Use it in at least one explicit recipe or remove it.
6. Run `npm test`, then inspect landing, each room theme, build mode, and mobile
   gameplay at 390×844.
