-- Migration 009 — Landlord claim flow, dashboard, and review responses
-- Run in Supabase SQL Editor before deploying

ALTER TABLE landlords ADD COLUMN IF NOT EXISTS claimed boolean DEFAULT false;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS claimed_at timestamptz;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS claim_user_id uuid REFERENCES auth.users(id);
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS claim_status text DEFAULT 'unclaimed'
  CHECK (claim_status IN ('unclaimed','pending','approved','rejected'));
ALTER TABLE landlords ADD COLUMN IF NOT EXISTS claim_moderation_token text;

CREATE TABLE IF NOT EXISTS landlord_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  landlord_id text REFERENCES landlords(id),
  user_id uuid REFERENCES auth.users(id),
  full_name text NOT NULL,
  company_name text,
  contact_email text NOT NULL,
  contact_phone text,
  document_url text,
  document_type text,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  moderation_token text DEFAULT gen_random_uuid()::text,
  admin_note text
);

CREATE TABLE IF NOT EXISTS review_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  review_id uuid REFERENCES reviews(id) ON DELETE CASCADE,
  landlord_id text REFERENCES landlords(id),
  response_text text NOT NULL,
  status text DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  moderation_token text DEFAULT gen_random_uuid()::text
);

-- Storage bucket for claim documents (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('landlord-documents', 'landlord-documents', false)
ON CONFLICT (id) DO NOTHING;
