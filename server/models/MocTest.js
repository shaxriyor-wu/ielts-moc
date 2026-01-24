import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';

export class MocTest {
  static async findById(id) {
    const db = loadDb();
    return db.mocTests?.find(m => m.id === id) || null;
  }

  static async findByAdmin(adminId) {
    const db = loadDb();
    return (db.mocTests || []).filter(m => m.createdBy === adminId);
  }

  static async findAll() {
    const db = loadDb();
    return db.mocTests || [];
  }

  static async create(data) {
    const db = loadDb();
    if (!db.mocTests) db.mocTests = [];
    
    const mocTest = {
      id: uuidv4(),
      title: data.title,
      type: data.type,
      readingFile: data.readingFile || null,
      listeningFile: data.listeningFile || null,
      listeningAudio: data.listeningAudio || null,
      writingTopics: data.writingTopics || [],
      answerKey: data.answerKey || {},
      parsedContent: data.parsedContent || null,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy,
      isActive: false
    };
    
    db.mocTests.push(mocTest);
    saveDb(db);
    return mocTest;
  }

  static async update(id, data) {
    const db = loadDb();
    const mocTest = db.mocTests?.find(m => m.id === id);
    if (mocTest) {
      const ALLOWED_FIELDS = ['title', 'type', 'readingFile', 'listeningFile', 'listeningAudio', 'writingTopics', 'answerKey', 'parsedContent', 'isActive'];
      const safeData = {};
      ALLOWED_FIELDS.forEach(field => {
        if (data[field] !== undefined) safeData[field] = data[field];
      });
      Object.assign(mocTest, safeData);
      mocTest.updatedAt = new Date().toISOString();
      saveDb(db);
      return mocTest;
    }
    return null;
  }

  static async delete(id) {
    const db = loadDb();
    const index = db.mocTests?.findIndex(m => m.id === id);
    if (index !== -1) {
      db.mocTests.splice(index, 1);
      saveDb(db);
      return true;
    }
    return false;
  }

  static async getRandomMoc(mocIds) {
    const db = loadDb();
    const availableMocs = db.mocTests?.filter(m => mocIds.includes(m.id) && m.isActive) || [];
    if (availableMocs.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableMocs.length);
    return availableMocs[randomIndex];
  }
}

