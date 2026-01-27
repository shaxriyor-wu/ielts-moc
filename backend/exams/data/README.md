# IELTS Mock Test - Data Structure

Bu papkada IELTS mock test uchun barcha variantlar JSON formatida saqlanadi.

## Struktura

- **listening/** - Listening test section variant fayllari
  - section1/ - Listening Section 1 variantlari (oddiy kundalik suhbatlar)
  - section2/ - Listening Section 2 variantlari (monolog, kundalik vaziyatlar)
  - section3/ - Listening Section 3 variantlari (akademik muhit, guruh muhokamasi)
  - section4/ - Listening Section 4 variantlari (akademik ma'ruza)

- **reading/** - Reading test passage variant fayllari
  - passage1/ - Reading Passage 1 variantlari
  - passage2/ - Reading Passage 2 variantlari
  - passage3/ - Reading Passage 3 variantlari

- **writing/** - Writing task variant fayllari
  - task1/ - Writing Task 1 variantlari (grafik, jadval, diagramma tavsifi)
  - task2/ - Writing Task 2 variantlari (esse)

- **speaking/** - Speaking test variant fayllari
  - part1/ - Speaking Part 1 variantlari (tanishuv, oddiy savollar)
  - part2/ - Speaking Part 2 variantlari (cue card, individual long turn)
  - part3/ - Speaking Part 3 variantlari (chuqur muhokama)

## Fayl Nomlash Konvensiyasi

Har bir variant JSON faylini quyidagicha nomlang:
- Listening: `section1_001.json`, `section1_002.json`, ...
- Reading: `passage1_001.json`, `passage1_002.json`, ...
- Writing: `task1_001.json`, `task2_001.json`, ...
- Speaking: `part1_001.json`, `part2_001.json`, ...

## Muhim Eslatma

- Har bir section/passage/task uchun alohida JSON fayl yaratiladi
- Media fayllar (audio, images) `backend/media/` papkada saqlanadi
- JSON faylda media fayllarga nisbiy yo'l ko'rsatiladi
