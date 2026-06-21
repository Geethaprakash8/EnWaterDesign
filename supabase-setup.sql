-- =============================================
-- EnWater Design - Supabase Database Setup (FULL)
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================

-- =============================================
-- 1. Contact Enquiries Table
-- =============================================
CREATE TABLE IF NOT EXISTS contact_enquiries (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT,
  email        TEXT NOT NULL,
  company      TEXT,
  region       TEXT,
  type         TEXT,
  message      TEXT,
  source_page  TEXT DEFAULT 'get-in-touch.html',
  status       TEXT DEFAULT 'new',   -- new | reviewed | archived
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) to INSERT enquiries from the website form
CREATE POLICY "Allow public insert" ON contact_enquiries
  FOR INSERT TO anon WITH CHECK (true);

-- Allow BOTH anon and authenticated to SELECT
-- (dashboard uses anon key so we need anon SELECT)
CREATE POLICY "Allow anon read" ON contact_enquiries
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow auth read" ON contact_enquiries
  FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to UPDATE status
CREATE POLICY "Allow auth update" ON contact_enquiries
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Allow authenticated users to DELETE
CREATE POLICY "Allow auth delete" ON contact_enquiries
  FOR DELETE TO authenticated USING (true);

-- Allow anon to UPDATE status (for dashboard bypass mode)
CREATE POLICY "Allow anon update" ON contact_enquiries
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Allow anon to DELETE (for dashboard bypass mode)
CREATE POLICY "Allow anon delete" ON contact_enquiries
  FOR DELETE TO anon USING (true);

-- =============================================
-- 2. Page Visits Table (analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS page_visits (
  id          BIGSERIAL PRIMARY KEY,
  page        TEXT,
  referrer    TEXT,
  visited_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert visits" ON page_visits
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read visits" ON page_visits
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow auth read visits" ON page_visits
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 3. Newsletter Subscribers Table (optional)
-- =============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  active      BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public sub insert" ON newsletter_subscribers
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon read subs" ON newsletter_subscribers
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow auth read subs" ON newsletter_subscribers
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 4. Project Listings Table (for CRUD panel)
-- =============================================
CREATE TABLE IF NOT EXISTS listings (
  id                  BIGSERIAL PRIMARY KEY,
  title               TEXT NOT NULL,
  slug                TEXT UNIQUE NOT NULL,
  sector              TEXT,
  description         TEXT,
  location            TEXT,
  flow_rate           TEXT,
  performance_target  TEXT,
  key_technologies    TEXT[],
  images              TEXT[],
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read listings" ON listings
  FOR SELECT TO anon USING (true);

CREATE POLICY "Allow auth manage listings" ON listings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow anon insert listings" ON listings
  FOR INSERT TO anon WITH CHECK (true);

-- =============================================
-- 5. Secure Admin Credentials & Hashing
-- =============================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS admin_credentials (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and prevent read/writes from anonymous users directly
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Disallow public access" ON admin_credentials
  FOR ALL TO public USING (false);

-- Insert the default administrator credentials securely hashed (Password: 12345678)
INSERT INTO admin_credentials (email, password_hash)
VALUES ('enwaterdesign@gmail.com', crypt('12345678', gen_salt('bf')))
ON CONFLICT (email) DO NOTHING;

-- Secure PostgreSQL RPC Function for admin verification
-- Hashing verification happens entirely on the server-side; plain passwords never stored
CREATE OR REPLACE FUNCTION verify_admin_login(p_email TEXT, p_password TEXT)
RETURNS BOOLEAN SECURITY DEFINER AS $$
DECLARE
  v_hash TEXT;
BEGIN
  SELECT password_hash INTO v_hash FROM admin_credentials WHERE email = p_email;
  IF v_hash IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN v_hash = crypt(p_password, v_hash);
END;
$$ LANGUAGE plpgsql;

-- Grant execution permission to the anonymous (website visitor) and authenticated roles
GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT, TEXT) TO anon, authenticated;
