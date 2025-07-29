"use client";

import { useState, useEffect } from "react";
import {
  Book,
  CoffeeIcon as Cocktail,
  Edit,
  Leaf,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import Loading from "./loading";
import { Recipe } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { categoryList } from "@/lib/utils";

export default function RecipeConfiguration() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddRecipeModal, setShowAddRecipeModal] = useState(false);
  const [newIngredients, setNewIngredients] = useState<
    { name: string; quantity: string; unit: string }[]
  >([]);
  const [recipeName, setRecipeName] = useState("");
  const [selectedIngredient, setSelectedIngredient] = useState("none");
  const [customIngredient, setCustomIngredient] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("ml");
  const [selectedRecipe, setSelectedRecipe] = useState<number | null>(null);
  const [amount, setAmount] = useState<string>("");
  const { fetchRecipes, recipesData } = useAppContext();
  const [category, setCategory] = useState("bebida");
  const [loading, setLoading] = useState(false);

  const filteredRecipes = recipesData.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchRecipes();
  }, []);
  // Calculate most used products
  const mostUsedProducts = [
    { name: "Mojito", count: 1 },
    { name: "Margarita", count: 1 },
    { name: "Piña Colada", count: 1 },
  ];

  // Calculate most used ingredients
  const ingredientCounts: Record<string, number> = {};
  recipesData.forEach((recipe) => {
    recipe.ingredients.forEach((ingredient) => {
      if (ingredientCounts[ingredient.name]) {
        ingredientCounts[ingredient.name]++;
      } else {
        ingredientCounts[ingredient.name] = 1;
      }
    });
  });

  const mostUsedIngredients = Object.entries(ingredientCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  const addNewIngredient = () => {
    // Determine which ingredient name to use
    let ingredientName = "";
    if (selectedIngredient === "none") {
      ingredientName = customIngredient;
    } else if (selectedIngredient) {
      ingredientName = selectedIngredient;
    } else {
      ingredientName = customIngredient;
    }
    
    // Validate that ingredient name and quantity are provided
    if (!ingredientName.trim()) {
      alert("Por favor ingresa el nombre del ingrediente");
      return;
    }
    if (!quantity.trim()) {
      alert("Por favor ingresa la cantidad del ingrediente");
      return;
    }

    setNewIngredients([
      ...newIngredients,
      { name: ingredientName.trim(), quantity: quantity, unit: unit },
    ]);
    setSelectedIngredient("none");
    setCustomIngredient("");
    setQuantity("");
    setUnit("ml");
  };

  const addNewRecipe = async () => {
    setLoading(true);
    // Convert amount to number, default to 0 if empty or invalid
    const numericAmount = amount === "" ? 0 : Number(amount);
    const res = await fetch("/api/recipe", {
      method: "POST",
      body: JSON.stringify({
        name: recipeName,
        ingredients: JSON.stringify(newIngredients),
        amount: numericAmount,
        category: category,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to add recipe");
    }
    handleInitRecipe();
    fetchRecipes();
    setLoading(false);
  };

  const handleInitRecipe = () => {
    setRecipeName("");
    setNewIngredients([]);
    setShowAddRecipeModal(false);
    setSelectedRecipe(null);
    setAmount("");
    setCategory("");
    setSelectedIngredient("none");
    setCustomIngredient("");
  };

  const updateRecipe = async () => {
    setLoading(true);
    // Convert amount to number, default to 0 if empty or invalid
    const numericAmount = amount === "" ? 0 : Number(amount);
    const res = await fetch("/api/recipe", {
      method: "PUT",
      body: JSON.stringify({
        id: selectedRecipe,
        name: recipeName,
        ingredients: JSON.stringify(newIngredients),
        amount: numericAmount,
        category: category,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to update recipe");
    }
    handleInitRecipe();
    fetchRecipes();
    setLoading(false);
  };

  const handleEditRecipe = (id: number) => {
    setSelectedRecipe(id);
    setRecipeName(recipesData.find((recipe) => recipe.id === id)?.name || "");
    setAmount(
      String(recipesData.find((recipe) => recipe.id === id)?.stock || "")
    );
    setNewIngredients(
      recipesData.find((recipe) => recipe.id === id)?.ingredients || []
    );
    fetchRecipes();
    setShowAddRecipeModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Configuración de Recetas</h1>
        <Button className="gap-2" onClick={() => setShowAddRecipeModal(true)}>
          <Cocktail size={16} />
          Añadir nueva receta
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Book className="text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                Total de Recetas
              </div>
              <div className="text-2xl font-bold text-blue-500">
                {recipesData.length}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Cocktail className="text-purple-500" />
            </div>
            <div className="text-sm text-muted-foreground">
              Productos Más Usados
            </div>
          </div>
          <div className="space-y-2">
            {mostUsedProducts.map((product) => (
              <div
                key={product.name}
                className="flex justify-between items-center"
              >
                <div>{product.name}</div>
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200"
                >
                  {product.count} recetas
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Leaf className="text-green-500" />
            </div>
            <div className="text-sm text-muted-foreground">
              Ingredientes Más Utilizados
            </div>
          </div>
          <div className="space-y-2">
            {mostUsedIngredients.map((ingredient) => (
              <div
                key={ingredient.name}
                className="flex justify-between items-center"
              >
                <div>{ingredient.name}</div>
                <Badge
                  variant="outline"
                  className="bg-green-50 text-green-700 border-green-200"
                >
                  {ingredient.count} veces
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar receta..."
          className="pl-8"
          // value={recipeName}
          // onChange={(e) => setRecipeName(e.target.value)}
        />
      </div>

      {/* Recipe Cards */}
      {recipesData.length === 0 ? (
        <Loading />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecipes.map((recipe) => (
              <div key={recipe.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">{recipe.name}</h3>
                  <Button
                    onClick={() => handleEditRecipe(recipe.id)}
                    variant="ghost"
                    size="icon"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {recipe.stock !== null ? (
                  <Badge
                    className={cn(
                      "mb-3",
                      recipe.stock > 0
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    )}
                  >
                    {recipe.stock} disponibles
                  </Badge>
                ) : (
                  <Badge className="mb-3 bg-red-50 text-red-700 border-red-200">
                    No disponible
                  </Badge>
                )}

                <div className="text-sm font-medium mb-2">Ingredientes:</div>
                <div className="space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{ingredient.name}</span>
                      <span className="text-muted-foreground">
                        {ingredient.quantity} {ingredient.unit}
                      </span>
                    </div>
                  ))}
                </div>

                {recipe.stock === null && (
                  <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded border border-red-200">
                    Falta stock de ingredientes
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Recipe Modal */}
      <Dialog
        open={showAddRecipeModal}
        onOpenChange={(open) => {
          setShowAddRecipeModal(open);
          handleInitRecipe();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cocktail className="h-5 w-5" />
              {selectedRecipe ? "Editar Receta" : "Crear Nueva Receta"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recipeName">Nombre del Producto Elaborado</Label>
              <Input
                id="recipeName"
                placeholder="Ej: Mojito, Margarita, etc."
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </div>

            {/* Input amount of Recipe */}
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input
                type="number"
                placeholder="Ingrese la cantidad"
                value={amount}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers and empty string
                  if (
                    value === "" ||
                    (Number(value) >= 0 && !value.includes("-"))
                  ) {
                    setAmount(value);
                  }
                }}
                onKeyDown={(e) => {
                  // Prevent minus key, plus key, and 'e' key
                  if (
                    e.key === "-" ||
                    e.key === "+" ||
                    e.key === "e" ||
                    e.key === "E"
                  ) {
                    e.preventDefault();
                  }
                }}
                min="0"
                step="0.01"
              />
            </div>

            {/* Select category of Recipe */}
            <Select
              value={category}
              onValueChange={(value) => setCategory(value)}
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

            <div className="space-y-2">
              <Label>Ingredientes</Label>
              {newIngredients.length === 0 ? (
                <div className="bg-muted/50 p-6 text-center rounded-md">
                  No hay ingredientes agregados
                </div>
              ) : (
                <div className="space-y-2">
                  {newIngredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <div className="flex-grow">
                        {ingredient.name || "Ingrediente sin nombre"}
                      </div>
                      <div>
                        {ingredient.quantity} {ingredient.unit}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setNewIngredients(
                            newIngredients.filter((_, i) => i !== index)
                          )
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Agregar Ingrediente</Label>
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-5">
                  <Label className="mb-2 block">Ingrediente</Label>
                  <div className="space-y-2">
                    <Select
                      value={selectedIngredient}
					  disabled={customIngredient ? true : false}
                      onValueChange={(value) => setSelectedIngredient(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ingrediente" />
                      </SelectTrigger>
                      <SelectContent>
					  <SelectItem value="none">none</SelectItem>
                        <SelectItem value="Ginebra">Ginebra</SelectItem>
                        <SelectItem value="vodka">Vodka</SelectItem>
                        <SelectItem value="tónica">Tónica</SelectItem>
                        <SelectItem value="ron">Ron</SelectItem>
                        <SelectItem value="tequila">Tequila</SelectItem>
                        <SelectItem value="limon">Limón</SelectItem>
                        <SelectItem value="azucar">Azúcar</SelectItem>
                        <SelectItem value="menta">Menta</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-center text-sm text-muted-foreground">o</div>
                    <Input
						disabled={selectedIngredient !== "none" ? true : false}
                      placeholder="Escribir ingrediente personalizado"
                      value={customIngredient}
                      onChange={(e) => setCustomIngredient(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addNewIngredient();
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <Label htmlFor="quantity" className="sr-only">
                    Cantidad
                  </Label>
                  <Input
                    type="number"
                    placeholder="Ingrese cantidad"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow positive numbers and empty string
                      if (
                        value === "" ||
                        (Number(value) >= 0 && !value.includes("-"))
                      ) {
                        setQuantity(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      // Prevent minus key, plus key, and 'e' key
                      if (
                        e.key === "-" ||
                        e.key === "+" ||
                        e.key === "e" ||
                        e.key === "E"
                      ) {
                        e.preventDefault();
                      }
                      // Allow Enter to add ingredient
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addNewIngredient();
                      }
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="unit" className="sr-only">
                    Unidad
                  </Label>
                  <Select
                    value={unit}
                    onValueChange={(value) => setUnit(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ml">ml</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="unidad">unidad</SelectItem>
                      <SelectItem value="hojas">hojas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={addNewIngredient}
                    disabled={
                      quantity.trim() === "" ||
                      (selectedIngredient === "none" && customIngredient.trim() === "") ||
                      (selectedIngredient !== "none" && selectedIngredient.trim() === "")
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleInitRecipe}>
              Cancelar
            </Button>
            <Button onClick={selectedRecipe ? updateRecipe : addNewRecipe}>
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Procesando...
                </div>
              ) : selectedRecipe ? (
                "Actualizar Receta"
              ) : (
                "Crear Receta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

    // ---------------------
  );
}
