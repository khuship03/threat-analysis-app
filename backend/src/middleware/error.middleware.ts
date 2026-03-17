// global error handling

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';


export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

   constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}


export const errorMiddleware = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err.message);

  // operational error

   if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // unique constraint error
if (err instanceof Prisma.PrismaClientKnownRequestError) {
  if (err.code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
    });
    return;
  }
  if (err.code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
    return;
  }
}

  // JWT eorrors

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({ success: false, message: 'Invalid token.' });
    return;
  }
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({ success: false, message: 'Token expired.' });
    return;
  }

  // Multer file size error
  if (err.name === 'MulterError') {
    res.status(400).json({ success: false, message: err.message });
    return;
  }

  // Fallback

   res.status(500).json({
    success: false,
    message: 'Internal server error.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};