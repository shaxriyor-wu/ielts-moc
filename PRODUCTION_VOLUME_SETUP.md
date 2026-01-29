# Production Volume Setup Guide

## Media Files Volume Configuration

Productionda audio va rasmlar uchun volume ulash kerak. Media fayllar **backend'ga** ulash kerak, chunki ular Django orqali serve qilinmoqda.

## Volume Ulash

### Railway Deployment

1. **Volume yaratish:**
   - Railway dashboard'da project'ingizga kiring
   - "Volumes" bo'limiga o'ting
   - "New Volume" tugmasini bosing
   - Volume nomini kiriting (masalan: `ielts-media`)
   - Volume hajmini tanlang (masalan: 10GB)

2. **Backend service'ga volume ulash:**
   - Backend service'ingizni oching
   - "Settings" bo'limiga o'ting
   - "Volumes" bo'limida "Attach Volume" tugmasini bosing
   - Yaratilgan volume'ni tanlang
   - Mount path'ni kiriting: `/app/media` (yoki `/app/backend/media`)

3. **Environment variable sozlash:**
   - Backend service'ning "Variables" bo'limiga o'ting
   - Quyidagi environment variable'ni qo'shing:
     ```
     MEDIA_VOLUME_PATH=/app/media
     ```
     (yoki mount qilgan path'ingizga mos)

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

Agar mavjud media fayllar bo'lsa, ularni volume'ga ko'chirish:

```bash
# Backend container'ga ulanish
# Mavjud media fayllarni volume'ga ko'chirish
cp -r /app/backend/media/* /app/media/
```

## Troubleshooting

### "Audio file not found" xatosi

1. Volume to'g'ri ulanganligini tekshiring
2. `MEDIA_VOLUME_PATH` environment variable'ni tekshiring
3. Media fayllar volume'da mavjudligini tekshiring
4. Backend log'larni tekshiring:
   ```bash
   # Railway
   railway logs
   
   # Render
   render logs
   ```

### Rasmlar ko'rinmayapti

1. Image fayllar volume'da mavjudligini tekshiring
2. File permissions'ni tekshiring
3. Media URL'lar to'g'ri qurilganligini tekshiring

