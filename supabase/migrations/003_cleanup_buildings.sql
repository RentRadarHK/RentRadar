-- Migration 003 — Clean up buildings table
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New query)
--
-- What this does:
--   1. Deletes all bulk-imported blocks (id starts with 'gov-') — these are
--      individual blocks with undeduped, uncleaned names from sync-buildings.ts.
--      The hki-* rows from sync-buildings-hk-island.ts are the canonical set.
--   2. Cleans any remaining long names (>80 chars) by extracting the parent
--      building name — truncates at the first comma, floor reference, or
--      "Tower Block" / "G/F" indicator.
--   3. Merges any rows that share the same (lower(name), lower(district))
--      after cleaning, keeping the earliest created_at and deleting duplicates.
--
-- Safe to re-run — each step is idempotent.

-- ── Step 1: Remove old bulk-import rows ──────────────────────────────────────
-- Cascade deletes associated statutory_orders automatically.

DELETE FROM buildings WHERE id LIKE 'gov-%';

-- ── Step 2: Helper function to extract parent building name ──────────────────

CREATE OR REPLACE FUNCTION _extract_parent_name(full_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT := full_name;
BEGIN
  -- Truncate at first comma
  result := regexp_replace(result, ',.*$', '');

  -- Truncate at G/F or GF: floor indicators
  result := regexp_replace(result, '\s+G/F\b.*$', '', 'i');
  result := regexp_replace(result, '\s+GF\s*[:,.].*$', '', 'i');
  result := regexp_replace(result, '\s+Ground\s+Floor\b.*$', '', 'i');

  -- Truncate at floor ranges like "1F-19F" or "1F:" or "1/F"
  result := regexp_replace(result, '\s+\d+[SF]\s*[-:].*$', '', 'i');
  result := regexp_replace(result, '\s+\d+/F\b.*$', '', 'i');
  result := regexp_replace(result, '\s+\d+F-\d+F\b.*$', '', 'i');

  -- Truncate at "Tower Block X"
  result := regexp_replace(result, '\s+Tower\s+Block\s+[A-Z0-9]+.*$', '', 'i');

  RETURN trim(result);
END;
$$;

-- ── Step 3: Fix long building names ─────────────────────────────────────────

UPDATE buildings
SET
  name    = _extract_parent_name(name),
  address = _extract_parent_name(name) || ', Hong Kong'
WHERE length(name) > 80;

-- Second pass: catch any still-long names (shouldn't happen, but belt-and-braces)
UPDATE buildings
SET
  name    = left(name, 80),
  address = left(name, 80) || ', Hong Kong'
WHERE length(name) > 80;

-- ── Step 4: Merge duplicates created by name cleaning ───────────────────────
-- For each group of rows with the same (lower(name), lower(district)),
-- keep the one with the earliest created_at and delete the rest.

DELETE FROM buildings
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lower(name), lower(district)
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM buildings
  ) ranked
  WHERE rn > 1
);

-- ── Verification queries (run these after to confirm) ────────────────────────

-- Total count:
-- SELECT count(*) FROM buildings;

-- Sample of 20 names to confirm they look clean:
-- SELECT name, district, length(name) AS len
-- FROM buildings
-- ORDER BY length(name) DESC
-- LIMIT 20;

-- Any remaining long names:
-- SELECT id, name, length(name) AS len FROM buildings WHERE length(name) > 80;
