const TECHNOLOGY_NORMALIZATIONS = [
  [/node\.js/g, 'nodejs'],
  [/c\+\+/g, 'cpp'],
  [/c#/g, 'csharp'],
  [/\.net/g, 'dotnet'],
];

const normalizeText = (text) => {
  let normalized = String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  TECHNOLOGY_NORMALIZATIONS.forEach(([pattern, replacement]) => {
    normalized = normalized.replace(pattern, replacement);
  });

  return normalized
    .replace(/[_/\\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');
};

const normalize = (text) =>
  normalizeText(text)
    .split(/\s+/)
    .filter((w) => w.length > 1);

const unique = (arr) => [...new Set(arr)];
const SKILL_MATCH_THRESHOLD_RATIO = 0.6;
const SINGLE_TOKEN_MATCH_LIMIT = 2;
const MATCH_WEIGHTS = {
  skills: 0.4,
  experience: 0.25,
  education: 0.1,
  keywordsTools: 0.15,
  bonus: 0.1,
};
const EXPERIENCE_LEVEL_REQUIREMENT = {
  DEBUTANT: 0,
  JUNIOR: 1,
  INTERMEDIATE: 3,
  SENIOR: 5,
};
const DEFAULT_REQUIRED_YEARS = 1;
const FIELD_KEYWORDS_BY_CATEGORY = {
  SOFTWARE_ENGINEERING: ['software', 'engineering', 'computer', 'frontend', 'backend', 'fullstack'],
  DATA: ['data', 'analytics', 'machine', 'statistics', 'ai'],
  CYBERSECURITY: ['security', 'cybersecurity', 'network', 'information'],
  PRODUCT: ['product', 'management', 'business'],
  UI_UX: ['design', 'ux', 'ui', 'product'],
  MARKETING: ['marketing', 'digital', 'brand', 'growth'],
  SALES: ['sales', 'business', 'development'],
  BUSINESS_DEVELOPMENT: ['business', 'development', 'sales', 'strategy'],
  FINANCE: ['finance', 'accounting', 'economics', 'business'],
  HR: ['human', 'resources', 'management', 'psychology'],
  OPERATIONS: ['operations', 'supply', 'logistics', 'management'],
  CUSTOMER_SUCCESS: ['customer', 'success', 'support', 'service'],
};
const TOOL_STOPWORDS = new Set([
  'and', 'with', 'for', 'the', 'you', 'your', 'our', 'this', 'that', 'will', 'are', 'from', 'into',
  'using', 'use', 'have', 'has', 'years', 'experience', 'required', 'preferred', 'must', 'strong',
  'ability', 'skills', 'skill', 'work', 'team', 'role', 'responsibilities',
]);
const CONTACT_FIELD_MAX_SCORE = 20;
const CONTACT_FIELDS_COUNT = 3; // fullName, email, phone
const CONTACT_FIELD_WEIGHT = CONTACT_FIELD_MAX_SCORE / CONTACT_FIELDS_COUNT;
const UPLOAD_SECTION_KEYWORDS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
];
const ACTION_KEYWORDS = [
  'built',
  'designed',
  'developed',
  'implemented',
  'improved',
  'managed',
  'optimized',
  'led',
  'delivered',
  'launched',
];
// Tuned for one-page to short two-page resumes, where ~450 useful tokens is usually ATS-friendly.
const UPLOAD_TARGET_WORD_COUNT = 450;
// Each 45-token distance from the target reduces the length sub-score by roughly 1 point.
const UPLOAD_WORD_COUNT_STEP = 45;
// Each strong action keyword contributes 2.5 points, capped separately in scoring.
const UPLOAD_ACTION_KEYWORD_WEIGHT = 2.5;
// Depth score reaches full points near the target word count (450 / 30 = 15).
const UPLOAD_DEPTH_WORD_DIVISOR = 30;

const buildResumeText = (resume) => {
  if (!resume) return '';

  if (resume.type === 'MANUAL' && resume.manualData) {
    const m = resume.manualData || {};
    const personal = m.personalInfo || {};
    const education = (m.education || [])
      .map((e) => [e.school, e.degree, e.field, e.details].filter(Boolean).join(' '))
      .join(' ');
    const experience = (m.experience || [])
      .map((e) => [e.company, e.title, e.location, ...(e.bullets || [])].filter(Boolean).join(' '))
      .join(' ');
    const projects = (m.projects || [])
      .map((p) => [p.name, p.description, ...(p.bullets || [])].filter(Boolean).join(' '))
      .join(' ');
    const certifications = (m.certifications || [])
      .map((c) => [c.name, c.issuer, c.issueDate, c.credentialId, c.link].filter(Boolean).join(' '))
      .join(' ');

    return [
      resume.title,
      personal.fullName,
      personal.email,
      personal.location,
      m.summary,
      ...(m.skills || []),
      certifications,
      education,
      experience,
      projects,
    ]
      .filter(Boolean)
      .join(' ');
  }

  return [resume.originalName, resume.title, resume.mimeType, resume.parsedText].filter(Boolean).join(' ');
};

const calculateAtsScore = (resume) => {
  if (!resume) return { score: 0, breakdown: { message: 'No resume selected' } };

  if (resume.type !== 'MANUAL') {
    const parsedText = String(resume.parsedText || '').trim();
    if (!parsedText) {
      const parseStatusMessage =
        resume.parseStatus === 'FAILED'
          ? `Text extraction failed: ${resume.parseError || 'unable to parse this file type'}`
          : 'Text extraction is pending for this uploaded file';
      return {
        score: 45,
        breakdown: {
          format: 20,
          structure: 10,
          content: 15,
          note: parseStatusMessage,
        },
      };
    }

    const tokens = unique(normalize(parsedText));
    const tokenSet = new Set(tokens);
    const wordCount = tokens.length;
    const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(parsedText);
    const hasPhone = /(\+?\d[\d\s().-]{7,}\d)/.test(parsedText);
    const hasLink = /(https?:\/\/|linkedin\.com|github\.com)/i.test(parsedText);
    const sectionHits = UPLOAD_SECTION_KEYWORDS.filter((section) =>
      new RegExp(`\\b${section}\\b`, 'i').test(parsedText)
    ).length;
    const actionHits = ACTION_KEYWORDS.filter((word) => tokenSet.has(word)).length;

    const contactScore = (hasEmail ? 8 : 0) + (hasPhone ? 8 : 0) + (hasLink ? 4 : 0);
    const structureScore = Math.min(25, sectionHits * 4 + (sectionHits >= 4 ? 3 : 0));
    const lengthScore = Math.max(
      0,
      Math.min(20, 20 - Math.abs(wordCount - UPLOAD_TARGET_WORD_COUNT) / UPLOAD_WORD_COUNT_STEP)
    );
    // Content score = action language (max 20) + depth from word count (max 15), capped at 35.
    const actionScore = Math.min(20, actionHits * UPLOAD_ACTION_KEYWORD_WEIGHT);
    const depthScore = Math.min(15, wordCount / UPLOAD_DEPTH_WORD_DIVISOR);
    const contentScore = Math.min(
      35,
      actionScore + depthScore
    );
    const total = Math.round(Math.min(100, contactScore + structureScore + lengthScore + contentScore));

    return {
      score: total,
      breakdown: {
        contact: Math.round(contactScore),
        structure: Math.round(structureScore),
        length: Math.round(lengthScore),
        content: Math.round(contentScore),
        words: wordCount,
        parsed: true,
      },
    };
  }

  const m = resume.manualData || {};
  const personal = m.personalInfo || {};
  const skills = m.skills || [];
  const experience = m.experience || [];
  const education = m.education || [];
  const projects = m.projects || [];
  const certifications = m.certifications || [];
  const totalBulletsCount =
    experience.reduce((sum, e) => sum + (e.bullets || []).length, 0) +
    projects.reduce((sum, p) => sum + (p.bullets || []).length, 0);

  const contactScore = [personal.fullName, personal.email, personal.phone].filter(Boolean).length * CONTACT_FIELD_WEIGHT;
  const summaryScore = Math.min(15, Math.max(0, String(m.summary || '').trim().length / 12));
  const skillsScore = Math.min(20, skills.length * 2.5);
  const experienceScore = Math.min(20, experience.length * 6 + Math.min(5, totalBulletsCount * 0.5));
  const educationScore = Math.min(10, education.length * 5);
  const projectsScore = Math.min(10, projects.length * 3.5 + Math.min(3, totalBulletsCount * 0.3));
  const certificationsScore = Math.min(5, certifications.length * 2);

  const total = Math.round(
    Math.min(
      100,
      contactScore +
        summaryScore +
        skillsScore +
        experienceScore +
        educationScore +
        projectsScore +
        certificationsScore
    )
  );

  return {
    score: total,
    breakdown: {
      contact: Math.round(contactScore),
      summary: Math.round(summaryScore),
      skills: Math.round(skillsScore),
      experience: Math.round(experienceScore),
      education: Math.round(educationScore),
      projects: Math.round(projectsScore),
      certifications: Math.round(certificationsScore),
    },
  };
};

const skillMatchesTokenSet = (skill, tokenSet) => {
  const skillTokens = unique(normalize(skill));
  if (skillTokens.length === 0) return false;
  const overlap = skillTokens.filter((token) => tokenSet.has(token)).length;
  const threshold =
    skillTokens.length <= SINGLE_TOKEN_MATCH_LIMIT
      ? 1
      : Math.ceil(skillTokens.length * SKILL_MATCH_THRESHOLD_RATIO);
  return overlap >= threshold;
};

const extractCandidateYears = (resume, resumeText) => {
  if (!resume) return 0;

  if (resume.type === 'MANUAL') {
    const entries = resume.manualData?.experience || [];
    const currentYear = new Date().getFullYear();
    const years = entries.reduce((sum, entry) => {
      const startYear = Number(String(entry.startDate || '').match(/\d{4}/)?.[0]);
      const endYear = entry.current
        ? currentYear
        : Number(String(entry.endDate || '').match(/\d{4}/)?.[0]) || currentYear;
      if (Number.isFinite(startYear) && startYear > 1900 && endYear >= startYear) {
        return sum + (endYear - startYear);
      }
      return sum + 1;
    }, 0);
    return Math.max(0, Math.min(40, years));
  }

  const yearsInText = [...resumeText.matchAll(/(\d+)\+?\s*(?:years?|yrs?)/gi)]
    .map((m) => Number(m[1]))
    .filter((v) => Number.isFinite(v));
  if (yearsInText.length > 0) return Math.max(...yearsInText);

  const currentYear = new Date().getFullYear();
  const ranges = [...resumeText.matchAll(/((?:19|20)\d{2})\s*[-–]\s*((?:19|20)\d{2}|present|current)/gi)];
  const estimatedYears = ranges.reduce((sum, match) => {
    const start = Number(match[1]);
    const endRaw = String(match[2]).toLowerCase();
    const end = endRaw === 'present' || endRaw === 'current' ? currentYear : Number(endRaw);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) return sum + (end - start);
    return sum;
  }, 0);
  return Math.min(40, Math.max(0, estimatedYears));
};

const getRequiredYears = (job) => {
  const fromLevel = EXPERIENCE_LEVEL_REQUIREMENT[job.experienceLevel] ?? DEFAULT_REQUIRED_YEARS;
  const text = `${job.title || ''} ${job.description || ''}`;
  const explicit = text.match(/(\d+)\+?\s*(?:years?|yrs?)/i);
  const parsedExplicit = explicit ? Number(explicit[1]) : null;
  return Number.isFinite(parsedExplicit) ? parsedExplicit : fromLevel;
};

const getEducationSignals = (resume, job) => {
  const resumeText = buildResumeText(resume);
  const resumeTokens = new Set(normalize(resumeText));

  const requiredText = `${job.title || ''} ${job.description || ''}`;
  const requiredLower = requiredText.toLowerCase();
  let requiredLevel = 1;
  if (/\b(phd|doctorate|doctoral)\b/.test(requiredLower)) requiredLevel = 5;
  else if (/\b(master|msc|mba)\b/.test(requiredLower)) requiredLevel = 4;
  else if (/\b(bachelor|bsc|license|licence)\b/.test(requiredLower)) requiredLevel = 3;
  else if (/\b(associate)\b/.test(requiredLower)) requiredLevel = 2;

  const manualEducation = resume?.manualData?.education || [];
  const manualDegreeText = manualEducation.map((e) => `${e.degree || ''} ${e.field || ''}`).join(' ');
  const allEducationText = `${manualDegreeText} ${resumeText}`.toLowerCase();

  let candidateLevel = 1;
  if (/\b(phd|doctorate|doctoral)\b/.test(allEducationText)) candidateLevel = 5;
  else if (/\b(master|msc|mba)\b/.test(allEducationText)) candidateLevel = 4;
  else if (/\b(bachelor|bsc|license|licence)\b/.test(allEducationText)) candidateLevel = 3;
  else if (/\b(associate)\b/.test(allEducationText)) candidateLevel = 2;

  const categoryKeywords = FIELD_KEYWORDS_BY_CATEGORY[job.category] || [];
  const requiredFieldTokens = unique([
    ...categoryKeywords,
    ...normalize(requiredText).filter((token) => token.length > 2),
  ]).slice(0, 40);
  const fieldOverlap = requiredFieldTokens.filter((token) => resumeTokens.has(token)).length;
  const fieldMatchRatio = requiredFieldTokens.length ? fieldOverlap / requiredFieldTokens.length : 0;

  return { requiredLevel, candidateLevel, fieldMatchRatio };
};

const getToolsFromJob = (job) => {
  const text = `${job.title || ''} ${job.description || ''} ${(job.skills || []).join(' ')}`;
  return unique(
    normalize(text).filter((token) => token.length > 2 && !TOOL_STOPWORDS.has(token))
  ).slice(0, 60);
};

const calculateBonusScore = (resume, relevantSkills) => {
  const resumeText = buildResumeText(resume);
  const resumeTokenSet = new Set(normalize(resumeText));
  const manualData = resume?.manualData || {};
  const projects = manualData.projects || [];
  const certifications = manualData.certifications || [];

  const relevantSkillHits = relevantSkills.filter((skill) => skillMatchesTokenSet(skill, resumeTokenSet)).length;
  const projectSkillCoverage = relevantSkills.length ? relevantSkillHits / relevantSkills.length : 0;
  const projectScore = Math.min(50, Math.round(projects.length * 15 + projectSkillCoverage * 35));

  const certScore = Math.min(30, certifications.length * 10);

  const hasPortfolioLink = /(portfolio|github\.com|behance|dribbble|gitlab|https?:\/\/)/i.test(resumeText);
  const portfolioScore = hasPortfolioLink ? 20 : 0;

  return Math.max(0, Math.min(100, projectScore + certScore + portfolioScore));
};

const calculateMatchScore = (resume, job) => {
  if (!resume || !job) return { score: 0, breakdown: { message: 'Resume or job missing' } };

  const resumeText = buildResumeText(resume);
  const resumeTokenSet = new Set(unique(normalize(resumeText)));

  const requiredSkills = (job.skills || []).filter(Boolean);
  const optionalSkills = Array.isArray(job.optionalSkills) ? job.optionalSkills.filter(Boolean) : [];
  const matchedRequiredSkills = requiredSkills.filter((skill) => skillMatchesTokenSet(skill, resumeTokenSet));
  const matchedOptionalSkills = optionalSkills.filter((skill) => skillMatchesTokenSet(skill, resumeTokenSet));
  const totalSkillWeight = requiredSkills.length + optionalSkills.length * 0.5;
  const matchedSkillWeight = matchedRequiredSkills.length + matchedOptionalSkills.length * 0.5;
  const skillsMatch = totalSkillWeight > 0 ? (matchedSkillWeight / totalSkillWeight) * 100 : 100;

  const candidateYears = extractCandidateYears(resume, resumeText);
  const requiredYears = getRequiredYears(job);
  let experienceMatch = 100;
  if (requiredYears > 0 && candidateYears < requiredYears) {
    const ratio = candidateYears / requiredYears;
    if (ratio >= 0.85) experienceMatch = 80;
    else if (ratio >= 0.65) experienceMatch = 70;
    else if (ratio >= 0.45) experienceMatch = 50;
    else experienceMatch = 30;
  }

  const { requiredLevel, candidateLevel, fieldMatchRatio } = getEducationSignals(resume, job);
  let educationMatch = 30;
  if (candidateLevel >= requiredLevel && fieldMatchRatio >= 0.2) educationMatch = 100;
  else if (candidateLevel >= requiredLevel - 1 || fieldMatchRatio >= 0.1) educationMatch = 70;

  const jobTools = getToolsFromJob(job);
  const matchedTools = jobTools.filter((tool) => resumeTokenSet.has(tool));
  const keywordsToolsMatch = jobTools.length ? (matchedTools.length / jobTools.length) * 100 : 100;

  const bonus = calculateBonusScore(resume, requiredSkills.length ? requiredSkills : jobTools);

  const finalScore =
    skillsMatch * MATCH_WEIGHTS.skills +
    experienceMatch * MATCH_WEIGHTS.experience +
    educationMatch * MATCH_WEIGHTS.education +
    keywordsToolsMatch * MATCH_WEIGHTS.keywordsTools +
    bonus * MATCH_WEIGHTS.bonus;
  const total = Math.round(Math.min(100, Math.max(0, finalScore)));

  const tips = [];
  const missingRequiredSkills = requiredSkills.filter((skill) => !matchedRequiredSkills.includes(skill));
  if (missingRequiredSkills.length > 0) {
    tips.push(`Add evidence for these required skills: ${missingRequiredSkills.slice(0, 5).join(', ')}`);
  }
  if (candidateYears < requiredYears) {
    tips.push(`Highlight projects or internships proving ${requiredYears}+ years equivalent experience.`);
  }
  if (educationMatch < 100) {
    tips.push('Clarify your education relevance and add coursework or certifications aligned with this role.');
  }
  const missingTools = jobTools.filter((tool) => !matchedTools.includes(tool));
  if (missingTools.length > 0) {
    tips.push(`Include tools/keywords used in this job post: ${missingTools.slice(0, 8).join(', ')}`);
  }
  if (bonus < 60) {
    tips.push('Add portfolio links, measurable project outcomes, and relevant certifications to strengthen your profile.');
  }

  return {
    score: total,
    breakdown: {
      skillsMatch: Math.round(skillsMatch),
      experienceMatch: Math.round(experienceMatch),
      educationMatch: Math.round(educationMatch),
      keywordsToolsMatch: Math.round(keywordsToolsMatch),
      bonus: Math.round(bonus),
      matchedRequiredSkills: matchedRequiredSkills.length,
      requiredSkills: requiredSkills.length,
      matchedOptionalSkills: matchedOptionalSkills.length,
      optionalSkills: optionalSkills.length,
      candidateYears: Number(candidateYears.toFixed(1)),
      requiredYears,
      matchedTools: matchedTools.length,
      totalTools: jobTools.length,
      missingRequiredSkills: missingRequiredSkills.slice(0, 10),
      missingTools: missingTools.slice(0, 15),
      tips,
      formula:
        '(Skills Match * 0.4) + (Experience Match * 0.25) + (Education Match * 0.1) + (Keywords/Tools Match * 0.15) + (Bonus * 0.1)',
    },
  };
};

module.exports = {
  buildResumeText,
  calculateAtsScore,
  calculateMatchScore,
};
