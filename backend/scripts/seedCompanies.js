/**
 * Seeds the legal entities (PT) of MRA Group. Idempotent: matched by name, existing rows are left as they are
 * (codes / NPWP / Talenta branch edited in the Companies menu are never overwritten).
 *
 *   node scripts/seedCompanies.js
 */
const prisma = require('../api/db');

// [short code, legal name]
const COMPANIES = [
  ['MPI', 'PT Mogems Putri International'],
  ['JPI', 'PT Jemma Putri International'],
  ['PLA', 'PT Permata Landmarq Abadi'],
  ['AAA', 'PT Amanda Arumdhani Aishwarya'],
  ['MRA', 'PT Mugi Rekso Abadi'],
  ['MMI', 'PT Media Mandiri Indonesia'],
  ['RAD', 'PT Radio Antarnusa Djaja'],
  ['RHOS', 'PT Radio Harpa Ongko Sembilan'],
  ['RBPT', 'PT Radio Bali Perkasa Tama'],
  ['RSGS', 'PT Radio Swara Genta Semesta'],
  ['RSKN', 'PT Radio Swara Karunia Nada'],
  ['RKY', 'PT Radio Kiara Yudha'],
  ['RMA', 'PT Radio Muara Abdinusa'],
  ['RSDE', 'PT Radio Swara Delapan Enam'],
  ['RSTPM', 'PT Radio Suara Trijaya Pratama Mandiri'],
  ['RSKS', 'PT Radio Suara Karang Sentana'],
  ['RSBKP', 'PT Radio Suara Banjar Kencana Permai'],
  ['RSBGM', 'PT Radio Suara Bhumi Gowa Mas'],
  ['RBWN', 'PT Radio Bimasakti Wahana Nada'],
  ['MRD', 'PT Mitra Radio Digital'],
  ['MDM', 'PT MRA Dinamika Media']
];

async function main() {
  const existing = await prisma.company.findMany({ select: { code: true, name: true } });
  const names = new Set(existing.map((c) => c.name.toLowerCase()));
  const codes = new Set(existing.map((c) => c.code));
  let added = 0;
  for (const [code, name] of COMPANIES) {
    if (names.has(name.toLowerCase())) continue;
    if (codes.has(code)) {
      console.warn(`⚠️  Skipped ${name}: code ${code} is already used — add it from the Companies menu with another code.`);
      continue;
    }
    await prisma.company.create({ data: { code, name } });
    codes.add(code);
    added++;
  }
  const total = await prisma.company.count();
  console.log(`🏢 Companies: ${added} added, ${total} in total.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
