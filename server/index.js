import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import mocRoutes from './routes/moc.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', mocRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CD IELTS EMPIRE API' });
});

app.use(notFound);
app.use(errorHandler);

const initializeDatabase = async () => {
  try {
    // Initialize default admin if needed
    const { Admin } = await import('./models/Admin.js');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    const existing = await Admin.findByEmail(adminEmail) || await Admin.findByLogin('admin');
    if (!existing) {
      await Admin.create({
        email: adminEmail,
        login: 'admin',
        password: adminPassword,
        name: 'System Admin',
        isActive: true
      });
      logger.info('Default admin account created');
      console.log('✅ Default admin account created');
      console.log('📧 Login: admin');
      console.log('🔑 Password: admin123');
    } else {
      logger.info('Admin account already exists');
      console.log('ℹ️  Admin account already exists');
    }
  } catch (error) {
    logger.error('Database initialization error:', error);
    console.error('❌ Database initialization error:', error);
  }
};

app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on port ${PORT}`);
  await initializeDatabase();
});

