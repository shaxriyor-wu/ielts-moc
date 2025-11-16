# Deployment Guide - Render.com

Bu loyiha Django backend va React frontend dan iborat. Render.com ga deploy qilish uchun quyidagi qadamlarni bajaring.

## 📋 Talablar

1. GitHub repository (kod GitHub da bo'lishi kerak)
2. Render.com account
3. PostgreSQL database (Render tomonidan taqdim etiladi)

## 🚀 Deployment Qadamlari

### 1. Database yaratish

1. Render Dashboard → **New** → **PostgreSQL**
2. Database nomi: `ielts-moc-db`
3. Plan: **Free**
4. Region: **Frankfurt (EU Central)** (yoki o'zingizga qulay)
5. **Create Database** ni bosing
6. Database yaratilgandan so'ng, **Connection String** ni saqlang

### 2. Backend (Django) Deploy qilish

1. Render Dashboard → **New** → **Web Service**
2. GitHub repository ni ulang
3. Sozlamalar:
   - **Name**: `ielts-moc-backend`
   - **Region**: Frankfurt (database bilan bir xil)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: 
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**: 
     ```bash
     gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
     ```

4. **Environment Variables** qo'shing:
   ```
   SECRET_KEY=<generate-random-secret-key>
   DEBUG=False
   DATABASE_URL=<postgres-connection-string-from-step-1>
   PYTHON_VERSION=3.11.0
   ALLOWED_HOSTS=ielts-moc-backend.onrender.com,localhost,127.0.0.1
   CORS_ALLOWED_ORIGINS=https://ielts-moc-frontend.onrender.com
   FRONTEND_URL=https://ielts-moc-frontend.onrender.com
   ```

5. **Create Web Service** ni bosing
6. Deploy tugagandan so'ng, backend URL ni saqlang (masalan: `https://ielts-moc-backend.onrender.com`)

### 3. Frontend (React) Deploy qilish

1. Render Dashboard → **New** → **Static Site** (yoki Web Service)
2. GitHub repository ni ulang
3. Sozlamalar:
   - **Name**: `ielts-moc-frontend`
   - **Branch**: `main`
   - **Root Directory**: `client`
   - **Build Command**: 
     ```bash
     npm install && npm run build
     ```
   - **Publish Directory**: `client/dist`

4. **Environment Variables** qo'shing:
   ```
   VITE_API_URL=https://ielts-moc-backend.onrender.com/api
   ```

5. **Create Static Site** ni bosing
6. Deploy tugagandan so'ng, frontend URL ni saqlang

### 4. Backend CORS ni yangilash

Frontend URL olingandan so'ng, backend Environment Variables ga qaytib, `CORS_ALLOWED_ORIGINS` ni yangilang:

```
CORS_ALLOWED_ORIGINS=https://ielts-moc-frontend.onrender.com
FRONTEND_URL=https://ielts-moc-frontend.onrender.com
```

Backend ni **Manual Deploy** qiling.

### 5. Database Migration va User Initialization

Backend deploy bo'lgandan so'ng, Render Shell orqali:

1. Backend service → **Shell** tab
2. Quyidagi commandlarni bajaring:
   ```bash
   python manage.py migrate
   python manage.py init_users
   ```

Yoki backend build command ga `init_users` qo'shing.

## 🔧 Alternative: render.yaml fayli orqali

Agar `render.yaml` faylidan foydalanmoqchi bo'lsangiz:

1. GitHub ga `render.yaml` faylini commit qiling
2. Render Dashboard → **New** → **Blueprint**
3. GitHub repository ni tanlang
4. Render avtomatik ravishda barcha servicelarni yaratadi

**Eslatma**: `render.yaml` faylida environment variables ni to'g'ri sozlash kerak.

## 📝 Environment Variables Ro'yxati

### Backend:
- `SECRET_KEY` - Django secret key (generate qiling)
- `DEBUG` - `False` (production uchun)
- `DATABASE_URL` - PostgreSQL connection string
- `ALLOWED_HOSTS` - Backend domain
- `CORS_ALLOWED_ORIGINS` - Frontend URL
- `FRONTEND_URL` - Frontend URL
- `PYTHON_VERSION` - `3.11.0`

### Frontend:
- `VITE_API_URL` - Backend API URL (masalan: `https://ielts-moc-backend.onrender.com/api`)

## 🔐 Default Login Credentials

Deploy bo'lgandan so'ng, quyidagi credentials bilan login qilishingiz mumkin:

- **Owner**: `owner` / `owner123`
- **Admin**: `admin` / `admin123`
- **Student**: `student` / `student123`

## 🐛 Troubleshooting

### Backend xatolari:
- **Database connection error**: `DATABASE_URL` ni tekshiring
- **Static files error**: `collectstatic` command ishlatilganligini tekshiring
- **CORS error**: `CORS_ALLOWED_ORIGINS` ga frontend URL qo'shilganligini tekshiring

### Frontend xatolari:
- **API connection error**: `VITE_API_URL` ni tekshiring
- **Build error**: Node.js version ni tekshiring (18.17.0 yoki yuqori)

## 📚 Qo'shimcha Ma'lumot

- [Render Django Documentation](https://render.com/docs/deploy-django)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)

