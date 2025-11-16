# 🚀 Render.com Quick Start Guide

## ⚡ Avtomatik Deploy (Tavsiya etiladi)

Agar `render.yaml` fayli repository da bo'lsa, Render avtomatik ravishda barcha servicelarni deploy qiladi:

1. Render Dashboard → **New** → **Blueprint**
2. GitHub repository ni ulang
3. **Apply** tugmasini bosing
4. Render avtomatik ravishda:
   - Database yaratadi
   - Backend deploy qiladi
   - Frontend deploy qiladi
   - Environment variable'larni sozlaydi

**Muhim**: Frontend deploy bo'lgandan so'ng, backend da CORS sozlamalarini qo'lda qo'shing (4-bosqichga qarang).

---

## 📋 Qo'lda Deploy Qadamlari

### 1️⃣ Database yaratish (5 daqiqa)

1. Render Dashboard → **New** → **PostgreSQL**
2. **Name**: `ielts-moc-db`
3. **Plan**: Free
4. **Region**: Frankfurt (EU Central)
5. **Create Database**
6. Database yaratilgandan so'ng, **Connection String** ni nusxalang

### 2️⃣ Backend Deploy (10 daqiqa)

1. Render Dashboard → **New** → **Web Service**
2. GitHub repository ni ulang (yoki repository ni tanlang)
3. **Forma sozlamalari** (har bir maydonni to'ldiring):

#### 📝 Asosiy Sozlamalar:

**Project Association:**
- Dropdown dan: **"My project"** yoki yangi project yarating

**Language:**
- Dropdown dan: **"Python 3"** ni tanlang (Node emas!)

**Branch:**
- Dropdown dan: **"main"** ni tanlang

**Region:**
- Radio button: **"Frankfurt (EU Central)"** ni tanlang
- (Agar boshqa region bo'lsa, u yerda mavjud servicelaringiz bilan bir regionni tanlang)

**Root Directory (Optional):**
- Input field ga: `backend` yozing
- ⚠️ **Muhim**: Bu maydonni to'ldirish shart! Aks holda Django fayllarini topa olmaydi

**Build Command:**
- Input field ga quyidagini yozing:
```
pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
```
- Yoki agar Root Directory `backend` bo'lsa:
```
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
```

**Start Command:**
- Input field ga quyidagini yozing:
```
cd backend && gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
```
- Yoki agar Root Directory `backend` bo'lsa:
```
gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
```

**Instance Type:**
- **"Free"** ni tanlang (512 MB RAM, $0/month)
- Yoki agar pullik plan kerak bo'lsa, **"Starter"** ($7/month) yoki boshqa plan

#### 🔐 Environment Variables:

**"+ Add Environment Variable"** tugmasini bosing va quyidagilarni qo'shing:

1. **PYTHON_VERSION**
   - Key: `PYTHON_VERSION`
   - Value: `3.11.0`

2. **SECRET_KEY**
   - Key: `SECRET_KEY`
   - Value: **"Generate"** tugmasini bosing (yoki o'zingiz random string yarating)
   - Masalan: `django-insecure-abc123xyz789...` (uzun random string)

3. **DEBUG**
   - Key: `DEBUG`
   - Value: `False`

4. **DATABASE_URL**
   - Key: `DATABASE_URL`
   - Value: Database yaratilgandan so'ng, Database service → **"Info"** tab → **"Internal Database URL"** ni nusxalang
   - ⚠️ **Muhim**: **External Database URL** emas, **Internal Database URL** ni oling!
   - Format: `postgresql://user:password@host:port/database`

5. **CORS_ALLOWED_ORIGINS** (Frontend deploy bo'lgandan keyin qo'shing)
   - Key: `CORS_ALLOWED_ORIGINS`
   - Value: `https://ielts-moc-frontend.onrender.com`
   - (Frontend URL ni o'zgartiring)

6. **FRONTEND_URL** (Frontend deploy bo'lgandan keyin qo'shing)
   - Key: `FRONTEND_URL`
   - Value: `https://ielts-moc-frontend.onrender.com`
   - (Frontend URL ni o'zgartiring)

#### ✅ Yakuniy Qadam:

1. Barcha sozlamalarni tekshiring
2. **"Deploy Web Service"** tugmasini bosing
3. Deploy jarayoni 5-10 daqiqa davom etadi
4. Deploy tugagach, service URL ni tekshiring: `https://ielts-moc-backend.onrender.com/`

### 3️⃣ Frontend Deploy (5 daqiqa)

1. Render Dashboard → **New** → **Static Site**
2. GitHub repository ni ulang (yoki repository ni tanlang)
3. **Forma sozlamalari**:

#### 📝 Asosiy Sozlamalar:

**Project Association:**
- Dropdown dan: **"My project"** ni tanlang (backend bilan bir xil project)

**Branch:**
- Dropdown dan: **"main"** ni tanlang

**Root Directory:**
- Input field ga: `client` yozing
- ⚠️ **Muhim**: Bu maydonni to'ldirish shart!

**Build Command:**
- Input field ga quyidagini yozing:
```
cd client && npm install && npm run build
```
- Yoki agar Root Directory `client` bo'lsa:
```
npm install && npm run build
```

**Publish Directory:**
- Input field ga: `client/dist` yozing
- Yoki agar Root Directory `client` bo'lsa: `dist`

#### 🔐 Environment Variables:

**"+ Add Environment Variable"** tugmasini bosing va quyidagilarni qo'shing:

1. **NODE_VERSION**
   - Key: `NODE_VERSION`
   - Value: `18.17.0`

2. **VITE_API_URL**
   - Key: `VITE_API_URL`
   - Value: `https://ielts-moc-backend.onrender.com/api`
   - ⚠️ **Muhim**: Backend service deploy bo'lgandan so'ng, uning URL ni oling va shu yerga yozing
   - Format: `https://YOUR-BACKEND-NAME.onrender.com/api`

3. **NODE_ENV** (ixtiyoriy)
   - Key: `NODE_ENV`
   - Value: `production`

#### ✅ Yakuniy Qadam:

1. Barcha sozlamalarni tekshiring
2. **"Create Static Site"** tugmasini bosing
3. Deploy jarayoni 5-10 daqiqa davom etadi
4. Deploy tugagach, frontend URL ni oling: `https://ielts-moc-frontend.onrender.com`
5. **Muhim**: Frontend URL ni nusxalab, Backend service ga CORS sozlamalarini qo'shing (4-bosqichga qarang)

### 4️⃣ CORS Sozlash

Frontend deploy bo'lgandan so'ng:

1. Backend service → **Environment** tab
2. Quyidagi variable qo'shing:

```
CORS_ALLOWED_ORIGINS=https://ielts-moc-frontend.onrender.com
FRONTEND_URL=https://ielts-moc-frontend.onrender.com
```

3. **Save Changes** → Backend avtomatik redeploy bo'ladi

## ✅ Tekshirish

1. Frontend URL ni oching
2. Login qiling:
   - Owner: `owner` / `owner123`
   - Admin: `admin` / `admin123`
   - Student: `student` / `student123`

## 🔧 Muammolar?

### Backend 404 Error
- ✅ Root URL (`/`) endi ishlaydi - API ma'lumotlarini ko'rsatadi
- Agar boshqa URL lar ishlamasa, URL patterns ni tekshiring

### Backend 500 Error
- Database migration tekshiring: `python manage.py migrate`
- Environment variable'larni tekshiring (SECRET_KEY, DATABASE_URL)
- Logs ni ko'rib chiqing: Render Dashboard → Backend Service → Logs

### CORS Error
- Backend da `CORS_ALLOWED_ORIGINS` ni tekshiring
- Frontend URL ni to'g'ri qo'shing: `https://ielts-moc-frontend.onrender.com`
- `FRONTEND_URL` environment variable ni ham qo'shing

### Frontend API Error
- `VITE_API_URL` ni tekshiring (build vaqtida o'rnatiladi)
- Backend URL to'g'ri ishlayotganini tekshiring
- Browser Console da xatolarni ko'ring

### Frontend Blank Page
- Build loglarni tekshiring
- `client/dist` papkasi yaratilganini tekshiring
- Browser Console da JavaScript xatolarini ko'ring

## 📝 Eslatma

- Har bir service deploy bo'lishi uchun 5-10 daqiqa ketadi
- Free plan da service uxlab qolishi mumkin (15 daqiqa inactivity dan keyin)
- Birinchi marta ochilganda 30-60 soniya kutish kerak bo'lishi mumkin

