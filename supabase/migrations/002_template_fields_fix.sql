-- Migration: Add template fields to bulletins table
-- This adds all necessary columns for template functionality

-- Add template-related fields to bulletins
ALTER TABLE bulletins 
ADD COLUMN IF NOT EXISTS template_fields JSONB,
ADD COLUMN IF NOT EXISTS template_name TEXT,
ADD COLUMN IF NOT EXISTS template_layout_fingerprint JSONB,
ADD COLUMN IF NOT EXISTS field_values JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS layout_fingerprint TEXT,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS generated_pdf_url TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bulletins_is_template ON bulletins(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_bulletins_fingerprint ON bulletins(layout_fingerprint);

-- Add comments for documentation
COMMENT ON COLUMN bulletins.template_fields IS 'JSON array of field definitions (label, type, x, y, page)';
COMMENT ON COLUMN bulletins.template_name IS 'Optional name for this template';
COMMENT ON COLUMN bulletins.template_layout_fingerprint IS 'JSON object with layout metrics for matching';
COMMENT ON COLUMN bulletins.field_values IS 'Extracted or edited field values as JSON';
COMMENT ON COLUMN bulletins.layout_fingerprint IS 'Hash of PDF structure for template matching';
COMMENT ON COLUMN bulletins.is_template IS 'Whether this bulletin is used as a template';
COMMENT ON COLUMN bulletins.generated_pdf_url IS 'URL of the edited/generated PDF';

-- Verify changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'bulletins' 
AND table_schema = 'public'
AND column_name IN (
  'template_fields', 
  'template_name', 
  'template_layout_fingerprint',
  'field_values',
  'layout_fingerprint',
  'is_template',
  'generated_pdf_url'
)
ORDER BY column_name;
