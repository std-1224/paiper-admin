"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { StockTransfers } from "@/components/bars/StockTransfers";
import { StockAdjustment } from "@/components/stock/StockAdjustment";
import { StockAdjustmentHistory } from "@/components/stock/StockAdjustmentHistory";
import { MultipleTransfer } from "@/components/stock/MultipleTransfer";
import RecipeConfiguration from "../(components)/recipe-configuration";
import {
  ArrowRight,
  Box,
  Search,
  ShoppingCart,
  ArrowRightLeft,
  PackagePlus,
  PackageX,
  Plus,
  Trash,
  Filter,
  ClipboardList,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  XCircle,
  BarChart3,
  Loader2,
} from "lucide-react";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { useAppContext } from "@/context/AppContext";
import { InventoryData, Product } from "@/types/types";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "../(components)/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { categoryList } from "@/lib/utils";

// Mock data for stock
const stockData = [
  {
    id: 1,
    product: "Agua Mineral 500ml",
    category: "No Alcoholico",
    quantity: 250,
    bar: "Bar Central",
    status: "En Stock",
  },
  {
    id: 2,
    product: "Red Bull 250ml",
    category: "Energéticas",
    quantity: 180,
    bar: "Bar Central",
    status: "En Stock",
  },
  {
    id: 3,
    product: "Vodka Absolut 750ml",
    category: "Alcoholico",
    quantity: 45,
    bar: "Bar Norte",
    status: "En Stock",
  },
  {
    id: 4,
    product: "Gin Beefeater 750ml",
    category: "Alcoholico",
    quantity: 38,
    bar: "Bar Sur",
    status: "En Stock",
  },
  {
    id: 5,
    product: "Whisky Johnnie Walker 750ml",
    category: "Alcoholico",
    quantity: 20,
    bar: "El Alamo",
    status: "En Stock",
  },
  {
    id: 6,
    product: "Champagne Moët & Chandon",
    category: "Alcoholico",
    quantity: 15,
    bar: "Bar Central",
    status: "Falta Stock",
  },
];

// Mock data for unredeemed
const unredeemedStockData = [
  {
    id: 1,
    product: "Gin Tonic Beefeater",
    quantity: 2,
    bar: "Bar Norte",
    date: "2023-05-02",
    user: "Usuario ID 123",
  },
  {
    id: 2,
    product: "Vodka Tonic",
    quantity: 1,
    bar: "El Alamo",
    date: "2023-05-01",
    user: "Usuario ID 456",
  },
  {
    id: 3,
    product: "Whisky Johnnie Walker",
    quantity: 1,
    bar: "Bar Sur",
    date: "2023-05-01",
    user: "Usuario ID 789",
  },
];
const bars = ["Todos", "Bar Central", "Bar Norte", "Bar Sur", "El Alamo"];
const Stock = () => {
  const router = useRouter();
  const [selectedBar, setSelectedBar] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [assignStockDialogOpen, setAssignStockDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<number | undefined>(
    undefined
  );
  // Form states
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: "",
    description: "",
    category: "",
    stock: 0,
    image_url: "",
    purchase_price: 0,
    sale_price: 0,
    has_recipe: false,
  });

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [productToAdjust, setProductToAdjust] = useState("");
  const [multipleTransferOpen, setMultipleTransferOpen] = useState(false);
  const [selectedStockItems, setSelectedStockItems] = useState<string[]>([]);
  const [selectedUnredeemedItems, setSelectedUnredeemedItems] = useState<
    number[]
  >([]);
  const [showCreateRecipeDialog, setShowCreateRecipeDialog] = useState(false);
  const { recipesData } = useAppContext();
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { uploadImageToSupabase } = useAppContext();
  const [showUnredeemed, setShowUnredeemed] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productDetailOpen, setProductDetailOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<ProductDetail | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const assignForm = useForm({
    defaultValues: {
      quantity: 0,
      destination: "",
      notes: "",
    },
  });
  const transferForm = useForm({
    defaultValues: {
      product: "",
      quantity: 0,
      fromBar: "",
      selectedBars: [] as string[],
      transferType: "Permanente",
      notes: "",
    },
  });

  const {
    fetchStocksOfBar,
    fetchProducts,
    stocksData,
    productsData,
    barsData,
    fetchBars,
  } = useAppContext();

  // Calculate statistics from real data
  const totalStock = productsData.reduce(
    (total, product) => total + product.stock,
    0
  );

  // Calculate total purchase value
  const totalPurchaseValue = productsData.reduce(
    (total, product) => total + (product.purchase_price * product.stock),
    0
  );

  // Calculate total sale value
  const totalSaleValue = productsData.reduce(
    (total, product) => total + (product.sale_price * product.stock),
    0
  );

  // Calculate transfers from stock movements
  const totalTransfers = stocksData.filter(item =>
    item.status === 'transferred' || item.status === 'in_transit'
  ).length;

  // Calculate low stock items (items with stock below 10)
  const lowStockItems = productsData.filter(product => product.stock < 10 && product.stock > 0).length;

  // Calculate out of stock items
  const outOfStockItems = productsData.filter(product => product.stock === 0).length;

  // Calculate pending items from stock data
  const pendingItems = stocksData.filter(item =>
    item.status === 'pending' || item.status === 'unredeemed'
  ).length;

  // Calculate total products count
  const totalProducts = productsData.length;

  // Calculate average stock per product
  const averageStock = totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;

  useEffect(() => {
    fetchStocksOfBar();
    fetchProducts();
    fetchBars();
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  // Filter stock data based on selection and unredeemed filter
  const filteredStock = stocksData.filter((item) => {
    const matchesBar = selectedBar === "Todos" || item.barName === selectedBar;
    const matchesSearch =
      item.productId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesBar && matchesSearch && !showUnredeemed;
  });

  // Combine with unredeemed items if the filter is active
  const displayItems = showUnredeemed ? unredeemedStockData : filteredStock;
  const handleAssignStock = (product: Product) => {
    setSelectedProduct(product);
    setAssignStockDialogOpen(true);
  };
  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setStockAdjustmentOpen(true);
  };

  // Handle opening delete confirmation
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    try {
      const fileName = `image-${Date.now()}.${imageFile.name.split(".").pop()}`;
      const uploadedUrl = await uploadImageToSupabase(imageFile, fileName);
      return uploadedUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const handleAddProduct = async () => {
    try {
      setIsLoading(true);
      const uploadedUrl = await handleImageUpload();
      const response = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
          has_recipe: newProduct.has_recipe || false,
        }),
      });

      if (!response.ok) throw new Error("Failed to add product");

      setShowAddProductModal(false);
      setNewProduct({
        name: "",
        description: "",
        category: "",
        stock: 0,
        image_url: "",
        purchase_price: 0,
        sale_price: 0,
        has_recipe: false,
      });
      setImageFile(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };
  // Handle product deletion
  const handleDeleteProduct = async () => {
    if (!productToDelete?.id) return;

    setDeletingProductId(productToDelete.id);
    try {
      const response = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete product");
      }

      // Refresh the products data
      await fetchProducts();

      // Show success message
      toast.success("Producto eliminado exitosamente del inventario");

      // Close dialog
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto");
    } finally {
      setDeletingProductId(null);
    }
  };
  const handleNewTransfer = () => {
    setTransferDialogOpen(true);
  };
  const handleMultipleTransfer = () => {
    setMultipleTransferOpen(true);
  };
  const toggleStockItemSelection = (itemId: string) => {
    setSelectedStockItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  const toggleAllStockItems = (checked: boolean) => {
    if (checked) {
      // setSelectedStockItems(displayItems.map((item) => item.id));
    } else {
      setSelectedStockItems([]);
    }
  };
  const toggleBarSelection = (barName: string) => {
    const currentBars = transferForm.getValues("selectedBars") || [];
    if (currentBars.includes(barName)) {
      transferForm.setValue(
        "selectedBars",
        currentBars.filter((b) => b !== barName)
      );
    } else {
      transferForm.setValue("selectedBars", [...currentBars, barName]);
    }
  };
  const handleMultipleTransferSuccess = (data: any) => {
    console.log("Transferencia múltiple completada:", data);
    // Aquí iría la lógica para actualizar el stock
    toast.success("Transferencia múltiple completada correctamente");
    setSelectedStockItems([]);
  };
  const onSubmitAssign = async (data: any) => {
    const response = await fetch("/api/inventory", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: selectedProduct?.id,
        quantity: data.quantity,
        destinationBars: [Number(data.destination.split("_*_")[0])],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    toast.success(
      `${data.quantity} unidades de ${selectedProduct?.name} reingresadas al stock`
    );
    fetchStocksOfBar();
    setAssignStockDialogOpen(false);
    assignForm.reset();
    // Aquí iría la lógica para actualizar el stock
  };
  const onSubmitTransfer = (data: any) => {
    console.log("Transferencia creada:", data);
    setTransferDialogOpen(false);

    // Get selected bars
    const selectedBars = data.selectedBars || [];
    if (selectedBars.length === 0) {
      toast.error("Debes seleccionar al menos una barra de destino");
      return;
    }

    // Show success message with all selected bars
    toast.success(
      `${data.quantity} unidades de ${data.product} transferidas de ${data.fromBar
      } a ${selectedBars.join(", ")}`
    );
    // Aquí iría la lógica para crear la transferencia
  };
  const handleStockReingress = async (data: any) => {
    console.log("Reingreso procesado:", data);
    const response = await fetch("/api/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        type: "re-entry",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    toast.success(
      `${data.quantity} unidades de ${data.product} reingresadas al stock`
    );
    // Aquí iría la lógica para actualizar el stock
  };
  const handleStockLoss = async (data: any) => {
    console.log("Pérdida registrada:", data);
    const response = await fetch("/api/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        type: "loss",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    toast.success(
      `${data.quantity} unidades de ${data.product} registradas como pérdida`
    );
    // Aquí iría la lógica para actualizar el stock
  };

  const handleToggleActive = async (
    id: string,
    checked: boolean,
    type: string
  ) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          [type]: checked,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update product");

      fetchProducts();
    } catch (err) {
      console.log(
        err instanceof Error ? err.message : "Error updating product"
      );
    } finally {
      setIsLoading(false);
    }
  };

  interface ProductDetail {
    id: number;
    name: string;
    category: string;
    salePrice: string;
    purchasePrice: string;
    stockAvailable: number;
    limitedStock: boolean;
    inventories: InventoryData[];
    isCourtesy: boolean;
    courtesyRules: null | string;
    isTokenProduct: boolean;
    tokenRanks: string[];
  }

  const viewProductDetail = (product: any): void => {
    // Construct a product object from the item data
    const productData: ProductDetail = {
      id: product.id,
      name: product.productId,
      category: product.category,
      salePrice: product.sale_price,
      purchasePrice: product.purchase_price,
      stockAvailable: product.stock,
      limitedStock: false,
      inventories: stocksData.filter((stock) => stock.productId === product.id),
      isCourtesy: product.is_courtsey,
      courtesyRules: null,
      isTokenProduct: product.is_pr,
      tokenRanks: [],
    };
    setCurrentProduct(productData);
    setProductDetailOpen(true);
  };
  const selectedStockData = selectedStock
    ? stocksData.find((stock) => stock.id == selectedStock)
    : null;
  const areAllStockItemsSelected =
    displayItems.length > 0 &&
    displayItems.every((item) =>
      selectedStockItems.includes(item.id?.toString() || "")
    );
  const hasSelectedStockItems = selectedStockItems.length > 0;
  return (
    <>
      <PageHeader
        title=""
        description="Control de inventario y transferencias"
      >
        {/* <Button className="mr-2" onClick={handleMultipleTransfer}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transferencia Múltiple
        </Button>
        <Button className="mr-2" onClick={handleNewTransfer}>
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Transferencia Simple
        </Button>
        <Button className="mr-2" onClick={() => handleAdjustStock()}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Ajustar Stock
        </Button>
        <Button>
          <Box className="mr-2 h-4 w-4" />
          Añadir Stock
        </Button> */}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-600" />
              Stock Total
            </CardTitle>
            <CardDescription>Productos disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalStock.toLocaleString()}</div>
            <p className="text-sm text-gray-500">En todos los bares</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Valor de Compra
            </CardTitle>
            <CardDescription>Inversión total en stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalPurchaseValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-500">Precio de compra total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              Valor de Venta
            </CardTitle>
            <CardDescription>Valor potencial de venta</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${totalSaleValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-sm text-gray-500">
              Margen: ${(totalSaleValue - totalPurchaseValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-purple-600" />
              Transferencias
            </CardTitle>
            <CardDescription>Movimientos de stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalTransfers}</div>
            <p className="text-sm text-gray-500">Entre bares</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
              Total Productos
            </CardTitle>
            <CardDescription>Productos únicos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalProducts}</div>
            <p className="text-sm text-gray-500">En catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-cyan-600" />
              Stock Promedio
            </CardTitle>
            <CardDescription>Por producto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageStock}</div>
            <p className="text-sm text-gray-500">Unidades promedio</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Stock Bajo
            </CardTitle>
            <CardDescription>Productos con poco stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{lowStockItems}</div>
            <p className="text-sm text-gray-500">Menos de 10 unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Sin Stock
            </CardTitle>
            <CardDescription>Productos agotados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{outOfStockItems}</div>
            <p className="text-sm text-gray-500">Requieren reposición</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventario Detallado</CardTitle>
          <CardDescription>
            Productos, transferencias, pendientes y ajustes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar productos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={selectedBar} onValueChange={setSelectedBar}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar bar" />
              </SelectTrigger>
              <SelectContent>
                {bars.map((bar) => (
                  <SelectItem key={bar} value={bar}>
                    {bar}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="unredeemedFilter"
                  checked={showUnredeemed}
                  onCheckedChange={() => setShowUnredeemed(!showUnredeemed)}
                />
                <Label htmlFor="unredeemedFilter">
                  Mostrar solo productos no retirados
                </Label>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                Más filtros
              </Button>
              <Button onClick={() => setShowAddProductModal(true)}>
                <Plus size={16} className="mr-2" />
                Añadir producto
              </Button>

              <Button
                variant="outline"
                onClick={() => setStockAdjustmentOpen(true)}
                className="flex items-center gap-2"
              >
                <PackagePlus className="h-4 w-4" />
                Ajustar Stock
              </Button>

            </div>

            {hasSelectedStockItems && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {selectedStockItems.length} seleccionados
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMultipleTransfer}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-1" /> Transferir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  onClick={() => {
                    // For bulk adjustment, we'll open the adjustment modal for the first selected item
                    // In a real implementation, you might want a separate bulk adjustment modal
                    const firstSelectedProduct = productsData.find(p =>
                      selectedStockItems.includes(p.id?.toString() || "")
                    );
                    if (firstSelectedProduct) {
                      handleAdjustStock(firstSelectedProduct);
                    }
                  }}
                >
                  <PackagePlus className="h-4 w-4 mr-1" /> Ajustar Stock
                </Button>
                <Button variant="destructive" size="sm">
                  <Trash className="h-4 w-4 mr-1" /> Eliminar
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stock">En Stock y Reasignaciones</TabsTrigger>
              <TabsTrigger value="recipes">
                <ClipboardList className="h-4 w-4 mr-2" />
                Configurar recetas
              </TabsTrigger>
              <TabsTrigger value="transfers">Transferencias</TabsTrigger>
              <TabsTrigger value="adjustments">Ajustes</TabsTrigger>
            </TabsList>

            {/* En Stock y Reasignaciones */}
            <TabsContent value="stock">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[48px]">
                      <Checkbox
                        checked={areAllStockItemsSelected}
                        onCheckedChange={toggleAllStockItems}
                      />
                    </TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vis. Menu</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio Compra</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Bar</TableHead>
                    <TableHead>Estado</TableHead>
                    {showUnredeemed && <TableHead>Fecha</TableHead>}
                    {showUnredeemed && <TableHead>Usuario</TableHead>}
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStockItems.includes(item.id || "")}
                          onCheckedChange={() =>
                            toggleStockItemSelection(item.id || "")
                          }
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <Button
                          variant="link"
                          onClick={
                            () =>
                              // "category" in item && "status" in item
                              viewProductDetail(item)
                            // : console.error("Invalid product data", item)
                          }
                          className="p-0 h-auto font-medium text-orange-900"
                        >
                          {item.name}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.is_active}
                          onCheckedChange={(checked) =>
                            handleToggleActive(item.id, checked, "is_active")
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {"category" in item ? item.category : "N/A"}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          ${item.purchase_price?.toFixed(2) || "0.00"}
                        </span>
                      </TableCell>
                      <TableCell>{item.stock}</TableCell>
                      <TableCell>
                        {stocksData
                          .filter((s) => item.id == s.productId)
                          .slice(0, 2)
                          .map((s) => (
                            <div>
                              <Button
                                variant="link"
                                className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                                onClick={() => router.push(`/bars/${s.barId}`)}
                              >
                                {`${s.barName} (${s.quantity})`}
                              </Button>
                            </div>
                          ))}
                        {stocksData.filter((s) => item.id == s.productId)
                          .length > 2 && "..."}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            "quantity" in item && item.stock > 5
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }
                        >
                          {item.stock > 5 ? "En Stock" : "Falta Stock"}
                        </Badge>
                      </TableCell>
                      {showUnredeemed && "date" in item && (
                        <TableCell>{item.created_at}</TableCell>
                      )}
                      {/* {showUnredeemed && "user" in item && (
                        // <TableCell>{item.user}</TableCell>
                      )} */}
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAssignStock(item)}
                          >
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            Asignar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => handleAdjustStock(item)}
                          >
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Ajustar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteClick(item)}
                            disabled={deletingProductId === item.id}
                          >
                            {deletingProductId === item.id ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                                Eliminando...
                              </>
                            ) : (
                              <>
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Configurar Recetas */}
            <TabsContent value="recipes">
              <RecipeConfiguration />
            </TabsContent>

            {/* Transferencias */}
            <TabsContent value="transfers">
              <StockTransfers selectedBar={-1} />
            </TabsContent>

            {/* Ajustes de Stock */}
            <TabsContent value="adjustments">
              <StockAdjustmentHistory />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog para asignar stock */}
      <Dialog
        open={assignStockDialogOpen}
        onOpenChange={setAssignStockDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Asignar Stock a Barra</DialogTitle>
            <DialogDescription>
              Asignar unidades de {selectedProduct?.name} a una barra
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={assignForm.handleSubmit(onSubmitAssign)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad a asignar</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  max={selectedProduct?.stock}
                  onKeyDown={(e) => {
                    // Prevent minus key, plus key, and 'e' key
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  {...assignForm.register("quantity", {
                    valueAsNumber: true,
                    min: {
                      value: 1,
                      message: "La cantidad debe ser al menos 1",
                    },
                    max: {
                      value: selectedProduct?.stock || 0,
                      message: `No puedes asignar más de ${selectedProduct?.stock} unidades`,
                    },
                    onChange: (e) => {
                      const value = e.target.value;
                      // Only allow positive numbers and empty string
                      if (value === '' || (Number(value) >= 1 && !value.includes('-'))) {
                        return value;
                      }
                      // If invalid, set to 1
                      e.target.value = '1';
                      return '1';
                    },
                  })}
                />
                {assignForm.formState.errors.quantity && (
                  <p className="text-red-500 text-sm">
                    {assignForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="destination">Barra de destino</Label>
                <Select
                  value={assignForm.watch("destination")}
                  onValueChange={(value) => {
                    assignForm.setValue("destination", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la barra de destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {barsData.map((bar) => (
                      <SelectItem
                        key={bar.id}
                        value={`${bar.id}_*_${bar.name}`}
                      >
                        {bar.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" {...assignForm.register("notes")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Asignar Stock</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para nueva transferencia with multi-bar selection*/}
      <Dialog open={transferDialogOpen} onOpenChange={setTransferDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Nueva Transferencia</DialogTitle>
            <DialogDescription>
              Crear una nueva transferencia a múltiples barras
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={transferForm.handleSubmit(onSubmitTransfer)}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Producto</Label>
                <Input
                  id="product"
                  {...transferForm.register("product", {
                    required: "El producto es requerido",
                  })}
                />
                {transferForm.formState.errors.product && (
                  <p className="text-red-500 text-sm">
                    {transferForm.formState.errors.product.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={1}
                  onKeyDown={(e) => {
                    // Prevent minus key, plus key, and 'e' key
                    if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                      e.preventDefault();
                    }
                  }}
                  {...transferForm.register("quantity", {
                    valueAsNumber: true,
                    required: "La cantidad es requerida",
                    min: {
                      value: 1,
                      message: "La cantidad debe ser mayor a 0",
                    },
                    onChange: (e) => {
                      const value = e.target.value;
                      // Only allow positive numbers and empty string
                      if (value === '' || (Number(value) >= 1 && !value.includes('-'))) {
                        return value;
                      }
                      // If invalid, set to 1
                      e.target.value = '1';
                      return '1';
                    },
                  })}
                />
                {transferForm.formState.errors.quantity && (
                  <p className="text-red-500 text-sm">
                    {transferForm.formState.errors.quantity.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fromBar">Barra de origen</Label>
                <Select
                  value={transferForm.watch("fromBar")}
                  onValueChange={(value) =>
                    transferForm.setValue("fromBar", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la barra de origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {bars
                      .filter((bar) => bar !== "Todos")
                      .map((bar) => (
                        <SelectItem key={bar} value={bar}>
                          {bar}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Barras de destino</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
                  {bars
                    .filter(
                      (bar) =>
                        bar !== "Todos" && bar !== transferForm.watch("fromBar")
                    )
                    .map((bar) => (
                      <div key={bar} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bar-${bar}`}
                          checked={
                            transferForm.watch("selectedBars")?.includes(bar) ||
                            false
                          }
                          onCheckedChange={() => toggleBarSelection(bar)}
                        />
                        <Label htmlFor={`bar-${bar}`}>{bar}</Label>
                      </div>
                    ))}
                </div>
                {transferForm.watch("selectedBars")?.length === 0 && (
                  <p className="text-amber-500 text-sm">
                    Selecciona al menos una barra de destino
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transferType">Tipo de transferencia</Label>
                <Select
                  value={transferForm.watch("transferType")}
                  onValueChange={(value) =>
                    transferForm.setValue("transferType", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de transferencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Permanente">Permanente</SelectItem>
                    <SelectItem value="Temporal">Temporal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Input id="notes" {...transferForm.register("notes")} />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Crear Transferencia</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para transferencia múltiple */}
      <Dialog
        open={multipleTransferOpen}
        onOpenChange={setMultipleTransferOpen}
      >
        <DialogContent className="sm:max-w-[900px]">
          <MultipleTransfer
            onClose={() => setMultipleTransferOpen(false)}
            onSuccess={handleMultipleTransferSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Modal para ajustar stock */}
      <StockAdjustment
        open={stockAdjustmentOpen}
        onOpenChange={setStockAdjustmentOpen}
        // initialStockId={selectedStock}
        initialProductId={selectedProduct?.id}
        initialQuantity={selectedProduct?.stock}
        onSubmitReingress={handleStockReingress}
        onSubmitLoss={handleStockLoss}  
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        open={productDetailOpen}
        onOpenChange={setProductDetailOpen}
        product={currentProduct}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto "{productToDelete?.name}"?
              <br />
              <span className="text-red-600 font-medium">
                Esta acción no se puede deshacer y eliminará permanentemente el producto del inventario.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setProductToDelete(null);
              }}
              disabled={deletingProductId !== null}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deletingProductId !== null}
            >
              {deletingProductId ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash className="mr-2 h-4 w-4" />
                  Eliminar Producto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Add Product Modal */}
      <Dialog open={showAddProductModal} onOpenChange={setShowAddProductModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            <DialogDescription>
              Complete los detalles del producto para agregarlo al inventario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 h-[calc(100vh-10rem)] overflow-y-auto">
            {
              <ImageUpload
                handleSetImageFile={setImageFile}
                imageUrl={newProduct.image_url}
              />
            }
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={newProduct.category}
                  onValueChange={(value) =>
                    setNewProduct({ ...newProduct, category: value })
                  }
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
              </div>
            </div>

            {/* Recipe Selection Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="recipe">Receta (Opcional)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateRecipeDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Receta
                </Button>
              </div>
              <Select
                value={newProduct.has_recipe ? "has-recipe" : "no-recipe"}
                onValueChange={(value) =>
                  setNewProduct({
                    ...newProduct,
                    has_recipe: value === "has-recipe"
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="¿Tiene receta?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-recipe">Sin receta</SelectItem>
                  <SelectItem value="has-recipe">Tiene receta</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Si marcas que tiene receta, el stock de los ingredientes se descontará automáticamente cuando se haga un pedido. Configura la receta en la sección "Configuración de Recetas".
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Precio de Compra</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  value={newProduct.purchase_price === 0 ? "" : newProduct.purchase_price}
                  placeholder="0.00"
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      purchase_price: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio de Venta</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={newProduct.sale_price === 0 ? "" : newProduct.sale_price}
                  placeholder="0.00"
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sale_price: e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                value={newProduct.stock === 0 ? "" : newProduct.stock}
                placeholder="0"
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    stock: e.target.value === "" ? 0 : Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddProductModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={() => handleAddProduct()} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Agregar Producto"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
};
function goToBarDetail(barName: string) {
  const bar = bars.findIndex((b) => b === barName);
  if (bar > 0) {
    // Skipping "Todos"
    window.location.href = `/bars/${bar}`;
  }
}
export default Stock;
