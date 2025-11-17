import { Admin } from '../models/Admin.js';
import { Student } from '../models/Student.js';
import { generateAccessToken, generateRefreshToken } from '../config/jwt.js';
import logger from '../utils/logger.js';

export class AuthController {
  static async login(req, res, next) {
    try {
      const { login, password } = req.body;

      if (!login || !password) {
        return res.status(400).json({ error: 'Login and password are required' });
      }

      let user = null;
      let role = null;

      logger.info(`Login attempt: ${login}`);
      
      // Try admin first
      const admin = await Admin.findByLogin(login) || await Admin.findByEmail(login);
      if (admin) {
        logger.info(`Admin found: ${admin.id}, isActive: ${admin.isActive}`);
        if (admin.isActive) {
          const isValid = await Admin.verifyPassword(admin, password);
          logger.info(`Admin password valid: ${isValid}`);
          if (isValid) {
            user = { id: admin.id, email: admin.email || admin.login, name: admin.name };
            role = 'admin';
            await Admin.updateLastLogin(admin.id);
          }
        }
      }

      // Try student if admin not found
      if (!user) {
        const student = await Student.findByLogin(login) || await Student.findByEmail(login);
        if (student) {
          logger.info(`Student found: ${student.id}`);
          const isValid = await Student.verifyPassword(student, password);
          logger.info(`Student password valid: ${isValid}`);
          if (isValid) {
            user = { id: student.id, email: student.email || student.login, fullName: student.fullName };
            role = 'student';
            await Student.updateLastLogin(student.id);
          }
        }
      }

      if (!user) {
        logger.warn(`Login failed for: ${login}`);
        return res.status(401).json({ error: 'Invalid login or password' });
      }
      
      logger.info(`Login successful: ${user.id}, role: ${role}`);

      const payload = {
        id: user.id,
        email: user.email || user.login || login,
        role
      };

      res.json({
        user: {
          ...user,
          email: user.email || user.login || login
        },
        role,
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload)
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  static async register(req, res, next) {
    try {
      const { fullName, login, password } = req.body;
      
      const student = await Student.create({
        email: login,
        password,
        fullName
      });
      
      const payload = {
        id: student.id,
        email: student.email,
        role: 'student'
      };

      res.status(201).json({
        user: {
          id: student.id,
          email: student.email,
          fullName: student.fullName
        },
        role: 'student',
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload)
      });
    } catch (error) {
      logger.error('Register error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

