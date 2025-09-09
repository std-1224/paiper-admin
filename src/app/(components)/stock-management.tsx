"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Box,
  ChefHat,
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
import RecipeDetailsModal from "./recipe-details-modal";
import IngredientDetailsModal from "./ingredient-details-modal";
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string; type?: string; recipe_id?: string; ingredient_id?: string } | null>(null);
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

  // Enhanced edit modal selection states (matching add product modal)
  const [editSelectedItemForPreview, setEditSelectedItemForPreview] = useState<string>('');
  const [editSelectedItemType, setEditSelectedItemType] = useState<'recipe' | 'ingredient' | null>(null);
  const [editAddedIngredientsList, setEditAddedIngredientsList] = useState<any[]>([]);
  const [editAddedRecipesList, setEditAddedRecipesList] = useState<any[]>([]);
  const [editQuantityToCreate, setEditQuantityToCreate] = useState<number>(1);
  const [editCustomQuantityPerUnit, setEditCustomQuantityPerUnit] = useState<number>(0);
  const [editIngredientUnit, setEditIngredientUnit] = useState<string>("ml");
  const [editIngredientRequiredQuantity, setEditIngredientRequiredQuantity] =
    useState<number>(1);

  const [selectedProductForHistory, setSelectedProductForHistory] =
    useState<Product | null>(null);
  const [isRecipeDetailsModalOpen, setIsRecipeDetailsModalOpen] = useState(false);
  const [isIngredientDetailsModalOpen, setIsIngredientDetailsModalOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("");
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

  // Function to calculate recipe purchase price based on ingredients
  const calculateRecipePurchasePrice = (recipe: any) => {
    if (!recipe.recipe_ingredients || !Array.isArray(recipe.recipe_ingredients)) {
      return 0;
    }

    let totalPrice = 0;
    recipe.recipe_ingredients.forEach((recipeIngredient: any) => {
      const ingredient = recipeIngredient.ingredients;
      if (ingredient && ingredient.purchase_price && ingredient.quantity && recipeIngredient.deduct_quantity) {
        // Calculate price per unit: ingredient.purchase_price / ingredient.quantity
        const pricePerUnit = ingredient.purchase_price / ingredient.quantity;
        // Calculate total cost for this ingredient: pricePerUnit * quantity used in recipe
        const ingredientCost = pricePerUnit * recipeIngredient.deduct_quantity;
        totalPrice += ingredientCost;
      }
    });

    return totalPrice;
  };

  // Function to calculate ingredient purchase price based on recipe ingredients (for compound ingredients)
  const calculateIngredientPurchasePrice = (ingredient: any) => {
    if (!ingredient.recipe_ingredients || !Array.isArray(ingredient.recipe_ingredients)) {
      return ingredient.purchase_price || 0;
    }

    // If ingredient has recipe ingredients, calculate based on components
    let totalPrice = 0;
    ingredient.recipe_ingredients.forEach((recipeIngredient: any) => {
      const subIngredient = recipeIngredient.ingredients;
      if (subIngredient && subIngredient.purchase_price && subIngredient.quantity && recipeIngredient.deduct_quantity) {
        // Calculate price per unit: subIngredient.purchase_price / subIngredient.quantity
        const pricePerUnit = subIngredient.purchase_price / subIngredient.quantity;
        // Calculate total cost for this sub-ingredient: pricePerUnit * quantity used
        const subIngredientCost = pricePerUnit * recipeIngredient.deduct_quantity;
        totalPrice += subIngredientCost;
      }
    });

    return totalPrice > 0 ? totalPrice : (ingredient.purchase_price || 0);
  };

  // State to store product data for recipes and ingredients
  const [recipeProducts, setRecipeProducts] = useState<{[key: string]: any}>({});
  const [ingredientProducts, setIngredientProducts] = useState<{[key: string]: any}>({});

  // Function to fetch product data for a recipe
  const fetchRecipeProduct = async (recipeId: string) => {
    if (recipeProducts[recipeId]) return recipeProducts[recipeId];

    try {
      const response = await fetch(`/api/products/by-recipe/${recipeId}`);
      if (response.ok) {
        const productData = await response.json();
        setRecipeProducts(prev => ({ ...prev, [recipeId]: productData }));
        return productData;
      }
    } catch (error) {
      console.error('Error fetching recipe product:', error);
    }
    return null;
  };

  // Function to fetch product data for an ingredient
  const fetchIngredientProduct = async (ingredientId: string) => {
    if (ingredientProducts[ingredientId]) return ingredientProducts[ingredientId];

    try {
      const response = await fetch(`/api/products/by-ingredient/${ingredientId}`);
      if (response.ok) {
        const productData = await response.json();
        setIngredientProducts(prev => ({ ...prev, [ingredientId]: productData }));
        return productData;
      }
    } catch (error) {
      console.error('Error fetching ingredient product:', error);
    }
    return null;
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

  // Fetch product data for active recipes and ingredients
  useEffect(() => {
    const fetchProductData = async () => {
      // Fetch product data for active recipes
      for (const recipe of normalizedRecipesData) {
        if (recipe.is_active) {
          await fetchRecipeProduct(recipe.id);
        }
      }

      // Fetch product data for active ingredients
      for (const ingredient of ingredientsData) {
        if (ingredient.is_active) {
          await fetchIngredientProduct(ingredient.id);
        }
      }
    };

    if (normalizedRecipesData.length > 0 || ingredientsData.length > 0) {
      fetchProductData();
    }
  }, [normalizedRecipesData, ingredientsData]);

  // Validate stock whenever recipe ingredients change
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      // validateIngredientStock();
    }
  }, [recipeIngredients]);

  // Clear transfer logs function
  const handleClearTransferLogs = () => {
    // if (user?.role === "barman" || user?.role === "client") {
    //   toast.error("No tienes permiso para limpiar registros");
    //   return;
    // }
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

      // Also refresh recipes data in background for consistency
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
  };

  // Enhanced edit modal helper functions (matching add product modal)
  const handleEditItemSelection = (value: string) => {
    setEditSelectedItemForPreview(value);

    if (value === "no-selection" || !value) {
      setEditSelectedItemType(null);
      return;
    }

    // Check if it's a recipe or an ingredient
    const selectedRecipe = normalizedRecipesData.find(recipe => recipe.id === value);
    const selectedIngredient = ingredientsData.find(ingredient => ingredient.id === value);

    if (selectedRecipe) {
      setEditSelectedItemType('recipe');
    } else if (selectedIngredient) {
      setEditSelectedItemType('ingredient');
    }
  };

  // Add ingredient to the edit list
  const addEditIngredientToList = () => {
    const selectedIngredient = ingredientsData.find(ing => ing.id === editSelectedItemForPreview);
    if (selectedIngredient && !editAddedIngredientsList.find(item => item.id === selectedIngredient.id)) {
      const quantityToUse = editCustomQuantityPerUnit || selectedIngredient.quantity;

      // Calculate deduction logic: amount per unit / per unit
      const deductStock = Math.floor(quantityToUse / selectedIngredient.quantity);
      const deductQuantity = quantityToUse % selectedIngredient.quantity;

      const newIngredient = {
        ...selectedIngredient,
        customQuantityPerUnit: quantityToUse,
        deduct_stock: deductStock,
        deduct_quantity: deductQuantity,
        totalQuantityNeeded: quantityToUse
      };
      setEditAddedIngredientsList([...editAddedIngredientsList, newIngredient]);
      setEditSelectedItemForPreview('');
      setEditSelectedItemType(null);
      setEditCustomQuantityPerUnit(0);
    }
  };

  // Add recipe to the edit list
  const addEditRecipeToList = () => {
    const selectedRecipe = normalizedRecipesData.find(recipe => recipe.id === editSelectedItemForPreview);
    if (selectedRecipe && !editAddedRecipesList.find(item => item.id === selectedRecipe.id)) {
      const newRecipe = {
        ...selectedRecipe,
        quantityToUse: editQuantityToCreate
      };
      setEditAddedRecipesList([...editAddedRecipesList, newRecipe]);
      setEditSelectedItemForPreview('');
      setEditSelectedItemType(null);
      setEditQuantityToCreate(1);
    }
  };

  // Remove ingredient from edit list
  const removeEditIngredientFromList = (ingredientId: string) => {
    setEditAddedIngredientsList(editAddedIngredientsList.filter(item => item.id !== ingredientId));
  };

  // Remove recipe from edit list
  const removeEditRecipeFromList = (recipeId: string) => {
    setEditAddedRecipesList(editAddedRecipesList.filter(item => item.id !== recipeId));
  };

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
        console.error("No matching recipe found for these ingredients");
        return;
      }

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
          requiredQuantity: editIngredientRequiredQuantity,
          availableStock: createdRecipe.stock || 1,
          stock: createdRecipe.stock || 1,
        })
      );

      // Set the recipe selection and ingredients in the correct order
      setEditRecipeIngredients(processedIngredients);
      setSelectedEditRecipeId(createdRecipe.id.toString());

      // Force a state update to ensure UI re-renders
      const updatedProduct = {
        ...editingProduct!,
        has_recipe: true,
        ingredients: JSON.stringify(newRecipe.ingredients),
      };
      setEditingProduct(updatedProduct);


      // Force a re-render by updating a dummy state
      // This ensures React processes all state updates
      setTimeout(() => {
        // Force component re-render if needed
        if (editRecipeIngredients.length === 0) {
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
      console.error("Error creating recipe:", error);
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
    // Combine productsData, normalizedRecipesData, and ingredientsData, but avoid duplicates by ID
    const seenIds = new Set();
    const allItems: any[] = [];
    // Add all products first
    productsData.forEach((item) => {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allItems.push(item);
      }
    });

    // Add normalized recipes data that aren't already added
    // Only show active recipes in the menu/stock management component
    normalizedRecipesData
      .filter((item) => item.is_active === true)
      .forEach((item) => {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          allItems.push({
            ...item,
            type: "recipe" // Ensure type is set for consistency
          });
        }
      });

    // Add ingredients from ingredientsData that aren't already added
    // Only show active ingredients that don't have a product_id (standalone ingredients)
    ingredientsData
      .filter((item) => item.is_active === true && !item.product_id)
      .forEach((item) => {
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
  }, [productsData, normalizedRecipesData, ingredientsData, searchTerm, filter, salesFilter]);

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
  // Determine item type and get appropriate deletion info
  const determineItemTypeAndDeletionInfo = (item: {
    id: string;
    name: string;
    type?: string;
    recipe_id?: string;
    ingredient_id?: string;
  }) => {
    // Check if it's a recipe (has recipe_id or is from recipes data)
    if (item.recipe_id || normalizedRecipesData.find(r => r.id === item.id)) {
      return {
        type: 'recipe',
        apiEndpoint: '/api/recipes',
        itemName: item.name,
        confirmationMessage: 'Esta receta y todos sus ingredientes asociados serán eliminados.'
      };
    }

    // Check if it's an ingredient (has ingredient_id or is from ingredients data)
    if (item.ingredient_id || ingredientsData.find(i => i.id === item.id)) {
      return {
        type: 'ingredient',
        apiEndpoint: '/api/ingredients',
        itemName: item.name,
        confirmationMessage: 'Este ingrediente y todas las recetas que lo usan serán eliminados.'
      };
    }

    // Check if it's an ingredient-type product
    if (item.type === 'ingredient') {
      return {
        type: 'ingredient-type-product',
        apiEndpoint: '/api/products',
        itemName: item.name,
        confirmationMessage: 'Este producto de tipo ingrediente y su ingrediente asociado serán eliminados.'
      };
    }

    // Default to regular product
    return {
      type: 'product',
      apiEndpoint: '/api/products',
      itemName: item.name,
      confirmationMessage: 'Este producto será eliminado del inventario.'
    };
  };

  // Handle opening delete confirmation
  const handleDeleteClick = (item: { id: string; name: string; type?: string; recipe_id?: string; ingredient_id?: string }) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  // API operations - Smart deletion based on item type
  const handleConfirmDelete = async () => {
    if (!itemToDelete?.id) return;

    try {
      setIsDeleting(true);

      // Determine what type of item we're deleting
      const deletionInfo = determineItemTypeAndDeletionInfo(itemToDelete);
      const id = itemToDelete.id;

      console.log(`Deleting ${deletionInfo.type}: ${deletionInfo.itemName} (ID: ${id})`);

      // Call the appropriate API endpoint
      let response;
      if (deletionInfo.type === 'recipe') {
        response = await fetch(`${deletionInfo.apiEndpoint}?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } else if (deletionInfo.type === 'ingredient') {
        response = await fetch(`${deletionInfo.apiEndpoint}?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } else {
        // For products (including ingredient-type products)
        response = await fetch(deletionInfo.apiEndpoint, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific conflict errors (409) with detailed messages
        if (response.status === 409) {
          const errorMessage = errorData.details || errorData.error || `No se puede eliminar ${deletionInfo.type}`;
          const suggestion = errorData.suggestion || '';
          const references = errorData.references || [];

          let fullMessage = errorMessage;
          if (references.length > 0) {
            fullMessage += '\n\nRazones:\n• ' + references.join('\n• ');
          }
          if (suggestion) {
            fullMessage += '\n\n' + suggestion;
          }

          throw new Error(fullMessage);
        }

        throw new Error(errorData.error || `Failed to delete ${deletionInfo.type}`);
      }

      const result = await response.json();

      // Refresh all related data
      fetchProducts();
      fetchIngredients();
      fetchNormalizedRecipes();

      // Show appropriate success message based on deletion type
      let successMessage = '';
      switch (deletionInfo.type) {
        case 'recipe':
          successMessage = `Receta "${deletionInfo.itemName}" marcada como eliminada exitosamente.`;
          if (result.softDeletedItems) {
            if (result.softDeletedItems.products > 0) {
              successMessage += ` También se marcaron como eliminados ${result.softDeletedItems.products} productos asociados.`;
            }
            if (result.softDeletedItems.recipeIngredients > 0) {
              successMessage += ` Se marcaron como eliminadas ${result.softDeletedItems.recipeIngredients} relaciones de ingredientes.`;
            }
          }
          break;

        case 'ingredient':
          successMessage = `Ingrediente "${deletionInfo.itemName}" marcado como eliminado exitosamente.`;
          if (result.softDeletedItems) {
            if (result.softDeletedItems.products > 0) {
              successMessage += ` También se marcaron como eliminados ${result.softDeletedItems.products} productos asociados.`;
            }
            if (result.softDeletedItems.recipeIngredients > 0) {
              successMessage += ` Se marcaron como eliminadas ${result.softDeletedItems.recipeIngredients} relaciones de recetas.`;
            }
          }
          break;

        case 'ingredient-type-product':
          successMessage = `Producto de ingrediente "${deletionInfo.itemName}" eliminado exitosamente.`;
          if (result.deletedProduct?.ingredientDeleted) {
            successMessage += ` También se eliminó el ingrediente asociado.`;
          }
          break;

        default:
          successMessage = `Producto "${deletionInfo.itemName}" marcado como eliminado exitosamente.`;
          if (result.softDeletedItems) {
            if (result.softDeletedItems.ingredients > 0) {
              successMessage += ` También se marcaron como eliminados ${result.softDeletedItems.ingredients} ingredientes asociados.`;
            }
            if (result.softDeletedItems.recipes > 0) {
              successMessage += ` Se marcaron como eliminadas ${result.softDeletedItems.recipes} recetas asociadas.`;
            }
            if (result.softDeletedItems.recipeIngredients > 0) {
              successMessage += ` Se marcaron como eliminadas ${result.softDeletedItems.recipeIngredients} relaciones de ingredientes.`;
            }
          }
          break;
      }

      console.log(successMessage);

      // Close dialog
      setDeleteConfirmOpen(false);
      setItemToDelete(null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Error deleting item");
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
      // let totalAmount = null;
      // if (newProduct.type === "ingredient") {
      //   totalAmount = (newProduct.stock || 0) * amountPerUnit;
      // }

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
          // total_amount: totalAmount,
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
    // if (user?.role === "barman" || user?.role === "client") {
    //   toast.error("No tienes permiso para editar productos");
    //   return;
    // }
    try {
      setIsLoading(true);
      let uploadedUrl = editingProduct.image_url;
      if (imageFile) {
        uploadedUrl = (await handleImageUpload()) || editingProduct.image_url;
      }

      // Determine if product has ingredients or recipes (enhanced version)
      const hasIngredients = editAddedIngredientsList.length > 0;
      const hasRecipes = editAddedRecipesList.length > 0;
      const hasAnyIngredients = hasIngredients || hasRecipes;

      // Prepare ingredients data for the product
      let ingredientsData = null;
      if (hasAnyIngredients) {
        // Combine both ingredient and recipe data for the product.ingredients field
        const allIngredients = [
          ...editAddedIngredientsList.map(ing => ({
            name: ing.name,
            quantity: ing.customQuantityPerUnit.toString(),
            unit: ing.unit,
            requiredQuantity: 1,
          })),
          ...editAddedRecipesList.map(recipe => ({
            name: recipe.name,
            quantity: recipe.quantityToUse.toString(),
            unit: "unidades",
            requiredQuantity: 1,
          }))
        ];
        ingredientsData = allIngredients;
      }

      // FIRST: Handle stock deduction BEFORE updating the product
      // This ensures we use the correct data for calculations
      if (
        editingProduct.has_recipe &&
        ingredientsData &&
        Object.keys(originalIngredientQuantities).length > 0
      ) {
        try {
          await deductRecipeIngredientStockDifference(
            ingredientsData,
            originalIngredientQuantities
          );
        } catch (error) {
          console.error("❌ Error processing ingredient changes:", error);
          // Don't fail the entire update if stock deduction fails
          toast.error(
            "Error al actualizar stock de ingredientes, pero el producto se guardará"
          );
        }
      }

      // Calculate total_amount for ingredient-type products
      // let totalAmount = null;
      // if (editingProduct.type === "ingredient") {
      //   totalAmount = (editingProduct.stock || 0) * amountPerUnit;
      // }

      // SECOND: Update the product with new ingredient data
      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
          has_recipe: hasAnyIngredients,
        }),
      });

      if (!response.ok) throw new Error("Failed to update product");

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
                original_quantity: amountPerUnit, // update original_quantity with the edited value
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
                original_quantity: amountPerUnit, // set original_quantity with the edited value
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

      // Update recipe_ingredients table for enhanced ingredients and recipes
      if (hasAnyIngredients || editingProduct.has_recipe) {
        try {
          // First, delete existing recipe_ingredients for this product
          const deleteResponse = await fetch(`/api/recipe-ingredients?product_id=${editingProduct.id}`, {
            method: "DELETE",
          });

          if (!deleteResponse.ok) {
            console.warn("Failed to delete existing recipe ingredients, continuing...");
          }

          // Create recipe_ingredients entries for added individual ingredients
          if (editAddedIngredientsList.length > 0) {
            for (const ingredient of editAddedIngredientsList) {
              const recipeIngredientData = {
                product_id: editingProduct.id,
                recipe_id: null,
                ingredient_id: ingredient.id,
                deduct_stock: ingredient.deduct_stock,
                deduct_quantity: ingredient.deduct_quantity,
              };

              const createResponse = await fetch("/api/recipe-ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recipeIngredientData),
              });

              if (!createResponse.ok) {
                console.error(`Failed to create recipe ingredient for ${ingredient.name}`);
              }
            }
          }

          // Create recipe_ingredients entries for added recipes
          if (editAddedRecipesList.length > 0) {
            for (const recipe of editAddedRecipesList) {
              const recipeIngredientData = {
                product_id: editingProduct.id,
                recipe_id: recipe.id,
                ingredient_id: null,
                deduct_stock: recipe.quantityToUse,
                deduct_quantity: 0,
              };

              const createResponse = await fetch("/api/recipe-ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(recipeIngredientData),
              });

              if (!createResponse.ok) {
                console.error(`Failed to create recipe ingredient for ${recipe.name}`);
              }
            }
          }


        } catch (error) {
          console.error("❌ Error updating recipe_ingredients table:", error);
          // Don't fail the entire update if recipe_ingredients fails
          toast.warning("Producto actualizado, pero hubo un problema con los ingredientes de la receta");
        }
      }

      // Reset edit modal states (enhanced version)
      setEditingProduct(null);
      setImageFile(null);
      setSelectedEditRecipeId("");
      setEditRecipeIngredients([]);
      setEditUseCustomIngredients(false);
      setEditCustomIngredients([]);

      // Reset enhanced edit modal states
      setEditSelectedItemForPreview('');
      setEditSelectedItemType(null);
      setEditAddedIngredientsList([]);
      setEditAddedRecipesList([]);
      setEditQuantityToCreate(1);
      setEditCustomQuantityPerUnit(0);

      setEditCustomIngredientName("");
      setEditIngredientQuantity("");
      setEditIngredientUnit("ml");
      setEditIngredientRequiredQuantity(1);
      setOriginalIngredientQuantities({}); // Reset original quantities

      fetchProducts();
      fetchIngredients(); // Refresh ingredients data to show updated values
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
    const isRecipe = normalizedRecipesData.some(recipe => recipe.id === product.id) || product.type === "recipe";
    const isIngredient = ingredientsData.some(ingredient => ingredient.id === product.id) || product.type === "ingredient";
    const isProduct = !isRecipe && !isIngredient;

    if (isRecipe) {
      setSelectedRecipeId(product.id.toString());
      setIsRecipeDetailsModalOpen(true);
    } else if (isIngredient) {
      setSelectedIngredientId((product as any).id.toString());
      setIsIngredientDetailsModalOpen(true);
    } else {
      // For regular products, show the existing product detail modal
      setCurrentProduct(product);
      setShowProductDetailModal(true);
    }
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
      const isRecipe = item.type === "recipe";
      const isIngredient = ingredientsData.some(ingredient => ingredient.id === item.id) || item.type === "ingredient";
      const isProduct = !isRecipe && !isIngredient;
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
              // if (user?.role === "barman" || user?.role === "client") {
              //   toast.error("No tienes permiso para crear pedidos");
              //   return;
              // }
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
                // if (user?.role === "barman" || user?.role === "client") {
                //   toast.error("No tienes permiso para ajustar stock");
                //   return;
                // }
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
                  // if (user?.role === "barman" || user?.role === "client") {
                  //   toast.error("No tienes permiso para ajustar stock");
                  //   return;
                  // }
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
                  // if (user?.role === "barman" || user?.role === "client") {
                  //   toast.error("No tienes permiso para ajustar stock");
                  //   return;
                  // }
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
                <th className="text-left p-3 font-medium">Precio Producto</th>
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
                : filteredProducts.filter(item => item.is_active === true).map((item) => {
                  const product = item as any; // Cast to access all properties
                  // Check if item is from normalized recipes data
                  const isRecipe = normalizedRecipesData.some(recipe => recipe.id === item.id) || item.type === "recipe";
                  const isIngredient = ingredientsData.some(ingredient => (ingredient.id === item.id));
                  const isProduct = !isRecipe && !isIngredient;

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
                        <span className="text-muted-foreground">
                          {(isProduct || (isIngredient && item.type === "ingredient")) && (
                            <span>${item.sale_price?.toFixed(2) || "0.00"}</span>
                          )}
                          {isRecipe && item.is_active && recipeProducts[item.id] && (
                            <span>${recipeProducts[item.id].sale_price?.toFixed(2) || "0.00"}</span>
                          )}
                          {isIngredient && item.type !== "ingredient" && item.is_active && ingredientProducts[item.id] && (
                            <span>${ingredientProducts[item.id].sale_price?.toFixed(2) || "0.00"}</span>
                          )}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-muted-foreground">
                          {(isProduct || (isIngredient && item.type === "ingredient")) && (
                            <span>${item.purchase_price?.toFixed(2) || "0.00"}</span>
                          )}
                          {isIngredient && item.type !== "ingredient" && (
                            <span>${calculateIngredientPurchasePrice(item).toFixed(2)}</span>
                          )}
                          {isRecipe && (
                            <span>${calculateRecipePurchasePrice(item).toFixed(2)}</span>
                          )}
                        </span>
                      </td>
                      <td className="p-3">
                        {(isProduct || (isIngredient && product.type === "ingredient")) ? (
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
                           {isProduct && (product.type === "product" || (product.type === "ingredient")) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                setEditingProduct(product);

                                // Initialize amountPerUnit for ingredient-type products
                                if (product.type === "ingredient") {
                                  // Find the ingredient by product_id to get original_quantity
                                  const ingredient = ingredientsData.find(ing => ing.product_id === product.id);
                                  setAmountPerUnit(ingredient?.original_quantity || 0);
                                } else {
                                  setAmountPerUnit(0);
                                }

                                // Load ALL ingredients and recipes that this product has (Enhanced Version)
                                try {
                                  let loadedIngredients: any[] = [];
                                  let loadedRecipes: any[] = [];

                                  // 1. Fetch recipe ingredients from recipe_ingredients table
                                  const response = await fetch(`/api/recipe-ingredients?product_id=${product.id}`);
                                  if (response.ok) {
                                    const productRecipeIngredients = await response.json();

                                    if (productRecipeIngredients && productRecipeIngredients.length > 0) {
                                      // Separate individual ingredients from recipes
                                      productRecipeIngredients.forEach((ri: any) => {
                                        if (ri.recipe_id) {
                                          // This is a recipe entry
                                          const recipeData = normalizedRecipesData.find(r => r.id === ri.recipe_id);
                                          if (recipeData) {
                                            loadedRecipes.push({
                                              ...recipeData,
                                              quantityToUse: ri.deduct_stock,
                                              id: ri.recipe_id
                                            });
                                          }
                                        } else if (ri.ingredient_id) {
                                          // This is an individual ingredient entry
                                          const ingredientData = ingredientsData.find(ing => ing.id === ri.ingredient_id);
                                          if (ingredientData) {
                                            loadedIngredients.push({
                                              ...ingredientData,
                                              customQuantityPerUnit: ri.deduct_quantity + (ri.deduct_stock * ingredientData.quantity),
                                              deduct_stock: ri.deduct_stock,
                                              deduct_quantity: ri.deduct_quantity,
                                              totalQuantityNeeded: ri.deduct_quantity + (ri.deduct_stock * ingredientData.quantity),
                                              id: ri.ingredient_id
                                            });
                                          }
                                        }
                                      });
                                    }
                                  }

                                  // 2. Set the loaded ingredients and recipes to the enhanced lists
                                  setEditAddedIngredientsList(loadedIngredients);
                                  setEditAddedRecipesList(loadedRecipes);

                                  // 3. Also check legacy product.ingredients field for backward compatibility
                                  if (product.has_recipe && product.ingredients && loadedIngredients.length === 0 && loadedRecipes.length === 0) {
                                    try {
                                      const storedIngredients = JSON.parse(product.ingredients);
                                      if (storedIngredients && storedIngredients.length > 0) {
                                        // Convert legacy format to new enhanced format
                                        const legacyIngredients = storedIngredients
                                          .filter((ing: any) => ing.productId) // Only custom ingredients
                                          .map((ing: any) => {
                                            const ingredientData = ingredientsData.find(ingData => ingData.id === ing.productId);
                                            if (ingredientData) {
                                              return {
                                                ...ingredientData,
                                                customQuantityPerUnit: parseFloat(ing.quantity),
                                                deduct_stock: Math.floor(parseFloat(ing.quantity) / ingredientData.quantity),
                                                deduct_quantity: parseFloat(ing.quantity) % ingredientData.quantity,
                                                totalQuantityNeeded: parseFloat(ing.quantity),
                                                id: ing.productId
                                              };
                                            }
                                            return null;
                                          })
                                          .filter(Boolean);

                                        setEditAddedIngredientsList(legacyIngredients);
                                        setEditCustomIngredients(storedIngredients); // Keep for backward compatibility
                                      }
                                    } catch (error) {
                                      console.error("Error parsing product.ingredients:", error);
                                    }
                                  }



                                } catch (error) {
                                  console.error("Error loading product ingredients and recipes:", error);
                                  // Reset enhanced states on error
                                  setEditAddedIngredientsList([]);
                                  setEditAddedRecipesList([]);
                                  setEditRecipeIngredients([]);
                                  setEditUseCustomIngredients(false);
                                  setEditCustomIngredients([]);
                                  setSelectedEditRecipeId("");
                                }

                                // Reset enhanced edit modal states
                                setEditSelectedItemForPreview('');
                                setEditSelectedItemType(null);
                                setEditQuantityToCreate(1);
                                setEditCustomQuantityPerUnit(0);
                                setEditCustomIngredientName("");
                                setEditIngredientQuantity("");
                                setEditIngredientUnit("ml");
                                setEditIngredientRequiredQuantity(1);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {isRecipe && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedRecipeId(product.id);
                                setIsRecipeDetailsModalOpen(true);
                              }}
                              title="Ver detalles de la receta"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {isIngredient && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedIngredientId(product.id);
                                setIsIngredientDetailsModalOpen(true);
                              }}
                              title="Ver detalles del ingrediente"
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
                                      handleDeleteClick(product)
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
                          {currentProduct.sale_price ? (
                            `$${currentProduct.sale_price}`
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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

                {/* Note: Liquid property is set on ingredients, not products */}
                
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
                          Cantidad por unidad (ml)
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
                          <span className="ml-2 font-medium">{amountPerUnit} ml</span>
                        </div>
                      </div>
                     <div className="pt-2 border-t border-blue-200 flex justify-between">
                          <span className="text-blue-900 font-semibold">
                            Stock: {editingProduct?.stock || 0}
                          </span>
                          <span className="text-blue-900 font-semibold">
                            Per Unit: {amountPerUnit}
                          </span>
                        </div>
                      <p className="text-xs text-blue-700">
                        Este valor se guardará como total_amount en la base de datos
                      </p>
                    </div>
                  </div>
                )}

                {/* Removed liquid product logic - handled by ingredient creation */}
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

      {/* Enhanced Edit Product Modal */}
      <Dialog
        open={!!editingProduct}
        onOpenChange={() => {
          setEditingProduct(null);
          setOriginalIngredientQuantities({});
          // Reset edit modal states
          setEditCustomIngredients([]);
          setEditRecipeIngredients([]);
          setSelectedEditRecipeId("");
          setEditUseCustomIngredients(false);
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
                  placeholder="Nombre del producto"
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
                    {categoryList.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-purchase-price">Precio de Compra</Label>
                <Input
                  id="edit-purchase-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct?.purchase_price || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      purchase_price: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sale-price">Precio de Venta</Label>
                <Input
                  id="edit-sale-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editingProduct?.sale_price || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      sale_price: e.target.value === "" ? 0 : parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Product Configuration - Hide when product has recipe */}
            {!editingProduct?.has_recipe && (
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
                      });

                      // Clear recipe/ingredient selections when enabling ingredient mode
                      if (checked) {
                        setEditCustomIngredients([]);
                        setEditRecipeIngredients([]);
                        setSelectedEditRecipeId("");
                        setEditUseCustomIngredients(false);
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
                          Cantidad por unidad (ml)
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

                      <div className="pt-2 border-t border-blue-200">
                        <div className="pt-2 border-t border-blue-200 flex justify-between">
                          <span className="text-blue-900 font-semibold">
                            Stock: {editingProduct?.stock || 0}
                          </span>
                          <span className="text-blue-900 font-semibold">
                            Per Unit: {amountPerUnit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Compact Added Ingredients List */}
            {editAddedIngredientsList.length > 0 && (
              <div className="border rounded-lg p-3 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-medium text-emerald-900">Ingredientes Agregados</h4>
                  <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
                    {editAddedIngredientsList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {editAddedIngredientsList.map((ingredient, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border group hover:bg-emerald-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{ingredient.name}</span>
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                            {ingredient.totalQuantityNeeded} {ingredient.unit}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span>Por unidad: {ingredient.customQuantityPerUnit} {ingredient.unit}</span>
                          <span>Stock: {ingredient.deduct_stock}</span>
                          <span>Cantidad: {ingredient.deduct_quantity} {ingredient.unit}</span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEditIngredientFromList(ingredient.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Added Recipes List */}
            {editAddedRecipesList.length > 0 && (
              <div className="border rounded-lg p-3 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <ChefHat className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Recetas Agregadas</h4>
                  <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 text-xs">
                    {editAddedRecipesList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {editAddedRecipesList.map((recipe, index) => (
                    <div key={index} className="bg-white p-2 rounded border group hover:bg-blue-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{recipe.name}</span>
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                            {recipe.quantityToUse} unidades
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEditRecipeFromList(recipe.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-800 h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      {recipe.recipe_ingredients && recipe.recipe_ingredients.length > 0 && (
                        <div className="text-xs text-gray-600">
                          <div className="flex flex-wrap gap-2">
                            {recipe.recipe_ingredients.map((ri: any, riIndex: number) => {
                              const ingredientDetails = ingredientsData.find(ing => ing.id === ri.ingredient_id);
                              return (
                                <span key={riIndex} className="bg-gray-100 px-2 py-1 rounded">
                                  {ingredientDetails?.name || ri.ingredient_name}: {ri.deduct_quantity * recipe.quantityToUse} {ingredientDetails?.unit || ri.ingredient_unit}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Summary Section */}
            {(editAddedIngredientsList.length > 0 || editAddedRecipesList.length > 0) && (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-gray-600" />
                  <h4 className="font-medium text-gray-900 text-sm">Resumen de Actualización</h4>
                </div>
                <div className="text-xs text-gray-600 space-y-2">
                  <div className="flex gap-4">
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3 text-emerald-600" />
                      <strong>Ingredientes:</strong> {editAddedIngredientsList.length}
                    </span>
                    <span className="flex items-center gap-1">
                      <ChefHat className="h-3 w-3 text-blue-600" />
                      <strong>Recetas:</strong> {editAddedRecipesList.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

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

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        isOpen={isRecipeDetailsModalOpen}
        onClose={() => {
          setIsRecipeDetailsModalOpen(false);
          setSelectedRecipeId("");
        }}
        recipeId={selectedRecipeId}
        onEditRecipe={(id) => {
          // Handle recipe editing - could navigate to recipe configuration
          console.log("Edit recipe:", id);
          setIsRecipeDetailsModalOpen(false);
          setSelectedRecipeId("");
        }}
      />

      {/* Ingredient Details Modal */}
      <IngredientDetailsModal
        isOpen={isIngredientDetailsModalOpen}
        onClose={() => {
          setIsIngredientDetailsModalOpen(false);
          setSelectedIngredientId("");
        }}
        ingredientId={selectedIngredientId}
        onEditIngredient={(id) => {
          // Handle ingredient editing - could navigate to ingredient configuration
          console.log("Edit ingredient:", id);
          setIsIngredientDetailsModalOpen(false);
          setSelectedIngredientId("");
        }}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              {(() => {
                if (!itemToDelete) return null;

                const deletionInfo = determineItemTypeAndDeletionInfo(itemToDelete);

                return (
                  <>
                    ¿Estás seguro de que deseas eliminar {deletionInfo.type === 'recipe' ? 'la receta' : deletionInfo.type === 'ingredient' ? 'el ingrediente' : 'el producto'} &quot;
                    {itemToDelete.name}&quot;?
                    <br />
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-yellow-800 font-medium text-sm">
                        ⚠️ {deletionInfo.confirmationMessage}
                      </span>
                    </div>
                    <span className="text-red-600 font-medium">
                      Esta acción no se puede deshacer y eliminará permanentemente el elemento y todos sus datos asociados.
                    </span>
                  </>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setItemToDelete(null);
              }}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar {itemToDelete?.type === 'recipe' ? 'Receta' : itemToDelete?.type === 'ingredient' ? 'Ingrediente' : 'Producto'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
