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

- `SMTP_HOST`
- `SMTP_PORT` (default `587`)
- `SMTP_SECURE` (`true`/`false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

If SMTP is not configured, verification emails are logged as JSON payloads in server logs (development fallback).

### Client

```bash
cd client
npm install
cp .env.example .env
# Edit .env if needed (default API URL is http://localhost:5000/api)
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

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, React Router v6
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB
- **Auth**: JWT
