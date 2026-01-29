# Production Volume Setup Guide

## Media Files Volume Configuration

Productionda audio va rasmlar uchun volume ulash kerak. Media fayllar **backend'ga** ulash kerak, chunki ular Django orqali serve qilinmoqda.

## ⚠️ MUHIM: Volume va Environment Variable

Railway'da volume mount qilganda, **MEDIA_VOLUME_PATH** environment variable'ni **albatta** sozlash kerak. Aks holda media fayllar topilmaydi!

## Volume Ulash

### Railway Deployment

1. **Volume yaratish:**
   - Railway dashboard'da project'ingizga kiring
   - Backend service'ni tanlang
   - "Settings" → "Volumes" bo'limiga o'ting
   - "Attach Volume" tugmasini bosing
   - Volume nomini kiriting (masalan: `ielts-media`)
   - **Mount path:** `/app/media`

2. **Environment variable sozlash (MUHIM!):**
   - Backend service'ning "Variables" bo'limiga o'ting
   - Quyidagi environment variable'ni qo'shing:
     ```
     MEDIA_VOLUME_PATH=/app/media
     ```
   - **Bu qadamni o'tkazib yubormang!** Volume mount path bilan bir xil bo'lishi kerak.

3. **Service'ni redeploy qilish:**
   - O'zgarishlar qo'llanishi uchun service'ni redeploy qiling
   - Deploy log'larida quyidagilarni tekshiring:
     ```
     MEDIA_VOLUME_PATH: /app/media
     Found media source at: /app/media_bundled
     ✓ Media files copied to volume
     ✓ listening.m4a found
     ```

### Render Deployment

1. **Disk yaratish:**
   - Render dashboard'da project'ingizga kiring
   - "Disks" bo'limiga o'ting
   - "Create Disk" tugmasini bosing
   - Disk nomini va hajmini tanlang

2. **Backend service'ga disk ulash:**
   - Backend service'ingizni oching
   - "Settings" → "Disks" bo'limiga o'ting
   - Yaratilgan disk'ni tanlang va mount path'ni kiriting

3. **Environment variable sozlash:**
   ```
   MEDIA_VOLUME_PATH=/path/to/mounted/disk
   ```

## Media Fayllar Strukturasi

Volume ichida quyidagi struktura bo'lishi kerak:

```
/media/
├── audio_files/
│   └── listening.m4a
├── test_files/
├── speaking_audio/
│   └── 2026/
│       └── 01/
│           └── 28/
│               └── recording_*.webm
├── listening/
│   ├── audio/
│   └── images/
├── reading/
│   └── images/
├── writing/
│   └── images/
└── speaking/
    └── audio/
```

## Tekshirish

Volume to'g'ri ulanganligini tekshirish uchun:

1. Backend'ga SSH orqali ulaning
2. Quyidagi komandani bajaring:
   ```bash
   ls -la $MEDIA_VOLUME_PATH
   ```
3. Agar fayllar ko'rinmasa, volume mount path'ini tekshiring

## Muhim Eslatmalar

- **Volume faqat backend'ga ulash kerak** - frontend'ga emas
- Media fayllar `/media/` URL orqali serve qilinadi
- Volume path `MEDIA_VOLUME_PATH` environment variable orqali sozlanadi
- Agar `MEDIA_VOLUME_PATH` sozlanmagan bo'lsa, default `backend/media/` ishlatiladi
- Volume'ni ulashdan oldin, mavjud media fayllarni volume'ga ko'chirish kerak bo'lishi mumkin

## Media Fayllarni Ko'chirish

### Avtomatik Ko'chirish (Tavsiya etiladi)

Backend startup script avtomatik ravishda media fayllarni volume'ga ko'chiradi. Bu har safar backend restart qilinganda ishlaydi va faqat mavjud bo'lmagan fayllarni ko'chiradi.

Agar avtomatik ko'chirish ishlamasa, quyidagi komandani qo'lda bajaring:

```bash
# Backend container'ga ulanish
# Management command orqali media fayllarni ko'chirish
python manage.py init_media_files

# Yoki aniq source directory ko'rsatish
python manage.py init_media_files --source /app/backend/media

# Mavjud fayllarni ham qayta yozish uchun
python manage.py init_media_files --force
```

### Qo'lda Ko'chirish

Agar management command ishlamasa, quyidagi komandani ishlating:

```bash
# Backend container'ga ulanish
# Mavjud media fayllarni volume'ga ko'chirish
cp -r /app/backend/media/* /app/media/
```

**Muhim:** Volume'ga ko'chirishdan oldin, volume to'g'ri ulanganligini tekshiring:
```bash
ls -la $MEDIA_VOLUME_PATH
```

## Troubleshooting

### "Audio file not found" xatosi

1. **Volume to'g'ri ulanganligini tekshiring:**
   ```bash
   # Backend container'ga ulanish
   ls -la $MEDIA_VOLUME_PATH
   ```

2. **`MEDIA_VOLUME_PATH` environment variable'ni tekshiring:**
   ```bash
   echo $MEDIA_VOLUME_PATH
   ```
   Bu `/app/media` yoki mount qilgan path'ingizga mos bo'lishi kerak.

3. **Media fayllar volume'da mavjudligini tekshiring:**
   ```bash
   ls -la $MEDIA_VOLUME_PATH/audio_files/
   ```
   `listening.m4a` fayli mavjud bo'lishi kerak.

4. **Agar fayllar yo'q bo'lsa, avtomatik yuklashni ishga tushiring:**
   ```bash
   python manage.py init_media_files
   ```

5. **Backend log'larni tekshiring:**
   ```bash
   # Railway
   railway logs
   
   # Render
   render logs
   ```
   
   Startup log'larda quyidagi xabarni ko'rish kerak:
   ```
   ✓ Media files initialized
   ```

6. **Agar hali ham muammo bo'lsa, backend'ni restart qiling:**
   - Railway: Service'ni restart qiling
   - Render: Service'ni restart qiling

### Rasmlar ko'rinmayapti

1. Image fayllar volume'da mavjudligini tekshiring
2. File permissions'ni tekshiring
3. Media URL'lar to'g'ri qurilganligini tekshiring

