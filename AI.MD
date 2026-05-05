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

### Phase 1: Neon/Tron Visual Overhaul *(IN PROGRESS)*
- [ ] Rewrite CSS for neon blue/cyan theme
- [ ] Rewrite Phaser graphics for glowing neon avatars
- [ ] Implement animated grid floor
- [ ] Implement glowing neon walls
- [ ] Add subtle bloom/glow post-processing feel (via additive blending in Phaser)
- [ ] Update player color palette to neon set

### Phase 2: Character Customization *(Safe & Procedural)*
- [ ] Pre-lobby customization screen
- [ ] Options: Neon color, Glow pulse speed, Shape (Circle, Square, Diamond), Accessories (Headphones, Halo, Beanie — all procedural pixels)
- [ ] Serialize customization into player data sent to server
- [ ] Other players see your custom avatar

### Phase 3: Private Rooms & Furniture *(The "Habbo" Milestone)*
- [ ] Room ownership: Creator is the owner
- [ ] Room settings: Public (joinable by code/random) or Private (invite only)
- [ ] Furniture system: Owner can place wireframe primitives from a palette
- [ ] Furniture serialization: Base64 string for room layout (zero DB)
- [ ] Non-owners can view furniture but cannot move it (anti-griefing)
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

## 7. Deployment Notes

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

## 8. Open Questions & Ideas Backlog

- Should we add a simple "Report" button for trolls who emote-spam?
- Could we implement a "Do Not Disturb" mode where your avatar appears semi-transparent and Vibe Checks are auto-declined?
- Should rooms have a "capacity" setting (e.g., 2 people for intimate 1-on-1, 10 for a party)?
- Can we do a simple synced particle effect when two Vibe-Checked players stand close together for 10s? (A "resonance" effect.)
