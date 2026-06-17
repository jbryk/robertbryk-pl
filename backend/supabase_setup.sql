-- ============================================================
-- Kancelaria Adwokacka Robert Bryk — Supabase setup
-- Uruchom w: Supabase → SQL Editor → "New query" → Run
-- ============================================================

-- ─── TABELA: zgłoszenia z formularza kontaktowego ───
CREATE TABLE IF NOT EXISTS submissions_kontakt (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT,
  subject     TEXT,
  message     TEXT,
  status      TEXT DEFAULT 'new' CHECK (status IN ('new','read','replied')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kontakt_created ON submissions_kontakt (created_at DESC);

-- ─── Row Level Security ───
ALTER TABLE submissions_kontakt ENABLE ROW LEVEL SECURITY;

-- Każdy (anon ze strony) może WYSŁAĆ formularz...
DROP POLICY IF EXISTS "Public insert — kontakt" ON submissions_kontakt;
CREATE POLICY "Public insert — kontakt"
  ON submissions_kontakt FOR INSERT
  WITH CHECK (true);

-- ...ale ODCZYTAĆ/edytować zgłoszenia może tylko zalogowany (admin).
DROP POLICY IF EXISTS "Admin only — kontakt" ON submissions_kontakt;
CREATE POLICY "Admin only — kontakt"
  ON submissions_kontakt FOR ALL
  USING (auth.role() = 'authenticated');

-- ─── (Opcjonalnie) konto do podglądu zgłoszeń ───
-- Authentication → Users → "Add user" → e-mail + hasło.
-- Zgłoszenia podejrzysz też wprost w: Table Editor → submissions_kontakt.
