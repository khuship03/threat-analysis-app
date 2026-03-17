import fs from 'fs';
import Anthropic from '@anthropic-ai/sdk';
import { prisma } from '../config/database';
import { AppError } from '../middleware/error.middleware';
export type ThreatLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface ThreatItem {
  type: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  sourceIp?: string;
  destinationUrl?: string;
  timestamp?: string;
  recommendation: string;
  confidenceScore: number;
  anomalyReason: string;
}

export interface AnalysisResult {
  threatLevel: ThreatLevel;
  summary: string;
  threats: ThreatItem[];
  rawResponse: string;
}

const SYSTEM_PROMPT = `You are a cybersecurity expert specializing in analyzing all types of system, network, and application logs for security threats and anomalies.

You are capable of analyzing any log format including but not limited to:
- Web server logs (Apache, Nginx, IIS)
- Web proxy logs (ZScaler, Palo Alto, Squid)
- Firewall and network logs (iptables, pfSense, Cisco ASA)
- Authentication logs (SSH, Active Directory, OAuth)
- Application logs (Node.js, Python, Java, .NET)
- Cloud logs (AWS CloudTrail, Azure Monitor, GCP Audit)
- Operating system logs (Windows Event, syslog, auth.log)
- Database logs (MySQL, PostgreSQL, MongoDB)
- Intrusion detection logs (Snort, Suricata)

First identify the log format and type, then analyze it thoroughly for security threats and anomalies.

You must respond ONLY with a valid JSON object in this exact format with no additional text:
{
  "threatLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "summary": "A 2-3 sentence executive summary of findings including the log type detected",
  "threats": [
    {
      "type": "string (e.g. Brute Force Attack, SQL Injection, XSS, Directory Traversal, DDoS, Unauthorized Access, Data Exfiltration, Malware Download, C2 Communication, Privilege Escalation, Suspicious Activity, Policy Violation)",
      "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "description": "Detailed description of the threat referencing specific log entries",
      "sourceIp": "IP address if present in logs",
      "destinationUrl": "URL, domain or resource if present",
      "timestamp": "Timestamp from log entry if available",
      "recommendation": "Specific actionable recommendation to address this threat",
      "confidenceScore": <integer between 0 and 100 representing how confident you are this is a real threat>,
      "anomalyReason": "One sentence explaining the specific unusual pattern detected, e.g. 'Unusually high number of failed login attempts from a single IP in a short time frame' or 'Unexpected outbound connection to a known malicious domain outside business hours'"
    }
  ]
}

Rules:
- Auto-detect the log format and type before analyzing
- threatLevel must reflect the highest severity threat found
- If no threats are found, return threatLevel: "LOW" and an empty threats array
- Always reference specific entries, IPs, URLs, or patterns from the actual log data
- Do not include any text, explanation, or markdown outside the JSON object
- The response must be valid parseable JSON only
- Analyze for all common attack patterns: brute force, injection attacks, traversal, DDoS, unauthorized access, suspicious user agents, unusual traffic patterns, malware indicators, data exfiltration, privilege escalation, lateral movement
- Keep each threat description under 150 words
- Keep each recommendation under 75 words
- confidenceScore must be an integer from 0-100 based on how certain you are given the evidence in the logs
- anomalyReason must be a single sentence describing the specific behavioral pattern that triggered this flag
- Limit to a maximum of 5 threats, prioritizing the most severe ones
- Consolidate similar threat types into a single entry rather than repeating them`;

export const analyzeLogFile = async (
  logId: string,
  userId: string
): Promise<AnalysisResult> => {
  // Get log file from DB
  const logFile = await prisma.logFile.findUnique({
    where: { id: logId },
  });

  if (!logFile) throw new AppError('Log file not found.', 404);
  if (logFile.userId !== userId) throw new AppError('Access denied.', 403);
  if (logFile.status === 'PROCESSING') {
    throw new AppError('Analysis already in progress.', 409);
  }

  // Mark as processing
  await prisma.logFile.update({
    where: { id: logId },
    data: { status: 'PROCESSING' },
  });

  try {
    // Read file content
    const logContent = fs.readFileSync(logFile.storagePath, 'utf-8');

    if (!logContent.trim()) {
      throw new AppError('Log file is empty.', 400);
    }

    // Truncate if too large (Claude context limit safety)
    const maxChars = 80000;
    const truncated = logContent.length > maxChars;
    const contentToAnalyze = truncated
      ? logContent.substring(0, maxChars) + '\n... [truncated]'
      : logContent;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Analyze the following log file for security threats and anomalies. First identify the log type and format, then provide a concise security analysis with a maximum of 8 threats:\n\n${contentToAnalyze}`,
        },
      ],
    });

    // Extract text response
    const rawResponse = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    // Parse JSON response — strip markdown code fences if present
    let parsed: Omit<AnalysisResult, 'rawResponse'>;
    try {
      let cleaned = rawResponse
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();

      // If JSON is truncated, try to salvage by closing open structures
      if (!cleaned.endsWith('}')) {
        const lastCompleteThreat = cleaned.lastIndexOf('},');
        if (lastCompleteThreat > -1) {
          cleaned = cleaned.substring(0, lastCompleteThreat + 1) + '\n  ]\n}';
        } else {
          // No complete threat found, return minimal valid structure
          const summaryMatch = cleaned.match(/"summary"\s*:\s*"([^"]+)"/);
          const summary = summaryMatch ? summaryMatch[1] : 'Analysis was too large to process completely.';
          cleaned = `{"threatLevel": "HIGH", "summary": "${summary}", "threats": []}`;
        }
      }

      parsed = JSON.parse(cleaned);
    } catch {
      console.error('=== RAW AI RESPONSE ===');
      console.error(rawResponse);
      console.error('======================');
      throw new AppError('AI returned invalid response format.', 500);
    }

    // Validate threatLevel enum
    const validLevels: ThreatLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validLevels.includes(parsed.threatLevel)) {
      parsed.threatLevel = 'LOW';
    }

    // Ensure threats is always an array
    if (!Array.isArray(parsed.threats)) {
      parsed.threats = [];
    }

    // Limit to 8 threats max (safety net)
    if (parsed.threats.length > 8) {
      parsed.threats = parsed.threats.slice(0, 8);
    }

    // Save analysis to DB
    const analysis = await prisma.analysis.upsert({
      where: { logFileId: logId },
      update: {
        threatLevel: parsed.threatLevel,
        summary: parsed.summary,
        threats: parsed.threats as unknown as string,
        rawResponse,
        processedAt: new Date(),
      },
      create: {
        logFileId: logId,
        threatLevel: parsed.threatLevel,
        summary: parsed.summary,
        threats: parsed.threats as unknown as string,
        rawResponse,
      },
    });

    // Mark log as completed
    await prisma.logFile.update({
      where: { id: logId },
      data: { status: 'COMPLETED' },
    });

    return {
      threatLevel: analysis.threatLevel,
      summary: analysis.summary,
      threats: analysis.threats as unknown as ThreatItem[],
      rawResponse: analysis.rawResponse,
    };
  } catch (err) {
    // Mark as failed
    await prisma.logFile.update({
      where: { id: logId },
      data: { status: 'FAILED' },
    });
    throw err;
  }
};

export const getAnalysisResult = async (logId: string, userId: string) => {
  const logFile = await prisma.logFile.findUnique({
    where: { id: logId },
    include: { analysis: true },
  });

  if (!logFile) throw new AppError('Log file not found.', 404);
  if (logFile.userId !== userId) throw new AppError('Access denied.', 403);
  if (!logFile.analysis) throw new AppError('No analysis found for this log.', 404);

  return {
    ...logFile.analysis,
    threats: logFile.analysis.threats as unknown as ThreatItem[],
    logStatus: logFile.status,
  };
};