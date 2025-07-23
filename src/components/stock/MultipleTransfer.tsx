
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

// Mock product data
const stockData = [
  { id: 1, product: "Agua Mineral 500ml", category: "No Alcoholico", quantity: 250, bar: "Bar Central", status: "En Stock" },
  { id: 2, product: "Red Bull 250ml", category: "Energéticas", quantity: 180, bar: "Bar Central", status: "En Stock" },
  { id: 3, product: "Vodka Absolut 750ml", category: "Alcoholico", quantity: 45, bar: "Bar Norte", status: "En Stock" },
  { id: 4, product: "Gin Beefeater 750ml", category: "Alcoholico", quantity: 38, bar: "Bar Sur", status: "En Stock" },
  { id: 5, product: "Whisky Johnnie Walker 750ml", category: "Alcoholico", quantity: 20, bar: "El Alamo", status: "En Stock" },
  { id: 6, product: "Champagne Moët & Chandon", category: "Alcoholico", quantity: 15, bar: "Bar Central", status: "En Stock" },
  { id: 7, product: "Fernet Branca 750ml", category: "Alcoholico", quantity: 60, bar: "Bar Central", status: "En Stock" },
  { id: 8, product: "Coca Cola 2L", category: "No Alcoholico", quantity: 85, bar: "Bar Central", status: "En Stock" },
  { id: 9, product: "Sprite 2L", category: "No Alcoholico", quantity: 55, bar: "Bar Norte", status: "En Stock" },
  { id: 10, product: "Gancia 750ml", category: "Alcoholico", quantity: 30, bar: "Bar Central", status: "En Stock" },
];

const bars = ["Bar Central", "Bar Norte", "Bar Sur", "El Alamo", "Stock General", "Otro Local"];

interface MultipleTransferProps {
  onClose: () => void;
  onSuccess?: (data: any) => void;
}

export function MultipleTransfer({ onClose, onSuccess }: MultipleTransferProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [sourceBar, setSourceBar] = useState("");
  const [destinationBar, setDestinationBar] = useState("");
  const [comment, setComment] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<{id: number, quantity: number}[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<typeof stockData>([]);
  
  // Update available products when source bar changes
  useEffect(() => {
    if (sourceBar) {
      const filtered = stockData.filter(item => 
        (sourceBar === "Stock General" || item.bar === sourceBar) && item.quantity > 0
      );
      setAvailableProducts(filtered);
    } else {
      setAvailableProducts([]);
    }
    // Reset selections when source changes
    setSelectedProducts([]);
    setSelectAll(false);
  }, [sourceBar]);

  // Handle select all toggle
  useEffect(() => {
    if (selectAll) {
      const allProducts = availableProducts.map(p => ({ id: p.id, quantity: 0 }));
      setSelectedProducts(allProducts);
    } else if (selectedProducts.length === availableProducts.length) {
      // Only clear if we're un-checking the "select all" and all items were selected
      setSelectedProducts([]);
    }
  }, [selectAll]);

  const handleProductSelect = (productId: number, isChecked: boolean) => {
    if (isChecked) {
      if (!selectedProducts.some(p => p.id === productId)) {
        setSelectedProducts([...selectedProducts, { id: productId, quantity: 0 }]);
      }
    } else {
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    }
    
    // Update selectAll state
    if (!isChecked && selectAll) {
      setSelectAll(false);
    } else if (isChecked && selectedProducts.length + 1 === availableProducts.length) {
      setSelectAll(true);
    }
  };

  const handleQuantityChange = (productId: number, quantity: number) => {
    const product = availableProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Ensure quantity doesn't exceed available stock
    const validQuantity = Math.min(Math.max(0, quantity), product.quantity);
    
    setSelectedProducts(
      selectedProducts.map(p => 
        p.id === productId ? { ...p, quantity: validQuantity } : p
      )
    );
  };

  const isProductSelected = (productId: number) => {
    return selectedProducts.some(p => p.id === productId);
  };

  const getProductQuantity = (productId: number) => {
    const product = selectedProducts.find(p => p.id === productId);
    return product ? product.quantity : 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && !sourceBar) {
      toast.error("Por favor selecciona un origen para la transferencia");
      return;
    }
    
    if (currentStep === 2) {
      const hasSelectedWithQuantity = selectedProducts.some(p => p.quantity > 0);
      if (!hasSelectedWithQuantity) {
        toast.error("Selecciona al menos un producto y asigna una cantidad");
        return;
      }
    }
    
    if (currentStep === 3 && !destinationBar) {
      toast.error("Por favor selecciona un destino para la transferencia");
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    // Filter out products with quantity 0
    const productsToTransfer = selectedProducts
      .filter(p => p.quantity > 0)
      .map(p => {
        const product = availableProducts.find(item => item.id === p.id);
        return {
          id: p.id,
          product: product?.product,
          quantity: p.quantity,
          sourceBar,
          destinationBar
        };
      });
      
    console.log("Transferencia completada:", {
      sourceBar,
      destinationBar,
      products: productsToTransfer,
      comment
    });
    
    toast.success(`Se transfirieron ${productsToTransfer.length} productos desde ${sourceBar} a ${destinationBar}`);
    if (onSuccess) {
      onSuccess({
        sourceBar,
        destinationBar,
        products: productsToTransfer,
        comment
      });
    }
    onClose();
  };

  const getTotalSelectedProducts = () => {
    return selectedProducts.filter(p => p.quantity > 0).length;
  };

  const getTotalQuantity = () => {
    return selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Transferencia de Stock</CardTitle>
        <CardDescription>
          Paso {currentStep} de 4: {
            currentStep === 1 ? "Seleccionar origen" : 
            currentStep === 2 ? "Seleccionar productos" :
            currentStep === 3 ? "Seleccionar destino" : 
            "Confirmación"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Origen de la transferencia
              </label>
              <Select value={sourceBar} onValueChange={setSourceBar}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar origen" />
                </SelectTrigger>
                <SelectContent>
                  {bars.map((bar) => (
                    <SelectItem key={bar} value={bar}>{bar}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {sourceBar && (
              <div className="rounded-md bg-muted p-4">
                <h3 className="font-medium mb-2">Productos disponibles en {sourceBar}</h3>
                <p className="text-sm text-muted-foreground">
                  {availableProducts.length} productos disponibles para transferir
                </p>
              </div>
            )}
          </div>
        )}
        
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center mb-4">
              <div className="flex-1">
                <h3 className="font-medium">Productos disponibles en {sourceBar}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAll"
                  checked={selectAll}
                  onCheckedChange={(checked) => setSelectAll(checked === true)}
                />
                <label
                  htmlFor="selectAll"
                  className="text-sm font-medium cursor-pointer"
                >
                  Seleccionar todos
                </label>
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-2 py-2 px-4 bg-muted text-sm font-medium">
                <div className="col-span-1">Sel.</div>
                <div className="col-span-5">Producto</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-4">Cantidad</div>
              </div>
              
              <div className="divide-y max-h-[400px] overflow-y-auto">
                {availableProducts.map((product) => (
                  <div key={product.id} className="grid grid-cols-12 gap-2 py-3 px-4 items-center">
                    <div className="col-span-1">
                      <Checkbox
                        id={`product-${product.id}`}
                        checked={isProductSelected(product.id)}
                        onCheckedChange={(checked) => 
                          handleProductSelect(product.id, checked === true)
                        }
                      />
                    </div>
                    <div className="col-span-5">
                      <label
                        htmlFor={`product-${product.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {product.product}
                      </label>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                        {product.quantity}
                      </Badge>
                    </div>
                    <div className="col-span-4">
                      <Input
                        type="number"
                        min={0}
                        max={product.quantity}
                        value={getProductQuantity(product.id) || ""}
                        onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                        disabled={!isProductSelected(product.id)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
                
                {availableProducts.length === 0 && (
                  <div className="py-4 px-4 text-center text-muted-foreground">
                    No hay productos disponibles en este origen
                  </div>
                )}
              </div>
            </div>
            
            <div className="rounded-md bg-muted p-4 flex justify-between">
              <div>
                <span className="font-medium">{getTotalSelectedProducts()}</span> productos seleccionados
              </div>
              <div>
                <span className="font-medium">{getTotalQuantity()}</span> unidades en total
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Destino de la transferencia
              </label>
              <Select value={destinationBar} onValueChange={setDestinationBar}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar destino" />
                </SelectTrigger>
                <SelectContent>
                  {bars
                    .filter(bar => bar !== sourceBar)
                    .map((bar) => (
                      <SelectItem key={bar} value={bar}>{bar}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Comentario (opcional)
              </label>
              <Textarea
                placeholder="Ej: Reposición para evento del viernes"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Resumen de transferencia</h3>
              <p className="text-sm">
                Desde <span className="font-semibold">{sourceBar}</span> hacia {
                  destinationBar ? <span className="font-semibold">{destinationBar}</span> : 
                  <span className="text-muted-foreground italic">por seleccionar</span>
                }
              </p>
              <p className="text-sm mt-1">
                {getTotalSelectedProducts()} productos ({getTotalQuantity()} unidades)
              </p>
            </div>
          </div>
        )}
        
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-4">
              <h3 className="font-medium mb-2">Confirmación de transferencia</h3>
              <div className="space-y-1">
                <p className="text-sm">
                  <span className="font-semibold">Origen:</span> {sourceBar}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Destino:</span> {destinationBar}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Productos:</span> {getTotalSelectedProducts()} 
                  ({getTotalQuantity()} unidades)
                </p>
                {comment && (
                  <p className="text-sm">
                    <span className="font-semibold">Comentario:</span> {comment}
                  </p>
                )}
              </div>
            </div>
            
            <div className="border rounded-md">
              <div className="py-2 px-4 bg-muted font-medium">
                Detalle de productos a transferir
              </div>
              <div className="divide-y max-h-[300px] overflow-y-auto">
                {selectedProducts
                  .filter(p => p.quantity > 0)
                  .map(p => {
                    const product = availableProducts.find(item => item.id === p.id);
                    return (
                      <div key={p.id} className="py-2 px-4 flex justify-between items-center">
                        <div className="font-medium">{product?.product}</div>
                        <div className="font-medium">{p.quantity} unidades</div>
                      </div>
                    );
                  })}
                  
                {selectedProducts.filter(p => p.quantity > 0).length === 0 && (
                  <div className="py-4 px-4 text-center text-muted-foreground">
                    No hay productos seleccionados para transferir
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handlePrevious}>
          {currentStep === 1 ? "Cancelar" : "Atrás"}
        </Button>
        <Button onClick={handleNext}>
          {currentStep < 4 ? "Siguiente" : "Confirmar transferencia"}
          {currentStep < 4 && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </CardFooter>
    </Card>
  );
}
