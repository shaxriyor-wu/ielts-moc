# 📋 Render Dashboard Formasi - To'liq Sozlamalar

Bu fayl Render dashboard'da yangi service yaratishda har bir maydonni qanday to'ldirishni ko'rsatadi.

---

## 🔵 Backend Web Service Formasi

### 1. Project Association
- **Dropdown**: "My project" ni tanlang yoki yangi project yarating

### 2. Language
- **Dropdown**: **"Python 3"** ni tanlang
- ⚠️ **Xato**: "Node" ni tanlamang!

### 3. Branch
- **Dropdown**: **"main"** ni tanlang

### 4. Region
- **Radio button**: **"Frankfurt (EU Central)"** ni tanlang
- Yoki mavjud servicelaringiz bilan bir regionni tanlang

### 5. Root Directory (Optional)
- **Input field**: `backend` yozing
- ⚠️ **Muhim**: Bu maydonni to'ldirish shart!

### 6. Build Command
- **Input field**: Quyidagini yozing:
```
pip install -r backend/requirements.txt && cd backend && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
```

**Yoki** agar Root Directory `backend` bo'lsa:
```
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py init_users
```

### 7. Start Command
- **Input field**: Quyidagini yozing:
```
cd backend && gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
```

**Yoki** agar Root Directory `backend` bo'lsa:
```
gunicorn ielts_moc.wsgi:application --bind 0.0.0.0:$PORT
```

### 8. Instance Type
- **Radio button**: **"Free"** ni tanlang
  - 512 MB (RAM)
  - $0 / month
  - 0.1 CPU

### 9. Environment Variables

**"+ Add Environment Variable"** tugmasini bosing va har birini qo'shing:

#### Variable 1: PYTHON_VERSION
- **Key**: `PYTHON_VERSION`
- **Value**: `3.11.0`

#### Variable 2: SECRET_KEY
- **Key**: `SECRET_KEY`
- **Value**: **"Generate"** tugmasini bosing (yoki random string yarating)
- Masalan: `django-insecure-abc123xyz789def456ghi012jkl345mno678pqr901stu234vwx567yz`

#### Variable 3: DEBUG
- **Key**: `DEBUG`
- **Value**: `False`

#### Variable 4: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Database service → Info tab → **"Internal Database URL"** ni nusxalang
- Format: `postgresql://user:password@host:port/database`
- ⚠️ **Muhim**: External URL emas, **Internal URL** ni oling!

#### Variable 5: CORS_ALLOWED_ORIGINS (Frontend deploy bo'lgandan keyin)
- **Key**: `CORS_ALLOWED_ORIGINS`
- **Value**: `https://ielts-moc-frontend.onrender.com`
- (Frontend URL ni o'zgartiring)

#### Variable 6: FRONTEND_URL (Frontend deploy bo'lgandan keyin)
- **Key**: `FRONTEND_URL`
- **Value**: `https://ielts-moc-frontend.onrender.com`
- (Frontend URL ni o'zgartiring)

### 10. Deploy Button
- **"Deploy Web Service"** tugmasini bosing

---

## 🟢 Frontend Static Site Formasi

### 1. Project Association
- **Dropdown**: "My project" ni tanlang (backend bilan bir xil)

### 2. Branch
- **Dropdown**: **"main"** ni tanlang

### 3. Root Directory
- **Input field**: `client` yozing
- ⚠️ **Muhim**: Bu maydonni to'ldirish shart!

### 4. Build Command
- **Input field**: Quyidagini yozing:
```
cd client && npm install && npm run build
```

**Yoki** agar Root Directory `client` bo'lsa:
```
npm install && npm run build
```

### 5. Publish Directory
- **Input field**: `client/dist` yozing
- **Yoki** agar Root Directory `client` bo'lsa: `dist`

### 6. Environment Variables

**"+ Add Environment Variable"** tugmasini bosing:

#### Variable 1: NODE_VERSION
- **Key**: `NODE_VERSION`
- **Value**: `18.17.0`

#### Variable 2: VITE_API_URL
- **Key**: `VITE_API_URL`
- **Value**: `https://ielts-moc-backend.onrender.com/api`
- ⚠️ **Muhim**: Backend deploy bo'lgandan so'ng, uning URL ni oling va shu yerga yozing
- Format: `https://YOUR-BACKEND-NAME.onrender.com/api`

#### Variable 3: NODE_ENV (ixtiyoriy)
- **Key**: `NODE_ENV`
- **Value**: `production`

### 7. Create Button
- **"Create Static Site"** tugmasini bosing

---

## ✅ Tekshirish Ro'yxati

### Backend Deploy:
- [ ] Language: Python 3 tanlangan
- [ ] Root Directory: `backend` yozilgan
- [ ] Build Command: To'liq yozilgan
- [ ] Start Command: To'liq yozilgan
- [ ] PYTHON_VERSION: `3.11.0`
- [ ] SECRET_KEY: Generate qilingan yoki yozilgan
- [ ] DEBUG: `False`
- [ ] DATABASE_URL: Internal URL nusxalangan

### Frontend Deploy:
- [ ] Root Directory: `client` yozilgan
- [ ] Build Command: To'liq yozilgan
- [ ] Publish Directory: `client/dist` yozilgan
- [ ] NODE_VERSION: `18.17.0`
- [ ] VITE_API_URL: Backend URL bilan to'g'ri yozilgan

### CORS Sozlash (Frontend deploy bo'lgandan keyin):
- [ ] Backend → Environment → CORS_ALLOWED_ORIGINS qo'shilgan
- [ ] Backend → Environment → FRONTEND_URL qo'shilgan

---

## 🆘 Tezkor Yordam

Agar xatolik bo'lsa:
1. **Build xatosi**: Build Command ni tekshiring
2. **Start xatosi**: Start Command ni tekshiring
3. **Database xatosi**: DATABASE_URL ni tekshiring (Internal URL bo'lishi kerak)
4. **CORS xatosi**: CORS_ALLOWED_ORIGINS va FRONTEND_URL ni tekshiring

