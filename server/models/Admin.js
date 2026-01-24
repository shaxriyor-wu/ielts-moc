import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';

export class Admin {
  static async findByEmail(email) {
    const db = loadDb();
    return db.admins.find(a => a.email === email || a.login === email) || null;
  }

  static async findByLogin(login) {
    const db = loadDb();
    return db.admins.find(a => a.login === login || a.email === login) || null;
  }

  static async findById(id) {
    const db = loadDb();
    return db.admins.find(a => a.id === id) || null;
  }

  static async findAll() {
    const db = loadDb();
    return db.admins;
  }

  static async create(data) {
    const db = loadDb();
    const hashedPassword = await hashPassword(data.password);
    
    const admin = {
      id: uuidv4(),
      email: data.email || data.login,
      login: data.login || data.email,
      password: hashedPassword,
      name: data.name,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      createdBy: data.createdBy
    };
    
    db.admins.push(admin);
    saveDb(db);
    return admin;
  }

  static async update(id, data) {
    const db = loadDb();
    const admin = db.admins.find(a => a.id === id);
    if (admin) {
      const ALLOWED_FIELDS = ['name', 'email', 'login', 'isActive'];
      const safeData = {};
      ALLOWED_FIELDS.forEach(field => {
        if (data[field] !== undefined) safeData[field] = data[field];
      });
      Object.assign(admin, safeData);
      admin.updatedAt = new Date().toISOString();
      saveDb(db);
      return admin;
    }
    return null;
  }

  static async delete(id) {
    const db = loadDb();
    const index = db.admins.findIndex(a => a.id === id);
    if (index !== -1) {
      db.admins.splice(index, 1);
      saveDb(db);
      return true;
    }
    return false;
  }

  static async resetPassword(id, newPassword) {
    const db = loadDb();
    const admin = db.admins.find(a => a.id === id);
    if (admin) {
      admin.password = await hashPassword(newPassword);
      admin.updatedAt = new Date().toISOString();
      saveDb(db);
      return admin;
    }
    return null;
  }

  static async updateLastLogin(id) {
    const db = loadDb();
    const admin = db.admins.find(a => a.id === id);
    if (admin) {
      admin.lastLogin = new Date().toISOString();
      saveDb(db);
    }
  }

  static async verifyPassword(admin, password) {
    return comparePassword(password, admin.password);
  }

  static async getStats(id) {
    const db = loadDb();
    const tests = db.tests.filter(t => t.createdBy === id);
    const testKeys = db.testKeys.filter(k => k.adminId === id);
    const attempts = db.attempts.filter(a => {
      const key = db.testKeys.find(k => k.key === a.testKey);
      return key && key.adminId === id;
    });

    // Count unique students (registered users)
    const students = db.students || [];

    return {
      totalTests: tests.length,
      totalKeys: testKeys.length,
      totalAttempts: attempts.length,
      activeTests: tests.filter(t => t.isActive).length,
      // New stats
      total_students: students.length,
      total_variants: tests.length,
      total_mock_tests_taken: attempts.filter(a => a.isSubmitted).length,
      total_test_participants: attempts.length // All attempts (including in-progress)
    };
  }
}

