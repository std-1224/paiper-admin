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
  SelectSeparator,
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
  const [showTransactionHistoryModal, setShowTransactionHistoryModal] =
    useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Edit modal recipe ingredients states (similar to creation flow)
  const [editRecipeIngredients, setEditRecipeIngredients] = useState<
    {
      name: string;
      quantity: string;
      unit: string;
      requiredQuantity: number;
      availableStock: number;
      stock: number;
    }[]
  >([]);

  // Store original ingredient quantities for calculating differences during edit
  const [originalIngredientQuantities, setOriginalIngredientQuantities] = useState<
    { [ingredientName: string]: number }
  >({});

  // Edit modal custom ingredients states
  const [editUseCustomIngredients, setEditUseCustomIngredients] =
    useState<boolean>(false);
  const [editCustomIngredients, setEditCustomIngredients] = useState<
    { name: string; quantity: string; unit: string; productId?: string }[]
  >([]);

  const [editCustomIngredientName, setEditCustomIngredientName] =
    useState<string>("");
  const [editIngredientQuantity, setEditIngredientQuantity] =
    useState<string>("");
  const [editIngredientUnit, setEditIngredientUnit] = useState<string>("ml");
  const [editIngredientRequiredQuantity, setEditIngredientRequiredQuantity] =
    useState<number>(1);

  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<Product | null>(null);
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
    ingredients: [] as { name: string; quantity: string; unit: string, availableStock?: string | number }[],
  });
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    availableStock: "1",
  });

  // Recipe selection states for product modal
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    {
      name: string;
      quantity: string;
      unit: string;
      requiredQuantity: number;
      availableStock: number;
      stock: number;
    }[]
  >([]);
  const [ingredientRequiredQuantity, setIngredientRequiredQuantity] =
    useState<number>(1);
  // const [stockValidationErrors, setStockValidationErrors] = useState<string[]>([]);
  const [ingredientValidation, setIngredientValidation] = useState<any[]>([]);

  // Custom ingredient states for adding individual ingredients
  const [useCustomIngredients, setUseCustomIngredients] =
    useState<boolean>(false);
  const [customIngredients, setCustomIngredients] = useState<
    { name: string; quantity: string; unit: string; productId?: string }[]
  >([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>("none");
  const [customIngredientName, setCustomIngredientName] = useState<string>("");
  const [ingredientQuantity, setIngredientQuantity] = useState<string>("");
  const [ingredientUnit, setIngredientUnit] = useState<string>("ml");

  // Recipe selection states for edit modal
  const [selectedEditRecipeId, setSelectedEditRecipeId] = useState<string>("");
  const [showCreateRecipeDialogEdit, setShowCreateRecipeDialogEdit] =
    useState(false);

  // Stock transfer states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferQuantities, setTransferQuantities] = useState<{
    [key: string]: number;
  }>({});
  const [selectedBars, setSelectedBars] = useState<string[]>([]);

  // Stock adjustment states
  const [showReentryModal, setShowReentryModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);
  const [adjustmentQuantities, setAdjustmentQuantities] = useState<{
    [key: string]: number;
  }>({});
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
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Tipo de archivo no válido. Use archivos Excel (.xlsx, .xls) o CSV."
      );
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
          if (
            !item.name ||
            typeof item.name !== "string" ||
            item.name.trim() === ""
          ) {
            validationErrors.push(`Fila ${rowNumber}: Nombre es requerido`);
            return;
          }

          // Validate numeric fields
          const purchasePrice = parseFloat(item.purchase_price) || 0;
          const salePrice = parseFloat(item.sale_price) || 0;
          const stock = parseInt(item.stock) || 0;

          if (purchasePrice < 0) {
            validationErrors.push(
              `Fila ${rowNumber}: Precio de compra no puede ser negativo`
            );
          }

          if (salePrice < 0) {
            validationErrors.push(
              `Fila ${rowNumber}: Precio de venta no puede ser negativo`
            );
          }

          if (stock < 0) {
            validationErrors.push(
              `Fila ${rowNumber}: Stock no puede ser negativo`
            );
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
            is_courtsey: Boolean(item.is_courtsey),
          };

          formattedData.push(formattedProduct);
        });

        // Show validation errors if any
        if (validationErrors.length > 0) {
          const errorMessage =
            validationErrors.slice(0, 5).join("\n") +
            (validationErrors.length > 5
              ? `\n... y ${validationErrors.length - 5} errores más`
              : "");
          toast.error(`Errores de validación:\n${errorMessage}`);
          return;
        }

        if (formattedData.length === 0) {
          toast.error("No se encontraron productos válidos para importar.");
          return;
        }

        setImportedProducts(formattedData);
        setImportingProducts(true);
        toast.success(
          `${formattedData.length} productos listos para importar. Revise la vista previa antes de confirmar.`
        );
      } catch (error) {
        console.error("Error processing file:", error);
        toast.error(
          "Error al procesar el archivo. Verifique que sea un archivo Excel válido."
        );
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
    type: "product", // Default type is "product"
    has_recipe: false,
  });

  const { productsData, fetchProducts, recipesData, fetchRecipes } =
    useAppContext();

  // Helper function to extract unit from description
  const extractUnitFromDescription = (description: string): string => {
    // Extract unit from description like "Unit: L, Conversion: 500g per unit"
    const unitMatch = description.match(/Unit:\s*([^,]+)/i);
    if (unitMatch) {
      return unitMatch[1].trim();
    }
    return "unidad"; // Default unit
  };

  // Helper function to extract conversion amount from description
  const extractConversionFromDescription = (description: string): number => {
    // Extract conversion amount from description like "Unit: g, Conversion: 100g per unit"
    const conversionMatch = description.match(/Conversion:\s*(\d+(?:\.\d+)?)/i);
    if (conversionMatch) {
      return parseFloat(conversionMatch[1]);
    }
    return 1; // Default conversion factor
  };

  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Validate stock whenever recipe ingredients change
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      // validateIngredientStock();
    }
  }, [recipeIngredients]);

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
        toast.success(
          "Registros de transferencias y ajustes limpiados exitosamente"
        );
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
    // Prevent multiple submissions
    if (isLoading) {
      console.log("Transfer already in progress, ignoring click");
      return;
    }

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
      const transferData = selectedProducts.map((productId) => {
        const product = productsData.find((p) => p.id === productId);
        const quantity = transferQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || "Unknown",
          quantity: quantity,
          destinationBars: selectedBars,
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

        toast.success(
          `${selectedProducts.length} productos transferidos exitosamente a ${selectedBars.length} barra(s)`
        );
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
    setTransferQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }));
  };

  const handleBarSelection = (barName: string) => {
    setSelectedBars((prev) =>
      prev.includes(barName)
        ? prev.filter((b) => b !== barName)
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
      const reentryData = selectedProducts.map((productId) => {
        const product = productsData.find((p) => p.id === productId);
        const quantity = adjustmentQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || "Unknown",
          quantity: quantity,
          reason: adjustmentReason || "Re-ingreso de stock",
          type: "reentry",
        };
      });

      // Make API call to register the re-entries
      try {
        for (const reentry of reentryData) {
          const response = await fetch("/api/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: reentry.productId,
              quantity: reentry.quantity,
              type: "re-entry",
              reason: reentry.reason,
              destinationBars: selectedBars.length > 0 ? selectedBars : [],
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al procesar re-ingreso");
          }
        }

        toast.success(
          `Re-ingreso registrado para ${selectedProducts.length} producto(s)`
        );

        // Refresh data
        await fetchProducts();
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
      const lossData = selectedProducts.map((productId) => {
        const product = productsData.find((p) => p.id === productId);
        const quantity = adjustmentQuantities[productId] || 1;

        return {
          productId: productId,
          productName: product?.name || "Unknown",
          quantity: quantity,
          reason: adjustmentReason,
          type: "loss",
        };
      });

      // Make API call to register the losses
      try {
        for (const loss of lossData) {
          const response = await fetch("/api/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              product: loss.productId,
              quantity: loss.quantity,
              type: "loss",
              reason: loss.reason,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error al procesar pérdida");
          }
        }

        toast.success(
          `Pérdida registrada para ${selectedProducts.length} producto(s)`
        );

        // Refresh data
        await fetchProducts();
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

  const handleAdjustmentQuantityChange = (
    productId: string,
    quantity: number
  ) => {
    setAdjustmentQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }));
  };

  // Recipe creation functions
  const handleAddIngredientToRecipe = async () => {
    if (newIngredient.name && newIngredient.quantity) {
      const updatedIngredients = [
        ...newRecipe.ingredients,
        { ...newIngredient },
      ];
      setNewRecipe({
        ...newRecipe,
        ingredients: updatedIngredients,
      });
      setNewIngredient({ name: "", quantity: "", unit: "ml", availableStock: "1" });

      // Validate ingredients after adding
      const validation = await validateRecipeIngredients(updatedIngredients);
      setIngredientValidation(validation);
    }
  };

  const handleRemoveIngredientFromRecipe = async (index: number) => {
    const updatedIngredients = newRecipe.ingredients.filter(
      (_, i) => i !== index
    );
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

  // Add ingredient to existing selected recipe
  const handleAddIngredientToExistingRecipe = async () => {
    if (!selectedRecipeId || !newIngredient.name || !newIngredient.quantity) {
      return;
    }

    try {
      setIsLoading(true);

      // Get the current recipe
      const currentRecipe = recipesData.find(
        (recipe) => recipe.id.toString() === selectedRecipeId
      );
      if (!currentRecipe) {
        toast.error("Could not find the selected recipe");
        return;
      }

      // Parse current ingredients
      let currentIngredients;
      try {
        currentIngredients =
          typeof currentRecipe.ingredients === "string"
            ? JSON.parse(currentRecipe.ingredients)
            : currentRecipe.ingredients || [];
      } catch (error) {
        console.error("Error parsing current recipe ingredients:", error);
        currentIngredients = [];
      }

      // Add new ingredient
      const updatedIngredients = [
        ...currentIngredients,
        {
          name: newIngredient.name,
          quantity: newIngredient.quantity,
          unit: newIngredient.unit,
        },
      ];

      // Update the recipe in the database
      const updatePayload = {
        id: selectedRecipeId,
        name: currentRecipe.name,
        ingredients: JSON.stringify(updatedIngredients),
        amount: currentRecipe.stock,
        category: currentRecipe.category,
      };

      const response = await fetch(`/api/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe");
      }

      // Update local recipe ingredients display immediately
      console.log("🔄 Updating local recipe ingredients display...");

      // Process the updated ingredients using the same logic as handleRecipeSelection
      const updatedRecipeIngredients = await Promise.all(
        updatedIngredients.map((ingredient: any) => {
          return {
            name: ingredient.name,
            quantity: ingredient.quantity.toString(),
            unit: ingredient.unit,
            requiredQuantity: 1, // Default quantity, user can modify
            availableStock: currentRecipe.stock || 0, // Use recipe stock as available stock
            stock: currentRecipe.stock || 0, // Recipe stock
          };
        })
      );

      // Update the recipe ingredients state immediately
      setRecipeIngredients(updatedRecipeIngredients);
      console.log(
        "✅ Local recipe ingredients updated immediately:",
        updatedRecipeIngredients
      );

      // Also refresh recipes data in background for consistency
      console.log("🔄 Refreshing recipes data in background...");
      fetchRecipes();

      // Reset ingredient form
      setNewIngredient({
        name: "",
        quantity: "",
        unit: "ml",
        availableStock: "1",
      });

      toast.success(
        `Ingredient "${newIngredient.name}" added to recipe successfully`
      );
    } catch (error) {
      console.error("Error adding ingredient to recipe:", error);
      toast.error("Error adding ingredient to recipe");
    } finally {
      setIsLoading(false);
    }
  };

  // Recipe validation function - simplified for recipe-centric approach
  const validateRecipeIngredients = async (
    ingredients: { name: string; quantity: string; unit: string }[]
  ) => {
    const validationResults = [];

    for (const ingredient of ingredients) {
      // Basic validation - just check if required fields are present
      if (!ingredient.name || !ingredient.quantity || !ingredient.unit) {
        validationResults.push({
          ingredient: ingredient.name || "Sin nombre",
          status: "invalid",
          message: `Ingrediente "${ingredient.name || "Sin nombre"}" tiene datos incompletos`,
        });
      } else {
        // Check if quantity is a valid number
        const quantity = parseFloat(ingredient.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          validationResults.push({
            ingredient: ingredient.name,
            status: "invalid",
            message: `Cantidad inválida para "${ingredient.name}". Debe ser un número mayor a 0`,
          });
        } else {
          validationResults.push({
            ingredient: ingredient.name,
            status: "valid",
            message: `✓ "${ingredient.name}" es válido`,
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
      const validationResults = await validateRecipeIngredients(
        newRecipe.ingredients
      );
      const hasErrors = validationResults.some(
        (result) => result.status !== "valid"
      );

      if (hasErrors) {
        const errorMessages = validationResults
          .filter((result) => result.status !== "valid")
          .map((result) => result.message)
          .join("\n");

        toast.error(`Errores de validación:\n${errorMessages}`);
        return;
      }

      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: newRecipe.ingredients, // Send ingredients directly as array
          amount: 1, // Default amount for inline created recipes
          category: newRecipe.category,
        }),
      });

      if (!response.ok) throw new Error("Failed to create recipe");

      const createdRecipeResponse = await response.json();
      // The API returns an array, so get the first element
      const createdRecipe = Array.isArray(createdRecipeResponse) ? createdRecipeResponse[0] : createdRecipeResponse;

      await fetchRecipes(); // Refresh recipes list

      // Process the newly created recipe ingredients directly since we have the data
      const processedIngredients = newRecipe.ingredients.map((ingredient: { name: string; quantity: string; unit: string }) => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit,
        requiredQuantity: ingredientRequiredQuantity,
        availableStock: createdRecipe.stock || 1,
        stock: createdRecipe.stock || 1,
      }));

      // Set the recipe selection and ingredients
      setSelectedRecipeId(createdRecipe.id.toString());
      setRecipeIngredients(processedIngredients);
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
      console.error("❌ Error creating recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error al crear la receta: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Recipe selection functions
  const handleRecipeSelection = async (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setIngredientRequiredQuantity(1); // Reset ingredient quantity

    if (!recipeId || recipeId === "no-recipe") {
      setRecipeIngredients([]);
      // setStockValidationErrors([]);
      setNewProduct({ ...newProduct, has_recipe: false });
      return;
    }

    // Check if the selected item is an ingredient first (from productsData)
    const selectedIngredient = productsData.find(
      (product) =>
        product.type === "ingredient" && product.id.toString() === recipeId
    );

    if (selectedIngredient) {
      // For ingredients, clear recipeIngredients to hide "Ingredientes de la receta" section
      // The ingredient info panel will show the ingredient details instead
      setRecipeIngredients([]);
      // setStockValidationErrors([]);
      setNewProduct({ ...newProduct, has_recipe: true });
      return;
    }

    // Find the selected recipe (only actual recipes, not ingredients)
    const selectedRecipe = recipesData.find(
      (recipe) => recipe.id.toString() === recipeId && recipe.type === "recipe"
    );

    if (!selectedRecipe) {
      // Recipe not found
      return;
    }

    // Handle recipes (existing logic)
    if (!selectedRecipe.ingredients) {
      return;
    }

    // Parse recipe ingredients
    let ingredients;
    try {
      ingredients =
        typeof selectedRecipe.ingredients === "string"
          ? JSON.parse(selectedRecipe.ingredients)
          : selectedRecipe.ingredients;
    } catch (error) {
      console.error("Error parsing recipe ingredients:", error);
      return;
    }

    console.log("ingredients: ", ingredients);

    // Set recipe ingredients with recipe stock as available stock
    const ingredientsWithStock = ingredients.map((ingredient: any) => {
      return {
        ...ingredient,
        requiredQuantity: 1, // Default quantity, user can modify
        availableStock: selectedRecipe.stock || 0, // Use recipe stock as available stock
        stock: selectedRecipe.stock || 0, // Recipe stock
      };
    });

    setRecipeIngredients(ingredientsWithStock);
    setNewProduct({ ...newProduct, has_recipe: true });
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    const updatedIngredients = [...recipeIngredients];
    updatedIngredients[index].requiredQuantity = quantity;
    setRecipeIngredients(updatedIngredients);

    // Validate stock
    // validateIngredientStock();
  };

  // Function to update ingredient quantities in edit modal
  const updateEditIngredientQuantity = (index: number, quantity: number) => {
    const updatedIngredients = [...editRecipeIngredients];
    updatedIngredients[index].requiredQuantity = quantity;
    setEditRecipeIngredients(updatedIngredients);

    console.log(`🔄 Updated ingredient ${index} to quantity ${quantity}`);
    console.log("Updated editRecipeIngredients:", updatedIngredients);
    console.log("Current editRecipeIngredients state:", editRecipeIngredients);
  };

  // const validateIngredientStock = () => {
  //   const errors: string[] = [];

  //   recipeIngredients.forEach((ingredient) => {
  //     const totalRequired = parseFloat(ingredient.quantity) * ingredient.requiredQuantity;
  //     if (totalRequired > ingredient.availableStock) {
  //       errors.push(`${ingredient.name}: Necesitas ${totalRequired}${ingredient.unit}, pero solo hay ${ingredient.availableStock}${ingredient.unit} disponible`);
  //     }
  //   });

  //   setStockValidationErrors(errors);
  // };

  // Add custom ingredient function
  const addCustomIngredient = () => {
    let ingredientName = "";
    let productId = undefined;
    let matchingProduct = null;

    if (selectedIngredient === "none") {
      ingredientName = customIngredientName;
      // Try to find matching product for custom ingredient
      matchingProduct = productsData.find(
        (product) =>
          product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
          ingredientName.toLowerCase().includes(product.name.toLowerCase())
      );
    } else if (selectedIngredient) {
      ingredientName = selectedIngredient;
      // Try to find matching product in stock
      matchingProduct = productsData.find(
        (product) =>
          product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
          ingredientName.toLowerCase().includes(product.name.toLowerCase())
      );
    } else {
      ingredientName = customIngredientName;
    }

    if (matchingProduct) {
      productId = matchingProduct.id;
    }

    // Validate that ingredient name and quantity are provided
    if (!ingredientName.trim()) {
      toast.error("Por favor ingresa el nombre del ingrediente");
      return;
    }
    if (!ingredientQuantity.trim()) {
      toast.error("Por favor ingresa la cantidad del ingrediente");
      return;
    }

    // Validate stock availability for this ingredient
    const requiredQuantity = parseFloat(ingredientQuantity);
    if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
      toast.error("Por favor ingresa una cantidad válida");
      return;
    }

    if (matchingProduct) {
      if (matchingProduct.stock < requiredQuantity) {
        toast.error(
          `Stock insuficiente para ${ingredientName}:\nRequerido: ${requiredQuantity} ${ingredientUnit}\nDisponible: ${matchingProduct.stock}`
        );
        return;
      }
    } else {
      // Warn if no matching product found
      const confirmAdd = confirm(
        `No se encontró un producto en stock que coincida con "${ingredientName}".\n¿Deseas agregar este ingrediente de todas formas?`
      );
      if (!confirmAdd) {
        return;
      }
    }

    setCustomIngredients([
      ...customIngredients,
      {
        name: ingredientName.trim(),
        quantity: ingredientQuantity,
        unit: ingredientUnit,
        productId: productId,
      },
    ]);
    setSelectedIngredient("none");
    setCustomIngredientName("");
    setIngredientQuantity("");
    setIngredientUnit("ml");
  };

  const removeCustomIngredient = (index: number) => {
    const updatedIngredients = customIngredients.filter((_, i) => i !== index);
    setCustomIngredients(updatedIngredients);
  };

  // Function to deduct stock for custom ingredients
  const deductCustomIngredientStock = async (
    ingredients: {
      name: string;
      quantity: string;
      unit: string;
      productId?: string;
    }[],
    productAmount: number
  ) => {
    for (const ingredient of ingredients) {
      const requiredQuantity = parseFloat(ingredient.quantity) * productAmount;

      // Skip if no linked product
      if (!ingredient.productId) {
        console.warn(
          `No linked product for ingredient: ${ingredient.name}. Skipping stock deduction.`
        );
        continue;
      }

      try {
        // Deduct stock from the linked product
        const response = await fetch(`/api/products`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: ingredient.productId,
            stock: Math.max(
              0,
              (productsData.find((p) => p.id === ingredient.productId)?.stock ||
                0) - requiredQuantity
            ),
          }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to deduct stock for ingredient: ${ingredient.name}`
          );
        }

        console.log(
          `Deducted ${requiredQuantity} units of ${ingredient.name} from stock`
        );
      } catch (error) {
        console.error(`Error deducting stock for ${ingredient.name}:`, error);
        toast.error(`Error deducting stock for ${ingredient.name}`);
      }
    }
  };

  // Function to deduct stock for recipe ingredients based on quantity differences during edit
  const deductRecipeIngredientStockDifference = async (
    newIngredients: any[],
    originalQuantities: { [ingredientName: string]: number }
  ) => {
    try {
      console.log("=== STOCK DIFFERENCE CALCULATION ===");
      console.log("New ingredients:", newIngredients);
      console.log("Original quantities:", originalQuantities);

      // Find the recipe that contains these ingredients
      // Based on your sample data: Recipe has type="recipe" and matching ingredient names
      console.log("Available recipes:", recipesData.map(r => ({
        id: r.id,
        name: r.name,
        type: r.type,
        hasIngredients: !!r.ingredients
      })));

      const matchingRecipe = recipesData.find((recipe) => {
        // Must be a recipe type with ingredients
        if (recipe.type !== "recipe" || !recipe.ingredients) {
          return false;
        }

        try {
          const recipeIngredients = typeof recipe.ingredients === "string"
            ? JSON.parse(recipe.ingredients)
            : recipe.ingredients;

          // Check if all new ingredients exist in this recipe by name
          const allIngredientsMatch = newIngredients.every(newIng =>
            recipeIngredients.some((recipeIng: any) => recipeIng.name === newIng.name)
          );

          console.log(`Recipe "${recipe.name}":`, {
            recipeIngredientNames: recipeIngredients.map((ing: any) => ing.name),
            newIngredientNames: newIngredients.map(ing => ing.name),
            matches: allIngredientsMatch
          });

          return allIngredientsMatch;
        } catch (error) {
          console.error(`Error parsing recipe ${recipe.name} ingredients:`, error);
          return false;
        }
      });

      if (!matchingRecipe) {
        console.error("❌ No matching recipe found for these ingredients");
        console.log("Looking for ingredients:", newIngredients.map(ing => ing.name));
        return;
      }

      console.log(`✅ Found matching recipe: "${matchingRecipe.name}"`);

      // Parse recipe ingredients
      let recipeIngredients;
      try {
        recipeIngredients = typeof matchingRecipe.ingredients === "string"
          ? JSON.parse(matchingRecipe.ingredients)
          : matchingRecipe.ingredients;
      } catch (error) {
        console.error("Error parsing recipe ingredients:", error);
        return;
      }

      // Calculate differences and update availableStock
      const updatedIngredients = recipeIngredients.map((recipeIng: any) => {
        const newIng = newIngredients.find(ing => ing.name === recipeIng.name);
        if (newIng) {
          const originalQuantity = originalQuantities[recipeIng.name] || 0;
          const newQuantity = newIng.requiredQuantity || 0;
          const difference = newQuantity - originalQuantity;

          // Calculate new availableStock: current - difference
          const currentAvailableStock = recipeIng.availableStock || 0;
          const newAvailableStock = Math.max(0, currentAvailableStock - difference);

          console.log(`📊 ${recipeIng.name}:`);
          console.log(`   Original requiredQuantity: ${originalQuantity}`);
          console.log(`   New requiredQuantity: ${newQuantity}`);
          console.log(`   Difference: ${difference}`);
          console.log(`   Current availableStock: ${currentAvailableStock}`);
          console.log(`   New availableStock: ${newAvailableStock}`);

          return {
            ...recipeIng,
            availableStock: newAvailableStock,
          };
        }
        return recipeIng;
      });

      console.log("📝 Final updated ingredients:", updatedIngredients);

      // Update the recipe with new ingredient availableStock values
      const response = await fetch(`/api/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: matchingRecipe.id,
          name: matchingRecipe.name,
          category: matchingRecipe.category,
          amount: matchingRecipe.stock,
          ingredients: updatedIngredients,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ API response error:", errorText);
        throw new Error(`Failed to update recipe ingredient stock: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("✅ Recipe updated successfully:", responseData);

      // Refresh recipes data to reflect changes
      await fetchRecipes();
      console.log("✅ Recipes data refreshed");

    } catch (error) {
      console.error("❌ Error in stock deduction:", error);
      toast.error("Error al actualizar stock de ingredientes");
      throw error; // Re-throw to handle in calling function
    }
  };

  // Function to deduct stock for recipe ingredients (from availableStock)
  const deductRecipeIngredientStock = async (
    ingredients: {
      name: string;
      quantity: string;
      unit: string;
      requiredQuantity: number;
      availableStock: number;
    }[],
    productAmount: number
  ) => {
    // Find the recipe to update its ingredients
    const selectedRecipe = recipesData.find(
      (recipe) => recipe.id.toString() === selectedRecipeId
    );
    if (!selectedRecipe) {
      console.error("Selected recipe not found for stock deduction");
      return;
    }

    try {
      // Get the original recipe ingredients from the database
      let originalIngredients = [];
      try {
        originalIngredients =
          typeof selectedRecipe.ingredients === "string"
            ? JSON.parse(selectedRecipe.ingredients)
            : selectedRecipe.ingredients || [];
      } catch (error) {
        console.error("Error parsing original recipe ingredients:", error);
        originalIngredients = [];
      }

      // Update only the availableStock for matching ingredients
      const updatedIngredients = originalIngredients.map((originalIng: any) => {
        // Find the matching ingredient from the current ingredients (with requiredQuantity)
        const matchingIngredient = ingredients.find(
          (ing) =>
            ing.name === originalIng.name &&
            ing.quantity === originalIng.quantity &&
            ing.unit === originalIng.unit
        );

        if (matchingIngredient) {
          // Update only the availableStock, preserve all other properties
          return {
            ...originalIng,
            availableStock: Math.max(
              0,
              matchingIngredient.availableStock -
                matchingIngredient.requiredQuantity
            ),
          };
        }

        // If no match found, return original ingredient unchanged
        return originalIng;
      });

      // Update the recipe with new ingredient availableStock values
      const response = await fetch(`/api/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRecipe.id,
          name: selectedRecipe.name,
          category: selectedRecipe.category,
          amount: selectedRecipe.stock,
          ingredients: updatedIngredients,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update recipe ingredient stock");
      }

      console.log(
        `Deducted stock from recipe ingredients for ${productAmount} units`
      );

      // Refresh recipes data to reflect changes
      fetchRecipes();
    } catch (error) {
      console.error("Error deducting recipe ingredient stock:", error);
      toast.error("Error deducting recipe ingredient stock");
    }
  };

  // Function to deduct stock for ingredient-type products (from ingredient's stock)
  const deductIngredientTypeStock = async (
    ingredientId: string,
    requiredQuantity: number
  ) => {
    try {
      // Find the ingredient product
      const ingredient = productsData.find(
        (product) =>
          product.type === "ingredient" &&
          product.id.toString() === ingredientId
      );

      if (!ingredient) {
        console.error("Ingredient not found for stock deduction");
        return;
      }

      // Calculate new stock
      const newStock = Math.max(0, (ingredient.stock || 0) - requiredQuantity);

      // Update the ingredient's stock
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ingredient.id,
          stock: newStock,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to deduct stock for ingredient: ${ingredient.name}`
        );
      }

      console.log(
        `Deducted ${requiredQuantity} units from ingredient ${ingredient.name}`
      );

      // Refresh products data to reflect changes
      fetchProducts();
    } catch (error) {
      console.error("Error deducting ingredient stock:", error);
      toast.error("Error deducting ingredient stock");
    }
  };

  // Helper functions
  const calculateStatus = (stock: number): "sufficient" | "low" | "out" => {
    if (stock === 0) return "out";
    if (stock < 5) return "low";
    return "sufficient";
  };

  // Edit modal recipe selection function
  const handleEditRecipeSelection = async (recipeId: string) => {
    setSelectedEditRecipeId(recipeId);
    setEditIngredientRequiredQuantity(1); // Reset ingredient quantity

    if (!recipeId || recipeId === "no-recipe") {
      setEditRecipeIngredients([]);
      setEditingProduct({
        ...editingProduct!,
        has_recipe: false,
        ingredients: undefined,
      });
      return;
    }

    // Check if the selected item is an ingredient first (from productsData)
    const selectedIngredient = productsData.find(
      (product) =>
        product.type === "ingredient" && product.id.toString() === recipeId
    );

    if (selectedIngredient) {
      // For ingredients, set has_recipe to true but don't set ingredients to avoid showing recipe ingredients section
      setEditingProduct({
        ...editingProduct!,
        has_recipe: true,
        ingredients: undefined, // Clear ingredients to hide recipe ingredients display
      });
      return;
    }

    // Find the selected recipe (only actual recipes, not ingredients)
    const selectedRecipe = recipesData.find(
      (recipe) => recipe.id.toString() === recipeId && recipe.type === "recipe"
    );

    if (!selectedRecipe) {
      // Recipe not found
      return;
    }

    // Process recipe ingredients similar to creation flow
    const processedIngredients = await Promise.all(
      (selectedRecipe.ingredients || []).map(async (ingredient: any) => {
        return {
          name: ingredient.name,
          quantity: ingredient.quantity.toString(),
          unit: ingredient.unit,
          requiredQuantity: editIngredientRequiredQuantity,
          availableStock:
            ingredient.availableStock || selectedRecipe.stock || 0,
          stock: selectedRecipe.stock || 0,
        };
      })
    );

    setEditRecipeIngredients(processedIngredients);

    // Set the product to have a recipe and update ingredients
    setEditingProduct({
      ...editingProduct!,
      has_recipe: true,
      ingredients: JSON.stringify(selectedRecipe.ingredients || []),
    });
  };

  // Create recipe function for edit modal
  const handleCreateRecipeEdit = async () => {
    try {
      setIsLoading(true);

      // Validate ingredients before creating recipe
      const validationResults = await validateRecipeIngredients(
        newRecipe.ingredients
      );
      const hasErrors = validationResults.some(
        (result) => result.status !== "valid"
      );

      if (hasErrors) {
        const errorMessages = validationResults
          .filter((result) => result.status !== "valid")
          .map((result) => result.message)
          .join("\n");

        toast.error(`Errores de validación:\n${errorMessages}`);
        return;
      }

      console.log("🔄 Creating recipe with data:", {
        name: newRecipe.name,
        ingredients: newRecipe.ingredients,
        amount: 1,
        category: newRecipe.category,
      });

      const response = await fetch(`/api/recipe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: newRecipe.ingredients, // Send ingredients directly as array
          amount: 1,
          category: newRecipe.category,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("❌ Recipe API error:", errorData);
        throw new Error(`Failed to create recipe: ${response.status} - ${errorData}`);
      }

      const createdRecipeResponse = await response.json();
      console.log("✅ Recipe created successfully:", createdRecipeResponse);

      // The API returns an array, so get the first element
      const createdRecipe = Array.isArray(createdRecipeResponse) ? createdRecipeResponse[0] : createdRecipeResponse;
      console.log("✅ Extracted recipe object:", createdRecipe);

      console.log("🔄 Refreshing recipes list...");
      await fetchRecipes(); // Refresh recipes list
      console.log("✅ Recipes list refreshed");

      console.log("🔄 Processing newly created recipe ingredients manually...");
      // Process the newly created recipe ingredients directly since we have the data
      const processedIngredients = newRecipe.ingredients.map((ingredient: { name: string; quantity: string; unit: string }) => ({
        name: ingredient.name,
        quantity: ingredient.quantity.toString(),
        unit: ingredient.unit,
        requiredQuantity: editIngredientRequiredQuantity,
        availableStock: createdRecipe.stock || 1,
        stock: createdRecipe.stock || 1,
      }));

      // Set the recipe selection and ingredients in the correct order
      console.log("🔄 Setting recipe ingredients...");
      setEditRecipeIngredients(processedIngredients);

      console.log("🔄 Setting selected recipe ID...");
      setSelectedEditRecipeId(createdRecipe.id.toString());

      console.log("🔄 Updating editing product...");
      // Force a state update to ensure UI re-renders
      const updatedProduct = {
        ...editingProduct!,
        has_recipe: true,
        ingredients: JSON.stringify(newRecipe.ingredients),
      };
      setEditingProduct(updatedProduct);

      console.log("✅ Recipe ingredients processed and set:", processedIngredients);
      console.log("✅ Updated editingProduct:", updatedProduct);
      console.log("✅ Selected recipe ID:", createdRecipe.id.toString());
      console.log("✅ editRecipeIngredients length:", processedIngredients.length);

      // Force a re-render by updating a dummy state
      // This ensures React processes all state updates
      setTimeout(() => {
        console.log("🔍 Final state check:");
        console.log("  - editRecipeIngredients.length:", editRecipeIngredients.length);
        console.log("  - editingProduct.has_recipe:", editingProduct?.has_recipe);
        console.log("  - selectedEditRecipeId:", selectedEditRecipeId);

        // Force component re-render if needed
        if (editRecipeIngredients.length === 0) {
          console.log("⚠️ Ingredients not set properly, forcing update...");
          setEditRecipeIngredients([...processedIngredients]);
        }
      }, 200);

      // Reset recipe form
      setNewRecipe({
        name: "",
        category: "bebida",
        ingredients: [],
      });
      setShowCreateRecipeDialogEdit(false);

      toast.success("Receta creada exitosamente y vinculada al producto");
    } catch (error) {
      console.error("❌ Error creating recipe:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error al crear la receta: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
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
    // Combine productsData and recipesData, but avoid duplicates by ID
    const seenIds = new Set();
    const allItems: any[] = [];

    // Add all products first
    productsData.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    });

    // Add only recipes (not ingredients) from recipesData that aren't already added
    recipesData.forEach((item) => {
      if (item.type === "recipe" && !seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    });

    let filtered = allItems.filter((product) => {
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
      const mockSalesData = filtered.map((product) => ({
        ...product,
        totalSales: Math.floor(Math.random() * 100) + 1,
        salesTrend: Math.random() > 0.5 ? "up" : "down",
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
        filtered = mockSalesData.filter((p) => p.salesTrend === "up");
      } else if (salesFilter === "trending-down") {
        filtered = mockSalesData.filter((p) => p.salesTrend === "down");
      }
    }

    return filtered;
  }, [productsData, searchTerm, filter, salesFilter]);

  const toggleSelectAll = useCallback(() => {
    setSelectedProducts((prev) =>
      prev.length === filteredProducts.length
        ? []
        : filteredProducts.map((p) => p.id.toString())
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

      // Validate stock if recipe is selected
      // if (newProduct.has_recipe && stockValidationErrors.length > 0) {
      //   alert("No se puede agregar el producto. Hay errores de stock:\n" + stockValidationErrors.join("\n"));
      //   setIsLoading(false);
      //   return;
      // }

      // // Validate custom ingredients if they are being used
      // if (useCustomIngredients && customIngredients.length > 0) {
      //   for (const ingredient of customIngredients) {
      //     const requiredQuantity = parseFloat(ingredient.quantity) * (newProduct.stock || 1);
      //     const matchingProduct = productsData.find(p => p.id === ingredient.productId);

      //     if (matchingProduct && matchingProduct.stock < requiredQuantity) {
      //       toast.error(`Stock insuficiente para ${ingredient.name}: Requerido ${requiredQuantity}, Disponible ${matchingProduct.stock}`);
      //       setIsLoading(false);
      //       return;
      //     }
      //   }
      // }

      // Deduct ingredients from stock if recipe is selected
      if (newProduct.has_recipe && recipeIngredients.length > 0) {
        // Note: Stock updates will be handled by the recipe system
        // No need to update individual product stocks since we removed productId linking
      }

      const uploadedUrl = await handleImageUpload();

      // Prepare ingredients data
      let ingredientsData = null;
      if (newProduct.has_recipe && recipeIngredients.length > 0) {
        ingredientsData = recipeIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          requiredQuantity: ing.requiredQuantity,
          // Note: availableStock is NOT stored in product, only in recipe
        }));
      } else if (useCustomIngredients && customIngredients.length > 0) {
        ingredientsData = customIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          productId: ing.productId,
        }));
      }

      const response = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
          has_recipe:
            (newProduct.has_recipe && recipeIngredients.length > 0) ||
            (useCustomIngredients && customIngredients.length > 0),
          ingredients: ingredientsData ? JSON.stringify(ingredientsData) : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      // Deduct ingredient stock based on product type
      if ((newProduct.stock || 0) > 0) {
        // Check if selected item is an ingredient (not a recipe)
        const selectedIngredient = productsData.find(
          (product) =>
            product.type === "ingredient" &&
            product.id.toString() === selectedRecipeId
        );

        if (selectedIngredient) {
          // For ingredient-type products: deduct from ingredient's stock
          await deductIngredientTypeStock(
            selectedRecipeId,
            ingredientRequiredQuantity
          );
        } else if (newProduct.has_recipe && recipeIngredients.length > 0) {
          // For recipe-type products: deduct from recipe ingredients' availableStock
          await deductRecipeIngredientStock(
            recipeIngredients,
            newProduct.stock || 1
          );
        } else if (useCustomIngredients && customIngredients.length > 0) {
          // For custom ingredients: existing logic
          await deductCustomIngredientStock(
            customIngredients,
            newProduct.stock || 1
          );
        }
      }

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

      // Reset recipe states
      setSelectedRecipeId("");
      setRecipeIngredients([]);
      // setStockValidationErrors([]);

      // Reset custom ingredient states
      setUseCustomIngredients(false);
      setCustomIngredients([]);
      setSelectedIngredient("none");
      setCustomIngredientName("");
      setIngredientQuantity("");
      setIngredientUnit("ml");

      fetchProducts();
      alert(
        "Producto agregado exitosamente y stock de ingredientes actualizado"
      );
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

      // Prepare ingredients data similar to creation flow
      let ingredientsData = null;

      console.log("🔍 DEBUG: Preparing ingredients data");
      console.log("editingProduct.has_recipe:", editingProduct.has_recipe);
      console.log("editRecipeIngredients.length:", editRecipeIngredients.length);
      console.log("editRecipeIngredients:", editRecipeIngredients);

      if (editingProduct.has_recipe && editRecipeIngredients.length > 0) {
        ingredientsData = editRecipeIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          requiredQuantity: ing.requiredQuantity,
          // Note: availableStock is NOT stored in product, only in recipe
        }));
        console.log("✅ Using editRecipeIngredients for ingredientsData");
      } else if (editingProduct.has_recipe && editingProduct.ingredients) {
        console.log("⚠️ Falling back to editingProduct.ingredients");
        // Fallback to parsing from editingProduct.ingredients if editRecipeIngredients is empty
        try {
          const parsedIngredients = JSON.parse(editingProduct.ingredients);
          ingredientsData = parsedIngredients;
          console.log("📝 Parsed ingredients from editingProduct:", parsedIngredients);
        } catch (error) {
          console.error("Error parsing editingProduct.ingredients:", error);
        }
      } else if (editUseCustomIngredients && editCustomIngredients.length > 0) {
        ingredientsData = editCustomIngredients.map((ing) => ({
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
          productId: ing.productId,
        }));
      }

      // FIRST: Handle stock deduction BEFORE updating the product
      // This ensures we use the correct data for calculations
      if (editingProduct.has_recipe && ingredientsData && Object.keys(originalIngredientQuantities).length > 0) {
        try {
          console.log("=== STOCK DEDUCTION PROCESS ===");
          console.log("Original quantities:", originalIngredientQuantities);
          console.log("New ingredients data:", ingredientsData);
          console.log("editRecipeIngredients state:", editRecipeIngredients);
          console.log("editingProduct.ingredients:", editingProduct.ingredients);

          await deductRecipeIngredientStockDifference(
            ingredientsData,
            originalIngredientQuantities
          );

          console.log("✅ Stock deduction completed successfully");
        } catch (error) {
          console.error("❌ Error processing ingredient changes:", error);
          // Don't fail the entire update if stock deduction fails
          toast.error("Error al actualizar stock de ingredientes, pero el producto se guardará");
        }
      } else {
        console.log("⚠️ Skipping stock deduction:", {
          hasRecipe: editingProduct.has_recipe,
          hasIngredientsData: !!ingredientsData,
          hasOriginalQuantities: Object.keys(originalIngredientQuantities).length > 0
        });
      }

      // SECOND: Update the product with new ingredient data
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
          has_recipe:
            (editingProduct.has_recipe && editRecipeIngredients.length > 0) ||
            (editUseCustomIngredients && editCustomIngredients.length > 0),
          ingredients: ingredientsData
            ? JSON.stringify(ingredientsData)
            : editingProduct.ingredients,
        }),
      });

      if (!response.ok) throw new Error("Failed to update product");

      console.log("✅ Product updated successfully");

      // Reset edit modal states
      setEditingProduct(null);
      setImageFile(null);
      setSelectedEditRecipeId("");
      setEditRecipeIngredients([]);
      setEditUseCustomIngredients(false);
      setEditCustomIngredients([]);

      setEditCustomIngredientName("");
      setEditIngredientQuantity("");
      setEditIngredientUnit("ml");
      setEditIngredientRequiredQuantity(1);
      setOriginalIngredientQuantities({}); // Reset original quantities

      fetchProducts();
      toast.success("Producto actualizado exitosamente");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating product");
      toast.error("Error al actualizar el producto");
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
        fetch("/api/adjust"),
      ]);

      const transfers = transferResponse.ok
        ? await transferResponse.json()
        : [];
      const adjustments = adjustmentResponse.ok
        ? await adjustmentResponse.json()
        : [];

      // Filter and format transfer history for this product
      const transferHistory = transfers
        .filter(
          (transfer: any) => transfer.inventory?.products?.id === productId
        )
        .map((transfer: any) => ({
          id: `transfer-${transfer.id}`,
          date: transfer.created_at || new Date().toISOString(),
          type: "transfer",
          quantity: transfer.amount,
          user: "Sistema",
          details: `Transferencia de ${transfer.from_bar_details?.name || "Origen"} a ${transfer.to_bar_details?.name || "Destino"}`,
          price: 0,
        }));

      // Filter and format adjustment history for this product
      const adjustmentHistory = adjustments
        .filter(
          (adjustment: any) => adjustment.inventory?.products?.id === productId
        )
        .map((adjustment: any) => ({
          id: `adjustment-${adjustment.id}`,
          date: adjustment.created_at || new Date().toISOString(),
          type: adjustment.type === "loss" ? "loss" : "reentry",
          quantity:
            adjustment.type === "loss" ? -adjustment.amount : adjustment.amount,
          user: "Admin",
          details:
            adjustment.reason ||
            `${adjustment.type === "loss" ? "Pérdida" : "Re-ingreso"} registrado`,
          price: adjustment.economic_value || 0,
        }));

      // Combine and sort by date
      const combinedHistory = [...transferHistory, ...adjustmentHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

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
          price: 0,
        },
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
    const exportData = filteredProducts.map((item) => {
      // Check if it's a product or recipe
      const isProduct = "purchase_price" in item;
      const product = item as any; // Cast to any to access all properties

      return {
        Nombre: product.name,
        Tipo: product.type || "producto",
        Categoría: product.category,
        "Precio Compra": isProduct ? product.purchase_price : "N/A",
        "Precio Venta": isProduct ? product.sale_price : "N/A",
        Stock: product.stock || 0,
        Estado: calculateStatus(product.stock || 0),
        "Visible Courtesy": isProduct && product.is_courtsey ? "Sí" : "No",
        "Visible PR Token": isProduct && product.is_pr ? "Sí" : "No",
        Activo: isProduct && product.is_active ? "Sí" : "No",
        "Fecha Actualización": product.updated_at || "N/A",
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Productos");

    // Auto-size columns
    const colWidths = Object.keys(exportData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(
      wb,
      `productos_${new Date().toISOString().split("T")[0]}.xlsx`
    );
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
                const initialQuantities: { [key: string]: number } = {};
                selectedProducts.forEach((productId) => {
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
                  const initialQuantities: { [key: string]: number } = {};
                  selectedProducts.forEach((productId) => {
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
                  const initialQuantities: { [key: string]: number } = {};
                  selectedProducts.forEach((productId) => {
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
                <th className="text-left p-3 font-medium">
                  Historial de producto
                </th>
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
                : filteredProducts.map((item) => {
                    const product = item as any; // Cast to access all properties
                    const isProduct = "purchase_price" in item;

                    return (
                      <tr
                        key={product.id}
                        className="border-t hover:bg-muted/50"
                      >
                        <td className="p-3">
                          <Checkbox
                            checked={selectedProducts.includes(
                              product.id.toString()
                            )}
                            onCheckedChange={() =>
                              toggleSelectProduct(product.id.toString())
                            }
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="flex items-center gap-2 cursor-pointer flex-1"
                              onClick={() =>
                                isProduct && viewProductDetails(product)
                              }
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
                                <div className="font-medium">
                                  {product.name}
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1">
                                  {product.description}{" "}
                                  {!isProduct && "(Receta)"}
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleShowTransactionHistory(product)
                              }
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
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => viewProductDetails(product)}
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                            {product.type === "product" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingProduct(product);

                                  // Initialize edit modal states based on product data
                                  if (
                                    product.has_recipe &&
                                    product.ingredients
                                  ) {
                                    try {
                                      const ingredients = JSON.parse(
                                        product.ingredients
                                      );

                                      // Check if this is a recipe-based product or custom ingredients
                                      if (
                                        ingredients.length > 0 &&
                                        ingredients[0].productId
                                      ) {
                                        // Custom ingredients
                                        setEditUseCustomIngredients(true);
                                        setEditCustomIngredients(ingredients);
                                        setEditRecipeIngredients([]);
                                      } else {
                                        // Recipe ingredients - convert to the format expected by editRecipeIngredients
                                        const processedIngredients =
                                          ingredients.map((ing: any) => ({
                                            name: ing.name,
                                            quantity: ing.quantity.toString(),
                                            unit: ing.unit,
                                            requiredQuantity:
                                              ing.requiredQuantity || 1,
                                            availableStock:
                                              ing.availableStock || 0,
                                            stock: ing.stock || 0,
                                          }));
                                        setEditRecipeIngredients(
                                          processedIngredients
                                        );
                                        setEditUseCustomIngredients(false);
                                        setEditCustomIngredients([]);

                                        // Store original quantities for difference calculation
                                        const originalQuantities: { [ingredientName: string]: number } = {};
                                        ingredients.forEach((ing: any) => {
                                          originalQuantities[ing.name] = ing.requiredQuantity || 1;
                                        });
                                        setOriginalIngredientQuantities(originalQuantities);

                                        // Try to find matching recipe
                                        const matchingRecipe = recipesData.find(
                                          (recipe) => {
                                            try {
                                              const recipeIngredients =
                                                recipe.ingredients;
                                              return (
                                                JSON.stringify(ingredients) ===
                                                JSON.stringify(
                                                  recipeIngredients
                                                )
                                              );
                                            } catch {
                                              return false;
                                            }
                                          }
                                        );
                                        if (matchingRecipe) {
                                          setSelectedEditRecipeId(
                                            matchingRecipe.id.toString()
                                          );
                                        }
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error parsing product ingredients:",
                                        error
                                      );
                                      // Reset states on error
                                      setEditRecipeIngredients([]);
                                      setEditUseCustomIngredients(false);
                                      setEditCustomIngredients([]);
                                    }
                                  } else {
                                    // Reset states for products without recipes
                                    setEditRecipeIngredients([]);
                                    setEditUseCustomIngredients(false);
                                    setEditCustomIngredients([]);
                                    setSelectedEditRecipeId("");
                                  }

                                  // Reset other edit modal states
                                  setEditCustomIngredientName("");
                                  setEditIngredientQuantity("");
                                  setEditIngredientUnit("ml");
                                  setEditIngredientRequiredQuantity(1);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
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
                    );
                  })}
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
        <DialogContent className="sm:max-w-[600px]">
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

            {/* Recipe/Ingredients Selection Field */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Ingredientes (Opcional)
                </Label>
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

              {/* Toggle between existing recipes and custom ingredients */}
              <div className="flex gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ingredientType"
                    checked={!useCustomIngredients}
                    onChange={() => {
                      setUseCustomIngredients(false);
                      setCustomIngredients([]);
                    }}
                  />
                  <span className="text-sm">Usar receta existente</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="ingredientType"
                    checked={useCustomIngredients}
                    onChange={() => {
                      setUseCustomIngredients(true);
                      setSelectedRecipeId("");
                      setRecipeIngredients([]);
                    }}
                  />
                  <span className="text-sm">
                    Agregar ingredientes individuales
                  </span>
                </label>
              </div>

              {!useCustomIngredients ? (
                <>
                  <Select
                    value={selectedRecipeId || "no-recipe"}
                    onValueChange={handleRecipeSelection}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar receta existente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-recipe">Sin receta</SelectItem>
                      {/* Show Recipes only (filter out ingredients from recipesData) */}
                      {recipesData
                        .filter((recipe) => recipe.type === "recipe")
                        .map((recipe) => (
                          <SelectItem
                            key={`recipe-${recipe.id}`}
                            value={recipe.id.toString()}
                          >
                            {recipe.name} ({recipe.category}) - Receta
                          </SelectItem>
                        ))}
                      {/* Show Ingredients from productsData */}
                      {productsData
                        .filter((product) => product.type === "ingredient")
                        .map((ingredient) => (
                          <SelectItem
                            key={`ingredient-${ingredient.id}`}
                            value={ingredient.id.toString()}
                          >
                            {ingredient.name} ({ingredient.category}) -
                            Ingrediente
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  {/* Show ingredient information if an ingredient is selected */}
                  {selectedRecipeId &&
                    selectedRecipeId !== "no-recipe" &&
                    (() => {
                      // Check if selected item is an ingredient
                      const selectedIngredient = productsData.find(
                        (product) =>
                          product.type === "ingredient" &&
                          product.id.toString() === selectedRecipeId
                      );

                      if (selectedIngredient) {
                        const unit = extractUnitFromDescription(
                          selectedIngredient.description || ""
                        );
                        const conversionFactor =
                          extractConversionFromDescription(
                            selectedIngredient.description || ""
                          );

                        // Calculate amounts using conversion factor
                        const totalAmount =
                          (selectedIngredient.stock || 0) * conversionFactor;
                        const totalRequired =
                          ingredientRequiredQuantity * conversionFactor;
                        const hasEnoughStock = totalAmount >= totalRequired;

                        return (
                          <div className="mt-4 space-y-4">
                            <h3 className="font-medium text-gray-900">
                              Ingredientes del producto:
                            </h3>
                            <p className="text-sm text-gray-600">
                              Especifica cuántas unidades del producto vas a
                              crear. Los ingredientes se descontarán
                              automáticamente.
                            </p>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border rounded-lg">
                              <div>
                                <Label className="text-sm font-medium text-gray-700">
                                  Ingrediente
                                </Label>
                                <p className="text-sm font-semibold text-gray-900">
                                  {selectedIngredient.name}
                                </p>
                                <p className="text-xs text-green-500">
                                  {conversionFactor} {unit} por unidad
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">
                                  Cantidad a crear
                                </Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={ingredientRequiredQuantity}
                                  onChange={(e) =>
                                    setIngredientRequiredQuantity(
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="h-10 text-center font-medium"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Total necesario: {totalRequired} {unit}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-700">
                                  Stock disponible
                                </Label>
                                <p
                                  className={`text-lg font-bold ${hasEnoughStock ? "text-green-600" : "text-red-600"}`}
                                >
                                  {totalAmount} {unit}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Available: {selectedIngredient.stock || 0}{" "}
                                  units ({totalAmount} {unit})
                                </p>
                                {!hasEnoughStock && (
                                  <p className="text-xs text-red-600 font-medium">
                                    {totalRequired - totalAmount} {unit} missing
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  <p className="text-sm text-muted-foreground">
                    Si seleccionas una receta, el stock de los ingredientes se
                    descontará automáticamente cuando se haga un pedido.
                  </p>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Agregar Ingredientes:
                    </Label>

                    {/* Ingredient Selection */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-4">
                        <Label htmlFor="ingredient" className="sr-only">
                          Ingrediente
                        </Label>
                        <Select
                          value={selectedIngredient}
                          onValueChange={(value) =>
                            setSelectedIngredient(value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar ingrediente" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              Seleccionar ingrediente existente
                            </SelectItem>
                            {productsData
                              .filter(
                                (product) =>
                                  (product.category === "ingrediente" &&
                                    product.has_recipe === false) ||
                                  product.type === "ingredient"
                              )
                              .sort((a, b) => b.stock - a.stock)
                              .map((product) => (
                                <SelectItem
                                  key={product.id}
                                  value={product.name}
                                >
                                  <div className="flex justify-between items-center w-full">
                                    <span>{product.name}</span>
                                    <span
                                      className={`text-xs px-1 py-0.5 rounded ${
                                        product.stock > 10
                                          ? "bg-green-100 text-green-800"
                                          : product.stock > 0
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {product.stock}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="text-center text-sm text-muted-foreground mt-1">
                          o
                        </div>
                        <Input
                          disabled={selectedIngredient !== "none"}
                          placeholder="Escribir ingrediente personalizado"
                          value={customIngredientName}
                          onChange={(e) =>
                            setCustomIngredientName(e.target.value)
                          }
                          className="mt-1"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="quantity" className="sr-only">
                          Cantidad
                        </Label>
                        <Input
                          placeholder="Cantidad"
                          value={ingredientQuantity}
                          onChange={(e) =>
                            setIngredientQuantity(e.target.value)
                          }
                          type="number"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label htmlFor="unit" className="sr-only">
                          Unidad
                        </Label>
                        <Select
                          value={ingredientUnit}
                          onValueChange={(value) => setIngredientUnit(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Grams (g)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="ml">Milliliters (mL)</SelectItem>
                            <SelectItem value="L">Liters (L)</SelectItem>
                            <SelectItem value="unidad">Units</SelectItem>
                            <SelectItem value="parts">Parts</SelectItem>
                            <SelectItem value="cups">Cups</SelectItem>
                            <SelectItem value="tbsp">Tablespoons</SelectItem>
                            <SelectItem value="tsp">Teaspoons</SelectItem>
                            <SelectItem value="hojas">Leaves</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={addCustomIngredient}
                          disabled={
                            ingredientQuantity.trim() === "" ||
                            (selectedIngredient === "none" &&
                              customIngredientName.trim() === "") ||
                            (selectedIngredient !== "none" &&
                              selectedIngredient.trim() === "")
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Display added custom ingredients */}
                    {customIngredients.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Ingredientes agregados:
                        </Label>
                        {customIngredients.map((ingredient, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm">
                              {ingredient.name} - {ingredient.quantity}{" "}
                              {ingredient.unit}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCustomIngredient(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Los ingredientes agregados se descontarán del stock cuando
                      crees el producto.
                    </p>
                  </div>
                </>
              )}

              {/* Recipe Ingredients Display */}
              {!useCustomIngredients && recipeIngredients.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">
                    Ingredientes de la receta:
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Especifica cuántas unidades del producto vas a crear. Los
                    ingredientes se descontarán automáticamente.
                  </p>

                  {recipeIngredients.map((ingredient, index) => {
                    const totalAmount =
                      parseFloat(ingredient.quantity) *
                      ingredient.availableStock;
                    const totalRequired =
                      parseFloat(ingredient.quantity) *
                      ingredient.requiredQuantity;
                    const hasEnoughStock = totalAmount >= totalRequired;

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border rounded-lg"
                      >
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Ingrediente
                          </Label>
                          <p className="text-sm font-semibold text-gray-900">
                            {ingredient.name}
                          </p>
                          <p className="text-xs text-green-500">
                            {ingredient.quantity} {ingredient.unit} por unidad
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Cantidad a crear
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={ingredient.requiredQuantity}
                            onChange={(e) =>
                              updateEditIngredientQuantity(
                                index,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-10 text-center font-medium"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Total necesario: {totalRequired.toFixed(0)}{" "}
                            {ingredient.unit}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Stock disponible
                          </Label>
                          <p
                            className={`text-lg font-bold ${hasEnoughStock ? "text-green-600" : "text-red-600"}`}
                          >
                            {ingredient.availableStock *
                              Number(ingredient?.quantity)}{" "}
                            {ingredient.unit}
                          </p>
                          <p>Available: {ingredient.availableStock}</p>
                          {!hasEnoughStock && (
                            <p className="text-xs text-red-600 font-medium">
                              {ingredient.availableStock *
                                Number(ingredient?.quantity) -
                                Number(ingredient.quantity) *
                                  ingredient.requiredQuantity}{" "}
                              missing
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Ingredient to Existing Recipe */}
                  <div className="border-t pt-4 mt-4">
                    <Label className="text-sm font-medium mb-3 block">
                      Agregar nuevo ingrediente a esta receta:
                    </Label>
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-5">
                        <Input
                          placeholder="Nombre del ingrediente"
                          value={newIngredient.name}
                          onChange={(e) =>
                            setNewIngredient({
                              ...newIngredient,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          placeholder="Cantidad"
                          value={newIngredient.quantity}
                          onChange={(e) =>
                            setNewIngredient({
                              ...newIngredient,
                              quantity: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Select
                          value={newIngredient.unit}
                          onValueChange={(value) =>
                            setNewIngredient({ ...newIngredient, unit: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="g">Grams (g)</SelectItem>
                            <SelectItem value="kg">Kilograms (kg)</SelectItem>
                            <SelectItem value="ml">Milliliters (mL)</SelectItem>
                            <SelectItem value="L">Liters (L)</SelectItem>
                            <SelectItem value="unidad">Units</SelectItem>
                            <SelectItem value="parts">Parts</SelectItem>
                            <SelectItem value="cups">Cups</SelectItem>
                            <SelectItem value="tbsp">Tablespoons</SelectItem>
                            <SelectItem value="tsp">Teaspoons</SelectItem>
                            <SelectItem value="hojas">Leaves</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="w-full"
                          onClick={handleAddIngredientToExistingRecipe}
                          disabled={
                            !newIngredient.name || !newIngredient.quantity
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Este ingrediente se agregará a la receta seleccionada y se
                      guardará permanentemente.
                    </p>
                  </div>

                  {/* Stock Validation Errors */}
                  {/* {stockValidationErrors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <Label className="text-sm font-medium text-red-800">Stock insufficient</Label>
                      </div>
                      <ul className="mt-2 text-sm text-red-700 space-y-1">
                        {stockValidationErrors.map((error, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Al agregar este producto, los ingredientes se descontarán
                automáticamente del stock.
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
                  value={
                    newProduct.purchase_price === 0
                      ? ""
                      : newProduct.purchase_price
                  }
                  placeholder="0.00"
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      purchase_price:
                        e.target.value === "" ? 0 : Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio de Venta</Label>
                <Input
                  id="sale_price"
                  type="number"
                  value={
                    newProduct.sale_price === 0 ? "" : newProduct.sale_price
                  }
                  placeholder="0.00"
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      sale_price:
                        e.target.value === "" ? 0 : Number(e.target.value),
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
        onOpenChange={() => {
          setEditingProduct(null);
          setOriginalIngredientQuantities({}); // Reset original quantities on modal close
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
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
                  value={editingProduct?.name || ""}
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
                  value={editingProduct?.category || ""}
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
                value={editingProduct?.description || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct!,
                    description: e.target.value,
                  })
                }
              />
            </div>

            {/* Recipe Selection Field for Edit */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">
                  Receta (Opcional)
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateRecipeDialogEdit(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Receta
                </Button>
              </div>

              <Select
                value={
                  editingProduct?.has_recipe
                    ? selectedEditRecipeId
                    : "no-recipe"
                }
                onValueChange={handleEditRecipeSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar receta existente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-recipe">Sin receta</SelectItem>
                  {/* Show Recipes only (filter out ingredients from recipesData) */}
                  {recipesData
                    .filter((recipe) => recipe.type === "recipe")
                    .map((recipe) => (
                      <SelectItem
                        key={`recipe-${recipe.id}`}
                        value={recipe.id.toString()}
                      >
                        {recipe.name} ({recipe.category}) - Receta
                      </SelectItem>
                    ))}
                  {/* Show Ingredients from productsData */}
                  {productsData
                    .filter((product) => product.type === "ingredient")
                    .map((ingredient) => (
                      <SelectItem
                        key={`ingredient-${ingredient.id}`}
                        value={ingredient.id.toString()}
                      >
                        {ingredient.name} ({ingredient.category}) - Ingrediente
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {/* Show ingredient information if an ingredient is selected */}
              {selectedEditRecipeId &&
                selectedEditRecipeId !== "no-recipe" &&
                (() => {
                  // Check if selected item is an ingredient
                  const selectedIngredient = productsData.find(
                    (product) =>
                      product.type === "ingredient" &&
                      product.id.toString() === selectedEditRecipeId
                  );

                  if (selectedIngredient) {
                    const unit = extractUnitFromDescription(
                      selectedIngredient.description || ""
                    );
                    const conversionFactor = extractConversionFromDescription(
                      selectedIngredient.description || ""
                    );
                    const requiredQuantity = 1; // Default quantity for ingredients (edit mode)

                    // Calculate amounts using conversion factor
                    const totalAmount =
                      (selectedIngredient.stock || 0) * conversionFactor;
                    const totalRequired = requiredQuantity * conversionFactor;
                    const hasEnoughStock = totalAmount >= totalRequired;

                    return (
                      <div className="mt-4 space-y-4">
                        <h3 className="font-medium text-gray-900">
                          Ingredientes del producto:
                        </h3>
                        <p className="text-sm text-gray-600">
                          Información del ingrediente seleccionado.
                        </p>

                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border rounded-lg">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Ingrediente
                            </Label>
                            <p className="text-sm font-semibold text-gray-900">
                              {selectedIngredient.name}
                            </p>
                            <p className="text-xs text-green-500">
                              {conversionFactor} {unit} por unidad
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Cantidad por unidad
                            </Label>
                            <p className="text-lg font-bold text-gray-900">
                              {requiredQuantity}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Total necesario: {totalRequired} {unit}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Stock disponible
                            </Label>
                            <p
                              className={`text-lg font-bold ${hasEnoughStock ? "text-green-600" : "text-red-600"}`}
                            >
                              {totalAmount} {unit}
                            </p>
                            <p className="text-xs text-gray-500">
                              Available: {selectedIngredient.stock || 0} units (
                              {totalAmount} {unit})
                            </p>
                            {!hasEnoughStock && (
                              <p className="text-xs text-red-600 font-medium">
                                {totalRequired - totalAmount} {unit} missing
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

              <p className="text-sm text-muted-foreground">
                Si seleccionas una receta, el stock de los ingredientes se
                descontará automáticamente cuando se haga un pedido.
              </p>
            </div>

            {/* Recipe Ingredients Display for Edit */}
            {editingProduct?.has_recipe && (
              <div className="space-y-4">
                <Label className="text-base font-semibold">
                  Ingredientes de la Receta
                </Label>
                <div className="space-y-3 max-h-64 overflow-y-auto border rounded-md p-4">
                  {/* Column Headers */}
                  <div className="grid grid-cols-5 gap-3 items-center pb-2 border-b border-gray-200">
                    <div className="col-span-1">
                      <span className="text-sm font-medium text-gray-700">
                        Nombre
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm font-medium text-gray-700">
                        Cantidad
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm font-medium text-gray-700">
                        Stock Disponible (Editable)
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm font-medium text-gray-700">
                        Stock Real del Ingrediente
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm font-medium text-gray-700">
                        Acciones
                      </span>
                    </div>
                  </div>
                  {(() => {
                    try {
                      // Use editRecipeIngredients if available, otherwise fall back to editingProduct.ingredients
                      let ingredients = [];

                      if (editRecipeIngredients.length > 0) {
                        // Use the editRecipeIngredients state (preferred)
                        ingredients = editRecipeIngredients;
                      } else if (editingProduct.ingredients) {
                        // Fallback to parsing from editingProduct.ingredients
                        if (typeof editingProduct.ingredients === "string") {
                          ingredients = JSON.parse(editingProduct.ingredients);
                        } else if (Array.isArray(editingProduct.ingredients)) {
                          ingredients = editingProduct.ingredients;
                        }
                      }

                      // If no ingredients found, show message
                      if (!ingredients || ingredients.length === 0) {
                        return (
                          <div className="col-span-5 text-center py-8">
                            <div className="text-sm text-muted-foreground">
                              Este producto tiene receta pero no se encontraron
                              ingredientes.
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Selecciona una receta arriba o agrega ingredientes
                              personalizados.
                            </div>
                          </div>
                        );
                      }

                      return ingredients.map(
                        (ingredient: any, index: number) => {
                          const realStock = (() => {
                            const foundProduct = productsData.find((product) => {
                              if(product.type === "product") return false;
                              if (!product.ingredients) return false;
                              try {
                                const jsonIng = typeof product.ingredients === "string" ? JSON.parse(product.ingredients) : product.ingredients;
                                return Array.isArray(jsonIng) && jsonIng.some((ing: any) => ing.name === ingredient.name);
                              } catch (error) {
                                return false;
                              }
                            });

                            if (foundProduct && foundProduct.ingredients) {
                              try {
                                const jsonIng = typeof foundProduct.ingredients === "string" ? JSON.parse(foundProduct.ingredients) : foundProduct.ingredients;
                                const foundIngredient = jsonIng.find((ing: any) => ing.name === ingredient.name);
                                return foundIngredient?.availableStock || 0;
                              } catch (error) {
                                return 0;
                              }
                            }
                            return 0;
                          })();

                          return (
                            <div
                              key={index}
                              className="grid grid-cols-5 gap-3 items-center py-2 bg-gray-50 rounded-lg px-3"
                            >
                              <div className="col-span-1">
                                <span className="text-sm font-medium text-gray-900">
                                  {ingredient.name}
                                </span>
                                <div className="text-xs text-muted-foreground">
                                  {ingredient.unit}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {ingredient.quantity} {ingredient.unit}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Requerido: {ingredient.requiredQuantity || 1}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <Input
                                  type="number"
                                  value={
                                    Number(ingredient.requiredQuantity) || 0
                                  }
                                  onChange={(e) => {
                                    const newQuantity = parseInt(e.target.value) || 0;

                                    if (editRecipeIngredients.length > 0) {
                                      // Update editRecipeIngredients state (preferred)
                                      updateEditIngredientQuantity(index, newQuantity);
                                    } else {
                                      // Fallback: update editingProduct.ingredients directly
                                      const updatedIngredients = [...ingredients];
                                      updatedIngredients[index] = {
                                        ...updatedIngredients[index],
                                        requiredQuantity: newQuantity,
                                      };
                                      setEditingProduct({
                                        ...editingProduct,
                                        ingredients:
                                          JSON.stringify(updatedIngredients),
                                      });
                                    }
                                  }}
                                  className="h-8"
                                  min="0"
                                  placeholder="Stock disponible"
                                />
                              </div>
                              <div className="col-span-1">
                                <div className="text-sm font-medium">
                                  <span
                                    className={`${realStock > 0 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {realStock}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {realStock > 0 ? "En stock" : "Sin stock"}
                                </div>
                              </div>
                              <div className="col-span-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (editRecipeIngredients.length > 0) {
                                      // Remove from editRecipeIngredients state (preferred)
                                      const updatedIngredients = editRecipeIngredients.filter(
                                        (_, i: number) => i !== index
                                      );
                                      setEditRecipeIngredients(updatedIngredients);
                                    } else {
                                      // Fallback: remove from editingProduct.ingredients directly
                                      const updatedIngredients =
                                        ingredients.filter(
                                          (_: any, i: number) => i !== index
                                        );
                                      setEditingProduct({
                                        ...editingProduct,
                                        ingredients:
                                          JSON.stringify(updatedIngredients),
                                      });
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        }
                      );
                    } catch (error) {
                      return (
                        <div className="col-span-5 text-center py-4">
                          <div className="text-sm text-red-600">
                            Error al cargar ingredientes
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>

                {/* Add Custom Ingredient Button */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="text-sm font-medium text-gray-900">
                      Agregar ingrediente personalizado:
                    </h5>
                  </div>
                  <div className="grid grid-cols-6 gap-3 items-end">
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-600">
                        Nombre del ingrediente
                      </Label>
                      <Input
                        placeholder="Ej: Vodka, Limón, etc."
                        value={editCustomIngredientName}
                        onChange={(e) =>
                          setEditCustomIngredientName(e.target.value)
                        }
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-gray-600">Cantidad</Label>
                      <Input
                        type="number"
                        placeholder="50"
                        value={editIngredientQuantity}
                        onChange={(e) =>
                          setEditIngredientQuantity(e.target.value)
                        }
                        className="h-9"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-gray-600">Unidad</Label>
                      <Select
                        value={editIngredientUnit}
                        onValueChange={setEditIngredientUnit}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="ml" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                          <SelectItem value="cl">cl</SelectItem>
                          <SelectItem value="l">l</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="units">unidades</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1">
                      <Label className="text-xs text-gray-600">
                        Stock disponible
                      </Label>
                      <Input
                        type="number"
                        placeholder="100"
                        value={editIngredientRequiredQuantity}
                        onChange={(e) =>
                          setEditIngredientRequiredQuantity(
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="h-9"
                        min="0"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        onClick={() => {
                          if (
                            !editCustomIngredientName.trim() ||
                            !editIngredientQuantity
                          ) {
                            toast.error(
                              "Por favor completa el nombre y la cantidad del ingrediente"
                            );
                            return;
                          }

                          // Create new ingredient in the format expected by editRecipeIngredients
                          const newIngredient = {
                            name: editCustomIngredientName.trim(),
                            quantity: editIngredientQuantity,
                            unit: editIngredientUnit,
                            requiredQuantity: editIngredientRequiredQuantity, // Default required quantity
                            availableStock: editIngredientRequiredQuantity,
                            stock: editIngredientRequiredQuantity, // Set stock same as availableStock initially
                          };

                          // Add to editRecipeIngredients state
                          const updatedIngredients = [
                            ...editRecipeIngredients,
                            newIngredient,
                          ];
                          setEditRecipeIngredients(updatedIngredients);

                          // Store original quantity for the new ingredient (for stock deduction calculation)
                          setOriginalIngredientQuantities(prev => ({
                            ...prev,
                            [newIngredient.name]: 1 // Default original quantity
                          }));

                          // Enable recipe mode if not already enabled
                          if (!editingProduct.has_recipe) {
                            setEditingProduct({
                              ...editingProduct,
                              has_recipe: true,
                            });
                          }

                          // Reset form
                          setEditCustomIngredientName("");
                          setEditIngredientQuantity("");
                          setEditIngredientUnit("ml");
                          setEditIngredientRequiredQuantity(0);

                          console.log("✅ Custom ingredient added to editRecipeIngredients:", newIngredient);
                          console.log("Updated editRecipeIngredients:", updatedIngredients);

                          toast.success("Ingrediente agregado a la receta");
                        }}
                        className="h-9 px-3"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  Puedes editar el stock disponible de cada ingrediente y
                  agregar ingredientes personalizados a la receta.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase_price">Precio de Compra</Label>
                <Input
                  id="edit-purchase_price"
                  type="number"
                  value={editingProduct?.purchase_price || ""}
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
                  value={editingProduct?.sale_price || ""}
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
                value={editingProduct?.stock || ""}
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
            <Button variant="outline" onClick={() => {
              setEditingProduct(null);
              setOriginalIngredientQuantities({}); // Reset original quantities on cancel
            }}>
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
                    {importedProducts.filter((p) => p.is_active).length} activos
                  </Badge>
                  <Badge variant="outline">
                    {importedProducts.filter((p) => p.is_pr).length} PR Token
                  </Badge>
                  <Badge variant="outline">
                    {importedProducts.filter((p) => p.is_courtsey).length}{" "}
                    Cortesía
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
        <Dialog
          open={showTransactionHistoryModal}
          onOpenChange={setShowTransactionHistoryModal}
        >
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
                                transaction.type === "sale"
                                  ? "default"
                                  : transaction.type === "purchase"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {transaction.type === "sale"
                                ? "Venta"
                                : transaction.type === "purchase"
                                  ? "Compra"
                                  : "Ajuste"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span
                              className={
                                transaction.quantity > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {transaction.quantity > 0 ? "+" : ""}
                              {transaction.quantity}
                            </span>
                          </td>
                          <td className="p-3">{transaction.user}</td>
                          <td className="p-3">
                            {transaction.price > 0
                              ? `$${transaction.price.toFixed(2)}`
                              : "-"}
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
      <Dialog
        open={showCreateRecipeDialog}
        onOpenChange={setShowCreateRecipeDialog}
      >
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
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-category">Categoría</Label>
                <Select
                  value={newRecipe.category}
                  onValueChange={(value) =>
                    setNewRecipe({ ...newRecipe, category: value })
                  }
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
                    const validation = ingredientValidation.find(
                      (v) => v.ingredient === ingredient.name
                    );
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div className="flex-1">
                          <span className="text-sm">
                            {ingredient.name} - {ingredient.quantity}{" "}
                            {ingredient.unit}
                          </span>
                          {ingredient?.availableStock && (
                            <div className="text-xs text-gray-600 mt-1">
                              Stock disponible: {ingredient.availableStock}
                            </div>
                          )}
                          {validation && (
                            <div
                              className={`text-xs mt-1 ${
                                validation.status === "valid"
                                  ? "text-green-600"
                                  : validation.status === "insufficient_stock"
                                    ? "text-orange-600"
                                    : "text-red-600"
                              }`}
                            >
                              {validation.message}
                            </div>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveIngredientFromRecipe(index)
                          }
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
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Label className="text-xs text-gray-600 mb-1 block">Ingrediente</Label>
                    <Select
                      value={newIngredient.name}
                      onValueChange={(value) =>
                        setNewIngredient({ ...newIngredient, name: value })
                      }
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
                    <Label className="text-xs text-gray-600 mb-1 block">Cantidad</Label>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newIngredient.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) >= 0 && !value.includes("-"))
                        ) {
                          setNewIngredient({ ...newIngredient, quantity: value });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "-" ||
                          e.key === "+" ||
                          e.key === "e" ||
                          e.key === "E"
                        ) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600 mb-1 block">Unidad</Label>
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(value) =>
                        setNewIngredient({ ...newIngredient, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="ml">Milliliters (mL)</SelectItem>
                        <SelectItem value="L">Liters (L)</SelectItem>
                        <SelectItem value="unidad">Units</SelectItem>
                        <SelectItem value="parts">Parts</SelectItem>
                        <SelectItem value="cups">Cups</SelectItem>
                        <SelectItem value="tbsp">Tablespoons</SelectItem>
                        <SelectItem value="tsp">Teaspoons</SelectItem>
                        <SelectItem value="hojas">Leaves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full mt-5"
                      onClick={handleAddIngredientToRecipe}
                      disabled={!newIngredient.name || !newIngredient.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600 mb-1 block">Stock Disponible</Label>
                    <Input
                      type="number"
                      placeholder="Stock disponible"
                      value={newIngredient.availableStock}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) >= 0 && !value.includes("-"))
                        ) {
                          setNewIngredient({ ...newIngredient, availableStock: value });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "-" ||
                          e.key === "+" ||
                          e.key === "e" ||
                          e.key === "E"
                        ) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
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
                setNewIngredient({ name: "", quantity: "", unit: "ml", availableStock: "1" });
                setIngredientValidation([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRecipe}
              disabled={
                !newRecipe.name ||
                newRecipe.ingredients.length === 0 ||
                isLoading
              }
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

      {/* Create Recipe Dialog for Edit Modal */}
      <Dialog
        open={showCreateRecipeDialogEdit}
        onOpenChange={setShowCreateRecipeDialogEdit}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Receta</DialogTitle>
            <DialogDescription>
              Crea una receta que se vinculará al producto que estás editando
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipe-name-edit">Nombre de la Receta</Label>
                <Input
                  id="recipe-name-edit"
                  placeholder="Ej: Mojito, Margarita..."
                  value={newRecipe.name}
                  onChange={(e) =>
                    setNewRecipe({ ...newRecipe, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipe-category-edit">Categoría</Label>
                <Select
                  value={newRecipe.category}
                  onValueChange={(value) =>
                    setNewRecipe({ ...newRecipe, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bebida">Bebida</SelectItem>
                    <SelectItem value="comida">Comida</SelectItem>
                    <SelectItem value="postre">Postre</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Ingredient Section */}
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-sm font-medium">Agregar Ingrediente</Label>
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Label className="text-xs text-gray-600 mb-1 block">Ingrediente</Label>
                    <Input
                      placeholder="Nombre del ingrediente"
                      value={newIngredient.name}
                      onChange={(e) =>
                        setNewIngredient({
                          ...newIngredient,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs text-gray-600 mb-1 block">Cantidad</Label>
                    <Input
                      type="number"
                      placeholder="Cantidad"
                      value={newIngredient.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) >= 0 && !value.includes("-"))
                        ) {
                          setNewIngredient({
                            ...newIngredient,
                            quantity: value,
                          });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "-" ||
                          e.key === "+" ||
                          e.key === "e" ||
                          e.key === "E"
                        ) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600 mb-1 block">Unidad</Label>
                    <Select
                      value={newIngredient.unit}
                      onValueChange={(value) =>
                        setNewIngredient({ ...newIngredient, unit: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g">Grams (g)</SelectItem>
                        <SelectItem value="kg">Kilograms (kg)</SelectItem>
                        <SelectItem value="ml">Milliliters (mL)</SelectItem>
                        <SelectItem value="L">Liters (L)</SelectItem>
                        <SelectItem value="unidad">Units</SelectItem>
                        <SelectItem value="parts">Parts</SelectItem>
                        <SelectItem value="cups">Cups</SelectItem>
                        <SelectItem value="tbsp">Tablespoons</SelectItem>
                        <SelectItem value="tsp">Teaspoons</SelectItem>
                        <SelectItem value="hojas">Leaves</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full mt-5"
                      onClick={handleAddIngredientToRecipe}
                      disabled={!newIngredient.name || !newIngredient.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-600 mb-1 block">Stock Disponible</Label>
                    <Input
                      type="number"
                      placeholder="Stock disponible"
                      value={newIngredient.availableStock}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          value === "" ||
                          (Number(value) >= 0 && !value.includes("-"))
                        ) {
                          setNewIngredient({ ...newIngredient, availableStock: value });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (
                          e.key === "-" ||
                          e.key === "+" ||
                          e.key === "e" ||
                          e.key === "E"
                        ) {
                          e.preventDefault();
                        }
                      }}
                      min="0"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Ingredients List */}
            {newRecipe.ingredients.length > 0 && (
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Ingredientes de la Receta
                </Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {newRecipe.ingredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-medium">{ingredient.name}</span>
                          <span className="text-sm text-gray-600">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        </div>
                        {ingredient.availableStock && (
                          <div className="text-xs text-gray-600 mt-1">
                            Stock disponible: {ingredient.availableStock}
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
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRecipeDialogEdit(false);
                setNewRecipe({ name: "", category: "bebida", ingredients: [] });
                setNewIngredient({ name: "", quantity: "", unit: "ml", availableStock: "1" });
                setIngredientValidation([]);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRecipeEdit}
              disabled={
                !newRecipe.name ||
                newRecipe.ingredients.length === 0 ||
                isLoading
              }
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
              Configura las cantidades y selecciona las barras de destino para{" "}
              {selectedProducts.length} producto(s)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Products List with Quantities */}
            <div className="space-y-4">
              <Label className="text-base font-medium">
                Productos a transferir:
              </Label>
              <div className="space-y-3">
                {selectedProducts.map((productId) => {
                  const product = productsData.find((p) => p.id === productId);
                  if (!product) return null;

                  return (
                    <div
                      key={productId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
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
                        <Label
                          htmlFor={`quantity-${productId}`}
                          className="text-sm"
                        >
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
                            if (
                              e.key === "-" ||
                              e.key === "+" ||
                              e.key === "e" ||
                              e.key === "E"
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers and empty string
                            if (
                              value === "" ||
                              (Number(value) >= 1 && !value.includes("-"))
                            ) {
                              handleQuantityChange(
                                productId,
                                parseInt(value) || 1
                              );
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
              <Label className="text-base font-medium">
                Barras de destino:
              </Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Bar Central",
                  "Bar Norte",
                  "Bar Sur",
                  "El Alamo",
                  "Stock General",
                  "Otro Local",
                ].map((barName) => (
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
              Registra el re-ingreso de {selectedProducts.length} producto(s) no
              utilizados
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Products List with Quantities */}
            <div className="space-y-3">
              {selectedProducts.map((productId) => {
                const product = productsData.find((p) => p.id === productId);
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
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
                      <Label
                        htmlFor={`reentry-quantity-${productId}`}
                        className="text-sm"
                      >
                        Cantidad:
                      </Label>
                      <Input
                        id={`reentry-quantity-${productId}`}
                        type="number"
                        min="1"
                        value={adjustmentQuantities[productId] || 1}
                        onChange={(e) =>
                          handleAdjustmentQuantityChange(
                            productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reentry-reason">
                Motivo del re-ingreso (opcional):
              </Label>
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
            <Button onClick={handleReentry} disabled={isLoading}>
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
              {selectedProducts.map((productId) => {
                const product = productsData.find((p) => p.id === productId);
                if (!product) return null;

                return (
                  <div
                    key={productId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
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
                      <Label
                        htmlFor={`loss-quantity-${productId}`}
                        className="text-sm"
                      >
                        Cantidad:
                      </Label>
                      <Input
                        id={`loss-quantity-${productId}`}
                        type="number"
                        min="1"
                        max={product.stock}
                        value={adjustmentQuantities[productId] || 1}
                        onChange={(e) =>
                          handleAdjustmentQuantityChange(
                            productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Reason (Required for losses) */}
            <div className="space-y-2">
              <Label htmlFor="loss-reason">
                Motivo de la pérdida (requerido):
              </Label>
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
      <Dialog
        open={showClearRecordsModal}
        onOpenChange={setShowClearRecordsModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Limpieza de Registros
            </DialogTitle>
            <DialogDescription>
              Esta acción eliminará permanentemente todos los registros de
              transferencias y ajustes de stock.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">
                    ⚠️ Advertencia: Esta acción no se puede deshacer
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    <li>
                      Se eliminarán todos los registros de transferencias entre
                      barras
                    </li>
                    <li>
                      Se eliminarán todos los registros de ajustes de stock
                    </li>
                    <li>Se perderá el historial completo de movimientos</li>
                    <li>
                      Los productos y el stock actual no se verán afectados
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro de que deseas continuar con la limpieza de
              registros?
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
