-- AI Readiness Assessment - Neon PostgreSQL Schema
-- Run this once in your Neon database console before enabling STORAGE_PROVIDER=neon

CREATE TABLE IF NOT EXISTS assessments (
  id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- server insert time
  timestamp       TIMESTAMPTZ NOT NULL,               -- client report-generation time (ISO 8601, enforced by zod)
  -- Length limits mirror MAX_ORGANIZATION_LENGTH / MAX_DOMAIN_LENGTH in lib/constants/validation.ts
  organization    TEXT        NOT NULL CHECK (char_length(organization) <= 500),
  domain          TEXT        NOT NULL CHECK (char_length(domain) <= 500),
  readiness_level TEXT        NOT NULL,
  primary_solution   TEXT,
  secondary_solution TEXT,
  next_steps         TEXT,
  conversation_history TEXT
);

-- Migrating a table created with the earlier schema (TEXT timestamp column):
--   ALTER TABLE assessments ALTER COLUMN "timestamp" TYPE TIMESTAMPTZ USING "timestamp"::timestamptz;
