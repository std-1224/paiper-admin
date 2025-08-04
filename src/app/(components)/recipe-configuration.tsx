"use client";

import { useState, useEffect } from "react";
import {
  Book,
  CoffeeIcon as Cocktail,
  Edit,
  Leaf,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import Loading from "./loading";
import { Recipe } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { categoryList } from "@/lib/utils";
import { toast } from "sonner";

export default function RecipeConfiguration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [newIngredients, setNewIngredients] = useState<
    { name: string; quantity: string; unit: string; availableStock: number; productId?: string; isLiquid?: boolean }[]
  >([]);
  const [recipeName, setRecipeName] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("none");
  const [customIngredient, setCustomIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("ml");
  const [availableStock, setAvailableStock] = useState("1");
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const { fetchRecipes, recipesData, recipesLoading, productsData, fetchProducts } = useAppContext();
  const [category, setCategory] = useState("bebida");
  const [loading, setLoading] = useState(false);

  // New ingredient modal state
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] = useState("");
  const [newIngredientConversionFactor, setNewIngredientConversionFactor] = useState("");
  const [newIngredientDefaultStock, setNewIngredientDefaultStock] = useState("");
  const [newIngredientMinimumAlert, setNewIngredientMinimumAlert] = useState("");
  const [newIngredientActive, setNewIngredientActive] = useState(true);
  const [addingIngredient, setAddingIngredient] = useState(false);

  const filteredRecipes = recipesData.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to check if selected ingredient is liquid
  const isSelectedIngredientLiquid = () => {
    if (selectedIngredient === "none" || !selectedIngredient) return false;

    const matchingProduct = productsData.find(product =>
      product.name.toLowerCase().includes(selectedIngredient.toLowerCase()) ||
      selectedIngredient.toLowerCase().includes(product.name.toLowerCase())
    );

    return matchingProduct &&
      (matchingProduct.type === 'ingredient' || matchingProduct.category === 'ingrediente') &&
      matchingProduct.is_liquid === true;
  };

  // Helper function to check if selected ingredient is individual ingredient-type
  const isSelectedIngredientIndividual = () => {
    if (selectedIngredient === "none" || !selectedIngredient) return false;

    const matchingProduct = productsData.find(product =>
      product.name.toLowerCase().includes(selectedIngredient.toLowerCase()) ||
      selectedIngredient.toLowerCase().includes(product.name.toLowerCase())
    );

    return matchingProduct &&
      (matchingProduct.type === 'ingredient' || matchingProduct.category === 'ingrediente');
  };

  // Helper function to extract unit from description
  const extractUnitFromDescription = (description: string): string => {
    // Extract unit from description like "Unit: L, Conversion: 500g per unit"
    const unitMatch = description.match(/Unit:\s*([^,]+)/i);
    if (unitMatch) {
      return unitMatch[1].trim();
    }
    return "unidad"; // Default unit
  };

  useEffect(() => {
    fetchRecipes();
    fetchProducts();
  }, []);

  // Function to calculate ingredient requirements for products with recipes
  const calculateIngredientRequirements = (product: any, requestedQuantity: number = 1) => {
    if (!product.has_recipe || !product.ingredients) return [];

    try {
      const recipeIngredients = JSON.parse(product.ingredients);
      return recipeIngredients.map((ingredient: any) => ({
        name: ingredient.name,
        totalRequired: parseFloat(ingredient.quantity) * requestedQuantity,
        unit: ingredient.unit,
        originalQuantity: ingredient.quantity
      }));
    } catch (error) {
      console.error('Error parsing recipe ingredients:', error);
      return [];
    }
  };
  // Calculate most used products
  const mostUsedProducts = [
    { name: "Mojito", count: 1 },
    { name: "Margarita", count: 1 },
    { name: "Piña Colada", count: 1 },
  ];

  // Calculate most used ingredients
  const ingredientCounts: Record<string, number> = {};
  recipesData.forEach((recipe) => {
    if (recipe.type === 'ingredient') return;
    recipe.ingredients.forEach((ingredient) => {
      if (ingredientCounts[ingredient.name]) {
        ingredientCounts[ingredient.name]++;
      } else {
        ingredientCounts[ingredient.name] = 1;
      }
    });
  });

  const mostUsedIngredients = Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const addNewIngredient = () => {
    // Determine which ingredient name to use and find matching product
    let ingredientName = "";
    let productId = undefined;
    let matchingProduct = null;

    if (selectedIngredient === "none") {
      ingredientName = customIngredient;
      // Try to find matching product for custom ingredient
      matchingProduct = productsData.find(product =>
        product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(product.name.toLowerCase())
      );
    } else if (selectedIngredient) {
      ingredientName = selectedIngredient;
      // Try to find matching product in stock
      matchingProduct = productsData.find(product =>
        product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
        ingredientName.toLowerCase().includes(product.name.toLowerCase())
      );
    } else {
      ingredientName = customIngredient;
    }

    if (matchingProduct) {
      productId = matchingProduct.id;
    }

    // Validate that ingredient name and quantity are provided
    if (!ingredientName.trim()) {
      alert("Por favor ingresa el nombre del ingrediente");
      return;
    }
    if (!quantity.trim()) {
      alert("Por favor ingresa la cantidad del ingrediente");
      return;
    }

    // Validate stock availability for this ingredient
    const requiredQuantity = parseFloat(quantity);
    if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
      alert("Por favor ingresa una cantidad válida");
      return;
    }

    // Check if this is a liquid ingredient-type product
    // Only mark as liquid if explicitly set to true (not null or undefined)
    const isLiquidIngredient = matchingProduct &&
      (matchingProduct.type === 'ingredient' || matchingProduct.category === 'ingrediente') &&
      matchingProduct.is_liquid === true;
    console.log("matchingProduct: ", matchingProduct)
    console.log(`Adding ingredient:`, {
      ingredientName,
      matchingProduct: matchingProduct ? {
        id: matchingProduct.id,
        name: matchingProduct.name,
        type: matchingProduct.type,
        category: matchingProduct.category,
        is_liquid: matchingProduct.is_liquid
      } : null,
      isLiquidIngredient
    });

    if (matchingProduct) {
      // For liquid ingredient-type products, check stock availability differently
      if (isLiquidIngredient) {
        // For liquid ingredients, the stock represents the total liquid amount available
        if (matchingProduct?.total_amount && matchingProduct?.total_amount < Number(availableStock)) {
          alert(`Stock insuficiente para ${ingredientName}:\nRequerido: ${requiredQuantity} ${unit}\nDisponible: ${matchingProduct.stock} ${unit}`);
          return;
        }
      } else {
        // For regular ingredients, use existing logic
        if (matchingProduct.stock < requiredQuantity) {
          alert(`Stock insuficiente para ${ingredientName}:\nRequerido: ${requiredQuantity} ${unit}\nDisponible: ${matchingProduct.stock}`);
          return;
        }
      }
    } else {
      // Warn if no matching product found
      const confirmAdd = confirm(`No se encontró un producto en stock que coincida con "${ingredientName}".\n¿Deseas agregar este ingrediente de todas formas?`);
      if (!confirmAdd) {
        return;
      }
    }

    // For liquid ingredient-type products, use the total_amount instead of stock
    let finalAvailableStock = parseInt(availableStock) || 1;
    if (isLiquidIngredient && matchingProduct) {
      // For liquid ingredients, use total_amount if available, otherwise fall back to stock
      finalAvailableStock = matchingProduct.total_amount || matchingProduct.stock;
    }

    setNewIngredients([
      ...newIngredients,
      {
        name: ingredientName.trim(),
        quantity: quantity,
        unit: unit,
        availableStock: finalAvailableStock,
        productId: productId,
        isLiquid: !!isLiquidIngredient // Add flag to track liquid ingredients
      },
    ]);
    setSelectedIngredient("none");
    setCustomIngredient("");
    setQuantity("");
    setUnit("ml");
    setAvailableStock("1");
  };

  // Helper function to deduct stock for liquid ingredients
  const deductLiquidIngredientStock = async (ingredient: any, multiplier: number = 1) => {
    if (!ingredient.productId || !ingredient.isLiquid) return;

    try {
      // For liquid ingredient-type products, deduct the portion used in the recipe
      // multiplied by the multiplier (for recipe amount increases)
      const quantityUsedInRecipe = parseFloat(ingredient.quantity) || 1;
      const deductionAmount = quantityUsedInRecipe * multiplier;

      console.log(`Attempting to deduct stock for liquid ingredient:`, {
        name: ingredient.name,
        productId: ingredient.productId,
        isLiquid: ingredient.isLiquid,
        quantityUsedInRecipe,
        multiplier,
        deductionAmount,
        note: `Deducting ${quantityUsedInRecipe} × ${multiplier} = ${deductionAmount}`
      });

      const response = await fetch("/api/products", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ingredient.productId,
          stock: -deductionAmount, // Negative value to deduct
          operation: "deduct"
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error Response:", errorData);
        throw new Error(`Failed to deduct stock for liquid ingredient: ${ingredient.name}. ${errorData.error || 'Unknown error'}`);
      }

      console.log(`Successfully deducted ${deductionAmount} units from liquid ingredient ${ingredient.name}`);
    } catch (error) {
      console.error("Error deducting liquid ingredient stock:", error);
      throw error;
    }
  };

  const addNewRecipe = async () => {
    setLoading(true);
    // Convert amount to number, default to 0 if empty or invalid
    const numericAmount = amount === "" ? 0 : Number(amount);

    try {
      // First, create the recipe
      const res = await fetch("/api/recipe", {
        method: "POST",
        body: JSON.stringify({
          name: recipeName,
          ingredients: newIngredients, // Send ingredients directly, not as JSON string
          amount: numericAmount,
          category: category,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add recipe");
      }

      // Then, deduct stock for liquid ingredients
      if (numericAmount > 0) {
        console.log(`Processing ${newIngredients.length} ingredients for stock deduction`);

        // Check if there are any liquid ingredients that need stock deduction
        const liquidIngredients = newIngredients.filter(ingredient =>
          ingredient.isLiquid && ingredient.productId
        );

        if (liquidIngredients.length > 0) {
          const liquidIngredientNames = liquidIngredients.map(ing => ing.name).join(', ');
          const confirmDeduction = confirm(
            `Se detectaron ingredientes líquidos: ${liquidIngredientNames}\n\n` +
            `¿Deseas deducir automáticamente el stock de estos ingredientes líquidos?\n` +
            `Cantidad de receta: ${numericAmount}`
          );

          if (confirmDeduction) {
            for (const ingredient of liquidIngredients) {
              console.log(`Deducting stock for liquid ingredient: ${ingredient.name}`);
              await deductLiquidIngredientStock(ingredient);
            }

            // Refresh products data to reflect stock changes
            await fetchProducts();
          }
        }
      }

      // Refresh products data to reflect stock changes
      await fetchProducts();

      handleInitRecipe();
      fetchRecipes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Error creating recipe: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInitRecipe = () => {
    setRecipeName("");
    setNewIngredients([]);
    setShowAddRecipeModal(false);
    setSelectedRecipe(null);
    setAmount("");
    setCategory("");
    setSelectedIngredient("none");
    setCustomIngredient("");
  };

  console.log("ingredients; ", newIngredients)

  const addNewIngredientToStock = async () => {
    if (!newIngredientName.trim()) {
      toast.error("El nombre del ingrediente es requerido");
      return;
    }

    setAddingIngredient(true);
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newIngredientName,
          description: `Unit: ${newIngredientUnit}, Conversion: ${newIngredientConversionFactor}g per unit`,
          category: "ingrediente",
          stock: parseInt(newIngredientDefaultStock) || 0,
          purchase_price: 0, // Ingredients don't have purchase price in this context
          sale_price: 0, // Ingredients are not sold directly
          has_recipe: false,
          type: 'ingredient', // Set type as ingredient when creating ingredients directly
          image_url: '', // Default empty image URL
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear ingrediente");
      }

      toast.success(`Ingrediente "${newIngredientName}" agregado al stock`);

      // Reset form
      setNewIngredientName("");
      setNewIngredientUnit("");
      setNewIngredientConversionFactor("");
      setNewIngredientDefaultStock("");
      setNewIngredientMinimumAlert("");
      setNewIngredientActive(true);
      setShowAddIngredientModal(false);

      // Refresh products data
      await fetchProducts();
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar ingrediente");
    } finally {
      setAddingIngredient(false);
    }
  };

  const updateRecipe = async () => {
    setLoading(true);
    // Convert amount to number, default to 0 if empty or invalid
    const numericAmount = amount === "" ? 0 : Number(amount);

    try {
      // Get the original recipe to compare amounts
      const originalRecipe = recipesData.find(item => item.id === selectedRecipe);
      const originalAmount = originalRecipe?.stock || 0;
      const amountDifference = numericAmount - originalAmount;

      const res = await fetch("/api/recipe", {
        method: "PUT",
        body: JSON.stringify({
          id: selectedRecipe,
          name: recipeName,
          ingredients: newIngredients, // Send ingredients directly, not as JSON string
          amount: numericAmount,
          category: category,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update recipe");
      }

      // If amount increased, deduct additional stock for liquid ingredients
      if (amountDifference > 0) {
        const liquidIngredients = newIngredients.filter(ingredient =>
          ingredient.isLiquid && ingredient.productId
        );

        if (liquidIngredients.length > 0) {
          const liquidIngredientNames = liquidIngredients.map(ing => ing.name).join(', ');
          const confirmDeduction = confirm(
            `Se detectaron ingredientes líquidos: ${liquidIngredientNames}\n\n` +
            `¿Deseas deducir automáticamente el stock adicional de estos ingredientes líquidos?\n` +
            `Cantidad adicional: ${amountDifference}`
          );

          if (confirmDeduction) {
            for (const ingredient of liquidIngredients) {
              await deductLiquidIngredientStock(ingredient, amountDifference);
            }

            // Refresh products data to reflect stock changes
            await fetchProducts();
          }
        }
      }

      handleInitRecipe();
      fetchRecipes();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`Error updating recipe: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditRecipe = (id: number) => {
    setSelectedRecipe(id);

    // Find the item in recipesData (which now contains both recipes and ingredients)
    const selectedItem = recipesData.find((item) => item.id === id);

    if (selectedItem) {
      setRecipeName(selectedItem.name || "");
      setAmount(String(selectedItem.stock || ""));

      // Handle ingredients based on type
      if (selectedItem.type === 'recipe') {
        const ingredients = (selectedItem.ingredients || []).map((ing: any) => ({
          ...ing,
          availableStock: ing.availableStock || 1 // Default to 1 if not set
        }));
        setNewIngredients(ingredients);
      } else if (selectedItem.type === 'ingredient') {
        // For ingredients, create the ingredient info from the ingredient data
        let existingIngredients = [];

        if (selectedItem.ingredients && selectedItem.ingredients !== null) {
          try {
            const parsedIngredients = typeof selectedItem.ingredients === 'string'
              ? JSON.parse(selectedItem.ingredients)
              : selectedItem.ingredients;

            // Ensure it's an array and add availableStock if missing
            if (Array.isArray(parsedIngredients)) {
              existingIngredients = parsedIngredients.map((ing: any) => ({
                ...ing,
                availableStock: ing.availableStock || 1 // Default to 1 if not set
              }));
            } else {
              existingIngredients = [];
            }
          } catch (error) {
            console.error('Error parsing ingredient ingredients:', error);
            existingIngredients = [];
          }
        } else {
          // Manually create ingredient info from the ingredient data
          const ingredientData = selectedItem as any; // Cast to access description property
          const ingredientInfo = {
            name: ingredientData.name,
            quantity: "1",
            unit: extractUnitFromDescription(ingredientData.description || ""),
            productId: ingredientData.id,
            linkedProductName: ingredientData.name,
            availableStock: ingredientData.stock || 0
          };

          existingIngredients = [ingredientInfo];
        }

        setNewIngredients(existingIngredients);
      }

      setCategory(selectedItem.category || "bebida");
    }

    fetchRecipes();
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
            onClick={() => setShowAddIngredientModal(true)}
          >
            <Plus size={16} />
            Agregar Ingrediente
          </Button>
          <Button className="gap-2" onClick={() => setShowAddRecipeModal(true)}>
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
          placeholder="Buscar receta..."
          className="pl-8"
        // value={recipeName}
        // onChange={(e) => setRecipeName(e.target.value)}
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
            {filteredRecipes.filter(item => item.type === 'recipe').map((item) => (
              <div key={item.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'recipe' ? 'Receta' : 'Ingrediente'}
                    </Badge>
                    <Button
                      onClick={() => handleEditRecipe(item.id)}
                      variant="ghost"
                      size="icon"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {item.stock !== null ? (
                  <Badge
                    className={cn(
                      "mb-3",
                      item.stock > 0
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {item.stock} disponibles
                  </Badge>
                ) : (
                  <Badge className="mb-3 bg-red-50 text-red-700 border-red-200">
                    No disponible
                  </Badge>
                )}

                {/* Show ingredients for recipes, or ingredient info for ingredients */}
                {item.type === 'recipe' ? (
                  <>
                    <div className="text-sm font-medium mb-2">Ingredientes:</div>
                    <div className="space-y-1">
                      {item.ingredients && item.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{ingredient.name}</span>
                          <span className="text-muted-foreground">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium mb-2">Ingredientes:</div>
                    <div className="space-y-1">
                      {/* Show the ingredient itself as a single ingredient */}
                      <div className="flex justify-between text-sm">
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          1 unidad
                        </span>
                      </div>

                      {/* Show additional ingredients if any (for ingredients that have been enhanced with more ingredients) */}
                      {item.ingredients && item.ingredients !== null && (() => {
                        try {
                          const ingredients = typeof item.ingredients === 'string'
                            ? JSON.parse(item.ingredients)
                            : item.ingredients;

                          // Only show if ingredients array exists and has items
                          if (Array.isArray(ingredients) && ingredients.length > 0) {
                            return ingredients.map((ingredient: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{ingredient.name}</span>
                                <span className="text-muted-foreground">
                                  {ingredient.quantity} {ingredient.unit}
                                </span>
                              </div>
                            ));
                          }
                          return null;
                        } catch (error) {
                          return null;
                        }
                      })()}
                    </div>
                  </>
                )}

                {item.stock === null && (
                  <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                    Falta stock de ingredientes
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Recipe Modal */}
      <Dialog
        open={showAddRecipeModal}
        onOpenChange={(open) => {
          setShowAddRecipeModal(open);
          handleInitRecipe();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cocktail className="h-5 w-5" />
              {selectedRecipe ?
                (recipesData.find(item => item.id === selectedRecipe)?.type === 'ingredient'
                  ? "Editar Ingrediente"
                  : "Editar Receta")
                : "Crear Nueva Receta"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipeName">Nombre del Producto Elaborado</Label>
              <Input
                id="recipeName"
                placeholder="Ej: Mojito, Margarita, etc."
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>

            {/* Input amount of Recipe */}
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                placeholder="Ingrese la cantidad"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers and empty string
                  if (
                    value === "" ||
                    (Number(value) >= 0 && !value.includes("-"))
                  ) {
                    setAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent minus key, plus key, and 'e' key
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                min="0"
                step="0.01"
              />
            </div>

            {/* Select category of Recipe */}
            <Select
              value={category}
              onValueChange={(value) => setCategory(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoryList.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Show ingredient information if editing an ingredient */}
            {selectedRecipe && recipesData.find(item => item.id === selectedRecipe)?.type === 'ingredient' && (() => {
              const selectedIngredient = recipesData.find(item => item.id === selectedRecipe) as any;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                  <h3 className="font-medium text-blue-900">Información del Ingrediente</h3>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-blue-800">Ingrediente</span>
                      <div className="text-blue-700">
                        {selectedIngredient?.name}
                      </div>
                      <div className="text-blue-600 text-xs">
                        {selectedIngredient?.description || 'Sin descripción'}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-blue-800">Cantidad a crear</span>
                      <div className="text-blue-700 text-lg font-semibold">
                        {amount || 1}
                      </div>
                      <div className="text-blue-600 text-xs">
                        Total necesario: {amount || 1} {extractUnitFromDescription(selectedIngredient?.description || "")}
                      </div>
                    </div>

                    <div>
                      <span className="font-medium text-blue-800">Stock disponible</span>
                      <div className={`text-lg font-semibold ${(selectedIngredient?.stock || 0) >= (Number(amount) || 1)
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {selectedIngredient?.stock || 0} {extractUnitFromDescription(selectedIngredient?.description || "")}
                      </div>
                      <div className={`text-xs ${(selectedIngredient?.stock || 0) >= (Number(amount) || 1)
                          ? 'text-green-600'
                          : 'text-red-600'
                        }`}>
                        {(selectedIngredient?.stock || 0) >= (Number(amount) || 1)
                          ? `Suficiente stock`
                          : `Faltan ${(Number(amount) || 1) - (selectedIngredient?.stock || 0)} ${extractUnitFromDescription(selectedIngredient?.description || "")}`
                        }
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
            {/* Ingredientes Section - Show for new recipes or when editing recipes (not ingredients) */}
            {(!selectedRecipe || recipesData.find(item => item.id === selectedRecipe)?.type !== 'ingredient') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Ingredientes</Label>
                  {newIngredients.length === 0 ? (
                    <div className="bg-gray-50 border border-gray-200 p-8 text-center rounded-lg">
                      <p className="text-gray-500 text-sm">No hay ingredientes agregados</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {newIngredients.map((ingredient, index) => (
                        <div key={index} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg border">
                          <div>
                            <span className="font-medium text-sm">{ingredient.name || "Ingrediente sin nombre"}</span>
                          </div>
                          <div className="text-sm text-gray-600">
                            {ingredient.quantity} {ingredient.unit}
                          </div>
                          {!ingredient.isLiquid && (
                            <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Stock:</span>
                            <Input
                              type="number"
                              min="0"
                              value={ingredient.availableStock}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 0;
                                const updatedIngredients = [...newIngredients];
                                updatedIngredients[index].availableStock = newValue;
                                setNewIngredients(updatedIngredients);
                              }}
                              className="h-8 w-20 text-center text-sm"
                            />
                          </div>
                          )}
                          
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setNewIngredients(
                                newIngredients.filter((_, i) => i !== index)
                              )}
                              className="h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Agregar Ingrediente Section */}
                <div className="border-t pt-4 space-y-4">
                  <Label className="text-base font-medium">Agregar Ingrediente</Label>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Ingrediente</Label>
                      <Select
                        value={selectedIngredient}
                        disabled={customIngredient ? true : false}
                        onValueChange={(value) => {
                          setSelectedIngredient(value);

                          // Auto-set quantity and unit for liquid/individual ingredients
                          if (value !== "none") {
                            const matchingProduct = productsData.find(product =>
                              product.name.toLowerCase().includes(value.toLowerCase()) ||
                              value.toLowerCase().includes(product.name.toLowerCase())
                            );

                            if (matchingProduct &&
                                (matchingProduct.type === 'ingredient' || matchingProduct.category === 'ingrediente')) {
                              if (matchingProduct.is_liquid) {
                                // For liquid ingredients, user can set quantity and unit freely
                                // Don't auto-set quantity and unit - let user decide
                                // Set available stock to the total_amount for liquid ingredients, fallback to stock
                                setAvailableStock((matchingProduct.total_amount || matchingProduct.stock).toString());
                              } else {
                                // For individual ingredients, set quantity to 1 and unit to "unidad"
                                setQuantity("1");
                                setUnit("unidad");
                                // Set available stock to the actual product stock
                                setAvailableStock(matchingProduct.stock.toString());
                              }
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Seleccionar ingrediente existente</SelectItem>

                            {/* Available products in stock */}
                            {productsData
                              .filter((product) => (product.category === "ingrediente" && product.has_recipe === false) ||
                                product.type === 'ingredient'
                              )
                              .sort((a, b) => b.stock - a.stock) // Sort by stock level (highest first)
                              .map((product) => (
                                <SelectItem key={product.id} value={product.name}>
                                  <div className="flex justify-between items-center w-full">
                                    <span>{product.name}</span>
                                    <span className={`text-xs px-1 py-0.5 rounded ${product.stock > 10 ? 'bg-green-100 text-green-800' :
                                        product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'}`}>
                                      {product.stock}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}

                            {/* Products with recipes - show calculated ingredient requirements (grouped) */}
                            {(() => {
                              // Collect all ingredient requirements from all recipes
                              const allIngredientRequirements: { [key: string]: { totalAmount: number; unit: string; sources: string[]; }; } = {};

                              productsData
                                .filter((product) => product.has_recipe === true && product.ingredients)
                                .forEach((product) => {
                                  const ingredientRequirements = calculateIngredientRequirements(product, 1);
                                  ingredientRequirements.forEach((req: { name: string; totalRequired: number; unit: string; originalQuantity: string; }) => {
                                    const key = req.name?.toLowerCase();
                                    if (!allIngredientRequirements[key]) {
                                      allIngredientRequirements[key] = {
                                        totalAmount: 0,
                                        unit: req.unit,
                                        sources: []
                                      };
                                    }
                                    allIngredientRequirements[key].totalAmount += req.totalRequired;
                                    allIngredientRequirements[key].sources.push(product.name);
                                  });
                                });

                              // Convert to array and render
                              return Object.entries(allIngredientRequirements).map(([ingredientName, data]) => (
                                <SelectItem
                                  key={`recipe-ingredient-${ingredientName}`}
                                  value={`${ingredientName} (from recipes)`}
                                >
                                  {ingredientName} - {data.totalAmount} {data.unit} (from {data.sources.length} recipe{data.sources.length > 1 ? 's' : ''})
                                </SelectItem>
                              ));
                            })()}
                          </SelectContent>
                        </Select>
                        <div className="text-center text-sm text-muted-foreground">o</div>
                        <Input
                          disabled={selectedIngredient !== "none" ? true : false}
                          placeholder="Escribir ingrediente personalizado"
                          value={customIngredient}
                          onChange={(e) => setCustomIngredient(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNewIngredient();
                            }
                          } } />
                      </div>
                    </div>

                    {/* Quantity, Unit, and Available Stock in horizontal layout */}
                    <div className="grid grid-cols-4 gap-2 items-end">
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Cantidad</Label>
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={quantity}
                          // disabled={isSelectedIngredientIndividual()}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers and empty string
                            if (value === "" ||
                              (Number(value) >= 0 && !value.includes("-"))) {
                              setQuantity(value);
                            }
                          }}
                          onKeyDown={(e) => {
                            // Prevent minus key, plus key, and 'e' key
                            if (e.key === "-" ||
                              e.key === "+" ||
                              e.key === "e" ||
                              e.key === "E") {
                              e.preventDefault();
                            }
                            // Allow Enter to add ingredient
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNewIngredient();
                            }
                          }}
                          min="0"
                          step="0.01"
                          className="h-10"
                        />
                        {/* {(isSelectedIngredientLiquid() || isSelectedIngredientIndividual()) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Cantidad automática para ingredientes líquidos/individuales
                          </p>
                        )} */}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Unidad</Label>
                        <Select
                          value={unit}
                          // disabled={isSelectedIngredientIndividual()}
                          onValueChange={(value) => setUnit(value)}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ml">ml</SelectItem>
                            <SelectItem value="L">L</SelectItem>
                            <SelectItem value="g">g</SelectItem>
                            <SelectItem value="kg">kg</SelectItem>
                            <SelectItem value="unidad">unidad</SelectItem>
                            <SelectItem value="parts">parts</SelectItem>
                            <SelectItem value="cups">cups</SelectItem>
                            <SelectItem value="tbsp">tbsp</SelectItem>
                            <SelectItem value="tsp">tsp</SelectItem>
                            <SelectItem value="hojas">hojas</SelectItem>
                          </SelectContent>
                        </Select>
                        {/* {(isSelectedIngredientLiquid() || isSelectedIngredientIndividual()) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Unidad automática
                          </p>
                        )} */}
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600 mb-1 block">Stock Disponible</Label>
                        <Input
                          type="number"
                          placeholder="Stock"
                          value={availableStock}
                          onChange={(e) => {
                            const value = e.target.value;
                            console.log("value: ", value)
                            // Only allow positive numbers and empty string
                            if (value === "" ||
                              (Number(value) >= 0 && !value.includes("-"))) {
                              setAvailableStock(value);
                            }
                          }}
                          min="0"
                          step="1"
                          className="h-10"
                          disabled={(() => {
                            // Disable for liquid ingredient-type products
                            const matchingProduct = productsData?.find(product =>
                              product.name.toLowerCase() === selectedIngredient.toLowerCase() ||
                              selectedIngredient.toLowerCase().includes(product.name.toLowerCase()) ||
                              product.name.toLowerCase().includes(selectedIngredient.toLowerCase())
                            );
                            return matchingProduct?.is_liquid &&
                                   (matchingProduct?.type === 'ingredient' || matchingProduct?.category === 'ingrediente');
                          })()}
                        />
                      </div>
                      <div>
                        <Button
                          variant="secondary"
                          size="icon"
                          onClick={addNewIngredient}
                          disabled={quantity.trim() === "" ||
                            (selectedIngredient === "none" && customIngredient.trim() === "") ||
                            (selectedIngredient !== "none" && selectedIngredient.trim() === "")}
                          className="h-10 w-10"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleInitRecipe}>
              Cancelar
            </Button>
            <Button onClick={selectedRecipe ? updateRecipe : addNewRecipe}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : selectedRecipe ? (
                "Actualizar Receta"
              ) : (
                "Crear Receta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Ingredient Modal */}
      <Dialog open={showAddIngredientModal} onOpenChange={setShowAddIngredientModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Add New Ingredient</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="ingredientName" className="text-sm font-medium">
                Ingredient Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ingredientName"
                placeholder="Enter the name of the ingredient"
                value={newIngredientName}
                onChange={(e) => setNewIngredientName(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredientUnit" className="text-sm font-medium">
                Unit of Measurement <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newIngredientUnit}
                onValueChange={(value) => setNewIngredientUnit(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select the unit of measurement" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="g">Grams (g)</SelectItem>
                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                  <SelectItem value="L">Liters (L)</SelectItem>
                  <SelectItem value="mL">Milliliters (mL)</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                  <SelectItem value="parts">Parts</SelectItem>
                  <SelectItem value="cups">Cups</SelectItem>
                  <SelectItem value="tablespoons">Tablespoons</SelectItem>
                  <SelectItem value="teaspoons">Teaspoons</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conversionFactor" className="text-sm font-medium">
                Conversion Factor (grams per unit) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="conversionFactor"
                placeholder="Eg: 1000 (for 1kg = 1000g)"
                value={newIngredientConversionFactor}
                onChange={(e) => setNewIngredientConversionFactor(e.target.value)}
                type="number"
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                Specify how many grams equal a complete unit of measurement
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultStock" className="text-sm font-medium">
                Default Stock Quantity
              </Label>
              <Input
                id="defaultStock"
                placeholder="Enter the default amount"
                value={newIngredientDefaultStock}
                onChange={(e) => setNewIngredientDefaultStock(e.target.value)}
                type="number"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimumAlert" className="text-sm font-medium">
                Minimum Stock Alert
              </Label>
              <Input
                id="minimumAlert"
                placeholder="Enter the minimum alert amount"
                value={newIngredientMinimumAlert}
                onChange={(e) => setNewIngredientMinimumAlert(e.target.value)}
                type="number"
                className="w-full"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Active Ingredient</Label>
                <p className="text-xs text-gray-500">
                  Activate to mark this ingredient as active in your inventory
                </p>
              </div>
              <Switch
                checked={newIngredientActive}
                onCheckedChange={setNewIngredientActive}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowAddIngredientModal(false)}
              disabled={addingIngredient}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={addNewIngredientToStock}
              disabled={addingIngredient || !newIngredientName.trim() || !newIngredientUnit.trim() || !newIngredientConversionFactor.trim()}
              className="flex-1 bg-black text-white hover:bg-gray-800"
            >
              {addingIngredient ? "Saving..." : "Save Ingredient"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    // ---------------------
  );
}
