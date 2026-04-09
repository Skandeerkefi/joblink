const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number },
  mimeType: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resume', resumeSchema);
