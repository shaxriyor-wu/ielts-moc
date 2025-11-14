import { Owner } from '../models/Owner.js';
import { loadDb, saveDb } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const initDatabase = async () => {
  const ownerEmail = process.env.OWNER_EMAIL || 'owner@example.com';
  const ownerPassword = process.env.OWNER_PASSWORD || 'owner123';

  const existing = await Owner.findByEmail(ownerEmail);
  if (!existing) {
    await Owner.create({
      email: ownerEmail,
      login: 'owner',
      password: ownerPassword,
      name: 'System Owner'
    });
    console.log('✅ Owner account created');
    console.log('📧 Email:', ownerEmail);
    console.log('🔑 Password:', ownerPassword);
  } else {
    console.log('ℹ️  Owner account already exists');
    console.log('📧 Email:', ownerEmail);
    console.log('🔑 Password:', ownerPassword);
  }

  console.log('✅ Database initialized');
};

initDatabase().catch(console.error);

