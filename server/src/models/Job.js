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

module.exports = mongoose.model('Job', jobSchema);
