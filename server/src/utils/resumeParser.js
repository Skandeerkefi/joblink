const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const cleanText = (text) =>
  String(text || '')
    .replace(/\u0000/g, ' ')
    .replace(/[^\S\r\n]+/g, ' ')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const getFileExtension = (filename) => path.extname(String(filename || '')).toLowerCase();

const isPdf = (mimeType, ext) =>
  String(mimeType || '').toLowerCase().includes('pdf') || ext === '.pdf';

const isDocx = (mimeType, ext) =>
  String(mimeType || '').toLowerCase().includes('wordprocessingml.document') || ext === '.docx';

const isText = (mimeType, ext) =>
  String(mimeType || '').toLowerCase().startsWith('text/') || ext === '.txt';

const parseResumeFile = async ({ filePath, mimeType, originalName }) => {
  const ext = getFileExtension(originalName || filePath);
  if (isPdf(mimeType, ext)) {
    const buffer = fs.readFileSync(filePath);
    const result = await pdfParse(buffer);
    return cleanText(result.text);
  }
  if (isDocx(mimeType, ext)) {
    const result = await mammoth.extractRawText({ path: filePath });
    return cleanText(result.value);
  }
  if (isText(mimeType, ext)) {
    return cleanText(fs.readFileSync(filePath, 'utf8'));
  }
  return '';
};

const ensureUploadedResumeParsed = async (resume, uploadsDir) => {
  if (!resume || resume.type !== 'UPLOAD') return resume;
  if (String(resume.parsedText || '').trim()) return resume;
  if (!resume.filename) {
    resume.parseStatus = 'FAILED';
    resume.parseError = 'Missing stored file name';
    resume.parsedAt = new Date();
    await resume.save();
    return resume;
  }

  const filePath = path.join(uploadsDir, resume.filename);
  if (!fs.existsSync(filePath)) {
    resume.parseStatus = 'FAILED';
    resume.parseError = 'Stored file not found';
    resume.parsedAt = new Date();
    await resume.save();
    return resume;
  }

  try {
    const parsedText = await parseResumeFile({
      filePath,
      mimeType: resume.mimeType,
      originalName: resume.originalName,
    });
    if (parsedText) {
      resume.parsedText = parsedText;
      resume.parseStatus = 'PARSED';
      resume.parseError = undefined;
    } else {
      resume.parseStatus = 'FAILED';
      resume.parseError = 'No readable text could be extracted from this file';
    }
    resume.parsedAt = new Date();
    await resume.save();
  } catch (error) {
    resume.parseStatus = 'FAILED';
    resume.parseError = error.message || 'Resume parsing failed';
    resume.parsedAt = new Date();
    await resume.save();
  }

  return resume;
};

module.exports = {
  ensureUploadedResumeParsed,
};
