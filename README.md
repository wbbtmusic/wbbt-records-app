# 🎵 WBBT Records - Music Distribution Platform

A modern, full-featured music distribution platform built with **React, Vite, Node.js (Express), and SQLite**.
The entire system runs on a **single port (3030)** for easy deployment.

![Admin Panel](https://placehold.co/600x400?text=WBBT+Records)

## ✨ Features
- **Release Wizard**: Step-by-step music upload process.
- **Admin Panel**: Manage users, releases, withdrawals, and tickets.
- **Analytics**: Monthly listeners tracking via Apify integration.
- **Financials**: Earnings report and withdrawal requests.
- **Team Management**: Split royalties with collaborators.
- **Auto-Seeding**: Automatic Admin account creation.

---

## 🚀 Server Installation Guide (Ubuntu 20.04/22.04)

Follow these steps to deploy the application from scratch on a fresh server.

### 1️⃣ Prerequisites
Connect to your server via SSH and install the required tools:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20, Git, and Caddy
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git debian-keyring debian-archive-keyring apt-transport-https

# Install Caddy (Web Server & Auto SSL)
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install caddy

# Install Global Tools (PM2 & TSX)
sudo npm install -g pm2 tsx
```

### 2️⃣ Clone & Install
Download the source code and install dependencies:
```bash
# Clone the repository
git clone https://github.com/wbbtmusic/wbbt-records-app.git wbbt
cd wbbt

# Install packages
npm install

# Build the frontend
npm run build
```

### 3️⃣ Configuration
Create the environment file (`.env.local`) and configure settings.
```bash
nano .env.local
```
Paste your configuration (ensure `PORT=3030`):
```env
PORT=3030
JWT_SECRET=your-secure-secret-key-here
GEMINI_API_KEY=your-google-gemini-key
SPOTIFY_CLIENT_ID=your-id
SPOTIFY_CLIENT_SECRET=your-secret
```
*Save: `CTRL+X`, `Y`, `Enter`*

### 4️⃣ Start Application (PM2)
Start the server in the background:
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```
*Current status: The app is running on `http://localhost:3030`.*

---

## 🌐 Domain Setup (Caddy Reverse Proxy)
We use **Caddy** because it's easier than Nginx and handles SSL automatically.

### 1. Configure Caddy
Open the Caddyfile:
```bash
sudo nano /etc/caddy/Caddyfile
```

### 2. Add Your Domain
Delete everything and paste this (replace `app.wbbt.net` with your domain):
```caddy
app.wbbt.net {
    reverse_proxy localhost:3030
}
```
*Save: `CTRL+X`, `Y`, `Enter`*

### 3. Restart Caddy
```bash
sudo systemctl restart caddy
```

**✅ DONE!**
Go to `https://app.wbbt.net` in your browser. SSL is automatic.

---

## 🔄 How to Update?
To update your server with the latest code from GitHub:
```bash
cd ~/wbbt
./update.sh
```
Based on the `update.sh` script, this will:
1. `git pull` latest code.
2. `npm install` new dependencies.
3. `npm run build` frontend.
4. `pm2 restart` the server.

---

## 🛠️ Troubleshooting

Common issues and how to fix them.

### 1. `Connection refused` (Port 3030 is closed)
If you cannot access the site via IP, the server process might be down.
Check status manually to see the error:
```bash
# Stop PM2 temporarily
pm2 stop all

# Run server manually to see errors
npx tsx server/index-sqlite.ts
```
- If it says **"JWT_SECRET must be set..."** -> You forgot to create `.env.local`.
- If it says **"Address already in use"** -> Port is occupied (see below).

### 2. `EADDRINUSE: address already in use`
This means another process is using port 3030 (often an old zombie process).
**Fix:**
```bash
# Kill all Node processes
killall node

# Restart PM2
pm2 restart all
```

### 3. PM2 Process is `online` but site is down
This is a **Crash Loop**. The app starts and crashes immediately, so PM2 shows "online" for a split second.
**Diagnose:**
```bash
pm2 logs --lines 50
```
Look for errors like "SqliteError", "Missing env var", etc.

### 4. `Permission denied` for ./update.sh
You need to make the script executable:
```bash
chmod +x update.sh
```
