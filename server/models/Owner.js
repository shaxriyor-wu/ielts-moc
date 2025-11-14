import { v4 as uuidv4 } from 'uuid';
import { loadDb, saveDb } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';

export class Owner {
  static async findByEmail(email) {
    const db = loadDb();
    return db.owners.find(o => o.email === email || o.login === email) || null;
  }

  static async findByLogin(login) {
    const db = loadDb();
    return db.owners.find(o => o.login === login || o.email === login) || null;
  }

  static async findById(id) {
    const db = loadDb();
    return db.owners.find(o => o.id === id) || null;
  }

  static async create(data) {
    const db = loadDb();
    const hashedPassword = await hashPassword(data.password);
    
    const owner = {
      id: uuidv4(),
      email: data.email || data.login,
      login: data.login || data.email,
      password: hashedPassword,
      name: data.name || 'Owner',
      createdAt: new Date().toISOString(),
      lastLogin: null
    };
    
    db.owners.push(owner);
    saveDb(db);
    return owner;
  }

  static async updateLastLogin(id) {
    const db = loadDb();
    const owner = db.owners.find(o => o.id === id);
    if (owner) {
      owner.lastLogin = new Date().toISOString();
      saveDb(db);
    }
  }

  static async verifyPassword(owner, password) {
    return comparePassword(password, owner.password);
  }
}

