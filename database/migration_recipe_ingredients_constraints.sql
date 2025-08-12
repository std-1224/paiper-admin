-- Migration: Update recipe_ingredients table constraints
-- This migration updates the recipe_ingredients table to support the new product-ingredient relationship model

-- Step 1: Drop the old unique constraint that prevents our new model
ALTER TABLE recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_ingredient_id_key;

-- Step 2: Make recipe_id nullable (if not already done)
ALTER TABLE recipe_ingredients ALTER COLUMN recipe_id DROP NOT NULL;

-- Step 3: Add product_id column (if not already added)
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id) ON DELETE CASCADE;

-- Step 4: Create new partial unique indexes
-- Prevent duplicates per product for a given ingredient
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_ingredient ON recipe_ingredients(product_id, ingredient_id) WHERE product_id IS NOT NULL;

-- Prevent duplicates for base recipe definitions (product_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_recipe_ingredient_base ON recipe_ingredients(recipe_id, ingredient_id) WHERE product_id IS NULL;

-- Step 5: Add performance index on product_id
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product_id ON recipe_ingredients(product_id);

-- Step 6: Update the trigger for updated_at if it doesn't exist
CREATE TRIGGER IF NOT EXISTS update_recipe_ingredients_updated_at
    BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
