# 🚀 Render.com Quick Start Guide

## Tezkor Deploy Qadamlari

### 1️⃣ Database yaratish (5 daqiqa)

1. Render Dashboard → **New** → **PostgreSQL**
2. **Name**: `ielts-moc-db`
3. **Plan**: Free
4. **Region**: Frankfurt (EU Central)
5. **Create Database**
6. Database yaratilgandan so'ng, **Connection String** ni nusxalang

### 2️⃣ Backend Deploy (10 daqiqa)

1. Render Dashboard → **New** → **Web Service**
2. GitHub repository ni ulang
3. Sozlamalar:

```
Name: ielts-moc-backend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: backend
Environment: Python 3
Build Command: pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
Start Command: gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
```

4. **Environment Variables**:

```
SECRET_KEY=<random-string-generate-qiling>
DEBUG=False
DATABASE_URL=<internal-database-url-nusxalang>
PYTHON_VERSION=3.11.0
```

**Muhim**: Database Info sahifasida **Internal Database URL** ni nusxalang (External emas!)

5. **Create Web Service**

### 3️⃣ Frontend Deploy (5 daqiqa)

1. Render Dashboard → **New** → **Static Site**
2. GitHub repository ni ulang
3. Sozlamalar:

```
Name: ielts-moc-frontend
Branch: main
Root Directory: client
Build Command: npm install && npm run build
Publish Directory: client/dist
```

4. **Environment Variables**:

```
VITE_API_URL=https://ielts-moc-backend.onrender.com/api
```

(Backend URL ni o'zgartiring)

5. **Create Static Site**

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

- **Backend 500 error**: Database migration tekshiring
- **CORS error**: `CORS_ALLOWED_ORIGINS` ni tekshiring
- **Frontend API error**: `VITE_API_URL` ni tekshiring

## 📝 Eslatma

- Har bir service deploy bo'lishi uchun 5-10 daqiqa ketadi
- Free plan da service uxlab qolishi mumkin (15 daqiqa inactivity dan keyin)
- Birinchi marta ochilganda 30-60 soniya kutish kerak bo'lishi mumkin

