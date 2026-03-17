import { Router } from 'express';
import { runAnalysis, getAnalysis } from '../controllers/analysis.controller';
import { authMiddleware } from '../middleware/auth.middleware';

export const analysisRoutes = Router();

analysisRoutes.use(authMiddleware);

analysisRoutes.post('/:logId/run', runAnalysis);
analysisRoutes.get('/:logId', getAnalysis);