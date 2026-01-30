# IELTS Variant Qo'shish Qo'llanmasi

Bu qo'llanma yangi IELTS test variantlarini tizimga qo'shish jarayonini tushuntiradi.

## Umumiy Ma'lumot

Tizim avtomatik ravishda quyidagi papkalarni skanerlaydi va JSON fayllarni topadi:
- `listening/section{1-4}/` - Listening testlar
- `reading/passage{1-3}/` - Reading testlar
- `writing/task{1-2}/` - Writing testlar
- `speaking/part{1-3}/` - Speaking testlar

**Muhim:** `_answers.json` bilan tugaydigan fayllar admin panelda ko'rinmaydi (avtomatik filter).

---

## LISTENING SECTION

### 1. Papka Tuzilishi

```
backend/exams/data/listening/
├── section1/
│   ├── section1_001.json          ← Savollar
│   ├── section1_001_answers.json  ← Javoblar
│   ├── section1_002.json          ← Ikkinchi variant
│   └── section1_002_answers.json
├── section2/
├── section3/
└── section4/
```

### 2. Audio Fayllar

```
backend/media/listening/audio/
├── section1/
│   ├── 01 - Track 1.mp3
│   ├── 02 - Track 2.mp3
│   └── ...
├── section2/
├── section3/
└── section4/
```

### 3. JSON Format (Savollar)

**Fayl nomi:** `section1_XXX.json` (masalan: `section1_001.json`, `section1_002.json`)

```json
{
  "section_number": 1,
  "title": "Section 1: Questions 1-10",
  "context": "Example: Penny's interview took place B last week.",
  "audio_url": "listening/audio/section1/01 - Track 1.mp3",
  "duration_minutes": 10,
  "questions": [
    {
      "id": 1,
      "type": "multiple",
      "question": "1. What kind of shop is it?",
      "options": [
        "A. a ladies' dress shop",
        "B. a department store",
        "C. a children's clothes shop"
      ]
    },
    {
      "id": 3,
      "type": "fill",
      "question": "Breaks: one hour for lunch and 3 .................... coffee breaks"
    }
  ]
}
```

### 4. JSON Format (Javoblar)

**Fayl nomi:** `section1_XXX_answers.json` (masalan: `section1_001_answers.json`)

```json
{
  "section": "listening",
  "section_number": 1,
  "answers": [
    {
      "question_number": 1,
      "correct_answer": "B",
      "alternative_answers": [],
      "case_sensitive": false
    },
    {
      "question_number": 3,
      "correct_answer": "15 minute",
      "alternative_answers": ["15 minutes", "fifteen minute", "fifteen minutes"],
      "case_sensitive": false
    }
  ]
}
```

### 5. Qo'llab-quvvatlanadigan Savol Turlari

| Type | Tavsif | Misol |
|------|--------|-------|
| `multiple` | Multiple choice (A, B, C) | "A. variant 1\nB. variant 2" |
| `fill` | Gap to'ldirish | "3 ................" |
| `tfng` | True/False/Not Given | "The sky is blue" |
| `ynng` | Yes/No/Not Given | "Do you agree?" |
| `matching` | Matching | List A va List B |
| `short` | Qisqa javob | "What is your name?" |
| `completion` | Sentence completion | "The capital is ..." |
| `diagram` | Diagramma | Image bilan |
| `table` | Jadval | Table structure |

---

## READING SECTION

### Papka Tuzilishi

```
backend/exams/data/reading/
├── passage1/
│   ├── passage1_001.json
│   ├── passage1_001_answers.json
│   └── ...
├── passage2/
└── passage3/
```

### JSON Format (Savollar)

```json
{
  "passage_number": 1,
  "title": "The History of Writing",
  "text": "Full passage text here...",
  "word_count": 850,
  "questions": [
    {
      "id": 1,
      "type": "multiple",
      "question": "What is the main idea?",
      "options": ["A. option1", "B. option2", "C. option3"]
    },
    {
      "id": 2,
      "type": "tfng",
      "question": "Writing started in Egypt.",
      "statement": "Writing started in Egypt."
    }
  ]
}
```

---

## WRITING SECTION

### Papka Tuzilishi

```
backend/exams/data/writing/
├── task1/
│   ├── task1_001.json
│   └── ...
└── task2/
    ├── task2_001.json
    └── ...
```

### JSON Format

```json
{
  "task_number": 1,
  "title": "Writing Task 1: Graph Description",
  "instructions": "Summarize the information by selecting and reporting...",
  "minimum_words": 150,
  "image_url": "writing/images/task1/graph_001.png",
  "key_features": [
    "Overall trend is increasing",
    "Peak occurred in 2020"
  ]
}
```

---

## SPEAKING SECTION

### Papka Tuzilishi

```
backend/exams/data/speaking/
├── part1/
│   ├── part1_001.json
│   └── ...
├── part2/
│   ├── part2_001.json
│   └── ...
└── part3/
    ├── part3_001.json
    └── ...
```

### JSON Format

**Part 1:**
```json
{
  "part_number": 1,
  "title": "Speaking Part 1: Introduction",
  "duration_minutes": 5,
  "topic": "Work and Study",
  "questions": [
    "Do you work or study?",
    "What do you like about your job?",
    "What are your future career plans?"
  ]
}
```

**Part 2 (Cue Card):**
```json
{
  "part_number": 2,
  "title": "Speaking Part 2: Long Turn",
  "duration_minutes": 4,
  "cue_card": {
    "topic": "Describe a place you like to visit",
    "points": [
      "Where it is",
      "How often you go there",
      "What you do there",
      "Why you like it"
    ]
  }
}
```

---

## Yangi Variant Qo'shish Jarayoni

### Listening uchun:

1. **Screenshot tayyorlang:**
   - Savollar sahifasi
   - Javoblar kaliti

2. **Audio faylni joylashtiring:**
   ```bash
   backend/media/listening/audio/section1/XX-TrackX.mp3
   ```

3. **JSON fayllarni yarating:**
   - `sectionX_00Y.json` - savollar
   - `sectionX_00Y_answers.json` - javoblar

4. **Papkaga joylashtiring:**
   ```bash
   backend/exams/data/listening/sectionX/
   ```

5. **Avtomatik ko'rinadi!**
   - Admin panelda "Variants" bo'limida avtomatik paydo bo'ladi
   - Answer fayllari ko'rinmaydi (filter)
   - Preview student interfeysi ko'rinishida

### Reading uchun:

1. **Passage matnini tayyorlang**
2. **Savollarni JSON formatga o'giring**
3. **Javoblar kalitini yarating**
4. **Papkaga joylashtiring:**
   ```bash
   backend/exams/data/reading/passageX/
   ```

### Writing uchun:

1. **Task instructions tayyorlang**
2. **Agar grafik/diagram bo'lsa, rasm yuklaang:**
   ```bash
   backend/media/writing/images/task1/
   ```
3. **JSON yarating va joylashtiring:**
   ```bash
   backend/exams/data/writing/taskX/
   ```

### Speaking uchun:

1. **Savollar ro'yxatini tayyorlang**
2. **Part 2 uchun cue card yarating**
3. **JSON yarating va joylashtiring:**
   ```bash
   backend/exams/data/speaking/partX/
   ```

---

## Tekshirish

### JSON sintaksisini tekshirish:

```bash
cat backend/exams/data/listening/section1/section1_001.json | python3 -m json.tool
```

### Fayllar ro'yxati:

```bash
ls -la backend/exams/data/listening/section1/
```

### Audio mavjudligini tekshirish:

```bash
ls -la backend/media/listening/audio/section1/
```

---

## Muhim Qoidalar

1. ✅ **Fayl nomlari:**
   - Savollar: `sectionX_XXX.json` (kichik harflar)
   - Javoblar: `sectionX_XXX_answers.json` (majburiy `_answers` suffiks)

2. ✅ **JSON format:**
   - Valid JSON bo'lishi kerak
   - UTF-8 encoding
   - To'g'ri belgilar (`"` double quotes)

3. ✅ **Audio fayllar:**
   - Qo'llab-quvvatlanadigan: MP3, WAV, OGG, M4A
   - To'g'ri `audio_url` yo'li

4. ✅ **Alternative javoblar:**
   - Har xil yozilishi mumkin bo'lgan javoblarni `alternative_answers` ga qo'shing
   - `case_sensitive: false` - katta-kichik harf farqi yo'q

5. ✅ **Question ID:**
   - Har bir savol unique `id` ga ega bo'lishi kerak
   - 1 dan boshlanadi va ketma-ket

---

## Tizim Ishlashi

### Avtomatik Skanerlovchi:

Backend `count_available_variants()` funksiyasi:
- Har safar admin "Variants" sahifasiga kirganda
- Barcha papkalarni skanerlaydi
- JSON fayllarni topadi
- `_answers.json` fayllarni filter qiladi
- Natijani frontend ga qaytaradi

### Variant Tanlash:

Mock test yaratilganda:
- `generate_test_variants()` har bir section uchun random JSON tanlaydi
- Student testga kirganda bu variantlar yuboriladi
- Audio fayllar avtomatik serve qilinadi

---

## Misollar

### Listening Section 1 (Mavjud):

```
backend/exams/data/listening/section1/section1_001.json
backend/exams/data/listening/section1/section1_001_answers.json
backend/media/listening/audio/section1/01 - Track 1.mp3
```

---

## Yordam

Muammo bo'lsa:
1. JSON sintaksisini tekshiring
2. Fayl nomlarini tekshiring (kichik harflar, to'g'ri format)
3. Audio fayl yo'lini tekshiring
4. Browser console log ga qarang
5. Django logs ni tekshiring

---

**Oxirgi yangilanish:** 2026-01-31
**Version:** 1.0
