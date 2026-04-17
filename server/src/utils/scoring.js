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
const SKILL_WEIGHT = 70;
const KEYWORD_WEIGHT = 25;
const DEFAULT_SKILL_SCORE = 35;
const DEFAULT_KEYWORD_SCORE = 10;
const CATEGORY_BONUS_POINTS = 5;
const SKILL_MATCH_THRESHOLD_RATIO = 0.6;
const SINGLE_TOKEN_MATCH_LIMIT = 2;
const CONTACT_FIELD_WEIGHT = 20 / 3;

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

  return [resume.originalName, resume.title, resume.mimeType].filter(Boolean).join(' ');
};

const calculateAtsScore = (resume) => {
  if (!resume) return { score: 0, breakdown: { message: 'No resume selected' } };

  if (resume.type !== 'MANUAL') {
    return {
      score: 45,
      breakdown: {
        format: 20,
        structure: 10,
        content: 15,
        note: 'Uploaded file detected. Upload parsing is limited; manual CV gives more accurate ATS score.',
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

const calculateMatchScore = (resume, job) => {
  if (!resume || !job) return { score: 0, breakdown: { message: 'Resume or job missing' } };

  const resumeTextTokens = unique(normalize(buildResumeText(resume)));
  const resumeTokenSet = new Set(resumeTextTokens);

  const jobSkills = (job.skills || [])
    .map((s) => unique(normalize(s)))
    .filter((tokens) => tokens.length > 0);
  const jobSkillMatches = jobSkills.reduce((matched, skillTokens) => {
    const overlap = skillTokens.filter((token) => resumeTokenSet.has(token)).length;
    const threshold =
      skillTokens.length <= SINGLE_TOKEN_MATCH_LIMIT
        ? 1
        : Math.ceil(skillTokens.length * SKILL_MATCH_THRESHOLD_RATIO);
    return matched + (overlap >= threshold ? 1 : 0);
  }, 0);
  const skillScore = jobSkills.length
    ? (jobSkillMatches / jobSkills.length) * SKILL_WEIGHT
    : DEFAULT_SKILL_SCORE;

  const jobKeywordTokens = unique(normalize(`${job.title || ''} ${job.description || ''}`));
  const keywordMatches = jobKeywordTokens.filter((k) => resumeTokenSet.has(k)).length;
  const keywordScore = jobKeywordTokens.length
    ? Math.min(KEYWORD_WEIGHT, (keywordMatches / jobKeywordTokens.length) * KEYWORD_WEIGHT)
    : DEFAULT_KEYWORD_SCORE;

  const categoryTokens = normalize(String(job.category || '').replace(/_/g, ' '));
  const categoryBonus =
    categoryTokens.length > 0 && categoryTokens.every((token) => resumeTokenSet.has(token))
      ? CATEGORY_BONUS_POINTS
      : 0;

  const total = Math.round(Math.min(100, skillScore + keywordScore + categoryBonus));

  return {
    score: total,
    breakdown: {
      matchedSkills: jobSkillMatches,
      requiredSkills: jobSkills.length,
      skillScore: Math.round(skillScore),
      keywordScore: Math.round(keywordScore),
      categoryBonus,
    },
  };
};

module.exports = {
  buildResumeText,
  calculateAtsScore,
  calculateMatchScore,
};
