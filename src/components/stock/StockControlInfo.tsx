import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Info, 
  ArrowDown, 
  Package, 
  ShoppingCart, 
  ArrowRightLeft,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

export function StockControlInfo() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            Cómo Funciona el Control de Stock
          </CardTitle>
          <CardDescription>
            Explicación detallada del sistema de control de inventario y descuentos automáticos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Stock Deduction Process */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ArrowDown className="h-4 w-4 text-green-600" />
              Proceso de Descuento de Stock
            </h3>
            
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    Paso 1
                  </Badge>
                  <span className="font-medium">Verificación de Receta</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cuando se realiza un pedido, el sistema primero verifica si el producto tiene una receta asociada.
                  Si tiene receta, descuenta los ingredientes individuales del inventario.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Paso 2
                  </Badge>
                  <span className="font-medium">Descuento por Barra</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Si no hay receta, el sistema busca el producto en el inventario específico de la barra.
                  Si hay stock suficiente en la barra, se descuenta de ahí.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    Paso 3
                  </Badge>
                  <span className="font-medium">Descuento General</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Si no hay stock suficiente en la barra, se descuenta del stock general del producto.
                  Esto permite flexibilidad cuando una barra se queda sin stock específico.
                </p>
              </div>
            </div>
          </div>

          {/* Stock Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Tipos de Stock
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Stock General</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stock total del producto disponible en el sistema. Se usa como respaldo cuando 
                  el inventario específico de una barra no es suficiente.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Inventario por Barra</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Stock específico asignado a cada barra. Se prioriza este stock para los pedidos
                  realizados en esa barra específica.
                </p>
              </div>
            </div>
          </div>

          {/* Recipe-based Deduction */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-indigo-600" />
              Descuento Basado en Recetas
            </h3>
            
            <div className="border rounded-lg p-4 bg-indigo-50">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-indigo-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-indigo-900 mb-1">
                    Productos con Receta
                  </p>
                  <p className="text-sm text-indigo-700">
                    Los productos que tienen recetas asociadas (como cócteles) descontarán automáticamente
                    los ingredientes individuales del inventario en lugar del producto final. Esto permite
                    un control más preciso del stock de ingredientes base.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Adjustments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Ajustes de Stock
            </h3>
            
            <div className="grid gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-green-100 text-green-800">Re-ingresos</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Productos no utilizados que se devuelven al inventario. Se pueden transferir
                  a otras barras o al stock general. Útil para botellas no abiertas o productos devueltos.
                </p>
              </div>
              
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-red-100 text-red-800">Pérdidas</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Productos perdidos, rotos, vencidos o derramados. Se registran con razón obligatoria
                  para mantener trazabilidad y control de mermas.
                </p>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
