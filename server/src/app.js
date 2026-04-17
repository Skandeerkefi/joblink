require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.set('trust proxy', 1);
app.locals.dbConnectionError = null;

connectDB().catch((error) => {
  app.locals.dbConnectionError = error;
  console.error(`Database connection failed: ${error.message}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

// CORS Middleware
const allowedOrigins = [
  'https://joblink-zeta.vercel.app',
];

const inferredOrigins = [process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

if (process.env.NODE_ENV !== 'production') {
  inferredOrigins.push('http://localhost:5173');
}

const corsOrigins = [...new Set([...allowedOrigins, ...configuredOrigins, ...inferredOrigins])];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/auth', authLimiter);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', apiLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/status', (req, res) => {
  if (app.locals.dbConnectionError) {
    return res.status(503).json({
      success: false,
      status: 'degraded',
      message: 'API is running but database is unavailable.',
    });
  }

  return res.json({ success: true, status: 'ok' });
});

app.use((req, res, next) => {
  if (req.path === '/api/status') return next();

  if (app.locals.dbConnectionError) {
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Check server configuration.',
    });
  }
  return next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/resumes', require('./routes/resumes'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/saved-jobs', require('./routes/savedJobs'));
app.use('/api/admin', require('./routes/admin'));

app.use(errorHandler);

module.exports = app;
