# 🚀 WBBT Records Deployment Guide

Bu dosyada iki yöntem anlatılmaktadır:
1.  **Coolify ile Kurulum (En Kolayı & Otomatik Güncelleme)**
2.  **Manuel Linux Kurulumu (PM2 ile)**

---

## 🟢 YÖNTEM 1: Coolify ile Kurulum (Önerilen)

Coolify kullanıyorsan işin çok kolay. Her "git push" yaptığında sunucu kendini **otomatik günceller**.

### 1. Projeyi Ekle
*   Coolify Paneline gir -> **+ New Resource** -> **Public Repository**.
*   Repo URL: `https://github.com/wbbtmusic/wbbt-records-app`
*   **Check Repository** butonuna bas.

### 2. Ayarlar
*   **Build Pack:** `Nixpacks` seç.
*   **Port:** `3001` yaz.
*   **Continue** de.

### 3. Ortam Değişkenleri (Environment Variables)
*   Proje detayına gir -> **Environment Variables**.
*   Bilgisayarındaki `.env.local` dosyasının içindekileri buraya tek tek ekle veya "Bulk Edit" ile yapıştır.
    *   Özellikle `JWT_SECRET`, `GEMINI_API_KEY` vb.

### 4. Başlat
*   **Deploy** butonuna bas.
*   Bitti! Coolify otomatik olarak projeyi kurup 3001 portundan yayına alır.
*   Domain ayarlarından domainini bağlayabilirsin (örn: `panel.wbbt.net`).

---

## 🔴 YÖNTEM 2: Manuel Linux Kurulumu (PM2)
Eğer Coolify yoksa, klasik yöntemle şöyle kurarsın:

### 1. Kodları GitHub'a Atma (Bilgisayarında)
Konfüçyüs der ki: "Kod Github'da değilse, o kod hiç yazılmamıştır."
... (Devamı aşağıda)
1.  VS Code'da sol menüdeki **Source Control** (Dallı ikon) sekmesine gel.
2.  "Publish directly" diye bir buton varsa bas. Yoksa şu komutları terminale yaz:
    ```bash
    git init
    git add .
    git commit -m "ilk yükleme"
    # GitHub'da yeni bir repo oluştur ve sana verdiği linki aşağıya koy:
    git remote add origin https://github.com/wbbtmusic/wbbt-records-app.git
    git push -u origin main
    ```

## 2. Sunucuya Kurulum (Sunucuda)
Sunucuna (siyah ekran/terminal) bağlandığında sırasıyla şunları yapıştır:

**Adım A: Gerekli Programları Kur**
*(Hepsini tek seferde kopyala yapıştır)*
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git
sudo npm install -g pm2 tsx
```

**Adım B: Projeyi Çek**
```bash
# Repo adresini değiştirmeyi unutma!
git clone https://github.com/wbbtmusic/wbbt-records-app.git wbbt
cd wbbt
npm install
npm run build
```

**Adım C: Ayarları Yap**
```bash
nano .env.local
```
*   Açılan ekrana, kendi bilgisayarındaki `.env.local` dosyasının içindekileri kopyala yapıştır.
*   Kaydetmek için: `CTRL` + `X` tuşuna bas, sonra `Y` tuşuna bas, sonra `Enter`'a bas.

**Adım D: Başlat**
```bash
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup
```
*(Son komut sana bir kod verirse, onu kopyalayıp tekrar yapıştır).*

Şu an siten `http://localhost:3001` adresinde çalışıyor ama dışarıdan girilemez.

## 3. Dünyaya Açma (Cloudflare Tunnel)
Port açmakla uğraşmamak için en kolayı bu.

1.  [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) paneline gir.
2.  **Networks > Tunnels** menüsüne git -> **Create a Tunnel**.
3.  **Cloudflared** seç -> Sonraki ekran -> **Debian / Ubuntu** seç.
4.  Sana verdiği uzun kodu kopyala (başında `curl` yazar) ve sunucuna yapıştır.
5.  **Public Hostname** kısmına gel:
    *   **Domain:** Kendi domainini seç (örn: `wbbt.net`).
    *   **Subdomain:** (İstersen) `panel` yaz.
    *   **Service:** `HTTP` seç ve `localhost:3001` yaz.
6.  **Save** de.

**BİTTİ!** Artık `panel.wbbt.net` adresinden sitene girebilirsin.

---

## 🔄 Güncelleme Nasıl Yapılır?
Bilgisayarında kod değişikliği yaptın ve GitHub'a attın. Sunucuyu güncellemek için:

1.  Sunucuya bağlan.
2.  Proje klasörüne gir: `cd wbbt`
3.  Sihirli komutu çalıştır:
    ```bash
    ./update.sh
    ```
*(Eğer "permission denied" derse önce `chmod +x update.sh` yaz).*
Bu kadar! Kendi kendine güncelleyip yeniden başlatır.
