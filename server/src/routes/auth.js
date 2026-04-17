const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { sendVerificationEmail } = require('../utils/email');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be candidate or recruiter'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, role } = req.body;
      const existing = await User.findOne({ email: String(email) });
      if (existing) return res.status(400).json({ success: false, message: 'Email already in use' });

      const user = await User.create({ name, email, password, role });
      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl,
      });

      const response = {
        success: true,
        message: 'Account created. Please verify your email before signing in.',
        email: user.email,
      };

      if (process.env.NODE_ENV !== 'production') {
        response.devVerificationUrl = verificationUrl;
      }

      res.status(201).json(response);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email: String(email) }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }
      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before signing in.',
          needsEmailVerification: true,
          email: user.email,
        });
      }
      const token = generateToken(user._id, user.role);
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/verify-email
router.post(
  '/verify-email',
  [body('token').notEmpty().withMessage('Verification token is required')],
  validate,
  async (req, res, next) => {
    try {
      const { token } = req.body;
      const hashed = crypto.createHash('sha256').update(String(token)).digest('hex');
      const user = await User.findOne({
        emailVerificationToken: hashed,
        emailVerificationExpires: { $gt: new Date() },
      }).select('+emailVerificationToken +emailVerificationExpires');

      if (!user) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      await user.save();

      res.json({ success: true, message: 'Email verified successfully. You can now sign in.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/resend-verification
router.post(
  '/resend-verification',
  [body('email').isEmail().withMessage('Valid email is required')],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+emailVerificationToken +emailVerificationExpires');
      if (!user) {
        return res.json({ success: true, message: 'If the account exists, a verification email has been sent.' });
      }
      if (user.emailVerified) {
        return res.status(400).json({ success: false, message: 'Email is already verified.' });
      }

      const verificationToken = user.generateEmailVerificationToken();
      await user.save();

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;
      await sendVerificationEmail({
        email: user.email,
        name: user.name,
        verificationUrl,
      });

      const response = { success: true, message: 'Verification email sent.' };
      if (process.env.NODE_ENV !== 'production') {
        response.devVerificationUrl = verificationUrl;
      }
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({
      success: true,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
