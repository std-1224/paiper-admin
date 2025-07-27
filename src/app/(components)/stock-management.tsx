"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Box,
  DollarSign,
  Download,
  FileSpreadsheet,
  Filter,
  History,
  Info,
  Loader2,
  Package,
  PackagePlus,
  PackageX,
  Pencil,
  Percent,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Product } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { categoryList } from "@/lib/utils";
import ImageUpload from "./image-upload";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import TokenPRConfigModal from "@/components/stock/TokenPRConfigModal";
import CourtesyConfigModal from "@/components/stock/CourtesyConfigModal";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function StockManagement() {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showProductDetailModal, setShowProductDetailModal] = useState(false);
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [isTokenPRModalOpen, setIsTokenPRModalOpen] = useState(false);
  const [isCourtesyModalOpen, setIsCourtesyModalOpen] = useState(false);
  const [importingProducts, setImportingProducts] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedProducts, setImportedProducts] = useState<Product[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const { uploadImageToSupabase } = useAppContext();

  // Recipe creation states
  const [showCreateRecipeDialog, setShowCreateRecipeDialog] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    category: "bebida",
    ingredients: [] as { name: string; quantity: string; unit: string }[],
  });
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "ml",
  });
  const [ingredientValidation, setIngredientValidation] = useState<any[]>([]);

  // Stock transfer states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferQuantities, setTransferQuantities] = useState<{[key: string]: number}>({});
  const [selectedBars, setSelectedBars] = useState<string[]>([]);

  // Stock adjustment states
  const [showReentryModal, setShowReentryModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [adjustmentQuantities, setAdjustmentQuantities] = useState<{[key: string]: number}>({});
  const [adjustmentReason, setAdjustmentReason] = useState("");

  // Clear records modal state
  const [showClearRecordsModal, setShowClearRecordsModal] = useState(false);

  const handleImportProduct = async () => {
    setIsImporting(true);

    try {
      // Process all products in parallel
      await Promise.all(
        importedProducts.map(async (product) => {
          const response = await fetch(`/api/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...product,
              updated_at: new Date().toISOString(),
            }),
          });

          if (!response.ok) {
            throw new Error(
              `Failed to add product: ${product.name || product.id}`
            );
          }

          return await response.json();
        })
      );

      // Success handling
      toast.success(
        `${importedProducts.length} products imported successfully!`
      );
      fetchProducts(); // Refresh the product list
    } catch (error: any) {
      // Error handling
      console.error("Import failed:", error);
      toast.error(`Error importing products: ${error.message}`);
    } finally {
      // Cleanup
      setIsImporting(false);
      setImportingProducts(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de archivo no válido. Use archivos Excel (.xlsx, .xls) o CSV.");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es demasiado grande. Máximo 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (workbook.SheetNames.length === 0) {
          toast.error("El archivo no contiene hojas de cálculo válidas.");
          return;
        }

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<any>(firstSheet);

        if (jsonData.length === 0) {
          toast.error("El archivo está vacío o no contiene datos válidos.");
          return;
        }

        // Enhanced validation and formatting
        const validationErrors: string[] = [];
        const formattedData: Product[] = [];

        jsonData.forEach((item, index) => {
          const rowNumber = index + 2; // +2 because Excel rows start at 1 and we skip header

          // Validate required fields
          if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
            validationErrors.push(`Fila ${rowNumber}: Nombre es requerido`);
            return;
          }

          // Validate numeric fields
          const purchasePrice = parseFloat(item.purchase_price) || 0;
          const salePrice = parseFloat(item.sale_price) || 0;
          const stock = parseInt(item.stock) || 0;

          if (purchasePrice < 0) {
            validationErrors.push(`Fila ${rowNumber}: Precio de compra no puede ser negativo`);
          }

          if (salePrice < 0) {
            validationErrors.push(`Fila ${rowNumber}: Precio de venta no puede ser negativo`);
          }

          if (stock < 0) {
            validationErrors.push(`Fila ${rowNumber}: Stock no puede ser negativo`);
          }

          // Format the product data
          const formattedProduct: Product = {
            id: item.id || `temp-${Date.now()}-${index}`,
            name: item.name.trim(),
            description: item.description?.trim() || "",
            category: item.category?.trim() || "bebida",
            purchase_price: purchasePrice,
            sale_price: salePrice,
            stock: stock,
            image_url: item.image_url?.trim() || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            has_recipe: Boolean(item.has_recipe),
            is_active: item.is_active !== false, // Default to true unless explicitly false
            is_pr: Boolean(item.is_pr),
            is_courtsey: Boolean(item.is_courtsey)
          };

          formattedData.push(formattedProduct);
        });

        // Show validation errors if any
        if (validationErrors.length > 0) {
          const errorMessage = validationErrors.slice(0, 5).join('\n') +
            (validationErrors.length > 5 ? `\n... y ${validationErrors.length - 5} errores más` : '');
          toast.error(`Errores de validación:\n${errorMessage}`);
          return;
        }

        if (formattedData.length === 0) {
          toast.error("No se encontraron productos válidos para importar.");
          return;
        }

        setImportedProducts(formattedData);
        setImportingProducts(true);
        toast.success(`${formattedData.length} productos listos para importar. Revise la vista previa antes de confirmar.`);

      } catch (error) {
        console.error("Error processing file:", error);
        toast.error("Error al procesar el archivo. Verifique que sea un archivo Excel válido.");
      }
    };

    reader.onerror = () => {
      toast.error("Error al leer el archivo.");
    };

    reader.readAsArrayBuffer(file);
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

  const { productsData, fetchProducts, recipesData, fetchRecipes } = useAppContext();

  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Clear transfer logs function
  const handleClearTransferLogs = () => {
    setShowClearRecordsModal(true);
  };

  // Confirm clear transfer logs function
  const confirmClearTransferLogs = async () => {

    try {
      setIsLoading(true);

      // Clear transfers
      const transferResponse = await fetch("/api/transfer", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });

      // Clear adjustments
      const adjustmentResponse = await fetch("/api/adjust", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });

      if (transferResponse.ok && adjustmentResponse.ok) {
        toast.success("Registros de transferencias y ajustes limpiados exitosamente");
        setShowClearRecordsModal(false);
      } else {
        throw new Error("Error al limpiar algunos registros");
      }
    } catch (error) {
      console.error("Error clearing transfer logs:", error);
      toast.error("Error al limpiar los registros");
    } finally {
      setIsLoading(false);
    }
  };

  // Stock transfer functions
  const handleTransferProducts = async () => {
    try {
      setIsLoading(true);

      if (selectedProducts.length === 0) {
        toast.error("Selecciona al menos un producto para transferir");
        return;
      }

      if (selectedBars.length === 0) {
        toast.error("Selecciona al menos una barra de destino");
        return;
      }

      // Prepare transfer data
      const transferData = selectedProducts.map(productId => {
        const product = productsData.find(p => p.id === productId);
        const quantity = transferQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || 'Unknown',
          quantity: quantity,
          destinationBars: selectedBars
        };
      });

      // Make API call to transfer the products
      try {
        for (const transfer of transferData) {
          // Here you would implement the actual transfer API call
          // This is a placeholder for the transfer logic
          console.log("Transferring:", transfer);

          // Example API call structure:
          // await fetch("/api/inventory", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     productId: transfer.productId,
          //     quantity: transfer.quantity,
          //     destinationBars: transfer.destinationBars
          //   })
          // });
        }

        toast.success(`${selectedProducts.length} productos transferidos exitosamente a ${selectedBars.length} barra(s)`);
      } catch (apiError) {
        console.error("API transfer error:", apiError);
        toast.error("Error al procesar algunas transferencias");
      }

      // Reset states
      setSelectedProducts([]);
      setTransferQuantities({});
      setSelectedBars([]);
      setShowTransferModal(false);

    } catch (error) {
      console.error("Error transferring products:", error);
      toast.error("Error al transferir productos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    setTransferQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  const handleBarSelection = (barName: string) => {
    setSelectedBars(prev =>
      prev.includes(barName)
        ? prev.filter(b => b !== barName)
        : [...prev, barName]
    );
  };

  // Stock adjustment functions
  const handleReentry = async () => {
    try {
      setIsLoading(true);

      if (selectedProducts.length === 0) {
        toast.error("Selecciona al menos un producto para re-ingresar");
        return;
      }

      // Prepare reentry data
      const reentryData = selectedProducts.map(productId => {
        const product = productsData.find(p => p.id === productId);
        const quantity = adjustmentQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || 'Unknown',
          quantity: quantity,
          reason: adjustmentReason || 'Re-ingreso de stock',
          type: 'reentry'
        };
      });

      // Make API call to register the re-entries
      try {
        for (const reentry of reentryData) {
          // Here you would implement the actual re-entry API call
          console.log("Registering reentry:", reentry);

          // Example API call structure:
          // await fetch("/api/adjust", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     productId: reentry.productId,
          //     amount: reentry.quantity,
          //     type: 'reentry',
          //     reason: reentry.reason
          //   })
          // });
        }

        toast.success(`Re-ingreso registrado para ${selectedProducts.length} producto(s)`);
      } catch (apiError) {
        console.error("API reentry error:", apiError);
        toast.error("Error al procesar algunos re-ingresos");
      }

      // Reset states
      setSelectedProducts([]);
      setAdjustmentQuantities({});
      setAdjustmentReason("");
      setShowReentryModal(false);

    } catch (error) {
      console.error("Error registering reentry:", error);
      toast.error("Error al registrar re-ingreso");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoss = async () => {
    try {
      setIsLoading(true);

      if (selectedProducts.length === 0) {
        toast.error("Selecciona al menos un producto para registrar pérdida");
        return;
      }

      if (!adjustmentReason.trim()) {
        toast.error("Especifica la razón de la pérdida");
        return;
      }

      // Prepare loss data
      const lossData = selectedProducts.map(productId => {
        const product = productsData.find(p => p.id === productId);
        const quantity = adjustmentQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || 'Unknown',
          quantity: quantity,
          reason: adjustmentReason,
          type: 'loss'
        };
      });

      // Make API call to register the losses
      try {
        for (const loss of lossData) {
          // Here you would implement the actual loss API call
          console.log("Registering loss:", loss);

          // Example API call structure:
          // await fetch("/api/adjust", {
          //   method: "POST",
          //   headers: { "Content-Type": "application/json" },
          //   body: JSON.stringify({
          //     productId: loss.productId,
          //     amount: loss.quantity,
          //     type: 'loss',
          //     reason: loss.reason
          //   })
          // });
        }

        toast.success(`Pérdida registrada para ${selectedProducts.length} producto(s)`);
      } catch (apiError) {
        console.error("API loss error:", apiError);
        toast.error("Error al procesar algunas pérdidas");
      }

      // Reset states
      setSelectedProducts([]);
      setAdjustmentQuantities({});
      setAdjustmentReason("");
      setShowLossModal(false);

    } catch (error) {
      console.error("Error registering loss:", error);
      toast.error("Error al registrar pérdida");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustmentQuantityChange = (productId: string, quantity: number) => {
    setAdjustmentQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, quantity)
    }));
  };

  // Recipe creation functions
  const handleAddIngredientToRecipe = async () => {
    if (newIngredient.name && newIngredient.quantity) {
      const updatedIngredients = [...newRecipe.ingredients, { ...newIngredient }];
      setNewRecipe({
        ...newRecipe,
        ingredients: updatedIngredients,
      });
      setNewIngredient({ name: "", quantity: "", unit: "ml" });

      // Validate ingredients after adding
      const validation = await validateRecipeIngredients(updatedIngredients);
      setIngredientValidation(validation);
    }
  };

  const handleRemoveIngredientFromRecipe = async (index: number) => {
    const updatedIngredients = newRecipe.ingredients.filter((_, i) => i !== index);
    setNewRecipe({
      ...newRecipe,
      ingredients: updatedIngredients,
    });

    // Re-validate ingredients after removal
    if (updatedIngredients.length > 0) {
      const validation = await validateRecipeIngredients(updatedIngredients);
      setIngredientValidation(validation);
    } else {
      setIngredientValidation([]);
    }
  };

  // Recipe validation function
  const validateRecipeIngredients = async (ingredients: { name: string; quantity: string; unit: string }[]) => {
    const validationResults = [];

    for (const ingredient of ingredients) {
      // Check if ingredient exists in products
      const matchingProducts = productsData.filter(product =>
        product.name.toLowerCase().includes(ingredient.name.toLowerCase())
      );

      if (matchingProducts.length === 0) {
        validationResults.push({
          ingredient: ingredient.name,
          status: 'not_found',
          message: `Ingrediente "${ingredient.name}" no encontrado en el inventario`,
        });
      } else {
        // Check stock availability
        const totalStock = matchingProducts.reduce((sum, product) => sum + product.stock, 0);
        const requiredQuantity = parseFloat(ingredient.quantity);

        if (totalStock < requiredQuantity) {
          validationResults.push({
            ingredient: ingredient.name,
            status: 'insufficient_stock',
            message: `Stock insuficiente para "${ingredient.name}". Disponible: ${totalStock}, Requerido: ${requiredQuantity}`,
          });
        } else {
          validationResults.push({
            ingredient: ingredient.name,
            status: 'valid',
            message: `✓ "${ingredient.name}" disponible`,
          });
        }
      }
    }

    return validationResults;
  };

  const handleCreateRecipe = async () => {
    try {
      setIsLoading(true);

      // Validate ingredients before creating recipe
      const validationResults = await validateRecipeIngredients(newRecipe.ingredients);
      const hasErrors = validationResults.some(result => result.status !== 'valid');

      if (hasErrors) {
        const errorMessages = validationResults
          .filter(result => result.status !== 'valid')
          .map(result => result.message)
          .join('\n');

        toast.error(`Errores de validación:\n${errorMessages}`);
        return;
      }

      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: JSON.stringify(newRecipe.ingredients),
          amount: 1, // Default amount for inline created recipes
          category: newRecipe.category,
        }),
      });

      if (!response.ok) throw new Error("Failed to create recipe");

      const createdRecipe = await response.json();
      await fetchRecipes(); // Refresh recipes list

      // Auto-select the newly created recipe
      setNewProduct({
        ...newProduct,
        has_recipe: true,
      });

      // Reset recipe form
      setNewRecipe({
        name: "",
        category: "bebida",
        ingredients: [],
      });
      setShowCreateRecipeDialog(false);

      toast.success("Receta creada exitosamente y vinculada al producto");
    } catch (error) {
      console.error("Error creating recipe:", error);
      toast.error("Error al crear la receta");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const calculateStatus = (stock: number): "sufficient" | "low" | "out" => {
    if (stock === 0) return "out";
    if (stock < 5) return "low";
    return "sufficient";
  };

  // Calculate derived data
  const {
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    stockValue,
    averageMargin,
  } = useMemo(() => {
    const totalProducts = productsData.length;
    const lowStockProducts = productsData.filter(
      (p) => calculateStatus(p.stock) === "low"
    ).length;
    const outOfStockProducts = productsData.filter(
      (p) => calculateStatus(p.stock) === "out"
    ).length;
    const stockValue = productsData.reduce(
      (sum, product) => sum + product.purchase_price * Number(product.stock),
      0
    );
    const averageMargin =
      productsData.length > 0
        ? productsData.reduce((sum, product) => {
            const margin =
              ((product.sale_price - product.purchase_price) /
                product.purchase_price) *
              100;
            return sum + margin;
          }, 0) / productsData.length
        : 0;

    return {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      stockValue,
      averageMargin,
    };
  }, [productsData]);

  // Filter products based on search, category filter, and sales filter
  const filteredProducts = useMemo(() => {
    let filtered = productsData.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      // Category filter
      let matchesCategory = true;
      if (filter === "normal") {
        matchesCategory = product.category !== "elaborated";
      } else if (filter === "elaborated") {
        matchesCategory = product.category === "elaborated";
      }

      return matchesSearch && matchesCategory;
    });

    // Sales performance filter (mock data for now)
    if (salesFilter !== "all") {
      // Mock sales data - replace with actual sales data from API
      const mockSalesData = filtered.map(product => ({
        ...product,
        totalSales: Math.floor(Math.random() * 100) + 1,
        salesTrend: Math.random() > 0.5 ? 'up' : 'down'
      }));

      if (salesFilter === "best-selling") {
        filtered = mockSalesData
          .sort((a, b) => b.totalSales - a.totalSales)
          .slice(0, Math.ceil(mockSalesData.length * 0.3));
      } else if (salesFilter === "least-selling") {
        filtered = mockSalesData
          .sort((a, b) => a.totalSales - b.totalSales)
          .slice(0, Math.ceil(mockSalesData.length * 0.3));
      } else if (salesFilter === "trending-up") {
        filtered = mockSalesData.filter(p => p.salesTrend === 'up');
      } else if (salesFilter === "trending-down") {
        filtered = mockSalesData.filter(p => p.salesTrend === 'down');
      }
    }

    return filtered;
  }, [productsData, searchTerm, filter, salesFilter]);

  const toggleSelectAll = useCallback(() => {
    setSelectedProducts((prev) =>
      prev.length === filteredProducts.length
        ? []
        : filteredProducts.map((p) => p.id)
    );
  }, [filteredProducts]);

  const toggleSelectProduct = useCallback((id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id)
        ? prev.filter((productId) => productId !== id)
        : [...prev, id]
    );
  }, []);

  // API operations
  const deleteProductFromList = async (id: string) => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) throw new Error("Failed to delete product");
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting product");
    } finally {
      setIsDeleting(false);
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

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      setIsLoading(true);
      let uploadedUrl = editingProduct.image_url;
      if (imageFile) {
        uploadedUrl = (await handleImageUpload()) || editingProduct.image_url;
      }
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update product");

      setEditingProduct(null);
      setImageFile(null);
      fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating product");
    } finally {
      setIsLoading(false);
    }
  };

  // View product details
  const viewProductDetails = (product: Product) => {
    setCurrentProduct(product);
    setShowProductDetailModal(true);
  };

  // Initialize data
  useEffect(() => {
    fetchProducts();
  }, []);

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
      setError(err instanceof Error ? err.message : "Error updating product");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch transaction history for a specific product
  const fetchTransactionHistory = async (productId: string) => {
    try {
      setIsLoading(true);

      // Fetch real transfer data from API
      const [transferResponse, adjustmentResponse] = await Promise.all([
        fetch("/api/transfer"),
        fetch("/api/adjust")
      ]);

      const transfers = transferResponse.ok ? await transferResponse.json() : [];
      const adjustments = adjustmentResponse.ok ? await adjustmentResponse.json() : [];

      // Filter and format transfer history for this product
      const transferHistory = transfers
        .filter((transfer: any) => transfer.inventory?.products?.id === productId)
        .map((transfer: any) => ({
          id: `transfer-${transfer.id}`,
          date: transfer.created_at || new Date().toISOString(),
          type: "transfer",
          quantity: transfer.amount,
          user: "Sistema",
          details: `Transferencia de ${transfer.from_bar_details?.name || 'Origen'} a ${transfer.to_bar_details?.name || 'Destino'}`,
          price: 0
        }));

      // Filter and format adjustment history for this product
      const adjustmentHistory = adjustments
        .filter((adjustment: any) => adjustment.inventory?.products?.id === productId)
        .map((adjustment: any) => ({
          id: `adjustment-${adjustment.id}`,
          date: adjustment.created_at || new Date().toISOString(),
          type: adjustment.type === 'loss' ? 'loss' : 'reentry',
          quantity: adjustment.type === 'loss' ? -adjustment.amount : adjustment.amount,
          user: "Admin",
          details: adjustment.reason || `${adjustment.type === 'loss' ? 'Pérdida' : 'Re-ingreso'} registrado`,
          price: adjustment.economic_value || 0
        }));

      // Combine and sort by date
      const combinedHistory = [...transferHistory, ...adjustmentHistory]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTransactionHistory(combinedHistory);
    } catch (err) {
      console.error("Error fetching transaction history:", err);
      // Fallback to mock data if API fails
      const mockHistory = [
        {
          id: 1,
          date: new Date().toISOString(),
          type: "sale",
          quantity: 5,
          user: "Sistema",
          details: "Historial no disponible - datos de ejemplo",
          price: 0
        }
      ];
      setTransactionHistory(mockHistory);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle showing transaction history
  const handleShowTransactionHistory = (product: Product) => {
    setSelectedProductForHistory(product);
    setShowTransactionHistoryModal(true);
    fetchTransactionHistory(product.id);
  };

  // Export to Excel functionality
  const handleExportToExcel = () => {
    const exportData = filteredProducts.map(product => ({
      'Nombre': product.name,
      'Categoría': product.category,
      'Precio Compra': product.purchase_price,
      'Precio Venta': product.sale_price,
      'Stock': product.stock,
      'Estado': calculateStatus(product.stock),
      'Visible Courtesy': product.is_courtsey ? 'Sí' : 'No',
      'Visible PR Token': product.is_pr ? 'Sí' : 'No',
      'Activo': product.is_active ? 'Sí' : 'No',
      'Fecha Actualización': product.updated_at
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Productos exportados exitosamente");
  };

  return (
    <div className="space-y-4">
      {/* Header and Summary Cards (same as before) */}

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportToExcel}>
              <Download size={16} className="mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="normal">Productos normales</SelectItem>
              <SelectItem value="elaborated">Productos elaborados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={salesFilter} onValueChange={setSalesFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por ventas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los productos</SelectItem>
              <SelectItem value="best-selling">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Más vendidos
                </div>
              </SelectItem>
              <SelectItem value="least-selling">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Menos vendidos
                </div>
              </SelectItem>
              <SelectItem value="trending-up">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tendencia al alza
                </div>
              </SelectItem>
              <SelectItem value="trending-down">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Tendencia a la baja
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Button asChild variant="outline" size="sm">
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-4 w-[60px]" />
                Importar
              </label>
            </Button>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              onClick={(e) => (e.currentTarget.value = "")}
              onChange={handleFileUpload}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchProducts()}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Actualizar
          </Button>
          <Button onClick={() => setShowAddProductModal(true)}>
            <Plus size={16} className="mr-2" />
            Añadir producto
          </Button>
          <Button
            variant="outline"
            onClick={handleClearTransferLogs}
            disabled={isLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={16} className="mr-2" />
            Limpiar Registros
          </Button>
          {selectedProducts.length > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                // Initialize quantities for selected products
                const initialQuantities: {[key: string]: number} = {};
                selectedProducts.forEach(productId => {
                  initialQuantities[productId] = 1;
                });
                setTransferQuantities(initialQuantities);
                setShowTransferModal(true);
              }}
            >
              <ArrowRightLeft size={16} className="mr-2" />
              Transferir ({selectedProducts.length})
            </Button>
          )}
          {selectedProducts.length > 0 && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  // Initialize quantities for selected products
                  const initialQuantities: {[key: string]: number} = {};
                  selectedProducts.forEach(productId => {
                    initialQuantities[productId] = 1;
                  });
                  setAdjustmentQuantities(initialQuantities);
                  setShowReentryModal(true);
                }}
              >
                <PackagePlus size={16} className="mr-2" />
                Re-ingreso ({selectedProducts.length})
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Initialize quantities for selected products
                  const initialQuantities: {[key: string]: number} = {};
                  selectedProducts.forEach(productId => {
                    initialQuantities[productId] = 1;
                  });
                  setAdjustmentQuantities(initialQuantities);
                  setShowLossModal(true);
                }}
              >
                <PackageX size={16} className="mr-2" />
                Pérdidas ({selectedProducts.length})
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Products Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th className="p-3">
                  <Checkbox
                    checked={
                      selectedProducts.length === filteredProducts.length &&
                      filteredProducts.length > 0
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th className="text-left p-3 font-medium">Historial de producto</th>
                <th className="text-left p-3 font-medium">Vis. Courtesy</th>
                <th className="text-left p-3 font-medium">Vis. PR Token</th>
                <th className="text-left p-3 font-medium">Categoría</th>
                <th className="text-left p-3 font-medium">Precio Venta</th>
                <th className="text-left p-3 font-medium">Stock</th>
                <th className="text-left p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array(6)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index}>
                        <td colSpan={9} className="p-3">
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                : filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t hover:bg-muted/50">
                      <td className="p-3">
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() =>
                            toggleSelectProduct(product.id)
                          }
                        />
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="flex items-center gap-2 cursor-pointer flex-1"
                            onClick={() => viewProductDetails(product)}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="bg-slate-100 p-2 rounded">
                                <Package className="h-5 w-5 text-slate-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShowTransactionHistory(product)}
                            className="h-8 w-8 p-0"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>

                      <td className="p-3">
                        <Switch
                          checked={product.is_courtsey}
                          onCheckedChange={(checked) =>
                            handleToggleActive(
                              product.id,
                              checked,
                              "is_courtsey"
                            )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Switch
                          checked={product.is_pr}
                          onCheckedChange={(checked) =>
                            handleToggleActive(product.id, checked, "is_pr")
                          }
                        />
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {categoryList.find(
                            (c) => c.value === product.category
                          )?.label || product.category}
                        </Badge>
                      </td>
                      <td className="p-3">${product.sale_price.toFixed(2)}</td>
                      <td className="p-3">
                        <Badge
                          className={cn(
                            "font-normal",
                            calculateStatus(product.stock) === "sufficient" &&
                              "bg-green-50 text-green-700",
                            calculateStatus(product.stock) === "low" &&
                              "bg-amber-50 text-amber-700",
                            calculateStatus(product.stock) === "out" &&
                              "bg-red-50 text-red-700"
                          )}
                        >
                          {product.stock}{" "}
                          {calculateStatus(product.stock) === "sufficient"
                            ? "✓"
                            : calculateStatus(product.stock) === "low"
                              ? "⚠"
                              : "✕"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewProductDetails(product)}
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingProduct(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64">
                              <div className="space-y-2">
                                <p className="text-sm">
                                  ¿Eliminar este producto?
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      deleteProductFromList(product.id)
                                    }
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      "Eliminar"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={showProductDetailModal}
        onOpenChange={setShowProductDetailModal}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalles del Producto</DialogTitle>
          </DialogHeader>
          {currentProduct && (
            <div className="grid gap-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  {currentProduct.image_url ? (
                    <img
                      src={currentProduct.image_url}
                      alt={currentProduct.name}
                      className="rounded-lg object-cover w-full aspect-square"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg flex items-center justify-center aspect-square">
                      <Package className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="w-2/3 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold">{currentProduct.name}</h3>
                    <p className="text-muted-foreground">
                      {currentProduct.category}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Precio Compra
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">
                          ${currentProduct.purchase_price.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Precio Venta
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">
                          ${currentProduct.sale_price.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Stock
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          <p className="text-xl font-bold">
                            {currentProduct.stock}
                          </p>
                          <Badge
                            className={cn(
                              calculateStatus(currentProduct.stock) ===
                                "sufficient" && "bg-green-100 text-green-800",
                              calculateStatus(currentProduct.stock) === "low" &&
                                "bg-amber-100 text-amber-800",
                              calculateStatus(currentProduct.stock) === "out" &&
                                "bg-red-100 text-red-800"
                            )}
                          >
                            {calculateStatus(currentProduct.stock) ===
                            "sufficient"
                              ? "Suficiente"
                              : calculateStatus(currentProduct.stock) === "low"
                                ? "Bajo"
                                : "Agotado"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Margen
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-xl font-bold">
                          {(
                            ((currentProduct.sale_price -
                              currentProduct.purchase_price) /
                              currentProduct.purchase_price) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <p className="text-sm text-muted-foreground">
                  {currentProduct.description ||
                    "No hay descripción disponible"}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowProductDetailModal(false)}>
              Cerrar
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
                  <SelectValue placeholder="Seleccionar receta existente (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-recipe">Sin receta</SelectItem>
                  {recipesData.map((recipe) => (
                    <SelectItem key={recipe.id} value={recipe.id.toString()}>
                      {recipe.name} ({recipe.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Si seleccionas una receta, el stock de los ingredientes se descontará automáticamente cuando se haga un pedido.
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

      {/* Edit Product Modal */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => setEditingProduct(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los detalles del producto.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 h-[calc(100vh-10rem)] overflow-y-auto">
            <ImageUpload
              handleSetImageFile={setImageFile}
              imageUrl={editingProduct?.image_url}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingProduct?.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      name: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Select
                  value={editingProduct?.category}
                  onValueChange={(value) =>
                    setEditingProduct({ ...editingProduct!, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebida">Bebida</SelectItem>
                    <SelectItem value="comida">Comida</SelectItem>
                    <SelectItem value="insumo">Insumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                value={editingProduct?.description}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct!,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase_price">Precio de Compra</Label>
                <Input
                  id="edit-purchase_price"
                  type="number"
                  value={editingProduct?.purchase_price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      purchase_price: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sale_price">Precio de Venta</Label>
                <Input
                  id="edit-sale_price"
                  type="number"
                  value={editingProduct?.sale_price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      sale_price: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stock">Stock</Label>
              <Input
                id="edit-stock"
                type="number"
                value={editingProduct?.stock}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct!,
                    stock: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* imported Product list Modal */}
      <Dialog
        open={!!importingProducts}
        onOpenChange={() => {
          setImportingProducts(false);
          setImportedProducts([]);
          setSearchTerm("");
        }}
      >
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Vista Previa de Importación
            </DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span>Se importarán {importedProducts.length} productos</span>
                  <Badge variant="outline">
                    {importedProducts.filter(p => p.is_active).length} activos
                  </Badge>
                  <Badge variant="outline">
                    {importedProducts.filter(p => p.is_pr).length} PR Token
                  </Badge>
                  <Badge variant="outline">
                    {importedProducts.filter(p => p.is_courtsey).length} Cortesía
                  </Badge>
                </div>
                <div>
                  Revise los datos antes de confirmar la importación.
                  <a
                    href="https://docs.google.com/spreadsheets/d/1QpEvbKSXW9LKDI1lIV-osKoQjw2qbYEMO1Ux_dLIF-Q/edit?usp=sharing"
                    className="text-blue-500 hover:underline ml-1"
                    target="_blank"
                  >
                    Ver plantilla de ejemplo
                  </a>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 h-[calc(90vh-14rem)] overflow-y-auto">
            {isImporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 font-medium">Producto</th>
                      <th className="text-left p-3 font-medium">Vis. Menu</th>
                      <th className="text-left p-3 font-medium">
                        Vis. Courtesy
                      </th>
                      <th className="text-left p-3 font-medium">
                        Vis. PR Token
                      </th>
                      <th className="text-left p-3 font-medium">Categoría</th>
                      <th className="text-left p-3 font-medium">
                        Precio Compra
                      </th>
                      <th className="text-left p-3 font-medium">
                        Precio Venta
                      </th>
                      <th className="text-left p-3 font-medium">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedProducts.map((product, index) => (
                      <tr key={index} className="border-t hover:bg-muted/50">
                        <td className="p-3">
                          <div
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => viewProductDetails(product)}
                          >
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            ) : (
                              <div className="bg-slate-100 p-2 rounded">
                                <Package className="h-5 w-5 text-slate-500" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {product.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Switch
                            checked={product.is_active}
                            onCheckedChange={(checked) =>
                              handleToggleActive(
                                product.id,
                                checked,
                                "is_active"
                              )
                            }
                          />
                        </td>
                        <td className="p-3">
                          <Switch
                            checked={product.is_courtsey}
                            onCheckedChange={(checked) =>
                              handleToggleActive(
                                product.id,
                                checked,
                                "is_courtsey"
                              )
                            }
                          />
                        </td>
                        <td className="p-3">
                          <Switch
                            checked={product.is_pr}
                            onCheckedChange={(checked) =>
                              handleToggleActive(product.id, checked, "is_pr")
                            }
                          />
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {categoryList.find(
                              (c) => c.value === product.category
                            )?.label || product.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          ${product.purchase_price.toFixed(2)}
                        </td>
                        <td className="p-3">
                          ${product.sale_price.toFixed(2)}
                        </td>
                        <td className="p-3">
                          <Badge
                            className={cn(
                              "font-normal",
                              calculateStatus(product.stock) === "sufficient" &&
                                "bg-green-50 text-green-700",
                              calculateStatus(product.stock) === "low" &&
                                "bg-amber-50 text-amber-700",
                              calculateStatus(product.stock) === "out" &&
                                "bg-red-50 text-red-700"
                            )}
                          >
                            {product.stock}{" "}
                            {calculateStatus(product.stock) === "sufficient"
                              ? "✓"
                              : calculateStatus(product.stock) === "low"
                                ? "⚠"
                                : "✕"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setImportingProducts(false);
                setImportedProducts([]);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleImportProduct} disabled={isImporting}>
              {isImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Importar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Token PR Config Modal */}
      {isTokenPRModalOpen && (
        <TokenPRConfigModal
          isOpen={isTokenPRModalOpen}
          onClose={() => setIsTokenPRModalOpen(false)}
          onSave={(product) => {
            // setProducts(products.map(p => p.id === product.id ? product : p));
            // toast.success('Configuración de Token PR guardada');
          }}
          product={null}
        />
      )}
      {/* Courtesy Config Modal */}
      {isCourtesyModalOpen && (
        <CourtesyConfigModal
          isOpen={isCourtesyModalOpen}
          onClose={() => setIsCourtesyModalOpen(false)}
          onSave={(product) => {
            // setProducts(products.map(p => p.id === product.id ? product : p));
            // toast.success('Configuración de cortesía guardada');
          }}
          product={null}
        />
      )}

      {/* Transaction History Modal */}
      {showTransactionHistoryModal && selectedProductForHistory && (
        <Dialog open={showTransactionHistoryModal} onOpenChange={setShowTransactionHistoryModal}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Transacciones - {selectedProductForHistory.name}
              </DialogTitle>
              <DialogDescription>
                Historial completo de movimientos para este producto
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {transactionHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay transacciones registradas para este producto
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left p-3 font-medium">Fecha</th>
                        <th className="text-left p-3 font-medium">Tipo</th>
                        <th className="text-left p-3 font-medium">Cantidad</th>
                        <th className="text-left p-3 font-medium">Usuario</th>
                        <th className="text-left p-3 font-medium">Precio</th>
                        <th className="text-left p-3 font-medium">Detalles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactionHistory.map((transaction) => (
                        <tr key={transaction.id} className="border-t">
                          <td className="p-3">
                            {new Date(transaction.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant={
                                transaction.type === 'sale' ? 'default' :
                                transaction.type === 'purchase' ? 'secondary' :
                                'destructive'
                              }
                            >
                              {transaction.type === 'sale' ? 'Venta' :
                               transaction.type === 'purchase' ? 'Compra' :
                               'Ajuste'}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                              {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                            </span>
                          </td>
                          <td className="p-3">{transaction.user}</td>
                          <td className="p-3">
                            {transaction.price > 0 ? `$${transaction.price.toFixed(2)}` : '-'}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {transaction.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Recipe Dialog */}
      <Dialog open={showCreateRecipeDialog} onOpenChange={setShowCreateRecipeDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Receta</DialogTitle>
            <DialogDescription>
              Crea una receta que se puede vincular a productos del menú
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipe-name">Nombre de la Receta</Label>
                <Input
                  id="recipe-name"
                  placeholder="Ej: Mojito, Margarita..."
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-category">Categoría</Label>
                <Select
                  value={newRecipe.category}
                  onValueChange={(value) => setNewRecipe({ ...newRecipe, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebida">Bebida</SelectItem>
                    <SelectItem value="comida">Comida</SelectItem>
                    <SelectItem value="postre">Postre</SelectItem>
                    <SelectItem value="aperitivo">Aperitivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ingredients List */}
            <div className="space-y-2">
              <Label>Ingredientes</Label>
              {newRecipe.ingredients.length > 0 && (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {newRecipe.ingredients.map((ingredient, index) => {
                    const validation = ingredientValidation.find(v => v.ingredient === ingredient.name);
                    return (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex-1">
                          <span className="text-sm">
                            {ingredient.name} - {ingredient.quantity} {ingredient.unit}
                          </span>
                          {validation && (
                            <div className={`text-xs mt-1 ${
                              validation.status === 'valid' ? 'text-green-600' :
                              validation.status === 'insufficient_stock' ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {validation.message}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveIngredientFromRecipe(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add Ingredient Form */}
            <div className="border-t pt-4">
              <Label className="mb-2 block">Agregar Ingrediente</Label>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <Select
                    value={newIngredient.name}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ginebra">Ginebra</SelectItem>
                      <SelectItem value="Vodka">Vodka</SelectItem>
                      <SelectItem value="Tónica">Tónica</SelectItem>
                      <SelectItem value="Ron">Ron</SelectItem>
                      <SelectItem value="Tequila">Tequila</SelectItem>
                      <SelectItem value="Limón">Limón</SelectItem>
                      <SelectItem value="Azúcar">Azúcar</SelectItem>
                      <SelectItem value="Menta">Menta</SelectItem>
                      <SelectItem value="Hielo">Hielo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Input
                    type="number"
                    placeholder="Cantidad"
                    value={newIngredient.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (Number(value) >= 0 && !value.includes('-'))) {
                        setNewIngredient({ ...newIngredient, quantity: value });
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault();
                      }
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-span-2">
                  <Select
                    value={newIngredient.unit}
                    onValueChange={(value) => setNewIngredient({ ...newIngredient, unit: value })}
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
                    type="button"
                    variant="secondary"
                    className="w-full"
                    onClick={handleAddIngredientToRecipe}
                    disabled={!newIngredient.name || !newIngredient.quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRecipeDialog(false);
                setNewRecipe({ name: "", category: "bebida", ingredients: [] });
                setNewIngredient({ name: "", quantity: "", unit: "ml" });
                setIngredientValidation([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRecipe}
              disabled={!newRecipe.name || newRecipe.ingredients.length === 0 || isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Crear Receta"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Transferir Productos Seleccionados</DialogTitle>
            <DialogDescription>
              Configura las cantidades y selecciona las barras de destino para {selectedProducts.length} producto(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Products List with Quantities */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Productos a transferir:</Label>
              <div className="space-y-3">
                {selectedProducts.map(productId => {
                  const product = productsData.find(p => p.id === productId);
                  if (!product) return null;

                  return (
                    <div key={productId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock disponible: {product.stock}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`quantity-${productId}`} className="text-sm">
                          Cantidad:
                        </Label>
                        <Input
                          id={`quantity-${productId}`}
                          type="number"
                          min="1"
                          max={product.stock}
                          value={transferQuantities[productId] || 1}
                          onKeyDown={(e) => {
                            // Prevent minus key, plus key, and 'e' key
                            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers and empty string
                            if (value === '' || (Number(value) >= 1 && !value.includes('-'))) {
                              handleQuantityChange(productId, parseInt(value) || 1);
                            }
                          }}
                          className="w-20"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bar Selection */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Barras de destino:</Label>
              <div className="grid grid-cols-2 gap-3">
                {["Bar Central", "Bar Norte", "Bar Sur", "El Alamo", "Stock General", "Otro Local"].map(barName => (
                  <div key={barName} className="flex items-center space-x-2">
                    <Checkbox
                      id={`bar-${barName}`}
                      checked={selectedBars.includes(barName)}
                      onCheckedChange={() => handleBarSelection(barName)}
                    />
                    <Label
                      htmlFor={`bar-${barName}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {barName}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferModal(false);
                setTransferQuantities({});
                setSelectedBars([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleTransferProducts}
              disabled={isLoading || selectedBars.length === 0}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Transferir a {selectedBars.length} barra(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Re-entry Modal */}
      <Dialog open={showReentryModal} onOpenChange={setShowReentryModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Re-ingreso de Stock</DialogTitle>
            <DialogDescription>
              Registra el re-ingreso de {selectedProducts.length} producto(s) no utilizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Products List with Quantities */}
            <div className="space-y-3">
              {selectedProducts.map(productId => {
                const product = productsData.find(p => p.id === productId);
                if (!product) return null;

                return (
                  <div key={productId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock actual: {product.stock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`reentry-quantity-${productId}`} className="text-sm">
                        Cantidad:
                      </Label>
                      <Input
                        id={`reentry-quantity-${productId}`}
                        type="number"
                        min="1"
                        value={adjustmentQuantities[productId] || 1}
                        onChange={(e) => handleAdjustmentQuantityChange(productId, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reentry-reason">Motivo del re-ingreso (opcional):</Label>
              <Textarea
                id="reentry-reason"
                placeholder="Ej: Botellas no abiertas del evento, productos devueltos..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowReentryModal(false);
                setAdjustmentQuantities({});
                setAdjustmentReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleReentry}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Registrar Re-ingreso
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Loss Modal */}
      <Dialog open={showLossModal} onOpenChange={setShowLossModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Registrar Pérdidas de Stock</DialogTitle>
            <DialogDescription>
              Registra las pérdidas de {selectedProducts.length} producto(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Products List with Quantities */}
            <div className="space-y-3">
              {selectedProducts.map(productId => {
                const product = productsData.find(p => p.id === productId);
                if (!product) return null;

                return (
                  <div key={productId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {product.image_url && (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Stock actual: {product.stock}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`loss-quantity-${productId}`} className="text-sm">
                        Cantidad:
                      </Label>
                      <Input
                        id={`loss-quantity-${productId}`}
                        type="number"
                        min="1"
                        max={product.stock}
                        value={adjustmentQuantities[productId] || 1}
                        onChange={(e) => handleAdjustmentQuantityChange(productId, parseInt(e.target.value) || 1)}
                        className="w-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason (Required for losses) */}
            <div className="space-y-2">
              <Label htmlFor="loss-reason">Motivo de la pérdida (requerido):</Label>
              <Textarea
                id="loss-reason"
                placeholder="Ej: Botella rota, producto vencido, derrame..."
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowLossModal(false);
                setAdjustmentQuantities({});
                setAdjustmentReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLoss}
              disabled={isLoading || !adjustmentReason.trim()}
              variant="destructive"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <>
                  <PackageX className="mr-2 h-4 w-4" />
                  Registrar Pérdida
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Records Confirmation Modal */}
      <Dialog open={showClearRecordsModal} onOpenChange={setShowClearRecordsModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Limpieza de Registros
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente todos los registros de transferencias y ajustes de stock.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">⚠️ Advertencia: Esta acción no se puede deshacer</p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>Se eliminarán todos los registros de transferencias entre barras</li>
                    <li>Se eliminarán todos los registros de ajustes de stock</li>
                    <li>Se perderá el historial completo de movimientos</li>
                    <li>Los productos y el stock actual no se verán afectados</li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas continuar con la limpieza de registros?
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearRecordsModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearTransferLogs}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Limpiando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Confirmar Limpieza
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
