const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const Job = require('../models/Job');
const { protect, authorize } = require('../middleware/auth');
const { calculateAtsScore, calculateMatchScore } = require('../utils/scoring');
const {
  ensureUploadedResumeParsed,
  parseResumeFile,
  extractManualDataFromText,
} = require('../utils/resumeParser');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// POST /api/resumes  (file upload)
router.post('/', protect, authorize('candidate'), upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const resume = await Resume.create({
      candidate: req.user.id,
      type: 'UPLOAD',
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    await ensureUploadedResumeParsed(resume, uploadsDir);
    res.status(201).json({ success: true, resume });
  } catch (err) {
    next(err);
  }
});

// POST /api/resumes/manual/prefill  (parse upload and prefill manual CV draft)
router.post('/manual/prefill', protect, authorize('candidate'), upload.single('resume'), async (req, res, next) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const uploadedFilePath = path.join(uploadsDir, req.file.filename);

  try {
    const parsedText = await parseResumeFile({
      filePath: uploadedFilePath,
      mimeType: req.file.mimetype,
      originalName: req.file.originalname,
      allowedDir: uploadsDir,
    });
    const manualData = extractManualDataFromText(parsedText);
    const basename = path.parse(req.file.originalname || 'CV').name || 'My CV';
    const title = `${basename}`.trim() || 'My CV';

    return res.status(200).json({
      success: true,
      draft: {
        title,
        manualData,
      },
      parsed: Boolean(parsedText && parsedText.trim()),
    });
  } catch (err) {
    return next(err);
  } finally {
    if (fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
  }
});

// POST /api/resumes/manual  (create manual CV)
router.post('/manual', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const { title, manualData } = req.body;
    const resume = await Resume.create({
      candidate: req.user.id,
      type: 'MANUAL',
      title: title || 'My CV',
      manualData: manualData || {},
    });
    res.status(201).json({ success: true, resume });
  } catch (err) {
    next(err);
  }
});

// PUT /api/resumes/:id/manual  (update manual CV)
router.put('/:id/manual', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.candidate.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (resume.type !== 'MANUAL') {
      return res.status(400).json({ success: false, message: 'Not a manual resume' });
    }
    const { title, manualData } = req.body;
    if (title !== undefined) resume.title = title;
    if (manualData !== undefined) resume.manualData = manualData;
    await resume.save();
    res.json({ success: true, resume });
  } catch (err) {
    next(err);
  }
});

// GET /api/resumes/mine
router.get('/mine', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const resumes = await Resume.find({ candidate: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, resumes });
  } catch (err) {
    next(err);
  }
});

// GET /api/resumes/:id
router.get('/:id', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.candidate.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, resume });
  } catch (err) {
    next(err);
  }
});

// GET /api/resumes/:id/analysis?jobId=...
router.get('/:id/analysis', protect, authorize('candidate'), async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid resume id' });
    }
    const resumeObjectId = new mongoose.Types.ObjectId(String(req.params.id));
    const resume = await Resume.findById(resumeObjectId);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.candidate.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    await ensureUploadedResumeParsed(resume, uploadsDir);

    const ats = calculateAtsScore(resume);
    let match = null;
    if (req.query.jobId) {
      if (!mongoose.Types.ObjectId.isValid(String(req.query.jobId))) {
        return res.status(400).json({ success: false, message: 'Invalid job id' });
      }
      const jobObjectId = new mongoose.Types.ObjectId(String(req.query.jobId));
      const job = await Job.findById(jobObjectId);
      if (job) match = calculateMatchScore(resume, job);
    }

    res.json({
      success: true,
      analysis: {
        atsScore: ats.score,
        atsBreakdown: ats.breakdown,
        matchScore: match ? match.score : null,
        matchBreakdown: match ? match.breakdown : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/resumes/:id
router.delete('/:id', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.candidate.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (resume.type === 'UPLOAD' && resume.filename) {
      const filePath = path.join(uploadsDir, resume.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
