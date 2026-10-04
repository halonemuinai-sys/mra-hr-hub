const ExcelJS = require('exceljs');

/**
 * Generate official Single-Sheet Master Candidate Excel Template
 * Designed for simplicity: 1 Sheet containing all candidate attributes
 */
async function generateCandidateTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HR HUB Automation System — MRA Group';
  workbook.created = new Date();

  // Primary corporate styling
  const headerFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Deep Navy Blue
  };
  const headerFont = {
    name: 'Segoe UI',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' }
  };
  const borderThin = {
    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
  };

  // ==========================================
  // SINGLE SHEET: Data Pelamar (MRA Group)
  // ==========================================
  const ws = workbook.addWorksheet('Data Pelamar', {
    views: [{ showGridLines: true }],
    properties: { tabColor: { argb: 'FF1E3A8A' } }
  });

  ws.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Nama Lengkap *', key: 'fullName', width: 26 },
    { header: 'Email * (Wajib Unik)', key: 'email', width: 32 },
    { header: 'No WhatsApp / HP *', key: 'phone', width: 22 },
    { header: 'Kota Domisili', key: 'location', width: 20 },
    { header: 'Posisi Terakhir / Headline *', key: 'headline', width: 30 },
    { header: 'Perusahaan Terakhir', key: 'currentCompany', width: 26 },
    { header: 'Pengalaman (Tahun) *', key: 'totalExperienceYrs', width: 22 },
    { header: 'Pendidikan Terakhir * (S1/D3/S2/SMA)', key: 'degree', width: 26 },
    { header: 'Jurusan & Kampus', key: 'educationInfo', width: 30 },
    { header: 'Keahlian / Skills * (Pisahkan Koma)', key: 'skillsStr', width: 45 },
    { header: 'Ekspektasi Gaji (Rp)', key: 'expectedSalary', width: 22 },
    { header: 'Ketersediaan (IMMEDIATE / 1_MONTH)', key: 'availability', width: 26 },
    { header: 'Ringkasan Profil / Catatan', key: 'profileSummary', width: 45 }
  ];

  // Header row formatting
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  headerRow.fill = headerFill;
  headerRow.font = headerFont;
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Enable AutoFilter on header row
  ws.autoFilter = {
    from: 'A1',
    to: 'N1'
  };

  // Sample Data 1: Technology & Digital Role
  const sample1 = ws.addRow({
    no: 1,
    fullName: 'Budi Pratama',
    email: 'budi.pratama@mra.co.id',
    phone: '081234567890',
    location: 'Jakarta Selatan',
    headline: 'Senior Frontend Developer',
    currentCompany: 'PT Digital Solusi Nusantara',
    totalExperienceYrs: 5,
    degree: 'S1',
    educationInfo: 'Teknik Informatika, Universitas Indonesia',
    skillsStr: 'React, Next.js, TypeScript, Tailwind CSS, REST API, Node.js, PostgreSQL, Docker',
    expectedSalary: 18000000,
    availability: 'IMMEDIATE',
    profileSummary: 'Frontend engineer berpengalaman 5 tahun merancang arsitektur web modern Next.js dan Tailwind CSS.'
  });

  // Sample Data 2: Luxury Retail Role
  const sample2 = ws.addRow({
    no: 2,
    fullName: 'Jessica Tanuwidjaja',
    email: 'jessica.tanuwidjaja@gmail.com',
    phone: '081898765432',
    location: 'Jakarta Pusat',
    headline: 'Store Operations Manager',
    currentCompany: 'Maison Haute Luxury Boutique',
    totalExperienceYrs: 6,
    degree: 'S1',
    educationInfo: 'Manajemen Bisnis, Unika Atma Jaya',
    skillsStr: 'Luxury Retail, Store Operations, Customer Service, POS System, Inventory Management, Clienteling, Visual Merchandising',
    expectedSalary: 22000000,
    availability: 'IMMEDIATE',
    profileSummary: 'Store Operations Manager dengan pengalaman 6 tahun memimpin butik perhiasan mewah dan clienteling VVIP.'
  });

  [sample1, sample2].forEach(row => {
    row.height = 24;
    row.alignment = { vertical: 'middle' };
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = borderThin;
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  return workbook;
}

/**
 * Parse & Validate uploaded Excel template buffer
 * Seamlessly supports both the new Single-Sheet format AND legacy Multi-Sheet format
 */
async function parseCandidateTemplateWorkbook(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const errors = [];
  const candidatesMap = new Map();

  const firstWs = workbook.worksheets[0];
  if (!firstWs) {
    throw new Error('File Excel kosong atau tidak memiliki sheet yang dapat dibaca.');
  }

  // Check if this is the modern Single-Sheet format:
  // Detect header cells or sheet name
  const isSingleSheet =
    firstWs.name.toLowerCase().includes('data pelamar') ||
    firstWs.name.toLowerCase().includes('pelamar') ||
    firstWs.name.toLowerCase().includes('kandidat') ||
    workbook.worksheets.length === 1;

  if (isSingleSheet) {
    // ==========================================
    // PARSE 1-SHEET TEMPLATE
    // ==========================================
    firstWs.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row

      // Read values cleanly
      const noVal = row.getCell(1).value;
      const fullName = String(row.getCell(2).value || '').trim();
      
      let emailCell = row.getCell(3).value;
      let email = '';
      if (typeof emailCell === 'object' && emailCell?.text) {
        email = String(emailCell.text).trim().toLowerCase();
      } else if (emailCell) {
        email = String(emailCell).trim().toLowerCase();
      }

      const phone = String(row.getCell(4).value || '').trim();
      const location = String(row.getCell(5).value || '').trim();
      const headline = String(row.getCell(6).value || '').trim();
      const currentCompany = String(row.getCell(7).value || '').trim();
      const totalExperienceYrs = parseFloat(row.getCell(8).value) || 0;
      const degree = String(row.getCell(9).value || 'S1').trim().toUpperCase();
      const educationInfo = String(row.getCell(10).value || '').trim();
      const skillsRaw = String(row.getCell(11).value || '').trim();
      const expectedSalary = parseFloat(row.getCell(12).value) || null;
      
      let availability = String(row.getCell(13).value || 'IMMEDIATE').trim().toUpperCase();
      if (!['IMMEDIATE', 'ONE_MONTH_NOTICE', '1_MONTH', 'TWO_MONTH_NOTICE', 'OPEN_OFFERS', 'OPEN'].includes(availability)) {
        availability = 'IMMEDIATE';
      }

      const profileSummary = String(row.getCell(14).value || '').trim();

      // Row validation
      if (!fullName && !email) {
        return; // Empty row, safely ignore
      }

      if (!fullName || !email) {
        errors.push(`Baris ${rowNumber}: Nama Lengkap dan Email wajib diisi.`);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push(`Baris ${rowNumber}: Format email "${email}" tidak valid.`);
        return;
      }

      // Parse Skills from comma-separated string
      const skills = [];
      if (skillsRaw) {
        skillsRaw.split(/[,;]+/).forEach(s => {
          const trimmed = s.trim();
          if (trimmed) {
            skills.push({
              skillName: trimmed,
              category: 'TECHNICAL',
              proficiency: 'INTERMEDIATE'
            });
          }
        });
      }

      // Parse Education record
      const educations = [];
      if (degree || educationInfo) {
        educations.push({
          degree: degree || 'S1',
          institution: educationInfo || 'Universitas',
          major: educationInfo || 'Umum'
        });
      }

      // Parse Experience record
      const experiences = [];
      if (currentCompany || headline) {
        experiences.push({
          companyName: currentCompany || 'Perusahaan Terakhir',
          roleTitle: headline || 'Posisi Terakhir',
          industry: 'Umum',
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * Math.max(1, totalExperienceYrs)),
          isCurrent: true,
          description: profileSummary || 'Pengalaman kerja terdata dari Excel.'
        });
      }

      candidatesMap.set(email, {
        fullName,
        email,
        phone,
        location,
        headline: headline || 'Kandidat Profesional',
        currentCompany,
        totalExperienceYrs,
        expectedSalary,
        availability,
        profileSummary,
        intakeSource: 'EXCEL_TEMPLATE',
        skills,
        educations,
        experiences
      });
    });
  } else {
    // ==========================================
    // BACKWARD COMPATIBLE: LEGACY MULTI-SHEET
    // ==========================================
    const wsMain = workbook.getWorksheet('Data Utama Kandidat') || workbook.worksheets[1] || firstWs;

    wsMain.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const fullName = String(row.getCell(1).value || '').trim();
      let emailCell = row.getCell(2).value;
      let email = '';
      if (typeof emailCell === 'object' && emailCell?.text) {
        email = String(emailCell.text).trim().toLowerCase();
      } else if (emailCell) {
        email = String(emailCell).trim().toLowerCase();
      }

      const phone = String(row.getCell(3).value || '').trim();
      const location = String(row.getCell(4).value || '').trim();
      const headline = String(row.getCell(5).value || '').trim();
      const currentCompany = String(row.getCell(6).value || '').trim();
      const totalExperienceYrs = parseFloat(row.getCell(7).value) || 0;
      const expectedSalary = parseFloat(row.getCell(8).value) || null;
      let availability = String(row.getCell(9).value || 'IMMEDIATE').trim().toUpperCase();
      const profileSummary = String(row.getCell(10).value || '').trim();

      if (!fullName || !email) return;

      candidatesMap.set(email, {
        fullName,
        email,
        phone,
        location,
        headline,
        currentCompany,
        totalExperienceYrs,
        expectedSalary,
        availability,
        profileSummary,
        intakeSource: 'EXCEL_TEMPLATE',
        experiences: [],
        educations: [],
        skills: []
      });
    });

    // Parse legacy experiences sheet
    const wsExp = workbook.getWorksheet('Riwayat Pengalaman');
    if (wsExp) {
      wsExp.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const email = String(row.getCell(1).value || '').trim().toLowerCase();
        const companyName = String(row.getCell(2).value || '').trim();
        const roleTitle = String(row.getCell(3).value || '').trim();
        if (email && candidatesMap.has(email) && companyName && roleTitle) {
          candidatesMap.get(email).experiences.push({
            companyName,
            roleTitle,
            isCurrent: true
          });
        }
      });
    }

    // Parse legacy skills sheet
    const wsSkill = workbook.getWorksheet('Matriks Keahlian');
    if (wsSkill) {
      wsSkill.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const email = String(row.getCell(1).value || '').trim().toLowerCase();
        const skillName = String(row.getCell(2).value || '').trim();
        if (email && candidatesMap.has(email) && skillName) {
          candidatesMap.get(email).skills.push({
            skillName,
            category: 'TECHNICAL',
            proficiency: 'INTERMEDIATE'
          });
        }
      });
    }
  }

  return {
    candidates: Array.from(candidatesMap.values()),
    totalCandidates: candidatesMap.size,
    errors
  };
}

module.exports = {
  generateCandidateTemplateWorkbook,
  parseCandidateTemplateWorkbook
};
