import { AdminService } from '../services/AdminService.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export class AdminController {
  static async login(req, res, next) {
    try {
      const { login, password } = req.body;
      const result = await AdminService.login(login, password);
      res.json(result);
    } catch (error) {
      logger.error('Admin login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async createTest(req, res, next) {
    try {
      const test = await AdminService.createTest(req.body, req.user.id);
      res.status(201).json(test);
    } catch (error) {
      logger.error('Create test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTests(req, res, next) {
    try {
      const tests = await AdminService.getTests(req.user.id);
      res.json(tests);
    } catch (error) {
      logger.error('Get tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getTest(req, res, next) {
    try {
      const test = await AdminService.getTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Get test error:', error);
      res.status(404).json({ error: error.message });
    }
  }

  static async updateTest(req, res, next) {
    try {
      const test = await AdminService.updateTest(req.params.id, req.body, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Update test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteTest(req, res, next) {
    try {
      const result = await AdminService.deleteTest(req.params.id, req.user.id);
      res.json(result);
    } catch (error) {
      logger.error('Delete test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async startTest(req, res, next) {
    try {
      const test = await AdminService.startTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Start test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async stopTest(req, res, next) {
    try {
      const test = await AdminService.stopTest(req.params.id, req.user.id);
      res.json(test);
    } catch (error) {
      logger.error('Stop test error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  // Unified upload handler for all file types
  static async uploadFile(req, res, next) {
    try {
      const { type } = req.params; // 'reading', 'listening', 'writing'
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileUrl = `/uploads/${type}/${req.file.filename}`;
      res.json({
        success: true,
        url: fileUrl,
        filename: req.file.filename,
        filePath: fileUrl
      });
    } catch (error) {
      logger.error(`Upload ${req.params.type} error:`, error);
      res.status(500).json({ error: error.message });
    }
  }

  // Backward compatibility - keep old methods but delegate to uploadFile
  static async uploadReading(req, res, next) {
    req.params.type = 'reading';
    return AdminController.uploadFile(req, res, next);
  }

  static async uploadListening(req, res, next) {
    req.params.type = 'listening';
    return AdminController.uploadFile(req, res, next);
  }

  static async uploadWriting(req, res, next) {
    req.params.type = 'writing';
    return AdminController.uploadFile(req, res, next);
  }

  static async generateTestKey(req, res, next) {
    try {
      const { testId } = req.body;
      const testKey = await AdminService.generateTestKey(testId, req.user.id);
      res.status(201).json(testKey);
    } catch (error) {
      logger.error('Generate key error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getTestKeys(req, res, next) {
    try {
      const keys = await AdminService.getTestKeys(req.user.id);
      res.json(keys);
    } catch (error) {
      logger.error('Get keys error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getResults(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const results = await AdminService.getResults(req.user.id, page, limit);
      res.json(results);
    } catch (error) {
      logger.error('Get results error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getStudents(req, res, next) {
    try {
      const students = await AdminService.getStudents(req.user.id);
      res.json(students);
    } catch (error) {
      logger.error('Get students error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getStats(req.user.id);
      res.json(stats);
    } catch (error) {
      logger.error('Get stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getOnlineUsers(req, res, next) {
    try {
      const count = await AdminService.getOnlineUsersCount();
      res.json({ count });
    } catch (error) {
      logger.error('Get online users error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async createUser(req, res, next) {
    try {
      const { username, password, fullName } = req.body;
      const newUser = await AdminService.createStudent(username, password, fullName);
      res.status(201).json(newUser);
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedUser = await AdminService.updateStudent(id, updates);
      res.json(updatedUser);
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      await AdminService.deleteStudent(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

