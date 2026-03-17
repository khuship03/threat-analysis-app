import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Loading env variables 
dotenv.config();

import { authRoutes } from './routes/auth.routes';
import { logRoutes } from './routes/log.routes';
import { analysisRoutes } from './routes/analysis.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 4000;

// Globoal Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically 
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/analysis', analysisRoutes);

// Global error handler
app.use(errorMiddleware);

// Starting server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});

export default app;
