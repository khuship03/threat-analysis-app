import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/log.service';

export const uploadLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No file uploaded.' });
      return;
    }
    const logFile = await logService.saveLogFile(req.file, req.user!.userId);
    res.status(201).json({ success: true, data: logFile });
  } catch (err) {
    next(err);
  }
};

export const getLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await logService.getLogFiles(req.user!.userId, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logFile = await logService.getLogFileById(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: logFile });
  } catch (err) {
    next(err);
  }
};

export const deleteLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await logService.deleteLogFile(req.params.id as string, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};