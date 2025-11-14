import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DB_DIR, 'database.json');

const ensureDbStructure = (db) => {
  if (!db.owners) db.owners = [];
  if (!db.admins) db.admins = [];
  if (!db.tests) db.tests = [];
  if (!db.testKeys) db.testKeys = [];
  if (!db.attempts) db.attempts = [];
  if (!db.mocTests) db.mocTests = [];
  if (!db.students) db.students = [];
  return db;
};

const ensureDbExists = () => {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      owners: [],
      admins: [],
      tests: [],
      testKeys: [],
      attempts: [],
      students: [],
      mocTests: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
};

const loadDb = () => {
  ensureDbExists();
  const data = fs.readFileSync(DB_FILE, 'utf8');
  const db = JSON.parse(data);
  return ensureDbStructure(db);
};

const saveDb = (data) => {
  ensureDbExists();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

export { loadDb, saveDb, DB_FILE };

