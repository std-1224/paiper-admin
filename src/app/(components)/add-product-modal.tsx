"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./image-upload";
import { useAppContext } from "@/context/AppContext";
import { Ingredient, Recipe } from "@/types/database";

// Extended interface for recipe ingredients with nested ingredient data
interface RecipeIngredientWithDetails {
  id: string;
  ingredient_id: string;
  deduct_amount: number;
  deduct_stock: number;
  ingredients: {
    name: string;
    unit: string;
    stock: number;
    quantity: number;
    is_liquid?: boolean;
  };
}

interface RecipeWithIngredients {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  type: 'drink' | 'meal' | 'input';
  stock: number;
  created_at: string;
  updated_at: string;
  recipe_ingredients?: RecipeIngredientWithDetails[];
}

interface Product {
  id?: number;
  name: string;
  description: string;
  category: string;
  stock: number;
  purchase_price: number;
  sale_price: number;
  image_url?: string;
  type?: string;
  is_liquid?: boolean;
  total_amount?: number;
  has_recipe?: boolean; // Added to track if product has ingredients from recipes
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded?: () => void;
  categoryList?: Array<{ value: string; label: string }>;
  recipesData?: any[];
  productsData?: any[];
  ingredientsData?: Ingredient[];
  normalizedRecipesData?: Recipe[];
}

export default function AddProductModal({
  isOpen,
  onClose,
  onProductAdded,
  categoryList = [],
  recipesData = [],
  productsData = [],
  ingredientsData = [],
  normalizedRecipesData = [],
}: AddProductModalProps) {
  const { uploadImageToSupabase } = useAppContext();

  // State for fetched ingredients and recipes
  const [ingredients, setIngredients] = useState<Ingredient[]>(ingredientsData);
  const [recipes, setRecipes] = useState<RecipeWithIngredients[]>([]);

  const [newProduct, setNewProduct] = useState<Product>({
    name: "",
    description: "",
    category: "",
    stock: 0,
    purchase_price: 0,
    sale_price: 0,
    type: "product",
    is_liquid: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [useCustomIngredients, setUseCustomIngredients] = useState(false);
  const [customIngredients, setCustomIngredients] = useState<any[]>([]);
  const [recipeIngredients, setRecipeIngredients] = useState<{
    // Standard Ingredient fields
    id: string;
    product_id?: string | null;
    name: string;
    quantity: string;
    unit: string;
    deduct_amount?: number;
    deduct_stock?: number;
    available_stock: number;
    total_amount?: number;
    requiredQuantity?: number;
    is_liquid?: boolean;
    isCustom?: boolean;
  }[]>([]);
  const [ingredientRequiredQuantity, setIngredientRequiredQuantity] = useState(1);
  const [selectedIngredient, setSelectedIngredient] = useState("none");
  const [customIngredientName, setCustomIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("ml");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [amountPerUnit, setAmountPerUnit] = useState<number>(0);
  const [showCreateRecipeDialog, setShowCreateRecipeDialog] = useState(false);

  // Fetch ingredients and recipes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchIngredientsAndRecipes();
    } else {
      resetForm();
    }
  }, [isOpen]);

  const fetchIngredientsAndRecipes = async () => {
    try {
      // Fetch ingredients from the ingredients table
      const ingredientsResponse = await fetch('/api/ingredients');
      if (ingredientsResponse.ok) {
        const ingredientsData = await ingredientsResponse.json();
        setIngredients(ingredientsData);
      }

      // Fetch recipes from the recipes table
      const recipesResponse = await fetch('/api/recipes');
      if (recipesResponse.ok) {
        const recipesData = await recipesResponse.json();
        setRecipes(recipesData);
      }
    } catch (error) {
      console.error('Error fetching ingredients and recipes:', error);
    }
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      category: "",
      stock: 0,
      purchase_price: 0,
      sale_price: 0,
      // has_recipe: false,
      type: "product",
      is_liquid: false,
    });
    setSelectedRecipeId("");
    setUseCustomIngredients(false);
    setCustomIngredients([]);
    setRecipeIngredients([]);
    setIngredientRequiredQuantity(1);
    setSelectedIngredient("none");
    setCustomIngredientName("");
    setIngredientQuantity("");
    setIngredientUnit("ml");
    setImageFile(null);
    setAmountPerUnit(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    try {
      const fileName = `image-${Date.now()}.${imageFile.name.split(".").pop()}`;
      const uploadedUrl = await uploadImageToSupabase(imageFile, fileName);
      return uploadedUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleAddProduct = async () => {
    try {
      setIsLoading(true);

      const uploadedUrl = await handleImageUpload();

      // FIXED: Set has_recipe to true ONLY when product has ingredients FROM RECIPES (not individual ingredients)
      const isFromRecipe = Boolean(selectedRecipeId && recipes.find(r => r.id === selectedRecipeId));
      const hasRecipeIngredients = isFromRecipe && recipeIngredients.length > 0;

      const productData = {
        ...newProduct,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        image_url: uploadedUrl,
        has_recipe: hasRecipeIngredients, // Set to true when product has ingredients
        updated_at: new Date().toISOString(),
      };

      // 1) Create product
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      const createdProduct = await response.json();

      // 2) If this product is type "ingredient", create entry in ingredients table
      if (newProduct.type === "ingredient") {
        const ingredientData = {
          product_id: createdProduct.id,
          name: newProduct.name.trim(),
          unit: "ml", // Always ml as specified
          quantity: amountPerUnit, // quantity per unit
          stock: newProduct.stock || 0, // product stock
          is_liquid: true, // Always true as specified
        };

        try {
          const ingredientResponse = await fetch("/api/ingredients", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ingredientData),
          });

          if (!ingredientResponse.ok) {
            console.error("Failed to create ingredient entry, but product was created successfully");
            // Don't throw error here as the product was already created successfully
          }
        } catch (error) {
          console.error("Error creating ingredient entry:", error);
          // Continue execution as product was created successfully
        }
      }

      // 3) Create recipe_ingredients rows with product_id
      // has_recipe: true is set ONLY when ingredients come from recipes, not individual ingredients
      if (recipeIngredients.length > 0) {
        const isFromRecipe = Boolean(selectedRecipeId && recipes.find(r => r.id === selectedRecipeId));

        for (const ingredient of recipeIngredients) {
          const amountToCreate = Number(ingredient.requiredQuantity || 1);
          const quantityPerUnit = parseFloat(ingredient.quantity) || 0;

          const recipeIngredientData = {
            product_id: createdProduct.id,
            recipe_id: isFromRecipe ? selectedRecipeId : null,
            ingredient_id: ingredient.id,
            deduct_stock: amountToCreate,           // amount to create
            deduct_amount: quantityPerUnit,         // quantity per unit
          };

          try {
            const createRel = await fetch("/api/recipe-ingredients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recipeIngredientData),
            });
            if (!createRel.ok) {
              console.error(`Failed to create recipe_ingredient for ${ingredient.name}`);
            }
          } catch (e) {
            console.error(`Error linking ingredient ${ingredient.name}:`, e);
          }

          // Deduct system intentionally disabled on product creation per requirements.
        }
      }

      toast.success("Producto agregado exitosamente");
      handleClose();
      if (onProductAdded) {
        onProductAdded();
      }
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error(err instanceof Error ? err.message : "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecipeSelection = (value: string) => {
    setSelectedRecipeId(value);

    if (value === "no-recipe" || !value) {
      setRecipeIngredients([]);
      setNewProduct({ ...newProduct });
      return;
    }

    // Check if it's a recipe or an ingredient
    const selectedRecipe = recipes.find(recipe => recipe.id === value);
    const selectedIngredient = ingredients.find(ingredient => ingredient.id === value);

    if (selectedRecipe) {
      // Handle RECIPE selection - this will set has_recipe: true
      if (selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0) {
        const recipeIngredients = selectedRecipe.recipe_ingredients.filter(ri => !ri.ingredients.is_liquid).map(ri => ({
          id: ri.ingredient_id,
          name: ri.ingredients.name,
          quantity: ri.deduct_amount.toString(), // Use deduct_amount as the quantity
          unit: ri.ingredients.unit,
          deduct_amount: ri.deduct_amount,
          deduct_stock: ri.deduct_stock,
          available_stock: ri.deduct_stock, // Show deduct_stock as available stock
          total_amount: ri.deduct_amount, // Show deduct_amount as total amount
          requiredQuantity: 1,
          is_liquid: ri.ingredients.is_liquid || false,
          isCustom: false,
        }));

        setRecipeIngredients(recipeIngredients);
      } else {
        setRecipeIngredients([]);
      }
    } else if (selectedIngredient) {
      // Handle INDIVIDUAL ingredient selection - this will NOT set has_recipe: true
      const ingredientData = [{
        id: selectedIngredient.id,
        name: selectedIngredient.name,
        quantity: selectedIngredient.quantity.toString(),
        unit: selectedIngredient.unit,
        available_stock: selectedIngredient.stock,
        total_amount: selectedIngredient.quantity, // Use stock directly without calculation
        deduct_stock: selectedIngredient.stock, // Available units
        deduct_amount: selectedIngredient.quantity, // Use stock directly without calculation
        requiredQuantity: 1,
        is_liquid: selectedIngredient.is_liquid,
        isCustom: false,
      }];

      setRecipeIngredients(ingredientData);
      setNewProduct({ ...newProduct });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar Nuevo Producto</DialogTitle>
          <DialogDescription>
            Complete los detalles del producto para agregarlo al inventario.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 px-2 py-4">
          {/* Image Upload */}
          <ImageUpload
            handleSetImageFile={setImageFile}
            imageUrl={newProduct.image_url}
          />

          {/* Basic Product Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                placeholder="Nombre del producto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={newProduct.category}
                onValueChange={(value) =>
                  setNewProduct({ ...newProduct, category: value })
                }
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
            </div>
          </div>

          {/* Toggle Fields */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="space-y-4">
              <h3 className="text-base font-semibold">Configuración del Producto</h3>

              {/* Liquid Product Toggle */}
              {/* <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    ¿Es este un producto líquido?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Los productos líquidos mostrarán el total de cantidad agregada como ingrediente
                  </p>
                </div>
                <Switch
                  checked={newProduct.is_liquid || false}
                  onCheckedChange={(checked) =>
                    setNewProduct({ ...newProduct, is_liquid: checked })
                  }
                />
              </div> */}

              {/* Ingredient Type Toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    ¿Usar este producto como ingrediente en recetas?
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Al activar esta opción, se creará automáticamente una entrada en la tabla de ingredientes
                    con el ID del producto, permitiendo usar este producto como ingrediente en otras recetas.
                  </p>
                </div>
                <Switch
                  checked={newProduct.type === "ingredient"}
                  onCheckedChange={(checked) => {
                    setNewProduct({
                      ...newProduct,
                      type: checked ? "ingredient" : "product",
                      is_liquid: checked,
                    });

                    // Clear recipe/ingredient selections when enabling ingredient mode
                    if (checked) {
                      setSelectedRecipeId("");
                      setRecipeIngredients([]);
                      setUseCustomIngredients(false);
                      setCustomIngredients([]);
                      setSelectedIngredient("none");
                      setCustomIngredientName("");
                      setIngredientQuantity("");
                    }
                  }}
                />
              </div>



              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newProduct.stock === 0 ? "" : newProduct.stock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                />
              </div>

              {/* Total Amount Calculation Display - Show when ingredient type is enabled */}
              {newProduct.type === "ingredient" && (
                <div className="rounded-lg border p-3 bg-blue-50">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-blue-900">
                      Configuración de Ingrediente
                    </Label>
                    <p className="text-xs text-blue-700">
                      Los siguientes valores se guardarán en la tabla de ingredientes:
                    </p>

                    {/* Amount per unit input */}
                    <div className="space-y-2">
                      <Label htmlFor="amount_per_unit" className="text-sm">
                        Cantidad por unidad {newProduct.is_liquid ? "(ml)" : "(unidad)"}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="amount_per_unit"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountPerUnit === 0 ? "" : amountPerUnit}
                        placeholder={newProduct.is_liquid ? "Ej: 500 ml por botella" : "Ej: 1 unidad"}
                        onChange={(e) => setAmountPerUnit(parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>

                    <div className="pt-2 border-t border-blue-200">
                      <span className="text-blue-900 font-semibold">
                        Total Amount (producto): {((newProduct.stock || 0) * amountPerUnit)}
                        {newProduct.is_liquid ? " ml" : " unidades"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipe/Ingredients Selection Field */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Ingredientes (Opcional)
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateRecipeDialog(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Crear Receta
              </Button>
            </div>
            <Select
              value={selectedRecipeId || "no-recipe"}
              onValueChange={handleRecipeSelection}
              disabled={newProduct.type === "ingredient"}
            >
              <SelectTrigger className={newProduct.type === "ingredient" ? "opacity-50 cursor-not-allowed" : ""}>
                <SelectValue placeholder="Seleccionar receta o ingrediente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-recipe">Sin receta</SelectItem>

                {/* Show Recipes from the recipes table */}
                {recipes.length > 0 && (
                  <>
                    <SelectItem value="recipes-header" disabled>
                      <span className="font-semibold text-blue-600">--- Recetas ---</span>
                    </SelectItem>
                    {recipes.map((recipe) => (
                      <SelectItem
                        key={`recipe-${recipe.id}`}
                        value={recipe.id}
                      >
                        {recipe.name} ({recipe.type}) - Receta
                      </SelectItem>
                    ))}
                  </>
                )}

                {/* Show Ingredients from the ingredients table */}
                {ingredients.length > 0 && (
                  <>
                    <SelectItem value="ingredients-header" disabled>
                      <span className="font-semibold text-green-600">--- Ingredientes ---</span>
                    </SelectItem>
                    {ingredients.map((ingredient) => (
                      <SelectItem
                        key={`ingredient-${ingredient.id}`}
                        value={ingredient.id}
                      >
                        {ingredient.name} ({ingredient.unit}) - Ingrediente
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>

            {recipeIngredients.length > 0 && (
              <div className="mt-4 space-y-4">
                <Label className="text-sm font-medium">
                  {selectedRecipeId && recipes.find(r => r.id === selectedRecipeId)
                    ? "Ingredientes de la receta:"
                    : "Ingrediente seleccionado:"}
                </Label>

                <div className="space-y-3">
                  {recipeIngredients.map((ingredient, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Ingrediente
                          </Label>
                          {ingredient.isCustom ? (
                            <Input
                              value={ingredient.name}
                              onChange={(e) => {
                                const updatedIngredients = [...recipeIngredients];
                                updatedIngredients[index].name = e.target.value;
                                setRecipeIngredients(updatedIngredients);
                              }}
                              placeholder="Nombre del ingrediente"
                              className="h-8 text-sm"
                            />
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">
                              {ingredient.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            {ingredient.deduct_stock ? "Stock Total" : "Stock Disponible"}
                          </Label>
                          {ingredient.isCustom ? (
                            <Input
                              type="number"
                              min="0"
                              value={ingredient.available_stock || 0}
                              onChange={(e) => {
                                const updatedIngredients = [...recipeIngredients];
                                updatedIngredients[index].available_stock = parseFloat(e.target.value) || 0;
                                setRecipeIngredients(updatedIngredients);
                              }}
                              placeholder="Stock disponible"
                              className="h-8 text-sm"
                            />
                          ) : (
                            <div>
                              <p className="text-sm font-semibold text-green-600">
                                {ingredient.deduct_stock || ingredient.available_stock || 0} unidades
                              </p>
                              {ingredient.total_amount && (
                                <p className="text-xs text-gray-500">
                                  Total: {ingredient.total_amount} {ingredient.unit}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`quantity-${index}`} className="text-sm font-medium">
                            Cantidad por unidad
                          </Label>
                          <Input
                            id={`quantity-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={ingredient.quantity}
                            onChange={(e) => {
                              const updatedIngredients = [...recipeIngredients];
                              updatedIngredients[index].quantity = e.target.value;
                              setRecipeIngredients(updatedIngredients);
                            }}
                            className="h-9"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`unit-${index}`} className="text-sm font-medium">
                            Unidad
                          </Label>
                          <Select
                            value={ingredient.unit}
                            onValueChange={(value) => {
                              const updatedIngredients = [...recipeIngredients];
                              updatedIngredients[index].unit = value;
                              setRecipeIngredients(updatedIngredients);
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ml">ml</SelectItem>
                              <SelectItem value="L">L</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="unidad">unidad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`required-${index}`} className="text-sm font-medium">
                            Cantidad a crear
                          </Label>
                          <Input
                            id={`required-${index}`}
                            type="number"
                            min="1"
                            value={ingredient.requiredQuantity || 1}
                            onChange={(e) => {
                              const updatedIngredients = [...recipeIngredients];
                              updatedIngredients[index].requiredQuantity = parseInt(e.target.value) || 1;
                              setRecipeIngredients(updatedIngredients);
                            }}
                            className="h-9"
                          />
                        </div>
                      </div>

                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Cantidad por unidad:</span>
                            <p className="font-semibold text-blue-900">
                              {parseFloat(ingredient.quantity).toFixed(2) || 0} {ingredient.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700">Cantidad a crear:</span>
                            <p className="font-semibold text-blue-900">
                              {ingredient.requiredQuantity || 1} unidades
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">

                          <div>
                            <span className="text-blue-700">Cantidad disponible:</span>
                            <p className={`font-semibold ${(ingredient.total_amount || ingredient.available_stock || 0) >= parseFloat(ingredient.quantity)
                              ? 'text-green-600'
                              : 'text-red-600'
                              }`}>
                              {ingredient.total_amount || (ingredient.available_stock || 0)} {ingredient.unit}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700">Stock disponible:</span>
                            <p className={`font-semibold ${(ingredient.deduct_stock || ingredient.available_stock || 0) >= (ingredient.requiredQuantity || 1)
                              ? 'text-green-600'
                              : 'text-red-600'
                              }`}>
                              {ingredient.deduct_stock || ingredient.available_stock || 0} unidades
                            </p>
                          </div>
                        </div>

                        {/* Stock validation */}
                        {((ingredient.deduct_stock || ingredient.available_stock || 0) < (ingredient.requiredQuantity || 1) ||
                          (ingredient.total_amount || ingredient.available_stock || 0) < (ingredient?.requiredQuantity || 1)) && (
                            <p className="text-xs text-red-600 font-medium mt-2">
                              ⚠️ Stock insuficiente
                            </p>
                          )}
                      </div>

                      {recipeIngredients.length > 1 && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedIngredients = recipeIngredients.filter((_, i) => i !== index);
                              setRecipeIngredients(updatedIngredients);
                            }}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            Remover ingrediente
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add custom ingredient button for recipes */}
                {selectedRecipeId && recipes.find(r => r.id === selectedRecipeId) && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        // Add a new custom ingredient to the recipe
                        const newIngredient = {
                          id: `custom-${Date.now()}`,
                          name: "",
                          quantity: "0",
                          unit: "ml",
                          available_stock: 0,
                          requiredQuantity: 1,
                          isCustom: true,
                        };
                        setRecipeIngredients([...recipeIngredients, newIngredient]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar Ingrediente Personalizado
                    </Button>
                  </div>
                )}

                {/* Summary section */}
                {recipeIngredients.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-3">
                      Resumen de Ingredientes
                    </h4>
                    <div className="space-y-2">
                      {recipeIngredients.map((ingredient, index) => {
                        // FIXED: Don't calculate total needed, just use simple quantity and amount
                        const quantityNeeded = parseFloat(ingredient.quantity);
                        const unitsNeeded = ingredient.requiredQuantity || 1;
                        const stockAvailable = ingredient.deduct_stock || ingredient.available_stock || 0;
                        const amountAvailable = ingredient.total_amount || ingredient.available_stock || 0;

                        const hasEnoughStock = stockAvailable >= unitsNeeded && amountAvailable >= quantityNeeded;

                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-blue-800 font-medium">
                                {ingredient.name || 'Sin nombre'}
                              </span>
                              <span className={`font-semibold ${hasEnoughStock ? 'text-green-600' : 'text-red-600'}`}>
                                {!hasEnoughStock && '⚠️ '}
                                {hasEnoughStock ? '✓' : 'Insuficiente'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 ml-2">
                              <div>
                                Stock: {unitsNeeded} / {stockAvailable} unidades
                              </div>
                              <div>
                                Cantidad: {quantityNeeded.toFixed(2)} / {amountAvailable} {ingredient.unit}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-3 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        Al crear este producto, estos ingredientes se descontarán automáticamente del stock.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              Si seleccionas una receta, el stock de los ingredientes se
              descontará automáticamente cuando se haga un pedido.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price">Precio de Compra</Label>
              <Input
                id="purchase_price"
                type="number"
                step="0.01"
                value={
                  newProduct.purchase_price === 0 ? "" : newProduct.purchase_price
                }
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    purchase_price:
                      e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">Precio de Venta</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                value={
                  newProduct.sale_price === 0 ? "" : newProduct.sale_price
                }
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    sale_price:
                      e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button onClick={handleAddProduct} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Agregando...
              </>
            ) : (
              "Agregar Producto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
