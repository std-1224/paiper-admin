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
import { Edit, X, Clock, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecipeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: number | null;
  onEditRecipe?: (id: number) => void;
}

export default function RecipeDetailsModal({
  isOpen,
  onClose,
  recipeId,
  onEditRecipe,
}: RecipeDetailsModalProps) {
  const [recipe, setRecipe] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Fetch recipe details when modal opens
  const fetchRecipeDetails = async () => {
    if (!recipeId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/recipes/${recipeId}`);
      if (response.ok) {
        const recipeData = await response.json();
        setRecipe(recipeData);
        console.log('Fetched recipe details:', recipeData);
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
    onClose();
  };

  const handleEdit = () => {
    if (recipe && onEditRecipe) {
      onEditRecipe(recipe.id);
      handleClose();
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
              <h3 className="text-lg font-semibold mb-3">{recipe.name}</h3>
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
                  <label className="text-sm font-medium text-gray-600">Quantity</label>
                  <div className="mt-1 text-sm">
                    {recipe.quantity} {recipe.unit}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Stock Available</label>
                  <div className="mt-1">
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
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <div className="mt-1 text-sm text-gray-500">
                    {new Date(recipe.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
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
                            <span className="font-medium">Amount needed:</span> {recipeIngredient.deduct_quantity} {recipeIngredient.ingredients?.unit || ''}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Stock to deduct:</span> {recipeIngredient.deduct_stock}
                          </div>
                          <Badge
                            className={cn(
                              (recipeIngredient.ingredients?.stock || 0) >= recipeIngredient.deduct_stock
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            Available Stock: {recipeIngredient.ingredients?.stock || 0}
                          </Badge>
                          <Badge
                            className={cn(
                              (recipeIngredient.ingredients?.stock || 0) >= recipeIngredient.deduct_stock
                                ? "bg-green-50 text-green-700 border-green-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            Available Quantity: {recipeIngredient.ingredients?.quantity || 0}
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

            {/* Recipe Summary */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-md font-semibold mb-2 text-blue-900">Recipe Summary</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Total Ingredients:</span>
                  <span className="ml-2">{recipe.recipe_ingredients?.length || 0}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Recipe Yield:</span>
                  <span className="ml-2">{recipe.quantity} {recipe.unit}</span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Stock Status:</span>
                  <span className="ml-2">
                    {recipe.stock > 0 ? `${recipe.stock} available` : 'Out of stock'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Last Updated:</span>
                  <span className="ml-2">
                    {new Date(recipe.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
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
          {recipe && (
            <Button onClick={handleEdit} className="gap-2">
              <Edit className="h-4 w-4" />
              Edit Recipe
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
