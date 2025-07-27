"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Search, Filter, Minus, Plus, Upload } from "lucide-react";
import { Product } from "@/types/types";
import { useAppContext } from "@/context/AppContext";

interface MenuProps {
  onAddToCart: (item: Product) => void;
  userTableId?: string | null;
  isTableOrder?: boolean;
}

export function Menu({ onAddToCart, userTableId, isTableOrder = false }: MenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const { fetchProducts, productsData } = useAppContext();

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query, active category, and table restrictions
  const filteredProducts = productsData.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Apply category filter
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;

    // Apply table restrictions - if user is at a table, only show bottles and specific categories
    const matchesTableRestriction = !isTableOrder || !userTableId ||
      product.category === "bottles" ||
      product.category === "champagne" ||
      product.category === "whisky" ||
      product.category === "vodka" ||
      product.category === "gin" ||
      product.category === "rum" ||
      product.category === "tequila";

    return matchesSearch && matchesCategory && matchesTableRestriction;
  });

  // Get unique categories from products, filtered by table restrictions if applicable
  const availableProducts = isTableOrder && userTableId
    ? productsData.filter(product =>
        product.category === "bottles" ||
        product.category === "champagne" ||
        product.category === "whisky" ||
        product.category === "vodka" ||
        product.category === "gin" ||
        product.category === "rum" ||
        product.category === "tequila"
      )
    : productsData;

  const categories = [
    "all",
    ...Array.from(new Set(availableProducts.map((product) => product.category))),
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Table restriction indicator */}
      {isTableOrder && userTableId && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Menú de Mesa:</strong> Solo se muestran botellas y bebidas premium disponibles para mesas.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2 p-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Rest of your existing component */}
      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={setActiveCategory}
      >
        <TabsList className="w-full justify-start">
          {categories.map((category) => (
            <TabsTrigger key={category} value={category} className="capitalize">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ScrollArea className="flex-1 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="aspect-square relative mb-4">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="object-cover rounded-lg w-[100%]"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold">{product.name}</h3>
                {product.description && (
                  <p className="text-sm text-gray-500">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold">${product.sale_price}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onAddToCart(product)}
                  >
                    Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}