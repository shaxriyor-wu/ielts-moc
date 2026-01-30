# Yangi Variant Qo'shish - Tezkor Qo'llanma

## 🎯 Qisqa Ko'rsatma

Yangi IELTS variant qo'shish uchun 3 ta oddiy qadam:

### 1️⃣ JSON Fayllarni Yaratish

**Listening:** `backend/exams/data/listening/section{1-4}/`
**Reading:** `backend/exams/data/reading/passage{1-3}/`
**Writing:** `backend/exams/data/writing/task{1-2}/`
**Speaking:** `backend/exams/data/speaking/part{1-3}/`

### 2️⃣ Audio/Rasm Fayllarni Joylashtirish

**Listening audio:** `backend/media/listening/audio/section{1-4}/`
**Reading images:** `backend/media/reading/images/`
**Writing images:** `backend/media/writing/images/task{1-2}/`

### 3️⃣ Admin Panelda Tekshirish

`localhost:3000/admin/variants` → Avtomatik ko'rinadi! ✅

---

## 📝 LISTENING Example

### Fayl: `section1_002.json`
```json
{
  "section_number": 1,
  "title": "Section 1: Questions 1-10",
  "context": "Example javob",
  "audio_url": "listening/audio/section1/02-Track2.mp3",
  "duration_minutes": 10,
  "questions": [
    {
      "id": 1,
      "type": "multiple",
      "question": "1. Savol matni?",
      "options": ["A. variant1", "B. variant2", "C. variant3"]
    },
    {
      "id": 2,
      "type": "fill",
      "question": "2. .................. gap"
    }
  ]
}
```

### Fayl: `section1_002_answers.json`
```json
{
  "section": "listening",
  "section_number": 1,
  "answers": [
    {
      "question_number": 1,
      "correct_answer": "A",
      "alternative_answers": [],
      "case_sensitive": false
    },
    {
      "question_number": 2,
      "correct_answer": "library",
      "alternative_answers": ["Library", "the library"],
      "case_sensitive": false
    }
  ]
}
```

---

## 🎧 Audio Fayllar

```bash
# Audio joylashuvi
backend/media/listening/audio/section1/02-Track2.mp3

# Qo'llab-quvvatlanadigan formatlar
.mp3, .wav, .ogg, .m4a
```

---

## ✅ Tekshirish

```bash
# JSON to'g'riligini tekshirish
cat backend/exams/data/listening/section1/section1_002.json | python3 -m json.tool

# Fayllar ro'yxati
ls -la backend/exams/data/listening/section1/

# Audio mavjudligi
ls -la backend/media/listening/audio/section1/
```

---

## 🚀 Avtomatik Sistema

✅ Yangi JSON qo'shsangiz → Admin panelda avtomatik ko'rinadi
✅ `_answers.json` fayllar → Avtomatik yashiriladi
✅ Preview → Student interfeysi kabi
✅ Variant tanlash → Random avtomatik

---

## 📚 To'liq Qo'llanma

Batafsil ma'lumot: `backend/exams/data/README_VARIANT_GUIDE.md`

---

## 🎯 Savol Turlari

| Type | Misol |
|------|-------|
| `multiple` | A, B, C variantlar |
| `fill` | Gap to'ldirish ........... |
| `tfng` | True/False/Not Given |
| `ynng` | Yes/No/Not Given |
| `matching` | Matching pairs |
| `short` | Qisqa javob |
| `completion` | Sentence completion |
| `diagram` | Diagram labeling |
| `table` | Table completion |

---

## ❗ Muhim

1. Fayl nomlari: `section1_XXX.json` (kichik harflar)
2. Javoblar: `section1_XXX_answers.json` (majburiy `_answers`)
3. JSON valid bo'lishi kerak
4. Audio yo'li to'g'ri ko'rsatilishi kerak

---

**Tayyor!** Endi variant qo'shishingiz mumkin! 🎉
