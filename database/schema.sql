-- Supabase Database Schema for Ingredients and Recipes

-- Create ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_liquid BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT false,
    price DECIMAL(10,2),
    original_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    purchase_price DECIMAL(10,2),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE IF NOT EXISTS recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('drink', 'meal', 'input')),
    is_active BOOLEAN NOT NULL DEFAULT false,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipe_ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE, -- nullable for individual ingredients
    product_id UUID REFERENCES products(id) ON DELETE CASCADE, -- nullable for base recipe definitions
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE, -- nullable for recipe links
    deduct_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    deduct_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Unique: prevent duplicates per product for a given ingredient
CREATE UNIQUE INDEX IF NOT EXISTS uniq_product_ingredient ON recipe_ingredients(product_id, ingredient_id) WHERE product_id IS NOT NULL;
-- Unique: prevent duplicates for base recipe definitions (product_id is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_recipe_ingredient_base ON recipe_ingredients(recipe_id, ingredient_id) WHERE product_id IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ingredients_name ON ingredients(name);
CREATE INDEX IF NOT EXISTS idx_ingredients_is_liquid ON ingredients(is_liquid);
CREATE INDEX IF NOT EXISTS idx_ingredients_product_id ON ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_recipes_name ON recipes(name);
CREATE INDEX IF NOT EXISTS idx_recipes_type ON recipes(type);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_product_id ON recipe_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ingredients_updated_at
    BEFORE UPDATE ON ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at
    BEFORE UPDATE ON recipe_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication needs)
CREATE POLICY "Enable read access for all users" ON ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON ingredients FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON recipes FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON recipes FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON recipes FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON recipe_ingredients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON recipe_ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON recipe_ingredients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON recipe_ingredients FOR DELETE USING (true);

-- Simple purchase history table
CREATE TABLE IF NOT EXISTS stock_purchases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ingredient_id UUID REFERENCES ingredients(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    stock DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    supplier VARCHAR(255),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    responsible_user VARCHAR(255),
    resulting_average_cost DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_purchases_ingredient_id ON stock_purchases(ingredient_id);
ALTER TABLE stock_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access" ON stock_purchases FOR ALL USING (true);

-- Insert some sample data (optional)
INSERT INTO ingredients (name, unit, quantity, stock, is_liquid) VALUES
('Sugar', 'g', 1000, 5000, false),
('Salt', 'g', 500, 2000, false),
('Vodka', 'ml', 750, 3000, true),
('Orange Juice', 'ml', 1000, 2500, true),
('Lime', 'pieces', 1, 50, false),
('Mint Leaves', 'g', 10, 200, false);

-- Insert sample recipes
INSERT INTO recipes (name, type) VALUES
('Mojito', 'drink'),
('Screwdriver', 'drink');

-- Note: To insert recipe_ingredients, you'll need the actual UUIDs from the ingredients table
-- Example (replace with actual UUIDs after running the above):
-- INSERT INTO recipe_ingredients (recipe_id, ingredient_id, deduct_quantity, deduct_stock) VALUES
-- ('mojito-recipe-uuid', 'mint-ingredient-uuid', 5, 5),
-- ('mojito-recipe-uuid', 'lime-ingredient-uuid', 1, 1),
-- ('screwdriver-recipe-uuid', 'vodka-ingredient-uuid', 50, 50),
-- ('screwdriver-recipe-uuid', 'orange-juice-ingredient-uuid', 200, 200);


