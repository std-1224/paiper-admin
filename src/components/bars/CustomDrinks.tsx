
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  { name: "Ron Havana 750ml", used: "2.25 litros", drinks: "45 Cuba Libres", remaining: "3 botellas" },
  { name: "Gin Beefeater 750ml", used: "4.08 litros", drinks: "68 Gin Tonics", remaining: "2 botellas" },
  { name: "Fernet Branca 750ml", used: "5.74 litros", drinks: "82 Fernet Cola", remaining: "4 botellas" },
  { name: "Vodka Absolut 750ml", used: "2.6 litros", drinks: "52 Vodka Tonics", remaining: "5 botellas" },
  { name: "Coca-Cola 2L", used: "23.46 litros", drinks: "127 tragos mixtos", remaining: "8 botellas" },
  { name: "Agua Tónica 1.5L", used: "24 litros", drinks: "120 tragos mixtos", remaining: "6 botellas" },
];

export const CustomDrinks = ({ selectedBar }: { selectedBar: string }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between mb-4">
        <div className="text-sm text-muted-foreground">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customDrinksData
              .filter(item => selectedBar === "all" || item.bar.toLowerCase().includes(selectedBar.replace(/([A-Z])/g, ' $1').trim().toLowerCase()))
              .map((drink) => (
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
        </TabsContent>
        
        <TabsContent value="ingredients">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ingrediente</TableHead>
                <TableHead>Cantidad Usada</TableHead>
                <TableHead>Tragos Elaborados</TableHead>
                <TableHead>Stock Restante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredientConsumptionData.map((ingredient, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{ingredient.name}</TableCell>
                  <TableCell>{ingredient.used}</TableCell>
                  <TableCell>{ingredient.drinks}</TableCell>
                  <TableCell>{ingredient.remaining}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};
