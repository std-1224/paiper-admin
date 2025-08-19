import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { ArrowDownUp, PackagePlus, PackageX, Loader2, ScanSearch, CalendarIcon } from "lucide-react";
import { ProductSearchField } from "@/components/products/ProductSearchField";
import { MultiSelectBarsField } from "@/components/bars/MultiSelectBarsField";
import { InventoryData } from "@/types/types";
import { StockRepurchase } from "@/app/(components)/stock-repurchase";
import { useAppContext } from "@/context/AppContext";

interface StockAdjustmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStockId?: number | null;
  initialProductId?: string | null;
  initialQuantity?: number;
  onSubmitReingress?: (data: StockReingress) => void;
  onSubmitLoss?: (data: StockLoss) => void;
}

export interface StockReingress {
  product: string;
  productId?: number;
  quantity: number;
  reason: string;
  customReason?: string;
  isOpened: boolean;
  observations?: string;
  destinationBars?: string[]; // Added field for destination bars
}

export interface StockLoss {
  product: string;
  productId?: number;
  quantity: number;
  reason: string;
  customReason?: string;
  previouslyRegistered: boolean;
  observations?: string;
}

export function StockAdjustment({
  open,
  onOpenChange,
  initialStockId,
  initialQuantity = 1,
  initialProductId = null,
  onSubmitReingress,
  onSubmitLoss,
}: StockAdjustmentProps) {
  const [activeTab, setActiveTab] = useState<
    "reingress" | "loss" | "repurchase"
  >("reingress");
  const [selectedProductReingress, setSelectedProductReingress] = useState<
    any | null
  >(null);
  const [selectedProductLoss, setSelectedProductLoss] = useState<any | null>(
    null
  );
  const [selectedBars, setSelectedBars] = useState<string[]>([]);
  const [initialStock, setInitialStock] = useState<InventoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { stocksData, fetchProducts } = useAppContext();
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  useEffect(() => {
    if (initialStockId) {
      stocksData.forEach((stock) => {
        if (stock.id == initialStockId) {
          setInitialStock(stock);
        }
      });
    }
  }, [initialStockId, stocksData]);

  const reingress = useForm<StockReingress>({
    defaultValues: {
      product: initialStock?.productId || initialProductId || "",
      quantity: initialStock?.quantity || initialQuantity,
      reason: "",
      customReason: "",
      isOpened: false,
      observations: "",
      destinationBars: [initialStock?.barId?.toString()],
    },
  });

  const loss = useForm<StockLoss>({
    defaultValues: {
      product: initialStock?.productId || initialProductId || "",
      quantity: initialStock?.quantity || initialQuantity,
      reason: "",
      customReason: "",
      previouslyRegistered: true,
      observations: "",
    },
  });

  useEffect(() => {
    if (initialProductId || initialQuantity) {
      reingress.reset({
        product: initialProductId || "",
        quantity: initialQuantity,
        reason: "",
        customReason: "",
        isOpened: false,
        observations: "",
        destinationBars: [],
      });
      loss.reset({
        product: initialProductId || "",
        quantity: initialQuantity,
        reason: "",
        customReason: "",
        previouslyRegistered: true,
        observations: "",
      });
    }
  }, [initialProductId, initialQuantity, loss, reingress]);

  useEffect(() => {
    if (initialStock) {
      reingress.reset({
        product: initialStock.productId || initialProductId || "",
        quantity: initialStock.quantity || initialQuantity,
        reason: "",
        customReason: "",
        isOpened: false,
        observations: "",
        destinationBars: [initialStock.barId.toString()],
      });
      loss.reset({
        product: initialStock?.productId || initialProductId || "",
        quantity: initialStock?.quantity || initialQuantity,
        reason: "",
        customReason: "",
        previouslyRegistered: true,
        observations: "",
      });
      setSelectedBars([initialStock.barId.toString()]);
    }
  }, [initialStock, reingress, loss, initialProductId, initialQuantity]);


  const handleProductSelectReingress = (product: any) => {
    setSelectedProductReingress(product);
    reingress.setValue("product", product.id);
    reingress.setValue("productId", product.id);
  };

  const handleProductSelectLoss = (product: any) => {
    setSelectedProductLoss(product);
    loss.setValue("product", product.id);
    loss.setValue("productId", product.id);
  };

  const handleBarsSelection = (bars: string[]) => {
    setSelectedBars(bars);
    reingress.setValue("destinationBars", bars);
  };

  const handleSubmitReingress = async (data: StockReingress) => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    // Validate required fields
    if (!data.productId && !data.product) {
      toast.error("Debes seleccionar un producto");
      return;
    }

    if (!data.quantity || data.quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Reingress data:", data);

      // If a callback is provided (from bar detail page), use it instead of direct API call
      if (onSubmitReingress) {
        await onSubmitReingress(data);
        toast.success(`${data.quantity} unidades reingresadas al stock`);
      } else {
        // Default behavior for general stock management
        const response = await fetch("/api/adjust", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: data.productId || data.product,
            quantity: data.quantity,
            type: "re-entry",
            reason: data.reason || "Re-ingreso de stock",
            destinationBars: data.destinationBars || [],
            observations: data.observations || "",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al procesar re-ingreso");
        }

        toast.success(
          `${data.quantity} unidades de ${data.product} reingresadas al stock`
        );

        // Refresh data to reflect changes
        await fetchProducts();
      }

      onOpenChange(false);
      reingress.reset();
      setSelectedProductReingress(null);
      setSelectedBars([]);
    } catch (error) {
      console.error("Error processing re-entry:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al procesar re-ingreso"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitLoss = async (data: StockLoss) => {
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }

    // Validate required fields
    if (!data.productId && !data.product) {
      toast.error("Debes seleccionar un producto");
      return;
    }

    if (!data.quantity || data.quantity <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    if (!data.reason || data.reason.trim() === "") {
      toast.error("Debes especificar un motivo para la pérdida");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Loss data:", data);

      // If a callback is provided (from bar detail page), use it instead of direct API call
      if (onSubmitLoss) {
        await onSubmitLoss(data);
        toast.success(`${data.quantity} unidades registradas como pérdida`);
      } else {
        // Default behavior for general stock management
        const response = await fetch("/api/adjust", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product: data.productId || data.product,
            quantity: data.quantity,
            type: "loss",
            reason: data.reason || "Pérdida de stock",
            observations: data.observations || "",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Error al procesar pérdida");
        }

        toast.success(
          `${data.quantity} unidades de ${data.product} registradas como pérdida`
        );

        // Refresh data to reflect changes
        await fetchProducts();
      }

      onOpenChange(false);
      loss.reset();
      setSelectedProductLoss(null);
    } catch (error) {
      console.error("Error processing loss:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al procesar pérdida"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Ajuste de Stock</DialogTitle>
          <DialogDescription>
            Registra reingresos o pérdidas de stock para mantener un inventario
            preciso
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "reingress" | "loss" | "repurchase")
          }
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reingress" className="flex items-center">
              <PackagePlus className="mr-2 h-4 w-4" />
              Reingreso
            </TabsTrigger>
            <TabsTrigger value="loss" className="flex items-center">
              <PackageX className="mr-2 h-4 w-4" />
              Pérdida
            </TabsTrigger>
            <TabsTrigger value="repurchase" className="flex items-center">
              <ArrowDownUp className="mr-2 h-4 w-4" />
              Re-compra
            </TabsTrigger>
          </TabsList>

          {/* Reingreso Form */}
          <TabsContent value="reingress" className=" h-[80vh] overflow-y-auto">
            <Form {...reingress}>
              <form
                onSubmit={reingress.handleSubmit(handleSubmitReingress)}
                className="space-y-4 py-2"
              >
                <FormField
                  control={reingress.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <FormControl>
                        <ProductSearchField
                          onSelect={handleProductSelectReingress}
                          selectedProductId={
                            field.value ? String(field.value) : undefined
                          }
                          placeholder="Buscar producto..."
                          disabled={initialStockId ? true : false}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reingress.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={initialStock?.quantity}
                          {...field}
                          onChange={(e) => {
                            field.onChange(parseInt(e.target.value) || 1);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={reingress.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo del Reingreso</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="devolución">
                            Devolución completa (no se consumió)
                          </SelectItem>
                          <SelectItem value="reutilizable">
                            Reutilizable (abierto, usable)
                          </SelectItem>
                          <SelectItem value="error">
                            Error de carga / descuento
                          </SelectItem>
                          <SelectItem value="transferido">
                            Transferido y no usado
                          </SelectItem>
                          <SelectItem value="otro">Otro motivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {reingress.watch("reason") === "otro" && (
                  <FormField
                    control={reingress.control}
                    name="customReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especificar motivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Detalle el motivo" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={reingress.control}
                  name="isOpened"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>¿Producto abierto?</FormLabel>
                        <FormDescription>
                          Indica si el producto ya fue abierto
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Barras de destino</FormLabel>
                  <MultiSelectBarsField
                    onSelectionChange={handleBarsSelection}
                    initialSelection={selectedBars}
                    placeholder="Seleccionar barras de destino"
                    singleSelection={true}
                  />
                  <FormDescription>
                    Selecciona las barras donde se enviará este producto
                  </FormDescription>
                </FormItem>

                <FormField
                  control={reingress.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalles adicionales"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Registrar Reingreso"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Pérdida Form */}
          <TabsContent value="loss">
            <Form {...loss}>
              <form
                onSubmit={loss.handleSubmit(handleSubmitLoss)}
                className="space-y-4 py-2"
              >
                <FormField
                  control={loss.control}
                  name="product"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Producto</FormLabel>
                      <FormControl>
                        <ProductSearchField
                          onSelect={handleProductSelectLoss}
                          selectedProductId={
                            field.value ? String(field.value) : undefined
                          }
                          placeholder="Buscar producto..."
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={loss.control}
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
                            field.onChange(parseInt(e.target.value) || 1);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={loss.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motivo de la Pérdida</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un motivo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vencido">
                            Producto vencido
                          </SelectItem>
                          <SelectItem value="dañado">
                            Botella rota / recipiente dañado
                          </SelectItem>
                          <SelectItem value="fallido">
                            Preparación fallida / mal hecho
                          </SelectItem>
                          <SelectItem value="robo">
                            Robo o pérdida desconocida
                          </SelectItem>
                          <SelectItem value="otro">Otro motivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                {loss.watch("reason") === "otro" && (
                  <FormField
                    control={loss.control}
                    name="customReason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especificar motivo</FormLabel>
                        <FormControl>
                          <Input placeholder="Detalle el motivo" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={loss.control}
                  name="previouslyRegistered"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>
                          ¿Se cargó previamente como venta o stock?
                        </FormLabel>
                        <FormDescription>
                          Indica si el producto estaba registrado en el sistema
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={loss.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observaciones (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Detalles adicionales"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Registrar Pérdida"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Repurchase Form */}
          <TabsContent value="repurchase" className="h-[80vh] overflow-y-auto">
           <StockRepurchase />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
