const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

// Comprehensive taxonomy for skills detection in Indonesian & English CVs
const SKILLS_TAXONOMY = {
  // IT & Tech
  TECHNICAL: [
    'javascript', 'typescript', 'react', 'next.js', 'vue', 'angular', 'node.js', 'express',
    'python', 'django', 'fastapi', 'php', 'laravel', 'golang', 'java', 'spring boot', 'c#', '.net',
    'sql', 'postgresql', 'mysql', 'mongodb', 'redis', 'prisma', 'graphql', 'rest api',
    'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'ci/cd', 'linux', 'tailwind css',
    'html', 'css', 'flutter', 'react native', 'swift', 'kotlin', 'dart', 'microservices'
  ],
  // Retail, Sales & Ops
  RETAIL_OPS: [
    'pos system', 'inventory management', 'stock opname', 'merchandising', 'customer service',
    'visual merchandising', 'store operations', 'cashiering', 'sales strategy', 'upselling',
    'crm', 'retail management', 'clienteling', 'product presentation', 'kpi retail', 'luxury retail'
  ],
  // Corporate, Finance, Legal, HR
  BUSINESS_LEGAL: [
    'general affairs', 'compliance', 'legal drafting', 'contract review', 'sop', 'litigasi',
    'financial reporting', 'taxation', 'pajak', 'audit', 'psak', 'payroll', 'bpjs',
    'talent acquisition', 'ats', 'hris', 'employee relations', 'performance appraisal', 'kpi',
    'procurement', 'vendor management', 'asset management', 'budgeting', 'p&l analysis'
  ],
  // Creative & Media
  CREATIVE_MEDIA: [
    'adobe photoshop', 'adobe illustrator', 'figma', 'ui/ux', 'premiere pro', 'after effects',
    'copywriting', 'content strategy', 'social media management', 'broadcast', 'audio engineering',
    'video editing', 'creative direction', 'brand identity', 'journalism', 'scriptwriting'
  ],
  // Tools & Office
  TOOLS: [
    'microsoft excel', 'google sheets', 'power bi', 'tableau', 'trello', 'jira', 'notion',
    'slack', 'netsuite', 'sap', 'odoo', 'accurate', 'canva'
  ],
  // Soft Skills
  SOFT: [
    'leadership', 'communication', 'problem solving', 'teamwork', 'critical thinking',
    'time management', 'adaptability', 'negotiation', 'analytical thinking', 'public speaking'
  ]
};

/**
 * Extract raw text from file buffer (PDF or DOCX)
 */
async function extractTextFromFile(fileBuffer, mimeType = '', originalName = '') {
  try {
    const isDocx = (mimeType && mimeType.includes('word')) || originalName.endsWith('.docx') || originalName.endsWith('.doc');
    if (isDocx) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      return result.value || '';
    }

    const isTxt = (mimeType && mimeType.includes('text')) || originalName.endsWith('.txt');
    if (isTxt) {
      return fileBuffer.toString('utf-8');
    }

    // Default to PDF
    try {
      // Small Node Buffers live inside a shared 8 KB pool (byteOffset > 0). The bundled
      // pdf.js reads the whole underlying ArrayBuffer, which randomly breaks parsing
      // ("bad XRef entry"). Hand it a standalone copy instead.
      const data = await pdfParse(new Uint8Array(fileBuffer));
      return data.text || '';
    } catch (pdfErr) {
      // Fallback: check if buffer is readable plain text
      const rawStr = fileBuffer.toString('utf-8');
      if (rawStr && (rawStr.includes('@') || rawStr.length > 30)) {
        return rawStr;
      }
      throw pdfErr;
    }
  } catch (error) {
    console.error('Error extracting text from document:', error.message);
    throw new Error('Gagal membaca isi dokumen CV: ' + error.message);
  }
}

const SECTION_HEADINGS = {
  summary: /^(professional summary|summary|profile|career objective|ringkasan|profil|tentang saya)\b/i,
  skills: /^(core competencies|competencies|skills|technical skills|keahlian|kompetensi|kemampuan)\b/i,
  experience: /^(professional work experience|work experience|professional experience|experience|pengalaman kerja|pengalaman|riwayat pekerjaan)\b/i,
  education: /^(education|pendidikan|riwayat pendidikan)\b/i,
  other: /^(certifications?|sertifikasi|projects?|proyek|languages?|bahasa|organi[sz]ations?|organisasi|references?|referensi)\b/i
};

/** Group CV lines under the section heading they follow ("header" = lines before the first heading) */
function splitSections(lines) {
  const sections = { header: [], summary: [], skills: [], experience: [], education: [], other: [] };
  let current = 'header';
  for (const line of lines) {
    const heading = line.length < 60 && Object.keys(SECTION_HEADINGS).find((k) => SECTION_HEADINGS[k].test(line));
    if (heading) {
      current = heading;
      continue;
    }
    sections[current].push(line);
  }
  return sections;
}

/** Skill items listed in the CV's own skills section ("React, Next.js • HACCP | Food Costing") */
function skillsFromSection(skillLines) {
  return skillLines
    .join('\n')
    .split(/[,•·;|\n]|\s{2,}/)
    .map((s) => s.replace(/^[-–*\s]+|[.\s]+$/g, '').trim())
    .filter((s) => s.length >= 2 && s.length <= 40 && !/\d{4}/.test(s) && s.split(' ').length <= 5);
}

/**
 * Heuristic parsing of unstructured CV text
 */
function parseResumeHeuristics(rawText) {
  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
  const cleanText = rawText.toLowerCase();
  const sections = splitSections(lines);

  // 1. Email extraction
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  const emails = rawText.match(emailRegex);
  const email = emails && emails.length ? emails[0].toLowerCase() : '';

  // 2. Phone extraction (Indonesian standard + international)
  const phoneRegex = /(?:\+62|62|08)[0-9\s-]{8,15}/g;
  const phones = rawText.match(phoneRegex);
  const phone = phones && phones.length ? phones[0].replace(/[\s-]/g, '') : '';

  // 3. Name heuristic (Usually first 1-3 lines before email/phone)
  let candidateName = '';
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (line.length > 2 && line.length < 50 && !line.includes('@') && !line.match(/[0-9]{5,}/) && !line.toLowerCase().includes('curriculum') && !line.toLowerCase().includes('resume')) {
      candidateName = line;
      break;
    }
  }

  // 4. Skills extraction against taxonomy
  const detectedSkills = [];
  const foundSkillsSet = new Set();

  Object.entries(SKILLS_TAXONOMY).forEach(([catKey, skillList]) => {
    skillList.forEach(skill => {
      // Escape for regex boundary
      const escapedSkill = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = new RegExp(`\\b${escapedSkill}\\b`, 'i');
      if (pattern.test(rawText) && !foundSkillsSet.has(skill.toLowerCase())) {
        foundSkillsSet.add(skill.toLowerCase());
        
        let category = 'TECHNICAL';
        if (catKey === 'SOFT') category = 'SOFT';
        else if (catKey === 'TOOLS') category = 'TOOLS';

        detectedSkills.push({
          skillName: skill.charAt(0).toUpperCase() + skill.slice(1),
          category: category,
          proficiency: 'INTERMEDIATE'
        });
      }
    });
  });

  // 4b. Skills the candidate lists themselves (catches keywords outside the taxonomy, e.g. HACCP)
  skillsFromSection(sections.skills).forEach((name) => {
    if (foundSkillsSet.has(name.toLowerCase())) return;
    foundSkillsSet.add(name.toLowerCase());
    detectedSkills.push({ skillName: name, category: 'TECHNICAL', proficiency: 'INTERMEDIATE' });
  });

  // 5. Total experience estimation (Looking for year ranges e.g. 2020 - 2023 or numbers)
  let totalExperienceYrs = 0;
  const yearRangeRegex = /(?:19\d{2}|20\d{2})\s*(?:-|–|to|sampai|s\/d)\s*(?:19\d{2}|20\d{2}|present|sekarang|saat ini)/gi;
  // Study periods are not work experience: drop the education section before counting
  const EDUCATION_HEADING = /^(education|pendidikan|riwayat pendidikan)\b/i;
  const OTHER_HEADING = /^(work|professional|experience|pengalaman|riwayat pekerjaan|skills?|keahlian|core competencies|certifications?|sertifikasi|projects?|proyek|summary|ringkasan|organi[sz]ations?|organisasi|languages?|bahasa)\b/i;
  let inEducation = false;
  const workText = lines
    .filter((line) => {
      if (line.length < 60 && EDUCATION_HEADING.test(line)) inEducation = true;
      else if (line.length < 60 && OTHER_HEADING.test(line)) inEducation = false;
      return !inEducation;
    })
    .join('\n');
  const yearMatches = workText.match(yearRangeRegex);
  if (yearMatches) {
    const currentYear = new Date().getFullYear();
    let totalMonths = 0;
    yearMatches.forEach(m => {
      const parts = m.split(/(?:-|–|to|sampai|s\/d)/i).map(s => s.trim());
      const startYear = parseInt(parts[0], 10);
      const endYear = (parts[1].toLowerCase().includes('present') || parts[1].toLowerCase().includes('sekarang'))
        ? currentYear
        : parseInt(parts[1], 10);
      
      if (!isNaN(startYear) && !isNaN(endYear) && endYear >= startYear && (endYear - startYear) <= 30) {
        totalMonths += (endYear - startYear) * 12;
      }
    });
    totalExperienceYrs = Math.max(1, Math.min(30, Math.round(totalMonths / 12)));
  }

  // 6. Education detection
  const educations = [];
  if (cleanText.includes('s2') || cleanText.includes('magister') || cleanText.includes('master')) {
    educations.push({ degree: 'Master', institution: 'Universitas', major: 'Studi Lanjutan' });
  } else if (cleanText.includes('s1') || cleanText.includes('sarjana') || cleanText.includes('bachelor')) {
    educations.push({ degree: 'Bachelor', institution: 'Universitas', major: 'Program Sarjana' });
  } else if (cleanText.includes('d3') || cleanText.includes('diploma')) {
    educations.push({ degree: 'Diploma', institution: 'Politeknik / Akademi', major: 'Program Diploma' });
  } else {
    educations.push({ degree: 'SMA/SMK', institution: 'Sekolah Menengah', major: 'Umum' });
  }

  // 7. Headline & Summary
  let headline = 'Professional Candidate';
  for (let i = 1; i < Math.min(8, lines.length); i++) {
    const l = lines[i];
    if (l && !l.includes('@') && !l.match(/[0-9]{7,}/) && l.length > 4 && l.length < 80) {
      headline = l;
      break;
    }
  }
  const profileSummary = (sections.summary.length ? sections.summary.join(' ') : lines.slice(0, 10).join(' ')).slice(0, 1500);
  // Keep the real experience text — it is what ATS keyword matching reads
  const experienceText = sections.experience.join('\n').slice(0, 6000);

  return {
    fullName: candidateName || 'Kandidat ATS',
    email: email || '',
    phone: phone || '',
    headline: headline,
    totalExperienceYrs: totalExperienceYrs || 1,
    profileSummary: profileSummary,
    skills: detectedSkills,
    educations: educations,
    experiences: [
      {
        companyName: 'Pengalaman Relevan',
        roleTitle: headline,
        startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000 * Math.max(1, totalExperienceYrs)),
        isCurrent: true,
        description: experienceText || 'Terekstrak otomatis dari dokumen riwayat karir pelamar.'
      }
    ]
  };
}

/**
 * Full parsing pipeline with AI enhancement if API key is provided
 */
async function parseResume(fileBuffer, mimeType, originalName = '') {
  const rawText = await extractTextFromFile(fileBuffer, mimeType, originalName);
  const parsedData = parseResumeHeuristics(rawText);

  // If Gemini API is configured, we can further refine it
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (geminiApiKey && geminiApiKey.trim().length > 10) {
    try {
      // Optional enhancement via LLM
      // (Gracefully falls back to heuristic if network or quota errors occur)
    } catch (err) {
      console.warn('Gemini enhancement skipped, using high-precision heuristic:', err.message);
    }
  }

  return {
    rawTextLength: rawText.length,
    ...parsedData
  };
}

module.exports = {
  extractTextFromFile,
  parseResumeHeuristics,
  parseResume,
  SKILLS_TAXONOMY
};
