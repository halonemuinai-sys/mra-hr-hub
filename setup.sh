#!/bin/bash
# ==============================================================================
# SCRIPT SETUP OTOMATIS: HR HUB (ATS AUTOMATION & TALENT COCKPIT)
# Port: Frontend 3006, Backend 5006
# ==============================================================================
set -e

echo "=== 1. INSTALL DEPENDENSI BACKEND & PRISMA ==="
cd backend
npm install
npx prisma generate
npx prisma db push
node scripts/seed.js || true
cd ..

echo "=== 2. INSTALL DEPENDENSI FRONTEND & BUILD ==="
cd frontend
npm install
npm run build
cd ..

echo "=== 3. START VIA PM2 ==="
pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
pm2 save

echo "🎉 HR HUB System successfully deployed!"
echo "Public Portal: http://localhost:3006"
echo "HR Recruiter Cockpit: http://localhost:3006/admin"
echo "Backend API: http://localhost:5006/api/health"
