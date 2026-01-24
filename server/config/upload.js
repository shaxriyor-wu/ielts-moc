import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'reading'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'listening'), { recursive: true });
  fs.mkdirSync(path.join(UPLOAD_DIR, 'writing'), { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fieldName = file.fieldname;
    let uploadPath = UPLOAD_DIR;
    
    if (fieldName === 'readingFile') {
      uploadPath = path.join(UPLOAD_DIR, 'reading');
    } else if (fieldName === 'listeningFile' || fieldName === 'listeningAudio') {
      uploadPath = path.join(UPLOAD_DIR, 'listening');
    } else if (fieldName === 'writingFile') {
      uploadPath = path.join(UPLOAD_DIR, 'writing');
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const ALLOWED_MIME_TYPES = {
  reading: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  listening: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg', 'application/pdf', 'application/msword'],
  writing: ['application/pdf', 'application/msword', 'image/jpeg', 'image/png']
};

const fileFilter = (req, file, cb) => {
  const fieldName = file.fieldname;
  let sectionType = '';

  if (fieldName === 'readingFile') {
    sectionType = 'reading';
  } else if (fieldName === 'listeningFile' || fieldName === 'listeningAudio') {
    sectionType = 'listening';
  } else if (fieldName === 'writingFile') {
    sectionType = 'writing';
  }

  const allowedTypes = ALLOWED_MIME_TYPES[sectionType] || [];

  if (allowedTypes.length === 0 || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: 16 * 1024 * 1024 },
  fileFilter
});

