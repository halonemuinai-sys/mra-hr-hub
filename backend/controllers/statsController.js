const prisma = require('../api/db');

async function getExecutiveKpis(req, res) {
  try {
    const [
      totalCandidates,
      activeJobs,
      totalApplications,
      shortlistedCount,
      hiredCount,
      allApps
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.jobPosting.count({ where: { isActive: true } }),
      prisma.jobApplication.count(),
      prisma.jobApplication.count({ where: { status: 'SHORTLISTED' } }),
      prisma.jobApplication.count({ where: { status: 'HIRED' } }),
      prisma.jobApplication.findMany({ select: { atsScore: true, status: true } })
    ]);

    // Calculate Average ATS score
    let avgScore = 0;
    if (allApps.length > 0) {
      const sum = allApps.reduce((acc, a) => acc + (a.atsScore || 0), 0);
      avgScore = Math.round(sum / allApps.length);
    }

    // Stages breakdown
    const stagesMap = {
      APPLIED: 0,
      ATS_SCREENED: 0,
      SHORTLISTED: 0,
      INTERVIEW_HR: 0,
      INTERVIEW_USER: 0,
      OFFERING: 0,
      HIRED: 0,
      REJECTED: 0,
      TALENT_POOL: 0
    };
    allApps.forEach(a => {
      if (stagesMap[a.status] !== undefined) {
        stagesMap[a.status]++;
      }
    });

    // Grouping by Job Family
    const rawCandidates = await prisma.candidate.findMany({
      select: { jobFamily: true, intakeSource: true, seniorityLevel: true }
    });

    const jobFamilyDist = {
      IT_DIGITAL: 0,
      RETAIL_OPS: 0,
      CORPORATE_SERVICES: 0,
      CREATIVE_MEDIA: 0
    };
    const sourceDist = {
      ATS_RESUME_UPLOAD: 0,
      EXCEL_TEMPLATE: 0,
      MANUAL_INPUT: 0
    };
    const seniorityDist = {
      ENTRY: 0,
      MID: 0,
      SENIOR: 0,
      LEAD: 0
    };

    rawCandidates.forEach(c => {
      if (c.jobFamily && jobFamilyDist[c.jobFamily] !== undefined) jobFamilyDist[c.jobFamily]++;
      if (c.intakeSource && sourceDist[c.intakeSource] !== undefined) sourceDist[c.intakeSource]++;
      if (c.seniorityLevel && seniorityDist[c.seniorityLevel] !== undefined) seniorityDist[c.seniorityLevel]++;
    });

    return res.json({
      success: true,
      data: {
        totalCandidates,
        activeJobs,
        totalApplications,
        shortlistRatio: totalApplications > 0 ? Math.round((shortlistedCount / totalApplications) * 100) : 0,
        hiredCount,
        averageAtsScore: avgScore || 78,
        stagesBreakdown: stagesMap,
        jobFamilyDistribution: jobFamilyDist,
        sourceDistribution: sourceDist,
        seniorityDistribution: seniorityDist
      }
    });
  } catch (error) {
    console.error('Error fetching executive KPIs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getExecutiveKpis
};
