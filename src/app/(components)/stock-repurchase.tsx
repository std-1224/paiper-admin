"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useAppContext } from "@/context/AppContext";

interface SelectableItem {
  id: string;
  name: string;
  stock: number;
  purchase_price: number;
  type: "ingredient" | "product";
  unit?: string;
  original_quantity?: number;
}

interface Purchase {
  id: string;
  purchase_date: string;
  supplier: string;
  stock: number;
  unit_price: number;
  notes: string;
  responsible_user?: string;
  resulting_average_cost?: number;
  ingredient_id?: string;
  product_id?: string;
}

interface RepurchaseFormData {
  item_id: string;
  item_type: "ingredient" | "product";
  stock: number;
  unit_price: number;
  supplier: string;
  purchase_date: string;
  notes: string;
}

export function StockRepurchase() {
  const [selectableItems, setSelectableItems] = useState<SelectableItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<SelectableItem | null>(null);
  const [history, setHistory] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { productsData, ingredientsData, fetchIngredients, fetchProducts } =
    useAppContext();

  // Fetch data on component mount
  useEffect(() => {
    fetchIngredients();
    fetchProducts();
  }, [fetchIngredients, fetchProducts]);

  const repurchase = useForm<RepurchaseFormData>({
    defaultValues: {
      item_id: "",
      item_type: "ingredient",
      stock: 1,
      unit_price: 0,
      supplier: "",
      purchase_date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  // Fetch and combine ingredients and products
  useEffect(() => {
    const items: SelectableItem[] = [];

    // Add ingredients (only those with product_id: null)
    if (ingredientsData) {
      ingredientsData
        .filter((ingredient) => ingredient.product_id === null)
        .forEach((ingredient) => {
          items.push({
            id: ingredient.id,
            name: ingredient.name,
            stock: ingredient.stock || 0,
            purchase_price: ingredient.purchase_price || 0,
            type: "ingredient",
            unit: ingredient.unit,
            original_quantity: ingredient.quantity,
          });
        });
    }

    // Add products (except those with is_liquid: false)
    if (productsData) {
      productsData
        .forEach((product) => {
          items.push({
            id: product.id,
            name: product.name,
            stock: product.stock || 0,
            purchase_price: product.purchase_price || 0,
            type: "product",
          });
        });
    }

    setSelectableItems(items);
  }, [productsData, ingredientsData]);

  useEffect(() => {
    if (selectedItem) {
      fetchHistory(selectedItem.id, selectedItem.type);
      repurchase.setValue("item_id", selectedItem.id);
      repurchase.setValue("item_type", selectedItem.type);
    }
  }, [repurchase, selectedItem]);

  // Update selected item when selectableItems data changes (after refresh)
  useEffect(() => {
    if (selectedItem && selectableItems.length > 0) {
      const updatedItem = selectableItems.find(item => item.id === selectedItem.id);
      if (updatedItem && (
        updatedItem.stock !== selectedItem.stock ||
        updatedItem.purchase_price !== selectedItem.purchase_price
      )) {
        setSelectedItem(updatedItem);
      }
    }
  }, [selectableItems, selectedItem]);

  const fetchHistory = async (
    itemId: string,
    itemType: "ingredient" | "product"
  ) => {
    try {
      const queryParam =
        itemType === "ingredient"
          ? `ingredient_id=${itemId}`
          : `product_id=${itemId}`;
      const response = await fetch(`/api/ingredient-purchases?${queryParam}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmitRepurchase = async (data: RepurchaseFormData) => {
    setIsLoading(true);
    try {
      const requestBody = {
        ...data,
        ingredient_id: data.item_type === "ingredient" ? data.item_id : null,
        product_id: data.item_type === "product" ? data.item_id : null,
      };

      const response = await fetch("/api/ingredient-purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        toast.success("Purchase recorded successfully");
        repurchase.reset();

        // Refresh all data to show updated stock and prices
        await fetchIngredients();
        await fetchProducts();

        // Refresh purchase history
        fetchHistory(data.item_id, data.item_type);
      } else {
        throw new Error("Failed to record purchase");
      }
    } catch {
      toast.error("Failed to record purchase");
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemSelect = (itemId: string) => {
    const item = selectableItems.find((i) => i.id === itemId);
    setSelectedItem(item || null);
    if (item) {
      repurchase.setValue("item_id", itemId);
      repurchase.setValue("item_type", item.type);
    }
  };

  return (
    <div className="h-[80vh] overflow-y-auto">
      <Form {...repurchase}>
        <form
          onSubmit={repurchase.handleSubmit(handleSubmitRepurchase)}
          className="space-y-4 py-2"
        >
          <FormField
            control={repurchase.control}
            name="item_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product/Ingredient</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleItemSelect(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a product or ingredient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {selectableItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name} (
                          {item.type === "ingredient"
                            ? "Ingredient"
                            : "Product"}
                          )
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={repurchase.control}
            name="stock"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0.01}
                    {...field}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || 0);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={repurchase.control}
            name="unit_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unit Purchase Price</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => {
                      field.onChange(parseFloat(e.target.value) || 0);
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={repurchase.control}
            name="supplier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supplier</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Premium Liquors S.A.">
                      Premium Liquors S.A.
                    </SelectItem>
                    <SelectItem value="Central Distributor">
                      Central Distributor
                    </SelectItem>
                    <SelectItem value="Local Wholesale Co.">
                      Local Wholesale Co.
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={repurchase.control}
            name="purchase_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Current Stock & Average Cost */}
          {selectedItem && (
            <div className="grid grid-cols-2 gap-4 py-4 border rounded-lg p-3">
              <div>
                <Label className="text-sm text-muted-foreground">
                  Current Stock
                </Label>
                <p className="text-lg font-semibold">{selectedItem.stock}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">
                  Current Average Cost
                </Label>
                <p className="text-lg font-semibold">
                  ${selectedItem.purchase_price.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <FormField
            control={repurchase.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Additional details" {...field} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={
                isLoading ||
                !selectedItem ||
                !repurchase.watch("stock") ||
                !repurchase.watch("unit_price")
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Repurchase"
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Purchase History */}
      {selectedItem && history.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">
            Purchase History for {selectedItem.name}
          </h3>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Avg Cost</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {new Date(purchase.purchase_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{purchase.supplier}</TableCell>
                    <TableCell>{purchase.stock.toFixed(2)}</TableCell>
                    <TableCell>${purchase.unit_price.toFixed(2)}</TableCell>
                    <TableCell>
                      {purchase.responsible_user || "John Smith"}
                    </TableCell>
                    <TableCell>
                      $
                      {purchase.resulting_average_cost?.toFixed(2) ||
                        purchase.unit_price.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {purchase.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
