import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';
import { generateTestKey } from '../utils/testKey.js';

export class TestKeyModel {
  static async findByKey(key) {
    const db = loadDb();
    return db.testKeys.find(k => k.key === key) || null;
  }

  static async findByTest(testId) {
    const db = loadDb();
    return db.testKeys.filter(k => k.testId === testId);
  }

  static async findByAdmin(adminId) {
    const db = loadDb();
    return db.testKeys.filter(k => k.adminId === adminId);
  }

  static async create(data) {
    const db = loadDb();

    // Use UUID to generate unique key (collision virtually impossible)
    const key = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();

    const testKey = {
      id: uuidv4(),
      key,
      testId: data.testId,
      adminId: data.adminId,
      isActive: true,
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null
    };

    db.testKeys.push(testKey);
    saveDb(db);
    return testKey;
  }

  static async useKey(key, studentName) {
    const db = loadDb();
    const testKey = db.testKeys.find(k => k.key === key && k.isActive);
    if (testKey && !testKey.usedBy) {
      testKey.usedBy = studentName;
      testKey.usedAt = new Date().toISOString();
      saveDb(db);
      return testKey;
    }
    return null;
  }

  static async deactivate(key) {
    const db = loadDb();
    const testKey = db.testKeys.find(k => k.key === key);
    if (testKey) {
      testKey.isActive = false;
      saveDb(db);
      return testKey;
    }
    return null;
  }
}

