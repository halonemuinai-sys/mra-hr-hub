/**
 * Single source of truth for HR HUB role-based access control.
 * Roles are fixed (Prisma enum `Role`); permissions per role are defined here.
 * The frontend receives the resolved list via /api/auth/login and /api/auth/me.
 */

const ROLES = [
  { key: 'SUPERADMIN', label: 'Super Admin', description: 'HR Director — akses penuh termasuk kelola user' },
  { key: 'HR_ADMIN', label: 'TA Lead / HR Admin', description: 'Memimpin tim TA, menugaskan kandidat, kelola lowongan' },
  { key: 'RECRUITER', label: 'Talent Acquisition', description: 'Mengambil & memproses kandidat miliknya sendiri' },
  { key: 'HIRING_MANAGER', label: 'Hiring Manager', description: 'Melihat kandidat & memberi penilaian interview' }
];

const PERMISSIONS = [
  { key: 'dashboard.view', group: 'Dashboard', label: 'Lihat dashboard & KPI' },

  { key: 'pipeline.view', group: 'Pipeline', label: 'Lihat pipeline pelamar' },
  { key: 'pipeline.claim', group: 'Pipeline', label: 'Ambil kandidat dari antrean' },
  { key: 'pipeline.move.own', group: 'Pipeline', label: 'Pindah tahap kandidat milik sendiri' },
  { key: 'pipeline.move.any', group: 'Pipeline', label: 'Pindah tahap kandidat siapa pun' },
  { key: 'pipeline.assign', group: 'Pipeline', label: 'Tugaskan / lepas kandidat recruiter lain' },

  { key: 'candidate.view', group: 'Kandidat', label: 'Lihat database & profil kandidat' },
  { key: 'candidate.evaluate', group: 'Kandidat', label: 'Beri rating & catatan evaluasi' },
  { key: 'candidate.import', group: 'Kandidat', label: 'Import bulk via template Excel' },
  { key: 'candidate.delete', group: 'Kandidat', label: 'Hapus data kandidat' },

  { key: 'jobs.manage', group: 'Lowongan', label: 'Tambah / ubah / hapus lowongan' },

  { key: 'employee.view', group: 'Karyawan', label: 'Lihat karyawan baru hasil rekrutmen' },
  { key: 'employee.manage', group: 'Karyawan', label: 'Daftarkan karyawan, release dari pipeline & umumkan' },

  { key: 'approval.offer', group: 'Approval', label: 'Setujui offering di atas budget lowongan' },
  { key: 'approval.hire', group: 'Approval', label: 'Konfirmasi kandidat diterima (Hired)' },

  { key: 'team.monitor', group: 'Administrasi', label: 'Pantau kinerja tim Talent Acquisition' },
  { key: 'users.manage', group: 'Administrasi', label: 'Kelola user & role' }
];

const ALL = PERMISSIONS.map((p) => p.key);

const ROLE_PERMISSIONS = {
  SUPERADMIN: ALL,
  // TA Lead: everything except user admin and hire confirmation (that belongs to the Hiring Manager)
  HR_ADMIN: ALL.filter((p) => !['users.manage', 'approval.hire'].includes(p)),
  RECRUITER: [
    'dashboard.view',
    'pipeline.view',
    'pipeline.claim',
    'pipeline.move.own',
    'candidate.view',
    'candidate.evaluate',
    'candidate.import',
    // Own hires only (same rule as moving a card)
    'employee.view',
    'employee.manage'
  ],
  HIRING_MANAGER: ['dashboard.view', 'pipeline.view', 'candidate.view', 'candidate.evaluate', 'approval.hire', 'employee.view']
};

function permissionsFor(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function hasPermission(userOrRole, permission) {
  const role = typeof userOrRole === 'string' ? userOrRole : userOrRole && userOrRole.role;
  return permissionsFor(role).includes(permission);
}

/** Roles that can hold candidates as PIC (used for assign dropdown & workload) */
const PIC_ROLES = Object.keys(ROLE_PERMISSIONS).filter((r) => ROLE_PERMISSIONS[r].includes('pipeline.claim'));

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  PIC_ROLES,
  permissionsFor,
  hasPermission
};
