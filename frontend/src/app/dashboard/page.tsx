'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { isAuthenticated } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import { LogFile, LogsResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Shield, Upload, LogOut, FileText,
  AlertTriangle, CheckCircle, Clock, XCircle, Trash2
} from 'lucide-react';

const statusConfig = {
  PENDING:    { label: 'Pending',    color: 'bg-gray-700 text-gray-300',    icon: Clock },
  PROCESSING: { label: 'Processing', color: 'bg-yellow-900 text-yellow-300', icon: Clock },
  COMPLETED:  { label: 'Completed',  color: 'bg-green-900 text-green-300',   icon: CheckCircle },
  FAILED:     { label: 'Failed',     color: 'bg-red-900 text-red-300',       icon: XCircle },
};

const threatConfig = {
  LOW:      { color: 'bg-green-900 text-green-300',   label: 'Low' },
  MEDIUM:   { color: 'bg-yellow-900 text-yellow-300', label: 'Medium' },
  HIGH:     { color: 'bg-orange-900 text-orange-300', label: 'High' },
  CRITICAL: { color: 'bg-red-900 text-red-300',       label: 'Critical' },
};

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<LogFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) { router.push('/login'); return; }
    fetchLogs();
  }, [router]);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: LogsResponse }>('/logs');
      setLogs(data.data.logs);
    } catch {
      console.error('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this log file? This action cannot be undone.')) return;
    setDeletingId(logId);
    try {
      await api.delete(`/logs/${logId}`);
      setLogs((prev) => prev.filter((log) => log.id !== logId));
    } catch {
      alert('Failed to delete log file. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const completed = logs.filter((l) => l.status === 'COMPLETED').length;
  const critical  = logs.filter((l) => l.analysis?.threatLevel === 'CRITICAL').length;
  const high      = logs.filter((l) => l.analysis?.threatLevel === 'HIGH').length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">Threat Analysis</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={logout} className="text-gray-400 hover:text-white">
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Monitor and analyze your logs</p>
          </div>
          <Link href="/logs/upload">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Upload className="w-4 h-4 mr-2" /> Upload Log
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Logs',   value: logs.length, icon: FileText,      color: 'text-blue-400' },
            { label: 'Analysed',     value: completed,   icon: CheckCircle,   color: 'text-green-400' },
            { label: 'High Threats', value: high,        icon: AlertTriangle, color: 'text-orange-400' },
            { label: 'Critical',     value: critical,    icon: XCircle,       color: 'text-red-400' },
          ].map((stat) => (
            <Card key={stat.label} className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Logs Table */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Uploaded Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-400">
                <Clock className="w-5 h-5 animate-spin mr-2" /> Loading...
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No logs uploaded yet.</p>
                <Link href="/logs/upload">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                    Upload your first log
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['File', 'Size', 'Uploaded', 'Status', 'Threat Level', ''].map((h) => (
                        <th key={h} className="text-left text-gray-400 text-sm font-medium pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {logs.map((log) => {
                      const status = statusConfig[log.status];
                      const threat = log.analysis ? threatConfig[log.analysis.threatLevel] : null;
                      const isDeleting = deletingId === log.id;
                      return (
                        <tr
                          key={log.id}
                          className={`hover:bg-gray-800/50 transition-colors ${isDeleting ? 'opacity-50' : ''}`}
                        >
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                              <span className="text-white text-sm truncate max-w-[200px]">{log.originalName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-400 text-sm">{formatBytes(log.size)}</td>
                          <td className="py-3 pr-4 text-gray-400 text-sm">{formatDate(log.uploadedAt)}</td>
                          <td className="py-3 pr-4">
                            <Badge className={`${status.color} border-0 text-xs`}>{status.label}</Badge>
                          </td>
                          <td className="py-3 pr-4">
                            {threat ? (
                              <Badge className={`${threat.color} border-0 text-xs`}>{threat.label}</Badge>
                            ) : (
                              <span className="text-gray-600 text-sm">—</span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex items-center gap-1">
                              <Link href={`/logs/${log.id}`}>
                                <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 text-xs">
                                  View →
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleDelete(log.id, e)}
                                disabled={isDeleting}
                                className="text-gray-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}