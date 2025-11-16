# Database URL Sozlash - Render.com

## Internal vs External Database URL

Render.com da PostgreSQL database yaratganda ikkita URL beriladi:

### 🔒 Internal Database URL (Ishlatilishi kerak)
- **Qayerda ishlatiladi**: Render servicelari orasida (backend → database)
- **Xususiyat**: Tez, xavfsiz, private network orqali
- **Qanday olish**: Database Info sahifasida **Internal Database URL** ni nusxalang
- **Format**: `postgresql://user:password@hostname:5432/database`

### 🌐 External Database URL (Ishlatilmaydi)
- **Qayerda ishlatiladi**: Tashqaridan ulanish uchun (local development)
- **Xususiyat**: Internet orqali, sekinroq
- **Qachon kerak**: Faqat local development uchun

## ✅ To'g'ri Sozlash

### Render.com Dashboard orqali:

1. Database → **Info** tab
2. **Internal Database URL** ni ko'ring (👁️ icon bosib)
3. **Copy** icon bosib nusxalang
4. Backend service → **Environment** tab
5. `DATABASE_URL` variable ga qo'ying

### render.yaml orqali:

`render.yaml` faylida avtomatik ravishda Internal URL ishlatiladi:

```yaml
- key: DATABASE_URL
  fromDatabase:
    name: ielts-moc-db
    property: internalConnectionString  # Internal URL
```

## ⚠️ Xatoliklar

Agar **External Database URL** ishlatsangiz:
- ❌ Sekin ishlaydi
- ❌ Xavfsizlik muammolari bo'lishi mumkin
- ❌ Render network afzalliklaridan foydalanmaydi

## 🔍 Tekshirish

Backend deploy bo'lgandan so'ng:
1. Backend → **Logs** tab
2. Database connection xatolari yo'qligini tekshiring
3. Agar xato bo'lsa, `DATABASE_URL` ni tekshiring

## 📝 Eslatma

- **Internal URL** faqat Render servicelari orasida ishlaydi
- Local development uchun **External URL** ishlatiladi
- Production da har doim **Internal URL** ishlatilishi kerak

