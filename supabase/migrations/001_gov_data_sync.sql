-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 001 — Government Data Sync Log
-- Run in Supabase SQL Editor after schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gov_data_sync_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type         TEXT NOT NULL,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_inserted  INTEGER NOT NULL DEFAULT 0,
  records_updated   INTEGER NOT NULL DEFAULT 0,
  started_at        TIMESTAMP WITH TIME ZONE,
  completed_at      TIMESTAMP WITH TIME ZONE,
  status            TEXT NOT NULL DEFAULT 'success',
  error_message     TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying recent syncs
CREATE INDEX IF NOT EXISTS idx_gov_sync_log_started_at
  ON gov_data_sync_log (started_at DESC);

-- RLS: service role writes, public can read sync history
ALTER TABLE gov_data_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sync log"
  ON gov_data_sync_log FOR SELECT USING (true);
