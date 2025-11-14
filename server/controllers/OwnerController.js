import { OwnerService } from '../services/OwnerService.js';
import logger from '../utils/logger.js';

export class OwnerController {
  static async login(req, res, next) {
    try {
      const { login, password } = req.body;
      const result = await OwnerService.login(login, password);
      res.json(result);
    } catch (error) {
      logger.error('Owner login error:', error);
      res.status(401).json({ error: error.message });
    }
  }

  static async createAdmin(req, res, next) {
    try {
      logger.info('Creating admin with data:', { login: req.body.login, name: req.body.name });
      const admin = await OwnerService.createAdmin(req.body, req.user.id);
      res.status(201).json(admin);
    } catch (error) {
      logger.error('Create admin error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteAdmin(req, res, next) {
    try {
      const result = await OwnerService.deleteAdmin(req.params.id);
      res.json(result);
    } catch (error) {
      logger.error('Delete admin error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async resetAdminPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      const result = await OwnerService.resetAdminPassword(req.params.id, newPassword);
      res.json(result);
    } catch (error) {
      logger.error('Reset password error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async activateAdmin(req, res, next) {
    try {
      const { isActive } = req.body;
      const result = await OwnerService.activateAdmin(req.params.id, isActive);
      res.json(result);
    } catch (error) {
      logger.error('Activate admin error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getAllAdmins(req, res, next) {
    try {
      const admins = await OwnerService.getAllAdmins();
      res.json(admins);
    } catch (error) {
      logger.error('Get admins error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAdminStats(req, res, next) {
    try {
      const stats = await OwnerService.getAdminStats(req.params.id);
      res.json(stats);
    } catch (error) {
      logger.error('Get admin stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getSystemStats(req, res, next) {
    try {
      const stats = await OwnerService.getSystemStats();
      res.json(stats);
    } catch (error) {
      logger.error('Get system stats error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllTests(req, res, next) {
    try {
      const tests = await OwnerService.getAllTests();
      res.json(tests);
    } catch (error) {
      logger.error('Get tests error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllStudents(req, res, next) {
    try {
      const students = await OwnerService.getAllStudents();
      res.json(students);
    } catch (error) {
      logger.error('Get students error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllAttempts(req, res, next) {
    try {
      const attempts = await OwnerService.getAllAttempts();
      res.json(attempts);
    } catch (error) {
      logger.error('Get attempts error:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

