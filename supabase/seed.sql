-- ─────────────────────────────────────────────────────────────
-- RentRadar Seed Data
-- Run AFTER schema.sql. Safe to re-run (ON CONFLICT DO NOTHING).
-- ─────────────────────────────────────────────────────────────

-- ── Buildings ──────────────────────────────────────────────────

INSERT INTO buildings (id, name, address, district, region, market, building_type, floors, units, occupation_permit_date, occupation_permit_number, block_id, avg_rating, total_reviews, gov_data_last_updated)
VALUES
  ('harbour-view-tower',  'Harbour View Tower', '18 Hoi Fai Road, Tai Kok Tsui, Kowloon',        'Tai Kok Tsui',  'Kowloon',         'Hong Kong', 'Residential', 38, 320, '1998-06-15', 'OP/KL/1998/4421', 'KL-TKT-0442', 3.2, 47, '2024-11-01'),
  ('metro-residences',    'Metro Residences',   '22 Cherry Street, Tai Kok Tsui, Kowloon',        'Tai Kok Tsui',  'Kowloon',         'Hong Kong', 'Residential', 28, 180, '2004-03-20', 'OP/KL/2004/1876', 'KL-TKT-1876', 4.1, 31, '2024-11-01'),
  ('sheung-wan-plaza',    'Sheung Wan Plaza',   '3 Wing Lok Street, Sheung Wan, HK Island',       'Sheung Wan',    'HK Island',       'Hong Kong', 'Composite',   22,  96, '1987-11-30', 'OP/HK/1987/0892', 'HK-SW-0892',  2.8, 23, '2024-11-01'),
  ('tst-court',           'TST Court',          '15 Carnarvon Road, Tsim Sha Tsui, Kowloon',      'Tsim Sha Tsui', 'Kowloon',         'Hong Kong', 'Residential', 32, 240, '2001-09-08', 'OP/KL/2001/3341', 'KL-TST-3341', 4.4, 58, '2024-11-01')
ON CONFLICT (id) DO NOTHING;

-- ── Statutory Orders ───────────────────────────────────────────

INSERT INTO statutory_orders (building_id, type, issued_date, status, section, description)
VALUES
  ('harbour-view-tower', 'Unauthorised Building Works', '2023-08-12', 'Outstanding', 'Section 24', 'Removal of unauthorised rooftop structures'),
  ('harbour-view-tower', 'Repair Order',                '2024-01-05', 'In Progress', 'Section 26', 'External wall repair required'),
  ('sheung-wan-plaza',   'Dangerous Building',          '2023-11-20', 'Outstanding', 'Section 26', 'Structural inspection required — building exceeds 50 years')
ON CONFLICT DO NOTHING;

-- ── Landlords ──────────────────────────────────────────────────

INSERT INTO landlords (id, name, company, verified, verified_date, active_since, active_markets, total_properties, avg_rating, total_reviews, rating_deposit_return, rating_responsiveness, rating_listing_accuracy, rating_maintenance, rating_renewal_fairness)
VALUES
  (
    'pacific-realty-holdings',
    'Pacific Realty Holdings Ltd',
    'Pacific Realty Holdings Ltd',
    FALSE,
    NULL,
    '2019',
    ARRAY['Hong Kong'],
    3, 3.8, 47, 2.9, 4.1, 3.6, 3.2, 4.4
  ),
  (
    'sunrise-property-group',
    'Sunrise Property Group Ltd',
    'Sunrise Property Group Ltd',
    TRUE,
    '2024-06-01',
    '2015',
    ARRAY['Hong Kong'],
    2, 4.3, 89, 4.2, 4.5, 4.1, 4.0, 4.6
  )
ON CONFLICT (id) DO NOTHING;

-- ── Building ↔ Landlord Links ──────────────────────────────────

INSERT INTO building_landlords (building_id, landlord_id)
VALUES
  ('harbour-view-tower', 'pacific-realty-holdings'),
  ('sheung-wan-plaza',   'pacific-realty-holdings'),
  ('metro-residences',   'sunrise-property-group'),
  ('tst-court',          'sunrise-property-group')
ON CONFLICT (building_id, landlord_id) DO NOTHING;

-- ── Reviews ────────────────────────────────────────────────────

INSERT INTO reviews (landlord_id, building_id, flat_ref, rating, headline, body, verified_tenant, district, market, date_posted, helpful_count, rating_deposit_return, rating_responsiveness, rating_listing_accuracy, rating_maintenance, rating_renewal_fairness)
VALUES
  -- Harbour View Tower
  (
    'pacific-realty-holdings', 'harbour-view-tower', 'Flat 12B', 2,
    'Deposit nightmare',
    'Moved out in perfect condition, had photos of everything. Still had HKD 8,000 deducted with no explanation. Took 3 months and multiple follow-ups to get any response. Would not rent again.',
    TRUE, 'Tai Kok Tsui', 'Hong Kong', '2024-10-12 10:00:00+00', 18, 1, 2, 3, 2, 3
  ),
  (
    'pacific-realty-holdings', 'harbour-view-tower', 'Flat 7A', 3,
    'Average — communication good, maintenance slow',
    'Easy to reach by WhatsApp, which is a plus. But getting repairs actually done took weeks. Deposit returned but with a small deduction we didn''t agree with.',
    TRUE, 'Tai Kok Tsui', 'Hong Kong', '2024-07-22 14:30:00+00', 9, 3, 4, 3, 2, 3
  ),
  -- Metro Residences
  (
    'sunrise-property-group', 'metro-residences', 'Unit 8A', 5,
    'Great experience overall',
    'Responsive landlord, fixed our AC within 2 days of reporting. Deposit returned in full within 2 weeks of moving out. Would happily rent from them again.',
    TRUE, 'Tai Kok Tsui', 'Hong Kong', '2024-09-01 09:15:00+00', 24, 5, 5, 4, 5, 5
  ),
  (
    'sunrise-property-group', 'metro-residences', 'Unit 12C', 4,
    'Generally positive, minor admin delays',
    'Very professional team. A couple of maintenance things took longer than expected but always resolved eventually. Renewal was offered at fair market rate.',
    TRUE, 'Tai Kok Tsui', 'Hong Kong', '2024-06-14 11:00:00+00', 11, 4, 4, 4, 3, 5
  ),
  -- Sheung Wan Plaza
  (
    'pacific-realty-holdings', 'sheung-wan-plaza', 'Flat 5B', 1,
    'Entered flat without notice',
    'Landlord entered the property multiple times without giving proper notice. Very uncomfortable experience. Raised it and was dismissed. Would strongly warn others.',
    TRUE, 'Sheung Wan', 'Hong Kong', '2024-08-03 16:45:00+00', 31, 2, 1, 2, 2, 1
  ),
  (
    'pacific-realty-holdings', 'sheung-wan-plaza', 'Flat 3A', 2,
    'Old building, management unresponsive',
    'Building is visibly ageing and management is slow to act on issues. We reported water seepage twice before anyone came. Deposit returned but took over 6 weeks.',
    TRUE, 'Sheung Wan', 'Hong Kong', '2024-05-19 08:30:00+00', 14, 2, 2, 3, 1, 3
  ),
  -- TST Court
  (
    'sunrise-property-group', 'tst-court', 'Unit 18D', 5,
    'Best rental experience in HK',
    'Prompt, professional and fair. They responded to every issue within hours. Deposit returned with an itemised statement the day after we moved out. Highly recommend.',
    TRUE, 'Tsim Sha Tsui', 'Hong Kong', '2024-10-28 12:00:00+00', 45, 5, 5, 5, 5, 5
  ),
  (
    'sunrise-property-group', 'tst-court', 'Unit 9A', 4,
    'Very fair landlord',
    'Communication is excellent. Maintenance team was responsive. Only minor issue was some paperwork delays on renewal but they were transparent throughout.',
    TRUE, 'Tsim Sha Tsui', 'Hong Kong', '2024-09-15 15:20:00+00', 17, 4, 5, 4, 4, 4
  )
ON CONFLICT DO NOTHING;
