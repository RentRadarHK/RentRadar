-- ─────────────────────────────────────────────────────────────
-- RentRadar Database Schema
-- Run this in the Supabase SQL editor to create all tables.
-- ─────────────────────────────────────────────────────────────

-- ── Buildings ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS buildings (
  id                       TEXT PRIMARY KEY,
  name                     TEXT NOT NULL,
  address                  TEXT NOT NULL,
  district                 TEXT NOT NULL,
  region                   TEXT NOT NULL,
  market                   TEXT NOT NULL DEFAULT 'Hong Kong',
  building_type            TEXT NOT NULL,
  floors                   INTEGER NOT NULL DEFAULT 0,
  units                    INTEGER NOT NULL DEFAULT 0,
  occupation_permit_date   DATE,
  occupation_permit_number TEXT,
  block_id                 TEXT,
  avg_rating               NUMERIC(3,1) NOT NULL DEFAULT 0,
  total_reviews            INTEGER NOT NULL DEFAULT 0,
  gov_data_last_updated    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at               TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Statutory Orders ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS statutory_orders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  issued_date DATE NOT NULL,
  status      TEXT NOT NULL,
  section     TEXT,
  description TEXT,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Landlords ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS landlords (
  id                      TEXT PRIMARY KEY,
  name                    TEXT NOT NULL,
  company                 TEXT,
  verified                BOOLEAN NOT NULL DEFAULT FALSE,
  verified_date           DATE,
  active_since            TEXT,
  active_markets          TEXT[] DEFAULT '{}',
  total_properties        INTEGER NOT NULL DEFAULT 0,
  avg_rating              NUMERIC(3,1) NOT NULL DEFAULT 0,
  total_reviews           INTEGER NOT NULL DEFAULT 0,
  rating_deposit_return   NUMERIC(3,1) DEFAULT 0,
  rating_responsiveness   NUMERIC(3,1) DEFAULT 0,
  rating_listing_accuracy NUMERIC(3,1) DEFAULT 0,
  rating_maintenance      NUMERIC(3,1) DEFAULT 0,
  rating_renewal_fairness NUMERIC(3,1) DEFAULT 0,
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Building ↔ Landlord Junction ───────────────────────────────

CREATE TABLE IF NOT EXISTS building_landlords (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id TEXT NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  landlord_id TEXT NOT NULL REFERENCES landlords(id) ON DELETE CASCADE,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(building_id, landlord_id)
);

-- ── Reviews ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reviews (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id             TEXT REFERENCES landlords(id) ON DELETE SET NULL,
  building_id             TEXT REFERENCES buildings(id) ON DELETE CASCADE,
  flat_ref                TEXT,
  rating                  INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  headline                TEXT NOT NULL,
  body                    TEXT NOT NULL,
  verified_tenant         BOOLEAN NOT NULL DEFAULT FALSE,
  district                TEXT,
  market                  TEXT DEFAULT 'Hong Kong',
  date_posted             TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  helpful_count           INTEGER NOT NULL DEFAULT 0,
  rating_deposit_return   INTEGER CHECK (rating_deposit_return >= 1 AND rating_deposit_return <= 5),
  rating_responsiveness   INTEGER CHECK (rating_responsiveness >= 1 AND rating_responsiveness <= 5),
  rating_listing_accuracy INTEGER CHECK (rating_listing_accuracy >= 1 AND rating_listing_accuracy <= 5),
  rating_maintenance      INTEGER CHECK (rating_maintenance >= 1 AND rating_maintenance <= 5),
  rating_renewal_fairness INTEGER CHECK (rating_renewal_fairness >= 1 AND rating_renewal_fairness <= 5),
  created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_statutory_orders_building_id   ON statutory_orders(building_id);
CREATE INDEX IF NOT EXISTS idx_building_landlords_building_id ON building_landlords(building_id);
CREATE INDEX IF NOT EXISTS idx_building_landlords_landlord_id ON building_landlords(landlord_id);
CREATE INDEX IF NOT EXISTS idx_reviews_building_id            ON reviews(building_id);
CREATE INDEX IF NOT EXISTS idx_reviews_landlord_id            ON reviews(landlord_id);
CREATE INDEX IF NOT EXISTS idx_reviews_date_posted            ON reviews(date_posted DESC);

-- ── Row Level Security (public read, authenticated write) ──────

ALTER TABLE buildings         ENABLE ROW LEVEL SECURITY;
ALTER TABLE statutory_orders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE landlords         ENABLE ROW LEVEL SECURITY;
ALTER TABLE building_landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews           ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Public read buildings"          ON buildings         FOR SELECT USING (true);
CREATE POLICY "Public read statutory_orders"   ON statutory_orders  FOR SELECT USING (true);
CREATE POLICY "Public read landlords"          ON landlords         FOR SELECT USING (true);
CREATE POLICY "Public read building_landlords" ON building_landlords FOR SELECT USING (true);
CREATE POLICY "Public read reviews"            ON reviews           FOR SELECT USING (true);

-- Allow public review inserts (authenticated insert in production)
CREATE POLICY "Public insert reviews" ON reviews FOR INSERT WITH CHECK (true);
