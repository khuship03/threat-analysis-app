'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Upload, FileText, X, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';

type UploadState = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>('idle');
  const [error, setError] = useState('');
  const [logId, setLogId] = useState('');

  const handleFile = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (!['log', 'txt'].includes(ext || '')) {
      setError('Only .log and .txt files are supported.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File size must be under 10MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleUploadAndAnalyze = async () => {
    if (!file) return;
    setError('');

    // Step 1 — Upload
    setState('uploading');
    let uploadedId = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/logs/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      uploadedId = data.data.id;
      setLogId(uploadedId);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Upload failed.');
      setState('error');
      return;
    }

    // Step 2 — Analyze
    setState('analyzing');
    try {
      await api.post(`/analysis/${uploadedId}/run`);
      setState('done');
      setTimeout(() => router.push(`/logs/${uploadedId}`), 1500);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Analysis failed.');
      setState('error');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">Threat Analysis</span>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Upload Log File</CardTitle>
            <CardDescription className="text-gray-400">
              Upload a log file for AI-powered threat analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drop Zone */}
            {!file && state === 'idle' && (
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-blue-500 bg-blue-950/30'
                    : 'border-gray-700 hover:border-gray-500'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-white font-medium mb-1">Drop your log file here</p>
                <p className="text-gray-400 text-sm">or click to browse</p>
                <p className="text-gray-600 text-xs mt-3">.log or .txt — max 10MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".log,.txt"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            )}

            {/* File Preview */}
            {file && state === 'idle' && (
              <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-900">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{file.name}</p>
                  <p className="text-gray-400 text-sm">{formatBytes(file.size)}</p>
                </div>
                <button onClick={() => setFile(null)} className="text-gray-500 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Progress States */}
            {state === 'uploading' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-white font-medium">Uploading file...</p>
                <p className="text-gray-400 text-sm">{file?.name}</p>
              </div>
            )}

            {state === 'analyzing' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                <p className="text-white font-medium">Analyzing with Claude AI...</p>
                <p className="text-gray-400 text-sm">This may take 15–30 seconds</p>
              </div>
            )}

            {state === 'done' && (
              <div className="flex flex-col items-center py-8 gap-3">
                <CheckCircle className="w-10 h-10 text-green-400" />
                <p className="text-white font-medium">Analysis complete!</p>
                <p className="text-gray-400 text-sm">Redirecting to results...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="bg-red-950 border-red-800">
                <AlertDescription className="text-red-300">{error}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            {state === 'idle' && (
              <div className="flex gap-3">
                <Link href="/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full border-gray-700 text-gray-300 hover:bg-gray-800">
                    Cancel
                  </Button>
                </Link>
                <Button
                  onClick={handleUploadAndAnalyze}
                  disabled={!file}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload & Analyze
                </Button>
              </div>
            )}

            {state === 'error' && (
              <Button
                onClick={() => { setState('idle'); setFile(null); }}
                className="w-full border-gray-700 text-gray-300 bg-gray-800 hover:bg-gray-700"
              >
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}