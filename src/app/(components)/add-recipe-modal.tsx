"use client";

import React, { useState } from "react";
import {
  CoffeeIcon as Cocktail,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";

// Define the recipe ingredient type interface
interface RecipeIngredientType {
  ingredient_id: string;
  deduct_quantity: number;
  deduct_stock?: number; // Optional - defaults to 0 for recipe creation
}

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRecipe?: number | null;
  onRecipeAdded?: () => void;
  onRecipeUpdated?: () => void;
  onIngredientAdded?: () => void; // Callback to refresh ingredients when a new one is added
}

export default function AddRecipeModal({
  isOpen,
  onClose,
  selectedRecipe = null,
  onRecipeAdded,
  onRecipeUpdated,
  onIngredientAdded,
}: AddRecipeModalProps) {
  const [recipeName, setRecipeName] = useState("");
  const [type, setType] = useState("drink");
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredientType[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("0.00");
  const [loading, setLoading] = useState(false);
  const [ingredientsData, setIngredientsData] = useState<any[]>([]);
  const [loadingIngredients, setLoadingIngredients] = useState(false);

  const { fetchRecipes, recipesData } = useAppContext();
  const { user } = useAuth();

  // Calculate total purchase price based on ingredients
  const calculatePurchasePrice = () => {
    let totalPrice = 0;

    recipeIngredients.forEach(recipeIngredient => {
      const ingredient = ingredientsData.find(ing => ing.id === recipeIngredient.ingredient_id);
      if (ingredient && ingredient.purchase_price && ingredient.quantity && recipeIngredient.deduct_quantity) {
        // Calculate price per unit: ingredient.purchase_price / ingredient.quantity
        const pricePerUnit = ingredient.purchase_price / ingredient.quantity;
        // Calculate total cost for this ingredient: pricePerUnit * quantity used in recipe
        const ingredientCost = pricePerUnit * recipeIngredient.deduct_quantity;
        totalPrice += ingredientCost;
      }
    });

    return totalPrice;
  };

  // Fetch ingredients from the ingredients API
  const fetchIngredients = async () => {
    setLoadingIngredients(true);
    try {
      const response = await fetch('/api/ingredients');
      if (response.ok) {
        const ingredients = await response.json();
        setIngredientsData(ingredients);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch ingredients:', response.status, errorData);
        toast.error(`Failed to load ingredients: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      toast.error('Error loading ingredients. Please check your connection.');
    } finally {
      setLoadingIngredients(false);
    }
  };

  // Effect to fetch ingredients when modal opens
  React.useEffect(() => {
    if (isOpen) {
      fetchIngredients();
    }
  }, [isOpen]);

  // Effect to refresh ingredients when a new ingredient is added
  React.useEffect(() => {
    if (onIngredientAdded && isOpen) {
      fetchIngredients();
    }
  }, [onIngredientAdded, isOpen]);

  // Auto-calculate purchase price when ingredients change
  React.useEffect(() => {
    if (recipeIngredients.length > 0 && ingredientsData.length > 0) {
      const calculatedPrice = calculatePurchasePrice();
      setPurchasePrice(calculatedPrice.toFixed(2));
    } else {
      setPurchasePrice("0.00");
    }
  }, [recipeIngredients, ingredientsData]);

  // Effect to populate form when editing a recipe
  React.useEffect(() => {
    if (selectedRecipe && isOpen) {
      const selectedItem = recipesData.find((item) => item.id === selectedRecipe);

      if (selectedItem) {
        setRecipeName(selectedItem.name || "");
        setType((selectedItem as any).type || "drink");

        // Handle existing ingredients
        if (selectedItem.ingredients && Array.isArray(selectedItem.ingredients)) {
          setRecipeIngredients(selectedItem.ingredients as unknown as RecipeIngredientType[]);
        }
      }
    } else if (!selectedRecipe && isOpen) {
      // Reset form for new recipe
      resetForm();
    }
  }, [selectedRecipe, isOpen, recipesData]);

  const resetForm = () => {
    setRecipeName("");
    setType("drink");
    setRecipeIngredients([]);
    setSelectedIngredientId("");
    setIngredientQuantity("");
    setIngredientUnit("");
    setPurchasePrice("0.00");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Add ingredient to recipe
  const addIngredientToRecipe = () => {
    if (!selectedIngredientId) {
      toast.error("Por favor selecciona un ingrediente");
      return;
    }

    if (!ingredientQuantity.trim()) {
      toast.error("Por favor ingresa la cantidad");
      return;
    }

    const selectedIngredient = ingredientsData.find(ing => ing.id === selectedIngredientId);
    if (!selectedIngredient) {
      toast.error("Ingrediente no encontrado");
      return;
    }

    const deductAmount = parseFloat(ingredientQuantity) || 0;

    // Note: We don't validate stock availability when creating recipes
    // Recipes are formulas/instructions, not actual production that consumes ingredients
    // Stock validation happens when the recipe is actually used/produced

    const newRecipeIngredient: RecipeIngredientType = {
      ingredient_id: selectedIngredientId,
      deduct_quantity: deductAmount,
      // deduct_stock is optional and will default to 0 on the backend
    };

    setRecipeIngredients([...recipeIngredients, newRecipeIngredient]);

    // Reset ingredient form
    setSelectedIngredientId("");
    setIngredientQuantity("");
    setIngredientUnit("");
  };



  const addNewRecipe = async () => {
    if (!recipeName.trim()) {
      toast.error("El nombre de la receta es requerido");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: recipeName.trim(),
          type: type,
          ingredients: recipeIngredients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear receta");
      }

      toast.success("Receta creada exitosamente");

      // Reset form and close modal
      handleClose();

      // Refresh recipes data
      await fetchRecipes();

      // Call the callback if provided
      if (onRecipeAdded) {
        onRecipeAdded();
      }
    } catch (error) {
      console.error("Error adding recipe:", error);
      toast.error(error instanceof Error ? error.message : "Error al crear receta");
    } finally {
      setLoading(false);
    }
  };

  const updateRecipe = async () => {
    if (!recipeName.trim()) {
      toast.error("El nombre de la receta es requerido");
      return;
    }

    setLoading(true);
    try {
      // Get current recipe data for audit logging
      let currentRecipe = null;
      if (user) {
        try {
          const currentResponse = await fetch(`/api/recipes/${selectedRecipe}`);
          if (currentResponse.ok) {
            currentRecipe = await currentResponse.json();
          }
        } catch (error) {
          console.error("Error fetching current recipe:", error);
        }
      }

      const response = await fetch("/api/recipes", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: selectedRecipe,
          name: recipeName.trim(),
          type: type,
          ingredients: recipeIngredients,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar receta");
      }

      toast.success("Receta actualizada exitosamente");

      // Create audit log for recipe update
      if (user && currentRecipe) {
        try {
          const changes = [];
          if (currentRecipe.name !== recipeName.trim()) changes.push(`Nombre: "${currentRecipe.name}" → "${recipeName.trim()}"`);
          if (currentRecipe.type !== type) changes.push(`Tipo: "${currentRecipe.type}" → "${type}"`);
          if (JSON.stringify(currentRecipe.ingredients) !== JSON.stringify(recipeIngredients)) changes.push('Ingredientes actualizados');

          if (changes.length > 0) {
            await fetch("/api/audit-log", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                user_name: user.email?.split('@')[0] || 'Unknown',
                user_email: user.email || '',
                user_role: user.role || 'user',
                action: "update",
                action_type: "recipe_update",
                target_type: "recipe",
                target_id: selectedRecipe,
                target_name: recipeName.trim(),
                description: `Receta actualizada: ${changes.join(', ')}`,
                changes_before: {
                  name: currentRecipe.name,
                  type: currentRecipe.type,
                  ingredients: currentRecipe.ingredients
                },
                changes_after: {
                  name: recipeName.trim(),
                  type: type,
                  ingredients: recipeIngredients
                },
                status: "success"
              }),
            });
          }
        } catch (auditError) {
          console.error("Error creating audit log:", auditError);
        }
      }

      // Reset form and close modal
      handleClose();

      // Refresh recipes data
      await fetchRecipes();

      // Call the callback if provided
      if (onRecipeUpdated) {
        onRecipeUpdated();
      }
    } catch (error) {
      console.error("Error updating recipe:", error);
      toast.error(error instanceof Error ? error.message : "Error al actualizar receta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cocktail className="h-5 w-5" />
            {selectedRecipe ? "Edit Recipe" : "Create New Recipe"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipeName">Name <span className="text-red-500">*</span></Label>
            <Input
              id="recipeName"
              placeholder="Enter recipe name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type <span className="text-red-500">*</span></Label>
            <Select value={type} onValueChange={(value) => setType(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drink">Drink</SelectItem>
                <SelectItem value="meal">Meal</SelectItem>
                <SelectItem value="input">Input</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">$</span>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                value={purchasePrice}
                readOnly
                className="pl-8 bg-blue-50"
                title="Purchase price is automatically calculated based on ingredient costs"
              />
            </div>
            <p className="text-xs text-gray-500">
              Automatically calculated based on ingredient costs
            </p>
          </div>

          {/* Recipe Ingredients Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Ingredients</Label>
              {recipeIngredients.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 p-8 text-center rounded-lg">
                  <p className="text-gray-500 text-sm">No ingredients added</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipeIngredients.map((ingredient, index) => {
                    const ingredientData = ingredientsData.find(ing => ing.id === ingredient.ingredient_id);
                    return (
                      <div key={index} className="grid grid-cols-4 gap-3 items-center p-3 bg-gray-50 rounded-lg border">
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{ingredientData?.name || "Unknown ingredient"}</span>
                          <span className="text-xs text-gray-500">{ingredientData?.unit || ""}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Amount: {ingredient.deduct_quantity} {ingredientData?.unit || ""}
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRecipeIngredients(
                              recipeIngredients.filter((_, i) => i !== index)
                            )}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Ingredient Section */}
          <div className="border-t pt-4 space-y-4">
            <Label className="text-base font-medium">Add Ingredient</Label>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ingredientSelect">Select Ingredient</Label>
                <Select
                  value={selectedIngredientId}
                  disabled={loadingIngredients}
                  onValueChange={(value) => {
                    setSelectedIngredientId(value);
                    // Auto-populate fields when ingredient is selected
                    const selectedIngredient = ingredientsData.find(ing => ing.id === value);
                    if (selectedIngredient) {
                      setIngredientUnit(selectedIngredient.unit || "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingIngredients ? "Loading ingredients..." : "Select an ingredient"} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingIngredients ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          Loading ingredients...
                        </div>
                      </SelectItem>
                    ) : ingredientsData.length === 0 ? (
                      <SelectItem value="no-ingredients" disabled>
                        No ingredients available
                      </SelectItem>
                    ) : (
                      ingredientsData.map((ingredient) => (
                        <SelectItem key={ingredient.id} value={ingredient.id}>
                          <div className="flex justify-between items-center w-full gap-2">
                            <span className="flex-1">{ingredient.name}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">{ingredient.original_quantity} {ingredient.unit || ""}</span>
                              <span className={`text-xs px-1 py-0.5 rounded ${ingredient.stock > 10 ? 'bg-green-100 text-green-800' :
                                  ingredient.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                }`}>
                                Stock: {ingredient.stock}
                              </span>
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {selectedIngredientId && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Quantity</Label>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={ingredientQuantity}
                      onChange={(e) => setIngredientQuantity(e.target.value)}
                      min="0"
                      step="0.01"
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-600 mb-1 block">Unit</Label>
                    <Input
                      disabled
                      value={ingredientUnit}
                      className="h-10"
                      readOnly
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={addIngredientToRecipe}
                      disabled={!selectedIngredientId || !ingredientQuantity.trim()}
                      className="h-10 w-10"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={selectedRecipe ? updateRecipe : addNewRecipe}
            disabled={loading || !recipeName.trim()}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </div>
            ) : selectedRecipe ? (
              "Update Recipe"
            ) : (
              "Create Recipe"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
