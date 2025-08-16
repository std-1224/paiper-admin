-- Migration: Add sale_price column to recipes and ingredients tables
-- This migration adds the sale_price decimal field to both recipes and ingredients tables

-- Add sale_price column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);

-- Add sale_price column to ingredients table
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10,2);

-- Add comments to the columns
COMMENT ON COLUMN recipes.sale_price IS 'Sale price of the recipe';
COMMENT ON COLUMN ingredients.sale_price IS 'Sale price of the ingredient';
