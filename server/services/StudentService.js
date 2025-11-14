import { TestKeyModel } from '../models/TestKey.js';
import { Test } from '../models/Test.js';
import { Attempt } from '../models/Attempt.js';
import { Student } from '../models/Student.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import logger from '../utils/logger.js';

export class StudentService {
  static async login(email, password) {
    const student = await Student.findByEmail(email);
    if (!student) {
      throw new Error('Invalid credentials');
    }

    const isValid = await Student.verifyPassword(student, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    await Student.updateLastLogin(student.id);

    const payload = {
      id: student.id,
      email: student.email,
      role: 'student'
    };

    return {
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }

  static async register(data) {
    const student = await Student.create(data);
    
    const payload = {
      id: student.id,
      email: student.email,
      role: 'student'
    };

    return {
      student: {
        id: student.id,
        email: student.email,
        fullName: student.fullName
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }

  static async getProfile(studentId) {
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('Student not found');
    }
    return {
      id: student.id,
      email: student.email,
      fullName: student.fullName,
      createdAt: student.createdAt,
      lastLogin: student.lastLogin
    };
  }

  static async updateProfile(studentId, data) {
    const student = await Student.update(studentId, data);
    if (!student) {
      throw new Error('Student not found');
    }
    return {
      id: student.id,
      email: student.email,
      fullName: student.fullName
    };
  }

  static async getStats(studentId) {
    return await Student.getStats(studentId);
  }

  static async getAttempts(studentId) {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const attempts = db.attempts.filter(a => a.studentId === studentId);
    return attempts.map(a => ({
      id: a.id,
      testKey: a.testKey,
      testId: a.testId,
      testTitle: db.tests.find(t => t.id === a.testId)?.title || 'Unknown',
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      isSubmitted: a.isSubmitted,
      score: a.score || null
    }));
  }

  static async getTests(studentId) {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const attempts = db.attempts.filter(a => a.studentId === studentId);
    return attempts.map(a => ({
      id: a.id,
      testKey: a.testKey,
      testId: a.testId,
      testTitle: db.tests.find(t => t.id === a.testId)?.title || 'Unknown',
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      isSubmitted: a.isSubmitted
    }));
  }

  static async getAllTests() {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const tests = db.tests.filter(t => t.isPublished);
    return tests.map(test => ({
      id: test.id,
      title: test.title,
      description: test.description,
      duration: test.duration,
      testKey: db.testKeys.find(k => k.testId === test.id && k.isActive)?.key || null,
      isActive: test.isActive,
      createdAt: test.createdAt
    }));
  }

  static async joinTest(testKey) {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const keyRecord = db.testKeys.find(k => k.key === testKey);
    
    if (!keyRecord) {
      throw new Error('Invalid test key');
    }

    const test = db.tests.find(t => t.id === keyRecord.testId);
    if (!test) {
      throw new Error('Test not found');
    }

    if (!test.isActive) {
      return { status: 'waiting', message: 'Test boshlanishini kutib turing...' };
    }

    return { status: 'ready', testKey, testId: test.id };
  }

  static async checkTestStatus(testKey) {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const keyRecord = db.testKeys.find(k => k.key === testKey);
    
    if (!keyRecord) {
      throw new Error('Invalid test key');
    }

    const test = db.tests.find(t => t.id === keyRecord.testId);
    if (!test) {
      throw new Error('Test not found');
    }

    return { isActive: test.isActive };
  }

  static async accessTest(testKey, fullName) {
    const keyRecord = await TestKeyModel.findByKey(testKey);
    if (!keyRecord || !keyRecord.isActive) {
      throw new Error('Invalid or inactive test key');
    }

    if (keyRecord.usedBy && keyRecord.usedBy !== fullName) {
      throw new Error('Test key already used by another student');
    }

    const test = await Test.findById(keyRecord.testId);
    if (!test || !test.isActive) {
      throw new Error('Test is not active');
    }

    let attempt = await Attempt.findByTestKey(testKey);
    let studentId = null;
    
    const db = await import('../config/database.js').then(m => m.loadDb());
    const student = db.students.find(s => s.fullName === fullName);
    if (student) {
      studentId = student.id;
    }

    if (!attempt) {
      let assignedMocId = null;
      if (test.mocIds && test.mocIds.length > 0) {
        const MocTest = (await import('../models/MocTest.js')).MocTest;
        const randomMoc = await MocTest.getRandomMoc(test.mocIds);
        assignedMocId = randomMoc?.id || null;
      }

      attempt = await Attempt.create({
        testKey,
        testId: test.id,
        studentName: fullName,
        studentId,
        assignedMocId
      });
      await TestKeyModel.useKey(testKey, fullName);
    } else if (attempt.isSubmitted) {
      throw new Error('Test already submitted');
    }

    const payload = {
      id: attempt.id,
      testKey,
      studentName: fullName,
      role: 'student'
    };

    return {
      attempt: {
        id: attempt.id,
        testKey,
        testId: test.id,
        studentName: fullName
      },
      accessToken: generateAccessToken(payload),
      refreshToken: generateRefreshToken(payload)
    };
  }

  static async getTest(testKey) {
    const keyRecord = await TestKeyModel.findByKey(testKey);
    if (!keyRecord) {
      throw new Error('Invalid test key');
    }

    const attempt = await Attempt.findByTestKey(testKey);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    const test = await Test.findById(keyRecord.testId);
    if (!test) {
      throw new Error('Test not found');
    }

    let testContent = {
      id: test.id,
      title: test.title,
      description: test.description,
      type: test.type,
      duration: test.duration,
      reading: test.reading,
      listening: test.listening,
      writing: test.writing
    };

    if (attempt.assignedMocId) {
      const MocTest = (await import('../models/MocTest.js')).MocTest;
      const moc = await MocTest.findById(attempt.assignedMocId);
      if (moc && moc.parsedContent) {
        testContent = {
          ...testContent,
          reading: moc.parsedContent.reading || testContent.reading,
          listening: moc.parsedContent.listening || testContent.listening,
          writing: moc.writingTopics || testContent.writing
        };
      }
    }

    return testContent;
  }

  static async getAttempt(attemptId) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }
    return attempt;
  }

  static async saveAnswers(attemptId, section, answers) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.isSubmitted) {
      throw new Error('Test already submitted');
    }

    const updateData = {
      answers: {
        ...attempt.answers,
        [section]: answers
      }
    };

    return await Attempt.update(attemptId, updateData);
  }

  static async saveHighlights(attemptId, highlights) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.isSubmitted) {
      throw new Error('Test already submitted');
    }

    return await Attempt.update(attemptId, { highlights });
  }

  static async submitTest(attemptId) {
    const attempt = await Attempt.findById(attemptId);
    if (!attempt) {
      throw new Error('Attempt not found');
    }

    if (attempt.isSubmitted) {
      throw new Error('Test already submitted');
    }

    return await Attempt.submit(attemptId);
  }
}

