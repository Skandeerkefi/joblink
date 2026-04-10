const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  createdAt: { type: Date, default: Date.now },
});

savedJobSchema.index({ candidate: 1, job: 1 }, { unique: true });
savedJobSchema.index({ candidate: 1, createdAt: -1 });

module.exports = mongoose.model('SavedJob', savedJobSchema);
