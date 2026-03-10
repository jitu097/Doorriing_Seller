-- =============================================================================
-- Doorriing Seller — Terms & Conditions Consent Migration
-- Created: 2026-03-11
--
-- Adds three columns to the shops table to record seller consent:
--   terms_accepted     BOOLEAN        - Did the seller accept T&C at registration?
--   terms_accepted_at  TIMESTAMPTZ    - When did they accept?
--   terms_version      TEXT           - Which version of the T&C did they accept?
--
-- All columns have DEFAULT values — SAFE for existing rows:
--   • terms_accepted    defaults to FALSE (existing sellers marked as not accepted)
--   • terms_accepted_at defaults to NULL
--   • terms_version     defaults to 'v1'
--
-- Run in: Supabase Dashboard → SQL Editor → Paste and Run
-- =============================================================================

ALTER TABLE shops
    ADD COLUMN IF NOT EXISTS terms_accepted     BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS terms_version      TEXT        DEFAULT 'v1';

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'shops'
  AND column_name IN ('terms_accepted', 'terms_accepted_at', 'terms_version')
ORDER BY column_name;
