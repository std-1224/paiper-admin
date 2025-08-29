"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Edit, X, Clock, Package, Users, Save, Upload, DollarSign, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import ImageUpload from "./image-upload";
import { useAuth } from "@/context/AuthContext";

interface RecipeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string | null;
  onEditRecipe?: (id: string) => void;
}

export default function RecipeDetailsModal({
  isOpen,
  onClose,
  recipeId,
  onEditRecipe,
}: RecipeDetailsModalProps) {
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { uploadImageToSupabase, ingredientsData } = useAppContext();
  const { user } = useAuth();

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    purchase_price: "",
    sale_price: "",
    image_url: "",
    is_active: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [associatedProduct, setAssociatedProduct] = useState<any>(null);

  // Ingredient selection state for adding new ingredients
  const [selectedIngredientId, setSelectedIngredientId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");

  // Local state for managing recipe ingredients during editing
  const [localRecipeIngredients, setLocalRecipeIngredients] = useState<any[]>([]);
  // Track original ingredients to detect changes
  const [originalRecipeIngredients, setOriginalRecipeIngredients] = useState<any[]>([]);

  // Fetch recipe details when modal opens
  const fetchRecipeDetails = async () => {
    if (!recipeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const recipeData = await response.json();
        setRecipe(recipeData);

        // Fetch associated product by recipe_id
        let productData = null;
        try {
          const productResponse = await fetch(`/api/products/by-recipe/${recipeData.id}`);
          if (productResponse.ok) {
            productData = await productResponse.json();
            setAssociatedProduct(productData);
          }
        } catch (error) {
          console.error('Error fetching associated product:', error);
        }

        // Populate edit form with current data
        setEditForm({
          name: recipeData.name || "",
          description: productData?.description || "",
          purchase_price: productData?.purchase_price?.toString() || "",
          sale_price: recipeData.sale_price?.toString() || productData?.sale_price?.toString() || "",
          image_url: productData?.image_url || "",
          is_active: recipeData?.is_active || false,
        });

        // Initialize local ingredients state with current recipe ingredients
        const ingredients = recipeData.recipe_ingredients || [];
        setLocalRecipeIngredients(ingredients);
        // Store original ingredients for change detection
        setOriginalRecipeIngredients(JSON.parse(JSON.stringify(ingredients)));

        console.log('Fetched recipe details:', recipeData);
        if (productData) {
          console.log('Fetched associated product:', productData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch recipe details:', response.status, errorData);
        toast.error(`Failed to load recipe details: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      toast.error('Error loading recipe details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && recipeId) {
      fetchRecipeDetails();
    }
  }, [isOpen, recipeId]);

  // Auto-calculate purchase price when ingredients change
  useEffect(() => {
    if (localRecipeIngredients.length > 0 && ingredientsData.length > 0) {
      const calculatedPrice = calculatePurchasePrice();
      setEditForm(prev => ({
        ...prev,
        purchase_price: calculatedPrice.toFixed(2)
      }));
    }
  }, [localRecipeIngredients, ingredientsData]);

  const handleClose = () => {
    setRecipe(null);
    setAssociatedProduct(null);
    setIsEditing(false);
    setImageFile(null);
    onClose();
  };



  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleFormChange = (field: string, value: string) => {
    setEditForm(prev => ({
      ...prev,
      [field]: field === 'is_active' ? value === 'true' : value
    }));
  };

  // Calculate total purchase price based on ingredients
  const calculatePurchasePrice = () => {
    let totalPrice = 0;

    localRecipeIngredients.forEach(recipeIngredient => {
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

  // Add ingredient to recipe (local state only, save on "Save Changes")
  const addIngredientToRecipe = () => {
    if (!selectedIngredientId) {
      toast.error("Please select an ingredient");
      return;
    }

    if (!ingredientQuantity.trim()) {
      toast.error("Please enter the quantity");
      return;
    }

    const selectedIngredient = ingredientsData.find(ing => ing.id === selectedIngredientId);
    if (!selectedIngredient) {
      toast.error("Ingredient not found");
      return;
    }

    // Check if ingredient is already in the list
    const existingIngredient = localRecipeIngredients.find(ri => ri.ingredient_id === selectedIngredientId);
    if (existingIngredient) {
      toast.error("This ingredient is already added to the recipe");
      return;
    }

    const deductAmount = parseFloat(ingredientQuantity) || 0;

    // Create new recipe ingredient object for local state
    const newRecipeIngredient = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      recipe_id: recipe.id,
      ingredient_id: selectedIngredientId,
      deduct_quantity: deductAmount,
      deduct_stock: 0,
      ingredients: selectedIngredient, // Include ingredient details for display
      isNew: true // Flag to identify new ingredients when saving
    };

    console.log("🔍 Adding new ingredient to local state:", newRecipeIngredient);

    // Add to local state
    setLocalRecipeIngredients(prev => {
      const updated = [...prev, newRecipeIngredient];
      console.log("🔍 Updated local ingredients list:", updated);
      return updated;
    });

    // Reset ingredient form
    setSelectedIngredientId("");
    setIngredientQuantity("");
    setIngredientUnit("");

    toast.success("Ingredient added to recipe (will be saved when you click Save Changes)");
  };

  // Remove ingredient from recipe (both local state and database)
  const removeIngredientFromRecipe = async (ingredientId: string) => {
    const ingredientToRemove = localRecipeIngredients.find(ri => ri.ingredient_id === ingredientId);

    if (!ingredientToRemove) {
      toast.error("Ingredient not found");
      return;
    }

    // If it's a new ingredient (not yet saved to database), just remove from local state
    if (ingredientToRemove.isNew) {
      setLocalRecipeIngredients(prev => prev.filter(ri => ri.ingredient_id !== ingredientId));
      toast.success("Ingredient removed from recipe");
      return;
    }

    // If it's an existing ingredient, remove from database
    try {
      const response = await fetch(`/api/recipe-ingredients?id=${ingredientToRemove.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to delete ingredient:', errorData);
        toast.error(`Failed to remove ingredient: ${errorData.error || 'Unknown error'}`);
        return;
      }

      // Remove from local state after successful database deletion
      setLocalRecipeIngredients(prev => prev.filter(ri => ri.ingredient_id !== ingredientId));
      toast.success(`Ingredient "${ingredientToRemove.ingredients?.name}" removed from recipe`);

      console.log(`✅ Successfully removed ingredient ${ingredientToRemove.ingredients?.name} from database`);
    } catch (error) {
      console.error('Error removing ingredient:', error);
      toast.error('Error removing ingredient. Please try again.');
    }
  };

  // Update ingredient quantity in local list
  const updateIngredientQuantity = (ingredientId: string, newQuantity: number) => {
    setLocalRecipeIngredients(prev =>
      prev.map(ri =>
        ri.ingredient_id === ingredientId
          ? { ...ri, deduct_quantity: newQuantity, isModified: true }
          : ri
      )
    );
  };

  // Helper function to categorize ingredient changes
  const categorizeIngredientChanges = () => {
    const newIngredients = localRecipeIngredients.filter(ri => ri.isNew);
    const modifiedIngredients = localRecipeIngredients.filter(ri => ri.isModified && !ri.isNew);
    const unchangedIngredients = localRecipeIngredients.filter(ri => !ri.isNew && !ri.isModified);

    return { newIngredients, modifiedIngredients, unchangedIngredients };
  };

  const handleSave = async () => {
    if (!recipe) return;

    console.log("🔍 HandleSave called with recipe:", recipe.id, "and local ingredients:", localRecipeIngredients);

    setSaving(true);
    try {
      let imageUrl = editForm.image_url;

      // Upload new image if selected
      if (imageFile) {
        const fileName = `recipe-${Date.now()}.${imageFile.name.split(".").pop()}`;
        const uploadResult = await uploadImageToSupabase(imageFile, fileName);
        if (uploadResult) {
          imageUrl = uploadResult;
        }
      }

      // Only handle product updates if recipe is not active
      if (editForm.is_active) {
        // GET recipe via API
        const response = await fetch(`/api/recipes/${recipeId}`);

        if (response.ok) {
          const updatedRecipe = await response.json();

          // Create or update product record
          const productData = {
            name: editForm.name,
            description: editForm.description,
            category: recipe.category || "recipe",
            image_url: imageUrl,
            purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : null,
            sale_price: editForm.sale_price ? parseFloat(editForm.sale_price) : null,
            is_active: editForm.is_active, // Use the form value instead of hardcoding
            is_pr: false,
            is_courtsey: false,
            type: "product",
            has_recipe: true,
            ingredient_id: null,
            recipe_id: recipeId,
            updated_at: new Date().toISOString(),
          };

          try {
            let productResponse;
            if (associatedProduct) {
              // Update existing product
              productResponse = await fetch(`/api/products`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  id: associatedProduct.id,
                  ...productData,
                }),
              });
            } else {
              // Create new product
              productResponse = await fetch(`/api/products`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(productData),
              });
            }

            if (productResponse.ok) {
              const updatedProduct = await productResponse.json();
              setAssociatedProduct(updatedProduct);
            } else {
              const errorData = await productResponse.json().catch(() => ({}));
              console.error('Failed to save product:', errorData);
            }
          } catch (error) {
            console.error('Error saving product:', error);
          }

          setRecipe(updatedRecipe);

          // Refetch the associated product to get updated data
          try {
            const productResponse = await fetch(`/api/products/by-recipe/${recipe.id}`);
            if (productResponse.ok) {
              const updatedProductData = await productResponse.json();
              setAssociatedProduct(updatedProductData);

              // Update form with the latest product data
              setEditForm(prev => ({
                ...prev,
                description: updatedProductData?.description || "",
                purchase_price: updatedProductData?.purchase_price?.toString() || "",
                sale_price: updatedProductData?.sale_price?.toString() || prev.sale_price,
                image_url: updatedProductData?.image_url || "",
              }));
            }
          } catch (error) {
            console.error('Error refetching product data:', error);
          }

          // Create audit log for recipe update
          if (user && recipe) {
            try {
              const changes = [];
              if (recipe.name !== editForm.name) changes.push(`Nombre: "${recipe.name}" → "${editForm.name}"`);
              if (recipe.description !== editForm.description) changes.push(`Descripción actualizada`);
              if (recipe.purchase_price !== parseFloat(editForm.purchase_price)) changes.push(`Precio compra: ${recipe.purchase_price} → ${parseFloat(editForm.purchase_price)}`);
              if (recipe.sale_price !== parseFloat(editForm.sale_price)) changes.push(`Precio venta: ${recipe.sale_price} → ${parseFloat(editForm.sale_price)}`);
              if (recipe.is_active !== editForm.is_active) changes.push(`Estado: ${recipe.is_active ? 'Activo' : 'Inactivo'} → ${editForm.is_active ? 'Activo' : 'Inactivo'}`);

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
                    target_id: recipeId,
                    target_name: editForm.name,
                    description: `Receta actualizada: ${changes.join(', ')}`,
                    changes_before: {
                      name: recipe.name,
                      description: recipe.description,
                      purchase_price: recipe.purchase_price,
                      sale_price: recipe.sale_price,
                      is_active: recipe.is_active
                    },
                    changes_after: {
                      name: editForm.name,
                      description: editForm.description,
                      purchase_price: parseFloat(editForm.purchase_price),
                      sale_price: parseFloat(editForm.sale_price),
                      is_active: editForm.is_active
                    },
                    status: "success"
                  }),
                });
              }
            } catch (auditError) {
              console.error("Error creating audit log:", auditError);
            }
          }

          setIsEditing(false);
          setImageFile(null);
          toast.success('Recipe updated successfully');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch recipe for update:', errorData);
          toast.error(`Failed to update recipe: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        // For active recipes, just update the UI state without product API calls
        setIsEditing(false);
        setImageFile(null);
        console.log("ℹ️ Recipe is active, skipping product updates");
      }

      // Save recipe ingredient changes (always run regardless of is_active status)
      const { newIngredients, modifiedIngredients, unchangedIngredients } = categorizeIngredientChanges();

      console.log("🔍 Ingredient changes summary:", {
        total: localRecipeIngredients.length,
        new: newIngredients.length,
        modified: modifiedIngredients.length,
        unchanged: unchangedIngredients.length,
        is_active: editForm.is_active,
      });

      let totalOperations = 0;
      let successfulOperations = 0;

      // Handle new ingredients
      if (newIngredients.length > 0) {
        console.log(`📝 Creating ${newIngredients.length} new ingredients`);
        try {
          for (const ingredient of newIngredients) {
            totalOperations++;
            console.log("📝 Creating ingredient:", {
              recipe_id: recipe.id,
              ingredient_id: ingredient.ingredient_id,
              deduct_quantity: ingredient.deduct_quantity,
              deduct_stock: ingredient.deduct_stock || 0,
            });

            const response = await fetch("/api/recipe-ingredients", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipe_id: recipe.id,
                ingredient_id: ingredient.ingredient_id,
                deduct_quantity: ingredient.deduct_quantity,
                deduct_stock: ingredient.deduct_stock || 0,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error(`❌ Failed to create ingredient ${ingredient.ingredients?.name}:`, errorData);
              toast.warning(`Failed to create ingredient: ${ingredient.ingredients?.name}`);
            } else {
              successfulOperations++;
              const savedIngredient = await response.json();
              console.log(`✅ Successfully created ingredient ${ingredient.ingredients?.name}:`, savedIngredient);
            }
          }
        } catch (error) {
          console.error('❌ Error creating new ingredients:', error);
        }
      }

      // Handle modified ingredients
      if (modifiedIngredients.length > 0) {
        console.log(`📝 Updating ${modifiedIngredients.length} modified ingredients`);
        try {
          for (const ingredient of modifiedIngredients) {
            totalOperations++;
            console.log("📝 Updating ingredient:", {
              id: ingredient.id,
              recipe_id: recipe.id,
              ingredient_id: ingredient.ingredient_id,
              deduct_quantity: ingredient.deduct_quantity,
              deduct_stock: ingredient.deduct_stock || 0,
            });

            const response = await fetch("/api/recipe-ingredients", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: ingredient.id,
                recipe_id: recipe.id,
                ingredient_id: ingredient.ingredient_id,
                deduct_quantity: ingredient.deduct_quantity,
                deduct_stock: ingredient.deduct_stock || 0,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error(`❌ Failed to update ingredient ${ingredient.ingredients?.name}:`, errorData);
              toast.warning(`Failed to update ingredient: ${ingredient.ingredients?.name}`);
            } else {
              successfulOperations++;
              const updatedIngredient = await response.json();
              console.log(`✅ Successfully updated ingredient ${ingredient.ingredients?.name}:`, updatedIngredient);
            }
          }
        } catch (error) {
          console.error('❌ Error updating modified ingredients:', error);
        }
      }

      // Log unchanged ingredients (no action needed)
      if (unchangedIngredients.length > 0) {
        console.log(`ℹ️ ${unchangedIngredients.length} ingredients unchanged (no action needed)`);
      }

      // Show summary message
      if (totalOperations > 0) {
        if (successfulOperations === totalOperations) {
          toast.success(`Successfully processed ${successfulOperations} ingredient change(s)`);
        } else {
          toast.warning(`Processed ${successfulOperations}/${totalOperations} ingredient changes`);
        }
        console.log(`✅ Ingredient operations completed: ${successfulOperations}/${totalOperations} successful`);
      } else {
        console.log("ℹ️ No ingredient changes to save");
      }

      // Refresh recipe details to get updated ingredients
      await fetchRecipeDetails();
    } catch (error) {
      console.error('Error updating recipe:', error);
      toast.error('Error updating recipe. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Recipe Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading recipe details...</span>
          </div>
        ) : recipe ? (
          <div className="space-y-6">
            {/* Basic Recipe Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="recipe-name">Recipe Name</Label>
                    <Input
                      id="recipe-name"
                      value={editForm.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Enter recipe name"
                    />
                  </div>

                  {/* Only show product-related fields when recipe is not active */}
                  {editForm.is_active && (
                    <>
                      <div>
                        <Label htmlFor="recipe-description">Description</Label>
                        <Input
                          id="recipe-description"
                          value={editForm.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Enter recipe description"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="purchase-price">
                            Purchase Price
                            <span className="text-xs text-blue-600 ml-1">(Auto-calculated)</span>
                          </Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="purchase-price"
                              type="number"
                              step="0.01"
                              value={editForm.purchase_price}
                              onChange={(e) => handleFormChange('purchase_price', e.target.value)}
                              placeholder="0.00"
                              className="pl-10 bg-blue-50"
                              readOnly
                              title="Purchase price is automatically calculated based on ingredient costs"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Calculated from ingredient prices and quantities
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="sale-price">Sale Price</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="sale-price"
                              type="number"
                              step="0.01"
                              value={editForm.sale_price}
                              onChange={(e) => handleFormChange('sale_price', e.target.value)}
                              placeholder="0.00"
                              className="pl-10"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>Image</Label>
                        <div className={associatedProduct ? "opacity-50 pointer-events-none" : ""}>
                          <ImageUpload
                            handleSetImageFile={setImageFile}
                            imageUrl={editForm.image_url}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{recipe.name}</h3>
                    {(associatedProduct?.image_url || editForm.image_url) && (
                      <img
                        src={associatedProduct?.image_url || editForm.image_url}
                        alt={recipe.name}
                        className="h-16 w-16 object-cover rounded-lg border"
                      />
                    )}
                  </div>

                  {associatedProduct?.description && (
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <div className="mt-1 text-sm text-gray-900">
                        {associatedProduct.description}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="capitalize">
                          {recipe.type}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <div className="mt-1 text-sm text-gray-500">
                        {new Date(recipe.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Product Information Section */}
                  {associatedProduct && (
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Product Information
                      </h4>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-700">
                              {associatedProduct?.purchase_price ? `$${associatedProduct.purchase_price.toFixed(2)}` : '-'}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              Purchase Price
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {recipe.sale_price ? `$${recipe.sale_price.toFixed(2)}` : associatedProduct?.sale_price ? `$${associatedProduct.sale_price.toFixed(2)}` : '-'}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Sale Price
                            </div>
                          </div>
                        </div>


                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ingredients Section */}
            <div>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Ingredients ({isEditing ? localRecipeIngredients.length : (recipe.recipe_ingredients?.length || 0)})
              </h4>



              {/* Use local ingredients when editing, otherwise use recipe ingredients */}
              {(() => {
                const ingredientsToShow = isEditing ? localRecipeIngredients : recipe.recipe_ingredients;
                return ingredientsToShow && ingredientsToShow.length > 0 ? (
                  <div className="space-y-3">
                    {ingredientsToShow.map((recipeIngredient: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900 flex items-center gap-2">
                            {recipeIngredient.ingredients?.name || 'Unknown ingredient'}
                            {recipeIngredient.isNew && (
                              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">New</Badge>
                            )}
                            {recipeIngredient.isModified && !recipeIngredient.isNew && (
                              <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-700">Modified</Badge>
                            )}
                          </h5>
                          <p className="text-sm text-gray-500 mt-1">
                            Unit: {recipeIngredient.ingredients?.unit || 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right space-y-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Label className="text-xs font-medium">Quantity:</Label>
                                  <Input
                                    type="number"
                                    disabled={editForm.is_active}
                                    step="0.01"
                                    value={recipeIngredient.deduct_quantity}
                                    onChange={(e) => updateIngredientQuantity(recipeIngredient.ingredient_id, parseFloat(e.target.value) || 0)}
                                    className="w-20 h-8 text-sm"
                                    min="0"
                                  />
                                  <span className="text-xs text-gray-500">{recipeIngredient.ingredients?.unit || ''}</span>
                                </div>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                  Available: {recipeIngredient.ingredients?.quantity || 0} {recipeIngredient.ingredients?.unit || ''}
                                </Badge>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm">
                                  <span className="font-medium">Quantity:</span> {recipeIngredient.deduct_quantity} {recipeIngredient.ingredients?.unit || ''}
                                </div>
                                <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                                  Available Quantity: {recipeIngredient.ingredients?.quantity || 0} {recipeIngredient.ingredients?.unit || ''}
                                </Badge>
                              </div>
                            )}
                          </div>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={editForm.is_active}
                              onClick={() => removeIngredientFromRecipe(recipeIngredient.ingredient_id)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              title={recipeIngredient.isNew ? "Remove from list" : "Delete from database"}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No ingredients added to this recipe</p>
                </div>
              );
              })()}

              {/* Add Ingredient Section - Only show in editing mode */}
              {isEditing && (
                <div className="border-t pt-4 mt-6 space-y-4">
                  <Label className="text-base font-medium">Add Ingredient</Label>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ingredientSelect">Select Ingredient</Label>
                      <Select
                        value={selectedIngredientId}
                        disabled={editForm.is_active}
                        onValueChange={(value) => {
                          setSelectedIngredientId(value);
                          // Auto-populate unit when ingredient is selected
                          const selectedIngredient = ingredientsData.find(ing => ing.id === value);
                          if (selectedIngredient) {
                            setIngredientUnit(selectedIngredient.unit || "");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an ingredient" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientsData.length === 0 ? (
                            <SelectItem value="no-ingredients" disabled>
                              No ingredients available
                            </SelectItem>
                          ) : (
                            ingredientsData.map((ingredient) => (
                              <SelectItem key={ingredient.id} value={ingredient.id}>
                                <div className="flex justify-between items-center w-full gap-2">
                                  <span className="flex-1">{ingredient.name}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">{ingredient.quantity} {ingredient.unit || ""}</span>
                                    <span className={`text-xs px-1 py-0.5 rounded ${
                                      ingredient.stock > 10 ? 'bg-green-100 text-green-800' :
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
                            step="0.01"
                            placeholder="0.00"
                            value={ingredientQuantity}
                            onChange={(e) => setIngredientQuantity(e.target.value)}
                            className="h-10"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">Unit</Label>
                          <Input
                            value={ingredientUnit}
                            onChange={(e) => setIngredientUnit(e.target.value)}
                            placeholder="Unit"
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
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Recipe not found</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {recipe && !isEditing && (
            <Button onClick={handleEditToggle} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Recipe
            </Button>
          )}
          {recipe && isEditing && (
            <>
              <Button variant="outline" onClick={handleEditToggle}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
