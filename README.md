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
# Edit .env with your MongoDB URI, JWT secret and optional Resend credentials for email verification
npm run dev
```

Server runs at http://localhost:5000

### Email verification (optional Resend config)

To send real verification emails, configure these server env vars:

- `RESEND_API_KEY` (Resend API key)
- `RESEND_FROM` (verified sender address, e.g. `onboarding@resend.dev`)

If Resend is not configured, verification emails are logged as JSON payloads in server logs (development fallback).
When the email provider is unreachable, auth endpoints return `503 Service Unavailable` with a clear message instead of a generic `500` error.

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
- Optional email vars: `RESEND_API_KEY`, `RESEND_FROM`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Auth**: JWT
