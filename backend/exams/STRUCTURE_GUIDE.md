# IELTS Mock Test - Struktura Qo'llanmasi

## Papka Tuzilishi

### 1. Data Papkalari (backend/exams/data/)

JSON formatdagi variant fayllari:

```
data/
├── listening/
│   ├── section1/   # Section 1 variantlari (kundalik suhbat)
│   ├── section2/   # Section 2 variantlari (monolog)
│   ├── section3/   # Section 3 variantlari (akademik muhokama)
│   └── section4/   # Section 4 variantlari (ma'ruza)
├── reading/
│   ├── passage1/   # Passage 1 variantlari
│   ├── passage2/   # Passage 2 variantlari
│   └── passage3/   # Passage 3 variantlari
├── writing/
│   ├── task1/      # Task 1 variantlari (grafik tavsifi)
│   └── task2/      # Task 2 variantlari (esse)
└── speaking/
    ├── part1/      # Part 1 variantlari (tanishuv)
    ├── part2/      # Part 2 variantlari (cue card)
    └── part3/      # Part 3 variantlari (chuqur muhokama)
```

### 2. Media Papkalari (backend/media/)

Media fayllar (audio, images):

```
media/
├── listening/
│   ├── audio/      # Listening audio fayllari
│   │   ├── section1/
│   │   ├── section2/
│   │   ├── section3/
│   │   └── section4/
│   └── images/     # Listening savollardagi rasmlar
│       ├── section1/
│       ├── section2/
│       ├── section3/
│       └── section4/
├── reading/
│   └── images/     # Reading passagelardagi rasmlar
│       ├── passage1/
│       ├── passage2/
│       └── passage3/
├── writing/
│   └── images/     # Writing task rasmlari (grafik, jadval)
│       ├── task1/
│       └── task2/
└── speaking/
    └── audio/      # Speaking audio fayllari (AI uchun)
        ├── part1/
        ├── part2/
        └── part3/
```

## Qanday Ishlaydi?

### Test Yaratish Jarayoni

1. **User test boshlaydi**
2. **Backend random variant tuzadi:**
   - Listening: section1, section2, section3, section4 har biri alohida random tanlanadi
   - Reading: passage1, passage2, passage3 har biri alohida random tanlanadi
   - Writing: task1 va task2 random tanlanadi
   - Speaking: part1, part2, part3 har biri alohida random tanlanadi

3. **Takrorlanmaslik:**
   - User avval ishlagan variantlar saqlanadi
   - Faqat ishlatilmagan variantlar tanlanadi
   - Agar hammasi ishlatilgan bo'lsa, reset qilinadi

### Listening Audio Playback

1. Section 1 audio boshlanadi
2. Section 1 tugagach, avtomatik Section 2 boshlanadi
3. Section 2 tugagach, Section 3...
4. Section 4 tugagach, Listening test tugaydi

## Fayl Nomlash

### JSON Fayllar:
- `section1_001.json`, `section1_002.json`, ...
- `passage1_001.json`, `passage2_001.json`, ...
- `task1_001.json`, `task2_001.json`, ...
- `part1_001.json`, `part2_001.json`, ...

### Media Fayllar:
- Audio: `section1_001.mp3`, `section2_001.mp3`, ...
- Images: `section1_001_q5.jpg`, `passage1_001_diagram.png`, ...
- Writing images: `task1_001_chart.jpg`, `task1_002_table.png`, ...

## Misol JSON Strukturalari

Har bir papkada EXAMPLE_*.json fayllari mavjud. Ularni namuna sifatida ko'ring.

## Keyingi Qadamlar

1. ✅ Papka strukturasi yaratildi
2. ✅ Misol JSON fayllar yaratildi
3. ⏳ Django modellarni yangilash kerak
4. ⏳ Random variant generatsiya logikasi yozish
5. ⏳ Frontend audio playback tizimi
6. ⏳ User history tracking sistema
7. ⏳ Admin panel uchun variant management

---
Yaratilgan: 2026-01-27
