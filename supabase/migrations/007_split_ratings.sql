-- Migration 007 — Split ratings into building and landlord categories
-- Run in Supabase SQL editor: Dashboard → SQL Editor → New query

-- Building ratings
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_maintenance          integer CHECK (rating_maintenance          BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_cleanliness          integer CHECK (rating_cleanliness          BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_pest_control         integer CHECK (rating_pest_control         BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_noise                integer CHECK (rating_noise                BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_facilities           integer CHECK (rating_facilities           BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_building_mgmt        integer CHECK (rating_building_mgmt        BETWEEN 1 AND 5);

-- Landlord ratings
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_deposit_return              integer CHECK (rating_deposit_return              BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_listing_accuracy            integer CHECK (rating_listing_accuracy            BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_landlord_responsiveness     integer CHECK (rating_landlord_responsiveness     BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_flat_repairs                integer CHECK (rating_flat_repairs                BETWEEN 1 AND 5);
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS rating_would_rent_again            integer CHECK (rating_would_rent_again            BETWEEN 1 AND 5);
