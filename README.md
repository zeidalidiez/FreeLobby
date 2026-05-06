# FreeLobby

**A calm, safe, neon-lit corner of the internet for introverts who want a tiny hit of human connection without the pressure.**

FreeLobby is a browser-based multiplayer hangout space — imagine a minimal, low-pressure Habbo Hotel where nobody can talk to you without your consent. You show up as a glowing neon shape, wander around wireframe rooms, and if you vibe with someone, you can mutually agree to reveal your names. That's it. No logins. No tracking. No drama.

I built this because I wanted a space where quiet people can just *be* around other humans without the expectation to perform. Lurking is a valid playstyle here. Silence isn't awkward. You can sit in a room with strangers and feel a little less alone.

**Live at:** https://freelobby.zeiddiez.com/

---

## What's Here Right Now

### Core Experience
- **No login, no password, no accounts.** Just pick a name and drop in.
- **Vibe Check:** The heart of the safety system. You appear as "Stranger 1", "Stranger 2", etc. If someone wants to know your real name or chat with you, they send a Vibe Check. You can accept or silently decline. No guilt either way.
- **Flee Button:** One-click escape to a brand new empty room. Always available.
- **Anonymous by default.** Always.

### Neon/Tron Aesthetic
- Deep void-black worlds with electric cyan grid floors and glowing neon walls.
- Procedurally drawn avatars — no image uploads, no moderation nightmares.
- Everything is code-generated. Light, fast, and looks like a retro-futuristic dream.

### Character Customization
- 10 neon colors, 3 shapes (circle, square, diamond), 4 accessories (headphones, halo, beanie, none).
- Your look is encoded into a tiny 4-character **Avatar Hash** (e.g. `0c10`) that you can copy/paste to save or share.
- Procedural glow pulse animation. Everyone sees your custom avatar.

### Rooms & Furniture
- **Public or Private rooms** — create an open space or a hidden retreat.
- **Build Mode (owner-only):** Place up to 100 furniture items per room. Grid-snapped, Sims/Habbo-style.
- **8 furniture types:** Cube, Sphere, Cylinder, Pyramid, Chair, Plant, Lamp, Rug.
- **Walkable vs. Solid:** Chairs and rugs let you walk through them. Tables and plants block movement. No overlapping placement.
- **Room Memory Cards:** Download a cyberpunk PNG card of your room layout. Upload it later to reconstruct everything — including room theme and stacking layers for future-proofing.

### Communication
- **Emotes:** A full grid of emoji reactions that float above your head.
- **Signs:** 10-character text bubbles (only visible between Vibe-Checked pairs).
- **No global chat. No room chat.** Text is always gated behind mutual consent.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Phaser 3 (Canvas/WebGL), vanilla JS, HTML/CSS overlays |
| Backend | Node.js, Express, Socket.IO |
| Hosting | Oracle Cloud Free Tier (1 vCPU, ~5GB disk, Ubuntu) |
| Process Manager | PM2 |
| Assets | **100% procedural for now. Potentially image based/sprites** No user uploads. No database for core state. |

All room state lives in-memory. Rooms die when empty. No persistent database required.

---

## Deployment & Server Workflow

This project is deployed on an Oracle Cloud Ubuntu server. A Docker-based setup is in the works to make self-hosting a one-liner — until then, the manual steps below work fine.

### Local Development

```bash
npm install
node server/index.js
```

Then open `http://localhost:3000`.

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

---

## Special Thanks

A handful of friends and contributors have helped FreeLobby exist. In particular:

- **[Top Notch QA](https://topnotchqa.com)** — my employer. Grateful for the work, the people, and the slack to make things like this.

FreeLobby does not accept paid placement inside the product. The names listed here are personal thanks, not advertisers.
