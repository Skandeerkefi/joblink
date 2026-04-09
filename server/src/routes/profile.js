const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const CandidateProfile = require('../models/CandidateProfile');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/profile/me — candidate or recruiter can see their own profile
router.get('/me', protect, async (req, res, next) => {
  try {
    let profile = await CandidateProfile.findOne({ user: req.user.id }).lean();
    if (!profile) {
      profile = { user: req.user.id, bio: '', skills: [], education: [] };
    }
    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

// PUT /api/profile/me — only candidates can update their profile
router.put(
  '/me',
  protect,
  authorize('candidate'),
  [
    body('bio').optional().isString().isLength({ max: 1000 }).withMessage('Bio must be at most 1000 characters'),
    body('skills').optional().isArray().withMessage('Skills must be an array'),
    body('skills.*').optional().isString().trim().notEmpty().withMessage('Each skill must be a non-empty string'),
    body('education').optional().isArray().withMessage('Education must be an array'),
    body('education.*.school').optional().isString().notEmpty().withMessage('School name is required'),
    body('education.*.startYear').optional().isInt({ min: 1900, max: 2100 }).withMessage('Invalid start year'),
    body('education.*.endYear').optional().isInt({ min: 1900, max: 2100 }).withMessage('Invalid end year'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { bio, skills, education } = req.body;
      const updates = { updatedAt: Date.now() };
      if (bio !== undefined) updates.bio = String(bio).slice(0, 1000);
      if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills.map(String).filter(Boolean) : [];
      if (education !== undefined) updates.education = Array.isArray(education) ? education : [];

      const profile = await CandidateProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: updates },
        { new: true, upsert: true, runValidators: true }
      );
      res.json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
