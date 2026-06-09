-- Migration 008 — Apartment/flat ratings and guided review fields

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_flat_condition  integer CHECK (rating_flat_condition  BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_flat_cleanliness integer CHECK (rating_flat_cleanliness BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_flat_layout     integer CHECK (rating_flat_layout     BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_flat_light       integer CHECK (rating_flat_light       BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flat_day_to_day         TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flat_issues             TEXT;
