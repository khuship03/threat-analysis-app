import { Request, Response, NextFunction } from 'express';
import * as aiService from '../services/ai.service';

export const runAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.analyzeLogFile(req.params.logId as string, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await aiService.getAnalysisResult(req.params.logId as string, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};