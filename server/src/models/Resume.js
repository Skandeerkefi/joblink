const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  school: { type: String },
  degree: { type: String },
  field: { type: String },
  startYear: { type: String },
  endYear: { type: String },
  details: { type: String },
}, { _id: false });

const experienceSchema = new mongoose.Schema({
  company: { type: String },
  title: { type: String },
  location: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  current: { type: Boolean, default: false },
  bullets: [{ type: String }],
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String },
  link: { type: String },
  description: { type: String },
  bullets: [{ type: String }],
}, { _id: false });

const certificationSchema = new mongoose.Schema({
  name: { type: String },
  issuer: { type: String },
  issueDate: { type: String },
  credentialId: { type: String },
  link: { type: String },
}, { _id: false });

const personalInfoSchema = new mongoose.Schema({
  fullName: { type: String },
  email: { type: String },
  phone: { type: String },
  location: { type: String },
  links: [{ type: String }],
}, { _id: false });

const manualDataSchema = new mongoose.Schema({
  personalInfo: { type: personalInfoSchema, default: () => ({}) },
  summary: { type: String },
  skills: [{ type: String }],
  certifications: [certificationSchema],
  education: [educationSchema],
  experience: [experienceSchema],
  projects: [projectSchema],
}, { _id: false });

const resumeSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['UPLOAD', 'MANUAL'], default: 'UPLOAD' },
  // UPLOAD fields
  filename: { type: String },
  originalName: { type: String },
  fileUrl: { type: String },
  fileSize: { type: Number },
  mimeType: { type: String },
  parsedText: { type: String },
  parseStatus: { type: String, enum: ['NOT_PARSED', 'PARSED', 'FAILED'], default: 'NOT_PARSED' },
  parseError: { type: String },
  parsedAt: { type: Date },
  // MANUAL fields
  title: { type: String },
  manualData: { type: manualDataSchema },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resume', resumeSchema);
