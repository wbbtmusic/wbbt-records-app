#!/bin/bash

# Hata durumunda scripti durdur
set -e

echo "🔄 Update işlemi başlatılıyor..."

# 1. En güncel kodu çek
echo "⬇️  Git changes çekiliyor..."
git pull origin main

# 2. Bağımlılıkları yükle
echo "📦 NPM paketleri yükleniyor..."
npm install

# 3. Frontend Build al
echo "🏗️  React Build alınıyor..."
npm run build

# 4. Sunucuyu Yeniden Başlat
echo "🚀 PM2 servisi yeniden başlatılıyor..."
# Reload çalışmazsa restart dene
pm2 reload ecosystem.config.cjs --env production || pm2 restart ecosystem.config.cjs --env production

echo "✅ Güncelleme başarıyla tamamlandı!"
