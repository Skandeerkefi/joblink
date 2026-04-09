const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { protect, authorize } = require('../middleware/auth');

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

// POST /api/resumes
router.post('/', protect, authorize('candidate'), upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const resume = await Resume.create({
      candidate: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
    res.status(201).json({ success: true, resume });
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

// DELETE /api/resumes/:id
router.delete('/:id', protect, authorize('candidate'), async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (resume.candidate.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const filePath = path.join(uploadsDir, resume.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
