"use client";

import { useState, useEffect } from "react";
import {
  Book,
  CoffeeIcon as Cocktail,
  Eye,
  Leaf,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";
import Loading from "./loading";

import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import AddIngredientModal from "./add-ingredient-modal";
import AddRecipeModal from "./add-recipe-modal";
import RecipeDetailsModal from "./recipe-details-modal";

export default function RecipeConfiguration() {
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const { user } = useAuth();
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [recipesData, setRecipesData] = useState<any[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [showRecipeDetailsModal, setShowRecipeDetailsModal] = useState(false);
  const [selectedRecipeForDetails, setSelectedRecipeForDetails] = useState<number | null>(null);

  // Fetch recipes from the new API endpoint
  const fetchRecipes = async () => {
    setRecipesLoading(true);
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const recipes = await response.json();
        setRecipesData(recipes);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch recipes:', response.status, errorData);
        toast.error(`Failed to load recipes: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Error loading recipes. Please check your connection.');
    } finally {
      setRecipesLoading(false);
    }
  };

  const filteredRecipes = recipesData.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchRecipes();
  }, []);


  // Calculate most used products
  const mostUsedProducts = [
    { name: "Mojito", count: 1 },
    { name: "Margarita", count: 1 },
    { name: "Piña Colada", count: 1 },
  ];

  // Calculate most used ingredients from the new schema
  const ingredientCounts: Record<string, number> = {};
  recipesData.forEach((recipe) => {
    if (recipe.recipe_ingredients && Array.isArray(recipe.recipe_ingredients)) {
      recipe.recipe_ingredients.forEach((recipeIngredient: any) => {
        const ingredientName = recipeIngredient.ingredients?.name || 'Unknown';
        if (ingredientCounts[ingredientName]) {
          ingredientCounts[ingredientName]++;
        } else {
          ingredientCounts[ingredientName] = 1;
        }
      });
    }
  });

  const mostUsedIngredients = Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));





  // Show recipe details modal first
  const handleViewRecipeDetails = (id: number) => {
    setSelectedRecipeForDetails(id);
    setShowRecipeDetailsModal(true);
  };

  // Handle edit from details modal
  const handleEditRecipe = (id: number) => {
    setSelectedRecipe(id);
    setShowAddRecipeModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configuración de Recetas</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
                toast.error("No tienes permiso para agregar ingredientes");
                return;
              }
              setShowAddIngredientModal(true)
            }}
          >
            <Plus size={16} />
            Agregar Ingrediente
          </Button>
          <Button className="gap-2" onClick={() => {
            if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
              toast.error("No tienes permiso para agregar ingredientes");
              return;
            }
            setShowAddRecipeModal(true)
          }}>
            <Cocktail size={16} />
            Añadir nueva receta
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Book className="text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Total de Recetas
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {recipesLoading ? "..." : recipesData.length}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Cocktail className="text-purple-500" />
            </div>
            <div className="text-sm text-muted-foreground">
              Productos Más Usados
            </div>
          </div>
          <div className="space-y-2">
            {mostUsedProducts.map((product) => (
              <div
                key={product.name}
                className="flex justify-between items-center"
              >
                <div>{product.name}</div>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  {product.count} recetas
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Leaf className="text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground">
              Ingredientes Más Utilizados
            </div>
          </div>
          <div className="space-y-2">
            {mostUsedIngredients.map((ingredient) => (
              <div
                key={ingredient.name}
                className="flex justify-between items-center"
              >
                <div>{ingredient.name}</div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {ingredient.count} veces
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search recipes..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Recipe Cards */}
      {recipesLoading ? (
        <Loading />
      ) : recipesData.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Book className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay recetas</h3>
          <p className="text-gray-500 mb-6">
            No se han creado recetas aún. Crea tu primera receta para comenzar.
          </p>
          <Button onClick={() => setShowAddRecipeModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Receta
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{recipe.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {recipe.type || 'Recipe'}
                    </Badge>
                    <Button
                      onClick={() => handleViewRecipeDetails(recipe.id)}
                      variant="ghost"
                      size="icon"
                      title="View recipe details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Recipe Info */}
                <div className="mb-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span>{recipe.quantity} {recipe.unit}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Stock:</span>
                    <Badge
                      className={cn(
                        recipe.stock > 0
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {recipe.stock} available
                    </Badge>
                  </div>
                </div>

                {/* Show recipe ingredients */}
                <div className="text-sm font-medium mb-2">Ingredients:</div>
                <div className="space-y-1">
                  {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                    recipe.recipe_ingredients.map((recipeIngredient: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{recipeIngredient.ingredients?.name || 'Unknown ingredient'}</span>
                        <span className="text-muted-foreground">
                          {recipeIngredient.deduct_quantity} {recipeIngredient.ingredients?.unit || ''}
                          <Badge
                            className={cn(
                              recipe.stock > 0
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            {recipeIngredient.deduct_stock} available
                          </Badge>
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 italic">No ingredients added</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Recipe Modal */}
      <AddRecipeModal
        isOpen={showAddRecipeModal}
        onClose={() => setShowAddRecipeModal(false)}
        selectedRecipe={selectedRecipe}
        onRecipeAdded={() => {
          setShowAddRecipeModal(false);
          setSelectedRecipe(null);
          fetchRecipes();
        }}
        onRecipeUpdated={() => {
          setShowAddRecipeModal(false);
          setSelectedRecipe(null);
          fetchRecipes();
        }}
      />

      {/* Add New Ingredient Modal */}
      <AddIngredientModal
        isOpen={showAddIngredientModal}
        onClose={() => setShowAddIngredientModal(false)}
        onIngredientAdded={() => {
          // Refresh recipes data after ingredient is added
          fetchRecipes();
        }}
      />

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        isOpen={showRecipeDetailsModal}
        onClose={() => {
          setShowRecipeDetailsModal(false);
          setSelectedRecipeForDetails(null);
        }}
        recipeId={selectedRecipeForDetails}
        onEditRecipe={handleEditRecipe}
      />
    </div>
  );
}
