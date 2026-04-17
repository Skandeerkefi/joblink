const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

// GET /api/admin/users?role=recruiter|candidate|all
router.get('/users', async (req, res, next) => {
  try {
    const role = String(req.query.role || 'all');
    if (!['all', 'candidate', 'recruiter'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role filter' });
    }
    const filter = role === 'all' ? { role: { $in: ['candidate', 'recruiter'] } } : { role };

    const users = await User.find(filter).select('name email role createdAt').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin users cannot be modified here' });
    }

    const { name, email, role } = req.body;

    if (name !== undefined) user.name = String(name).trim();
    if (email !== undefined) user.email = String(email).toLowerCase().trim();
    if (role !== undefined) {
      if (!['candidate', 'recruiter'].includes(String(role))) {
        return res.status(400).json({ success: false, message: 'Role must be candidate or recruiter' });
      }
      user.role = String(role);
    }
    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    next(err);
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(String(req.params.id))) {
      return res.status(400).json({ success: false, message: 'Invalid user id' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Admin users cannot be deleted here' });
    }

    if (user.role === 'recruiter') {
      const jobs = await Job.find({ recruiter: user._id }).select('_id');
      const jobIds = jobs.map((j) => j._id);
      await Promise.all([
        Application.deleteMany({ job: { $in: jobIds } }),
        Job.deleteMany({ recruiter: user._id }),
      ]);
    } else {
      await Application.deleteMany({ candidate: user._id });
    }

    await user.deleteOne();

    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
