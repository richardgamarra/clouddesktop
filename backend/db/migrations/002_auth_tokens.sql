-- Add email verification and password reset token columns to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_verify_token   TEXT,
  ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reset_token          TEXT,
  ADD COLUMN IF NOT EXISTS reset_expires        TIMESTAMPTZ;
