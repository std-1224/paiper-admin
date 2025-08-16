-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    description TEXT,
    category TEXT,
    stock INT2 DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    purchase_price NUMERIC DEFAULT 150,
    sale_price NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT false,
    is_pr BOOLEAN DEFAULT false,
    is_courtesy BOOLEAN DEFAULT false,
    type TEXT DEFAULT 'product',
    has_recipe BOOLEAN DEFAULT false,
    recipe_id UUID,
    ingredient_id UUID
);

-- Create recipes table
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR,
    type VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    is_active BOOLEAN DEFAULT false
);

-- Create ingredients table
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR,
    unit VARCHAR,
    quantity NUMERIC DEFAULT 0,
    stock NUMERIC DEFAULT 0,
    is_liquid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    product_id UUID,
    is_active BOOLEAN DEFAULT false
);

-- Create recipe_ingredients junction table
CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID,
    ingredient_id UUID,
    deduct_stock NUMERIC DEFAULT 0,
    deduct_quantity NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    product_id UUID
);

-- Add foreign key constraints
ALTER TABLE public.products 
ADD CONSTRAINT products_ingredient_id_fkey 
FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);

ALTER TABLE public.products 
ADD CONSTRAINT products_recipe_id_fkey 
FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);

ALTER TABLE public.ingredients 
ADD CONSTRAINT ingredients_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey 
FOREIGN KEY (ingredient_id) REFERENCES public.ingredients(id);

ALTER TABLE public.recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE public.recipe_ingredients 
ADD CONSTRAINT recipe_ingredients_recipe_id_fkey 
FOREIGN KEY (recipe_id) REFERENCES public.recipes(id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at timestamps
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON public.products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at 
    BEFORE UPDATE ON public.recipes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at 
    BEFORE UPDATE ON public.ingredients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipe_ingredients_updated_at 
    BEFORE UPDATE ON public.recipe_ingredients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (you may need to adjust these based on your authentication needs)
-- These policies allow all operations for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.products
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.recipes
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.ingredients
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all operations for authenticated users" ON public.recipe_ingredients
    FOR ALL USING (auth.role() = 'authenticated');