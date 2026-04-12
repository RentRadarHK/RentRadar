-- Migration 005 — Full reviews schema with verification tokens and rating RPC
-- Run in Supabase SQL editor: Dashboard → SQL Editor → New query

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Drop old reviews table and recreate with full schema
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at            TIMESTAMPTZ NOT NULL    DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL    DEFAULT now(),

  -- What is being reviewed
  building_id           TEXT        REFERENCES buildings(id) ON DELETE SET NULL,
  landlord_id           TEXT        REFERENCES landlords(id) ON DELETE SET NULL,

  -- Tenancy details (Step 2)
  tenancy_from          INTEGER,
  tenancy_to            INTEGER,
  currently_renting     BOOLEAN     NOT NULL DEFAULT false,
  rental_method         TEXT        CHECK (rental_method IN ('direct','agent','corporate')),

  -- Ratings (Step 3)
  rating_overall        INTEGER     CHECK (rating_overall BETWEEN 1 AND 5),
  rating_deposit        INTEGER     CHECK (rating_deposit BETWEEN 1 AND 5),
  rating_accuracy       INTEGER     CHECK (rating_accuracy BETWEEN 1 AND 5),
  rating_maintenance    INTEGER     CHECK (rating_maintenance BETWEEN 1 AND 5),
  rating_responsiveness INTEGER     CHECK (rating_responsiveness BETWEEN 1 AND 5),

  -- Review content (Step 4)
  review_text           TEXT        NOT NULL,
  monthly_rent          INTEGER,
  flat_size_sqft        INTEGER,

  -- Verification
  verification_method   TEXT        CHECK (verification_method IN ('google','email','document')),
  verified_tenant       BOOLEAN     NOT NULL DEFAULT false,
  verification_email    TEXT,
  document_url          TEXT,

  -- Identity (private — never exposed publicly)
  reviewer_user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_email        TEXT,
  reviewer_ip           TEXT,

  -- Moderation
  status                TEXT        NOT NULL DEFAULT 'pending'
                                    CHECK (status IN ('pending','approved','rejected','flagged')),
  moderation_note       TEXT,
  display_name          TEXT
);

-- Indexes
CREATE INDEX idx_reviews_building_id  ON reviews(building_id);
CREATE INDEX idx_reviews_landlord_id  ON reviews(landlord_id);
CREATE INDEX idx_reviews_status       ON reviews(status);
CREATE INDEX idx_reviews_created_at   ON reviews(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "Public read approved reviews"
  ON reviews FOR SELECT
  USING (status = 'approved');

-- Authenticated users can insert
CREATE POLICY "Authenticated users can insert reviews"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Anon users can also insert (email/doc verification paths don't require login)
CREATE POLICY "Anon users can insert reviews"
  ON reviews FOR INSERT
  TO anon
  WITH CHECK (true);

-- Service role can update (moderation)
-- (service role bypasses RLS by default — no explicit policy needed)


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Review verification tokens
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE review_verification_tokens (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id  UUID        NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  token      TEXT        NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  used       BOOLEAN     NOT NULL DEFAULT false
);

CREATE INDEX idx_verification_tokens_token ON review_verification_tokens(token);

ALTER TABLE review_verification_tokens ENABLE ROW LEVEL SECURITY;
-- Only service role accesses this table — no public policies needed.


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Storage bucket (run separately if SQL editor doesn't support storage API)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Create via Dashboard: Storage → New bucket → "review-documents"
-- Private, 5MB limit, allowed types: application/pdf, image/jpeg, image/png
--
-- Then add this RLS policy in the bucket's policies tab:
--
-- Policy name: "Authenticated users upload to own folder"
-- Operation:   INSERT
-- Target role: authenticated
-- USING (true)
-- WITH CHECK (
--   (storage.foldername(name))[1] = auth.uid()::text
-- )


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Rating aggregation RPC
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION update_entity_rating(entity_type TEXT, entity_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_avg   NUMERIC(3,1);
  v_count INTEGER;
BEGIN
  SELECT
    ROUND(AVG(rating_overall)::NUMERIC, 1),
    COUNT(*)
  INTO v_avg, v_count
  FROM reviews
  WHERE status = 'approved'
    AND CASE
      WHEN entity_type = 'building' THEN building_id = entity_id
      WHEN entity_type = 'landlord' THEN landlord_id = entity_id
      ELSE false
    END;

  IF entity_type = 'building' THEN
    UPDATE buildings
    SET avg_rating    = COALESCE(v_avg, 0),
        total_reviews = COALESCE(v_count, 0)
    WHERE id = entity_id;
  ELSIF entity_type = 'landlord' THEN
    UPDATE landlords
    SET avg_rating    = COALESCE(v_avg, 0),
        total_reviews = COALESCE(v_count, 0)
    WHERE id = entity_id;
  END IF;
END;
$$;
