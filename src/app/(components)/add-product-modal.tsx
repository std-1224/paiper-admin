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

import { Badge } from "@/components/ui/badge";
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
import { Loader2, Plus, Package, ChefHat, Info, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "./image-upload";
import { useAppContext } from "@/context/AppContext";
import { Ingredient, Recipe } from "@/types/database";

// Extended interface for recipe ingredients with nested ingredient data
interface RecipeIngredientWithDetails {
  id: string;
  ingredient_id: string;
  deduct_quantity: number;
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

  // Handle item selection for preview
  const handleItemSelection = (value: string) => {
    setSelectedItemForPreview(value);

    if (value === "no-selection" || !value) {
      setSelectedItemType(null);
      setCustomQuantityPerUnit(0);
      return;
    }

    // Check if it's a recipe or an ingredient
    const selectedRecipe = recipes.find(recipe => recipe.id === value);
    const selectedIngredient = ingredients.find(ingredient => ingredient.id === value);

    if (selectedRecipe) {
      setSelectedItemType('recipe');
      setCustomQuantityPerUnit(0);
    } else if (selectedIngredient) {
      setSelectedItemType('ingredient');
      // Initialize with the ingredient's default quantity
      setCustomQuantityPerUnit(selectedIngredient.quantity || 0);
    } else {
      setSelectedItemType(null);
      setCustomQuantityPerUnit(0);
    }
  };

  // Add ingredient to the list
  const addIngredientToList = () => {
    const selectedIngredient = ingredients.find(ing => ing.id === selectedItemForPreview);
    if (selectedIngredient && !addedIngredientsList.find(item => item.id === selectedIngredient.id)) {
      const quantityToUse = customQuantityPerUnit || selectedIngredient.quantity;

      // Calculate deduction logic: amount per unit / per unit
      const deductStock = Math.floor(quantityToUse / selectedIngredient.quantity);
      const deductQuantity = quantityToUse % selectedIngredient.quantity;

      const newIngredient = {
        ...selectedIngredient,
        customQuantityPerUnit: quantityToUse,
        deduct_stock: deductStock,
        deduct_quantity: deductQuantity,
        totalQuantityNeeded: quantityToUse
      };
      setAddedIngredientsList([...addedIngredientsList, newIngredient]);
      setSelectedItemForPreview('');
      setSelectedItemType(null);
      setCustomQuantityPerUnit(0);
    }
  };

  // Add recipe to the list
  const addRecipeToList = () => {
    const selectedRecipe = recipes.find(recipe => recipe.id === selectedItemForPreview);
    if (selectedRecipe && !addedRecipesList.find(item => item.id === selectedRecipe.id)) {
      const newRecipe = {
        ...selectedRecipe,
        quantityToUse: quantityToCreate
      };
      setAddedRecipesList([...addedRecipesList, newRecipe]);
      setSelectedItemForPreview('');
      setSelectedItemType(null);
      setQuantityToCreate(1);
    }
  };

  // Remove ingredient from list
  const removeIngredientFromList = (ingredientId: string) => {
    setAddedIngredientsList(addedIngredientsList.filter(item => item.id !== ingredientId));
  };

  // Remove recipe from list
  const removeRecipeFromList = (recipeId: string) => {
    setAddedRecipesList(addedRecipesList.filter(item => item.id !== recipeId));
  };

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
    deduct_quantity?: number;
    deduct_stock?: number;
    available_stock: number;
    total_amount?: number;
    requiredQuantity?: number;
    is_liquid?: boolean;
    isCustom?: boolean;
  }[]>([]);
  const [ingredientRequiredQuantity, setIngredientRequiredQuantity] = useState(1);
  const [selectedIngredient, setSelectedIngredient] = useState("none");

  // Enhanced ingredient/recipe selection states
  const [selectedItemForPreview, setSelectedItemForPreview] = useState<string>('');
  const [selectedItemType, setSelectedItemType] = useState<'recipe' | 'ingredient' | null>(null);
  const [addedIngredientsList, setAddedIngredientsList] = useState<any[]>([]);
  const [addedRecipesList, setAddedRecipesList] = useState<any[]>([]);
  const [quantityToCreate, setQuantityToCreate] = useState<number>(1);
  const [customQuantityPerUnit, setCustomQuantityPerUnit] = useState<number>(0);
  const [customIngredientName, setCustomIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("ml");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [amountPerUnit, setAmountPerUnit] = useState<number>(0);

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

    // Reset enhanced selection states
    setSelectedItemForPreview('');
    setSelectedItemType(null);
    setAddedIngredientsList([]);
    setAddedRecipesList([]);
    setQuantityToCreate(1);
    setCustomQuantityPerUnit(0);
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

      // Determine if product has ingredients or recipes
      const hasIngredients = addedIngredientsList.length > 0;
      const hasRecipes = addedRecipesList.length > 0;
      const hasRecipeIngredients = recipeIngredients.length > 0;
      const hasAnyIngredients = hasIngredients || hasRecipes || hasRecipeIngredients;

      const productData = {
        ...newProduct,
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        image_url: uploadedUrl,
        has_recipe: hasAnyIngredients, // Set to true when product has any ingredients/recipes
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
            deduct_quantity: quantityPerUnit,         // quantity per unit
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

      // 4) Create recipe_ingredients entries for added individual ingredients
      // Case: Individual ingredients linked to product
      if (addedIngredientsList.length > 0) {
        for (const ingredient of addedIngredientsList) {
          const recipeIngredientData = {
            product_id: createdProduct.id,     // product.id
            recipe_id: null,                   // null for individual ingredients
            ingredient_id: ingredient.id,      // ingredient.id
            deduct_stock: ingredient.deduct_stock,      // calculated deduct_stock
            deduct_quantity: ingredient.deduct_quantity, // calculated deduct_quantity
          };

          try {
            const createRel = await fetch("/api/recipe-ingredients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recipeIngredientData),
            });

            if (!createRel.ok) {
              console.error(`Failed to create recipe_ingredient for individual ingredient ${ingredient.name}`);
            }
          } catch (e) {
            console.error(`Error linking individual ingredient ${ingredient.name}:`, e);
          }
        }
      }

      // 5) Create recipe_ingredients entries for added recipes
      // Case: Recipes linked to product
      if (addedRecipesList.length > 0) {
        for (const recipe of addedRecipesList) {
          const recipeIngredientData = {
            product_id: createdProduct.id,     // product.id
            recipe_id: recipe.id,              // recipe.id
            ingredient_id: null,               // null for recipes
            deduct_stock: recipe.quantityToUse, // amount to create
            deduct_quantity: 0,                // 0 for recipes
          };

          try {
            const createRel = await fetch("/api/recipe-ingredients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(recipeIngredientData),
            });

            if (!createRel.ok) {
              console.error(`Failed to create recipe_ingredient for recipe ${recipe.name}`);
            }
          } catch (e) {
            console.error(`Error linking recipe ${recipe.name}:`, e);
          }
        }
      }

      // 6) If this product should also become an ingredient (Case 1 from your description)
      // This would be handled separately when user explicitly creates a product as an ingredient
      // For now, we only handle Case 2 (Product has individual ingredients and recipes)

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

          {/* Enhanced Recipe/Ingredients Selection Field */}
          <div className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Ingredientes (Opcional)
              </Label>
            </div>

            {/* Selection Dropdown */}
            <Select
              value={selectedItemForPreview || "no-selection"}
              onValueChange={handleItemSelection}
              disabled={newProduct.type === "ingredient"}
            >
              <SelectTrigger className={newProduct.type === "ingredient" ? "opacity-50 cursor-not-allowed" : ""}>
                <SelectValue placeholder="Seleccionar receta o ingrediente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no-selection">Seleccionar...</SelectItem>

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

            {/* Detailed Preview Section */}
            {selectedItemType === 'ingredient' && (() => {
              const selectedIngredient = ingredients.find(ing => ing.id === selectedItemForPreview);
              if (!selectedIngredient) return null;

              return (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="mb-3">
                    <h4 className="font-medium text-gray-900">Ingrediente Seleccionado:</h4>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{selectedIngredient.name}</span>
                      <div className="text-right">
                        <div className="text-green-600 font-semibold">
                          Stock Total: {selectedIngredient.stock} unidades
                        </div>
                        <div className="text-sm text-gray-500">
                          Total: {selectedIngredient.quantity} {selectedIngredient.unit}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="custom-quantity-per-unit" className="text-sm font-medium">Cantidad por unidad</Label>
                        <Input
                          id="custom-quantity-per-unit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={customQuantityPerUnit}
                          onChange={(e) => setCustomQuantityPerUnit(parseFloat(e.target.value) || 0)}
                          className="h-8"
                          placeholder={`${selectedIngredient.quantity}`}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Por defecto: {selectedIngredient.quantity} {selectedIngredient.unit}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Unidad</Label>
                        <div className="text-lg font-semibold">
                          {selectedIngredient.unit}
                        </div>
                      </div>
                    </div>
                    {customQuantityPerUnit > 0 && (
                      <div className="p-3 bg-blue-50 rounded border border-blue-300">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-blue-900">Cálculo de Deducción:</h5>
                          <Button
                            type="button"
                            size="sm"
                            onClick={addIngredientToList}
                            className="gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Agregar
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">deduct_stock:</span>
                            <p className="font-semibold text-blue-900">
                              {Math.floor(customQuantityPerUnit / selectedIngredient.quantity)} unidades
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-700">deduct_quantity:</span>
                            <p className="font-semibold text-blue-900">
                              {customQuantityPerUnit % selectedIngredient.quantity} {selectedIngredient.unit}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Recipe Preview Section */}
            {selectedItemType === 'recipe' && (() => {
              const selectedRecipe = recipes.find(recipe => recipe.id === selectedItemForPreview);
              if (!selectedRecipe) return null;

              return (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Receta Seleccionada:</h4>
                    <Button
                      type="button"
                      size="sm"
                      onClick={addRecipeToList}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-lg">{selectedRecipe.name}</span>
                      <div className="text-right">
                        <div className="text-blue-600 font-semibold">
                          Tipo: {selectedRecipe.type}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium">Nombre de la Receta</Label>
                        <div className="text-lg font-semibold text-blue-600">
                          {selectedRecipe.name}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="recipe-quantity-to-create" className="text-sm font-medium">Cantidad a crear</Label>
                        <Input
                          id="recipe-quantity-to-create"
                          type="number"
                          min="1"
                          value={quantityToCreate}
                          onChange={(e) => setQuantityToCreate(parseInt(e.target.value) || 1)}
                          className="h-8"
                        />
                      </div>
                    </div>

                    {/* Recipe Ingredients */}
                    {selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-2">Ingredientes de la Receta:</h5>
                        <div className="space-y-2">
                          {selectedRecipe.recipe_ingredients.map((recipeIngredient, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="font-medium">
                                {recipeIngredient.ingredients?.name || 'Ingrediente desconocido'}
                              </span>
                              <div className="text-right">
                                <div className="text-blue-700">
                                  {recipeIngredient.deduct_quantity} {recipeIngredient.ingredients?.unit}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Stock: {recipeIngredient.ingredients?.stock || 0} unidades
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Compact Added Ingredients List */}
            {addedIngredientsList.length > 0 && (
              <div className="border rounded-lg p-3 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-medium text-emerald-900">Ingredientes Agregados</h4>
                  <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
                    {addedIngredientsList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {addedIngredientsList.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border group hover:bg-emerald-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{ingredient.name}</span>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                            {ingredient.totalQuantityNeeded} {ingredient.unit}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span>Por unidad: {ingredient.customQuantityPerUnit} {ingredient.unit}</span>
                          <span>Stock: {ingredient.deduct_stock}</span>
                          <span>Cantidad: {ingredient.deduct_quantity} {ingredient.unit}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIngredientFromList(ingredient.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Added Recipes List */}
            {addedRecipesList.length > 0 && (
              <div className="border rounded-lg p-3 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Recetas Agregadas</h4>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">
                    {addedRecipesList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {addedRecipesList.map((recipe, index) => (
                    <div key={index} className="bg-white p-2 rounded border group hover:bg-blue-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{recipe.name}</span>
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                            {recipe.quantityToUse} unidades
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRecipeFromList(recipe.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {recipe.recipe_ingredients.map((ri: any, riIndex: number) => (
                              <span key={riIndex} className="bg-gray-100 px-2 py-1 rounded">
                                {ri.ingredients?.name}: {ri.deduct_quantity * recipe.quantityToUse} {ri.ingredients?.unit}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
