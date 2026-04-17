const fs = require('fs');
const path = require('path');
const pdfParseModule = require('pdf-parse');
const mammoth = require('mammoth');

const pickFunction = (candidates) => candidates.find((candidate) => typeof candidate === 'function');

const pdfParseFunction = pickFunction([
  pdfParseModule,
  pdfParseModule?.default,
  pdfParseModule?.pdfParse,
]);

const PDFParseConstructor = pickFunction([
  pdfParseModule?.PDFParse,
  pdfParseModule?.default?.PDFParse,
]);

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

const resolveSafePath = (filePath, allowedDir) => {
  const resolvedFile = path.resolve(String(filePath || ''));
  if (!allowedDir) return resolvedFile;
  const resolvedAllowedDir = path.resolve(String(allowedDir || ''));
  const relative = path.relative(resolvedAllowedDir, resolvedFile);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Invalid file path');
  }
  return resolvedFile;
};

const parsePdfBuffer = async (buffer) => {
  if (typeof pdfParseFunction === 'function') {
    const result = await pdfParseFunction(buffer);
    const text = typeof result?.text === 'string' ? result.text : '';
    return cleanText(text);
  }
  if (typeof PDFParseConstructor === 'function') {
    const parser = new PDFParseConstructor({ data: buffer });
    try {
      const result = await parser.getText();
      const text = typeof result?.text === 'string' ? result.text : typeof result === 'string' ? result : '';
      return cleanText(text);
    } finally {
      if (typeof parser.destroy === 'function') {
        await parser.destroy();
      }
    }
  }
  throw new Error('pdf-parse module failed to load: no valid parser function found in module exports');
};

const parseResumeFile = async ({ filePath, mimeType, originalName, allowedDir }) => {
  const safePath = resolveSafePath(filePath, allowedDir);
  const ext = getFileExtension(originalName || safePath);
  if (isPdf(mimeType, ext)) {
    const buffer = await fs.promises.readFile(safePath);
    return parsePdfBuffer(buffer);
  }
  if (isDocx(mimeType, ext)) {
    const result = await mammoth.extractRawText({ path: safePath });
    return cleanText(result.value);
  }
  if (isText(mimeType, ext)) {
    return cleanText(await fs.promises.readFile(safePath, 'utf8'));
  }
  return '';
};

const parseResumeBuffer = async ({ buffer, mimeType, originalName }) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error('Invalid resume file buffer');
  }
  const ext = getFileExtension(originalName);
  if (isPdf(mimeType, ext)) {
    return parsePdfBuffer(buffer);
  }
  if (isDocx(mimeType, ext)) {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  }
  if (isText(mimeType, ext)) {
    return cleanText(buffer.toString('utf8'));
  }
  return '';
};

const extractEmail = (text) => {
  const tokens = String(text || '').split(/\s+/);
  for (const rawToken of tokens) {
    const token = rawToken.replace(/[<>(){}[\],;:"'`]/g, '').trim();
    if (!token || !token.includes('@')) continue;
    if ((token.match(/@/g) || []).length !== 1) continue;
    const [localPart, domainPart] = token.split('@');
    if (!localPart || !domainPart) continue;
    if (!domainPart.includes('.')) continue;
    if (domainPart.startsWith('.') || domainPart.endsWith('.')) continue;
    if (domainPart.includes('..')) continue;
    return token;
  }
  return '';
};

const extractPhone = (text) => {
  const candidates = String(text || '').match(/\+?[\d()\-\s]{8,20}/g) || [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, '');
    if (digits.length >= 8 && digits.length <= 15) {
      return candidate.trim();
    }
  }
  return '';
};

const SECTION_KEYWORDS = {
  summary: ['summary', 'professional summary', 'profile', 'about me'],
  skills: ['skills', 'technical skills', 'core skills', 'competencies'],
  education: ['education', 'academic background', 'academics'],
  experience: ['experience', 'work experience', 'employment history', 'professional experience'],
  projects: ['projects', 'project experience'],
  certifications: ['certifications', 'certificates', 'licenses'],
};

const normalizeHeader = (line) =>
  String(line || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const detectSection = (line) => {
  const normalized = normalizeHeader(line);
  if (!normalized || normalized.length > 40) return null;
  const entries = Object.entries(SECTION_KEYWORDS);
  for (const [key, aliases] of entries) {
    if (aliases.includes(normalized)) return key;
  }
  return null;
};

const uniqueStrings = (items) => {
  const seen = new Set();
  const out = [];
  for (const item of items || []) {
    const value = String(item || '').trim();
    if (!value) continue;
    const marker = value.toLowerCase();
    if (seen.has(marker)) continue;
    seen.add(marker);
    out.push(value);
  }
  return out;
};

const splitSkillTokens = (text) =>
  uniqueStrings(
    String(text || '')
      .split(/[\n,;|•]+/)
      .map((s) => s.replace(/^\-+/, '').trim())
      .filter(Boolean)
      .filter((s) => s.length > 1 && s.length <= 40)
  ).slice(0, 40);

const splitBlocks = (lines) => {
  const blocks = [];
  let current = [];
  for (const line of lines || []) {
    const trimmed = String(line || '').trim();
    if (!trimmed) {
      if (current.length) {
        blocks.push(current);
        current = [];
      }
      continue;
    }
    current.push(trimmed);
  }
  if (current.length) blocks.push(current);
  return blocks;
};

const extractManualDataFromText = (text) => {
  const lines = String(text || '')
    .split('\n')
    .map((line) => line.trim());

  const nonEmptyLines = lines.filter(Boolean);
  const sectionLines = {
    summary: [],
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
  };

  let currentSection = null;
  for (const line of lines) {
    const maybeSection = detectSection(line);
    if (maybeSection) {
      currentSection = maybeSection;
      continue;
    }
    if (currentSection) sectionLines[currentSection].push(line);
  }

  const email = extractEmail(text);
  const phone = extractPhone(text);
  const urlMatches = String(text || '')
    .match(/(?:https?:\/\/|www\.)[^\s<>()]+|(?:linkedin\.com|github\.com)\/[^\s<>()]+/gi) || [];
  const links = uniqueStrings(urlMatches.map((u) => (u.startsWith('http') ? u : `https://${u}`))).slice(0, 5);

  const headingBlocks = nonEmptyLines.slice(0, 8);
  const fullName = headingBlocks.find((line) => {
    if (!line) return false;
    if (line.length < 3 || line.length > 50) return false;
    if (/@|\d|http|www|linkedin|github/i.test(line)) return false;
    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 2 || words.length > 5) return false;
    return words.every((word) => /^[A-Za-z'.-]+$/.test(word));
  }) || '';

  const location = headingBlocks.find((line) => {
    if (!line || line.length < 3 || line.length > 60) return false;
    if (/@|\d{3,}|http|www|linkedin|github/i.test(line)) return false;
    return /,/.test(line) || /\b(?:city|country|state|remote|onsite)\b/i.test(line);
  }) || '';

  const summaryText = String(sectionLines.summary.join(' ').trim());
  const fallbackSummary = nonEmptyLines
    .slice(0, 20)
    .filter((line) => !/@|http|www|linkedin|github/i.test(line))
    .filter((line) => !detectSection(line))
    .slice(2, 6)
    .join(' ');

  const skillsSource = sectionLines.skills.join('\n');
  const skills = splitSkillTokens(skillsSource);

  const education = splitBlocks(sectionLines.education).map((block) => ({
    school: block[0] || '',
    degree: block[1] || '',
    field: '',
    startYear: '',
    endYear: '',
    details: block.slice(2).join(' '),
  })).slice(0, 6);

  const experience = splitBlocks(sectionLines.experience).map((block) => ({
    company: block[0] || '',
    title: block[1] || '',
    location: '',
    startDate: '',
    endDate: '',
    current: /\bpresent|current\b/i.test(block.join(' ')),
    bullets: block.slice(2).length ? block.slice(2) : [''],
  })).slice(0, 8);

  const projects = splitBlocks(sectionLines.projects).map((block) => ({
    name: block[0] || '',
    link: '',
    description: block[1] || '',
    bullets: block.slice(2).length ? block.slice(2) : [''],
  })).slice(0, 8);

  const certifications = splitBlocks(sectionLines.certifications).map((block) => ({
    name: block[0] || '',
    issuer: block[1] || '',
    issueDate: '',
    credentialId: '',
    link: '',
  })).slice(0, 8);

  return {
    personalInfo: {
      fullName,
      email,
      phone,
      location,
      links,
    },
    summary: summaryText || fallbackSummary || '',
    skills,
    certifications,
    education,
    experience,
    projects,
  };
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

  try {
    const parsedText = await parseResumeFile({
      filePath,
      mimeType: resume.mimeType,
      originalName: resume.originalName,
      allowedDir: uploadsDir,
    });
    if (parsedText) {
      resume.parsedText = parsedText;
      resume.parseStatus = 'PARSED';
      resume.parseError = null;
    } else {
      resume.parseStatus = 'FAILED';
      resume.parseError = 'No readable text could be extracted from this file';
    }
    resume.parsedAt = new Date();
    await resume.save();
  } catch (error) {
    resume.parseStatus = 'FAILED';
    resume.parseError =
      error && error.code === 'ENOENT'
        ? 'Stored file not found'
        : error.message || 'Resume parsing failed';
    resume.parsedAt = new Date();
    await resume.save();
  }

  return resume;
};

module.exports = {
  parseResumeFile,
  parseResumeBuffer,
  extractManualDataFromText,
  ensureUploadedResumeParsed,
};
