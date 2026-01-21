#!/bin/bash

echo "🔄 Starting Update Process..."

# 1. Pull latest code
echo "⬇️  Pulling changes from Git..."
git pull origin main

# 2. Install dependencies
echo "📦 Installing dependencies..."
npm install

# 3. Build Frontend
echo "🏗️  Building React App..."
npm run build

# 4. Restart Server
echo "🚀 Restarting PM2 process..."
pm2 reload ecosystem.config.cjs --env production

echo "✅ Update Complete!"
