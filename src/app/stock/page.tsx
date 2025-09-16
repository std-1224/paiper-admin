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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
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
  Edit,
  Pencil,
  Info,
  Package,
  ChefHat,
  MoreHorizontal,
  EyeOff,
  Eye,
  QrCode,
  Users,
  Clock,
  Edit2Icon,
} from "lucide-react";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { useAppContext } from "@/context/AppContext";
import { InventoryData, Product } from "@/types/types";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import ImageUpload from "../(components)/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { categoryList } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import AddProductModal from "../(components)/add-product-modal";
import RecipeDetailsModal from "../(components)/recipe-details-modal";
import IngredientDetailsModal from "../(components)/ingredient-details-modal";

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
  });
  const [amountPerUnit, setAmountPerUnit] = useState<number>(0);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [multipleTransferOpen, setMultipleTransferOpen] = useState(false);
  const [selectedStockItems, setSelectedStockItems] = useState<string[]>([]);
  const { user } = useAuth();
  const [showCreateRecipeDialog, setShowCreateRecipeDialog] = useState(false);

  // Edit product modal states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Edit modal ingredient states (matching stock-management)
  const [editCustomIngredients, setEditCustomIngredients] = useState<any[]>([]);
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
  const [selectedEditRecipeId, setSelectedEditRecipeId] = useState<string>("");
  const [editUseCustomIngredients, setEditUseCustomIngredients] =
    useState<boolean>(false);
  const [originalIngredientQuantities, setOriginalIngredientQuantities] =
    useState<{ [key: string]: number }>({});

  // Enhanced edit modal selection states (matching stock-management)
  const [editSelectedItemForPreview, setEditSelectedItemForPreview] =
    useState<string>("");
  const [editSelectedItemType, setEditSelectedItemType] = useState<
    "recipe" | "ingredient" | null
  >(null);
  const [editAddedIngredientsList, setEditAddedIngredientsList] = useState<
    any[]
  >([]);
  const [editAddedRecipesList, setEditAddedRecipesList] = useState<any[]>([]);
  const [editQuantityToCreate, setEditQuantityToCreate] = useState<number>(1);
  const [editCustomQuantityPerUnit, setEditCustomQuantityPerUnit] =
    useState<number>(0);
  const [editIngredientUnit, setEditIngredientUnit] = useState<string>("ml");
  const [editIngredientRequiredQuantity, setEditIngredientRequiredQuantity] =
    useState<number>(1);
  const [editCustomIngredientName, setEditCustomIngredientName] =
    useState<string>("");
  const [editIngredientQuantity, setEditIngredientQuantity] =
    useState<string>("");
  const {
    recipesData,
    fetchRecipes,
    ingredientsData,
    normalizedRecipesData,
    fetchIngredients,
    fetchNormalizedRecipes,
  } = useAppContext();

  // Fetch recipes, ingredients, and normalized recipes on component mount
  useEffect(() => {
    fetchRecipes();
    fetchIngredients();
    fetchNormalizedRecipes();
  }, [fetchRecipes, fetchIngredients, fetchNormalizedRecipes]);

  // Recipe ingredient states for product modal
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
      deduct_quantity?: number;
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
  const [showCustomIngredientForm, setShowCustomIngredientForm] =
    useState(false);
  const [customIngredientForm, setCustomIngredientForm] = useState({
    name: "",
    amount: "",
    unit: "ml",
    stock: "",
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

  // Bar sidebar states
  const [barSidebarOpen, setBarSidebarOpen] = useState(false);
  const [selectedBarForSidebar, setSelectedBarForSidebar] = useState<any>(null);

  // Recipe and Ingredient edit modal states
  const [recipeDetailOpen, setRecipeDetailOpen] = useState(false);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [ingredientDetailOpen, setIngredientDetailOpen] = useState(false);
  const [selectedIngredientId, setSelectedIngredientId] = useState<
    string | null
  >(null);
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

  // Function to calculate recipe purchase price based on ingredients
  const calculateRecipePurchasePrice = (recipe: any) => {
    if (
      !recipe.recipe_ingredients ||
      !Array.isArray(recipe.recipe_ingredients)
    ) {
      return 0;
    }

    let totalPrice = 0;
    recipe.recipe_ingredients.forEach((recipeIngredient: any) => {
      const ingredient = recipeIngredient.ingredients;
      if (
        ingredient &&
        ingredient.purchase_price &&
        ingredient.quantity &&
        recipeIngredient.deduct_quantity
      ) {
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
    if (
      !ingredient.recipe_ingredients ||
      !Array.isArray(ingredient.recipe_ingredients)
    ) {
      return ingredient.purchase_price || 0;
    }

    // If ingredient has recipe ingredients, calculate based on components
    let totalPrice = 0;
    ingredient.recipe_ingredients.forEach((recipeIngredient: any) => {
      const subIngredient = recipeIngredient.ingredients;
      if (
        subIngredient &&
        subIngredient.purchase_price &&
        subIngredient.quantity &&
        recipeIngredient.deduct_quantity
      ) {
        // Calculate price per unit: subIngredient.purchase_price / subIngredient.quantity
        const pricePerUnit =
          subIngredient.purchase_price / subIngredient.quantity;
        // Calculate total cost for this sub-ingredient: pricePerUnit * quantity used
        const subIngredientCost =
          pricePerUnit * recipeIngredient.deduct_quantity;
        totalPrice += subIngredientCost;
      }
    });

    return totalPrice > 0 ? totalPrice : ingredient.purchase_price || 0;
  };

  // State to store product data for recipes and ingredients
  const [recipeProducts, setRecipeProducts] = useState<{ [key: string]: any }>(
    {}
  );
  const [ingredientProducts, setIngredientProducts] = useState<{
    [key: string]: any;
  }>({});

  // Function to fetch product data for a recipe
  const fetchRecipeProduct = async (recipeId: string) => {
    if (recipeProducts[recipeId]) return recipeProducts[recipeId];

    try {
      const response = await fetch(`/api/products/by-recipe/${recipeId}`);
      if (response.ok) {
        const productData = await response.json();
        setRecipeProducts((prev) => ({ ...prev, [recipeId]: productData }));
        return productData;
      }
    } catch (error) {
      console.error("Error fetching recipe product:", error);
    }
    return null;
  };

  // Function to fetch product data for an ingredient
  const fetchIngredientProduct = async (ingredientId: string) => {
    if (ingredientProducts[ingredientId])
      return ingredientProducts[ingredientId];

    try {
      const response = await fetch(
        `/api/products/by-ingredient/${ingredientId}`
      );
      if (response.ok) {
        const productData = await response.json();
        setIngredientProducts((prev) => ({
          ...prev,
          [ingredientId]: productData,
        }));
        return productData;
      }
    } catch (error) {
      console.error("Error fetching ingredient product:", error);
    }
    return null;
  };

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

  // Handle opening recipe edit modal
  const handleEditRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setRecipeDetailOpen(true);
  };

  // Handle opening ingredient edit modal
  const handleEditIngredient = (ingredientId: string) => {
    setSelectedIngredientId(ingredientId);
    setIngredientDetailOpen(true);
  };

  // View product details function (similar to stock management)
  const viewProductDetails = (product: Product) => {
    const isRecipe =
      normalizedRecipesData.some((recipe) => recipe.id === product.id) ||
      product.type === "recipe";
    const isIngredient =
      ingredientsData.some((ingredient) => ingredient.id === product.id) ||
      product.type === "ingredient";

    if (isRecipe) {
      setSelectedRecipeId(product.id.toString());
      setRecipeDetailOpen(true);
    } else if (isIngredient) {
      setSelectedIngredientId(product.id.toString());
      setIngredientDetailOpen(true);
    } else {
      // For regular products, use the existing product detail modal
      viewProductDetail(product);
    }
  };

  // Handle opening bar sidebar
  const handleBarClick = (barId: string, barName: string) => {
    const bar = barsData.find(b => b.id?.toString() === barId);
    setSelectedBarForSidebar(bar || { id: barId, name: barName });
    setBarSidebarOpen(true);
  };

  // Helper function to extract quantity and unit from description (matching stock-management)
  const extractQuantityAndUnitFromDescription = (description: string) => {
    // Default values
    let quantity = 1;
    let unit = "ml";

    if (!description) return { quantity, unit };

    // Try to extract quantity and unit from description
    // Look for patterns like "500ml", "1L", "250 ml", etc.
    const match = description.match(
      /(\d+(?:\.\d+)?)\s*(ml|l|g|kg|oz|units?|unidades?)/i
    );

    if (match) {
      quantity = parseFloat(match[1]);
      unit = match[2].toLowerCase();

      // Convert liters to ml for consistency
      if (unit === "l") {
        quantity = quantity * 1000;
        unit = "ml";
      }
      // Convert kg to g for consistency
      if (unit === "kg") {
        quantity = quantity * 1000;
        unit = "g";
      }
    }

    return { quantity, unit };
  };

  // Enhanced edit modal helper functions (matching stock-management)
  const handleEditItemSelection = (value: string) => {
    setEditSelectedItemForPreview(value);

    if (value === "no-selection" || !value) {
      setEditSelectedItemType(null);
      return;
    }

    // Check if it's a recipe or an ingredient
    const selectedRecipe = normalizedRecipesData.find(
      (recipe) => recipe.id === value
    );
    const selectedIngredient = ingredientsData.find(
      (ingredient) => ingredient.id === value
    );

    if (selectedRecipe) {
      setEditSelectedItemType("recipe");
    } else if (selectedIngredient) {
      setEditSelectedItemType("ingredient");
    }
  };

  // Add ingredient to the edit list
  const addEditIngredientToList = () => {
    const selectedIngredient = ingredientsData.find(
      (ing) => ing.id === editSelectedItemForPreview
    );
    if (
      selectedIngredient &&
      !editAddedIngredientsList.find(
        (item) => item.id === selectedIngredient.id
      )
    ) {
      const quantityToUse =
        editCustomQuantityPerUnit || selectedIngredient.quantity;

      // Calculate deduction logic: amount per unit / per unit
      const deductStock = Math.floor(
        quantityToUse / selectedIngredient.quantity
      );
      const deductQuantity = quantityToUse % selectedIngredient.quantity;

      const newIngredient = {
        ...selectedIngredient,
        customQuantityPerUnit: quantityToUse,
        deduct_stock: deductStock,
        deduct_quantity: deductQuantity,
        totalQuantityNeeded: quantityToUse,
      };
      setEditAddedIngredientsList([...editAddedIngredientsList, newIngredient]);
      setEditSelectedItemForPreview("");
      setEditSelectedItemType(null);
      setEditCustomQuantityPerUnit(0);
    }
  };

  // Add recipe to the edit list
  const addEditRecipeToList = () => {
    const selectedRecipe = normalizedRecipesData.find(
      (recipe) => recipe.id === editSelectedItemForPreview
    );
    if (
      selectedRecipe &&
      !editAddedRecipesList.find((item) => item.id === selectedRecipe.id)
    ) {
      const newRecipe = {
        ...selectedRecipe,
        quantityToUse: editQuantityToCreate,
      };
      setEditAddedRecipesList([...editAddedRecipesList, newRecipe]);
      setEditSelectedItemForPreview("");
      setEditSelectedItemType(null);
      setEditQuantityToCreate(1);
    }
  };

  // Remove ingredient from edit list
  const removeEditIngredientFromList = (ingredientId: string) => {
    setEditAddedIngredientsList(
      editAddedIngredientsList.filter((item) => item.id !== ingredientId)
    );
  };

  // Remove recipe from edit list
  const removeEditRecipeFromList = (recipeId: string) => {
    setEditAddedRecipesList(
      editAddedRecipesList.filter((item) => item.id !== recipeId)
    );
  };

  // Handle product update (matching stock-management implementation)
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    // if (user?.role === "barman" || user?.role === "client") {
    //   toast.error("No tienes permiso para editar productos");
    //   return;
    // }
    try {
      setIsLoading(true);

      // Get original product data for audit logging
      const originalProduct = productsData.find(p => p.id === editingProduct.id);
      let uploadedUrl = editingProduct.image_url;
      if (imageFile) {
        const fileName = `image-${Date.now()}.${imageFile.name.split(".").pop()}`;
        const result = await uploadImageToSupabase(imageFile, fileName);
        if (result) {
          uploadedUrl = result;
        }
      }

      // Determine if product has ingredients or recipes (enhanced version)
      const hasIngredients = editAddedIngredientsList.length > 0;
      const hasRecipes = editAddedRecipesList.length > 0;
      const hasAnyIngredients = hasIngredients || hasRecipes;

      // Calculate total_amount for ingredient-type products
      // let totalAmount = null;
      // if (editingProduct.type === "ingredient") {
      //   totalAmount = (editingProduct.stock || 0) * amountPerUnit;
      // }

      const response = await fetch(`/api/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editingProduct,
          image_url: uploadedUrl,
          updated_at: new Date().toISOString(),
          has_recipe: hasAnyIngredients,
          // total_amount: totalAmount,
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
            const existingIngredient = existingIngredients.find(
              (ing: any) => ing.product_id === editingProduct.id
            );

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
                is_active:
                  editingProduct.is_active !== undefined
                    ? editingProduct.is_active
                    : true,
                original_quantity: amountPerUnit,
                purchase_price: editingProduct.purchase_price || 0,
              };

              const updateResponse = await fetch("/api/ingredients", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ingredientData),
              });

              if (!updateResponse.ok) {
                console.error(
                  "Failed to update ingredient entry, but product was updated successfully"
                );
              } else {
                toast.success(
                  "Producto e ingrediente actualizados exitosamente"
                );
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
                is_active:
                  editingProduct.is_active !== undefined
                    ? editingProduct.is_active
                    : true,
                original_quantity: amountPerUnit,
                purchase_price: editingProduct.purchase_price || 0,
              };

              const createResponse = await fetch("/api/ingredients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(ingredientData),
              });

              if (!createResponse.ok) {
                console.error(
                  "Failed to create ingredient entry, but product was updated successfully"
                );
                toast.success("Producto actualizado exitosamente");
              } else {
                toast.success(
                  "Producto actualizado e ingrediente creado exitosamente"
                );
              }
            }
          }
        } catch (error) {
          console.error("Error updating ingredient entry:", error);
          toast.success("Producto actualizado exitosamente");
          // Continue execution as product was updated successfully
        }
      } else {
        toast.success("Producto actualizado exitosamente");
      }

      // Create audit log for product update
      if (user && originalProduct) {
        try {
          const changes = [];
          if (originalProduct.name !== editingProduct.name) changes.push(`Nombre: "${originalProduct.name}" → "${editingProduct.name}"`);
          if (originalProduct.description !== editingProduct.description) changes.push(`Descripción: "${originalProduct.description}" → "${editingProduct.description}"`);
          if (originalProduct.stock !== editingProduct.stock) changes.push(`Stock: ${originalProduct.stock} → ${editingProduct.stock}`);
          if (originalProduct.sale_price !== editingProduct.sale_price) changes.push(`Precio: $${originalProduct.sale_price} → $${editingProduct.sale_price}`);
          if (originalProduct.purchase_price !== editingProduct.purchase_price) changes.push(`Precio compra: $${originalProduct.purchase_price} → $${editingProduct.purchase_price}`);

          if (changes.length > 0) {
            await fetch("/api/audit-log", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                user_id: user.id,
                user_name: user.email?.split('@')[0] || 'Unknown',
                user_email: user.email || '',
                user_role: user.role || 'user',
                action: "update",
                action_type: "stock_update",
                target_type: "product",
                target_id: editingProduct.id,
                target_name: editingProduct.name,
                description: `Producto actualizado: ${changes.join(', ')}`,
                changes_before: {
                  name: originalProduct.name,
                  description: originalProduct.description,
                  stock: originalProduct.stock,
                  sale_price: originalProduct.sale_price,
                  purchase_price: originalProduct.purchase_price
                },
                changes_after: {
                  name: editingProduct.name,
                  description: editingProduct.description,
                  stock: editingProduct.stock,
                  sale_price: editingProduct.sale_price,
                  purchase_price: editingProduct.purchase_price
                },
                status: "success"
              }),
            });
          }
        } catch (auditError) {
          console.error("Error creating audit log:", auditError);
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
      setEditSelectedItemForPreview("");
      setEditSelectedItemType(null);
      setEditAddedIngredientsList([]);
      setEditAddedRecipesList([]);
      setEditQuantityToCreate(1);
      setEditCustomQuantityPerUnit(0);

      setEditCustomIngredientName("");
      setEditIngredientQuantity("");
      setEditIngredientUnit("ml");
      setEditIngredientRequiredQuantity(1);
      setOriginalIngredientQuantities({});

      fetchProducts();
      fetchIngredients(); // Refresh ingredients data to show updated values
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Error updating product"
      );
    } finally {
      setIsLoading(false);
    }
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

  // Helper function to extract unit from description
  const extractUnitFromDescription = (description: string): string => {
    // Extract unit from description like "Unit: L, Conversion: 500g per unit"
    const unitMatch = description.match(/Unit:\s*([^,]+)/i);
    if (unitMatch) {
      return unitMatch[1].trim();
    }
    return "unidad"; // Default unit
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
      stock: "",
    });
  };

  // Determine item type and get appropriate deletion info
  const determineItemTypeAndDeletionInfo = (item: {
    id: string;
    name: string;
    type?: string;
    recipe_id?: string;
    ingredient_id?: string;
  }) => {
    // Check if it's a recipe (has recipe_id or is from recipes data)
    if (item.recipe_id || normalizedRecipesData.find((r) => r.id === item.id)) {
      return {
        type: "recipe",
        apiEndpoint: "/api/recipes",
        itemName: item.name,
        confirmationMessage:
          "Esta receta y todos sus ingredientes asociados serán eliminados.",
      };
    }

    // Check if it's an ingredient (has ingredient_id or is from ingredients data)
    if (item.ingredient_id || ingredientsData.find((i) => i.id === item.id)) {
      return {
        type: "ingredient",
        apiEndpoint: "/api/ingredients",
        itemName: item.name,
        confirmationMessage:
          "Este ingrediente y todas las recetas que lo usan serán eliminados.",
      };
    }

    // Check if it's an ingredient-type product
    if (item.type === "ingredient") {
      return {
        type: "ingredient-type-product",
        apiEndpoint: "/api/products",
        itemName: item.name,
        confirmationMessage:
          "Este producto de tipo ingrediente y su ingrediente asociado serán eliminados.",
      };
    }

    // Default to regular product
    return {
      type: "product",
      apiEndpoint: "/api/products",
      itemName: item.name,
      confirmationMessage: "Este producto será eliminado del inventario.",
    };
  };

  // Handle smart deletion based on item type
  const handleDeleteProduct = async () => {
    if (!productToDelete?.id) return;

    setDeletingProductId(productToDelete.id);
    const id = productToDelete.id;

    try {
      // Determine what type of item we're deleting
      const deletionInfo = determineItemTypeAndDeletionInfo(productToDelete);

      console.log(
        `Deleting ${deletionInfo.type}: ${deletionInfo.itemName} (ID: ${id})`
      );

      // Call the appropriate API endpoint
      let response;
      if (deletionInfo.type === "recipe") {
        response = await fetch(`${deletionInfo.apiEndpoint}?id=${id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
      } else if (deletionInfo.type === "ingredient") {
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
          const errorMessage =
            errorData.details ||
            errorData.error ||
            `No se puede eliminar ${deletionInfo.type}`;
          const suggestion = errorData.suggestion || "";
          const references = errorData.references || [];

          let fullMessage = errorMessage;
          if (references.length > 0) {
            fullMessage += "\n\nRazones:\n• " + references.join("\n• ");
          }
          if (suggestion) {
            fullMessage += "\n\n" + suggestion;
          }

          throw new Error(fullMessage);
        }

        throw new Error(
          errorData.error || `Failed to delete ${deletionInfo.type}`
        );
      }

      const result = await response.json();

      // Refresh all data to ensure consistency
      fetchProducts();
      fetchIngredients();
      fetchNormalizedRecipes();

      // Show appropriate success message based on deletion type
      let successMessage = "";
      switch (deletionInfo.type) {
        case "recipe":
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

        case "ingredient":
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

        case "ingredient-type-product":
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

      toast.success(successMessage);

      // Close dialog
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el elemento"
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

  const handleToggleRecipeActive = async (id: string, checked: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/recipes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          is_active: checked,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update recipe");

      // Update associated product if it exists
      try {
        const productResponse = await fetch(`/api/products/by-recipe/${id}`);

        if (productResponse.ok) {
          const productData = await productResponse.json();

          if (productData && productData.id) {
            // Update the product's is_active status
            const updateResponse = await fetch(`/api/products`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: productData.id,
                is_active: checked,
                updated_at: new Date().toISOString(),
              }),
            });

            if (!updateResponse.ok) {
              console.error(
                `Failed to update product ${productData.id}: ${updateResponse.status}`
              );
            }
          }
        }
      } catch (productError) {
        console.error("Error updating associated product:", productError);
        // Don't throw here, recipe update was successful
      }

      // Refresh recipes and normalized recipes data
      fetchRecipes();
      fetchNormalizedRecipes();
    } catch (err) {
      console.log(err instanceof Error ? err.message : "Error updating recipe");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleIngredientActive = async (id: string, checked: boolean) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ingredients`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          is_active: checked,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update ingredient");

      // Update associated product if it exists
      try {
        const productResponse = await fetch(
          `/api/products/by-ingredient/${id}`
        );

        if (productResponse.ok) {
          const productData = await productResponse.json();

          if (productData && productData.id) {
            // Update the product's is_active status
            const updateResponse = await fetch(`/api/products`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: productData.id,
                is_active: checked,
                updated_at: new Date().toISOString(),
              }),
            });

            if (!updateResponse.ok) {
              console.error(
                `Failed to update product ${productData.id}: ${updateResponse.status}`
              );
            }
          }
        }
      } catch (productError) {
        console.error("Error updating associated product:", productError);
        // Don't throw here, ingredient update was successful
      }

      // Refresh ingredients data
      fetchIngredients();
    } catch (err) {
      console.log(
        err instanceof Error ? err.message : "Error updating ingredient"
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
                onClick={() => {
                  // if (
                  //   user?.role === "barman" ||
                  //   user?.role === "client" ||
                  //   user?.role === "manager"
                  // ) {
                  //   toast.error("No tienes permiso para ajustar stock");
                  //   return;
                  // }
                  setStockAdjustmentOpen(true);
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
                    <TableHead>Precio Venta</TableHead>
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

                    // Add ALL normalized recipes data that aren't already added
                    // Stock page shows all recipes regardless of is_active status
                    normalizedRecipesData.forEach((item) => {
                      if (!seenIds.has(item.id)) {
                        seenIds.add(item.id);
                        allItems.push({
                          ...item,
                          type: "recipe", // Ensure type is set for consistency
                        });
                      }
                    });

                    // Add ALL ingredients from ingredientsData that aren't already added
                    // Stock page shows all ingredients regardless of is_active status
                    ingredientsData
                      .filter((item) => !item.product_id)
                      .forEach((item) => {
                        if (!seenIds.has(item.id)) {
                          seenIds.add(item.id);
                          allItems.push(item);
                        }
                      });

                    // Filter items based on search term
                    const filteredItems = allItems.filter((item) => {
                      if (!searchTerm) return true;

                      const searchLower = searchTerm.toLowerCase();

                      // Search by name
                      const matchesName = item.name?.toLowerCase().includes(searchLower);

                      // Search by category
                      const matchesCategory = item.category?.toLowerCase().includes(searchLower);

                      // Search by type
                      const matchesType = item.type?.toLowerCase().includes(searchLower);

                      // Search by description
                      const matchesDescription = item.description?.toLowerCase().includes(searchLower);

                      return matchesName || matchesCategory || matchesType || matchesDescription;
                    });

                    return filteredItems;
                  })().map((item) => {
                    const isProduct = item.type === "product";
                    const isRecipe = item.type === "recipe";
                    const isIngredient =
                      item.type === "ingredient" ||
                      ("quantity" in item && !isProduct && !isRecipe);
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
                            {item.name} {isRecipe && "(Receta)"}{" "}
                            {isIngredient && "(Ingrediente)"}
                          </Button>
                        </TableCell>
                        <TableCell>
                          {isRecipe ? (
                            <Switch
                              checked={item.is_active || false}
                              onCheckedChange={(checked) =>
                                handleToggleRecipeActive(
                                  item.id?.toString(),
                                  checked
                                )
                              }
                            />
                          ) : isProduct || item.type === "ingredient" ? (
                            <Switch
                              checked={product.is_active || false}
                              onCheckedChange={(checked) =>
                                handleToggleActive(
                                  item.id?.toString(),
                                  checked,
                                  "is_active"
                                )
                              }
                            />
                          ) : isIngredient ? (
                            <Switch
                              checked={item.is_active || false}
                              onCheckedChange={(checked) =>
                                handleToggleIngredientActive(
                                  item.id?.toString(),
                                  checked
                                )
                              }
                            />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {isProduct
                              ? categoryList.find(
                                (c) => c.value === product.category
                              )?.label || product.category
                              : isRecipe
                                ? "Receta"
                                : isIngredient
                                  ? product.type === "ingredient-product"
                                    ? "Ingrediente-Producto"
                                    : "Ingrediente"
                                  : product.type || "Otro"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(isProduct ||
                            (isIngredient &&
                              product.type === "ingredient" &&
                              product.sale_price)) && (
                              <span className="font-medium text-green-600">
                                ${product.sale_price?.toFixed(2) || "0.00"}
                              </span>
                            )}
                          {isRecipe &&
                            product.is_active &&
                            recipeProducts[product.id] && (
                              <span className="font-medium text-green-600">
                                $
                                {recipeProducts[product.id].sale_price?.toFixed(
                                  2
                                ) || "0.00"}
                              </span>
                            )}
                          {isIngredient &&
                            product.type !== "ingredient" &&
                            product.is_active &&
                            ingredientProducts[product.id] && (
                              <span className="font-medium text-green-600">
                                $
                                {ingredientProducts[
                                  product.id
                                ].sale_price?.toFixed(2) || "0.00"}
                              </span>
                            )}
                        </TableCell>
                        <TableCell>
                          {(isProduct ||
                            (isIngredient &&
                              product.type === "ingredient" &&
                              product.purchase_price)) && (
                              <span className="font-medium text-green-600">
                                ${product.purchase_price?.toFixed(2) || "0.00"}
                              </span>
                            )}
                          {isIngredient && product.type !== "ingredient" && (
                            <span className="font-medium text-green-600">
                              $
                              {calculateIngredientPurchasePrice(
                                product
                              ).toFixed(2)}
                            </span>
                          )}
                          {isRecipe && (
                            <span className="font-medium text-green-600">
                              $
                              {calculateRecipePurchasePrice(product).toFixed(2)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span>{item.stock}</span>
                        </TableCell>
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
                                    handleBarClick(s.barId?.toString() || '', s.barName || '')
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
                          {/* Show status based on item type and quantity */}
                          {isIngredient || (isProduct && product.type === "ingredient") ? (
                            (() => {
                              // Get quantity for ingredients and ingredient-type products
                              let currentQuantity = 0;
                              let originalQuantity = 0;
                              let unit = "ml";

                              if (product.type === "ingredient") {
                                // For ingredient-type products, get data from associated ingredient
                                const ingredient = ingredientsData.find(
                                  (ing) => ing.product_id === product.id
                                );
                                if (ingredient) {
                                  currentQuantity = ingredient.quantity || 0;
                                  originalQuantity = ingredient.original_quantity || ingredient.quantity || 0;
                                  unit = ingredient.unit || "ml";
                                }
                              } else {
                                // For regular ingredients
                                currentQuantity = item.quantity || 0;
                                originalQuantity = item.original_quantity || item.quantity || 0;
                                unit = item.unit || "ml";
                              }

                              // Show "Open" if quantity < original_quantity, "Closed" if quantity = original_quantity
                              return currentQuantity < originalQuantity ? (
                                // Open state: show quantity info and progress bar
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-sm font-medium">Open</span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {currentQuantity} {unit} / {originalQuantity} {unit}
                                  </div>
                                  <Progress
                                    value={originalQuantity ? (currentQuantity / originalQuantity) * 100 : 0}
                                    className="h-1 w-16"
                                  />
                                </div>
                              ) : (
                                // Closed state: quantity equals original_quantity (full/unused)
                                <div className="flex items-center gap-2 text-gray-500">
                                  <EyeOff className="h-4 w-4" />
                                  <span className="text-sm">Closed</span>
                                </div>
                              );
                            })()
                          ) : (
                            // For regular products and recipes: always show "Closed"
                            <div className="flex items-center gap-2 text-gray-500">
                              <EyeOff className="h-4 w-4" />
                              <span className="text-sm">Closed</span>
                            </div>
                          )}
                        </TableCell>
                        {showUnredeemed && "date" in item && (
                          <TableCell>{product.created_at || "N/A"}</TableCell>
                        )}
                        {/* {showUnredeemed && "user" in item && (
                        // <TableCell>{item.user}</TableCell>
                      )} */}
                        <TableCell>
                          <div className="flex gap-2">


                            {/* Edit pencil icon for all item types */}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                const isRecipe =
                                  normalizedRecipesData.some(
                                    (recipe) => recipe.id === item.id
                                  ) || item.type === "recipe";
                                const isIngredient =
                                  ingredientsData.some(
                                    (ingredient) => ingredient.id === item.id
                                  ) || item.type === "ingredient";
                                const isProduct =
                                  productsData.some(
                                    (product) => product.id === item.id
                                  ) || item.type === "product";
                                if (product.type === "ingredient") {
                                  // Find the ingredient by product_id to get original_quantity
                                  const ingredient = ingredientsData.find(
                                    (ing) => ing.product_id === product.id
                                  );
                                  setAmountPerUnit(
                                    ingredient?.original_quantity || 0
                                  );
                                } else {
                                  setAmountPerUnit(0);
                                }
                                if (isRecipe) {
                                  handleEditRecipe(item.id?.toString() || "");
                                } else if (isIngredient) {
                                  // Check if ingredient has an associated product
                                  const ingredientProduct = productsData.find(
                                    (p) => p.id === item.id
                                  );
                                  if (ingredientProduct) {
                                    // If ingredient has associated product, show product edit modal
                                    setEditingProduct(ingredientProduct);
                                  } else {
                                    // Otherwise show ingredient edit modal
                                    handleEditIngredient(
                                      item.id?.toString() || ""
                                    );
                                  }
                                } else if (isProduct) {
                                  // For products (including ingredient-type products), open the edit product modal
                                  const product = productsData.find(
                                    (p) => p.id === item.id
                                  );
                                  if (product) {
                                    setEditingProduct(product);

                                    // Initialize amountPerUnit for ingredient-type products

                                    // Load ALL ingredients and recipes that this product has (Enhanced Version)
                                    try {
                                      let loadedIngredients: any[] = [];
                                      let loadedRecipes: any[] = [];

                                      // 1. Fetch recipe ingredients from recipe_ingredients table
                                      const response = await fetch(
                                        `/api/recipe-ingredients?product_id=${product.id}`
                                      );
                                      if (response.ok) {
                                        const productRecipeIngredients =
                                          await response.json();

                                        if (
                                          productRecipeIngredients &&
                                          productRecipeIngredients.length > 0
                                        ) {
                                          // Separate individual ingredients from recipes
                                          productRecipeIngredients.forEach(
                                            (ri: any) => {
                                              if (ri.recipe_id) {
                                                // This is a recipe entry
                                                const recipeData =
                                                  normalizedRecipesData.find(
                                                    (r) => r.id === ri.recipe_id
                                                  );
                                                if (recipeData) {
                                                  loadedRecipes.push({
                                                    ...recipeData,
                                                    quantityToUse:
                                                      ri.deduct_stock,
                                                    id: ri.recipe_id,
                                                  });
                                                }
                                              } else if (ri.ingredient_id) {
                                                // This is an individual ingredient entry
                                                const ingredientData =
                                                  ingredientsData.find(
                                                    (ing) =>
                                                      ing.id ===
                                                      ri.ingredient_id
                                                  );
                                                if (ingredientData) {
                                                  loadedIngredients.push({
                                                    ...ingredientData,
                                                    customQuantityPerUnit:
                                                      ri.deduct_quantity +
                                                      ri.deduct_stock *
                                                      ingredientData.quantity,
                                                    deduct_stock:
                                                      ri.deduct_stock,
                                                    deduct_quantity:
                                                      ri.deduct_quantity,
                                                    totalQuantityNeeded:
                                                      ri.deduct_quantity +
                                                      ri.deduct_stock *
                                                      ingredientData.quantity,
                                                    id: ri.ingredient_id,
                                                  });
                                                }
                                              }
                                            }
                                          );
                                        }
                                      }

                                      // 2. Set the loaded ingredients and recipes to the enhanced lists
                                      setEditAddedIngredientsList(
                                        loadedIngredients
                                      );
                                      setEditAddedRecipesList(loadedRecipes);

                                      // 3. Also check legacy product.ingredients field for backward compatibility
                                      if (
                                        product.has_recipe &&
                                        (product as any).ingredients &&
                                        loadedIngredients.length === 0 &&
                                        loadedRecipes.length === 0
                                      ) {
                                        try {
                                          const storedIngredients = JSON.parse(
                                            (product as any).ingredients
                                          );
                                          if (
                                            storedIngredients &&
                                            storedIngredients.length > 0
                                          ) {
                                            // Convert legacy format to new enhanced format
                                            const legacyIngredients =
                                              storedIngredients
                                                .filter(
                                                  (ing: any) => ing.productId
                                                ) // Only custom ingredients
                                                .map((ing: any) => {
                                                  const ingredientData =
                                                    ingredientsData.find(
                                                      (ingData) =>
                                                        ingData.id ===
                                                        ing.productId
                                                    );
                                                  if (ingredientData) {
                                                    return {
                                                      ...ingredientData,
                                                      customQuantityPerUnit:
                                                        parseFloat(
                                                          ing.quantity
                                                        ),
                                                      deduct_stock: Math.floor(
                                                        parseFloat(
                                                          ing.quantity
                                                        ) /
                                                        ingredientData.quantity
                                                      ),
                                                      deduct_quantity:
                                                        parseFloat(
                                                          ing.quantity
                                                        ) %
                                                        ingredientData.quantity,
                                                      totalQuantityNeeded:
                                                        parseFloat(
                                                          ing.quantity
                                                        ),
                                                      id: ing.productId,
                                                    };
                                                  }
                                                  return null;
                                                })
                                                .filter(Boolean);

                                            setEditAddedIngredientsList(
                                              legacyIngredients
                                            );
                                            setEditCustomIngredients(
                                              storedIngredients
                                            ); // Keep for backward compatibility
                                          }
                                        } catch (error) {
                                          console.error(
                                            "Error parsing product.ingredients:",
                                            error
                                          );
                                        }
                                      }
                                    } catch (error) {
                                      console.error(
                                        "Error loading product ingredients/recipes:",
                                        error
                                      );
                                    }
                                  }
                                }
                              }}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    // if (
                                    //   user?.role === "barman" ||
                                    //   user?.role === "client"
                                    // ) {
                                    //   toast.error(
                                    //     "No tienes permiso para ajustar stock"
                                    //   );
                                    //   return;
                                    // }
                                    handleAssignStock(product);
                                  }}
                                  className="text-purple-600"
                                >
                                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                                  Asignar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // if (
                                    //   user?.role === "barman" ||
                                    //   user?.role === "client"
                                    // ) {
                                    //   toast.error(
                                    //     "No tienes permiso para ajustar stock"
                                    //   );
                                    //   return;
                                    // }
                                    handleAdjustStock(product);
                                  }}
                                  className="text-blue-600"
                                >
                                  <PackagePlus className="mr-2 h-4 w-4" />
                                  Ajustar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    // if (
                                    //   user?.role === "barman" ||
                                    //   user?.role === "manager" ||
                                    //   user?.role === "client"
                                    // ) {
                                    //   toast.error(
                                    //     "No tienes permiso para eliminar productos"
                                    //   );
                                    //   return;
                                    // }
                                    handleDeleteClick(product);
                                  }}
                                  className="text-red-600"
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
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
              {(() => {
                if (!productToDelete) return null;

                const deletionInfo =
                  determineItemTypeAndDeletionInfo(productToDelete);

                return (
                  <>
                    ¿Estás seguro de que deseas eliminar{" "}
                    {deletionInfo.type === "recipe"
                      ? "la receta"
                      : deletionInfo.type === "ingredient"
                        ? "el ingrediente"
                        : "el producto"}{" "}
                    &quot;
                    {productToDelete.name}&quot;?
                    <br />
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <span className="text-yellow-800 font-medium text-sm">
                        ⚠️ {deletionInfo.confirmationMessage}
                      </span>
                    </div>
                    <span className="text-red-600 font-medium">
                      Esta acción no se puede deshacer y eliminará
                      permanentemente el elemento y todos sus datos asociados.
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
      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => {
          setShowAddProductModal(false);
          resetProductModal();
        }}
        onProductAdded={() => {
          setShowAddProductModal(false);
          resetProductModal();
          fetchProducts();
        }}
        categoryList={categoryList}
        recipesData={recipesData}
        productsData={productsData}
        ingredientsData={ingredientsData}
        normalizedRecipesData={normalizedRecipesData}
      />

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

      {/* Recipe Details Modal */}
      <RecipeDetailsModal
        isOpen={recipeDetailOpen}
        onClose={() => {
          setRecipeDetailOpen(false);
          setSelectedRecipeId(null);
        }}
        recipeId={selectedRecipeId}
        onEditRecipe={(id) => {
          // Refresh data after editing
          fetchRecipes();
          fetchNormalizedRecipes();
        }}
      />

      {/* Ingredient Details Modal */}
      <IngredientDetailsModal
        isOpen={ingredientDetailOpen}
        onClose={() => {
          setIngredientDetailOpen(false);
          setSelectedIngredientId(null);
        }}
        ingredientId={selectedIngredientId}
        onEditIngredient={(id) => {
          // Refresh data after editing
          fetchIngredients();
        }}
      />

      {/* Edit Product Modal */}
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
                <Label htmlFor="name">Nombre del Producto</Label>
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
                    setEditingProduct({
                      ...editingProduct!,
                      category: value,
                    })
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

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price">Precio de Compra</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  step="0.01"
                  value={editingProduct?.purchase_price || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      purchase_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sale_price">Precio de Venta</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={editingProduct?.sale_price || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct!,
                      sale_price: parseFloat(e.target.value) || 0,
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
                  <h3 className="text-base font-semibold">
                    Configuración del Producto
                  </h3>

                  {/* Ingredient Type Toggle */}
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        ¿Usar este producto como ingrediente en recetas?
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Al activar esta opción, se creará automáticamente una
                        entrada en la tabla de ingredientes con el ID del
                        producto, permitiendo usar este producto como
                        ingrediente en otras recetas.
                      </p>
                    </div>
                    <Switch
                      checked={editingProduct?.type === "ingredient"}
                      onCheckedChange={(checked) => {
                        setEditingProduct({
                          ...editingProduct!,
                          type: checked ? "ingredient" : "product",
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stock">Stock</Label>
                    <Input
                      id="stock"
                      type="number"
                      value={
                        editingProduct?.stock === 0 ? "" : editingProduct?.stock
                      }
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct!,
                          stock:
                            e.target.value === "" ? 0 : Number(e.target.value),
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
                            Cantidad por unidad{" "}
                          </Label>
                          <Input
                            id="amount_per_unit"
                            type="number"
                            min="0"
                            step="0.01"
                            value={amountPerUnit === 0 ? "" : amountPerUnit}
                            placeholder="Ej: 1 unidad"
                            onChange={(e) =>
                              setAmountPerUnit(parseFloat(e.target.value) || 0)
                            }
                            className="h-9"
                          />
                        </div>

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
                  )}
                </div>
              </div>
            )}

            {/* Compact Added Ingredients List */}
            {editAddedIngredientsList.length > 0 && (
              <div className="border rounded-lg p-3 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="h-4 w-4 text-emerald-600" />
                  <h4 className="font-medium text-emerald-900">
                    Ingredientes Agregados
                  </h4>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-emerald-100 text-emerald-700 text-xs"
                  >
                    {editAddedIngredientsList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {editAddedIngredientsList.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center bg-white p-2 rounded border group hover:bg-emerald-50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {ingredient.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs bg-red-50 text-red-700"
                          >
                            {ingredient.totalQuantityNeeded} {ingredient.unit}
                          </Badge>
                        </div>
                        <div className="flex gap-3 text-xs text-gray-600">
                          <span>
                            Por unidad: {ingredient.customQuantityPerUnit}{" "}
                            {ingredient.unit}
                          </span>
                          <span>Stock: {ingredient.deduct_stock}</span>
                          <span>
                            Cantidad: {ingredient.deduct_quantity}{" "}
                            {ingredient.unit}
                          </span>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removeEditIngredientFromList(ingredient.id)
                        }
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
                  <h4 className="font-medium text-blue-900">
                    Recetas Agregadas
                  </h4>
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-blue-100 text-blue-700 text-xs"
                  >
                    {editAddedRecipesList.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {editAddedRecipesList.map((recipe, index) => (
                    <div
                      key={index}
                      className="bg-white p-2 rounded border group hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {recipe.name}
                          </span>
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
                      {recipe.recipe_ingredients &&
                        recipe.recipe_ingredients.length > 0 && (
                          <div className="text-xs text-gray-600">
                            <div className="flex flex-wrap gap-2">
                              {recipe.recipe_ingredients.map(
                                (ri: any, riIndex: number) => {
                                  const ingredientDetails =
                                    ingredientsData.find(
                                      (ing) => ing.id === ri.ingredient_id
                                    );
                                  return (
                                    <span
                                      key={riIndex}
                                      className="bg-gray-100 px-2 py-1 rounded"
                                    >
                                      {ingredientDetails?.name ||
                                        ri.ingredient_name}
                                      :{" "}
                                      {ri.deduct_quantity *
                                        recipe.quantityToUse}{" "}
                                      {ingredientDetails?.unit ||
                                        ri.ingredient_unit}
                                    </span>
                                  );
                                }
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compact Summary Section */}
            {(editAddedIngredientsList.length > 0 ||
              editAddedRecipesList.length > 0) && (
                <div className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-gray-600" />
                    <h4 className="font-medium text-gray-900 text-sm">
                      Resumen de Actualización
                    </h4>
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-emerald-600" />
                        <strong>Ingredientes:</strong>{" "}
                        {editAddedIngredientsList.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <ChefHat className="h-3 w-3 text-blue-600" />
                        <strong>Recetas:</strong> {editAddedRecipesList.length}
                      </span>
                    </div>
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingProduct(null);
                setOriginalIngredientQuantities({});
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isLoading}>
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

      {/* Bar Details Sidebar */}
      <Sheet open={barSidebarOpen} onOpenChange={setBarSidebarOpen}>
        <SheetContent className="sm:min-w-[800px] w-full overflow-y-auto" side="right">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {selectedBarForSidebar?.name || 'Bar Details'}
            </SheetTitle>
            <SheetDescription>
              Información detallada y estadísticas de la barra
            </SheetDescription>
          </SheetHeader>

          {selectedBarForSidebar && (
            <div className="space-y-6">
              {/* Bar Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">$82,350</div>
                    <p className="text-xs text-muted-foreground">Ventas del mes</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">875</div>
                    <p className="text-xs text-muted-foreground">Pedidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">42</div>
                    <p className="text-xs text-muted-foreground">Productos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">5</div>
                    <p className="text-xs text-muted-foreground">Staff</p>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Rendimiento Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Categorías más vendidas</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Bebidas alcohólicas</span>
                          <span className="font-medium">64%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Bebidas sin alcohol</span>
                          <span className="font-medium">21%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Energizantes</span>
                          <span className="font-medium">15%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Productos top</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Gin Tonic</span>
                          <span className="font-medium">145</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cerveza</span>
                          <span className="font-medium">132</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fernet con Coca</span>
                          <span className="font-medium">98</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bar Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Información de la Barra</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Códigos QR</h4>
                      <div className="flex items-center">
                        <QrCode className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">3 códigos activos</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Personal</h4>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">5 empleados activos</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Horas de Operación</h4>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm">Jueves a Domingo: 21:00 - 05:00</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    setBarSidebarOpen(false);
                    // Navigate to full bar page
                    window.location.href = `/bars/${selectedBarForSidebar.id}`;
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalles Completos
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setBarSidebarOpen(false);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  View Product Modal
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
export default Stock;
