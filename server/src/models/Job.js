const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  location: { type: String, trim: true },
  jobType: {
    type: String,
    enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'REMOTE'],
    default: 'FULL_TIME',
  },
  experienceLevel: {
    type: String,
    enum: ['DEBUTANT', 'JUNIOR', 'INTERMEDIATE', 'SENIOR'],
    default: 'JUNIOR',
  },
  remote: { type: Boolean, default: false },
  category: {
    type: String,
    required: true,
    enum: [
      'SOFTWARE_ENGINEERING', 'DATA', 'CYBERSECURITY', 'PRODUCT', 'UI_UX',
      'MARKETING', 'SALES', 'BUSINESS_DEVELOPMENT', 'FINANCE', 'HR',
      'OPERATIONS', 'CUSTOMER_SUCCESS', 'OTHER',
    ],
  },
  skills: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

// Text index for full-text search on title and description
jobSchema.index({ title: 'text', description: 'text' });
// Indexes for filtering
jobSchema.index({ category: 1 });
jobSchema.index({ location: 1 });
jobSchema.index({ jobType: 1 });
jobSchema.index({ experienceLevel: 1 });
jobSchema.index({ remote: 1 });
jobSchema.index({ isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Job', jobSchema);
