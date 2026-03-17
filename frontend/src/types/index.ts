export type Role = 'ADMIN' | 'ANALYST';
export type LogStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: Role;
  createdAt: string;
}

export interface ThreatItem {
  type: string;
  severity: ThreatLevel;
  description: string;
  sourceIp?: string;
  destinationUrl?: string;
  timestamp?: string;
  recommendation: string;
  confidenceScore: number;
  anomalyReason: string;
}

export interface Analysis {
  id: string;
  logFileId: string;
  threatLevel: ThreatLevel;
  summary: string;
  threats: ThreatItem[];
  rawResponse: string;
  processedAt: string;
  logStatus?: LogStatus;
}

export interface LogFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  storagePath: string;
  status: LogStatus;
  uploadedAt: string;
  userId: string;
  analysis?: {
    threatLevel: ThreatLevel;
    processedAt: string;
  } | null;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogsResponse {
  logs: LogFile[];
  pagination: Pagination;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}