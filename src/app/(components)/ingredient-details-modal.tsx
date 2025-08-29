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
import { Edit, X, Clock, Package, Beaker, Droplets, Save, Upload, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import ImageUpload from "./image-upload";

interface IngredientDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientId: string | null;
  onEditIngredient?: (id: string) => void;
}

export default function IngredientDetailsModal({
  isOpen,
  onClose,
  ingredientId,
  onEditIngredient,
}: IngredientDetailsModalProps) {
  const [ingredient, setIngredient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { uploadImageToSupabase, fetchIngredients } = useAppContext();
  const { user } = useAuth();

  // Form state for editing
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    unit: "",
    quantity: "",
    stock: "",
    sale_price: "",
    is_liquid: false,
    is_active: false,
    // Product fields (if ingredient has associated product)
    purchase_price: "",
    image_url: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [associatedProduct, setAssociatedProduct] = useState<any>(null);

  // Fetch ingredient details when modal opens
  const fetchIngredientDetails = async () => {
    if (!ingredientId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/ingredients/${ingredientId}`);
      if (response.ok) {
        const ingredientData = await response.json();
        setIngredient(ingredientData);

        // Fetch associated product by ingredient_id
        let productData = null;
        try {
          const productResponse = await fetch(`/api/products/by-ingredient/${ingredientData.id}`);
          if (productResponse.ok) {
            productData = await productResponse.json();
            setAssociatedProduct(productData);
          }
        } catch (error) {
          console.error('Error fetching associated product:', error);
        }

        // Populate edit form with current data
        setEditForm({
          name: ingredientData.name || "",
          description: productData?.description || "",
          unit: ingredientData.unit || "",
          quantity: ingredientData.quantity?.toString() || "",
          stock: ingredientData.stock?.toString() || "",
          sale_price: ingredientData.sale_price?.toString() || "",
          is_liquid: ingredientData.is_liquid || false,
          is_active: ingredientData.is_active || false,
          // Product fields
          purchase_price: ingredientData.purchase_price?.toString() || "",
          image_url: productData?.image_url || "",
        });

        console.log('Fetched ingredient details:', ingredientData);
        if (productData) {
          console.log('Fetched associated product:', productData);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch ingredient details:', response.status, errorData);
        toast.error(`Failed to load ingredient details: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching ingredient details:', error);
      toast.error('Error loading ingredient details. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ingredientId) {
      fetchIngredientDetails();
    }
  }, [isOpen, ingredientId]);

  const handleClose = () => {
    setIngredient(null);
    setAssociatedProduct(null);
    setIsEditing(false);
    setImageFile(null);
    onClose();
  };



  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleFormChange = (field: string, value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSave = async () => {
    if (!ingredient) return;

    setSaving(true);
    try {
      // Update ingredient via API
      const ingredientUpdateData = {
        id: ingredient.id,
        name: editForm.name,
        quantity: editForm.quantity ? parseFloat(editForm.quantity) : ingredient.quantity,
        stock: editForm.stock ? parseFloat(editForm.stock) : ingredient.stock,
        purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : ingredient.purchase_price,
        unit: editForm.unit || ingredient.unit,
        is_liquid: ingredient.is_liquid,
        is_active: editForm.is_active, // Use the edited value from form
        product_id: ingredient.product_id,
        updated_at: new Date().toISOString(),
      };

      const ingredientResponse = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ingredientUpdateData),
      });

      if (!ingredientResponse.ok) {
        const errorData = await ingredientResponse.json().catch(() => ({}));
        throw new Error(`Failed to update ingredient: ${errorData.error || 'Unknown error'}`);
      }

      const updatedIngredient = await ingredientResponse.json();

      // Create audit log for ingredient update
      if (user) {
        try {
          const changes = [];
          if (ingredient.name !== editForm.name) changes.push(`Nombre: "${ingredient.name}" → "${editForm.name}"`);
          if (ingredient.stock !== parseFloat(editForm.stock)) changes.push(`Stock: ${ingredient.stock} → ${parseFloat(editForm.stock)}`);
          if (ingredient.quantity !== parseFloat(editForm.quantity)) changes.push(`Cantidad: ${ingredient.quantity} → ${parseFloat(editForm.quantity)}`);
          if (ingredient.purchase_price !== parseFloat(editForm.purchase_price)) changes.push(`Precio: ${ingredient.purchase_price} → ${parseFloat(editForm.purchase_price)}`);
          if (ingredient.unit !== editForm.unit) changes.push(`Unidad: "${ingredient.unit}" → "${editForm.unit}"`);
          if (ingredient.is_active !== editForm.is_active) changes.push(`Estado: ${ingredient.is_active ? 'Activo' : 'Inactivo'} → ${editForm.is_active ? 'Activo' : 'Inactivo'}`);

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
                action_type: "ingredient_update",
                target_type: "ingredient",
                target_id: updatedIngredient.id,
                target_name: updatedIngredient.name,
                description: `Ingrediente actualizado: ${changes.join(', ')}`,
                changes_before: {
                  name: ingredient.name,
                  stock: ingredient.stock,
                  quantity: ingredient.quantity,
                  purchase_price: ingredient.purchase_price,
                  unit: ingredient.unit,
                  is_active: ingredient.is_active
                },
                changes_after: {
                  name: editForm.name,
                  stock: parseFloat(editForm.stock),
                  quantity: parseFloat(editForm.quantity),
                  purchase_price: parseFloat(editForm.purchase_price),
                  unit: editForm.unit,
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

      // Handle image upload
      let imageUrl = editForm.image_url;
      if (imageFile) {
        const fileName = `ingredient-${Date.now()}.${imageFile.name.split(".").pop()}`;
        const uploadResult = await uploadImageToSupabase(imageFile, fileName);
        if (uploadResult) {
          imageUrl = uploadResult;
        }
      }

      // Create or update product record
      const productData = {
        name: editForm.name,
        description: editForm.description,
        category: "ingredient",
        stock: editForm.stock ? parseFloat(editForm.stock) : 0,
        image_url: imageUrl,
        purchase_price: editForm.purchase_price ? parseFloat(editForm.purchase_price) : null,
        sale_price: editForm.sale_price ? parseFloat(editForm.sale_price) : null,
        is_active: editForm.is_active, // Match the ingredient's is_active status
        is_pr: false,
        is_courtsey: false,
        type: "product",
        has_recipe: false,
        ingredient_id: ingredient.id,
        recipe_id: null,
        updated_at: new Date().toISOString(),
      };

      // Always update product table when ingredient is active or when product already exists
      if (editForm.is_active || associatedProduct) {
        try {
          let productResponse;
          if (associatedProduct) {
            // Update existing product with same is_active status as ingredient
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
          } else if (editForm.is_active) {
            // Create new product only if ingredient is active
            productResponse = await fetch(`/api/products`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(productData),
            });
          }

          if (productResponse && productResponse.ok) {
            const updatedProduct = await productResponse.json();
            setAssociatedProduct(updatedProduct);
            console.log('✅ Product updated successfully with is_active:', editForm.is_active);
          } else if (productResponse) {
            const errorData = await productResponse.json().catch(() => ({}));
            console.error('Failed to save product:', errorData);
            toast.warning('Ingredient updated but product update failed');
          }
        } catch (error) {
          console.error('Error saving product:', error);
          toast.warning('Ingredient updated but product update failed');
        }
      }

      setIngredient(updatedIngredient);

      // Refetch the associated product to get updated data
      try {
        const productResponse = await fetch(`/api/products/by-ingredient/${ingredient.id}`);
        if (productResponse.ok) {
          const updatedProductData = await productResponse.json();
          setAssociatedProduct(updatedProductData);

          // Update form with the latest product data
          setEditForm(prev => ({
            ...prev,
            description: updatedProductData?.description || "",
            purchase_price: updatedProductData?.purchase_price?.toString() || "",
            sale_price: updatedProductData?.sale_price?.toString() || prev.sale_price,
            stock: updatedProductData?.stock?.toString() || prev.stock,
            image_url: updatedProductData?.image_url || "",
          }));
        }
      } catch (error) {
        console.error('Error refetching product data:', error);
      }

      // Refresh ingredients data to reflect changes in the main list
      await fetchIngredients();

      setIsEditing(false);
      setImageFile(null);
      toast.success('Ingredient updated successfully');
    } catch (error) {
      console.error('Error updating ingredient:', error);
      toast.error(error instanceof Error ? error.message : 'Error updating ingredient. Please try again.');
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
            <Beaker className="h-5 w-5" />
            Ingredient Details
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading ingredient details...</span>
          </div>
        ) : ingredient ? (
          <div className="space-y-6">
            {/* Basic Ingredient Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ingredient-name">Ingredient Name</Label>
                      <Input
                        id="ingredient-name"
                        value={editForm.name}
                        onChange={(e) => handleFormChange('name', e.target.value)}
                        placeholder="Enter ingredient name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={editForm.unit}
                        onChange={(e) => handleFormChange('unit', e.target.value)}
                        placeholder="e.g., ml, g, pieces"
                      />
                    </div>
                  </div>

                  {editForm.is_active && (
                    <>
                      <div>
                        <Label htmlFor="ingredient-description">Description</Label>
                        <Input
                          id="ingredient-description"
                          value={editForm.description}
                          onChange={(e) => handleFormChange('description', e.target.value)}
                          placeholder="Enter ingredient description"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
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
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <Label>Image</Label>
                        <ImageUpload
                          handleSetImageFile={setImageFile}
                          imageUrl={editForm.image_url}
                        />
                      </div>
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quantity">Total Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={editForm.quantity}
                        onChange={(e) => handleFormChange('quantity', e.target.value)}
                        placeholder="0"
                      />
                    </div>

                    <div>
                      <Label htmlFor="stock">Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={editForm.stock}
                        onChange={(e) => handleFormChange('stock', e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>


                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">{ingredient.name}</h3>
                    {(associatedProduct?.image_url || editForm.image_url) && (
                      <img
                        src={associatedProduct?.image_url || editForm.image_url}
                        alt={ingredient.name}
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
                      <label className="text-sm font-medium text-gray-600">Unit</label>
                      <div className="mt-1">
                        <Badge variant="outline" className="capitalize">
                          {ingredient.unit}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Type</label>
                      <div className="mt-1 flex items-center gap-2">
                        {ingredient.is_liquid ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Droplets className="h-3 w-3 mr-1" />
                            Liquid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <Package className="h-3 w-3 mr-1" />
                            Solid
                          </Badge>
                        )}
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
                              {associatedProduct.purchase_price ? `$${associatedProduct.purchase_price.toFixed(2)}` : '-'}
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              Purchase Price
                            </div>
                          </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-700">
                              {ingredient.sale_price ? `$${ingredient.sale_price.toFixed(2)}` : associatedProduct?.sale_price ? `$${associatedProduct.sale_price.toFixed(2)}` : '-'}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Sale Price
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-700">
                              {associatedProduct.stock || 0}
                            </div>
                            <div className="text-sm text-orange-600 font-medium">
                              Product Stock
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stock Information */}
            <div>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Information
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {ingredient.quantity || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Total Quantity ({ingredient.unit})
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {ingredient.stock || 0}
                    </div>
                    <div className="text-sm text-gray-500">
                      Available Stock
                    </div>
                  </div>
                </div>

                {associatedProduct && (<div className="border rounded-lg p-4 bg-white">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ingredient.sale_price ? `$${ingredient.sale_price.toFixed(2)}` : '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      Sale Price
                    </div>
                  </div>
                </div>)}
              </div>
            </div>

            {/* Status Information */}
            <div>
              <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status & Dates
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Active Status</span>
                  <Badge
                    className={cn(
                      ingredient.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {ingredient.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-white border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Created</span>
                  <span className="text-sm text-gray-500">
                    {new Date(ingredient.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-white border rounded-lg">
                  <span className="text-sm font-medium text-gray-600">Last Updated</span>
                  <span className="text-sm text-gray-500">
                    {new Date(ingredient.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Association */}
            {ingredient.product_id && (
              <div>
                <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product Association
                </h4>

                <div className="border rounded-lg p-4 bg-white">
                  <div className="text-sm">
                    <span className="font-medium">Associated Product ID:</span> {ingredient.product_id}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Ingredient not found</p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {ingredient && !isEditing && (
            <Button onClick={handleEditToggle} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Ingredient
            </Button>
          )}
          {ingredient && isEditing && (
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
