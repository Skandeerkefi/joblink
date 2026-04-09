const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');

// POST /api/applications
router.post('/', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const { jobId, resumeId, coverLetter } = req.body;
    const existing = await Application.findOne({ job: String(jobId), candidate: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied to this job' });
    const application = await Application.create({
      job: jobId,
      candidate: req.user.id,
      resume: resumeId || undefined,
      coverLetter,
    });
    res.status(201).json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/mine
router.get('/mine', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title location category jobType')
      .populate('resume', 'originalName fileUrl')
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/for-my-jobs
router.get('/for-my-jobs', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const jobs = await Job.find({ recruiter: req.user.id }).select('_id');
    const jobIds = jobs.map((j) => j._id);
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('job', 'title location category')
      .populate('candidate', 'name email')
      .populate('resume', 'originalName fileUrl')
      .sort({ createdAt: -1 });
    res.json({ success: true, applications });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status
const VALID_STATUSES = ['APPLIED', 'VIEWED', 'INTERVIEW', 'REJECTED', 'HIRED'];

router.patch('/:id/status', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    application.status = status;
    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
