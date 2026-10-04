const prisma = require('../api/db');

async function listJobs(req, res) {
  try {
    const { department, division, activeOnly } = req.query;
    const where = {};
    if (department) where.department = department;
    if (division) where.division = division;
    if (activeOnly === 'true' || activeOnly === undefined) where.isActive = true;

    const jobs = await prisma.jobPosting.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    return res.json({
      success: true,
      data: jobs
    });
  } catch (error) {
    console.error('Error listing jobs:', error);
    return res.status(500).json({ success: false, message: 'Gagal mengambil daftar lowongan.' });
  }
}

async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const job = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        applications: {
          include: {
            candidate: {
              include: { skills: true }
            }
          },
          orderBy: { atsScore: 'desc' }
        }
      }
    });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Lowongan tidak ditemukan.' });
    }

    return res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error fetching job detail:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createJob(req, res) {
  try {
    const {
      title,
      department,
      division,
      location,
      employmentType,
      minExperience,
      minEducation,
      salaryMin,
      salaryMax,
      description,
      requirements,
      mustHaveSkills,
      niceToHaveSkills
    } = req.body;

    if (!title || !department) {
      return res.status(400).json({ success: false, message: 'Judul dan Departemen wajib diisi.' });
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newJob = await prisma.jobPosting.create({
      data: {
        title,
        slug,
        department,
        division: division || 'MRA Group',
        location: location || 'Jakarta',
        employmentType: employmentType || 'Full-time',
        minExperience: parseInt(minExperience, 10) || 0,
        minEducation: minEducation || 'S1',
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        description: description || '',
        requirements: requirements || '',
        mustHaveSkills: Array.isArray(mustHaveSkills) ? mustHaveSkills : [],
        niceToHaveSkills: Array.isArray(niceToHaveSkills) ? niceToHaveSkills : []
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Lowongan pekerjaan berhasil diterbitkan.',
      data: newJob
    });
  } catch (error) {
    console.error('Error creating job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.minExperience !== undefined) {
      updateData.minExperience = parseInt(updateData.minExperience, 10);
    }
    if (updateData.salaryMin !== undefined) {
      updateData.salaryMin = updateData.salaryMin ? parseFloat(updateData.salaryMin) : null;
    }
    if (updateData.salaryMax !== undefined) {
      updateData.salaryMax = updateData.salaryMax ? parseFloat(updateData.salaryMax) : null;
    }

    const updatedJob = await prisma.jobPosting.update({
      where: { id },
      data: updateData
    });

    return res.json({
      success: true,
      message: 'Lowongan pekerjaan berhasil diperbarui.',
      data: updatedJob
    });
  } catch (error) {
    console.error('Error updating job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    await prisma.jobPosting.delete({ where: { id } });
    return res.json({ success: true, message: 'Lowongan berhasil dihapus.' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  listJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob
};
