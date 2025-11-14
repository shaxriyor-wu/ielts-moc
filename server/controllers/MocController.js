import { MocTest } from '../models/MocTest.js';
import { parseTextFile, parseListeningFile } from '../utils/fileParser.js';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class MocController {
  static async createMoc(req, res, next) {
    try {
      const { title, type, answerKey, writingTopics } = req.body;
      let parsedContent = null;

      if (req.files) {
      if (req.files.readingFile) {
        const filePath = path.join(__dirname, '../uploads/reading', req.files.readingFile[0].filename);
        parsedContent = { ...parsedContent, reading: await parseTextFile(filePath) };
      }
      if (req.files.listeningFile) {
        const filePath = path.join(__dirname, '../uploads/listening', req.files.listeningFile[0].filename);
        const listeningData = await parseListeningFile(filePath);
        parsedContent = { ...parsedContent, listening: listeningData };
      }
      }

      const mocTest = await MocTest.create({
        title,
        type,
        readingFile: req.files?.readingFile?.[0] ? `/uploads/reading/${req.files.readingFile[0].filename}` : null,
        listeningFile: req.files?.listeningFile?.[0] ? `/uploads/listening/${req.files.listeningFile[0].filename}` : null,
        listeningAudio: req.files?.listeningAudio?.[0] ? `/uploads/listening/${req.files.listeningAudio[0].filename}` : null,
        writingTopics: writingTopics ? JSON.parse(writingTopics) : [],
        answerKey: answerKey ? JSON.parse(answerKey) : {},
        parsedContent,
        createdBy: req.user.id
      });

      res.status(201).json(mocTest);
    } catch (error) {
      logger.error('Create MOC error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async getMocs(req, res, next) {
    try {
      const mocs = await MocTest.findByAdmin(req.user.id);
      res.json(mocs);
    } catch (error) {
      logger.error('Get MOCs error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async getMoc(req, res, next) {
    try {
      const moc = await MocTest.findById(req.params.id);
      if (!moc || moc.createdBy !== req.user.id) {
        return res.status(404).json({ error: 'MOC not found' });
      }
      res.json(moc);
    } catch (error) {
      logger.error('Get MOC error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  static async updateMoc(req, res, next) {
    try {
      const moc = await MocTest.update(req.params.id, req.body);
      if (!moc) {
        return res.status(404).json({ error: 'MOC not found' });
      }
      res.json(moc);
    } catch (error) {
      logger.error('Update MOC error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async deleteMoc(req, res, next) {
    try {
      await MocTest.delete(req.params.id);
      res.json({ success: true });
    } catch (error) {
      logger.error('Delete MOC error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  static async startMocs(req, res, next) {
    try {
      const { mocIds } = req.body;
      const test = await import('../models/Test.js').then(m => m.Test.create({
        title: 'MOC Test Session',
        description: 'Multiple MOC tests',
        type: 'moc',
        mocIds: mocIds,
        isActive: true,
        createdBy: req.user.id
      }));

      res.json({ test, message: 'MOC tests started' });
    } catch (error) {
      logger.error('Start MOCs error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

