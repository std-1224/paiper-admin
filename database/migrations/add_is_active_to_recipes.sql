-- Migration: Add is_active column to recipes table
-- This migration adds the is_active boolean field to the recipes table

-- Add is_active column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

-- Update existing recipes to have is_active = false by default
UPDATE recipes 
SET is_active = false 
WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN recipes.is_active IS 'Indicates if the recipe is active and should be shown in normalized recipes data';
