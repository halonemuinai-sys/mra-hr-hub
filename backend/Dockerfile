# HR HUB backend (Express + Prisma) — build from the REPOSITORY ROOT:
#   docker build -f backend/Dockerfile .
# (the root context lets the image include frontend/public/mra_logo.png for the offer-letter PDF letterhead)
FROM node:22-slim

# OpenSSL for Prisma; CA certificates for Supabase / SMTP / Talenta TLS
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app/backend

# Dependencies first (cached layer). postinstall runs `prisma generate`, so the schema must be present.
COPY backend/package.json backend/package-lock.json backend/prisma.config.ts ./
COPY backend/prisma ./prisma
RUN npm ci --no-audit --no-fund

COPY backend/ ./
# Drop dev tools (prisma CLI, nodemon); the generated client in node_modules/.prisma stays
RUN npm prune --omit=dev --no-audit --no-fund

# Letterhead logo used by services/offerLetter/offerPdf.js (../../../frontend/public/mra_logo.png)
COPY frontend/public/mra_logo.png /app/frontend/public/mra_logo.png

# Uploaded CVs and the e-mail outbox live in volumes; run as the unprivileged node user
RUN mkdir -p uploads/resumes mail-outbox && chown -R node:node uploads mail-outbox
USER node

ENV NODE_ENV=production \
    PORT=5006
EXPOSE 5006

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:5006/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "api/index.js"]
