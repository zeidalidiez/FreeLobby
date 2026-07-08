# FreeLobby Visual Overhaul Audit

Date: 2026-07-08

This audit captures the current local app at `http://localhost:3000` across landing, common room, private room, build mode, music, emotes, and mobile states. The screenshots in this folder are the evidence set for the next look-and-feel pass.

## Evidence

- `01-landing-desktop-top.png` - desktop landing, first viewport.
- `02-landing-desktop-lower.png` - desktop landing after scroll.
- `03-common-room-desktop.png` - common room HUD and world baseline.
- `04-common-room-emotes-open.png` - common room with emote grid open.
- `05-private-room-desktop.png` - owner state in an empty private room.
- `06-private-build-panel-desktop.png` - build palette open.
- `07-private-music-and-build-desktop.png` - music sequencer plus build palette.
- `08-landing-mobile-top.png` - mobile landing, first viewport.
- `09-landing-mobile-lower.png` - mobile landing after scroll.
- `10-common-room-mobile.png` - mobile room HUD and bottom controls.

## Summary

FreeLobby already has a recognizable identity: dark, quiet, cyan, grid-based, and low-pressure. The next pass should not throw that away. The higher-value move is to make the interface feel intentional and calm instead of assembled from many separate floating controls.

The biggest visual problem is not one bad color or one bad component. It is that the landing screen, HUD, emote picker, build palette, music sequencer, room controls, and mobile layout all use similar glass/pill styling with similar contrast and similar weight. That makes important actions hard to distinguish from secondary controls.

## Recommended Direction

Use a "quiet neon social console" direction:

- Keep the black room world and neon grid as FreeLobby's core memory.
- Reduce cyan dominance by adding restrained secondary accents for state and room mood.
- Make controls feel like one product system: one HUD, one panel model, one button scale, one icon style.
- Use richer room surfaces and furniture art so the world feels inhabited without becoming noisy.
- Preserve the consent-first promise: Vibe Check, Flee, Quiet Mode, and anonymous presence should remain visually clear and easy to reach.

## Highest Priority Fixes

### 1. Rebuild The Landing Screen Around The First Decision

The landing card currently tries to hold every action in one long centered surface. On desktop it exceeds the viewport; on mobile it requires a lot of scrolling before the user sees the full set of choices. The title also disappears once the user scrolls down.

Recommended changes:

- Make the first viewport about name entry plus the primary room decision.
- Treat common rooms as the hero content, not just a list inside a card.
- Move avatar customization, bookmarks, public rooms, and room code entry into collapsible sections or tabs.
- Replace the single monolithic glass card with a cleaner app shell: left/top identity, main room chooser, secondary drawer for settings.
- Keep `Enter The Lobby` as the obvious default, but let room cards be first-class buttons.

### 2. Consolidate The Room HUD

In room view, `Connected`, room name, bookmark, copy, player count, Flee, Build, Quiet, zoom, emotes, love, and sign input all float as independent controls. They work, but they do not feel composed.

Recommended changes:

- Create a single top HUD strip or corner tray for room status, player count, room code, bookmark, copy, and connection state.
- Keep Flee always available, but style it as the emergency affordance rather than another neutral pill.
- Put owner tools such as Build and room ambience in a compact owner toolbar.
- Use consistent icon buttons with tooltips for bookmark, copy, zoom, build, music, mute, and close actions.
- Avoid relying on emoji/text symbols for controls when an icon library can carry the action more clearly.

### 3. Standardize Panels And Pickers

The emote grid, furniture panel, ambience bar, and music sequencer are all useful, but each feels like its own overlay. When build and music are open together, the screen becomes crowded quickly.

Recommended changes:

- Use one panel pattern: header, tab row when needed, content grid, footer actions.
- Make emotes a bottom sheet on mobile and a compact anchored popover on desktop.
- Make owner tools a docked panel with tabs for Furniture, Ambience, Music, and Memory Card.
- Keep panel sizes stable so opening tools does not feel jumpy.
- Add empty, hover, active, disabled, and error states for each tool surface.

### 4. Add Room-Specific Visual Depth

The current world is readable, but very sparse: cyan grid, black floor, wireframe furniture. The tone is strong, but it can feel more like a debug room than a place to linger.

Recommended changes:

- Give each common room a visual mood: Lobby, Zen Garden, Library.
- Add subtle floor/wall materials, ambient lighting, and room-specific accent colors.
- Improve furniture silhouettes so chairs, couches, lamps, plants, and consoles read instantly at gameplay zoom.
- Add interaction feedback for clickable furniture, especially lamps and TVs.
- Keep the no-upload rule; use procedural or curated assets only.

### 5. Treat Mobile As Its Own Layout

The mobile room state is the clearest sign that the UI needs a layout pass. The top-right controls stack across a narrow viewport while bottom controls compete with the sign bar.

Recommended changes:

- Use a compact top HUD with only room identity and safety status visible by default.
- Move secondary controls into a bottom command bar or drawer.
- Make emotes, signs, and owner tools open as bottom sheets.
- Reserve bottom safe-area space so the sign bar, emote button, and love/flee controls do not collide.
- Keep touch targets at least 44px, but reduce the number of simultaneously visible touch targets.

## Design System Work

Before repainting screens, define the primitives:

- Color tokens: void, surface, elevated, cyan primary, warm safety accent, quiet purple, room accents, danger/flee.
- Type scale: display, title, label, body, caption. Remove viewport-scaled type and avoid negative letter spacing.
- Radius scale: keep repeated UI elements at 8px or less unless they are true pills or circular icon buttons.
- Elevation scale: background, HUD, panel, modal, toast.
- Button families: primary action, secondary action, icon button, destructive/emergency, tool toggle.
- Panel anatomy: header, close icon, content grid/list, footer actions.
- Motion rules: small fades and panel transitions, with reduced-motion coverage preserved.

## Implementation Phases

### Phase 1 - Foundation

- Clean up design tokens in `public/css/style.css`.
- Introduce shared classes for HUD groups, icon buttons, panels, toolbars, and sheets.
- Pick or install an icon system before replacing emoji/text control glyphs.
- Keep gameplay behavior unchanged.

### Phase 2 - Landing Refresh

- Rework `public/index.html` landing structure around room choice.
- Update desktop and mobile landing CSS together.
- Move avatar customization and bookmarks behind clearer secondary entry points.
- Verify no clipping at 390x844, 768x1024, 1280x720, and 1440x900.

### Phase 3 - HUD And Panels

- Consolidate room status controls.
- Create owner toolbar and panel tabs for Build, Ambience, Music, and Memory Card.
- Rework emote picker and sign input around desktop popover/mobile bottom sheet behavior.
- Preserve Flee, Quiet Mode, and Vibe Check visibility.

### Phase 4 - World Art Pass

- Improve common-room themes and furniture readability.
- Add richer, low-noise environmental detail.
- Add hover/click feedback for interactive objects.
- Review how avatars read against each room theme.

### Phase 5 - QA

- Browser smoke test desktop and mobile.
- Verify keyboard focus order, focus traps, and `prefers-reduced-motion`.
- Check contrast for muted labels, placeholders, disabled states, and low-opacity text.
- Verify no HUD/panel overlap in common and private rooms.
- Run regression tests after each behavior-touching change.

## Constraints To Preserve

- No login, no tracking, no database assumption.
- No global chat or room chat.
- Vibe Check remains the gate for names and text.
- Flee stays one action away.
- Quiet Mode remains silent and low-pressure.
- No user-uploaded gameplay assets.

## Next Decision

Start with Phase 1 and Phase 2 together if we want visible momentum quickly. The landing screen is the first impression and currently carries the most layout debt. The HUD/panel work should follow immediately because the room view is where FreeLobby's product promise actually lives.
