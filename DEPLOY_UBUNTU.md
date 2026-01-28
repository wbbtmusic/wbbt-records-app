# Ubuntu Sunucuda Sorunsuz Başlatma (Güncel)

Önceki yöntem "dev" modunda çalıştığı için sunucuda hata vermiş olabilir. Şimdi **Production (Canlı)** moduna geçiyoruz. Bu çok daha sağlam ve hızlıdır.

## 1. Hazırlık ve Dağıtım (Build)
Uygulamanın çalışması için önce "derlenmesi" (build edilmesi) gerekir. Proje klasöründe şu komutu çalıştır:

```bash
npm install
npm run build
```

*(Bu işlem `dist` klasörünü oluşturur)*

## 2. PM2 ile Başlatma
Eğer daha önce diğer yöntemle başlattıysan önce onu sil:
```bash
pm2 delete wbbt-records
```

Şimdi yeni sağlam modda başlat:
```bash
pm2 start ecosystem.config.cjs
```

## 3. Otomatik Başlatmayı Kaydetme
Sunucu kapanınca açılması için:

```bash
pm2 save
pm2 startup
```

---

## Sorun Çıkarsa Kontrol Et
Eğer hala açılmıyorsa loglara bak:
```bash
pm2 logs
```

**Not:** Bu yöntemle uygulama **3030** portunda çalışır. Tarayıcıdan `http://SUNUCU_IP:3030` adresine gidebilirsin.
