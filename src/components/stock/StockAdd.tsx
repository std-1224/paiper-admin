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
  FormMessage,
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
import { ArrowDownUp, PackagePlus, PackageX } from "lucide-react";
import { ProductSearchField } from "@/components/products/ProductSearchField";
import { MultiSelectBarsField } from "@/components/bars/MultiSelectBarsField";
import { useAppContext } from "@/context/AppContext";
import { Product } from "@/types/types";

interface StockAdd {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: Product | null;
  initialQuantity?: number;
  onSubmitReingress?: (data: StockReingress) => void;
}

export interface StockReingress {
  product: Product | null;
  productId?: string;
  quantity: number;
  customReason?: string;
  destinationBars?: string[]; // Added field for destination bars
}

export function StockAdd({
  open,
  onOpenChange,
  initialProduct = null,
  initialQuantity = 1,
  onSubmitReingress,
}: StockAdd) {
  const [selectedProductReingress, setSelectedProductReingress] = useState<
    any | null
  >(null);

  const [selectedBars, setSelectedBars] = useState<string[]>([]);

  const reingress = useForm<StockReingress>({
    defaultValues: {
      product: initialProduct,
      quantity: initialQuantity,
      customReason: "",
      destinationBars: [],
    },
  });

  const { fetchProducts, fetchBars } = useAppContext();

  useEffect(() => {
    fetchProducts();
    fetchBars();
  }, []);

  // Update economic value when product or quantity changes for reingress
  useEffect(() => {
    if (selectedProductReingress && reingress.watch("quantity")) {
      const quantity = reingress.watch("quantity");
      const valuePerUnit = selectedProductReingress.price || 0;
      const totalValue = quantity * valuePerUnit;
    }
  }, [selectedProductReingress, reingress.watch("quantity")]);

  const handleProductSelectReingress = (product: Product) => {
    setSelectedProductReingress(product);
    reingress.setValue("product", product);
    reingress.setValue("productId", product.id);

    // Recalculate economic value
    const quantity = reingress.watch("quantity");
  };

  const handleBarsSelection = (bars: string[]) => {
    setSelectedBars(bars);
    reingress.setValue("destinationBars", bars);
  };

  const handleSubmitReingress = async (data: StockReingress) => {
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    toast.success(
      `${data.quantity} unidades de ${data.product} reingresadas al stock`
    );
    onOpenChange(false);
    reingress.reset();
    setSelectedProductReingress(null);
    setSelectedBars([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Añadir Stock</DialogTitle>
          <DialogDescription>
            Agregar stock a una barra específica
          </DialogDescription>
        </DialogHeader>

        <Form {...reingress}>
          <form
            onSubmit={reingress.handleSubmit(handleSubmitReingress)}
            className="space-y-4 py-2 mh-[80vh] overflow-auto"
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
                        field.value?.id !== undefined
                          ? field.value.id.toString()
                          : null
                      }
                      placeholder="Buscar producto..."
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
                      {...field}
                      onChange={(e) => {
                        field.onChange(parseInt(e.target.value) || 1);
                      }}
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
              />
              <FormDescription>
                Selecciona las barras donde se enviará este producto
              </FormDescription>
            </FormItem>

            <FormField
              control={reingress.control}
              name="customReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Detalles adicionales" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Añadir Stock</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
