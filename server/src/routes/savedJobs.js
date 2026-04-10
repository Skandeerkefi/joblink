const express = require('express');
const router = express.Router();
const SavedJob = require('../models/SavedJob');
const { protect, authorize } = require('../middleware/auth');

// GET /api/saved-jobs/mine
router.get('/mine', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [savedJobs, total] = await Promise.all([
      SavedJob.find({ candidate: req.user.id })
        .populate({
          path: 'job',
          populate: { path: 'recruiter', select: 'name' },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SavedJob.countDocuments({ candidate: req.user.id }),
    ]);

    const pages = Math.ceil(total / limit) || 1;
    res.json({ success: true, data: savedJobs, page, limit, total, pages });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
