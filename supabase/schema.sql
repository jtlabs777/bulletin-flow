-- BulletinFlow Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Churches table
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Templates table (created before bulletins to avoid circular dependency)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  layout_fingerprint TEXT NOT NULL,
  field_definitions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulletins table (references templates above)
CREATE TABLE IF NOT EXISTS bulletins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  original_pdf_url TEXT NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  week_of DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bulletin versions table
CREATE TABLE IF NOT EXISTS bulletin_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bulletin_id UUID REFERENCES bulletins(id) ON DELETE CASCADE NOT NULL,
  field_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  edited_pdf_url TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_versions ENABLE ROW LEVEL SECURITY;

-- Churches policies
CREATE POLICY "Users can view their own churches"
  ON churches FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own churches"
  ON churches FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own churches"
  ON churches FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own churches"
  ON churches FOR DELETE
  USING (auth.uid() = owner_id);

-- Bulletins policies
CREATE POLICY "Users can view bulletins in their churches"
  ON bulletins FOR SELECT
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert bulletins in their churches"
  ON bulletins FOR INSERT
  WITH CHECK (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update bulletins in their churches"
  ON bulletins FOR UPDATE
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete bulletins in their churches"
  ON bulletins FOR DELETE
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

-- Templates policies
CREATE POLICY "Users can view templates in their churches"
  ON templates FOR SELECT
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can insert templates in their churches"
  ON templates FOR INSERT
  WITH CHECK (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can update templates in their churches"
  ON templates FOR UPDATE
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

CREATE POLICY "Users can delete templates in their churches"
  ON templates FOR DELETE
  USING (church_id IN (SELECT id FROM churches WHERE owner_id = auth.uid()));

-- Bulletin versions policies
CREATE POLICY "Users can view bulletin versions in their churches"
  ON bulletin_versions FOR SELECT
  USING (bulletin_id IN (
    SELECT id FROM bulletins WHERE church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can insert bulletin versions in their churches"
  ON bulletin_versions FOR INSERT
  WITH CHECK (bulletin_id IN (
    SELECT id FROM bulletins WHERE church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can update bulletin versions in their churches"
  ON bulletin_versions FOR UPDATE
  USING (bulletin_id IN (
    SELECT id FROM bulletins WHERE church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  ));

CREATE POLICY "Users can delete bulletin versions in their churches"
  ON bulletin_versions FOR DELETE
  USING (bulletin_id IN (
    SELECT id FROM bulletins WHERE church_id IN (
      SELECT id FROM churches WHERE owner_id = auth.uid()
    )
  ));

-- Storage Buckets
-- Run these commands separately in the Supabase dashboard or via the API

-- INSERT INTO storage.buckets (id, name, public) VALUES ('bulletin-pdfs', 'bulletin-pdfs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bulletin-outputs', 'bulletin-outputs', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('bulletin-temp', 'bulletin-temp', false);

-- Storage policies for bulletin-pdfs
-- CREATE POLICY "Users can upload PDFs to their church folders"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'bulletin-pdfs' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can view their church PDFs"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'bulletin-pdfs' AND auth.uid() IS NOT NULL);

-- CREATE POLICY "Users can delete their church PDFs"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'bulletin-pdfs' AND auth.uid() IS NOT NULL);
