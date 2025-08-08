"use client";

import { useEffect, useState, useRef } from "react";
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
import {
  StockAdjustmentHistory,
  StockAdjustmentHistoryRef,
} from "@/components/stock/StockAdjustmentHistory";
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
  X,
} from "lucide-react";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { useAppContext } from "@/context/AppContext";
import { InventoryData, Product } from "@/types/types";
import { Switch } from "@/components/ui/switch";
import ImageUpload from "../(components)/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { categoryList } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

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
  const adjustmentHistoryRef = useRef<StockAdjustmentHistoryRef>(null);
  const [selectedBar, setSelectedBar] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("stock");
  const [assignStockDialogOpen, setAssignStockDialogOpen] = useState(false);
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

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [multipleTransferOpen, setMultipleTransferOpen] = useState(false);
  const [selectedStockItems, setSelectedStockItems] = useState<string[]>([]);
  const { user } = useAuth()
  const [showCreateRecipeDialog, setShowCreateRecipeDialog] = useState(false);
  const { recipesData, fetchRecipes } = useAppContext();
  // Fetch recipes on component mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  // Recipe ingredient states for product modal
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [recipeIngredients, setRecipeIngredients] = useState<
    {
      name: string;
      productId?: string | null;
      // Standard Ingredient fields
      quantity?: string;
      unit?: string;
      from_available_stock?: number;
      deduct_stock?: number;
      stock?: number;
      // Product Ingredient fields
      from_total_amount?: number;
      deduct_amount?: number;
      // Custom Ingredient fields
      amount?: string;
      // Type flags
      isStandardIngredient?: boolean;
      isProductIngredient?: boolean;
      // Legacy fields for compatibility
      requiredQuantity?: number;
      availableStock?: number;
    }[]
  >([]);
  const [ingredientRequiredQuantity, setIngredientRequiredQuantity] =
    useState<number>(1);
  // const [stockValidationErrors, setStockValidationErrors] = useState<string[]>([]);

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

  // Recipe creation states
  const [newRecipe, setNewRecipe] = useState({
    name: "",
    category: "bebida",
    ingredients: [] as { name: string; quantity: string; unit: string }[],
  });

  // Custom ingredient creation for recipe ingredients list
  const [showCustomIngredientForm, setShowCustomIngredientForm] = useState(false);
  const [customIngredientForm, setCustomIngredientForm] = useState({
    name: "",
    amount: "",
    unit: "ml",
    stock: ""
  });
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "ml",
  });
  // const [ingredientValidation, setIngredientValidation] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { uploadImageToSupabase } = useAppContext();
  const [showUnredeemed, setShowUnredeemed] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null
  );
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
    (total, product) => total + product.purchase_price * product.stock,
    0
  );

  // Calculate total sale value
  const totalSaleValue = productsData.reduce(
    (total, product) => total + product.sale_price * product.stock,
    0
  );

  // Calculate transfers from stock movements
  const totalTransfers = stocksData.filter(
    (item) => item.status === "transferred" || item.status === "in_transit"
  ).length;

  // Calculate low stock items (items with stock below 10)
  const lowStockItems = productsData.filter(
    (product) => product.stock < 10 && product.stock > 0
  ).length;

  // Calculate out of stock items
  const outOfStockItems = productsData.filter(
    (product) => product.stock === 0
  ).length;

  // Calculate pending items from stock data
  const pendingItems = stocksData.filter(
    (item) => item.status === "pending" || item.status === "unredeemed"
  ).length;

  // Calculate total products count
  const totalProducts = productsData.length;

  // Calculate average stock per product
  const averageStock =
    totalProducts > 0 ? Math.round(totalStock / totalProducts) : 0;

  useEffect(() => {
    fetchStocksOfBar();
    fetchProducts();
    fetchBars();
  }, [fetchBars, fetchProducts, fetchStocksOfBar]);

  // Validate stock whenever recipe ingredients change
  useEffect(() => {
    if (recipeIngredients.length > 0) {
      // validateIngredientStock();
    }
  }, [recipeIngredients]);

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

      // Validate custom ingredients if they are being used
      if (useCustomIngredients && customIngredients.length > 0) {
        for (const ingredient of customIngredients) {
          const requiredQuantity =
            parseFloat(ingredient.quantity) * (newProduct.stock || 1);
          const matchingProduct = productsData.find(
            (p) => p.id === ingredient.productId
          );

          if (matchingProduct && matchingProduct.stock < requiredQuantity) {
            toast.error(
              `Stock insuficiente para ${ingredient.name}: Requerido ${requiredQuantity}, Disponible ${matchingProduct.stock}`
            );
            setIsLoading(false);
            return;
          }
        }
      }

      const uploadedUrl = await handleImageUpload();

      // Prepare ingredients data
      let ingredientsData: any = null;
      if (newProduct.has_recipe && recipeIngredients.length > 0) {
        // Map recipeIngredients to the proper format for product ingredients
        ingredientsData = recipeIngredients.map((ing) => {
          if (ing.isProductIngredient) {
            // Product ingredient format - deduct from total_amount
            const deductAmount = ing.requiredQuantity || 1;
            const updatedTotalAmount = (ing.deduct_amount || 0) - deductAmount;

            return {
              productId: ing.productId,
              name: ing.name,
              from_total_amount: updatedTotalAmount, // Updated amount after deduction
              deduct_amount: deductAmount, // Amount that was deducted
              unit: ing.unit,
              isProductIngredient: true,
              isStandardIngredient: false
            };
          } else if (ing.isStandardIngredient) {
            // Standard ingredient format - deduct_stock should be requiredQuantity
            // from_available_stock should be the actual available amount after deduction
            const deductAmount = ing.requiredQuantity || 1;
            const actualAvailableStock = (ing.deduct_stock || 1);

            return {
              productId: ing.productId,
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              from_available_stock: actualAvailableStock - deductAmount, // Updated stock after deduction
              deduct_stock: deductAmount, // Amount that was deducted
              stock: deductAmount, // Required quantity for this product
              isProductIngredient: false,
              isStandardIngredient: true
            };
          } else {
            const deductAmount = ing.requiredQuantity || 1;
            // Custom ingredient format - stock should be requiredQuantity for deduction
            return {
              productId: null,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
              stock: ing.requiredQuantity || 1, // Use requiredQuantity as stock for deduction
              isProductIngredient: false,
              isStandardIngredient: false,
              from_available_stock: (ing.stock || 1) - deductAmount, // Not applicable for custom ingredients
              deduct_stock: deductAmount, // Not applicable for custom ingredients
            };
          }
        });

        const selectedRecipe = recipesData.find(
          (recipe) => recipe.id.toString() === selectedRecipeId
        );
        if (selectedRecipe && selectedRecipe.ingredients) {
          // Recipe-type Product
          const updatedIngredients = selectedRecipe.ingredients.map((recipeIng) => {
            const matchingIng = ingredientsData.find((ing: any) => ing.name === recipeIng.name);

            if (!matchingIng) return recipeIng;

            if (matchingIng.isProductIngredient) {
              return {
                ...recipeIng,
                deduct_amount: matchingIng.from_total_amount,
              };
            } else if (matchingIng.isStandardIngredient) {
              return {
                ...recipeIng,
                deduct_stock: matchingIng.from_available_stock,
              };
            } else {
              return {
                ...recipeIng,
                stock: matchingIng.stock,
              };
            }
          });

          selectedRecipe.ingredients = updatedIngredients;
          try {
            const response = await fetch(`/api/recipe`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...selectedRecipe,
                amount: selectedRecipe?.stock,
                ingredients: selectedRecipe?.ingredients,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`❌ Failed to update recipe ingredients:`, errorData);
              throw new Error(`Failed to update recipe: ${errorData.error || 'Unknown error'}`);
            }
            // Refresh recipes data to show updated amounts
            await fetchRecipes();
          } catch (error) {
            console.error("❌ Error updating recipe ingredients:", error);
          }
        } else if (selectedRecipe && !selectedRecipe.ingredients && !selectedRecipe?.total_amount) {
          // Ingredient-type Product
          const temp = ingredientsData.find((ing: any) => ing.name === selectedRecipe.name);
          const updatedRecipe = { ...selectedRecipe, stock: temp.from_available_stock };
          try {
            const response = await fetch(`/api/recipe`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...updatedRecipe,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`❌ Failed to update recipe ingredients:`, errorData);
              throw new Error(`Failed to update recipe: ${errorData.error || 'Unknown error'}`);
            }
            // Refresh recipes data to show updated amounts
            await fetchRecipes();
          } catch (error) {
            console.error("❌ Error updating recipe ingredients:", error);
          }
        } else if (selectedRecipe && !selectedRecipe.ingredients && selectedRecipe?.total_amount) {
          const temp = ingredientsData.find((ing: any) => ing.name === selectedRecipe.name);
          // Liquid-type Product
          const updatedRecipe = { ...selectedRecipe, stock: temp.from_available_stock};
          try {
            const response = await fetch(`/api/recipe`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...updatedRecipe,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`❌ Failed to update recipe ingredients:`, errorData);
              throw new Error(`Failed to update recipe: ${errorData.error || 'Unknown error'}`);
            }
            // Refresh recipes data to show updated amounts
            await fetchRecipes();
          } catch (error) {
            console.error("❌ Error updating recipe ingredients:", error);
          }
        }
      }

      // Prepare product data
      const productData = {
        ...newProduct,
        image_url: uploadedUrl,
        updated_at: new Date().toISOString(),
        has_recipe:
          (newProduct.has_recipe && recipeIngredients.length > 0) ||
          (useCustomIngredients && customIngredients.length > 0) ||
          (ingredientsData && ingredientsData.length > 0), // Include ingredient-type products
        ingredients: ingredientsData ? JSON.stringify(ingredientsData) : null,
        total_amount: newProduct.is_liquid ?? newProduct.total_amount,
      };

      const response = await fetch(`/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add product");
      }

      toast.success("Producto creado exitosamente");
      setShowAddProductModal(false);
      resetProductModal();
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err);
      toast.error(err instanceof Error ? err.message : "Error adding product");
    } finally {
      setIsLoading(false);
    }
  };

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

  // Recipe handling functions
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
      // For individual ingredients, add them to the ingredient list
      // Extract unit and conversion factor from description
      const unit = extractUnitFromDescription(selectedIngredient.description || "");
      const conversionFactor = extractConversionFromDescription(selectedIngredient.description || "");

      // Create ingredient object for the list
      const ingredientForList = {
        productId: selectedIngredient.id,
        name: selectedIngredient.name,
        quantity: conversionFactor.toString(),
        unit: unit,
        isStandardIngredient: true,
        isProductIngredient: false,
        requiredQuantity: 1,
        deduct_stock: selectedIngredient.stock || 0,
        from_available_stock: selectedIngredient.stock || 0,
        availableStock: selectedIngredient.stock || 0
      };

      setRecipeIngredients([ingredientForList]);
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

    // Set recipe ingredients with proper field structure (same as editing modal)
    const ingredientsWithStock = ingredients.map((ingredient: any) => {
      return {
        ...ingredient,
        // Keep all original fields from the recipe
        productId: ingredient.productId,
        name: ingredient.name,
        // For standard ingredients
        quantity: ingredient.quantity,
        unit: ingredient.unit,
        from_available_stock: ingredient.from_available_stock,
        deduct_stock: ingredient.deduct_stock,
        stock: ingredient.stock,
        // For product ingredients
        from_total_amount: ingredient.from_total_amount,
        deduct_amount: ingredient.deduct_amount,
        // Type flags
        isProductIngredient: ingredient.isProductIngredient,
        isStandardIngredient: ingredient.isStandardIngredient,
        // Legacy fields for compatibility
        requiredQuantity: 1, // Default quantity, user can modify
        availableStock: ingredient.isStandardIngredient ? ingredient.from_available_stock : ingredient.from_total_amount,
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

  // Add custom ingredient to recipe ingredients list
  const handleAddCustomIngredientToList = () => {
    if (!customIngredientForm.name || !customIngredientForm.amount || !customIngredientForm.stock) {
      return;
    }

    const customIngredient = {
      productId: null,
      name: customIngredientForm.name,
      amount: customIngredientForm.amount,
      unit: customIngredientForm.unit,
      stock: parseInt(customIngredientForm.stock),
      isProductIngredient: false,
      isStandardIngredient: false,
      requiredQuantity: 1
    };

    setRecipeIngredients([...recipeIngredients, customIngredient]);

    // Reset form
    setCustomIngredientForm({
      name: "",
      amount: "",
      unit: "ml",
      stock: ""
    });
    setShowCustomIngredientForm(false);
  };

  // Remove ingredient from recipe ingredients list
  const removeIngredientFromList = (index: number) => {
    const updatedIngredients = recipeIngredients.filter((_, i) => i !== index);
    setRecipeIngredients(updatedIngredients);
  };

  // Recipe creation functions
  const handleAddIngredientToRecipe = () => {
    if (!newIngredient.name || !newIngredient.quantity) return;

    setNewRecipe({
      ...newRecipe,
      ingredients: [...newRecipe.ingredients, { ...newIngredient }],
    });

    setNewIngredient({
      name: "",
      quantity: "",
      unit: "ml",
    });
  };

  const handleRemoveIngredientFromRecipe = (index: number) => {
    setNewRecipe({
      ...newRecipe,
      ingredients: newRecipe.ingredients.filter((_, i) => i !== index),
    });
  };

  const handleCreateRecipe = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRecipe.name,
          ingredients: JSON.stringify(newRecipe.ingredients),
          amount: 1,
          category: newRecipe.category,
        }),
      });

      if (!response.ok) throw new Error("Failed to create recipe");

      const createdRecipe = await response.json();

      // Auto-select the newly created recipe
      setSelectedRecipeId(createdRecipe.id.toString());
      setNewProduct({
        ...newProduct,
        has_recipe: true,
      });

      // Set recipe ingredients with recipe stock as available stock
      const ingredientsWithStock = newRecipe.ingredients.map(
        (ingredient: any) => {
          return {
            ...ingredient,
            requiredQuantity: 1, // Default quantity, user can modify
            availableStock: createdRecipe.stock || 1, // Use recipe stock as available stock
            stock: createdRecipe.stock || 1, // Recipe stock
          };
        }
      );
      setRecipeIngredients(ingredientsWithStock);

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

  const resetProductModal = () => {
    setNewProduct({
      name: "",
      description: "",
      category: "",
      stock: 0,
      image_url: "",
      purchase_price: 0,
      sale_price: 0,
      has_recipe: false,
      type: "product",
      is_liquid: false,
    });
    setAmountPerUnit(0);
    setSelectedRecipeId("");
    setRecipeIngredients([]);
    setUseCustomIngredients(false);
    setCustomIngredients([]);
    setSelectedIngredient("none");
    setCustomIngredientName("");
    setIngredientQuantity("");
    setIngredientUnit("ml");
    setImageFile(null);
    // Reset custom ingredient form
    setShowCustomIngredientForm(false);
    setCustomIngredientForm({
      name: "",
      amount: "",
      unit: "ml",
      stock: ""
    });
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
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el producto"
      );
    } finally {
      setDeletingProductId(null);
    }
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
    try {
      setIsLoading(true);

      if (!selectedProduct?.id) {
        toast.error("No se ha seleccionado un producto");
        return;
      }

      if (!data.quantity || data.quantity <= 0) {
        toast.error("La cantidad debe ser mayor a 0");
        return;
      }

      if (!data.destination) {
        toast.error("Debes seleccionar una barra de destino");
        return;
      }

      const destinationBarId = Number(data.destination.split("_*_")[0]);
      const destinationBarName = data.destination.split("_*_")[1];

      // First, use the adjust API for re-entry to assign stock to a bar
      const adjustResponse = await fetch("/api/adjust", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: selectedProduct.id,
          quantity: data.quantity,
          type: "re-entry",
          reason: `Asignación a barra: ${destinationBarName}`,
          destinationBars: [destinationBarId],
          observations: data.notes || "",
        }),
      });

      if (!adjustResponse.ok) {
        const errorData = await adjustResponse.json();
        throw new Error(errorData.error || "Error al asignar stock");
      }

      // Now create a transfer record to show in the transfer history
      // We need to find the inventory item that was just created/updated
      await fetchStocksOfBar();

      // Find the destination inventory item
      const destinationInventory = stocksData.find(
        (stock: any) =>
          stock.productId === selectedProduct.id &&
          stock.barId === destinationBarId
      );

      if (destinationInventory) {
        // Create a transfer record showing the assignment
        const transferResponse = await fetch("/api/transfer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inventory_id: [destinationInventory.id],
            from_id: [null], // From general stock (null)
            to_id: [destinationBarId],
            quantity: [data.quantity],
          }),
        });

        if (!transferResponse.ok) {
          console.warn(
            "Failed to create transfer record, but stock assignment was successful"
          );
        }
      }

      toast.success(
        `${data.quantity} unidades de ${selectedProduct.name} asignadas a ${destinationBarName}`
      );

      // Refresh data
      await fetchStocksOfBar();
      await fetchProducts();

      setAssignStockDialogOpen(false);
      assignForm.reset();
      setSelectedProduct(null);
    } catch (error) {
      console.error("Error assigning stock:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al asignar stock"
      );
    } finally {
      setIsLoading(false);
    }
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

    // Refresh data to show updated stock
    await Promise.all([fetchProducts(), fetchStocksOfBar()]);

    // Refresh adjustment history
    adjustmentHistoryRef.current?.refreshHistory();
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

    // Refresh data to show updated stock
    await Promise.all([fetchProducts(), fetchStocksOfBar()]);

    // Refresh adjustment history
    adjustmentHistoryRef.current?.refreshHistory();
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
  const areAllStockItemsSelected =
    displayItems.length > 0 &&
    displayItems.every((item) =>
      selectedStockItems.includes(item.id?.toString() || "")
    );
  const hasSelectedStockItems = selectedStockItems.length > 0;
  return (
    <>
      <PageHeader title="" description="Control de inventario y transferencias">
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
            <div className="text-3xl font-bold">
              {totalStock.toLocaleString()}
            </div>
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
              $
              {totalPurchaseValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
              $
              {totalSaleValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p className="text-sm text-gray-500">
              Margen: $
              {(totalSaleValue - totalPurchaseValue).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
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
            <div className="text-3xl font-bold text-orange-600">
              {lowStockItems}
            </div>
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
            <div className="text-3xl font-bold text-red-600">
              {outOfStockItems}
            </div>
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
                onClick={() => {
                  if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
                    toast.error("No tienes permiso para ajustar stock");
                    return;
                  }
                  setStockAdjustmentOpen(true)
                }}
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
                    const firstSelectedProduct = productsData.find((p) =>
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
                  {(() => {
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

                    // Add only recipes from recipesData that aren't already added
                    recipesData.forEach((item) => {
                      if (item.type === "recipe" && !seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        allItems.push(item);
                      }
                    });

                    return allItems;
                  })().map((item) => {
                    const isProduct = "purchase_price" in item;
                    const product = item as any; // Cast to access all properties

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedStockItems.includes(
                              item.id?.toString() || ""
                            )}
                            onCheckedChange={() =>
                              toggleStockItemSelection(
                                item.id?.toString() || ""
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            onClick={() =>
                              isProduct && viewProductDetail(product)
                            }
                            className="p-0 h-auto font-medium text-orange-900"
                          >
                            {item.name} {!isProduct && "(Receta)"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={isProduct ? product.is_active : false}
                            onCheckedChange={(checked) =>
                              isProduct &&
                              handleToggleActive(
                                item.id?.toString(),
                                checked,
                                "is_active"
                              )
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
                              <div key={s.id}>
                                <Button
                                  variant="link"
                                  className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800"
                                  onClick={() =>
                                    router.push(`/bars/${s.barId}`)
                                  }
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
                          <TableCell>{product.created_at || "N/A"}</TableCell>
                        )}
                        {/* {showUnredeemed && "user" in item && (
                        // <TableCell>{item.user}</TableCell>
                      )} */}
                        <TableCell>
                          <div className="flex gap-2">
                            {isProduct && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (user?.role === "barman" || user?.role === "client") {
                                      toast.error("No tienes permiso para ajustar stock");
                                      return;
                                    }
                                    handleAssignStock(product)
                                  }}
                                >
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  Asignar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  onClick={() => {
                                    if (user?.role === "barman" || user?.role === "client") {
                                      toast.error("No tienes permiso para ajustar stock");
                                      return;
                                    }
                                    handleAdjustStock(product)
                                  }}
                                >
                                  <PackagePlus className="mr-2 h-4 w-4" />
                                  Ajustar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                                  onClick={() => {
                                    if (user?.role === "barman" || user?.role === "manager" || user?.role === "client") {
                                      toast.error("No tienes permiso para eliminar productos");
                                      return;
                                    }
                                    handleDeleteClick(product)
                                  }}
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
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
              <StockAdjustmentHistory ref={adjustmentHistoryRef} />
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
                    if (
                      e.key === "-" ||
                      e.key === "+" ||
                      e.key === "e" ||
                      e.key === "E"
                    ) {
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
                      if (
                        value === "" ||
                        (Number(value) >= 1 && !value.includes("-"))
                      ) {
                        return value;
                      }
                      // If invalid, set to 1
                      e.target.value = "1";
                      return "1";
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Asignando...
                  </>
                ) : (
                  "Asignar Stock"
                )}
              </Button>
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
                    if (
                      e.key === "-" ||
                      e.key === "+" ||
                      e.key === "e" ||
                      e.key === "E"
                    ) {
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
                      if (
                        value === "" ||
                        (Number(value) >= 1 && !value.includes("-"))
                      ) {
                        return value;
                      }
                      // If invalid, set to 1
                      e.target.value = "1";
                      return "1";
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
              ¿Estás seguro de que deseas eliminar el producto "
              {productToDelete?.name}"?
              <br />
              <span className="text-red-600 font-medium">
                Esta acción no se puede deshacer y eliminará permanentemente el
                producto del inventario.
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
      <Dialog
        open={showAddProductModal}
        onOpenChange={(open) => {
          setShowAddProductModal(open);
          if (!open) resetProductModal();
        }}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Producto</DialogTitle>
            <DialogDescription>
              Complete los detalles del producto para agregarlo al inventario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-2 py-4 h-[calc(100vh-10rem)] overflow-y-auto">
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

            {/* Toggle Fields */}
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
                    onCheckedChange={(checked) => {
                      setNewProduct({
                        ...newProduct,
                        type: checked ? "ingredient" : "product"
                      });

                      // Clear recipe/ingredient selections when enabling ingredient mode
                      if (checked) {
                        setSelectedRecipeId("");
                        setRecipeIngredients([]);
                        setUseCustomIngredients(false);
                        setCustomIngredients([]);
                        setSelectedIngredient("none");
                        setCustomIngredientName("");
                        setIngredientQuantity("");
                      }
                    }}
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

              {/* Show disabled message when ingredient toggle is enabled */}
              {newProduct.type === "ingredient" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Modo Ingrediente:</strong> Los productos de tipo ingrediente no requieren recetas o ingredientes adicionales.
                    Este producto estará disponible para usar como ingrediente en otras recetas.
                  </p>
                </div>
              )}
              <Select
                value={selectedRecipeId || "no-recipe"}
                onValueChange={handleRecipeSelection}
                disabled={newProduct.type === "ingredient"}
              >
                <SelectTrigger className={newProduct.type === "ingredient" ? "opacity-50 cursor-not-allowed" : ""}>
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
                        {ingredient.type === "ingredient" ? "Ingrediente" : "Ingrediente-Tipo"}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>


              {/* Ingredients Display - Works for recipes AND individual ingredients */}
              {selectedRecipeId && selectedRecipeId !== "no-recipe" && (
                <div className="space-y-3">
                  <div className="border border-blue-200 rounded-lg p-3">
                    <Label className="text-sm font-medium text-blue-900">
                      Ingredientes del producto:
                    </Label>
                    <p className="text-sm text-blue-700 mt-1">
                      Especifica cuántas unidades del producto vas a crear. Los ingredientes se descontarán automáticamente.
                    </p>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-4 gap-4 p-3 border rounded-lg font-medium text-sm">
                    <div>Ingrediente</div>
                    <div className="text-center">Cantidad a crear</div>
                    <div className="text-center">Stock disponible</div>
                    <div className="text-center">Acciones</div>
                  </div>

                  {/* Show message when no ingredients loaded yet */}
                  {recipeIngredients.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">
                        Cargando ingredientes o agrega ingredientes personalizados...
                      </p>
                    </div>
                  )}

                  {/* Ingredients Table */}
                  {recipeIngredients.map((ingredient, index) => {
                    // Calculate available stock and total needed
                    let availableStockDisplay = "";
                    let availableStockValue = 0;
                    let availableUnitsCount = 0;
                    let totalNeeded = 0;
                    let totalNeededUnit = "";

                    if (ingredient.isProductIngredient) {
                      // For product ingredients: show actual total_amount with unit
                      availableStockValue = ingredient.deduct_amount || 0;
                      availableStockDisplay = `${availableStockValue} ${ingredient.unit || ""}`;
                      // availableUnitsCount = Math.floor(availableStockValue / (ingredient.deduct_amount || 1));
                      // totalNeeded = (ingredient.deduct_amount || 0) * (ingredient.requiredQuantity || 1);
                      // totalNeededUnit = ingredient.unit || "";
                    } else if (ingredient.isStandardIngredient) {
                      // For standard ingredients: show actual stock with unit (extracted from quantity)
                      availableStockValue = ingredient.deduct_stock || 0;
                      const unit = ingredient.unit || "";
                      availableStockDisplay = `${availableStockValue * (parseFloat(ingredient.quantity || "1"))} ${unit}`;
                      availableUnitsCount = ingredient.deduct_stock || 1;
                      totalNeeded = (parseFloat(ingredient.quantity || "1") * (ingredient.requiredQuantity || 1));
                      totalNeededUnit = unit;
                    } else {
                      // For custom ingredients
                      availableStockValue = ingredient.stock || 0;
                      const unit = ingredient.unit || "";
                      availableStockDisplay = `${availableStockValue * (parseFloat(ingredient.amount || "1"))} ${unit}`;
                      availableUnitsCount = availableStockValue; // stock field represents available units directly
                      totalNeeded = (parseFloat(ingredient.amount || "1") * (ingredient.requiredQuantity || 1));
                      totalNeededUnit = unit;
                    }

                    // For product ingredients, check if there's enough total amount
                    // For other ingredients, check if there are enough units
                    const hasEnoughStock = ingredient.isProductIngredient
                      ? availableStockValue >= Number(ingredient.requiredQuantity)
                      : availableUnitsCount >= (ingredient.requiredQuantity || 1);

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-4 gap-4 p-3 border rounded-lg items-center"
                      >
                        {/* Ingrediente Column */}
                        <div>
                          <div className="font-medium mb-1">
                            {ingredient.name}
                          </div>
                          <div className="text-xs text-blue-600">
                            {/* {ingredient.isProductIngredient && `${ingredient.deduct_amount} ${ingredient.unit} por unidad`} */}
                            {ingredient.isStandardIngredient && `${ingredient.quantity} por unidad`}
                            {!ingredient.isProductIngredient && !ingredient.isStandardIngredient && `${ingredient.amount} ${ingredient.unit} por unidad`}
                          </div>
                        </div>

                        {/* Cantidad a crear Column */}
                        <div className={`flex items-center ${ingredient.isProductIngredient ? "flex-row" : "flex-col"} gap-2 text-center`}>

                          <Input
                            type="number"
                            min="1"
                            value={ingredient.requiredQuantity || 1}
                            onChange={(e) =>
                              updateIngredientQuantity(
                                index,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="h-10 text-center font-medium w-full"
                          />
                          {ingredient.isProductIngredient ? ingredient.unit : ""}
                          {ingredient.isStandardIngredient && (

                            <p className="text-xs text-gray-500 mt-1">
                              Total necesario: {totalNeeded}{totalNeededUnit ? ` ${totalNeededUnit}` : ""}
                            </p>

                          )}
                        </div>

                        {/* Stock disponible Column */}
                        <div className="text-center">
                          <p className={`text-lg font-bold ${hasEnoughStock ? "text-green-600" : "text-red-600"}`}>
                            {availableStockDisplay}
                          </p>
                          <p className="text-xs text-gray-500">
                            {/* {ingredient.isProductIngredient && `Available: ${availableUnitsCount} units (${availableStockValue} ${ingredient.unit})`} */}
                            {ingredient.isStandardIngredient && `Available: ${availableUnitsCount} units (${availableStockDisplay})`}
                            {!ingredient.isProductIngredient && !ingredient.isStandardIngredient && `Available: ${availableStockValue} units (${availableStockDisplay})`}
                          </p>
                          {!hasEnoughStock && ingredient.isStandardIngredient && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {(ingredient.requiredQuantity || 1) - availableUnitsCount} unidad faltante
                            </p>
                          )}
                        </div>

                        {/* Acciones Column */}
                        <div className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIngredientFromList(index)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}

              {/* Add Custom Ingredient Button - Available for recipes AND individual ingredients */}
              {selectedRecipeId && selectedRecipeId !== "no-recipe" && (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCustomIngredientForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Ingrediente Personalizado
                  </Button>
                </div>
              )}

              {/* Custom Ingredient Form */}
              {showCustomIngredientForm && (
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      Nuevo Ingrediente Personalizado
                    </Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCustomIngredientForm(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Nombre
                      </Label>
                      <Input
                        placeholder="Nombre del ingrediente"
                        value={customIngredientForm.name}
                        onChange={(e) =>
                          setCustomIngredientForm({
                            ...customIngredientForm,
                            name: e.target.value
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Cantidad por unidad
                      </Label>
                      <Input
                        type="number"
                        placeholder="Cantidad"
                        value={customIngredientForm.amount}
                        onChange={(e) =>
                          setCustomIngredientForm({
                            ...customIngredientForm,
                            amount: e.target.value
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Unidad
                      </Label>
                      <Select
                        value={customIngredientForm.unit}
                        onValueChange={(value) =>
                          setCustomIngredientForm({
                            ...customIngredientForm,
                            unit: value
                          })
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
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Stock Disponible
                      </Label>
                      <Input
                        type="number"
                        placeholder="Stock"
                        value={customIngredientForm.stock}
                        onChange={(e) =>
                          setCustomIngredientForm({
                            ...customIngredientForm,
                            stock: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCustomIngredientForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCustomIngredientToList}
                      disabled={!customIngredientForm.name || !customIngredientForm.amount || !customIngredientForm.stock}
                    >
                      Agregar Ingrediente
                    </Button>
                  </div>
                </div>
              )}
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
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddProductModal(false);
                resetProductModal();
              }}
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

      {/* Create Recipe Dialog */}
      <Dialog
        open={showCreateRecipeDialog}
        onOpenChange={setShowCreateRecipeDialog}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Crear Nueva Receta</DialogTitle>
            <DialogDescription>
              Crea una receta que se puede vincular a productos del inventario
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
                    <SelectItem value="entrada">Entrada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Add Ingredient Section */}
            <div className="space-y-3 border rounded-lg p-4">
              <Label className="text-sm font-medium">Agregar Ingrediente</Label>
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
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-sm text-gray-600">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
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
                setShowCreateRecipeDialog(false);
                setNewRecipe({ name: "", category: "bebida", ingredients: [] });
                setNewIngredient({ name: "", quantity: "", unit: "ml" });
                // setIngredientValidation([]);
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
    </>
  );
};
export default Stock;
