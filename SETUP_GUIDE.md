# Supabase Setup Guide for Ingredients and Recipes

## 1. Database Setup

### Step 1: Run the Schema
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/schema.sql`
4. Execute the SQL to create the tables, indexes, and policies

### Step 2: Environment Variables
Add these environment variables to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 2. API Endpoints

The following endpoints are now available:

### Ingredients API
- `GET /api/ingredients` - Get all ingredients
- `POST /api/ingredients` - Create new ingredient
- `PUT /api/ingredients` - Update ingredient (requires id in body)
- `DELETE /api/ingredients?id=<id>` - Delete ingredient

- `GET /api/ingredients/[id]` - Get single ingredient
- `PUT /api/ingredients/[id]` - Update single ingredient
- `DELETE /api/ingredients/[id]` - Delete single ingredient

### Recipes API
- `GET /api/recipes` - Get all recipes with ingredients
- `POST /api/recipes` - Create new recipe
- `PUT /api/recipes` - Update recipe (requires id in body)
- `DELETE /api/recipes?id=<id>` - Delete recipe

- `GET /api/recipes/[id]` - Get single recipe with ingredient details
- `PUT /api/recipes/[id]` - Update single recipe
- `DELETE /api/recipes/[id]` - Delete single recipe

### Recipe Ingredients API
- `GET /api/recipe-ingredients?recipe_id=<id>` - Get ingredients for a recipe
- `POST /api/recipe-ingredients` - Add ingredient to recipe
- `DELETE /api/recipe-ingredients?id=<id>` - Remove ingredient from recipe

## 3. Usage Examples

### Creating an Ingredient
```javascript
const response = await fetch('/api/ingredients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    product_id: 'PROD001', // Optional - connects to external product system
    name: 'Sugar',
    unit: 'g',
    quantity: 1000,
    stock: 5000,
    is_liquid: false
  })
});
```

### Creating a Recipe
```javascript
const response = await fetch('/api/recipes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Mojito',
    unit: 'ml',
    quantity: 300,
    type: 'drink',
    stock: 10,
    ingredients: [
      {
        ingredient_id: 'uuid-of-mint',
        deduct_quantity: 5,
        deduct_stock: 5
      },
      {
        ingredient_id: 'uuid-of-lime',
        deduct_quantity: 1,
        deduct_stock: 1
      }
    ]
  })
});
```

### Adding Ingredient to Recipe
```javascript
const response = await fetch('/api/recipe-ingredients', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    recipe_id: 'recipe-uuid',
    ingredient_id: 'ingredient-uuid',
    deduct_quantity: 50,
    deduct_stock: 50
  })
});
```

### Updating Ingredient Stock
```javascript
const response = await fetch('/api/ingredients', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    id: 'ingredient-uuid',
    stock: 4500  // New stock amount
  })
});
```

## 4. Database Schema Details

### Ingredients Table
- `id` (UUID, Primary Key)
- `product_id` (VARCHAR, Optional - connects to external product system)
- `name` (VARCHAR, NOT NULL)
- `unit` (VARCHAR, NOT NULL)
- `quantity` (DECIMAL)
- `stock` (DECIMAL)
- `is_liquid` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Recipes Table
- `id` (UUID, Primary Key)
- `name` (VARCHAR, NOT NULL)
- `type` (VARCHAR, CHECK: 'drink', 'meal', 'input')
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Recipe Ingredients Table (Normalized)
- `id` (UUID, Primary Key)
- `recipe_id` (UUID, Foreign Key to recipes.id)
- `ingredient_id` (UUID, Foreign Key to ingredients.id)
- `deduct_stock` (DECIMAL)
- `deduct_quantity` (DECIMAL)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)
- `UNIQUE(recipe_id, ingredient_id)` - Prevents duplicate ingredients per recipe

## 5. Features

### Validation
- Required field validation
- Type validation for recipe types
- Ingredient existence validation
- Stock availability checking
- Duplicate name prevention

### Security
- Row Level Security (RLS) enabled
- Service role key for server-side operations
- Input sanitization and validation

### Performance
- Indexes on commonly queried fields
- Efficient JSONB queries for ingredients
- Optimized queries with proper select statements

## 6. Next Steps

1. Install Supabase client if not already installed:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Update your modal components to use the new API endpoints

3. Test the endpoints using the provided examples

4. Customize the RLS policies based on your authentication requirements

5. Add any additional validation or business logic as needed
