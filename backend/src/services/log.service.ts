import fs from 'fs';
import path from 'path';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';

export const saveLogFile = async (
  file: Express.Multer.File,
  userId: string
) => {
  const logFile = await prisma.logFile.create({
    data: {
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      storagePath: file.path,
      userId,
    },
  });

  return logFile;
};


export const getLogFiles = async (
  userId: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.logFile.findMany({
      where: { userId },
      include: {
        analysis: {
          select: {
            threatLevel: true,
            processedAt: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.logFile.count({ where: { userId } }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// log file Id
export const getLogFileById = async (logId: string, userId: string) => {
  const logFile = await prisma.logFile.findUnique({
    where: { id: logId },
    include: { analysis: true },
  });

  if (!logFile) {
    throw new AppError('Log file not found.', 404);
  }

  if (logFile.userId !== userId) {
    throw new AppError('You do not have access to this file.', 403);
  }

  return logFile;
};


//delete logs
export const deleteLogFile = async (logId: string, userId: string) => {
  const logFile = await getLogFileById(logId, userId);

  // Delete from disk
  const filePath = path.resolve(logFile.storagePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

// delete from database
await prisma.analysis.deleteMany({ where: { logFileId: logId } });
  await prisma.logFile.delete({ where: { id: logId } });

  return { message: 'Log file deleted successfully.' };
};