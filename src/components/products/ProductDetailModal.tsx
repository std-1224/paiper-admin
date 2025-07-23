import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRightLeft, Gift, Package, Coins, List } from "lucide-react";
import { InventoryData } from "@/types/types";

type ProductDetailProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: any; // Using any for simplicity, in a real app would use proper type
};

export function ProductDetailModal({
  open,
  onOpenChange,
  product,
}: ProductDetailProps) {
  if (!product) return null;

  // Mock data for ingredients and history
  const mockIngredients = [
    { name: "Gin Beefeater", quantity: "60ml", stock: 24 },
    { name: "Tónica", quantity: "200ml", stock: 48 },
    { name: "Limón", quantity: "1 rodaja", stock: 35 },
    { name: "Hielo", quantity: "4 cubos", stock: 200 },
  ];

  const mockHistory = [
    {
      date: "2025-05-01",
      type: "Entrada",
      quantity: 24,
      bar: "Bar Central",
      user: "Admin",
    },
    {
      date: "2025-05-02",
      type: "Transferencia",
      quantity: 6,
      from: "Bar Central",
      to: "Bar Norte",
      user: "Gerente",
    },
    {
      date: "2025-05-03",
      type: "Venta",
      quantity: 4,
      bar: "Bar Norte",
      user: "Barman",
    },
    {
      date: "2025-05-04",
      type: "Ajuste",
      quantity: -2,
      bar: "Bar Norte",
      reason: "Rotura",
      user: "Supervisor",
    },
  ];

  // Mock recipe steps
  const mockRecipe = [
    "1. Llenar el vaso con hielo",
    "2. Agregar 60ml de Gin Beefeater",
    "3. Añadir 200ml de tónica",
    "4. Decorar con una rodaja de limón",
    "5. Revolver suavemente y servir",
  ];

  // Calculate margin if product has cost price
  const costPrice = product.purchasePrice; // Mock cost price
  const price = product.salePrice;
  const margin =
    price > 0 ? (((price - costPrice) / price) * 100).toFixed(2) : 0;

  // Determine if product is simple or composed
  const isComposed =
    product?.name?.includes("Gin") ||
    product?.name?.includes("Vodka") ||
    product?.name?.includes("Fernet");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
          <DialogDescription>
            Información detallada del producto
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            {/* {isComposed && (
              <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
            )}
            {isComposed && <TabsTrigger value="recipe">Receta</TabsTrigger>}
            <TabsTrigger value="history">Historial</TabsTrigger> */}
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Información básica</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Categoría:</dt>
                      <dd>{product.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Precio de venta:</dt>
                      <dd className="font-semibold">{product.salePrice}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Precio de costo:</dt>
                      <dd>${product.purchasePrice}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Margen:</dt>
                      <dd className="text-green-600">{margin}%</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Tipo:</dt>
                      <dd>
                        <Badge
                          variant="outline"
                          className={
                            isComposed
                              ? "bg-purple-50 text-purple-700"
                              : "bg-blue-50 text-blue-700"
                          }
                        >
                          {isComposed ? "Elaborado" : "Directo"}
                        </Badge>
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Disponibilidad</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Stock total:</dt>
                      <dd className="font-semibold">
                        {product.stockAvailable} unidades
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Stock limitado:</dt>
                      <dd>
                        <Badge
                          variant={
                            product.limitedStock ? "outline" : "secondary"
                          }
                          className={
                            product.limitedStock
                              ? "bg-amber-50 text-amber-700"
                              : ""
                          }
                        >
                          {product.limitedStock ? "Sí" : "No"}
                        </Badge>
                      </dd>
                    </div>
                  </dl>

                  <h3 className="font-semibold mt-4 mb-2">
                    Distribución por barra
                  </h3>
                  <ul className="space-y-1">
                    {product?.inventories?.map(
                      (inventory: InventoryData, idx: number) => (
                        <li key={idx} className="flex justify-between">
                          <span className="text-gray-500">
                            {inventory.barName}:
                          </span>
                          <span>{inventory.quantity} unidades</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    Configuración de cortesía
                  </h3>
                  <div className="flex items-center mb-3">
                    <Badge
                      variant={product.isCourtesy ? "outline" : "secondary"}
                      className={
                        product.isCourtesy
                          ? "bg-green-50 text-green-700 mr-2"
                          : "mr-2"
                      }
                    >
                      {product.isCourtesy ? "Activado" : "Desactivado"}
                    </Badge>
                    {product.isCourtesy && (
                      <Gift className="h-4 w-4 text-green-600" />
                    )}
                  </div>

                  {product.isCourtesy && product.courtesyRules && (
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Máximo por noche:</dt>
                        <dd>{product.courtesyRules.maxPerNight}</dd>
                      </div>
                      <div className="flex flex-col">
                        <dt className="text-gray-500 mb-1">
                          Rangos permitidos:
                        </dt>
                        <dd className="flex flex-wrap gap-1">
                          {product.courtesyRules.allowedRanks.map(
                            (rank: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="text-xs"
                              >
                                {rank}
                              </Badge>
                            )
                          )}
                        </dd>
                      </div>
                    </dl>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">
                    Configuración de PR Tokens
                  </h3>
                  <div className="flex items-center mb-3">
                    <Badge
                      variant={product.isTokenProduct ? "outline" : "secondary"}
                      className={
                        product.isTokenProduct
                          ? "bg-blue-50 text-blue-700 mr-2"
                          : "mr-2"
                      }
                    >
                      {product.isTokenProduct ? "Activado" : "Desactivado"}
                    </Badge>
                    {product.isTokenProduct && (
                      <Coins className="h-4 w-4 text-blue-600" />
                    )}
                  </div>

                  {product.isTokenProduct && (
                    <div className="flex flex-col">
                      <dt className="text-gray-500 mb-1">Rangos permitidos:</dt>
                      <dd className="flex flex-wrap gap-1">
                        {product.tokenRanks.map((rank: string, idx: number) => (
                          <Badge
                            key={idx}
                            variant="secondary"
                            className="text-xs"
                          >
                            {rank}
                          </Badge>
                        ))}
                      </dd>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline">
                <Package className="mr-2 h-4 w-4" />
                Ajustar Stock
              </Button>
              <Button>
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transferir
              </Button>
            </div>
          </TabsContent>

          {/* Tab: Ingredientes (solo si es producto elaborado) */}
          {isComposed && (
            <TabsContent value="ingredients" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <List className="h-4 w-4 mr-2" />
                    Ingredientes de {product.name}
                  </h3>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ingrediente</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Stock disponible</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockIngredients.map((ingredient, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{ingredient.name}</TableCell>
                          <TableCell>{ingredient.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                ingredient.stock > 20
                                  ? "bg-green-50 text-green-700"
                                  : "bg-amber-50 text-amber-700"
                              }
                            >
                              {ingredient.stock} unidades
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <ArrowRightLeft className="h-4 w-4 mr-1" />
                              Transferir
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tab: Receta (solo si es producto elaborado) */}
          {isComposed && (
            <TabsContent value="recipe" className="mt-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">
                    Receta para {product.name}
                  </h3>
                  <div className="space-y-2">
                    {mockRecipe.map((step, idx) => (
                      <p key={idx} className="text-gray-700">
                        {step}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tab: Historial */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Historial de movimientos</h3>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Detalle</TableHead>
                      <TableHead>Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockHistory.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{item.date}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              item.type === "Entrada"
                                ? "bg-green-50 text-green-700"
                                : item.type === "Transferencia"
                                ? "bg-blue-50 text-blue-700"
                                : item.type === "Venta"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-red-50 text-red-700"
                            }
                          >
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell
                          className={
                            item.type === "Ajuste" && item.quantity < 0
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {item.quantity > 0 && item.type !== "Venta" && "+"}
                          {item.quantity}
                        </TableCell>
                        <TableCell>
                          {item.type === "Transferencia"
                            ? `${item.from} → ${item.to}`
                            : item.type === "Ajuste"
                            ? item.reason
                            : item.bar}
                        </TableCell>
                        <TableCell>{item.user}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
