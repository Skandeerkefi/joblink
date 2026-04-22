# JobLink

A full-stack job platform for candidates, recruiters, and admins, including resume management, ATS analysis, and job matching.

## Full Architecture

### High-level architecture

```text
Client (React + Vite + TypeScript)
        |
        | HTTPS (JWT in Authorization header)
        v
Backend API (Node.js + Express)
  - Auth / Jobs / Resumes / Applications / Profile / Saved Jobs / Admin
  - ATS score + Match score engine
        |
        v
MongoDB (Mongoose models)
```

### Backend architecture (`/server`)

- `src/app.js`: Express app setup (CORS, rate limits, routes, error handler)
- `src/index.js`: server entrypoint
- `src/models`: `User`, `Job`, `Resume`, `Application`, `SavedJob`, `CandidateProfile`
- `src/routes`: `auth`, `jobs`, `resumes`, `applications`, `profile`, `savedJobs`, `admin`
- `src/utils/scoring.js`: ATS scoring and job match scoring rules
- `src/utils/resumeParser*`: uploaded resume text extraction/parsing flow
- `src/middleware`: auth/role middleware + centralized error handling
- `src/constants`: shared backend enums and fixed vocabularies

### Frontend architecture (`/client`)

- `src/App.tsx`: routing and role-based protected pages
- `src/api/axios.ts`: API client + JWT request interceptor
- `src/context`: auth, theme, language state providers
- `src/pages`: public pages + role-based dashboards/pages
  - Candidate: resume tools, ATS checker, applications, saved jobs, profile
  - Recruiter: jobs CRUD, applicants pipeline, dashboard
  - Admin: users management
- `src/components`: reusable UI (navigation, guards, shared views)
- `src/constants`: API config, categories, UI constants

## Stack Used

- **Frontend**
  - React 18
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Router v6
  - Axios
- **Backend**
  - Node.js + Express
  - Mongoose (MongoDB ODM)
  - JWT authentication
  - `express-validator`, `express-rate-limit`, `cors`
- **Data & File Processing**
  - MongoDB
  - Multer (uploads)
  - `pdf-parse` + `mammoth` (resume text extraction)
- **Email / Notifications**
  - Nodemailer
  - Resend
- **Deployment**
  - Railway (backend/API)
  - Vercel (frontend)

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

## Local Setup

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
```

Server runs at http://localhost:5000

### Client

```bash
cd client
npm install
cp .env.example .env
# Edit .env if needed (default API URL points to Railway API)
# For local backend development, set: VITE_API_URL=http://localhost:5000/api
npm run dev
```

Client runs at http://localhost:5173

### Seed Database (optional)

```bash
cd server
npm run seed
```

This creates test accounts:
- Candidate: `test@candidate.com` / `password123`
- Recruiter: `test@recruiter.com` / `password123`

## Deployment

### Backend deployment on Railway

1. Create a Railway project and deploy from this repository.
2. Set **Root Directory** to `server`.
3. Build/Start:
   - Install: `npm install`
   - Start: `npm start`
4. Set environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://<your-frontend-vercel-domain>`
5. After deploy, copy your API URL (example: `https://your-project-name.up.railway.app/api`).

### Frontend deployment on Vercel

1. Create a Vercel project from the same repository.
2. Set **Root Directory** to `client`.
3. Framework preset: Vite (auto-detected).
4. Set environment variables:
   - `VITE_API_URL=https://your-project-name.up.railway.app/api`
   - Optional branding:
     - `VITE_PLATFORM_LOGO_URL`
     - `VITE_PLATFORM_LOGO_ALT`
5. Deploy and verify:
   - Auth/login flows
   - Job listing and details
   - ATS checker requests to Railway backend

## ATS Testing Principles & Match Score Rules (Logic)

### ATS score principles

ATS score is calculated per resume (`/api/resumes/:id/analysis`), with a maximum score of 100:

- **Uploaded resume path**
  - If parsing is missing/failed: safe fallback score with explanatory note
  - If parsed: score combines contact, structure, length, and content signals
- **Manual resume path**
  - Score is based on completed profile fields and content richness:
    - contact info, summary, skills, experience, education, projects, certifications
- Output includes a numeric score and detailed breakdown for transparency.

### Match score formula (current logic)

Final score (0–100) is a weighted formula:

`(Skills * 0.4) + (Experience * 0.25) + (Education * 0.1) + (Keywords/Tools * 0.15) + (Bonus * 0.1)`

Rules used:

- **Skills match**
  - Required skills + optional skills (optional weighted at half)
  - Token normalization and threshold matching are applied
- **Experience match**
  - Candidate years are extracted from manual entries or parsed text
  - Compared against required years (from job level/text)
  - Tiered penalties if candidate years are below requirement
- **Education match**
  - Degree level inferred from resume/job text (Associate/Bachelor/Master/PhD tiers)
  - Field relevance estimated from category + job keyword overlap
- **Keywords/Tools match**
  - Tools/keywords extracted from job title/description/skills
  - Stopwords removed; overlap measured against resume tokens
- **Bonus**
  - Additional score from projects, certifications, and portfolio links
- **Improvement tips**
  - System returns actionable tips for missing required skills/tools and weak areas

### Testing principles for ATS and matching logic

When validating ATS/match logic, test with deterministic fixtures:

1. **Determinism**
   - Same resume + same job must always return same score/breakdown.
2. **Bounds and caps**
   - Every subscore and final score must remain in `[0, 100]`.
3. **Path coverage**
   - Test both resume types:
     - uploaded and parsed resume
     - uploaded parse-failed/pending fallback
     - manual resume
4. **Edge cases**
   - Empty/missing resume, missing job, invalid IDs, no skills, no tools.
5. **Threshold behavior**
   - Experience ratio boundaries and education level transitions.
6. **Tips quality**
   - Ensure tips appear when components are weak and are absent when match is strong.
