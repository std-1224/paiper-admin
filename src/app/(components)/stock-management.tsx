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
import AddProductModal from "./add-product-modal";
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
import { useAuth } from "@/context/AuthContext";
// import RecipeBuilder from "./recipe-builder";

export default function StockManagement() {
  // State management
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [salesFilter, setSalesFilter] = useState("all");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth()
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
  const [originalIngredientQuantities, setOriginalIngredientQuantities] =
    useState<{ [ingredientName: string]: number }>({});

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
    ingredients: [] as {
      name: string;
      quantity: string;
      unit: string;
      availableStock?: string | number;
    }[],
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

  let amountToCreate = 0;

  // Recipe selection states for edit modal
  const [selectedEditRecipeId, setSelectedEditRecipeId] = useState<string>("");
  const [showCreateRecipeDialogEdit, setShowCreateRecipeDialogEdit] =
    useState(false);
  const [editSelectedIngredient, setEditSelectedIngredient] = useState<string>("none");

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
    is_liquid: false,
  });
  const [amountPerUnit, setAmountPerUnit] = useState<number>(0);

  const {
    productsData,
    fetchProducts,
    recipesData,
    fetchRecipes,
    ingredientsData,
    normalizedRecipesData,
    fetchIngredients,
    fetchNormalizedRecipes
  } = useAppContext();

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

  // Helper function to extract quantity and unit from product description
  const extractQuantityAndUnitFromDescription = (description: string): { quantity: string; unit: string } => {
    // Try to extract patterns like "500ml", "2kg", "100g", "1.5L", etc.
    const quantityUnitMatch = description.match(/(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/);
    if (quantityUnitMatch) {
      return {
        quantity: quantityUnitMatch[1],
        unit: quantityUnitMatch[2].toLowerCase()
      };
    }

    // Fallback: try to extract just numbers and assume default unit
    const quantityMatch = description.match(/(\d+(?:\.\d+)?)/);
    if (quantityMatch) {
      return {
        quantity: quantityMatch[1],
        unit: "ml" // Default unit
      };
    }

    // Default values if nothing found
    return {
      quantity: "1",
      unit: "unidad"
    };
  };

  // Function to create ingredient records when using ingredient-type products
  const createIngredientRecordsFromIngredientProducts = (
    selectedIngredientId: string,
    productName: string,
    productDescription: string,
    amountToCreate: number,
    cantidadACrear: number
  ) => {
    const selectedIngredient = productsData.find(
      (product) =>
        product.type === "ingredient" &&
        product.id.toString() === selectedIngredientId
    );

    if (!selectedIngredient) {
      return null;
    }

    // Extract quantity and unit from product description
    const { quantity, unit } = extractQuantityAndUnitFromDescription(productDescription || "");

    // Create ingredient record
    const ingredientRecord = {
      name: selectedIngredient.name, // Use ingredient-type product name as ingredient name
      quantity: quantity,
      unit: unit,
      requiredQuantity: cantidadACrear // Set availableStock to the "Cantidad a crear" amount
    };

    return [ingredientRecord];
  };

  // Fetch recipes, ingredients, and normalized recipes on component mount
  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchNormalizedRecipes();
  }, []);

  // Validate stock whenever recipe ingredients change
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      // validateIngredientStock();
    }
  }, [recipeIngredients]);

  // Clear transfer logs function
  const handleClearTransferLogs = () => {
    if (user?.role === "barman" || user?.role === "client") {
      toast.error("No tienes permiso para limpiar registros");
      return;
    }
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
      setNewIngredient({
        name: "",
        quantity: "",
        unit: "ml",
        availableStock: "1",
      });

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
      const createdRecipe = Array.isArray(createdRecipeResponse)
        ? createdRecipeResponse[0]
        : createdRecipeResponse;

      await fetchRecipes(); // Refresh recipes list

      // Process the newly created recipe ingredients directly since we have the data
      const processedIngredients = newRecipe.ingredients.map(
        (ingredient: { name: string; quantity: string; unit: string }) => ({
          name: ingredient.name,
          quantity: ingredient.quantity.toString(),
          unit: ingredient.unit,
          requiredQuantity: ingredientRequiredQuantity,
          availableStock: createdRecipe.stock || 1,
          stock: createdRecipe.stock || 1,
        })
      );

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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
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

    // Set recipe ingredients with their individual available stock
    const ingredientsWithStock = ingredients.map((ingredient: any) => {
      return {
        ...ingredient,
        requiredQuantity: 1, // Default quantity, user can modify
        availableStock: ingredient.availableStock || 0, // Use ingredient's own available stock
        stock: selectedRecipe.stock || 0, // Recipe stock
      };
    });

    setRecipeIngredients(ingredientsWithStock);
    setNewProduct({ ...newProduct, has_recipe: true });
  };

  const updateIngredientQuantity = (index: number, quantity: number) => {
    // Safety check: ensure the index is valid and the ingredient exists
    if (index < 0 || index >= recipeIngredients.length) {
      return;
    }

    const updatedIngredients = [...recipeIngredients];

    // Additional safety check: ensure the ingredient at index exists
    if (!updatedIngredients[index]) {
      return;
    }

    updatedIngredients[index].requiredQuantity = quantity;
    setRecipeIngredients(updatedIngredients);

    // Validate stock
    // validateIngredientStock();
  };

  // Function to check if there's enough stock for all recipe ingredients
  const hasEnoughStockForAllIngredients = () => {
    if (!newProduct.has_recipe || recipeIngredients.length === 0) {
      return true; // No recipe ingredients to check
    }

    return recipeIngredients.every((ingredient) => {
      const totalAvailable = parseFloat(ingredient.quantity) * ingredient.availableStock;
      const totalRequired = parseFloat(ingredient.quantity) * ingredient.requiredQuantity;
      return totalAvailable >= totalRequired;
    });
  };

  // Function to get ingredients with insufficient stock
  const getInsufficientStockIngredients = () => {
    if (!newProduct.has_recipe || recipeIngredients.length === 0) {
      return [];
    }

    return recipeIngredients.filter((ingredient) => {
      const totalAvailable = parseFloat(ingredient.quantity) * ingredient.availableStock;
      const totalRequired = parseFloat(ingredient.quantity) * ingredient.requiredQuantity;
      return totalAvailable < totalRequired;
    });
  };

  // Function to check if there's enough stock for all edit recipe ingredients
  const hasEnoughStockForAllEditIngredients = () => {
    // Check custom ingredients if using custom ingredients
    if (editUseCustomIngredients && editCustomIngredients.length > 0) {
      return editCustomIngredients.every((ingredient) => {
        const requiredQuantity = parseFloat(ingredient.quantity) * (editingProduct?.stock || 1);
        const matchingProduct = productsData.find((p) => p.id === ingredient.productId);
        if (!matchingProduct) return true; // If no matching product, assume it's okay
        const availableStock = matchingProduct.is_liquid ? (matchingProduct.total_amount || 0) : (matchingProduct.stock || 0);
        return availableStock >= requiredQuantity;
      });
    }

    // Check recipe ingredients
    if (!editingProduct?.has_recipe || editRecipeIngredients.length === 0) {
      return true; // No recipe ingredients to check
    }

    return editRecipeIngredients.every((ingredient) => {
      const totalAvailable = parseFloat(ingredient.quantity) * ingredient.availableStock;
      const totalRequired = parseFloat(ingredient.quantity) * ingredient.requiredQuantity;
      return totalAvailable >= totalRequired;
    });
  };

  // Function to get edit ingredients with insufficient stock
  const getInsufficientStockEditIngredients = () => {
    if (!editingProduct?.has_recipe || editRecipeIngredients.length === 0) {
      return [];
    }

    return editRecipeIngredients.filter((ingredient) => {
      const totalAvailable = parseFloat(ingredient.quantity) * ingredient.availableStock;
      const totalRequired = parseFloat(ingredient.quantity) * ingredient.requiredQuantity;
      return totalAvailable < totalRequired;
    });
  };

  // Debug function to test stock deduction calculation
  const debugStockCalculation = () => {
    console.log("🧪 === STOCK CALCULATION DEBUG ===");
    console.log("📦 Product to create:", {
      name: newProduct.name,
      amountToCreate: newProduct.stock,
      hasRecipe: newProduct.has_recipe,
      selectedRecipeId: selectedRecipeId
    });

    // Show current recipe data
    const selectedRecipe = recipesData.find(r => r.id.toString() === selectedRecipeId);
    if (selectedRecipe) {
      console.log("📋 Selected recipe from database:", {
        id: selectedRecipe.id,
        name: selectedRecipe.name,
        ingredients: selectedRecipe.ingredients
      });
    }

    if (newProduct.has_recipe && recipeIngredients.length > 0) {
      console.log("🔍 Recipe ingredients analysis:");
      recipeIngredients.forEach((ingredient, index) => {
        const amountToCreate = newProduct.stock || 1;
        const requiredPerUnit = ingredient.requiredQuantity;
        const totalRequired = requiredPerUnit * amountToCreate;
        const currentStock = ingredient.availableStock;
        const stockAfterDeduction = currentStock - totalRequired;

        console.log(`  ${index + 1}. ${ingredient.name}:`, {
          currentAvailableStock: currentStock,
          requiredPerUnit: requiredPerUnit,
          amountToCreate: amountToCreate,
          totalRequired: totalRequired,
          stockAfterDeduction: stockAfterDeduction,
          hasEnoughStock: stockAfterDeduction >= 0
        });
      });

      console.log("🎯 Summary:");
      console.log(`  - Total products to create: ${newProduct.stock || 1}`);
      console.log(`  - Recipe ingredients count: ${recipeIngredients.length}`);
      console.log(`  - All ingredients have enough stock: ${hasEnoughStockForAllIngredients()}`);
    } else {
      console.log("❌ No recipe ingredients found or recipe not selected");
    }
  };

  // Function to update ingredient quantities in edit modal
  const updateEditIngredientQuantity = (index: number, quantity: number) => {
    // Safety check: ensure the index is valid and the ingredient exists
    if (index < 0 || index >= editRecipeIngredients.length) {
      console.error(`❌ Invalid index ${index} for editRecipeIngredients array of length ${editRecipeIngredients.length}`);
      return;
    }

    const updatedIngredients = [...editRecipeIngredients];

    // Additional safety check: ensure the ingredient at index exists
    if (!updatedIngredients[index]) {
      console.error(`❌ No ingredient found at index ${index}`);
      return;
    }

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

    // if (matchingProduct) {
    //   if (matchingProduct.stock < requiredQuantity) {
    //     toast.error(
    //       `Stock insuficiente para ${ingredientName}:\nRequerido: ${requiredQuantity} ${ingredientUnit}\nDisponible: ${matchingProduct.stock}`
    //     );
    //     return;
    //   }
    // } else {
    //   // Warn if no matching product found
    //   const confirmAdd = confirm(
    //     `No se encontró un producto en stock que coincida con "${ingredientName}".\n¿Deseas agregar este ingrediente de todas formas?`
    //   );
    //   if (!confirmAdd) {
    //     return;
    //   }
    // }

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
      console.log(
        "Available recipes:",
        recipesData.map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          hasIngredients: !!r.ingredients,
        }))
      );

      const matchingRecipe = recipesData.find((recipe) => {
        // Must be a recipe type with ingredients
        if (recipe.type !== "recipe" || !recipe.ingredients) {
          return false;
        }

        try {
          const recipeIngredients =
            typeof recipe.ingredients === "string"
              ? JSON.parse(recipe.ingredients)
              : recipe.ingredients;

          // Check if all new ingredients exist in this recipe by name
          const allIngredientsMatch = newIngredients.every((newIng) =>
            recipeIngredients.some(
              (recipeIng: any) => recipeIng.name === newIng.name
            )
          );

          console.log(`Recipe "${recipe.name}":`, {
            recipeIngredientNames: recipeIngredients.map(
              (ing: any) => ing.name
            ),
            newIngredientNames: newIngredients.map((ing) => ing.name),
            matches: allIngredientsMatch,
          });

          return allIngredientsMatch;
        } catch (error) {
          console.error(
            `Error parsing recipe ${recipe.name} ingredients:`,
            error
          );
          return false;
        }
      });

      if (!matchingRecipe) {
        console.error("❌ No matching recipe found for these ingredients");
        console.log(
          "Looking for ingredients:",
          newIngredients.map((ing) => ing.name)
        );
        return;
      }

      console.log(`✅ Found matching recipe: "${matchingRecipe.name}"`);

      // Parse recipe ingredients
      let recipeIngredients;
      try {
        recipeIngredients =
          typeof matchingRecipe.ingredients === "string"
            ? JSON.parse(matchingRecipe.ingredients)
            : matchingRecipe.ingredients;
      } catch (error) {
        console.error("Error parsing recipe ingredients:", error);
        return;
      }

      // Calculate differences and update availableStock
      const updatedIngredients = recipeIngredients.map((recipeIng: any) => {
        const newIng = newIngredients.find(
          (ing) => ing.name === recipeIng.name
        );
        if (newIng) {
          const originalQuantity = originalQuantities[recipeIng.name] || 0;
          const newQuantity = newIng.requiredQuantity || 0;
          const difference = newQuantity - originalQuantity;

          // Calculate new availableStock: current - difference
          const currentAvailableStock = recipeIng.availableStock || 0;
          const newAvailableStock = Math.max(
            0,
            currentAvailableStock - difference
          );

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
        throw new Error(
          `Failed to update recipe ingredient stock: ${response.status}`
        );
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
    console.log("🏭 === RECIPE INGREDIENT STOCK DEDUCTION ===");
    console.log("📋 Input ingredients:", ingredients);
    console.log("🔢 Product amount to create:", productAmount);

    // Find the recipe to update its ingredients
    const selectedRecipe = recipesData.find(
      (recipe) => recipe.id.toString() === selectedRecipeId
    );
    if (!selectedRecipe) {
      console.error("Selected recipe not found for stock deduction");
      return;
    }

    console.log("📝 Selected recipe:", {
      id: selectedRecipe.id,
      name: selectedRecipe.name,
      stock: selectedRecipe.stock
    });

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

      console.log("📦 Original ingredients from database:", originalIngredients);

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
          // For recipe-type products: deduct requiredQuantity from availableStock
          // requiredQuantity already represents the total amount needed for this ingredient
          const currentAvailableStock = originalIng.availableStock || 0;
          const requiredQuantity = matchingIngredient.requiredQuantity || 1;

          console.log(`🔄 Deducting for ingredient ${originalIng.name}:`, {
            currentAvailableStock,
            requiredQuantity,
            newAvailableStock: Math.max(0, currentAvailableStock - requiredQuantity)
          });

          // Update only the availableStock, preserve all other properties
          return {
            ...originalIng,
            availableStock: Math.max(
              0,
              currentAvailableStock - requiredQuantity
            ),
          };
        }

        // If no match found, return original ingredient unchanged
        return originalIng;
      });

      // Update the recipe with new ingredient availableStock values
      const updatePayload = {
        id: selectedRecipe.id,
        name: selectedRecipe.name,
        category: selectedRecipe.category,
        amount: selectedRecipe.stock,
        ingredients: updatedIngredients,
      };
      const response = await fetch(`/api/recipe`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update recipe ingredient stock: ${response.status} ${errorText}`);
      }

      // Refresh recipes data to reflect changes
      await fetchRecipes();
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

    // Check if the selected item is an ingredient first (from ingredientsData)
    const selectedIngredient = ingredientsData.find(
      (ingredient) => ingredient.id.toString() === recipeId
    );

    if (selectedIngredient) {
      // Handle individual ingredient selection
      const ingredientData = [{
        name: selectedIngredient.name,
        quantity: selectedIngredient.quantity.toString(),
        unit: selectedIngredient.unit,
        requiredQuantity: 1,
        availableStock: selectedIngredient.stock,
        stock: selectedIngredient.stock,
      }];

      setEditRecipeIngredients(ingredientData);
      setEditingProduct({
        ...editingProduct!,
        has_recipe: true,
      });
      return;
    }

    // Find the selected recipe (only actual recipes, not ingredients)
    const selectedRecipe = normalizedRecipesData.find(
      (recipe) => recipe.id.toString() === recipeId
    );

    if (!selectedRecipe) {
      // Recipe not found
      return;
    }

    // Handle recipe selection - load its ingredients
    if (selectedRecipe.recipe_ingredients && selectedRecipe.recipe_ingredients.length > 0) {
      const recipeIngredients = selectedRecipe.recipe_ingredients.map(ri => ({
        name: ri.ingredient_name || "", // Provide default empty string
        quantity: ri.deduct_quantity.toString(), // Use deduct_quantity as the quantity
        unit: ri.ingredient_unit || "ml", // Provide default unit
        requiredQuantity: 1,
        availableStock: ri.deduct_stock, // Show deduct_stock as available stock
        stock: ri.deduct_stock,
      }));

      setEditRecipeIngredients(recipeIngredients);
    } else {
      setEditRecipeIngredients([]);
    }

    // Set the product to have a recipe
    setEditingProduct({
      ...editingProduct!,
      has_recipe: true,
    });
  };

  // Add custom ingredient function for edit modal
  const addEditCustomIngredient = () => {
    let ingredientName = "";
    let productId = undefined;
    let matchingProduct = null;

    if (selectedIngredient === "none") {
      ingredientName = editCustomIngredientName;
      // Try to find matching product for custom ingredient
      matchingProduct = productsData.find(
        (product) =>
          product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
          ingredientName.toLowerCase().includes(product.name.toLowerCase())
      );
    } else if (selectedIngredient && selectedIngredient !== "none") {
      // selectedIngredient contains the product ID, find the product
      matchingProduct = productsData.find(
        (product) => product.id.toString() === selectedIngredient
      );
      if (matchingProduct) {
        ingredientName = matchingProduct.name;
        productId = matchingProduct.id;
      } else {
        // Fallback: treat selectedIngredient as product name
        ingredientName = selectedIngredient;
        matchingProduct = productsData.find(
          (product) =>
            product.name.toLowerCase().includes(ingredientName.toLowerCase()) ||
            ingredientName.toLowerCase().includes(product.name.toLowerCase())
        );
        if (matchingProduct) {
          productId = matchingProduct.id;
        }
      }
    } else {
      ingredientName = editCustomIngredientName;
    }

    if (matchingProduct && !productId) {
      productId = matchingProduct.id;
    }

    // Validate that ingredient name and quantity are provided
    if (!ingredientName.trim()) {
      toast.error("Por favor ingresa el nombre del ingrediente");
      return;
    }
    if (!editIngredientQuantity.trim()) {
      toast.error("Por favor ingresa la cantidad del ingrediente");
      return;
    }

    // Validate stock availability for this ingredient
    const requiredQuantity = parseFloat(editIngredientQuantity);
    if (isNaN(requiredQuantity) || requiredQuantity <= 0) {
      toast.error("Por favor ingresa una cantidad válida");
      return;
    }

    if (matchingProduct) {
      const availableStock = matchingProduct.is_liquid ? (matchingProduct.total_amount || 0) : (matchingProduct.stock || 0);
      if (availableStock < requiredQuantity) {
        toast.error(
          `Stock insuficiente para ${ingredientName}:\nRequerido: ${requiredQuantity} ${editIngredientUnit}\nDisponible: ${availableStock}`
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

    setEditCustomIngredients([
      ...editCustomIngredients,
      {
        name: ingredientName.trim(),
        quantity: editIngredientQuantity,
        unit: editIngredientUnit,
        productId: productId,
      },
    ]);
    setSelectedIngredient("none");
    setEditCustomIngredientName("");
    setEditIngredientQuantity("");
    setEditIngredientUnit("ml");
  };

  const removeEditCustomIngredient = (index: number) => {
    const updatedIngredients = editCustomIngredients.filter((_, i) => i !== index);
    setEditCustomIngredients(updatedIngredients);
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
        throw new Error(
          `Failed to create recipe: ${response.status} - ${errorData}`
        );
      }

      const createdRecipeResponse = await response.json();
      console.log("✅ Recipe created successfully:", createdRecipeResponse);

      // The API returns an array, so get the first element
      const createdRecipe = Array.isArray(createdRecipeResponse)
        ? createdRecipeResponse[0]
        : createdRecipeResponse;
      console.log("✅ Extracted recipe object:", createdRecipe);

      console.log("🔄 Refreshing recipes list...");
      await fetchRecipes(); // Refresh recipes list
      console.log("✅ Recipes list refreshed");

      console.log("🔄 Processing newly created recipe ingredients manually...");
      // Process the newly created recipe ingredients directly since we have the data
      const processedIngredients = newRecipe.ingredients.map(
        (ingredient: { name: string; quantity: string; unit: string }) => ({
          name: ingredient.name,
          quantity: ingredient.quantity.toString(),
          unit: ingredient.unit,
          requiredQuantity: editIngredientRequiredQuantity,
          availableStock: createdRecipe.stock || 1,
          stock: createdRecipe.stock || 1,
        })
      );

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

      console.log(
        "✅ Recipe ingredients processed and set:",
        processedIngredients
      );
      console.log("✅ Updated editingProduct:", updatedProduct);
      console.log("✅ Selected recipe ID:", createdRecipe.id.toString());
      console.log(
        "✅ editRecipeIngredients length:",
        processedIngredients.length
      );

      // Force a re-render by updating a dummy state
      // This ensures React processes all state updates
      setTimeout(() => {
        console.log("🔍 Final state check:");
        console.log(
          "  - editRecipeIngredients.length:",
          editRecipeIngredients.length
        );
        console.log(
          "  - editingProduct.has_recipe:",
          editingProduct?.has_recipe
        );
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
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Error al crear la receta: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate derived data
  const {
    totalProducts,
    totalRecipes,
    totalIngredients,
    lowStockProducts,
    outOfStockProducts,
    stockValue,
    averageMargin,
  } = useMemo(() => {
    // Count recipes and ingredients separately
    const recipeCount = recipesData.filter(r => r.type === "recipe").length;
    const ingredientCount = ingredientsData.length;
    const productCount = productsData.length;
    const totalItems = productCount + recipeCount + ingredientCount;

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
      totalProducts: totalItems, // Total products + recipes + ingredients
      totalRecipes: recipeCount,
      totalIngredients: ingredientCount,
      lowStockProducts,
      outOfStockProducts,
      stockValue,
      averageMargin,
    };
  }, [productsData, recipesData, ingredientsData]);

  // Filter products based on search, category filter, and sales filter
  const filteredProducts = useMemo(() => {
    // Combine productsData, recipesData, and ingredientsData, but avoid duplicates by ID
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

    // Add all ingredients from ingredientsData that aren't already added
    ingredientsData.forEach((item) => {
      if (!seenIds.has(item.id)) {
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
  }, [productsData, recipesData, ingredientsData, searchTerm, filter, salesFilter]);

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
      } else {
        // Check if we're creating a product using an ingredient-type product
        const selectedIngredient = productsData.find(
          (product) =>
            product.type === "ingredient" &&
            product.id.toString() === selectedRecipeId
        );

        if (selectedIngredient && selectedRecipeId && selectedRecipeId !== "no-recipe") {
          // Create ingredient records from ingredient-type product
          const ingredientRecords = createIngredientRecordsFromIngredientProducts(
            selectedRecipeId,
            newProduct.name || "",
            newProduct.description || "",
            newProduct.stock || 1,
            ingredientRequiredQuantity
          );

          if (ingredientRecords) {
            ingredientsData = ingredientRecords;
            // Set has_recipe to true so the product stores ingredient information
            newProduct.has_recipe = true;
          }
        }
      }

      // Calculate total_amount for ingredient-type products
      let totalAmount = null;
      if (newProduct.type === "ingredient") {
        totalAmount = (newProduct.stock || 0) * amountPerUnit;
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
            (useCustomIngredients && customIngredients.length > 0) ||
            (ingredientsData && ingredientsData.length > 0), // Include ingredient-type products
          ingredients: ingredientsData ? JSON.stringify(ingredientsData) : null,
          total_amount: totalAmount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      // Deduct ingredient stock based on product type
      if ((newProduct.stock || 0) > 0) {
        if (newProduct.has_recipe && recipeIngredients.length > 0) {
          // For recipe-type products: deduct from recipe ingredients' availableStock
          await deductRecipeIngredientStock(
            recipeIngredients,
            newProduct.stock || 1
          );
        } else {
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
          }
        }

        if (useCustomIngredients && customIngredients.length > 0) {
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
        type: "product",
        has_recipe: false,
        is_liquid: false,
      });
      setAmountPerUnit(0);
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (user?.role === "barman" || user?.role === "client") {
      toast.error("No tienes permiso para editar productos");
      return;
    }
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
      console.log(
        "editRecipeIngredients.length:",
        editRecipeIngredients.length
      );
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
          console.log(
            "📝 Parsed ingredients from editingProduct:",
            parsedIngredients
          );
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
      if (
        editingProduct.has_recipe &&
        ingredientsData &&
        Object.keys(originalIngredientQuantities).length > 0
      ) {
        try {
          console.log("=== STOCK DEDUCTION PROCESS ===");
          console.log("Original quantities:", originalIngredientQuantities);
          console.log("New ingredients data:", ingredientsData);
          console.log("editRecipeIngredients state:", editRecipeIngredients);
          console.log(
            "editingProduct.ingredients:",
            editingProduct.ingredients
          );

          await deductRecipeIngredientStockDifference(
            ingredientsData,
            originalIngredientQuantities
          );

          console.log("✅ Stock deduction completed successfully");
        } catch (error) {
          console.error("❌ Error processing ingredient changes:", error);
          // Don't fail the entire update if stock deduction fails
          toast.error(
            "Error al actualizar stock de ingredientes, pero el producto se guardará"
          );
        }
      } else {
        console.log("⚠️ Skipping stock deduction:", {
          hasRecipe: editingProduct.has_recipe,
          hasIngredientsData: !!ingredientsData,
          hasOriginalQuantities:
            Object.keys(originalIngredientQuantities).length > 0,
        });
      }

      // Calculate total_amount for ingredient-type products
      let totalAmount = null;
      if (editingProduct.type === "ingredient") {
        totalAmount = (editingProduct.stock || 0) * amountPerUnit;
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
          total_amount: totalAmount,
        }),
      });

      if (!response.ok) throw new Error("Failed to update product");

      console.log("✅ Product updated successfully");

      // Update ingredient table if this product is type "ingredient"
      if (editingProduct.type === "ingredient") {
        try {
          // First, find the existing ingredient by product_id
          const findResponse = await fetch(`/api/ingredients`);
          if (findResponse.ok) {
            const existingIngredients = await findResponse.json();
            const existingIngredient = existingIngredients.find((ing: any) => ing.product_id === editingProduct.id);

            if (existingIngredient) {
              // Update existing ingredient
              const ingredientData = {
                id: existingIngredient.id,
                product_id: editingProduct.id,
                name: editingProduct.name.trim(),
                unit: "ml", // Always ml as specified
                quantity: amountPerUnit, // quantity per unit
                stock: editingProduct.stock || 0, // product stock
                is_liquid: true, // Always true as specified
              };

              const updateResponse = await fetch("/api/ingredients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ingredientData),
              });

              if (!updateResponse.ok) {
                console.error("Failed to update ingredient entry, but product was updated successfully");
              }
            } else {
              // Create new ingredient if none exists
              const ingredientData = {
                product_id: editingProduct.id,
                name: editingProduct.name.trim(),
                unit: "ml", // Always ml as specified
                quantity: amountPerUnit, // quantity per unit
                stock: editingProduct.stock || 0, // product stock
                is_liquid: true, // Always true as specified
              };

              const createResponse = await fetch("/api/ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ingredientData),
              });

              if (!createResponse.ok) {
                console.error("Failed to create ingredient entry, but product was updated successfully");
              }
            }
          }
        } catch (error) {
          console.error("Error updating ingredient entry:", error);
          // Continue execution as product was updated successfully
        }
      }

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
    fetchIngredients();
    fetchNormalizedRecipes();
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
      // Check if it's a product, recipe, or ingredient
      const isProduct = "purchase_price" in item;
      const isRecipe = item.type === "recipe";
      const isIngredient = "quantity" in item && !isProduct && !isRecipe;
      const product = item as any; // Cast to any to access all properties

      return {
        Nombre: product.name,
        Tipo: isProduct ? "Producto" : isRecipe ? "Receta" : isIngredient ? "Ingrediente" : "Otro",
        Categoría: isProduct ? product.category : isRecipe ? "Receta" : isIngredient ? (product.type === "ingredient-product" ? "Ingrediente-Producto" : "Ingrediente Individual") : "N/A",
        "Precio Compra": isProduct ? product.purchase_price : "N/A",
        "Precio Venta": isProduct ? product.sale_price : "N/A",
        Stock: isProduct ? (product.stock || 0) : "N/A",
        "Cantidad/Estado": isProduct ? calculateStatus(product.stock || 0) : isRecipe ? "Receta" : isIngredient ? `${product.quantity || 0} ${product.unit || "unidad"}` : "N/A",
        "Es Líquido": isIngredient && product.is_liquid ? "Sí" : "No",
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
      `inventario_completo_${new Date().toISOString().split("T")[0]}.xlsx`
    );
    toast.success("Inventario completo exportado exitosamente");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Stock</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddProductModal(true)}
            className="gap-2"
          >
            <Plus size={16} />
            Agregar Producto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Total Items</p>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {totalRecipes} recetas, {totalIngredients} ingredientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Stock Bajo</p>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock &lt; 5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Sin Stock</p>
            <PackageX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              Productos agotados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <p className="text-sm font-medium">Valor Stock</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Margen promedio: {averageMargin.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos, recetas e ingredientes..."
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
          <Button
            onClick={() => {
              if (user?.role === "barman" || user?.role === "client") {
                toast.error("No tienes permiso para crear pedidos");
                return;
              }
              setShowAddProductModal(true);
            }}
          >
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
                if (user?.role === "barman" || user?.role === "client") {
                  toast.error("No tienes permiso para ajustar stock");
                  return;
                }
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
                  if (user?.role === "barman" || user?.role === "client") {
                    toast.error("No tienes permiso para ajustar stock");
                    return;
                  }
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
                  if (user?.role === "barman" || user?.role === "client") {
                    toast.error("No tienes permiso para ajustar stock");
                    return;
                  }
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
                  const isRecipe = item.type === "recipe";
                  const isIngredient = "quantity" in item && !isProduct && !isRecipe;

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
                                {isRecipe && "(Receta)"}
                                {isIngredient && "(Ingrediente)"}
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
                        {isProduct ? (
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
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isProduct ? (
                          <Switch
                            checked={product.is_pr}
                            onCheckedChange={(checked) =>
                              handleToggleActive(product.id, checked, "is_pr")
                            }
                          />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant="outline">
                          {isProduct ? (
                            categoryList.find(
                              (c) => c.value === product.category
                            )?.label || product.category
                          ) : isRecipe ? (
                            "Receta"
                          ) : isIngredient ? (
                            product.type === "ingredient-product" ? "Ingrediente-Producto" : "Ingrediente"
                          ) : (
                            product.type || "Otro"
                          )}
                        </Badge>
                      </td>
                      <td className="p-3">
                        {isProduct ? (
                          `$${product.sale_price.toFixed(2)}`
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isProduct ? (
                          <Badge
                            className={cn(
                              "font-normal",
                              calculateStatus(product.stock || 0) === "sufficient" &&
                              "bg-green-50 text-green-700",
                              calculateStatus(product.stock || 0) === "low" &&
                              "bg-amber-50 text-amber-700",
                              calculateStatus(product.stock || 0) === "out" &&
                              "bg-red-50 text-red-700"
                            )}
                          >
                            {product.stock || 0}{" "}
                            {calculateStatus(product.stock || 0) === "sufficient"
                              ? "✓"
                              : calculateStatus(product.stock || 0) === "low"
                                ? "⚠"
                                : "✕"}
                          </Badge>
                        ) : isRecipe ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Receta
                          </Badge>
                        ) : isIngredient ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {product.quantity || 0} {product.unit || "unidad"}
                            {product.is_liquid && <span className="ml-1 text-blue-600">💧</span>}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => viewProductDetails(product)}
                            title={
                              isProduct ? "Ver detalles del producto" :
                              isRecipe ? "Ver detalles de la receta" :
                              isIngredient ? "Ver detalles del ingrediente" :
                              "Ver detalles"
                            }
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          {isProduct && (product.type === "product" || (product.type === "ingredient" && product.is_liquid === true)) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                setEditingProduct(product);

                                // Initialize amountPerUnit for ingredient-type products
                                if (product.type === "ingredient" && product.total_amount && product.stock) {
                                  setAmountPerUnit(product.total_amount / product.stock);
                                } else {
                                  setAmountPerUnit(0);
                                }

                                // Load ALL ingredients that this product has
                                try {
                                  let allIngredients: any[] = [];
                                  let hasRecipeIngredients = false;
                                  let hasCustomIngredients = false;

                                  // 1. Fetch recipe ingredients from recipe_ingredients table
                                  const response = await fetch(`/api/recipe-ingredients?product_id=${product.id}`);
                                  if (response.ok) {
                                    const productRecipeIngredients = await response.json();

                                    if (productRecipeIngredients && productRecipeIngredients.length > 0) {
                                      hasRecipeIngredients = true;
                                      // Convert to the format expected by editRecipeIngredients
                                      const processedIngredients = productRecipeIngredients.map((ri: any) => ({
                                        name: ri.ingredients.name,
                                        quantity: ri.deduct_quantity.toString(),
                                        unit: ri.ingredients.unit,
                                        requiredQuantity: 1,
                                        availableStock: ri.deduct_stock,
                                        stock: ri.deduct_stock,
                                      }));

                                      allIngredients = [...allIngredients, ...processedIngredients];
                                    }
                                  }

                                  // 2. Check if product has ingredients stored in product.ingredients field (legacy/custom)
                                  if (product.has_recipe && product.ingredients) {
                                    try {
                                      const storedIngredients = JSON.parse(product.ingredients);

                                      if (storedIngredients && storedIngredients.length > 0) {
                                        // Check if these are custom ingredients (have productId) or recipe ingredients
                                        if (storedIngredients[0].productId) {
                                          // Custom ingredients
                                          hasCustomIngredients = true;
                                          setEditCustomIngredients(storedIngredients);
                                        } else {
                                          // Recipe ingredients stored in product.ingredients
                                          if (!hasRecipeIngredients) {
                                            // Only use these if we didn't find any in recipe_ingredients table
                                            const processedStoredIngredients = storedIngredients.map((ing: any) => ({
                                              name: ing.name,
                                              quantity: ing.quantity.toString(),
                                              unit: ing.unit,
                                              requiredQuantity: ing.requiredQuantity || 1,
                                              availableStock: ing.availableStock || 0,
                                              stock: ing.stock || 0,
                                            }));
                                            allIngredients = [...allIngredients, ...processedStoredIngredients];
                                          }
                                        }
                                      }
                                    } catch (error) {
                                      console.error("Error parsing product.ingredients:", error);
                                    }
                                  }

                                  // 3. Set the appropriate states based on what we found
                                  if (allIngredients.length > 0) {
                                    setEditRecipeIngredients(allIngredients);
                                    setEditUseCustomIngredients(hasCustomIngredients);

                                    // Store original quantities for difference calculation
                                    const originalQuantities: {
                                      [ingredientName: string]: number;
                                    } = {};
                                    allIngredients.forEach((ing: any) => {
                                      originalQuantities[ing.name] = ing.requiredQuantity || 1;
                                    });
                                    setOriginalIngredientQuantities(originalQuantities);
                                  } else {
                                    // No ingredients found
                                    setEditRecipeIngredients([]);
                                    setEditUseCustomIngredients(hasCustomIngredients);
                                    setSelectedEditRecipeId("");
                                  }

                                } catch (error) {
                                  console.error("Error loading product ingredients:", error);
                                  // Reset states on error
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
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        onProductAdded={() => {
          setShowAddProductModal(false);
          fetchProducts();
        }}
        categoryList={categoryList}
        recipesData={recipesData}
        productsData={productsData}
        ingredientsData={ingredientsData}
        normalizedRecipesData={normalizedRecipesData}
      />
      <Dialog>
        <DialogContent>
          {/* Edit Product Modal */}
          <div>
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Configuración del Producto</h3>

                {/* Liquid Product Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      ¿Es este un producto líquido?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Los productos líquidos mostrarán el total de cantidad agregada como ingrediente
                    </p>
                  </div>
                  <Switch
                    checked={newProduct.is_liquid || false}
                    onCheckedChange={(checked) =>
                      setNewProduct({ ...newProduct, is_liquid: checked })
                    }
                  />
                </div>





                {/* Ingredient Type Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      ¿Usar este producto como ingrediente en recetas?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Este producto estará disponible para seleccionar como ingrediente al crear recetas
                    </p>
                  </div>
                  <Switch
                    checked={newProduct.type === "ingredient"}
                    onCheckedChange={(checked) =>
                      setNewProduct({
                        ...newProduct,
                        type: checked ? "ingredient" : "product"
                      })
                    }
                  />
                </div>

                {/* Total Amount Calculation Display - Show when ingredient type is enabled */}
                {newProduct.type === "ingredient" && (
                  <div className="rounded-lg border p-3 bg-blue-50">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-blue-900">
                        Cálculo de Cantidad Total
                      </Label>

                      {/* Amount per unit input */}
                      <div className="space-y-2">
                        <Label htmlFor="amount_per_unit" className="text-sm">
                          Cantidad por unidad {newProduct.is_liquid ? "(ml)" : ""}
                        </Label>
                        <Input
                          id="amount_per_unit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountPerUnit === 0 ? "" : amountPerUnit}
                          placeholder="Ej: 500 ml por botella"
                          onChange={(e) => setAmountPerUnit(parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Stock:</span>
                          <span className="ml-2 font-medium">{newProduct.stock || 0} unidades</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Cantidad por unidad:</span>
                          <span className="ml-2 font-medium">{amountPerUnit} {newProduct.is_liquid ? "ml" : ""}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-blue-200">
                        <span className="text-blue-900 font-semibold">
                          Total Amount: {((newProduct.stock || 0) * amountPerUnit)}
                          {newProduct.is_liquid ? " ml" : " unidades"}
                        </span>
                      </div>
                      <p className="text-xs text-blue-700">
                        Este valor se guardará como total_amount en la base de datos
                      </p>
                    </div>
                  </div>
                )}

                {/* Show total amount for liquid products (existing recipe logic)
                {newProduct.is_liquid && recipeIngredients.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-blue-800">
                         Total Liquid Product
                        </h3>
                        <p className="text-xs text-blue-600 mt-1">
                          Suma total de todos los ingredientes requeridos
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900">
                          {amountToCreate.toFixed(0)} ml
                        </p>
                      </div>
                    </div>
                  </div>
                )} */}
              </div>
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
              onClick={() => {
                setShowAddProductModal(false);
                setAmountPerUnit(0);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="outline"
              onClick={debugStockCalculation}
              className="mr-2"
              size="sm"
            >
              🧪 Debug
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                console.log("📊 Current recipes data:", recipesData.map(r => ({
                  id: r.id,
                  name: r.name,
                  ingredients: r.ingredients
                })));
              }}
              className="mr-2"
              size="sm"
            >
              📊 Show Recipes
            </Button>
            <Button
              onClick={() => handleAddProduct()}
              disabled={isLoading || !hasEnoughStockForAllIngredients()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : !hasEnoughStockForAllIngredients() ? (
                "Stock Insuficiente"
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
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifique los detalles del producto para actualizar el inventario.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-2 py-4">
            {/* Image Upload */}
            <ImageUpload
              handleSetImageFile={setImageFile}
              imageUrl={editingProduct?.image_url}
            />

            {/* Basic Product Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={editingProduct?.name || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      name: e.target.value,
                    })
                  }
                  placeholder="Nombre del producto"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
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
                    {categoryList.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Toggle Fields */}
            <div className="space-y-4 border rounded-lg p-4">
              <div className="space-y-4">
                <h3 className="text-base font-semibold">Configuración del Producto</h3>

                {/* Ingredient Type Toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      ¿Usar este producto como ingrediente en recetas?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Al activar esta opción, se creará automáticamente una entrada en la tabla de ingredientes
                      con el ID del producto, permitiendo usar este producto como ingrediente en otras recetas.
                    </p>
                  </div>
                  <Switch
                    checked={editingProduct?.type === "ingredient"}
                    onCheckedChange={(checked) => {
                      setEditingProduct({
                        ...editingProduct!,
                        type: checked ? "ingredient" : "product",
                        is_liquid: checked,
                      });

                      // Clear recipe/ingredient selections when enabling ingredient mode
                      if (checked) {
                        setSelectedEditRecipeId("");
                        setEditRecipeIngredients([]);
                        setEditUseCustomIngredients(false);
                        setEditCustomIngredients([]);
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={editingProduct?.stock === 0 ? "" : editingProduct?.stock}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct!,
                        stock: e.target.value === "" ? 0 : Number(e.target.value),
                      })
                    }
                    placeholder="Cantidad en stock"
                  />
                </div>

                {/* Amount per unit input - Show when ingredient type is enabled */}
                {editingProduct?.type === "ingredient" && (
                  <div className="rounded-lg border p-3 bg-blue-50">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium text-blue-900">
                        Cálculo de Cantidad Total
                      </Label>

                      {/* Amount per unit input */}
                      <div className="space-y-2">
                        <Label htmlFor="amount_per_unit" className="text-sm">
                          Cantidad por unidad {editingProduct?.is_liquid ? "(ml)" : ""}
                        </Label>
                        <Input
                          id="amount_per_unit"
                          type="number"
                          min="0"
                          step="0.01"
                          value={amountPerUnit === 0 ? "" : amountPerUnit}
                          placeholder={editingProduct?.is_liquid ? "Ej: 500 ml por botella" : "Ej: 1 unidad"}
                          onChange={(e) => setAmountPerUnit(parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>

                      <div className="pt-2 border-t border-blue-200">
                        <span className="text-blue-900 font-semibold">
                          Total Amount (producto): {((editingProduct?.stock || 0) * amountPerUnit)}
                          {editingProduct?.is_liquid ? " ml" : " unidades"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
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
                  onClick={() => setShowCreateRecipeDialogEdit(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Crear Receta
                </Button>
              </div>

              {/* Show disabled message when ingredient toggle is enabled */}
              {editingProduct?.type === "ingredient" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Modo Ingrediente:</strong> Los productos de tipo ingrediente no requieren recetas o ingredientes adicionales.
                    Este producto estará disponible para usar como ingrediente en otras recetas.
                  </p>
                  <div className="mt-2 p-2 bg-white rounded border">
                    <p className="text-xs text-blue-700 font-medium">Información de Guardado:</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Se actualizará automáticamente la entrada en la tabla <code>ingredients</code> con:
                    </p>
                    <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                      <li>name: {editingProduct?.name || "[Nombre del producto]"}</li>
                      <li>unit: ml</li>
                      <li>quantity: {amountPerUnit || 0}</li>
                      <li>stock: {editingProduct?.stock || 0}</li>
                      <li>is_liquid: true</li>
                      <li>product_id: {editingProduct?.id}</li>
                    </ul>
                  </div>
                </div>
              )}

              <Select
                value={selectedEditRecipeId || "no-recipe"}
                onValueChange={handleEditRecipeSelection}
                disabled={editingProduct?.type === "ingredient"}
              >
                <SelectTrigger className={editingProduct?.type === "ingredient" ? "opacity-50 cursor-not-allowed" : ""}>
                  <SelectValue placeholder="Seleccionar receta o ingrediente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-recipe">Sin receta</SelectItem>

                  {/* Show Recipes from the recipes table */}
                  {normalizedRecipesData.length > 0 && (
                    <>
                      <SelectItem value="recipes-header" disabled>
                        <span className="font-semibold text-blue-600">--- Recetas ---</span>
                      </SelectItem>
                      {normalizedRecipesData.map((recipe) => (
                        <SelectItem
                          key={`recipe-${recipe.id}`}
                          value={recipe.id.toString()}
                        >
                          {recipe.name} - Receta
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Show Ingredients from the ingredients table */}
                  {ingredientsData.length > 0 && (
                    <>
                      <SelectItem value="ingredients-header" disabled>
                        <span className="font-semibold text-green-600">--- Ingredientes ---</span>
                      </SelectItem>
                      {ingredientsData
                        .filter((ingredient) => ingredient.product_id !== editingProduct?.id)
                        .map((ingredient) => (
                          <SelectItem
                            key={`ingredient-${ingredient.id}`}
                            value={ingredient.id}
                          >
                            {ingredient.name} ({ingredient.unit}) - Ingrediente
                          </SelectItem>
                        ))}
                    </>
                  )}
                </SelectContent>
              </Select>

              {editRecipeIngredients.length > 0 && (
                <div className="mt-4 space-y-4">
                  <Label className="text-sm font-medium">
                    {selectedEditRecipeId && normalizedRecipesData.find(r => r.id.toString() === selectedEditRecipeId)
                      ? "Ingredientes de la receta:"
                      : "Ingrediente seleccionado:"}
                  </Label>

                  <div className="space-y-3">
                    {editRecipeIngredients.map((ingredient, index) => (
                      <div key={index} className="border rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Ingrediente
                            </Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {ingredient.name}
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Cantidad por unidad
                            </Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {ingredient.quantity} {ingredient.unit}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Cantidad a crear
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={ingredient.requiredQuantity || 1}
                              onChange={(e) => {
                                const updatedIngredients = [...editRecipeIngredients];
                                updatedIngredients[index].requiredQuantity = parseInt(e.target.value) || 1;
                                setEditRecipeIngredients(updatedIngredients);
                              }}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Stock Disponible
                            </Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {ingredient.availableStock || 0} unidades
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              Cantidad disponible
                            </Label>
                            <div className="mt-1 p-2 bg-white rounded border text-sm">
                              {ingredient.stock || 0} {ingredient.unit}
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Cantidad total necesaria:</span>{" "}
                            {((parseFloat(ingredient.quantity) || 0) * (ingredient.requiredQuantity || 1)).toFixed(2)} {ingredient.unit}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedIngredients = editRecipeIngredients.filter((_, i) => i !== index);
                              setEditRecipeIngredients(updatedIngredients);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={editingProduct?.description || ""}
                onChange={(e) =>
                  setEditingProduct({
                    ...editingProduct!,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción del producto"
              />
          </div>
           </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingProduct(null);
                setOriginalIngredientQuantities({}); // Reset original quantities on cancel
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
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
          {/* <div className="max-h-[60vh] overflow-y-auto">
            <RecipeBuilder
              recipeName={newRecipe.name}
              setRecipeName={(name) => setNewRecipe({ ...newRecipe, name })}
              category={newRecipe.category}
              setCategory={(category) => setNewRecipe({ ...newRecipe, category })}
              ingredients={newRecipe.ingredients}
              setIngredients={(ingredients) => setNewRecipe({ ...newRecipe, ingredients })}
              isLoading={isLoading}
            />
          </div> */}


          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRecipeDialog(false);
                setNewRecipe({ name: "", category: "bebida", ingredients: [] });
                setNewIngredient({
                  name: "",
                  quantity: "",
                  unit: "ml",
                  availableStock: "1",
                });
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
          <div className="max-h-[60vh] overflow-y-auto">
            {/* <RecipeBuilder
              recipeName={newRecipe.name}
              setRecipeName={(name) => setNewRecipe({ ...newRecipe, name })}
              category={newRecipe.category}
              setCategory={(category) => setNewRecipe({ ...newRecipe, category })}
              ingredients={newRecipe.ingredients}
              setIngredients={(ingredients) => setNewRecipe({ ...newRecipe, ingredients })}
              isLoading={isLoading}
            /> */}
          </div>


          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateRecipeDialogEdit(false);
                setNewRecipe({ name: "", category: "bebida", ingredients: [] });
                setNewIngredient({
                  name: "",
                  quantity: "",
                  unit: "ml",
                  availableStock: "1",
                });
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
