# 🚀 IELTS MOC - Full-Stack Deployment Ready

Bu loyiha **bitta web service** sifatida Render.com ga deploy qilish uchun to'liq tayyorlangan.

## ✨ Xususiyatlar

- ✅ Django Backend + React Frontend bitta serviceda
- ✅ PostgreSQL database bilan integratsiya
- ✅ WhiteNoise orqali static files serve qilish
- ✅ SPA routing (React Router) qo'llab-quvvatlash
- ✅ Production-ready konfiguratsiya

## 📦 Struktura

```
ielts-moc/
├── backend/              # Django backend
│   ├── ielts_moc/       # Django project settings
│   ├── accounts/        # User management
│   ├── exams/          # Exam management
│   ├── student_portal/ # Student portal
│   └── grading/        # AI grading system
├── client/              # React frontend
│   ├── src/            # Source code
│   └── dist/           # Build output (generated)
├── render.yaml          # Render deployment config
└── build.sh            # Build script
```

## 🎯 Tez Boshlash

### Render.com ga Deploy (render.yaml orqali)

1. **GitHub ga push qiling**:
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Render Dashboard**:
   - [render.com](https://render.com) → **New** → **Blueprint**
   - Repository ni tanlang
   - Render avtomatik deploy qiladi

3. **Kuting** - Build vaqtida:
   - React frontend build qilinadi
   - Python dependencies o'rnatiladi
   - Database migrations ishga tushadi
   - Default users yaratiladi

4. **Tayyor!** - Web-sayt `https://your-service.onrender.com` da ishga tushadi

## 🔗 URL Strukturasi

Deploy bo'lgandan so'ng:

- **Frontend**: `https://your-service.onrender.com/`
- **API**: `https://your-service.onrender.com/api/`
- **Admin**: `https://your-service.onrender.com/admin/`

## 🔐 Default Login

- **Owner**: `owner` / `owner123`
- **Admin**: `admin` / `admin123`
- **Student**: `student` / `student123`

## 📚 Qo'shimcha Ma'lumot

Batafsil deployment qo'llanmasi: [RENDER_FULL_STACK_DEPLOY.md](./RENDER_FULL_STACK_DEPLOY.md)

## 🛠️ Local Development

```bash
# Backend
cd backend
python manage.py runserver

# Frontend (yangi terminal)
cd client
npm install
npm run dev
```

## ✅ Tayyor!

Barcha sozlamalar tayyor. Render.com ga deploy qilish uchun faqat GitHub ga push qiling va Render Blueprint yarating!

