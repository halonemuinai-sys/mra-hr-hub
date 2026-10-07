/**
 * Candidate-level insights for recruiters.
 *   GET /api/candidates/:id/applications  → every application of this person (scoped for Hiring Managers)
 *   GET /api/candidates/:id/duplicates    → other profiles that look like the same person
 */
const prisma = require('../api/db');
const { applicationScope, isScopedHiringManager } = require('../services/hiringManagerScope');

/** Last 9 digits: "+62 812-3456-7890" and "0812 3456 7890" compare equal */
const phoneKey = (p) => {
  const digits = String(p || '').replace(/\D/g, '');
  return digits.length >= 8 ? digits.slice(-9) : null;
};
/** Name without academic titles / punctuation: "Hendra Saputra, S.Tr.Par." → "hendra saputra" */
const nameKey = (n) =>
  String(n || '')
    .split(',')[0]
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function listCandidateApplications(req, res) {
  try {
    const apps = await prisma.jobApplication.findMany({
      where: { candidateId: req.params.id, ...applicationScope(req.user) },
      orderBy: { appliedAt: 'desc' },
      select: {
        id: true,
        status: true,
        atsScore: true,
        appliedAt: true,
        stageChangedAt: true,
        job: { select: { id: true, title: true, division: true, isActive: true } },
        assignedRecruiter: { select: { id: true, name: true } }
      }
    });
    if (!apps.length && isScopedHiringManager(req.user)) {
      return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });
    }
    return res.json({ success: true, data: apps });
  } catch (error) {
    console.error('Error listing candidate applications:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function findDuplicates(req, res) {
  try {
    const me = await prisma.candidate.findUnique({
      where: { id: req.params.id },
      select: { id: true, fullName: true, phone: true, email: true }
    });
    if (!me) return res.status(404).json({ success: false, message: 'Kandidat tidak ditemukan.' });

    const myPhone = phoneKey(me.phone);
    const myName = nameKey(me.fullName);
    // Narrow in SQL by the first name token, then compare normalized keys in memory
    const firstToken = myName.split(' ')[0];
    const pool = await prisma.candidate.findMany({
      where: {
        id: { not: me.id },
        OR: [
          ...(myPhone ? [{ phone: { contains: myPhone.slice(-6) } }] : []),
          ...(firstToken.length >= 3 ? [{ fullName: { contains: firstToken, mode: 'insensitive' } }] : [])
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: { select: { applications: true } }
      },
      take: 200
    });

    const duplicates = pool
      .map((c) => {
        const reasons = [];
        if (myPhone && phoneKey(c.phone) === myPhone) reasons.push('Nomor telepon sama');
        if (myName && nameKey(c.fullName) === myName) reasons.push('Nama sama');
        return { ...c, applications: c._count.applications, reasons };
      })
      .filter((c) => c.reasons.length)
      .map(({ _count, ...c }) => c)
      .sort((a, b) => b.reasons.length - a.reasons.length);

    return res.json({ success: true, data: duplicates });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { listCandidateApplications, findDuplicates, phoneKey, nameKey };
