# 🚀 WBBT Records Ubuntu Deployment Guide (Port 3030)

This guide covers the **Standard Installation** on an Ubuntu server using **PM2** and **Nginx**.
The application (Frontend + Backend) runs on a single port: **3030**.

---

## 🛠️ Step 1: Server Preparation
Connect to your server via SSH and run these commands to install Node.js, Git, and PM2.

```bash
# 1. System Update
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# 3. Install Global Tools (PM2 & TSX)
sudo npm install -g pm2 tsx
```

---

## 📥 Step 2: Clone & Install
Download the code and set up the project.

```bash
# 1. Clone Repository (Replace URL with your repo)
git clone https://github.com/wbbtmusic/wbbt-records-app.git wbbt-records-app

# 2. Enter Directory
cd wbbt-records-app

# 3. Install Dependencies
npm install

# 4. Build Frontend
npm run build
```

---

## ⚙️ Step 3: Configuration
Create the environment file.

```bash
nano .env.local
```

Paste your local `.env.local` content here. **Ensure PORT is 3030.**
```env
PORT=3030
JWT_SECRET=your-secret-key
GEMINI_API_KEY=your-api-key
...
```
*(Press `CTRL+X`, then `Y`, then `Enter` to save)*

---

## 🚀 Step 4: Start with PM2
Start the application and ensure it starts on reboot.

```bash
# 1. Start Server
pm2 start ecosystem.config.cjs --env production

# 2. Save Process List
pm2 save

# 3. Generate Startup Script
pm2 startup
# (Run the command displayed in the output)
```

**Check Status:**
```bash
pm2 list
# You should see 'wbbt-server' status: online
```

---

## 🌐 Step 5: Nginx Configuration (Reverse Proxy)
To access your site via domain (`app.wbbt.net`) instead of `IP:3030`, set up Nginx.

```bash
# 1. Create Config File
sudo nano /etc/nginx/sites-available/wbbt
```

**Paste the following content:**
```nginx
server {
    listen 80;
    server_name app.wbbt.net;  # <--- YOUR DOMAIN

    location / {
        proxy_pass http://localhost:3030; # Forward to Port 3030
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Enable & Restart:**
```bash
# 1. Enable Site
sudo ln -s /etc/nginx/sites-available/wbbt /etc/nginx/sites-enabled/

# 2. Test Configuration
sudo nginx -t

# 3. Restart Nginx
sudo systemctl restart nginx
```

---

## 🔒 Step 6: SSL Certificate (HTTPS)
Secure your site with a free Let's Encrypt certificate.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d app.wbbt.net
```

---

## 🔄 How to Update?
When you push changes to GitHub, update the server easily:

```bash
cd ~/wbbt-records-app
./update.sh
```
