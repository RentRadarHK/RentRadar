-- Migration 011 — Geocoding columns for building maps
-- Run in Supabase SQL editor before scripts/geocode-buildings.ts writes results.

ALTER TABLE buildings
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision,
  ADD COLUMN IF NOT EXISTS geocode_status text,
  ADD COLUMN IF NOT EXISTS geocoded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_buildings_geocode_status
  ON buildings (geocode_status);

CREATE INDEX IF NOT EXISTS idx_buildings_latitude
  ON buildings (latitude);
