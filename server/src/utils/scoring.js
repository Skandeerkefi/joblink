const normalizeText = (text) =>
  String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/node\.js/g, 'nodejs')
    .replace(/c\+\+/g, 'cpp')
    .replace(/c#/g, 'csharp')
    .replace(/\.net/g, ' dotnet ')
    .replace(/[_/\\-]+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');

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
const MIN_SKILL_TOKEN_MATCH_RATIO = 0.6;

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

    return [
      resume.title,
      personal.fullName,
      personal.email,
      personal.location,
      m.summary,
      ...(m.skills || []),
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
  const totalBulletsCount =
    experience.reduce((sum, e) => sum + (e.bullets || []).length, 0) +
    projects.reduce((sum, p) => sum + (p.bullets || []).length, 0);

  const contactScore = [personal.fullName, personal.email, personal.phone].filter(Boolean).length * 8.33;
  const summaryScore = Math.min(15, Math.max(0, String(m.summary || '').trim().length / 12));
  const skillsScore = Math.min(20, skills.length * 2.5);
  const experienceScore = Math.min(20, experience.length * 6 + Math.min(5, totalBulletsCount * 0.5));
  const educationScore = Math.min(10, education.length * 5);
  const projectsScore = Math.min(10, projects.length * 3.5 + Math.min(3, totalBulletsCount * 0.3));

  const total = Math.round(
    Math.min(
      100,
      contactScore + summaryScore + skillsScore + experienceScore + educationScore + projectsScore
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
      skillTokens.length <= 2 ? 1 : Math.ceil(skillTokens.length * MIN_SKILL_TOKEN_MATCH_RATIO);
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
