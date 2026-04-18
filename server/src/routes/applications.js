const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const { protect, authorize } = require('../middleware/auth');
const { calculateAtsScore, calculateMatchScore } = require('../utils/scoring');
const { ensureUploadedResumeParsed } = require('../utils/resumeParser');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');

// POST /api/applications
router.post('/', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const { jobId, resumeId, coverLetter } = req.body;
    if (!jobId || !mongoose.Types.ObjectId.isValid(String(jobId))) {
      return res.status(400).json({ success: false, message: 'Invalid jobId' });
    }
    if (resumeId && !mongoose.Types.ObjectId.isValid(String(resumeId))) {
      return res.status(400).json({ success: false, message: 'Invalid resumeId' });
    }
    const jobObjectId = new mongoose.Types.ObjectId(String(jobId));
    const resumeObjectId = resumeId ? new mongoose.Types.ObjectId(String(resumeId)) : null;
    const existing = await Application.findOne({ job: jobObjectId, candidate: req.user.id });
    if (existing) return res.status(400).json({ success: false, message: 'Already applied to this job' });

    const job = await Job.findById(jobObjectId);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    let resume;
    if (resumeObjectId) {
      resume = await Resume.findById(resumeObjectId);
      if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
      if (resume.candidate.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized to use this resume' });
      }
      await ensureUploadedResumeParsed(resume, uploadsDir);
    }

    const ats = calculateAtsScore(resume);
    const match = calculateMatchScore(resume, job);

    const application = await Application.create({
      job: jobObjectId,
      candidate: req.user.id,
      resume: resumeObjectId || undefined,
      coverLetter,
      atsScore: ats.score,
      atsBreakdown: ats.breakdown,
      matchScore: match.score,
      matchBreakdown: match.breakdown,
    });
    res.status(201).json({ success: true, application, score: { ats: ats.score, match: match.score } });
  } catch (err) {
    next(err);
  }
});

// GET /api/applications/mine
router.get('/mine', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job', 'title location category jobType')
      .populate('resume', 'type title originalName fileUrl manualData')
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
      .populate('resume', 'type title originalName fileUrl manualData')
      .sort({ matchScore: -1, createdAt: -1 });

    if (req.query.group === 'true') {
      const grouped = {};
      const STATUSES = ['APPLIED', 'VIEWED', 'INTERVIEW', 'REJECTED', 'HIRED'];
      STATUSES.forEach((s) => { grouped[s] = []; });
      applications.forEach((app) => {
        if (grouped[app.status]) grouped[app.status].push(app);
        else console.warn(`Unhandled application status "${app.status}" for application ${app._id}`);
      });
      return res.json({ success: true, grouped });
    }

    const applicationsByJob = {};
    applications.forEach((app) => {
      const job = app.job;
      if (!job) return;
      const key = String(job._id);
      if (!applicationsByJob[key]) {
        applicationsByJob[key] = {
          job: {
            _id: job._id,
            title: job.title,
            location: job.location,
            category: job.category,
          },
          applications: [],
        };
      }
      applicationsByJob[key].applications.push(app);
    });

    res.json({ success: true, applications, applicationsByJob: Object.values(applicationsByJob) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/applications/:id/status
const VALID_STATUSES = ['APPLIED', 'VIEWED', 'INTERVIEW', 'REJECTED', 'HIRED'];

router.patch('/:id/status', protect, authorize('recruiter'), async (req, res, next) => {
  try {
    const { status, interviewAt } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
    }
    let parsedInterviewAt = null;
    if (status === 'INTERVIEW') {
      if (!interviewAt) {
        return res.status(400).json({ success: false, message: 'interviewAt is required for INTERVIEW status' });
      }
      parsedInterviewAt = new Date(interviewAt);
      if (Number.isNaN(parsedInterviewAt.getTime())) {
        return res.status(400).json({ success: false, message: 'Invalid interviewAt date-time' });
      }
    }
    const application = await Application.findById(req.params.id).populate('job');
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    if (application.job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (status === 'INTERVIEW' && parsedInterviewAt) {
      const interviewDateText = parsedInterviewAt.toLocaleString();
      const jobTitle = application.job?.title || 'the selected position';
      application.interviewAt = parsedInterviewAt;
      application.notifications = application.notifications || [];
      application.notifications.push({
        message: `Interview scheduled for "${jobTitle}" on ${interviewDateText}.`,
      });
    } else if (status !== 'INTERVIEW') {
      application.interviewAt = undefined;
    }

    application.status = status;
    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
