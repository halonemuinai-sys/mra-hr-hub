-- RBAC: allow deactivating CMS users instead of deleting them.
-- Additive only. HR HUB tables live in the `public` schema.
-- Run once:  npx prisma db execute --file prisma/sql/2026-10-04_user_active.sql
SET search_path TO public;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
