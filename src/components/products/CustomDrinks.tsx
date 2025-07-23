
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Check, Pencil } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

// Mock data for custom drinks
const customDrinksData = [
  { 
    id: 1, 
    name: "Cuba Libre", 
    category: "Ron", 
    ingredients: [
      { name: "Ron Havana", amount: "50ml" },
      { name: "Coca-Cola", amount: "200ml" },
      { name: "Limón", amount: "1 rodaja" },
    ],
    price: "$850",
    sold: 45,
    bar: "Bar Central"
  },
  { 
    id: 2, 
    name: "Gin Tonic Premium", 
    category: "Gin", 
    ingredients: [
      { name: "Gin Beefeater", amount: "60ml" },
      { name: "Agua Tónica", amount: "200ml" },
      { name: "Pepino", amount: "2 rodajas" },
    ],
    price: "$950",
    sold: 68,
    bar: "Bar Norte"
  },
  { 
    id: 3, 
    name: "Fernet Cola", 
    category: "Fernet", 
    ingredients: [
      { name: "Fernet Branca", amount: "70ml" },
      { name: "Coca-Cola", amount: "180ml" },
    ],
    price: "$800",
    sold: 82,
    bar: "Bar Central"
  },
  { 
    id: 4, 
    name: "Vodka Tonic", 
    category: "Vodka", 
    ingredients: [
      { name: "Vodka Absolut", amount: "50ml" },
      { name: "Agua Tónica", amount: "200ml" },
      { name: "Limón", amount: "1 rodaja" },
    ],
    price: "$850",
    sold: 52,
    bar: "El Alamo"
  },
];

// Mock data for ingredient consumption
const ingredientConsumptionData = [
  { id: 1, name: "Ron Havana 750ml", used: "2.25 litros", drinks: "45 Cuba Libres", remaining: "3 botellas" },
  { id: 2, name: "Gin Beefeater 750ml", used: "4.08 litros", drinks: "68 Gin Tonics", remaining: "2 botellas" },
  { id: 3, name: "Fernet Branca 750ml", used: "5.74 litros", drinks: "82 Fernet Cola", remaining: "4 botellas" },
  { id: 4, name: "Vodka Absolut 750ml", used: "2.6 litros", drinks: "52 Vodka Tonics", remaining: "5 botellas" },
  { id: 5, name: "Coca-Cola 2L", used: "23.46 litros", drinks: "127 tragos mixtos", remaining: "8 botellas" },
  { id: 6, name: "Agua Tónica 1.5L", used: "24 litros", drinks: "120 tragos mixtos", remaining: "6 botellas" },
];

// New component for custom drinks that can be used in multiple pages
export const CustomDrinks = ({ selectedBar = "all", showCheckboxes = false }: { selectedBar?: string, showCheckboxes?: boolean }) => {
  const [selectedDrinks, setSelectedDrinks] = useState<number[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  
  const toggleDrinkSelection = (drinkId: number) => {
    setSelectedDrinks(prev => {
      if (prev.includes(drinkId)) {
        return prev.filter(id => id !== drinkId);
      } else {
        return [...prev, drinkId];
      }
    });
  };
  
  const toggleAllDrinks = (checked: boolean) => {
    if (checked) {
      const filteredDrinks = customDrinksData
        .filter(item => selectedBar === "all" || item.bar.toLowerCase().includes(selectedBar.toLowerCase()))
        .map(drink => drink.id);
      setSelectedDrinks(filteredDrinks);
    } else {
      setSelectedDrinks([]);
    }
  };
  
  const toggleIngredientSelection = (ingredientId: number) => {
    setSelectedIngredients(prev => {
      if (prev.includes(ingredientId)) {
        return prev.filter(id => id !== ingredientId);
      } else {
        return [...prev, ingredientId];
      }
    });
  };
  
  const toggleAllIngredients = (checked: boolean) => {
    if (checked) {
      const allIds = ingredientConsumptionData.map(ingredient => ingredient.id);
      setSelectedIngredients(allIds);
    } else {
      setSelectedIngredients([]);
    }
  };
  
  const filteredDrinks = customDrinksData.filter(
    item => selectedBar === "all" || item.bar.toLowerCase().includes(selectedBar.toLowerCase())
  );
  
  const areAllDrinksSelected = filteredDrinks.length > 0 &&
    filteredDrinks.every(drink => selectedDrinks.includes(drink.id));
    
  const areAllIngredientsSelected = ingredientConsumptionData.length > 0 &&
    ingredientConsumptionData.every(ingredient => selectedIngredients.includes(ingredient.id));
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-4">
        <div className="text-sm text-gray-500">
          Los tragos personalizados impactan automáticamente el stock de sus ingredientes
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Trago Custom
        </Button>
      </div>
      
      <Tabs defaultValue="drinks">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drinks">Tragos Personalizados</TabsTrigger>
          <TabsTrigger value="ingredients">Consumo de Ingredientes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="drinks">
          {showCheckboxes ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[48px]">
                    <Checkbox 
                      checked={areAllDrinksSelected}
                      onCheckedChange={toggleAllDrinks}
                    />
                  </TableHead>
                  <TableHead>Trago</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Ventas</TableHead>
                  <TableHead>Barra</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrinks.map(drink => (
                  <TableRow key={drink.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedDrinks.includes(drink.id)}
                        onCheckedChange={() => toggleDrinkSelection(drink.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{drink.name}</TableCell>
                    <TableCell>{drink.category}</TableCell>
                    <TableCell>
                      {drink.ingredients.map((ing, idx) => (
                        <div key={idx} className="text-xs">
                          {ing.name} ({ing.amount})
                          {idx < drink.ingredients.length - 1 && ", "}
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>{drink.price}</TableCell>
                    <TableCell>{drink.sold}</TableCell>
                    <TableCell>{drink.bar}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDrinks.map((drink) => (
                <Card key={drink.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{drink.name}</CardTitle>
                      <Badge>{drink.category}</Badge>
                    </div>
                    <CardDescription>Vendidos: {drink.sold} · Precio: {drink.price}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Ingredientes:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {drink.ingredients.map((ingredient, idx) => (
                          <li key={idx} className="text-sm">
                            {ingredient.name} ({ingredient.amount})
                          </li>
                        ))}
                      </ul>
                      <div className="flex justify-end mt-4">
                        <Button variant="outline" size="sm">
                          <FileText className="mr-2 h-4 w-4" />
                          Ver Receta
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ingredients">
          <Table>
            <TableHeader>
              <TableRow>
                {showCheckboxes && (
                  <TableHead className="w-[48px]">
                    <Checkbox 
                      checked={areAllIngredientsSelected}
                      onCheckedChange={toggleAllIngredients}
                    />
                  </TableHead>
                )}
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cantidad Usada</TableHead>
                <TableHead>Tragos Elaborados</TableHead>
                <TableHead>Stock Restante</TableHead>
                {showCheckboxes && (
                  <TableHead>Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientConsumptionData.map((ingredient) => (
                <TableRow key={ingredient.id}>
                  {showCheckboxes && (
                    <TableCell>
                      <Checkbox 
                        checked={selectedIngredients.includes(ingredient.id)}
                        onCheckedChange={() => toggleIngredientSelection(ingredient.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.used}</TableCell>
                  <TableCell>{ingredient.drinks}</TableCell>
                  <TableCell>{ingredient.remaining}</TableCell>
                  {showCheckboxes && (
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};
