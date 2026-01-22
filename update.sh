#!/bin/bash

# Hata durumunda scripti durdur
set -e

echo "🔄 Update işlemi başlatılıyor..."

# 0. Güvenlik Yedeği Al (Veritabanı silinirse geri dönmek için)
if [ -f "server/wbbt.sqlite" ]; then
    echo "💾 Veritabanı yedekleniyor..."
    mkdir -p server/backups
    cp server/wbbt.sqlite "server/backups/wbbt_$(date +%Y%m%d_%H%M%S).sqlite"
fi

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
