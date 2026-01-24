import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';

export class Queue {
  static async findByStudentId(studentId) {
    const db = loadDb();
    return db.queue?.find(q => q.studentId === studentId && q.status !== 'left') || null;
  }

  static async findByTestCode(testCode) {
    const db = loadDb();
    return db.queue?.filter(q => q.testCode === testCode) || [];
  }

  static async findById(id) {
    const db = loadDb();
    return db.queue?.find(q => q.id === id) || null;
  }

  static async create(data) {
    const db = loadDb();
    if (!db.queue) db.queue = [];

    // Remove any existing queue entry for this student
    const existingIndex = db.queue.findIndex(q => q.studentId === data.studentId && q.status !== 'left');
    if (existingIndex !== -1) {
      db.queue.splice(existingIndex, 1);
    }

    const queueEntry = {
      id: uuidv4(),
      studentId: data.studentId,
      testCode: data.testCode,
      testId: data.testId,
      status: 'waiting', // waiting, assigned, preparation, started, left, timeout
      joinedAt: new Date().toISOString(),
      assignedAt: null,
      preparationStartedAt: null,
      startedAt: null,
      leftAt: null,
      timeoutAt: null
    };

    db.queue.push(queueEntry);
    saveDb(db);
    return queueEntry;
  }

  static async update(id, data) {
    const db = loadDb();
    const entry = db.queue?.find(q => q.id === id);
    if (entry) {
      const ALLOWED_FIELDS = ['status', 'assignedAt', 'preparationStartedAt', 'startedAt', 'leftAt', 'timeoutAt'];
      const safeData = {};
      ALLOWED_FIELDS.forEach(field => {
        if (data[field] !== undefined) safeData[field] = data[field];
      });
      Object.assign(entry, safeData);
      entry.updatedAt = new Date().toISOString();
      saveDb(db);
      return entry;
    }
    return null;
  }

  static async remove(id) {
    const db = loadDb();
    if (!db.queue) return false;
    const index = db.queue.findIndex(q => q.id === id);
    if (index !== -1 && index !== undefined) {
      db.queue.splice(index, 1);
      saveDb(db);
      return true;
    }
    return false;
  }

  static async markAsLeft(studentId) {
    const db = loadDb();
    const entry = db.queue?.find(q => q.studentId === studentId && q.status !== 'left' && q.status !== 'started');
    if (entry) {
      entry.status = 'left';
      entry.leftAt = new Date().toISOString();
      saveDb(db);
      return entry;
    }
    return null;
  }

  static async markAsTimeout(studentId) {
    const db = loadDb();
    const entry = db.queue?.find(q => q.studentId === studentId && q.status !== 'left' && q.status !== 'started');
    if (entry) {
      entry.status = 'timeout';
      entry.timeoutAt = new Date().toISOString();
      saveDb(db);
      return entry;
    }
    return null;
  }

  static async cleanupOldEntries() {
    const db = loadDb();
    if (!db.queue) return;

    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    db.queue = db.queue.filter(entry => {
      // Keep entries that are started or left
      if (entry.status === 'started' || entry.status === 'left' || entry.status === 'timeout') {
        return false; // Remove old completed entries
      }

      // Check if entry is older than 10 minutes and still waiting
      const joinedAt = new Date(entry.joinedAt);
      if (joinedAt < tenMinutesAgo && (entry.status === 'waiting' || entry.status === 'assigned')) {
        entry.status = 'timeout';
        entry.timeoutAt = new Date().toISOString();
        return false; // Remove timeout entries
      }

      return true;
    });

    saveDb(db);
  }
}

