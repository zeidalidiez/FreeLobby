# FreeLobby

**A calm, safe, handmade corner of the internet for introverts who want a tiny hit of human connection without the pressure.**

FreeLobby is a browser-based multiplayer hangout space — imagine a minimal, low-pressure Habbo Hotel where nobody can talk to you without your consent. You show up as a tiny fabric patch, wander around rooms assembled from textured shapes, and if you vibe with someone, you can mutually agree to reveal your names. That's it. No logins. No tracking. No drama.

I built this because I wanted a space where quiet people can just *be* around other humans without the expectation to perform. Lurking is a valid playstyle here. Silence isn't awkward. You can sit in a room with strangers and feel a little less alone.

**Live at:** https://freelobby.zeiddiez.com/

---

## Craft Material System

The entire room and interface language is built from a small, reusable library of self-hosted CC0 material scans.

- Denim, linen, cotton, fleece, hessian, corduroy, and board scans are recolored and clipped into simple shapes at runtime.
- Furniture is actual furniture: each of the 20 objects has its own readable silhouette, assembled from layered material pieces, seams, borders, and small stitched details.
- Avatars and accessories use the same material grammar, so they belong to the room without being mistaken for furniture.
- Four semantic palettes give the Lobby, Zen Garden, Library, and private rooms distinct moods without requiring duplicate source art.
- The landing screen, HUD, owner tools, and Room Memory Card use the same tactile, sewn-together language.
- Every source texture is CC0, self-hosted, checksummed, and documented in `public/assets/materials/materials.json`.

The screenshot-backed audit that kicked this off lives here:

`docs/visual-audit/2026-07-08-visual-overhaul/visual-overhaul-audit.md`

---

## What's Here Right Now

### Core Experience
- **No login, no password, no accounts.** Just pick a name and drop in.
- **Vibe Check:** The heart of the safety system. You appear as "Stranger 1", "Stranger 2", etc. If someone wants to know your real name or chat with you, they send a Vibe Check. You can accept or silently decline. No guilt either way.
- **Flee Button:** One-click escape to a brand new empty room. Always available.
- **Anonymous by default.** Always.

### Handmade / DIY Aesthetic
- Dark textile rooms with subtly stitched floor grids and layered fabric or board walls.
- Procedurally composed avatars and objects — no image uploads and no fixed sprite sheet to redraw.
- Shapes, material choices, palettes, seams, and borders remain independent, so the art is easy to remix by hand or with AI-assisted tooling.

### Character Customization
- 10 textile colors, 3 shapes (circle, square, diamond), 4 accessories (headphones, halo, beanie, none).
- Your look is encoded into a tiny 4-character **Avatar Hash** (e.g. `0c10`) that you can copy/paste to save or share.
- Procedural glow pulse animation. Everyone sees your custom avatar.

### Rooms & Furniture
- **Common Rooms** — server-curated persistent spaces (The Lobby, Zen Garden, Library) that never die when empty. Larger dimensions (1600×1000), higher player caps (20–25), pre-placed furniture. This is where you land by default.
- **Random Rooms** — empty no-owner public rooms for the matchmaker. They are separate from Common Rooms, so clicking "Go to a Random Room" will not drop you into The Lobby.
- **Private Rooms** — create a hidden retreat with a room code. Private rooms are the only user-owned spaces.
- **Build Mode (owner-only, private rooms only):** Place up to 100 furniture items per room. Grid-snapped, Sims/Habbo-style.
- **20 furniture types:** Storage Cube, Round Pouf, Stool, Floor Cushion, Chair, Plant, Lamp, Rug, Bed, Bathtub, Couch, Console, Computer, TV, Toilet, plus pets (Cat, Dog, Rabbit, Fishbowl, Bird).
- **Walkable vs. Solid:** Chairs, rugs, beds, couches, and pets let you walk through them. Tables, plants, and appliances block movement. No overlapping placement.
- **Interactive objects:** Lamps and TVs can be clicked by anyone to toggle on/off — glow and tint effects sync across the room.
- **Room Memory Cards:** Download a handmade-style PNG card of your room layout. Upload it later to reconstruct everything — including room theme and lamp/TV interactive states.
- **Bookmarks:** Save room codes in browser session storage so they survive refreshes without becoming an account or permanent tracking record.

### Presence & Comfort
- **Sit / Idle Animations:** Stand still for 5 seconds and your avatar smoothly sits down. Move or click and you stand back up.
- **Quiet Mode:** Toggle semi-transparency (35% opacity). While quiet, all incoming Vibe Checks are silently auto-declined. No notifications, no pressure.
- **Ambient Audio (private rooms):** Room owner can set shared ambience — Rain (pink noise), Drone (stacked sines), or Silence. Individual mute toggle available.
- **Music Maker (private rooms):** A personal 4×4 step sequencer with kick, snare, hi-hat, and synth tracks. BPM control, play/stop, purely local Web Audio synthesis.

### Communication
- **Emotes:** A full approved grid of emoji reactions that float above your head.
- **Signs:** 10-character text bubbles (only visible between Vibe-Checked pairs). The server strips weird control characters before anything gets shown.
- **Mute Stranger:** Click any avatar to open its action menu and mute its emotes — session-only, silent, reversible.
- **No global chat. No room chat.** Text is always gated behind mutual consent.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Phaser 3 (Canvas/WebGL), vanilla JS, HTML/CSS overlays, Web Audio API |
| Backend | Node.js, Express, Socket.IO |
| Hosting | Oracle Cloud Free Tier (1 vCPU, ~5GB disk, Ubuntu) |
| Process Manager | PM2 |
| Assets | Seven CC0 material scans + a runtime Canvas compositor that installs layered Phaser textures. No user uploads or external runtime asset calls. |

All room state lives in-memory. Common Rooms persist while the server is running; random and private rooms disappear when empty. No persistent database required.

The browser runtime, icon library, and fonts are served locally by FreeLobby. Loading the app does not require Google Fonts, unpkg, jsDelivr, or another third-party CDN.

### Safety and stability boundaries

- Socket payloads are size-limited, schema-normalized, and rate-limited before they can change room state.
- Furniture coordinates, rotations, types, themes, room codes, and avatar customization are validated server-side.
- Malformed custom-client events are rejected without terminating the server or disconnecting legitimate players.
- Idle players return to the landing screen while keeping the socket alive for a clean re-entry.
- Security headers restrict scripts, connections, framing, browser permissions, and content types.

---

## Deployment & Server Workflow

This project is deployed on an Oracle Cloud Ubuntu server. A Docker-based setup is in the works to make self-hosting a one-liner — until then, the manual steps below work fine.

### Local Development

```bash
npm install
node server/index.js
```

Then open `http://localhost:3000`.

Run the regression tests with:

```bash
npm test
```

The suite includes helper tests plus a real multi-client Socket.IO check for malformed payload handling, consent-gated signs, shell visibility state, and every self-hosted vendor route.
Pull requests run the same syntax and test checks on Node.js 20 and 22 through GitHub Actions.

Browser smoke tests should treat Chromium's `GPU stall due to ReadPixels` message during a screenshot of the Phaser canvas as a capture artifact. The application does not call `readPixels`; keep failing on other console warnings and errors.

### Deploying Updates to the Live Server

1. **Commit and push locally:**
   ```bash
   git add .
   git commit -m "What you changed"
   git push
   ```

2. **SSH into the server:**
   ```bash
   ssh ubuntu@<your-server-ip> -i <path-to-your-key>
   ```

3. **Pull and restart:**
   ```bash
   cd ~/FreeLobby
   git pull
   pm2 restart freelobby
   ```

*(PM2 keeps the Node.js server running in the background persistently, even after reboots.)*

---

## First-Time Server Setup

Setting up from scratch on a blank Ubuntu instance:

### 1. Install Node.js & NPM
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone & Install
```bash
cd ~
git clone https://github.com/zeidalidiez/FreeLobby.git
cd FreeLobby
npm install
```

### 3. Install & Configure PM2
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the server
pm2 start server/index.js --name freelobby

# Auto-resurrect on reboot
pm2 startup ubuntu
```
*(The `pm2 startup` command will spit out a custom `sudo` command. Copy and paste that into your terminal to finish the setup.)*

```bash
pm2 save
```

> **Production note:** the server itself listens on plain HTTP at port 3000. The live instance terminates TLS at a reverse proxy (Caddy/nginx + certbot). If you're self-hosting publicly, put a reverse proxy in front — a Docker-based setup that does this automatically is on the roadmap.

---

## License

MIT — FreeLobby is FOSS and anyone can run their own servers or build off of it. Not a product. Not a startup. A public service.

If it brightened your day, consider supporting its existence: https://ko-fi.com/zeiddiez
