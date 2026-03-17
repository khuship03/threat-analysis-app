# Threat Analysis App
 
An AI-powered log file threat detection and analysis platform. Upload any system, network, or application log file and receive a detailed security analysis powered by Claude AI — including detected threats, anomaly explanations, confidence scores, and actionable recommendations.
 
---

## Overview
 
The Threat Analysis App allows security analysts to:
 
- Register and log in securely with JWT-based authentication
- Upload log files (`.log` or `.txt`, up to 10MB)
- Receive AI-powered threat analysis with severity levels (LOW / MEDIUM / HIGH / CRITICAL)
- View detected anomalies with confidence scores and specific pattern explanations
- Manage uploaded logs from a central dashboard
 
---

## Tech Stack
 
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (TypeScript), Tailwind CSS, |
| Backend | Node.js + Express (TypeScript) |
| Database | PostgreSQL + Prisma ORM |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Auth | JWT (access + refresh tokens) |
 
---

## AI Model & Anomaly Detection Approach
 
### Model Used
 
This application uses **Anthropic's Claude `claude-sonnet-4-6`** model for all threat detection and anomaly analysis.

### How It Works
 
When a log file is uploaded, the backend reads its contents and sends them to Claude with a carefully engineered system prompt. The prompt instructs Claude to:
 
1. **Auto-detect the log format** — Claude identifies whether the file is an Apache access log, Snort IDS log, SSH auth log, firewall log, Windows Event log, or any other format before analysis begins.
 
2. **Perform threat detection** — Claude scans the log entries for known attack patterns including brute force attempts, SQL injection, directory traversal, C2 communications, malware downloads, data exfiltration, privilege escalation, and more.
 
3. **Assign threat levels** — Each detected threat is assigned a severity of LOW, MEDIUM, HIGH, or CRITICAL. The overall file threat level reflects the highest severity found.
 
4. **Generate anomaly explanations** — For each threat, Claude provides an `anomalyReason` field: a one-sentence plain-English explanation of the specific behavioral pattern that triggered the flag (e.g., _"Unusually high number of failed login attempts from a single IP in a short time frame"_).
 
5. **Assign confidence scores** — Each detected threat includes a `confidenceScore` (0–100) representing how certain Claude is that the flagged entry represents a real threat, based on the specificity and volume of evidence in the logs.
 
6. **Provide actionable recommendations** — Every threat card includes a concise, specific recommendation for remediation.

### Response Structure
 
Claude is prompted to return a structured JSON object:
 
```json
{
  "threatLevel": "CRITICAL",
  "summary": "Executive summary of findings...",
  "threats": [
    {
      "type": "Brute Force Attack",
      "severity": "HIGH",
      "description": "Detailed description referencing specific log entries...",
      "sourceIp": "192.168.1.105",
      "destinationUrl": "http://example.com/login",
      "timestamp": "2026-03-16 09:12:34",
      "recommendation": "Block IP and enforce account lockout policies.",
      "confidenceScore": 92,
      "anomalyReason": "Over 500 failed login attempts from a single IP within 2 minutes."
    }
  ]
}
```
 
---

## Prerequisites
 
Make sure the following are installed on your machine before proceeding:
 
- **Node.js** v20 or higher — https://nodejs.org
- **npm** v10 or higher
- **PostgreSQL** v15 or higher — https://www.postgresql.org/download
- **Git** — https://git-scm.com
- An **Anthropic API key** — https://console.anthropic.com
 
---

## Local Setup & Installation
 
### 1. Clone the repository
 
```bash
git clone https://github.com/YOUR_USERNAME/threat-analysis-app.git
cd threat-analysis-app
```
 
### 2. Set up the PostgreSQL database
 
Open a PostgreSQL shell:
 
```bash
psql -U postgres
```
 
Run the following SQL commands:
 
```sql
CREATE DATABASE "db-analysis";
CREATE USER analyser WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE "db-analysis" TO analyser;
\c db-analysis
GRANT ALL ON SCHEMA public TO analyser;
ALTER USER analyser CREATEDB;
\q
```
 
### 3. Set up the Backend
 
```bash
cd backend
npm install
```
Create a `.env` file in the `backend/` directory:
 
```env
DATABASE_URL="postgresql://analyser:your_password_here@localhost:5432/db-analysis"
JWT_ACCESS_SECRET="your-access-secret-min-32-characters-long"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-characters-long"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
ANTHROPIC_API_KEY="sk-ant-your-api-key-here"
PORT=4000
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE_MB=10
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```
 
Run Prisma migrations to set up the database schema:
 
```bash
npx prisma generate
npx prisma migrate dev --name init
```
 
### 4. Set up the Frontend
 
```bash
cd ../frontend
npm install
```
 
Create a `.env.local` file in the `frontend/` directory:
 
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```
 
---

## Running the Application
 
You need **two terminals running simultaneously** — one for the backend, one for the frontend.
 
### Terminal 1 — Start the Backend
 
```bash
cd threat-analysis-app/backend
npm run dev
```
 
The backend will start at: `http://localhost:4000`
Health check: `http://localhost:4000/api/health`
 
### Terminal 2 — Start the Frontend
 
```bash
cd threat-analysis-app/frontend
npm run dev
```
 
The frontend will start at: `http://localhost:3000`
 
Open `http://localhost:3000` in your browser — you will be redirected to the login page.
 
---

## Environment Variables
 
### Backend (`backend/.env`)
 
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db-analysis` |
| `JWT_ACCESS_SECRET` | Secret for signing access tokens (min 32 chars) | `my-super-secret-access-key-here` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens (min 32 chars) | `my-super-secret-refresh-key-here` |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | `sk-ant-...` |
| `PORT` | Backend server port | `4000` |
| `UPLOAD_DIR` | Directory for uploaded files | `./uploads` |
| `MAX_FILE_SIZE_MB` | Max upload file size in MB | `10` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
 
### Frontend (`frontend/.env.local`)
 
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |
 
---

## Sample Log Files for Testing
 
Eight sample log files are provided in the `sample-logs/` directory for testing. 

To test the application:
 
1. Register a new account at `http://localhost:3000/register`
2. Log in with your credentials
3. Click **Upload Log** on the dashboard
4. Select one of the sample log files
5. Click **Upload & Analyze**
6. Wait 15–30 seconds for Claude AI to analyze the file
7. View the results including detected threats, anomaly reasons, and confidence scores
 
---

## API Endpoints
 
### Authentication
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create a new account |
| POST | `/api/auth/login` | Login and receive tokens |
| POST | `/api/auth/refresh` | Refresh access token |
 
### Log Files
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logs/upload` | Upload a log file |
| GET | `/api/logs` | List all uploaded logs (paginated) |
| GET | `/api/logs/:id` | Get a single log file |
| DELETE | `/api/logs/:id` | Delete a log file |
 
### Analysis
 
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/:logId/run` | Run AI analysis on a log file |
| GET | `/api/analysis/:logId` | Get analysis results |
 
All protected endpoints require the `Authorization: Bearer <token>` header.
 
---

## Database Schema
 
The application uses three main tables:
 
- **User** — stores registered users with hashed passwords and roles (ANALYST / ADMIN)
- **LogFile** — stores metadata about uploaded log files including storage path and analysis status
- **Analysis** — stores the full AI analysis results including threat level, summary, and individual threat items as JSON
 
---

## Notes

- File size is limited to 10MB per upload
- Only `.log` and `.txt` file formats are accepted
- Analysis typically takes 15–30 seconds depending on file size
- The AI analysis uses Claude `claude-sonnet-4-6` — ensure your Anthropic account has sufficient credits
 