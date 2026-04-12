-- Migration 004 — Full re-clean of buildings table
-- Run in Supabase SQL editor: Dashboard → SQL Editor → New query
--
-- Prerequisite: 003_cleanup_buildings.sql must have been run first
--   (removes gov-* bulk rows; leaves only hki-* and seed rows).
--
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 1 — Delete non-residential and garbled records
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELETE FROM buildings
WHERE
  -- ── Industrial / commercial ──────────────────────────────────────────────
  upper(name) LIKE '%INDUSTRIAL%'
  OR upper(name) LIKE '%WAREHOUSE%'
  OR upper(name) LIKE '%FACTORY%'

  -- ── Medical / social organisations ──────────────────────────────────────
  OR upper(name) LIKE '%TUBERCULOSIS%'
  OR upper(name) LIKE '%FEDERATION OF YOUTH%'
  OR (upper(name) LIKE '%BOYS%' AND upper(name) LIKE '%GIRLS%')
  OR upper(name) LIKE '%ASSOCIATION%'

  -- ── Commercial venues / non-residential ─────────────────────────────────
  OR upper(name) LIKE '%CAR PARK%'
  OR upper(name) LIKE '%CARPARK%'
  OR upper(name) LIKE '%SHOPPING CENTRE%'
  OR upper(name) LIKE '%THEATRE%'

  -- ── Government land parcel codes (whole-word match) ──────────────────────
  -- Catches "GLP", "GLP-101", "GLP 23" but not "GULP" or "GLPS"
  OR name ~* '(^|\s)GLP(\s|[0-9,.-]|$)'

  -- ── District lot codes: "DD 256", "DD 12", etc. ─────────────────────────
  OR name ~* '(^|\s)DD\s+[0-9]'

  -- ── Garbled HTML entities (more than one &amp; in the name) ─────────────
  -- Count occurrences: (total_length_diff / token_length) >= 2
  OR (
    (length(name) - length(replace(upper(name), '&AMP;', '')))
    / length('&AMP;')
  ) >= 2

  -- ── Floor references at the very start of the name ───────────────────────
  -- e.g. "3/F-Entrance Lobby", "1/F Shop", "2F: Unit A"
  OR name ~* '^\d+/F'
  OR name ~* '^\d+F[-\s:]';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 2 — Re-extract parent name for long records (> 60 chars)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Priority cascade (stops as soon as name is <= 60 chars):
--   1. Before " - " (spaced dash)
--   2. Before first comma
--   3. Before " Block " / " Blk "
--   4. Before " Phase "
--   5. Before " Tower " (only when it is NOT the first word)
--   6. Before first floor reference (\d+/F or \d+F-/\d+F:)
--   7. Truncate at last word boundary before char 60

CREATE OR REPLACE FUNCTION _extract_building_name(n TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  result TEXT;
  pos    INT;
  r60    TEXT;
  ls     INT;
BEGIN
  result := trim(n);

  -- ── 1. Before " - " ────────────────────────────────────────────────────
  pos := position(' - ' IN result);
  IF pos > 0 THEN
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 2. Before first comma ───────────────────────────────────────────────
  pos := position(',' IN result);
  IF pos > 0 THEN
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 3. Before " Block " / " Blk " ──────────────────────────────────────
  pos := position(' BLOCK ' IN upper(result));
  IF pos > 1 THEN
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  pos := position(' BLK ' IN upper(result));
  IF pos > 1 THEN
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 4. Before " Phase " ────────────────────────────────────────────────
  pos := position(' PHASE ' IN upper(result));
  IF pos > 1 THEN
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 5. Before " Tower " (only if Tower is not the first word) ──────────
  pos := position(' TOWER ' IN upper(result));
  IF pos > 1 THEN   -- pos > 1 guarantees it is not at position 1
    result := trim(left(result, pos - 1));
  END IF;
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 6. Before floor references ─────────────────────────────────────────
  -- "\d+/F", "\d+F-", "\d+F:" — using regexp_replace to strip tail
  result := trim(regexp_replace(result, '\s+\d+/F\b.*$', '',  'i'));
  IF length(result) <= 60 THEN RETURN result; END IF;
  result := trim(regexp_replace(result, '\s+\d+[SF]\s*[-:].*$', '', 'i'));
  IF length(result) <= 60 THEN RETURN result; END IF;

  -- ── 7. Hard truncate at last word boundary before char 60 ──────────────
  r60 := left(result, 60);
  -- Find the distance from the end of the 60-char window to the last space
  ls := position(' ' IN reverse(r60));
  IF ls > 0 THEN
    result := trim(left(r60, 60 - ls));
  ELSE
    result := r60;  -- no space found — hard truncate (very rare)
  END IF;

  RETURN trim(result);
END;
$$;

-- Apply the function only to records whose name exceeds 60 chars.
-- Both `name` and `address` are rewritten; SQL evaluates the RHS using
-- the ORIGINAL column values, so calling the function twice is safe.
UPDATE buildings
SET
  name    = _extract_building_name(name),
  address = _extract_building_name(name) || ', Hong Kong'
WHERE length(name) > 60;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3 — Delete junk records that remain after name cleaning
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DELETE FROM buildings
WHERE
  -- Too short to be a real building name
  length(trim(name)) < 4

  -- Purely numeric (e.g. "123", left over from a lot number)
  OR name ~ '^\s*\d+\s*$'

  -- Surviving HTML entities
  OR upper(name) LIKE '%&AMP;%';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4 — Merge duplicates created by the name-cleaning pass
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- For each (lower(name), lower(district)) group with more than one row,
-- keep the row with the earliest created_at (ties broken by id ASC)
-- and delete all others.

DELETE FROM buildings
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY lower(trim(name)), lower(district)
        ORDER BY created_at ASC, id ASC
      ) AS rn
    FROM buildings
  ) ranked
  WHERE rn > 1
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5 — Verification (run these individually and paste results back)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 5a. Total row count
SELECT count(*) AS total_buildings FROM buildings;

-- 5b. Top 20 longest names (confirm floor descriptions are gone)
SELECT
  name,
  district,
  length(name) AS len
FROM buildings
ORDER BY length(name) DESC
LIMIT 20;

-- 5c. 20 random names from the M–P band (spot-check middle of alphabet)
SELECT
  name,
  district,
  building_type
FROM buildings
WHERE upper(name) >= 'M' AND upper(name) < 'Q'
ORDER BY name
LIMIT 20;
