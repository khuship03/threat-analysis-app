import { Router } from 'express';
import { uploadLog, getLogs, getLog, deleteLog } from '../controllers/log.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

export const logRoutes = Router();

logRoutes.use(authMiddleware);

logRoutes.post('/upload', upload.single('file'), uploadLog);
logRoutes.get('/', getLogs);
logRoutes.get('/:id', getLog);
logRoutes.delete('/:id', deleteLog);