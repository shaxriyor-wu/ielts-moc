# Render.com Full-Stack Deployment Guide

Bu loyiha Django backend va React frontend dan iborat **bitta web service** sifatida Render.com ga deploy qilinadi.

## 🎯 Deployment Strukturasi

- **Bitta Web Service**: Django backend va React frontend birlashtirilgan
- **Database**: PostgreSQL (Render tomonidan taqdim etiladi)
- **Static Files**: WhiteNoise orqali Django tomonidan serve qilinadi
- **Frontend**: React build Django static files qatori sifatida serve qilinadi

## 📋 Talablar

1. GitHub repository (kod GitHub da bo'lishi kerak)
2. Render.com account
3. PostgreSQL database (Render tomonidan taqdim etiladi)

## 🚀 Render.com ga Deploy Qilish

### Variant 1: render.yaml fayli orqali (Tavsiya etiladi)

1. **GitHub ga kodni push qiling**:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Render Dashboard ga kiring**:
   - [render.com](https://render.com) → **Dashboard**

3. **Blueprint yaratish**:
   - **New** → **Blueprint**
   - GitHub repository ni tanlang
   - Render avtomatik ravishda `render.yaml` faylini topadi va barcha servicelarni yaratadi

4. **Environment Variables ni tekshiring**:
   - Service → **Environment** tab
   - Quyidagi variables mavjudligini tekshiring:
     - `SECRET_KEY` (avtomatik generate qilinadi)
     - `DATABASE_URL` (avtomatik database dan olinadi)
     - `DEBUG=False`
     - `PYTHON_VERSION=3.11.0`
     - `NODE_VERSION=18.17.0`

5. **Deploy ni kuting**:
   - Build vaqtida:
     - React frontend build qilinadi
     - Python dependencies o'rnatiladi
     - Django static files collect qilinadi
     - Database migrations ishga tushadi
     - Default users yaratiladi

### Variant 2: Manual Deploy

1. **Database yaratish**:
   - Render Dashboard → **New** → **PostgreSQL**
   - Name: `ielts-moc-db`
   - Plan: **Free**
   - Region: **Frankfurt (EU Central)**
   - **Create Database**

2. **Web Service yaratish**:
   - Render Dashboard → **New** → **Web Service**
   - GitHub repository ni ulang
   - Sozlamalar:
     - **Name**: `ielts-moc-app`
     - **Region**: Frankfurt (database bilan bir xil)
     - **Branch**: `main`
     - **Root Directory**: (bo'sh qoldiring - root directory)
     - **Environment**: `Python 3`
     - **Build Command**: 
       ```bash
       cd client && npm install && npm run build && cd .. && pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
       ```
     - **Start Command**: 
       ```bash
       cd backend && gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
       ```

3. **Environment Variables**:
   ```
   PYTHON_VERSION=3.11.0
   NODE_VERSION=18.17.0
   SECRET_KEY=<generate-random-secret-key>
   DEBUG=False
   DATABASE_URL=<postgres-connection-string-from-database>
   ALLOWED_HOSTS=<your-service-name>.onrender.com
   NODE_ENV=production
   ```

4. **Database ni ulash**:
   - Service → **Environment** tab
   - **Link Database** → `ielts-moc-db` ni tanlang
   - `DATABASE_URL` avtomatik qo'shiladi

5. **Deploy**:
   - **Manual Deploy** → **Deploy latest commit**

## 🔧 Build Process

Deploy paytida quyidagi qadamlardan o'tiladi:

1. **Frontend Build**:
   ```bash
   cd client
   npm install
   npm run build
   ```
   - React app `client/dist` papkasiga build qilinadi

2. **Backend Setup**:
   ```bash
   pip install -r backend/requirements.txt
   cd backend
   python manage.py collectstatic --noinput
   python manage.py migrate
   python manage.py init_users
   ```
   - Python dependencies o'rnatiladi
   - Static files (React build bilan) collect qilinadi
   - Database migrations ishga tushadi
   - Default users yaratiladi

3. **Start Server**:
   ```bash
   gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
   ```

## 📁 File Structure

```
ielts-moc/
├── backend/              # Django backend
│   ├── ielts_moc/       # Django project
│   ├── accounts/        # Accounts app
│   ├── exams/          # Exams app
│   ├── student_portal/ # Student portal app
│   ├── grading/        # Grading app
│   └── requirements.txt
├── client/              # React frontend
│   ├── src/            # Source files
│   ├── dist/           # Build output (generated)
│   └── package.json
└── render.yaml          # Render configuration
```

## 🌐 URL Structure

Deploy bo'lgandan so'ng:

- **Frontend**: `https://your-service.onrender.com/`
- **API**: `https://your-service.onrender.com/api/`
- **Admin**: `https://your-service.onrender.com/admin/`
- **Static Files**: `https://your-service.onrender.com/static/`
- **Media Files**: `https://your-service.onrender.com/media/`

## 🔐 Default Login Credentials

Deploy bo'lgandan so'ng, quyidagi credentials bilan login qilishingiz mumkin:

- **Owner**: 
  - Username: `owner`
  - Password: `owner123`

- **Admin**: 
  - Username: `admin`
  - Password: `admin123`

- **Student**: 
  - Username: `student`
  - Password: `student123`

## 🐛 Troubleshooting

### Build Xatolari

**"Frontend build not found"**:
- Build command da React build qilinayotganini tekshiring
- `client/dist` papkasi yaratilganini tekshiring
- Build logs ni ko'rib chiqing

**"Module not found"**:
- `requirements.txt` da barcha dependencies borligini tekshiring
- `package.json` da barcha dependencies borligini tekshiring

### Database Xatolari

**"Database connection error"**:
- `DATABASE_URL` environment variable ni tekshiring
- Database service running ekanligini tekshiring
- Database ni service ga link qilganingizni tekshiring

### Static Files Xatolari

**"Static files not loading"**:
- `collectstatic` command ishlatilganini tekshiring
- `STATIC_ROOT` to'g'ri sozlanganini tekshiring
- WhiteNoise middleware qo'shilganini tekshiring

### CORS Xatolari

**"CORS policy error"**:
- Frontend va backend bitta domain da ishlayotgani uchun CORS muammosi bo'lmasligi kerak
- Agar alohida frontend service bo'lsa, `CORS_ALLOWED_ORIGINS` ga frontend URL qo'shing

## 📝 Environment Variables Ro'yxati

### Majburiy Variables:

- `SECRET_KEY` - Django secret key (generate qiling)
- `DATABASE_URL` - PostgreSQL connection string (database dan avtomatik)
- `DEBUG` - `False` (production uchun)
- `PYTHON_VERSION` - `3.11.0`
- `NODE_VERSION` - `18.17.0`

### Ixtiyoriy Variables:

- `ALLOWED_HOSTS` - Service domain (avtomatik)
- `CORS_ALLOWED_ORIGINS` - CORS origins (agar kerak bo'lsa)
- `FRONTEND_URL` - Frontend URL (agar alohida bo'lsa)

## 🔄 Update Qilish

Kod o'zgarganida:

1. GitHub ga push qiling:
   ```bash
   git add .
   git commit -m "Update code"
   git push origin main
   ```

2. Render avtomatik ravishda yangi deploy ni boshlaydi
3. Yoki manual ravishda **Manual Deploy** → **Deploy latest commit**

## 📚 Qo'shimcha Ma'lumot

- [Render Django Documentation](https://render.com/docs/deploy-django)
- [Render Blueprint Specification](https://render.com/docs/blueprint-spec)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [WhiteNoise Documentation](https://whitenoise.readthedocs.io/)

## ✅ Deploy Checklist

Deploy dan oldin tekshiring:

- [ ] `render.yaml` fayli mavjud va to'g'ri sozlangan
- [ ] `requirements.txt` da barcha dependencies bor
- [ ] `package.json` da barcha dependencies bor
- [ ] Database migrations tayyor
- [ ] Environment variables sozlangan
- [ ] GitHub repository public yoki Render ga access berilgan
- [ ] Build command to'g'ri ishlaydi (local test)
- [ ] Static files to'g'ri collect qilinadi

## 🎉 Muvaffaqiyatli Deploy!

Agar barcha qadamlarni to'g'ri bajarsangiz, web-sayt `https://your-service.onrender.com` manzilida ishga tushadi.

Frontend va backend bitta URL da ishlaydi:
- `/` - React frontend
- `/api/` - Django API
- `/admin/` - Django admin panel

