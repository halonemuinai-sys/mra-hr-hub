const { createMatcher } = require('./keywordMatcher');

/**
 * Calculate ATS Match Score between Candidate and JobPosting
 */
function calculateAtsMatchScore(candidate, jobPosting) {
  if (!jobPosting) {
    return {
      atsScore: 75,
      skillsScore: 75,
      expScore: 75,
      eduScore: 75,
      matchedKeywords: [],
      missingKeywords: [],
      radarDimensions: [
        { subject: 'Teknis', score: 75, fullMark: 100 },
        { subject: 'Pengalaman', score: 70, fullMark: 100 },
        { subject: 'Pendidikan', score: 80, fullMark: 100 },
        { subject: 'Stabilitas', score: 75, fullMark: 100 },
        { subject: 'Kesesuaian Job', score: 75, fullMark: 100 }
      ]
    };
  }

  // 1. SKILLS MATCH — whole-word / synonym-aware (services/keywordMatcher.js)
  const mustHave = (jobPosting.mustHaveSkills || []).map(s => s.trim()).filter(Boolean);
  const niceToHave = (jobPosting.niceToHaveSkills || []).map(s => s.trim()).filter(Boolean);

  const candidateSkills = (candidate.skills || [])
    .map(s => (typeof s === 'string' ? s : (s && s.skillName ? s.skillName : '')))
    .filter(Boolean);
  const candidateText = [
    candidate.headline || '',
    candidate.profileSummary || '',
    ...(candidate.experiences || []).map(e => `${e.roleTitle || ''}. ${e.description || ''}`)
  ].join('\n');
  const strength = createMatcher(candidateSkills, candidateText);

  const matchedKeywords = [];
  const missingKeywords = [];
  const score = (list, { trackMissing }) =>
    list.reduce((sum, kw) => {
      const s = strength(kw);
      if (s > 0) matchedKeywords.push(kw.toLowerCase());
      else if (trackMissing) missingKeywords.push(kw.toLowerCase());
      return sum + s;
    }, 0);
  const mustRatio = mustHave.length ? score(mustHave, { trackMissing: true }) / mustHave.length : null;
  const niceRatio = niceToHave.length ? score(niceToHave, { trackMissing: false }) / niceToHave.length : null;

  // Must-haves carry 80% of the skills score, nice-to-haves 20% (or the must ratio when none are defined)
  let skillsScore;
  if (mustRatio !== null) {
    skillsScore = Math.round(100 * (0.8 * mustRatio + 0.2 * (niceRatio ?? mustRatio)));
  } else if (niceRatio !== null) {
    skillsScore = Math.round(60 + 40 * niceRatio);
  } else {
    skillsScore = Math.min(95, 60 + candidateSkills.length * 4);
  }
  skillsScore = Math.min(100, Math.max(10, skillsScore));

  // 2. EXPERIENCE MATCH
  const reqExp = jobPosting.minExperience || 0;
  const candExp = candidate.totalExperienceYrs || 0;
  let expScore = 70;
  if (reqExp === 0) {
    expScore = 85;
  } else if (candExp >= reqExp) {
    const bonus = Math.min(15, (candExp - reqExp) * 3);
    expScore = Math.min(100, 85 + bonus);
  } else {
    expScore = Math.max(25, Math.round((candExp / reqExp) * 80));
  }

  // 3. EDUCATION MATCH
  const reqEdu = (jobPosting.minEducation || 'SMA').toUpperCase();
  const candDegrees = (candidate.educations || []).map(e => (e.degree || '').toUpperCase());
  let eduScore = 75;
  if (reqEdu.includes('S1') || reqEdu.includes('BACHELOR')) {
    if (candDegrees.some(d => d.includes('S2') || d.includes('MASTER'))) eduScore = 100;
    else if (candDegrees.some(d => d.includes('S1') || d.includes('BACHELOR') || d.includes('SARJANA'))) eduScore = 90;
    else if (candDegrees.some(d => d.includes('D3') || d.includes('DIPLOMA'))) eduScore = 70;
    else eduScore = 50;
  } else if (reqEdu.includes('D3') || reqEdu.includes('DIPLOMA')) {
    if (candDegrees.some(d => d.includes('S1') || d.includes('S2'))) eduScore = 95;
    else if (candDegrees.some(d => d.includes('D3'))) eduScore = 90;
    else eduScore = 65;
  } else {
    eduScore = 90;
  }

  // 4. OVERALL ATS SCORE
  // Keyword fit is the strongest signal of job fit; experience and education refine it
  const atsScore = Math.round((0.55 * skillsScore) + (0.30 * expScore) + (0.15 * eduScore));

  // 5. RADAR DIMENSIONS
  const stabilityScore = Math.min(95, Math.max(50, Math.round(65 + Math.min(6, (candidate.experiences || []).length) * 5)));
  const radarDimensions = [
    { subject: 'Keahlian Teknis', score: skillsScore, fullMark: 100 },
    { subject: 'Durasi Pengalaman', score: expScore, fullMark: 100 },
    { subject: 'Pendidikan', score: eduScore, fullMark: 100 },
    { subject: 'Stabilitas Karir', score: stabilityScore, fullMark: 100 },
    { subject: 'Kecocokan Lowongan', score: atsScore, fullMark: 100 }
  ];

  return {
    atsScore,
    skillsScore,
    expScore,
    eduScore,
    matchedKeywords,
    missingKeywords,
    radarDimensions
  };
}

/**
 * Assign Job Family, Seniority Level, and Dynamic Tags
 */
function classifyCandidateProfiling(candidate, atsScore = 75) {
  const combinedText = [
    candidate.headline || '',
    candidate.profileSummary || '',
    ...(candidate.skills || []).map(s => (typeof s === 'string' ? s : (s && s.skillName ? s.skillName : ''))),
    ...(candidate.experiences || []).map(e => `${e.roleTitle || ''} ${e.industry || ''}`)
  ].join(' ').toLowerCase();

  // 1. Determine Job Family
  let jobFamily = 'CORPORATE_SERVICES';
  if (combinedText.match(/react|vue|node|python|javascript|typescript|engineer|developer|frontend|backend|devops|qa|data/)) {
    jobFamily = 'IT_DIGITAL';
  } else if (combinedText.match(/retail|store|spg|spb|kasir|cashier|inventory|merchandis|pos|shop/)) {
    jobFamily = 'RETAIL_OPS';
  } else if (combinedText.match(/designer|figma|ui\/ux|broadcast|video|animat|writer|content|journalist|media/)) {
    jobFamily = 'CREATIVE_MEDIA';
  } else if (combinedText.match(/legal|hukum|ga|general affairs|compliance|pajak|tax|finance|accounting|hr|recruiter/)) {
    jobFamily = 'CORPORATE_SERVICES';
  }

  // 2. Determine Seniority Level
  const expYears = candidate.totalExperienceYrs || 0;
  let seniorityLevel = 'ENTRY';
  if (expYears >= 8 || combinedText.match(/head|director|vp|general manager|lead|chief/)) {
    seniorityLevel = 'LEAD';
  } else if (expYears >= 5 || combinedText.match(/senior|sr\./)) {
    seniorityLevel = 'SENIOR';
  } else if (expYears >= 2) {
    seniorityLevel = 'MID';
  } else {
    seniorityLevel = 'ENTRY';
  }

  // 3. Assign Dynamic Tags
  const tags = [];
  if (atsScore >= 85) tags.push('#TopTier');
  else if (atsScore >= 75) tags.push('#Qualified');

  if (candidate.availability === 'IMMEDIATE') tags.push('#ImmediateHire');
  if (seniorityLevel === 'LEAD' || seniorityLevel === 'SENIOR') tags.push('#KeyTalent');
  if (jobFamily === 'RETAIL_OPS') tags.push('#RetailExpert');
  if (jobFamily === 'IT_DIGITAL') tags.push('#TechTalent');

  return {
    jobFamily,
    seniorityLevel,
    tags
  };
}

module.exports = {
  calculateAtsMatchScore,
  classifyCandidateProfiling
};
