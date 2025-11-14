import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import ownerRoutes from './routes/owner.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';
import mocRoutes from './routes/moc.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import logger from './utils/logger.js';
import { Owner } from './models/Owner.js';

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
app.use('/api/owner', ownerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', mocRoutes);
app.use('/api/student', studentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'IELTS Exam Platform API' });
});

app.use(notFound);
app.use(errorHandler);

const initializeDatabase = async () => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
    const ownerPassword = process.env.OWNER_PASSWORD || 'owner123';

    const existing = await Owner.findByEmail(ownerEmail) || await Owner.findByLogin('owner');
    if (!existing) {
      await Owner.create({
        email: ownerEmail,
        login: 'owner',
        password: ownerPassword,
        name: 'System Owner'
      });
      logger.info('Owner account created');
      console.log('✅ Owner account created');
      console.log('📧 Login: owner');
      console.log('🔑 Password: owner123');
    } else {
      const db = await import('./config/database.js').then(m => m.loadDb());
      const owner = db.owners.find(o => o.id === existing.id);
      if (owner && !owner.login) {
        owner.login = 'owner';
        await import('./config/database.js').then(m => m.saveDb(db));
        logger.info('Owner login field added');
        console.log('✅ Owner login field added');
      }
      logger.info('Owner account already exists');
      console.log('ℹ️  Owner account already exists');
      console.log('📧 Login: owner');
      console.log('🔑 Password: owner123');
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

