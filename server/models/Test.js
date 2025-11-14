import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';

export class Test {
  static async findById(id) {
    const db = loadDb();
    return db.tests.find(t => t.id === id) || null;
  }

  static async findByKey(key) {
    const db = loadDb();
    const testKey = db.testKeys.find(k => k.key === key && k.isActive);
    if (!testKey) return null;
    return db.tests.find(t => t.id === testKey.testId) || null;
  }

  static async findByAdmin(adminId) {
    const db = loadDb();
    return db.tests.filter(t => t.createdBy === adminId);
  }

  static async findAll() {
    const db = loadDb();
    return db.tests;
  }

  static async create(data) {
    const db = loadDb();
    
    const test = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      type: data.type,
      reading: data.reading || null,
      listening: data.listening || null,
      writing: data.writing || null,
      answerKey: data.answerKey || {},
      duration: data.duration || 180,
      isActive: false,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy,
      startedAt: null,
      endedAt: null
    };
    
    db.tests.push(test);
    saveDb(db);
    return test;
  }

  static async update(id, data) {
    const db = loadDb();
    const test = db.tests.find(t => t.id === id);
    if (test) {
      Object.assign(test, data);
      test.updatedAt = new Date().toISOString();
      saveDb(db);
      return test;
    }
    return null;
  }

  static async start(id) {
    const db = loadDb();
    const test = db.tests.find(t => t.id === id);
    if (test) {
      test.isActive = true;
      test.startedAt = new Date().toISOString();
      saveDb(db);
      return test;
    }
    return null;
  }

  static async stop(id) {
    const db = loadDb();
    const test = db.tests.find(t => t.id === id);
    if (test) {
      test.isActive = false;
      test.endedAt = new Date().toISOString();
      saveDb(db);
      return test;
    }
    return null;
  }

  static async delete(id) {
    const db = loadDb();
    const index = db.tests.findIndex(t => t.id === id);
    if (index !== -1) {
      db.tests.splice(index, 1);
      saveDb(db);
      return true;
    }
    return false;
  }
}

