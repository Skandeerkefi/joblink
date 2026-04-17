const normalize = (text) =>
  String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);

const unique = (arr) => [...new Set(arr)];

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
  const bulletsCount =
    experience.reduce((sum, e) => sum + (e.bullets || []).length, 0) +
    projects.reduce((sum, p) => sum + (p.bullets || []).length, 0);

  const contactScore = [personal.fullName, personal.email, personal.phone].filter(Boolean).length * 8.33;
  const summaryScore = Math.min(15, Math.max(0, String(m.summary || '').trim().length / 12));
  const skillsScore = Math.min(20, skills.length * 2.5);
  const experienceScore = Math.min(20, experience.length * 6 + Math.min(5, bulletsCount * 0.5));
  const educationScore = Math.min(10, education.length * 5);
  const projectsScore = Math.min(10, projects.length * 3.5 + Math.min(3, bulletsCount * 0.3));

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

  const jobSkills = (job.skills || []).map((s) => String(s).toLowerCase().trim()).filter(Boolean);
  const jobSkillMatches = jobSkills.filter((s) => resumeTokenSet.has(s)).length;
  const skillScore = jobSkills.length
    ? (jobSkillMatches / jobSkills.length) * 70
    : 35;

  const jobKeywordTokens = unique(normalize(`${job.title || ''} ${job.description || ''}`));
  const keywordMatches = jobKeywordTokens.filter((k) => resumeTokenSet.has(k)).length;
  const keywordScore = jobKeywordTokens.length
    ? Math.min(25, (keywordMatches / jobKeywordTokens.length) * 25)
    : 10;

  const categoryBonus =
    resumeTokenSet.has(String(job.category || '').toLowerCase().replace(/_/g, ' ')) ? 5 : 0;

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
