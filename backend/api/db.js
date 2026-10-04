const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

const POOL_MAX = Number(process.env.DB_POOL_MAX || 10);

function createPrisma() {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) return new PrismaClient();

    const dbConfig = parse(url);
    if (url.includes('sslmode=require')) {
      dbConfig.ssl = { rejectUnauthorized: false };
    }
    dbConfig.max = POOL_MAX;
    dbConfig.options = '-c search_path=hr_hub,public';

    return new PrismaClient({ adapter: new PrismaPg(new Pool(dbConfig)) });
  } catch (err) {
    console.warn('[db] Kembali ke PrismaClient standar:', err.message);
    return new PrismaClient();
  }
}

const globalKey = Symbol.for('hrHub.prisma');
const prisma = globalThis[globalKey] || createPrisma();
if (!globalThis[globalKey]) globalThis[globalKey] = prisma;

module.exports = prisma;
