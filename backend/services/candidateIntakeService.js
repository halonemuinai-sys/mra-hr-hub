/**
 * Single write path for candidate intake (career portal apply, public template apply,
 * and admin bulk import).
 *
 * Public intake must never overwrite an existing candidate's profile — anyone who
 * knows an email address could otherwise rewrite that person's data. For an existing
 * email the stored profile is kept, the application is still recorded, and the
 * submitted data is saved on the activity log (PROFILE_RESUBMITTED) for recruiters.
 * Admin imports (overwriteExisting: true) may update profiles.
 */
const prisma = require('../api/db');
const { calculateAtsMatchScore, classifyCandidateProfiling } = require('./profilingService');
const { claimTemp } = require('./resumeStorage');

const profileRelations = { skills: true, experiences: true, educations: true };

function normalizeProfile(input) {
  const skills = Array.isArray(input.skills) ? input.skills : [];
  const experiences = Array.isArray(input.experiences) ? input.experiences : [];
  const educations = Array.isArray(input.educations) ? input.educations : [];
  return {
    fullName: String(input.fullName || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    phone: input.phone || '',
    location: input.location || '',
    headline: input.headline || '',
    currentCompany: input.currentCompany || '',
    totalExperienceYrs: parseFloat(input.totalExperienceYrs) || 0,
    expectedSalary: input.expectedSalary ? parseFloat(input.expectedSalary) : null,
    availability: input.availability || 'IMMEDIATE',
    profileSummary: input.profileSummary || '',
    skills: skills
      .map((s) => ({
        skillName: typeof s === 'string' ? s : s && s.skillName,
        category: (s && s.category) || 'TECHNICAL',
        proficiency: (s && s.proficiency) || 'INTERMEDIATE'
      }))
      .filter((s) => s.skillName),
    experiences: experiences.map((e) => ({
      companyName: e.companyName || 'Perusahaan',
      roleTitle: e.roleTitle || 'Posisi',
      industry: e.industry || 'Umum',
      startDate: e.startDate ? new Date(e.startDate) : new Date(),
      endDate: e.endDate ? new Date(e.endDate) : null,
      isCurrent: !!e.isCurrent,
      description: e.description || ''
    })),
    educations: educations.map((ed) => ({
      institution: ed.institution || 'Institusi',
      degree: ed.degree || 'S1',
      major: ed.major || 'Umum',
      graduationYear: ed.graduationYear ? parseInt(ed.graduationYear, 10) : null,
      gpa: ed.gpa ? parseFloat(ed.gpa) : null
    }))
  };
}

function profileFields(p, source, classification) {
  return {
    fullName: p.fullName,
    phone: p.phone,
    location: p.location,
    headline: p.headline,
    currentCompany: p.currentCompany,
    totalExperienceYrs: p.totalExperienceYrs,
    expectedSalary: p.expectedSalary,
    availability: p.availability,
    profileSummary: p.profileSummary,
    intakeSource: source,
    jobFamily: classification.jobFamily,
    seniorityLevel: classification.seniorityLevel,
    tags: classification.tags
  };
}

/** What the applicant submitted, kept for recruiters when the profile itself is not updated */
function submissionSnapshot(p, source) {
  return {
    source,
    fullName: p.fullName,
    phone: p.phone,
    location: p.location,
    headline: p.headline,
    currentCompany: p.currentCompany,
    totalExperienceYrs: p.totalExperienceYrs,
    skills: p.skills.map((s) => s.skillName).slice(0, 40)
  };
}

function scoreFields(evaluation) {
  return {
    atsScore: evaluation.atsScore,
    skillsScore: evaluation.skillsScore,
    expScore: evaluation.expScore,
    eduScore: evaluation.eduScore,
    matchedKeywords: evaluation.matchedKeywords,
    missingKeywords: evaluation.missingKeywords
  };
}

/**
 * @param {object}  p
 * @param {object}  p.profile            submitted candidate data
 * @param {object}  [p.job]              JobPosting (or null)
 * @param {string}  p.source             IntakeSource enum value
 * @param {boolean} p.overwriteExisting  admin import only
 * @returns {{ candidateId, application, evaluation, existing }}
 */
async function intakeCandidate({ profile, job = null, source, overwriteExisting = false, resumeToken = null }) {
  const p = normalizeProfile(profile);
  if (!p.fullName || !p.email) throw Object.assign(new Error('Nama dan Email wajib diisi.'), { status: 400 });

  const existing = await prisma.candidate.findFirst({
    where: { email: { equals: p.email, mode: 'insensitive' } },
    include: profileRelations
  });

  let candidateId;
  let evaluation;
  // Original CV uploaded at the parse step (null when none / expired / invalid token)
  const resumePath = resumeToken ? claimTemp(resumeToken) : null;

  if (!existing || overwriteExisting) {
    evaluation = calculateAtsMatchScore(p, job);
    const classification = classifyCandidateProfiling(p, evaluation.atsScore);
    const fields = profileFields(p, source, classification);

    if (!existing) {
      const created = await prisma.candidate.create({
        data: {
          ...fields,
          email: p.email,
          rawResumePath: resumePath,
          skills: { create: p.skills },
          experiences: { create: p.experiences },
          educations: { create: p.educations }
        }
      });
      candidateId = created.id;
    } else {
      candidateId = existing.id;
      await prisma.$transaction(async (tx) => {
        await tx.candidate.update({ where: { id: candidateId }, data: { ...fields, ...(resumePath ? { rawResumePath: resumePath } : {}) } });
        // Replace a relation only when the import actually provides it
        if (p.skills.length) {
          await tx.candidateSkill.deleteMany({ where: { candidateId } });
          await tx.candidateSkill.createMany({ data: p.skills.map((s) => ({ ...s, candidateId })) });
        }
        if (p.experiences.length) {
          await tx.candidateExperience.deleteMany({ where: { candidateId } });
          await tx.candidateExperience.createMany({ data: p.experiences.map((e) => ({ ...e, candidateId })) });
        }
        if (p.educations.length) {
          await tx.candidateEducation.deleteMany({ where: { candidateId } });
          await tx.candidateEducation.createMany({ data: p.educations.map((ed) => ({ ...ed, candidateId })) });
        }
      });
    }
  } else {
    // Existing candidate via public intake: score against the stored profile, change nothing
    candidateId = existing.id;
    evaluation = calculateAtsMatchScore(existing, job);
    // Profile stays untouched, but a first CV file may still be attached
    if (resumePath && !existing.rawResumePath) {
      await prisma.candidate.update({ where: { id: candidateId }, data: { rawResumePath: resumePath } });
    }
  }

  let application = null;
  if (job) {
    const appId = `${job.id}_${candidateId}`;
    const current = await prisma.jobApplication.findUnique({ where: { id: appId } });
    if (!current) {
      application = await prisma.jobApplication.create({
        data: { id: appId, jobId: job.id, candidateId, status: 'APPLIED', ...scoreFields(evaluation) }
      });
    } else if (overwriteExisting) {
      application = await prisma.jobApplication.update({ where: { id: appId }, data: scoreFields(evaluation) });
    } else {
      application = current;
    }

    if (existing && !overwriteExisting) {
      await prisma.applicationActivity.create({
        data: {
          applicationId: application.id,
          action: 'PROFILE_RESUBMITTED',
          note: 'Applicant re-submitted via the career portal; stored profile was not changed.',
          stageData: { ...submissionSnapshot(p, source), ...(resumePath ? { resumePath } : {}) }
        }
      });
    }
  }

  return { candidateId, application, evaluation, existing: !!existing };
}

module.exports = { intakeCandidate, normalizeProfile };
