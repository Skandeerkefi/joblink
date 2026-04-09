const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/jobs
router.get('/', async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = String(req.query.category);
    const jobs = await Job.find(filter).populate('recruiter', 'name').sort({ createdAt: -1 });
    res.json({ success: true, jobs });
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
      const { title, description, location, jobType, category, skills } = req.body;
      const job = await Job.create({
        recruiter: req.user.id,
        title,
        description,
        location,
        jobType,
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
    const { title, description, location, jobType, category, skills, isActive } = req.body;
    const allowedUpdates = {};
    if (title !== undefined) allowedUpdates.title = String(title);
    if (description !== undefined) allowedUpdates.description = String(description);
    if (location !== undefined) allowedUpdates.location = String(location);
    if (jobType !== undefined) allowedUpdates.jobType = String(jobType);
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

module.exports = router;
