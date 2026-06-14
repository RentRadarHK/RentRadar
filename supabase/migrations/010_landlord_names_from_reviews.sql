-- Migration 010 — Create searchable landlord profiles from review names
-- Run in Supabase SQL Editor to backfill existing reviews (e.g. Lam Ching Yee)

DO $$
DECLARE
  rec RECORD;
  lid TEXT;
  base_slug TEXT;
  suffix INT;
BEGIN
  FOR rec IN
    SELECT id, landlord_name, building_id
    FROM reviews
    WHERE landlord_name IS NOT NULL
      AND trim(landlord_name) <> ''
      AND (landlord_id IS NULL OR landlord_id = '')
  LOOP
    SELECT l.id INTO lid
    FROM landlords l
    WHERE lower(l.name) = lower(trim(rec.landlord_name))
    LIMIT 1;

    IF lid IS NULL THEN
      base_slug := lower(
        regexp_replace(
          regexp_replace(trim(rec.landlord_name), '[^a-zA-Z0-9\s-]', '', 'g'),
          '\s+', '-', 'g'
        )
      );
      base_slug := trim(both '-' from base_slug);
      IF base_slug = '' THEN base_slug := 'landlord'; END IF;

      lid := base_slug;
      suffix := 2;
      WHILE EXISTS (SELECT 1 FROM landlords WHERE id = lid) LOOP
        lid := base_slug || '-' || suffix;
        suffix := suffix + 1;
      END LOOP;

      INSERT INTO landlords (id, name, verified, claim_status, active_markets, total_properties)
      VALUES (lid, trim(rec.landlord_name), false, 'unclaimed', ARRAY['Hong Kong'], 0)
      ON CONFLICT (id) DO NOTHING;
    END IF;

    UPDATE reviews
    SET landlord_id = lid
    WHERE id = rec.id;

    IF rec.building_id IS NOT NULL THEN
      INSERT INTO building_landlords (building_id, landlord_id)
      VALUES (rec.building_id, lid)
      ON CONFLICT (building_id, landlord_id) DO NOTHING;
    END IF;
  END LOOP;
END $$;
