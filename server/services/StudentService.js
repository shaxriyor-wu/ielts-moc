import { TestKeyModel } from '../models/TestKey.js';
import { Test } from '../models/Test.js';
import { Attempt } from '../models/Attempt.js';
import { Student } from '../models/Student.js';
import { Queue } from '../models/Queue.js';
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

  static async enterTestCode(studentId, testCode) {
    const db = await import('../config/database.js').then(m => m.loadDb());
    const keyRecord = db.testKeys.find(k => k.key === testCode.toUpperCase().trim());
    
    if (!keyRecord) {
      throw new Error('Invalid test code');
    }

    const test = db.tests.find(t => t.id === keyRecord.testId);
    if (!test) {
      throw new Error('Test not found');
    }

    // Check if student is already in queue
    let queueEntry = await Queue.findByStudentId(studentId);
    
    if (queueEntry && queueEntry.status === 'started') {
      throw new Error('Test already started');
    }

    if (!queueEntry) {
      queueEntry = await Queue.create({
        studentId,
        testCode: testCode.toUpperCase().trim(),
        testId: test.id
      });
    }

    // Check if test is active
    if (test.isActive) {
      queueEntry = await Queue.update(queueEntry.id, {
        status: 'assigned',
        assignedAt: new Date().toISOString()
      });
    }

    return {
      status: queueEntry.status,
      queueId: queueEntry.id,
      testCode: queueEntry.testCode,
      joinedAt: queueEntry.joinedAt
    };
  }

  static async checkQueueStatus(studentId) {
    const queueEntry = await Queue.findByStudentId(studentId);
    
    if (!queueEntry) {
      return { status: 'none' };
    }

    // Check for timeout (10 minutes)
    const joinedAt = new Date(queueEntry.joinedAt);
    const now = new Date();
    const minutesWaiting = (now - joinedAt) / (1000 * 60);

    if (minutesWaiting >= 10 && queueEntry.status !== 'started' && queueEntry.status !== 'left') {
      await Queue.markAsTimeout(studentId);
      return { status: 'timeout', message: 'Test did not start within 10 minutes' };
    }

    const db = await import('../config/database.js').then(m => m.loadDb());
    const test = db.tests.find(t => t.id === queueEntry.testId);

    // If test is now active and student is waiting/assigned, move to preparation
    if (test && test.isActive && (queueEntry.status === 'waiting' || queueEntry.status === 'assigned')) {
      queueEntry = await Queue.update(queueEntry.id, {
        status: 'preparation',
        preparationStartedAt: new Date().toISOString()
      });
    }

    // Calculate preparation time remaining (60 seconds)
    let preparationTimeRemaining = null;
    if (queueEntry.status === 'preparation' && queueEntry.preparationStartedAt) {
      const prepStart = new Date(queueEntry.preparationStartedAt);
      const elapsed = (now - prepStart) / 1000; // seconds
      preparationTimeRemaining = Math.max(0, 60 - elapsed);
      
      if (preparationTimeRemaining <= 0) {
        queueEntry = await Queue.update(queueEntry.id, {
          status: 'started',
          startedAt: new Date().toISOString()
        });
      }
    }

    return {
      status: queueEntry.status,
      queueId: queueEntry.id,
      testCode: queueEntry.testCode,
      joinedAt: queueEntry.joinedAt,
      preparation_time_remaining: preparationTimeRemaining ? Math.floor(preparationTimeRemaining) : null
    };
  }

  static async startTest(studentId) {
    const queueEntry = await Queue.findByStudentId(studentId);
    
    if (!queueEntry) {
      throw new Error('Not in queue');
    }

    if (queueEntry.status === 'started') {
      return { status: 'started', queueId: queueEntry.id };
    }

    const db = await import('../config/database.js').then(m => m.loadDb());
    const test = db.tests.find(t => t.id === queueEntry.testId);

    if (!test || !test.isActive) {
      throw new Error('Test is not active');
    }

    // Update queue status to started
    await Queue.update(queueEntry.id, {
      status: 'started',
      startedAt: new Date().toISOString()
    });

    return { status: 'started', queueId: queueEntry.id };
  }

  static async leaveQueue(studentId) {
    const queueEntry = await Queue.findByStudentId(studentId);
    
    if (!queueEntry) {
      return { success: true, message: 'Not in queue' };
    }

    if (queueEntry.status === 'started') {
      throw new Error('Cannot leave - test already started');
    }

    await Queue.markAsLeft(studentId);
    return { success: true, message: 'Left queue successfully' };
  }
}

