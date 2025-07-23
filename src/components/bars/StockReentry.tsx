
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BoxesIcon } from "lucide-react";
import { ProductSearchField } from "@/components/products/ProductSearchField";
import { MultiSelectBarsField } from "@/components/bars/MultiSelectBarsField";

// Mock data for stock reentry
const stockReentryData = [
  { 
    id: 1, 
    product: "Vino Malbec 750ml", 
    returnType: "Parcial", 
    amount: "Media botella", 
    bar: "Bar Central", 
    date: "2023-05-02", 
    status: "Reutilizable", 
    impact: "Stock: Sí, Ingresos: No" 
  },
  { 
    id: 2, 
    product: "Gin Beefeater 750ml", 
    returnType: "Devolución Total", 
    amount: "Botella completa", 
    bar: "Bar Norte", 
    date: "2023-05-02", 
    status: "Sin abrir", 
    impact: "Stock: Sí, Ingresos: No" 
  },
  { 
    id: 3, 
    product: "Champagne Moët", 
    returnType: "Parcial", 
    amount: "1/4 botella", 
    bar: "Bar VIP", 
    date: "2023-05-01", 
    status: "Reutilizable", 
    impact: "Stock: Sí, Ingresos: No" 
  },
  { 
    id: 4, 
    product: "Vodka Absolut 750ml", 
    returnType: "Devolución Total", 
    amount: "Botella completa", 
    bar: "El Alamo", 
    date: "2023-05-01", 
    status: "Sin abrir", 
    impact: "Stock: Sí, Ingresos: No" 
  },
  { 
    id: 5, 
    product: "Agua Mineral 500ml", 
    returnType: "Devolución Total", 
    amount: "Botella completa", 
    bar: "Bar Sur", 
    date: "2023-04-30", 
    status: "Sin abrir", 
    impact: "Stock: Sí, Ingresos: No" 
  },
];

// Mock data for consumption metrics
const consumptionMetricsData = [
  { product: "Vino Malbec", sold: 10, consumed: 7, percentage: "70%" },
  { product: "Gin Beefeater", sold: 15, consumed: 14, percentage: "93%" },
  { product: "Vodka Absolut", sold: 12, consumed: 10, percentage: "83%" },
  { product: "Champagne Moët", sold: 6, consumed: 5, percentage: "83%" },
  { product: "Whisky Johnnie Walker", sold: 8, consumed: 7, percentage: "88%" },
];

interface ReentryFormData {
  product: string;
  productId?: number;
  quantity: number;
  returnType: string;
  status: string;
  destinationBars: string[];
  economicValue: number;
  observations: string;
}

export const StockReentry = ({ selectedBar }: { selectedBar: string }) => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [reentryDialogOpen, setReentryDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedBars, setSelectedBars] = useState<string[]>([]);
  
  const form = useForm<ReentryFormData>({
    defaultValues: {
      product: "",
      quantity: 1,
      returnType: "total",
      status: "sinAbrir",
      destinationBars: [],
      economicValue: 0,
      observations: ""
    }
  });

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    form.setValue("product", product.name);
    form.setValue("productId", product.id);
    
    // Calculate economic value based on selected product and quantity
    const quantity = form.watch("quantity");
    form.setValue("economicValue", quantity * product.price);
  };

  const handleBarsSelection = (bars: string[]) => {
    setSelectedBars(bars);
    form.setValue("destinationBars", bars);
  };

  const onQuantityChange = (quantity: number) => {
    form.setValue("quantity", quantity);
    
    if (selectedProduct) {
      form.setValue("economicValue", quantity * selectedProduct.price);
    }
  };

  const onSubmitReentry = (data: ReentryFormData) => {
    console.log("Reentry data:", data);
    toast.success(`${data.quantity} unidades de ${data.product} reingresadas al stock`);
    setReentryDialogOpen(false);
    form.reset();
    setSelectedProduct(null);
    setSelectedBars([]);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="reutilizable">Reutilizable</SelectItem>
            <SelectItem value="sinAbrir">Sin abrir</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
          </SelectContent>
        </Select>
        
        <Button className="w-full md:w-auto" onClick={() => setReentryDialogOpen(true)}>
          <BoxesIcon className="mr-2 h-4 w-4" />
          Registrar Reingreso
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Reingresos al Stock</CardTitle>
            <CardDescription>Productos devueltos o reutilizables</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Barra</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Impacto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stockReentryData
                  .filter(item => selectedBar === "all" || item.bar.toLowerCase().includes(selectedBar.replace(/([A-Z])/g, ' $1').trim().toLowerCase()))
                  .filter(item => statusFilter === "all" || item.status.toLowerCase().includes(statusFilter.toLowerCase()))
                  .map((reentry) => (
                    <TableRow key={reentry.id}>
                      <TableCell className="font-medium">{reentry.product}</TableCell>
                      <TableCell>{reentry.returnType}</TableCell>
                      <TableCell>{reentry.amount}</TableCell>
                      <TableCell>{reentry.bar}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            reentry.status === "Sin abrir" 
                              ? "bg-green-50 text-green-700 border-green-200" 
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {reentry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{reentry.impact}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo Real vs Facturado</CardTitle>
            <CardDescription>Métricas de consumo efectivo</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Vendidas</TableHead>
                  <TableHead>Consumidas</TableHead>
                  <TableHead>% Efectivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consumptionMetricsData.map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{metric.product}</TableCell>
                    <TableCell>{metric.sold} unidades</TableCell>
                    <TableCell>{metric.consumed} unidades</TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-vares-500 h-2.5 rounded-full" 
                          style={{ width: metric.percentage }}
                        ></div>
                      </div>
                      <span className="text-xs">{metric.percentage}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Reentry Dialog */}
      <Dialog open={reentryDialogOpen} onOpenChange={setReentryDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Registrar Reingreso de Producto</DialogTitle>
            <DialogDescription>
              Ingrese los detalles del producto a reingresar al stock
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitReentry)} className="space-y-4 py-2">
              <FormField
                control={form.control}
                name="product"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Producto</FormLabel>
                    <FormControl>
                      <ProductSearchField
                        onSelect={handleProductSelect}
                        selectedProductId={field.value}
                        placeholder="Buscar producto..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          field.onChange(value);
                          onQuantityChange(value);
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="returnType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Reingreso</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="total">Devolución Total</SelectItem>
                        <SelectItem value="parcial">Devolución Parcial</SelectItem>
                        <SelectItem value="transferencia">Transferencia devuelta</SelectItem>
                        <SelectItem value="error">Corrección de Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado del Producto</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sinAbrir">Sin abrir</SelectItem>
                        <SelectItem value="reutilizable">Reutilizable (abierto)</SelectItem>
                        <SelectItem value="parcial">Parcialmente usado</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="economicValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor económico ($)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0} 
                        step="0.01" 
                        {...field} 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Valor económico total del reingreso
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Barras de destino</FormLabel>
                <MultiSelectBarsField 
                  onSelectionChange={handleBarsSelection}
                  initialSelection={selectedBars}
                  placeholder="Seleccionar barras de destino"
                />
                <FormDescription>
                  Selecciona las barras donde se enviará este producto
                </FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Detalles adicionales sobre el reingreso" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setReentryDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Reingreso</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
