import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

import { authRoutes } from './routes/auth.routes';
import { logRoutes } from './routes/log.routes';
import { analysisRoutes } from './routes/analysis.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 4000;


// GLOBAL MIDDLEWARE

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // allow frontend (or all for now)
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// STATIC FILES

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));


// ROOT ROUTE (FIXES 404)

app.get('/', (_req, res) => {
  res.send('🚀 Threat Analysis API is running on Railway');
});

// HEALTH CHECK

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});


// API ROUTES

app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/analysis', analysisRoutes);


// ERROR HANDLER

app.use(errorMiddleware);


// START SERVER

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Health check: /api/health`);
});

export default app;