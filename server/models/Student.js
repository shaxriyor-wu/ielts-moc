import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';

export class Student {
  static async findByEmail(email) {
    const db = loadDb();
    return db.students.find(s => s.email === email || s.login === email) || null;
  }

  static async findByLogin(login) {
    const db = loadDb();
    return db.students.find(s => s.login === login || s.email === login) || null;
  }

  static async findById(id) {
    const db = loadDb();
    return db.students.find(s => s.id === id) || null;
  }

  static async create(data) {
    const db = loadDb();
    const loginOrEmail = data.login || data.email;
    const existing = await Student.findByEmail(loginOrEmail) || await Student.findByLogin(loginOrEmail);
    if (existing) {
      throw new Error('Student with this login already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    
    const student = {
      id: uuidv4(),
      email: data.email || data.login,
      login: data.login || data.email,
      password: hashedPassword,
      fullName: data.fullName,
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    db.students.push(student);
    saveDb(db);
    return student;
  }

  static async update(id, data) {
    const db = loadDb();
    const student = db.students.find(s => s.id === id);
    if (student) {
      const ALLOWED_FIELDS = ['fullName', 'email', 'login'];
      const safeData = {};
      ALLOWED_FIELDS.forEach(field => {
        if (data[field] !== undefined) safeData[field] = data[field];
      });
      Object.assign(student, safeData);
      student.updatedAt = new Date().toISOString();
      saveDb(db);
      return student;
    }
    return null;
  }

  static async updateLastLogin(id) {
    const db = loadDb();
    const student = db.students.find(s => s.id === id);
    if (student) {
      student.lastLogin = new Date().toISOString();
      saveDb(db);
    }
  }

  static async verifyPassword(student, password) {
    return comparePassword(password, student.password);
  }

  static async getStats(id) {
    const db = loadDb();
    const attempts = db.attempts.filter(a => a.studentId === id);
    
    return {
      totalTests: attempts.length,
      completedTests: attempts.filter(a => a.isSubmitted).length,
      inProgressTests: attempts.filter(a => !a.isSubmitted && a.startedAt).length,
      averageScore: 0
    };
  }
}

