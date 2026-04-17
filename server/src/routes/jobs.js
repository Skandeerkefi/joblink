const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Job = require('../models/Job');
const SavedJob = require('../models/SavedJob');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };

    // Category filter
    if (req.query.category) filter.category = String(req.query.category);

    // Location filter (case-insensitive partial match)
    if (req.query.location) {
      filter.location = new RegExp(req.query.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }

    // Job type filter
    if (req.query.jobType) filter.jobType = String(req.query.jobType);

    // Remote filter
    if (req.query.remote !== undefined && req.query.remote !== '') {
      filter.remote = req.query.remote === 'true';
    }

    // Skills filter (comma-separated, match any — case-insensitive)
    if (req.query.skills) {
      const skillList = String(req.query.skills).split(',').map((s) => s.trim()).filter(Boolean);
      if (skillList.length > 0) {
        filter.skills = {
          $elemMatch: {
            $in: skillList.map((s) => new RegExp(`^${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')),
          },
        };
      }
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // Sort options
    const sortParam = req.query.sort || 'newest';
    let sortObj = { createdAt: -1 };
    let useTextSearch = false;

    if (req.query.q && String(req.query.q).trim()) {
      const q = String(req.query.q).trim();
      filter.$text = { $search: q };
      useTextSearch = true;
      if (sortParam === 'relevance') {
        sortObj = { score: { $meta: 'textScore' }, createdAt: -1 };
      } else if (sortParam === 'oldest') {
        sortObj = { createdAt: 1 };
      } else if (sortParam === 'title') {
        sortObj = { title: 1 };
      } else {
        sortObj = { createdAt: -1 };
      }
    } else {
      if (sortParam === 'oldest') {
        sortObj = { createdAt: 1 };
      } else if (sortParam === 'title') {
        sortObj = { title: 1 };
      } else {
        sortObj = { createdAt: -1 };
      }
    }

    const projection = useTextSearch ? { score: { $meta: 'textScore' } } : {};

    const [jobs, total] = await Promise.all([
      Job.find(filter, projection).populate('recruiter', 'name').sort(sortObj).skip(skip).limit(limit),
      Job.countDocuments(filter),
    ]);
    const pages = Math.ceil(total / limit) || 1;
    res.json({ success: true, data: jobs, page, limit, total, pages });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id/similar
router.get('/:id/similar', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const limit = Math.min(10, Math.max(1, parseInt(req.query.limit) || 5));

    // Heuristic: same category + overlapping skills, excluding current job
    let similar = [];
    if (job.skills && job.skills.length > 0) {
      similar = await Job.find({
        _id: { $ne: job._id },
        isActive: true,
        category: job.category,
        skills: { $in: job.skills },
      })
        .populate('recruiter', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);
    }

    // Fallback: same category newest
    if (similar.length < limit) {
      const existingIds = similar.map((j) => j._id);
      existingIds.push(job._id);
      const fallback = await Job.find({
        _id: { $nin: existingIds },
        isActive: true,
        category: job.category,
      })
        .populate('recruiter', 'name')
        .sort({ createdAt: -1 })
        .limit(limit - similar.length);
      similar = [...similar, ...fallback];
    }

    res.json({ success: true, data: similar });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiter', 'name email');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    res.json({ success: true, job });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs
router.post(
  '/',
  protect,
  authorize('recruiter'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('category').notEmpty().withMessage('Category is required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { title, description, location, jobType, remote, category, skills } = req.body;
      const job = await Job.create({
        recruiter: req.user.id,
        title,
        description,
        location,
        jobType,
        remote: Boolean(remote),
        category,
        skills: skills || [],
      });
      res.status(201).json({ success: true, job });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/jobs/:id
router.patch('/:id', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const { title, description, location, jobType, remote, category, skills, isActive } = req.body;
    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = String(title);
    if (description !== undefined) allowedUpdates.description = String(description);
    if (location !== undefined) allowedUpdates.location = String(location);
    if (jobType !== undefined) allowedUpdates.jobType = String(jobType);
    if (remote !== undefined) allowedUpdates.remote = Boolean(remote);
    if (category !== undefined) allowedUpdates.category = String(category);
    if (skills !== undefined) allowedUpdates.skills = Array.isArray(skills) ? skills.map(String) : [];
    if (isActive !== undefined) allowedUpdates.isActive = Boolean(isActive);
    const updated = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    res.json({ success: true, job: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await job.deleteOne();
    res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/save
router.post('/:id/save', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
    const existing = await SavedJob.findOne({ candidate: req.user.id, job: req.params.id });
    if (existing) return res.status(400).json({ success: false, message: 'Job already saved' });
    const saved = await SavedJob.create({ candidate: req.user.id, job: req.params.id });
    res.status(201).json({ success: true, savedJob: saved });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/jobs/:id/save
router.delete('/:id/save', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const deleted = await SavedJob.findOneAndDelete({ candidate: req.user.id, job: req.params.id });
    if (!deleted) return res.status(404).json({ success: false, message: 'Saved job not found' });
    res.json({ success: true, message: 'Job unsaved' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
