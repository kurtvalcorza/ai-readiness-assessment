-- AI Readiness Assessment - Neon PostgreSQL Schema
-- Run this once in your Neon database console before enabling STORAGE_PROVIDER=neon

CREATE TABLE IF NOT EXISTS assessments (
  id              SERIAL PRIMARY KEY,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  timestamp       TEXT        NOT NULL,
  organization    TEXT        NOT NULL,
  domain          TEXT        NOT NULL,
  readiness_level TEXT        NOT NULL,
  primary_solution   TEXT,
  secondary_solution TEXT,
  next_steps         TEXT,
  conversation_history TEXT
);
