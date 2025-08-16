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
import { Edit, X, Clock, Package, Users, Save, Upload, DollarSign } from "lucide-react";

import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import ImageUpload from "./image-upload";

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
  const { uploadImageToSupabase } = useAppContext();

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    purchase_price: "",
    sale_price: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [associatedProduct, setAssociatedProduct] = useState<any>(null);

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
        });

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
      [field]: value
    }));
  };



  const handleSave = async () => {
    if (!recipe) return;

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
          is_active: true,
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

        setIsEditing(false);
        setImageFile(null);
        toast.success('Recipe updated successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(`Failed to update recipe: ${errorData.error || 'Unknown error'}`);
      }
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
                      <Label htmlFor="purchase-price">Purchase Price</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="purchase-price"
                          type="number"
                          step="0.01"
                          value={editForm.purchase_price}
                          onChange={(e) => handleFormChange('purchase_price', e.target.value)}
                          placeholder="0.00"
                          className="pl-10"
                          disabled={associatedProduct}
                          title={!associatedProduct ? "Purchase price only available for recipes with associated products" : ""}
                        />
                      </div>
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
                Ingredients ({recipe.recipe_ingredients?.length || 0})
              </h4>

              {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 ? (
                <div className="space-y-3">
                  {recipe.recipe_ingredients.map((recipeIngredient: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">
                            {recipeIngredient.ingredients?.name || 'Unknown ingredient'}
                          </h5>
                          <p className="text-sm text-gray-500 mt-1">
                            Unit: {recipeIngredient.ingredients?.unit || 'N/A'}
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Quantity:</span> {recipeIngredient.deduct_quantity} {recipeIngredient.ingredients?.unit || ''}
                          </div>

                          <Badge className="bg-blue-50 text-blue-700 border-blue-200">
                            Available Quantity: {recipeIngredient.ingredients?.quantity || 0} {recipeIngredient.ingredients?.unit || ''}
                          </Badge>
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
