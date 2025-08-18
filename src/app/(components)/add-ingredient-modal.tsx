"use client";

import { useState } from "react";
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

interface AddIngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIngredientAdded?: () => void;
}

export default function AddIngredientModal({
  isOpen,
  onClose,
  onIngredientAdded,
}: AddIngredientModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stock, setStock] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [addingIngredient, setAddingIngredient] = useState(false);

  const { fetchProducts } = useAppContext();

  const resetForm = () => {
    setName("");
    setUnit("");
    setQuantity("");
    setStock("");
    setPurchasePrice("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addNewIngredientToStock = async () => {
    if (!name.trim()) {
      toast.error("El nombre del ingrediente es requerido");
      return;
    }

    if (!unit.trim()) {
      toast.error("La unidad es requerida");
      return;
    }

    if (!quantity.trim()) {
      toast.error("La cantidad es requerida");
      return;
    }

    setAddingIngredient(true);
    try {
      const response = await fetch("/api/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: null,
          name: name.trim(),
          unit: unit,
          quantity: parseFloat(quantity) || 0,
          stock: parseFloat(stock) || 0,
          purchase_price: parseFloat(purchasePrice) || 0,
          is_liquid: false, // Default to false, can be updated later for product creation

        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear ingrediente");
      }

      toast.success(`Ingrediente "${name}" agregado exitosamente`);

      // Reset form and close modal
      resetForm();
      onClose();

      // Refresh products data
      await fetchProducts();

      // Call the callback if provided
      if (onIngredientAdded) {
        onIngredientAdded();
      }
    } catch (error) {
      console.error("Error adding ingredient:", error);
      toast.error(error instanceof Error ? error.message : "Error al agregar ingrediente");
    } finally {
      setAddingIngredient(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Ingredient</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="ingredientName" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ingredientName"
              placeholder="Enter the ingredient name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredientUnit" className="text-sm font-medium">
              Unit <span className="text-red-500">*</span>
            </Label>
            <Select
              value={unit}
              onValueChange={(value) => setUnit(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select the unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="g">Grams (g)</SelectItem>
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="L">Liters (L)</SelectItem>
                <SelectItem value="mL">Milliliters (mL)</SelectItem>
                <SelectItem value="units">Units</SelectItem>
                <SelectItem value="pieces">Pieces</SelectItem>
                <SelectItem value="cups">Cups</SelectItem>
                <SelectItem value="tbsp">Tablespoons</SelectItem>
                <SelectItem value="tsp">Teaspoons</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-medium">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              placeholder="Enter the quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock" className="text-sm font-medium">
              Stock
            </Label>
            <Input
              id="stock"
              placeholder="Enter the stock amount"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchasePrice" className="text-sm font-medium">
              Purchase Price ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="purchasePrice"
              placeholder="Enter the purchase price for the total stock"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              type="number"
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>

        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={addingIngredient}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={addNewIngredientToStock}
            disabled={addingIngredient || !name.trim() || !unit.trim() || !quantity.trim() || !purchasePrice.trim()}
            className="flex-1 bg-black text-white hover:bg-gray-800"
          >
            {addingIngredient ? "Saving..." : "Save Ingredient"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
