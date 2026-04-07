# FreeLobby

FreeLobby is a calm, serene social multiplayer experience that connects strangers in anonymous, Vibe Check-gated rooms for peaceful conversations.

## Deployment & Server Workflow

This project is deployed on an Oracle Cloud Ubuntu server. 

### Local Development
To run the server locally, open the repository root and use:
```bash
npm install
node server/index.js
```

### Deploying Updates to the Live Server

Whenever you make changes to the code locally, follow these steps to push them live:

1. **Commit and Push Local Changes:**
   In your local terminal (where you code):
   ```bash
   git add .
   git commit -m "Update"
   git push
   ```

2. **SSH into the Server:**
   Connect to your remote Ubuntu instance:
   ```bash
   ssh ubuntu@147.224.35.250 -i "C:\Users\zeidd\.ssh\ssh.key"
   ```

3. **Pull and Restart:**
   Once logged in to the remote server, navigate to the project directory, pull the fresh code, and restart the PM2 process manager so it picks up the changes seamlessly:
   ```bash
   cd ~/FreeLobby
   git pull
   pm2 restart freelobby
   ```

*(Note: PM2 is configured to keep the Node.js server running in the background persistently.)*

---

## First-Time Server Setup

If you ever need to set up the server completely from scratch on a blank Ubuntu instance, follow these steps.

### 1. Install Node.js & NPM
First, install Node.js (which comes with npm):
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Clone the Repository
Clone the repository to your server and install the Node dependencies:
```bash
cd ~
git clone https://github.com/zeidalidiez/FreeLobby.git
cd FreeLobby
npm install
```

### 3. Install & Configure PM2
PM2 is a production process manager that keeps your server alive automatically, even if it crashes.
```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the Node server inside PM2 and name the process "freelobby"
pm2 start server/index.js --name freelobby

# Tell PM2 to automatically resurrect the server if the Ubuntu machine reboots
pm2 startup ubuntu
```
*(Note: The `pm2 startup` command will generate a custom `sudo` command. You must copy and paste that generated command into your terminal to finalize the setup!)*

```bash
# Save your current PM2 configuration so the startup script knows what to launch
pm2 save
```
