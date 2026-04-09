const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema(
  {
    school: { type: String, required: true, trim: true },
    degree: { type: String, trim: true },
    field: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
  },
  { _id: true }
);

const candidateProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, trim: true, maxlength: 1000 },
  skills: [{ type: String, trim: true }],
  education: [educationSchema],
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);
