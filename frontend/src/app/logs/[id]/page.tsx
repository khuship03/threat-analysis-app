'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Analysis, ThreatItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield, ArrowLeft, AlertTriangle, RefreshCw,
  Loader2, Globe, Monitor, Clock, Lightbulb
} from 'lucide-react';

const threatConfig = {
  LOW:      { color: 'bg-green-900 text-green-300 border-green-700',   banner: 'bg-green-950 border-green-800',  label: 'Low Risk' },
  MEDIUM:   { color: 'bg-yellow-900 text-yellow-300 border-yellow-700', banner: 'bg-yellow-950 border-yellow-800', label: 'Medium Risk' },
  HIGH:     { color: 'bg-orange-900 text-orange-300 border-orange-700', banner: 'bg-orange-950 border-orange-800', label: 'High Risk' },
  CRITICAL: { color: 'bg-red-900 text-red-300 border-red-700',         banner: 'bg-red-950 border-red-800',      label: 'Critical Risk' },
};

const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function ThreatCard({ threat }: { threat: ThreatItem }) {
  const cfg = threatConfig[threat.severity];

  const confidenceColor =
    threat.confidenceScore >= 80 ? 'text-red-400' :
    threat.confidenceScore >= 60 ? 'text-orange-400' :
    threat.confidenceScore >= 40 ? 'text-yellow-400' :
    'text-green-400';

  const confidenceBg =
    threat.confidenceScore >= 80 ? 'bg-red-950 border-red-800' :
    threat.confidenceScore >= 60 ? 'bg-orange-950 border-orange-800' :
    threat.confidenceScore >= 40 ? 'bg-yellow-950 border-yellow-800' :
    'bg-green-950 border-green-800';

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="pt-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
            <span className="text-white font-medium">{threat.type}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge className={`${cfg.color} border text-xs`}>{threat.severity}</Badge>
          </div>
        </div>

        {/* Anomaly Reason */}
        <div className={`flex items-start gap-2 p-3 rounded-lg border ${confidenceBg}`}>
          <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${confidenceColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-xs font-semibold ${confidenceColor}`}>
                Anomaly Detected
              </span>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">Confidence:</span>
                <span className={`text-xs font-bold ${confidenceColor}`}>
                  {threat.confidenceScore}%
                </span>
              </div>
            </div>
            <p className={`text-xs leading-relaxed ${confidenceColor} opacity-90`}>
              {threat.anomalyReason}
            </p>
          </div>
        </div>

        {/* Confidence Bar */}
        <div className="space-y-1">
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                threat.confidenceScore >= 80 ? 'bg-red-400' :
                threat.confidenceScore >= 60 ? 'bg-orange-400' :
                threat.confidenceScore >= 40 ? 'bg-yellow-400' :
                'bg-green-400'
              }`}
              style={{ width: `${threat.confidenceScore}%` }}
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm leading-relaxed">{threat.description}</p>

        {/* Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {threat.sourceIp && (
            <div className="flex items-center gap-2 text-gray-400">
              <Monitor className="w-3 h-3 shrink-0" />
              <span className="font-mono">{threat.sourceIp}</span>
            </div>
          )}
          {threat.destinationUrl && (
            <div className="flex items-center gap-2 text-gray-400 min-w-0">
              <Globe className="w-3 h-3 shrink-0" />
              <span className="font-mono truncate">{threat.destinationUrl}</span>
            </div>
          )}
          {threat.timestamp && (
            <div className="flex items-center gap-2 text-gray-400">
              <Clock className="w-3 h-3 shrink-0" />
              <span>{threat.timestamp}</span>
            </div>
          )}
        </div>

        {/* Recommendation */}
        <div className="flex items-start gap-2 p-3 bg-gray-700/50 rounded-lg">
          <Lightbulb className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-gray-300 text-xs leading-relaxed">{threat.recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AnalysisResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [rerunning, setRerunning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const { data } = await api.get<{ success: boolean; data: Analysis }>(`/analysis/${id}`);
      setAnalysis(data.data);
    } catch {
      setError('Failed to load analysis results.');
    } finally {
      setLoading(false);
    }
  };

  const handleRerun = async () => {
    setRerunning(true);
    setError('');
    try {
      const { data } = await api.post<{ success: boolean; data: Analysis }>(`/analysis/${id}/run`);
      setAnalysis(data.data);
    } catch {
      setError('Re-analysis failed. Please try again.');
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  const cfg = analysis ? threatConfig[analysis.threatLevel] : null;
  const sortedThreats = analysis
    ? [...analysis.threats].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    : [];

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navbar */}
      <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-semibold text-lg">Threat Analysis</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Back */}
        <Link href="/dashboard" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        {error && (
          <Alert variant="destructive" className="bg-red-950 border-red-800 mb-6">
            <AlertDescription className="text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {analysis && cfg && (
          <div className="space-y-6">
            {/* Threat Level Banner */}
            <div className={`rounded-xl border p-6 ${cfg.banner}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <AlertTriangle className="w-10 h-10 text-current opacity-80" />
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Overall Threat Level</p>
                    <div className="flex items-center gap-3">
                      <Badge className={`${cfg.color} border text-lg px-3 py-1 font-bold`}>
                        {cfg.label}
                      </Badge>
                      <span className="text-gray-400 text-sm">
                        {sortedThreats.length} threat{sortedThreats.length !== 1 ? 's' : ''} detected
                      </span>
                    </div>
                  </div>
                </div>
                <Button
      onClick={handleRerun}
      disabled={rerunning}
      className="bg-white text-gray-900 hover:bg-gray-200 font-medium border-0"
    >
      {rerunning ? (
        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Re-analyzing...</>
      ) : (
        <><RefreshCw className="w-4 h-4 mr-2" /> Re-run Analysis</>
      )}
    </Button>
              </div>
            </div>

            {/* Summary */}
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-base">Executive Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">{analysis.summary}</p>
                <p className="text-gray-500 text-xs mt-4">
                  Analyzed on {new Date(analysis.processedAt).toLocaleString()}
                </p>
              </CardContent>
            </Card>

            {/* Threats */}
            {sortedThreats.length > 0 ? (
              <div>
                <h2 className="text-white font-semibold text-lg mb-4">
                  Detected Threats ({sortedThreats.length})
                </h2>
                <div className="space-y-4">
                  {sortedThreats.map((threat, i) => (
                    <ThreatCard key={i} threat={threat} />
                  ))}
                </div>
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="flex flex-col items-center py-12 gap-3">
                  <Shield className="w-12 h-12 text-green-400" />
                  <p className="text-white font-medium">No threats detected</p>
                  <p className="text-gray-400 text-sm">This log file appears clean.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}