const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../api/db');

async function seedUsers() {
  console.log('🌱 Seeding initial CMS admin users...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const usersToSeed = [
    {
      email: 'admin@mragroup.co.id',
      name: 'Budi Hartono (HR Director)',
      password: passwordHash,
      role: 'SUPERADMIN'
    },
    {
      email: 'recruiter@mragroup.co.id',
      name: 'Siti Rahma (Senior Talent Acquisition)',
      password: passwordHash,
      role: 'RECRUITER'
    },
    {
      email: 'ta.dewi@mragroup.co.id',
      name: 'Dewi Lestari (Talent Acquisition)',
      password: passwordHash,
      role: 'RECRUITER'
    },
    {
      email: 'ta.rizky@mragroup.co.id',
      name: 'Rizky Pratama (Talent Acquisition)',
      password: passwordHash,
      role: 'RECRUITER'
    },
    {
      email: 'hiring.manager@mragroup.co.id',
      name: 'Hendrawan (Retail Division Manager)',
      password: passwordHash,
      role: 'HIRING_MANAGER'
    }
  ];

  for (const u of usersToSeed) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email }
    });

    if (existing) {
      console.log(`ℹ️ User ${u.email} already exists. Updating credentials...`);
      await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          password: u.password,
          role: u.role
        }
      });
    } else {
      console.log(`✅ Creating user ${u.email} (${u.role})...`);
      await prisma.user.create({
        data: u
      });
    }
  }

  console.log('✨ Seed users completed successfully!');
  console.log('----------------------------------------------------');
  console.log('Kredensial Default CMS MRA HR HUB:');
  console.log('1. Superadmin : admin@mragroup.co.id / Password123!');
  console.log('2. Recruiter  : recruiter@mragroup.co.id / Password123!');
  console.log('----------------------------------------------------');
}

seedUsers()
  .catch((err) => {
    console.error('❌ Error seeding users:', err);
    process.exit(1);
  })
  .finally(async () => {
    process.exit(0);
  });
