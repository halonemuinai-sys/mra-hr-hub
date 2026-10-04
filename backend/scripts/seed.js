const prisma = require('../api/db');

async function main() {
  console.log('🌱 Seeding HR HUB database with master jobs and candidate profiles...');

  // 1. Create Default Jobs
  const jobFrontend = await prisma.jobPosting.upsert({
    where: { slug: 'senior-frontend-developer-mra-digital' },
    update: {},
    create: {
      title: 'Senior Frontend Developer',
      slug: 'senior-frontend-developer-mra-digital',
      department: 'Technology & Digital',
      division: 'MRA Corporate / Shared Service',
      location: 'Jakarta Selatan (Hybrid)',
      employmentType: 'Full-time',
      minExperience: 3,
      minEducation: 'S1',
      salaryMin: 16000000,
      salaryMax: 22000000,
      description: 'Bertanggung jawab mengembangkan dan memelihara aplikasi web modern internal ekosistem MRA (GLC, Winner Sport, HR HUB) menggunakan Next.js, TypeScript, dan Tailwind CSS.',
      requirements: 'Menguasai React/Next.js, TypeScript, REST API integration, state management, dan responsive modern UI.',
      mustHaveSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST API'],
      niceToHaveSkills: ['Framer Motion', 'Prisma', 'Docker', 'GraphQL', 'Node.js'],
      isActive: true
    }
  });

  const jobRetail = await prisma.jobPosting.upsert({
    where: { slug: 'store-operations-manager-mra-retail' },
    update: {},
    create: {
      title: 'Store Operations Manager (Luxury Retail)',
      slug: 'store-operations-manager-mra-retail',
      department: 'Retail Operations',
      division: 'MRA Retail (BVLGARI / Mogems)',
      location: 'Plaza Indonesia, Jakarta',
      employmentType: 'Full-time',
      minExperience: 4,
      minEducation: 'S1',
      salaryMin: 18000000,
      salaryMax: 26000000,
      description: 'Memimpin operasional butik mewah, mengelola tim sales/SPG, memastikan target omset tercapai, dan mengawasi inventory serta kepuasan pelanggan VVIP.',
      requirements: 'Pengalaman minimal 4 tahun di industri luxury retail / fashion, kemampuan leadership prima, clienteling, dan stock management.',
      mustHaveSkills: ['Store Operations', 'Customer Service', 'POS System', 'Inventory Management', 'Sales Strategy'],
      niceToHaveSkills: ['Clienteling', 'Luxury Retail', 'Visual Merchandising', 'Stock Opname'],
      isActive: true
    }
  });

  const jobLegal = await prisma.jobPosting.upsert({
    where: { slug: 'legal-compliance-specialist' },
    update: {},
    create: {
      title: 'Legal & Compliance Specialist',
      slug: 'legal-compliance-specialist',
      department: 'Legal & General Affairs',
      division: 'GLC MRA Holding',
      location: 'Jakarta Selatan',
      employmentType: 'Full-time',
      minExperience: 2,
      minEducation: 'S1',
      salaryMin: 10000000,
      salaryMax: 15000000,
      description: 'Menangani perizinan korporat, perancangan kontrak kerja sama vendor, evaluasi kepatuhan regulasi, dan audit berkala.',
      requirements: 'Lulusan Sarjana Hukum (S1), menguasai hukum perdata/bisnis Indonesia, legal drafting, dan perizinan OSS.',
      mustHaveSkills: ['Legal Drafting', 'Contract Review', 'Compliance', 'SOP'],
      niceToHaveSkills: ['Litigasi', 'OSS Perizinan', 'General Affairs', 'Audit'],
      isActive: true
    }
  });

  const jobFnB = await prisma.jobPosting.upsert({
    where: { slug: 'restaurant-general-manager-fnb' },
    update: {},
    create: {
      title: 'Restaurant Operations Manager (Häagen-Dazs & Jamba)',
      slug: 'restaurant-general-manager-fnb',
      department: 'Food & Beverage Operations',
      division: 'Food & Beverage Franchises',
      location: 'Jakarta & Tangerang',
      employmentType: 'Full-time',
      minExperience: 3,
      minEducation: 'D3 / S1',
      salaryMin: 12000000,
      salaryMax: 18000000,
      description: 'Mengawasi operasional cafe & outlet Häagen-Dazs dan Jamba Juice, memastikan standar kebersihan HACCP, mengoptimalkan food cost, serta memimpin tim store crew.',
      requirements: 'Pengalaman minimal 3 tahun di industri F&B chain/retail, menguasai audit food cost, audit audit kebersihan, dan customer loyalty.',
      mustHaveSkills: ['F&B Management', 'Food Costing', 'HACCP', 'Store Operations', 'Customer Service'],
      niceToHaveSkills: ['Barista Skills', 'Inventory Management', 'POS OMEGA', 'P&L Outlet'],
      isActive: true
    }
  });

  const jobRadio = await prisma.jobPosting.upsert({
    where: { slug: 'broadcast-radio-producer-hardrock' },
    update: {},
    create: {
      title: 'Radio Program Producer & Music Director (Hard Rock FM)',
      slug: 'broadcast-radio-producer-hardrock',
      department: 'Radio Broadcasting & Audio Creative',
      division: 'National Broadcast Radio',
      location: 'Jakarta Selatan (Onsite)',
      employmentType: 'Full-time',
      minExperience: 2,
      minEducation: 'S1',
      salaryMin: 9000000,
      salaryMax: 14000000,
      description: 'Merancang program siaran radio lifestyle & music terpopuler, mengkurasi playlist tangga lagu internasional dan nasional, serta mengelola kolaborasi musisi & brand sponsor.',
      requirements: 'Passion tinggi di industri musik, kreatif, menguasai audio production software (Pro Tools / Adobe Audition), dan kepribadian komunikatif.',
      mustHaveSkills: ['Audio Production', 'Radio Broadcasting', 'Music Curation', 'Scriptwriting', 'Creative Content'],
      niceToHaveSkills: ['Podcast Production', 'Voice Over', 'Social Media Audio', 'Sponsor Activation'],
      isActive: true
    }
  });

  const jobMedia = await prisma.jobPosting.upsert({
    where: { slug: 'senior-fashion-editor-bazaar' },
    update: {},
    create: {
      title: 'Senior Fashion Editor & Digital Strategist (Harper’s Bazaar)',
      slug: 'senior-fashion-editor-bazaar',
      department: 'Editorial & Media Publishing',
      division: 'High-End Print & Digital Media',
      location: 'Jakarta Selatan',
      employmentType: 'Full-time',
      minExperience: 3,
      minEducation: 'S1',
      salaryMin: 11000000,
      salaryMax: 16000000,
      description: 'Menulis liputan tren haute couture, mewawancarai desainer ternama, mengarahkan photoshoot editorial mode, dan menyusun strategi konten digital di Harper’s Bazaar & Cosmopolitan.',
      requirements: 'Latar belakang Jurnalistik / Komunikasi / Fashion, portfolio tulisan bahasa Inggris dan Indonesia yang kuat, serta wawasan mendalam tentang dunia luxury fashion.',
      mustHaveSkills: ['Fashion Journalism', 'Editorial Direction', 'Copywriting', 'Creative Direction', 'Social Media Strategy'],
      niceToHaveSkills: ['Photography Direction', 'SEO Editorial', 'Brand Integration', 'Event Coverage'],
      isActive: true
    }
  });

  // 2. Create Realistic Candidates
  const cand1 = await prisma.candidate.upsert({
    where: { email: 'aris.setiyono@example.com' },
    update: {},
    create: {
      fullName: 'Aris Setiyono',
      email: 'aris.setiyono@example.com',
      phone: '081289123456',
      location: 'Jakarta',
      headline: 'Fullstack Solution Architect & Lead Engineer',
      currentCompany: 'MRA Technology SS',
      totalExperienceYrs: 6.5,
      expectedSalary: 25000000,
      availability: 'IMMEDIATE',
      intakeSource: 'ATS_RESUME_UPLOAD',
      profileSummary: 'Spesialis perancangan sistem korporat, otomatisasi rekrutmen, integrasi multi-sistem ERP, dan modern web application.',
      jobFamily: 'IT_DIGITAL',
      seniorityLevel: 'LEAD',
      tags: ['#TopTier', '#KeyTalent', '#ImmediateHire', '#TechTalent'],
      skills: {
        create: [
          { skillName: 'Next.js', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'React', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'TypeScript', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'Node.js', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'Tailwind CSS', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'PostgreSQL', category: 'TECHNICAL', proficiency: 'ADVANCED' },
          { skillName: 'Prisma', category: 'TECHNICAL', proficiency: 'ADVANCED' }
        ]
      },
      experiences: {
        create: [
          {
            companyName: 'MRA Group Shared Services',
            roleTitle: 'Principal Lead Engineer',
            industry: 'IT & Media',
            startDate: new Date('2021-03-01'),
            isCurrent: true,
            description: 'Memimpin arsitektur sistem GLC MRA, Winner Sport, dan HR HUB Automation.'
          }
        ]
      },
      educations: {
        create: [
          {
            institution: 'Universitas Indonesia',
            degree: 'S1',
            major: 'Sistem Informasi',
            graduationYear: 2019,
            gpa: 3.82
          }
        ]
      }
    }
  });

  const cand2 = await prisma.candidate.upsert({
    where: { email: 'citra.permata@example.com' },
    update: {},
    create: {
      fullName: 'Citra Permata Kusuma',
      email: 'citra.permata@example.com',
      phone: '081398765432',
      location: 'Jakarta Pusat',
      headline: 'Luxury Boutique Manager & Client Relationship Specialist',
      currentCompany: 'High-End Fashion Boutiques',
      totalExperienceYrs: 5.0,
      expectedSalary: 20000000,
      availability: 'ONE_MONTH_NOTICE',
      intakeSource: 'EXCEL_TEMPLATE',
      profileSummary: 'Berpengalaman 5 tahun memimpin butik jam tangan dan perhiasan mewah, pencapaian target sales 115% konsisten.',
      jobFamily: 'RETAIL_OPS',
      seniorityLevel: 'SENIOR',
      tags: ['#TopTier', '#RetailExpert', '#KeyTalent'],
      skills: {
        create: [
          { skillName: 'Store Operations', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'Luxury Retail', category: 'TECHNICAL', proficiency: 'EXPERT' },
          { skillName: 'Clienteling', category: 'TECHNICAL', proficiency: 'ADVANCED' },
          { skillName: 'Customer Service', category: 'SOFT', proficiency: 'EXPERT' },
          { skillName: 'Inventory Management', category: 'TECHNICAL', proficiency: 'ADVANCED' },
          { skillName: 'POS System', category: 'TOOLS', proficiency: 'EXPERT' }
        ]
      },
      experiences: {
        create: [
          {
            companyName: 'Prestige Retail Indonesia',
            roleTitle: 'Assistant Store Manager',
            industry: 'Luxury Retail',
            startDate: new Date('2020-01-15'),
            isCurrent: true,
            description: 'Mengawasi 12 staf sales, menangani komplain klien VVIP, dan memimpin stock opname bulanan.'
          }
        ]
      },
      educations: {
        create: [
          {
            institution: 'Universitas Bina Nusantara',
            degree: 'S1',
            major: 'Manajemen Bisnis',
            graduationYear: 2019,
            gpa: 3.65
          }
        ]
      }
    }
  });

  // Link applications
  await prisma.jobApplication.upsert({
    where: { id: `${jobFrontend.id}_${cand1.id}` },
    update: {},
    create: {
      id: `${jobFrontend.id}_${cand1.id}`,
      jobId: jobFrontend.id,
      candidateId: cand1.id,
      status: 'SHORTLISTED',
      atsScore: 96,
      skillsScore: 98,
      expScore: 95,
      eduScore: 95,
      matchedKeywords: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'REST API', 'Prisma', 'Node.js'],
      missingKeywords: [],
      recruiterNotes: 'Kandidat luar biasa, profil sangat cocok untuk tech lead HR HUB dan GLC.',
      scorecardRating: 5
    }
  });

  await prisma.jobApplication.upsert({
    where: { id: `${jobRetail.id}_${cand2.id}` },
    update: {},
    create: {
      id: `${jobRetail.id}_${cand2.id}`,
      jobId: jobRetail.id,
      candidateId: cand2.id,
      status: 'INTERVIEW_HR',
      atsScore: 92,
      skillsScore: 94,
      expScore: 90,
      eduScore: 90,
      matchedKeywords: ['Store Operations', 'Customer Service', 'POS System', 'Inventory Management', 'Luxury Retail', 'Clienteling'],
      missingKeywords: ['Sales Strategy'],
      recruiterNotes: 'Track record di butik mewah terbukti sangat baik. Jadwalkan interview user dengan COO Retail.',
      scorecardRating: 5
    }
  });

  console.log('✅ Seeding complete!');
}

main()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
