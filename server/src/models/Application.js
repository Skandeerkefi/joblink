const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  resume: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  status: {
    type: String,
    enum: ['APPLIED', 'VIEWED', 'INTERVIEW', 'REJECTED', 'HIRED'],
    default: 'APPLIED',
  },
  coverLetter: { type: String },
  atsScore: { type: Number, min: 0, max: 100 },
  atsBreakdown: { type: mongoose.Schema.Types.Mixed },
  matchScore: { type: Number, min: 0, max: 100 },
  matchBreakdown: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

applicationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

module.exports = mongoose.model('Application', applicationSchema);
