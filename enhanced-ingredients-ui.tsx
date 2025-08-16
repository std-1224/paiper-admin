import React, { useState } from 'react';
import { X, Package, ChefHat, Info, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Ingredient {
  id: string;
  name: string;
  quantityPerUnit: number;
  unit: string;
  deductStock: number;
  deductQuantity: number;
  totalRequired: number;
}

interface Recipe {
  id: string;
  name: string;
  quantity: number;
  ingredients: {
    name: string;
    quantity: number;
    unit: string;
  }[];
}

interface EnhancedIngredientsUIProps {
  ingredients: Ingredient[];
  recipes: Recipe[];
  onRemoveIngredient: (id: string) => void;
  onRemoveRecipe: (id: string) => void;
}

const EnhancedIngredientsUI: React.FC<EnhancedIngredientsUIProps> = ({
  ingredients = [],
  recipes = [],
  onRemoveIngredient,
  onRemoveRecipe
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="ingredients-container space-y-6 p-6 rounded-xl relative">
      {/* Ingredients Section */}
      {ingredients.length > 0 && (
        <Card className="enhanced-card border-0 shadow-lg bg-white/80 backdrop-blur-sm slide-in-up stagger-1">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-emerald-700">
              <div className="p-2 bg-emerald-100 rounded-lg floating-icon">
                <Package className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold gradient-text">Ingredientes Agregados</span>
              <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 animated-badge pulse-glow">
                {ingredients.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div
                key={ingredient.id}
                className={`ingredient-item group relative p-4 rounded-xl border transition-all duration-300 scale-hover glass-morphism ${
                  hoveredItem === ingredient.id
                    ? 'border-emerald-200 bg-emerald-50/50 shadow-md scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-emerald-100 hover:bg-emerald-50/30'
                }`}
                onMouseEnter={() => setHoveredItem(ingredient.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {ingredient.name}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">Cantidad por unidad:</span>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 animated-badge">
                          {ingredient.quantityPerUnit} {ingredient.unit}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">deduct_stock:</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 animated-badge">
                          {ingredient.deductStock} unidades
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 font-medium">deduct_quantity:</span>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 animated-badge">
                          {ingredient.deductQuantity} {ingredient.unit}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-red-600">Total necesario:</span>
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          {ingredient.totalRequired} {ingredient.unit}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveIngredient(ingredient.id)}
                    className="interactive-button opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 ml-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recipes Section */}
      {recipes.length > 0 && (
        <Card className="enhanced-card border-0 shadow-lg bg-white/80 backdrop-blur-sm slide-in-up stagger-2">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-blue-700">
              <div className="p-2 bg-blue-100 rounded-lg floating-icon">
                <ChefHat className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold gradient-text">Recetas Agregadas</span>
              <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 animated-badge pulse-glow">
                {recipes.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recipes.map((recipe, index) => (
              <div
                key={recipe.id}
                className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                  hoveredItem === recipe.id
                    ? 'border-blue-200 bg-blue-50/50 shadow-md scale-[1.02]'
                    : 'border-gray-200 bg-white hover:border-blue-100 hover:bg-blue-50/30'
                }`}
                onMouseEnter={() => setHoveredItem(recipe.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {recipe.name}
                      </h4>
                      <Badge className="bg-indigo-100 text-indigo-700">
                        Cantidad: {recipe.quantity} unidades
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-gray-600 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Ingredientes:
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {recipe.ingredients.map((ingredient, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border"
                          >
                            <span className="text-sm font-medium text-gray-700">
                              {ingredient.name}:
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {ingredient.quantity} {ingredient.unit}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveRecipe(recipe.id)}
                    className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600 ml-4"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary Section */}
      <Card className="enhanced-card border-0 shadow-lg bg-gradient-to-r from-slate-100 to-blue-100/50 backdrop-blur-sm slide-in-up stagger-3 glass-morphism">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-slate-700">
            <div className="p-2 bg-slate-200 rounded-lg floating-icon">
              <Info className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold gradient-text">Resumen de Ingredientes</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-white/60 rounded-lg border border-slate-200">
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Al crear este producto, estos ingredientes y recetas se descontarán automáticamente del stock.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                <Package className="h-5 w-5 text-emerald-600" />
                <div>
                  <span className="text-sm font-medium text-emerald-700">Total de ingredientes:</span>
                  <span className="ml-2 font-bold text-emerald-800">{ingredients.length}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <ChefHat className="h-5 w-5 text-blue-600" />
                <div>
                  <span className="text-sm font-medium text-blue-700">Total de recetas:</span>
                  <span className="ml-2 font-bold text-blue-800">{recipes.length}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700 leading-relaxed">
              <strong>Nota:</strong> Si seleccionas una receta, el stock de los ingredientes se descontará automáticamente cuando se haga un pedido.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Demo Component with Sample Data
const DemoEnhancedIngredientsUI = () => {
  const sampleIngredients: Ingredient[] = [
    {
      id: '1',
      name: 'Coca-Cola',
      quantityPerUnit: 100,
      unit: 'mL',
      deductStock: 0,
      deductQuantity: 100,
      totalRequired: 100
    }
  ];

  const sampleRecipes: Recipe[] = [
    {
      id: '1',
      name: 'Cocktails',
      quantity: 2,
      ingredients: [
        { name: 'Coca-Cola', quantity: 300, unit: 'mL' },
        { name: 'Fernet', quantity: 80, unit: 'mL' },
        { name: 'ICE', quantity: 10, unit: 'g' }
      ]
    }
  ];

  const handleRemoveIngredient = (id: string) => {
    console.log('Remove ingredient:', id);
  };

  const handleRemoveRecipe = (id: string) => {
    console.log('Remove recipe:', id);
  };

  return (
    <EnhancedIngredientsUI
      ingredients={sampleIngredients}
      recipes={sampleRecipes}
      onRemoveIngredient={handleRemoveIngredient}
      onRemoveRecipe={handleRemoveRecipe}
    />
  );
};

export default EnhancedIngredientsUI;
export { DemoEnhancedIngredientsUI };
