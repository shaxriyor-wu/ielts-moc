import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';

export class Attempt {
  static async findById(id) {
    const db = loadDb();
    return db.attempts.find(a => a.id === id) || null;
  }

  static async findByTestKey(testKey) {
    const db = loadDb();
    return db.attempts.find(a => a.testKey === testKey) || null;
  }

  static async findByAdmin(adminId) {
    const db = loadDb();
    const testKeys = db.testKeys.filter(k => k.adminId === adminId);
    const keySet = new Set(testKeys.map(k => k.key));
    return db.attempts.filter(a => keySet.has(a.testKey));
  }

  static async findAll() {
    const db = loadDb();
    return db.attempts;
  }

  static async create(data) {
    const db = loadDb();
    
    const attempt = {
      id: uuidv4(),
      testKey: data.testKey,
      testId: data.testId,
      studentName: data.studentName,
      studentId: data.studentId || null,
      answers: {
        reading: data.answers?.reading || {},
        listening: data.answers?.listening || {},
        writing: data.answers?.writing || {}
      },
      highlights: data.highlights || [],
      startedAt: new Date().toISOString(),
      submittedAt: null,
      isSubmitted: false,
      duration: 0
    };
    
    db.attempts.push(attempt);
    saveDb(db);
    return attempt;
  }

  static async update(id, data) {
    const db = loadDb();
    const attempt = db.attempts.find(a => a.id === id);
    if (attempt) {
      // Only allow updating specific fields
      if (data.answers && typeof data.answers === 'object') {
        attempt.answers = { ...attempt.answers, ...data.answers };
      }
      if (data.highlights && Array.isArray(data.highlights)) {
        attempt.highlights = data.highlights;
      }
      attempt.lastSaved = new Date().toISOString();
      saveDb(db);
      return attempt;
    }
    return null;
  }

  static async submit(id) {
    const db = loadDb();
    const attempt = db.attempts.find(a => a.id === id);
    if (attempt && !attempt.isSubmitted) {
      attempt.isSubmitted = true;
      attempt.submittedAt = new Date().toISOString();
      const start = new Date(attempt.startedAt);
      const end = new Date(attempt.submittedAt);
      attempt.duration = Math.floor((end - start) / 1000);
      saveDb(db);
      return attempt;
    }
    return null;
  }

  static async findByTest(testId) {
    const db = loadDb();
    return db.attempts.filter(a => a.testId === testId);
  }
}

