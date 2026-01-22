# 🎵 WBBT Records - Music Distribution Platform

A modern, full-featured music distribution platform built with **React, Vite, Node.js (Express), and SQLite**.

![Admin Panel](https://placehold.co/600x400?text=WBBT+Records)

## ✨ Features
- **Release Wizard**: Step-by-step music upload process.
- **Admin Panel**: Manage users, releases, withdrawals, and tickets.
- **Analytics**: Monthly listeners tracking via Apify integration.
- **Financials**: Earnings report and withdrawal requests.
- **Team Management**: Split royalties with collaborators.
- **Auto-Seeding**: Automatic Admin account creation.

## 🚀 Tech Stack
- **Frontend**: React 19, TailwindCSS, Lucide Icons, Recharts.
- **Backend**: Node.js, Express, Better-SQLite3.
- **Security**: Helmet, Rate Limiting, BCrypt.
- **Deployment**: PM2, Docker (Optional), Cloudflare Tunnel ready.

## 🛠️ Installation (Local)

1. **Clone the repo**
   ```bash
   git clone https://github.com/wbbtmusic/wbbt-records-app.git
   cd wbbt-records-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Setup Environment**
   Duplicate `.env.example` to `.env.local` and fill in keys.

4. **Run Development Server**
   ```bash
   npm start
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

## 🌍 Deployment

### Option 1: Coolify (Recommended)
1. Add new resource -> Public Repository.
2. Paste repo URL.
3. Build Pack: **Nixpacks**.
4. Port: **3001**.
5. Enable **Autodeploy**.

### Option 2: Linux + PM2
See [deployment.md](./deployment.md) for detailed instructions.

---
