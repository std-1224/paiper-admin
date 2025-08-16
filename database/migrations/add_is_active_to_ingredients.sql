-- Migration: Add is_active column to ingredients table
-- This migration adds the is_active boolean field to the ingredients table

-- Add is_active column to ingredients table
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Update existing ingredients to have is_active = false by default
UPDATE ingredients 
SET is_active = false 
WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN ingredients.is_active IS 'Indicates if the ingredient is active and should be shown in normalized data';
