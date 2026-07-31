# FreeLobby Craft Asset System

> **Engine:** Phaser 3 + Canvas 2D texture compositor
> **Source license:** CC0 1.0 Universal
> **Last updated:** 2026-07-30

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
- Semantic palettes for Lobby, Garden, Library, and Private rooms. A theme
  change swaps the generated floor, wall, furniture, and interactive textures.

### Avatars

- 3 silhouettes: circle, square, diamond.
- 10 color variants per silhouette.
- 3 accessory overlays plus none: headphones, halo, beanie.
- Fabric borders and tiny facial marks keep avatars readable as people rather
  than furniture.

### Furniture and pets

The existing network ids, footprints, collision behavior, and Memory Card
encoding remain stable. Only the rendering source changed.

| ID | Name | Footprint | Walkable | Recipe intent |
| ---: | --- | --- | :---: | --- |
| 0 | Storage Cube | 1×1 | No | soft storage cube with inset top |
| 1 | Round Pouf | 1×1 | No | stitched round pouf |
| 2 | Stool | 1×1 | No | layered cylindrical stool |
| 3 | Floor Cushion | 1×1 | No | diamond floor cushion |
| 4 | Chair | 1×1 | Yes | wooden frame and upholstered seat |
| 5 | Plant | 1×1 | No | board pot with layered cloth leaves |
| 6 | Lamp | 1×1 | No | base, stem, and shade; off/on variants |
| 7 | Rug | 2×2 | Yes | textile field, border, fringe, stitch motif |
| 8 | Bed | 2×2 | Yes | frame, mattress, blanket, pillow |
| 9 | Bathtub | 2×1 | No | rim, water inset, small fittings |
| 10 | Couch | 2×1 | Yes | frame, arms, three separate cushions |
| 11 | Console | 1×1 | No | compact control deck with buttons |
| 12 | Computer | 1×1 | No | monitor, screen inset, stand, keyboard |
| 13 | TV | 2×1 | No | wide framed screen; off/on variants |
| 14 | Toilet | 1×1 | No | tank, seat, bowl |
| 15 | Cat | 1×1 | Yes | body, head, ears, tail, face |
| 16 | Dog | 1×1 | Yes | body, head, ears, muzzle, tail |
| 17 | Rabbit | 1×1 | Yes | body, head, long ears, tail |
| 18 | Fishbowl | 1×1 | No | rim, glass/water field, fish |
| 19 | Bird | 1×1 | Yes | body, wing, head, beak, legs |

The owner build palette renders previews from these exact installed textures,
so its thumbnail cannot drift from the in-room object.

### Interface and Memory Cards

The HTML/CSS shell uses the same local material files beneath translucent color
layers. Panels use cloth grain, warm borders, and dashed stitch outlines. Room
Memory Card previews call the furniture recipes rather than drawing abstract
placeholder marks.

## Technical rules

- Do not add downloaded art unless its redistribution license is verified and
  recorded in `materials.json`. CC0 is the default requirement.
- Keep source materials self-hosted and deterministic. Normal page load must not
  contact an asset CDN.
- Add or change object geometry in `craft-textures.js`; do not reintroduce one
  opaque PNG per furniture item.
- Preserve furniture ids and footprints because the server protocol and Memory
  Cards encode them numerically.
- Build textures at a 2× backing resolution, then expose their logical gameplay
  size to Phaser. This preserves small stitches without changing collisions.
- Keep important silhouettes readable at one 64×64 cell. Texture is detail, not
  a substitute for shape.
- Add an off/on derivative for any new synchronized interactive object.
- Update `tests/craft-textures.test.js` and the material manifest hashes when
  source files change.

## Adding a material

1. Download a diffuse/albedo image from a verified CC0 source.
2. Place it in `public/assets/materials/` with a stable descriptive name.
3. Record license, provenance, authors, source checksum, and checked-in SHA-256
   in `materials.json`.
4. Register the file in `SOURCE_MATERIALS`.
5. Use it in at least one explicit recipe or remove it.
6. Run `npm test`, then inspect landing, each room theme, build mode, and mobile
   gameplay at 390×844.
