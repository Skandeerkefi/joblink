# JobLink

A full-stack job platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

## Setup

### Server

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret and optional SMTP credentials for email verification
npm run dev
```

Server runs at http://localhost:5000

### Email verification (optional SMTP config)

To send real verification emails, configure these server env vars:

- `SMTP_HOST` (SMTP server host, e.g. `smtp.gmail.com`)
- `SMTP_PORT` (usually `587` for STARTTLS or `465` for SSL/TLS)
- `SMTP_SECURE` (`false` for `587`, `true` for `465`)
- `SMTP_USER` (SMTP username/login)
- `SMTP_PASS` (SMTP password/app-password)
- `SMTP_FROM` (sender email shown to users)
- `SMTP_CONNECTION_TIMEOUT_MS` (default `15000`)
- `SMTP_GREETING_TIMEOUT_MS` (default `10000`)
- `SMTP_SOCKET_TIMEOUT_MS` (default `20000`)

If SMTP is not configured, verification emails are logged as JSON payloads in server logs (development fallback).
If SMTP resolves to IPv6 but the host network cannot route IPv6, the server automatically retries using an IPv4 SMTP address.

### Client

```bash
cd client
npm install
cp .env.example .env
# Edit .env if needed (default API URL is https://joblink-production-00f1.up.railway.app/api)
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

## Deploy to Vercel (frontend + backend in one project)

This repository includes a root `vercel.json` that:
- serves the React app from `client/dist`
- runs Express API from `api/index.js`
- routes `/api/*` and `/uploads/*` to the backend
- uses SPA fallback routing to `index.html`

Set these environment variables in Vercel:
- `MONGO_URI`
- `JWT_SECRET`
- `CLIENT_URL` (your deployed frontend URL; comma-separated list is supported)
- Optional email vars: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Auth**: JWT
