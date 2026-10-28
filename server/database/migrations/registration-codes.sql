-- Temporary verification data only. No account/user/client records are created here.
CREATE TABLE IF NOT EXISTS registration_email_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMPTZ,
  proof_hash TEXT UNIQUE,
  proof_expires_at TIMESTAMPTZ
);
