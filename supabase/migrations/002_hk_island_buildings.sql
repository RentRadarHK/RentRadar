-- Migration 002 — Add HK Island import columns to buildings table
-- Run in Supabase SQL editor before executing sync-buildings-hk-island.ts

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS raw_name        TEXT,
  ADD COLUMN IF NOT EXISTS block_count     INTEGER  NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS block_ids       TEXT,
  ADD COLUMN IF NOT EXISTS data_source     TEXT,
  ADD COLUMN IF NOT EXISTS is_verified     BOOLEAN  NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS region          TEXT;
