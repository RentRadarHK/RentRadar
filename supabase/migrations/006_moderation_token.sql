-- Migration 006 — Add moderation_token to reviews
-- Run in Supabase SQL editor: Dashboard → SQL Editor → New query

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_token TEXT;
