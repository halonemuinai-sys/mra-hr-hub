const bcrypt = require('bcryptjs');
const prisma = require('../api/db');
const { ROLES, PERMISSIONS, ROLE_PERMISSIONS } = require('../config/permissions');

const ROLE_KEYS = ROLES.map((r) => r.key);
const MIN_PASSWORD = 8;

const publicUser = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
};

/** Prevent locking everyone out: at least one active SUPERADMIN must remain */
async function wouldRemoveLastSuperadmin(userId, next) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, isActive: true } });
  if (!target || target.role !== 'SUPERADMIN' || !target.isActive) return false;
  const staysSuperadmin = (next.role ?? target.role) === 'SUPERADMIN' && (next.isActive ?? target.isActive);
  if (staysSuperadmin) return false;
  const others = await prisma.user.count({ where: { role: 'SUPERADMIN', isActive: true, id: { not: userId } } });
  return others === 0;
}

/**
 * GET /api/users/access-matrix
 * Roles, permission catalog and role → permission mapping (read-only)
 */
function getAccessMatrix(req, res) {
  return res.json({
    success: true,
    data: { roles: ROLES, permissions: PERMISSIONS, rolePermissions: ROLE_PERMISSIONS }
  });
}

/**
 * GET /api/users
 */
async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        ...publicUser,
        _count: {
          select: {
            assignedApplications: { where: { status: { notIn: ['HIRED', 'REJECTED', 'TALENT_POOL'] } } }
          }
        }
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }]
    });
    return res.json({
      success: true,
      data: users.map(({ _count, ...u }) => ({ ...u, activeCandidates: _count.assignedApplications }))
    });
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/users  { name, email, role, password }
 */
async function createUser(req, res) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const { role, password } = req.body;

    if (!name || !email) return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Format email tidak valid.' });
    }
    if (!ROLE_KEYS.includes(role)) return res.status(400).json({ success: false, message: 'Role tidak valid.' });
    if (!password || String(password).length < MIN_PASSWORD) {
      return res.status(400).json({ success: false, message: `Password minimal ${MIN_PASSWORD} karakter.` });
    }

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });

    const user = await prisma.user.create({
      data: { name, email, role, password: await bcrypt.hash(String(password), 10) },
      select: publicUser
    });
    return res.status(201).json({ success: true, message: `User ${user.name} berhasil dibuat.`, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/users/:id  { name?, role?, isActive?, password? }
 * Deactivating a user returns their active candidates to the unassigned queue.
 */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const data = {};

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) return res.status(400).json({ success: false, message: 'Nama tidak boleh kosong.' });
      data.name = name;
    }
    if (req.body.role !== undefined) {
      if (!ROLE_KEYS.includes(req.body.role)) return res.status(400).json({ success: false, message: 'Role tidak valid.' });
      data.role = req.body.role;
    }
    if (req.body.isActive !== undefined) data.isActive = Boolean(req.body.isActive);
    if (req.body.password) {
      if (String(req.body.password).length < MIN_PASSWORD) {
        return res.status(400).json({ success: false, message: `Password minimal ${MIN_PASSWORD} karakter.` });
      }
      data.password = await bcrypt.hash(String(req.body.password), 10);
    }

    if (id === req.user.id && (data.isActive === false || (data.role && data.role !== req.user.role))) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menonaktifkan atau mengubah role akun sendiri.' });
    }
    if (await wouldRemoveLastSuperadmin(id, data)) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada satu Super Admin yang aktif.' });
    }

    const user = await prisma.user.update({ where: { id }, data, select: publicUser });

    let released = 0;
    if (data.isActive === false) {
      const r = await prisma.jobApplication.updateMany({
        where: { assignedRecruiterId: id, status: { notIn: ['HIRED', 'REJECTED', 'TALENT_POOL'] } },
        data: { assignedRecruiterId: null, assignedAt: null }
      });
      released = r.count;
    }

    return res.json({
      success: true,
      message: released
        ? `User diperbarui. ${released} kandidat aktif dikembalikan ke antrean.`
        : 'User berhasil diperbarui.',
      data: user
    });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    console.error('Error updating user:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getAccessMatrix,
  listUsers,
  createUser,
  updateUser
};
