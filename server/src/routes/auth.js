const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

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

      await User.create({ name, email, password, role });
      res.status(201).json({
        success: true,
        message: 'Account created successfully. You can now sign in.',
      });
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
      const token = generateToken(user._id, user.role);
      res.json({
        success: true,
        token,
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
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
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/auth/account
router.put(
  '/account',
  protect,
  [
    body('name').optional().isString().trim().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('currentPassword')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('Current password must be at least 6 characters'),
    body('newPassword')
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.id).select('+password');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      if (email && String(email).toLowerCase() !== user.email) {
        const existing = await User.findOne({ email: String(email).toLowerCase() });
        if (existing && existing._id.toString() !== user._id.toString()) {
          return res.status(400).json({ success: false, message: 'Email already in use' });
        }
        user.email = String(email).toLowerCase();
      }

      if (name !== undefined) user.name = String(name).trim();

      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ success: false, message: 'Current password is required to change password' });
        }
        const validPassword = await user.matchPassword(String(currentPassword));
        if (!validPassword) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }
        user.password = String(newPassword);
      }

      await user.save();
      return res.json({
        success: true,
        message: 'Account updated successfully',
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
