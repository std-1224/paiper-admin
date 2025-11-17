import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BarData, Product, InventoryData, Notification, TableType } from "@/types/types";
import { QRCodeData } from "@/types/types";
import { User, Staff } from "@/types/types";
import { Recipe } from "@/types/types";
import { Order } from "@/types/types";
import { supabase, supabaseServerClient } from "@/lib/supabaseClient";
import { Ingredient, Recipe as NormalizedRecipe } from "@/types/database";

// Tenant Module Types
export interface AppRegistry {
  id: string;
  key: string;
  name: string;
  description: string | null;
  is_core: boolean;
  created_at: string;
}

export interface TenantModule {
  id: string;
  tenant_id: string;
  app_id: string;
  enabled: boolean;
  config: any | null;
  activated_at: string | null;
  deactivated_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  apps_registry?: AppRegistry;
}

export type ModuleKey =
  | 'stockqr'
  | 'qrmenu'
  | 'stockqr_orders'
  | 'stockqr_finances'
  | 'stockqr_roles'
  | 'stockqr_menu'
  | 'stockqr_qr_tracking'
  | 'stockqr_stock';

interface AppContextProps {
  barsData: BarData[];
  qrCodesData: QRCodeData[];
  productsData: Product[];
  stocksData: InventoryData[];
  usersData: User[];
  staffData: Staff[];
  recipesData: Recipe[];
  ordersData: Order[];
  notificationsData: Notification[];
  ingredientsData: Ingredient[];
  normalizedRecipesData: NormalizedRecipe[];
  recipesLoading: boolean;
  // Tenant Module Management
  tenantModules: TenantModule[];
  tenantModulesLoading: boolean;
  isModuleEnabled: (moduleKey: ModuleKey) => boolean;
  fetchTenantModules: () => Promise<void>;
  // Existing functions
  fetchOrders: () => Promise<void>;
  fetchBars: () => Promise<void>;
  fetchQRCodes: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStocksOfBar: (barId?: number) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchStaff: (barId?: number | null) => Promise<void>;
  fetchRecipes: () => Promise<void>;
  fetchIngredients: () => Promise<void>;
  fetchNormalizedRecipes: () => Promise<void>;
  uploadImageToSupabase: (
    file: File | Blob,
    fileName: string
  ) => Promise<string | null>;
  fetchNotifications: () => Promise<void>;
  fetchTables: () => Promise<void>;
  tablesData: TableType[];
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Hardcoded tenant ID for paiper-admin
  const TENANT_ID = "070ebdd4-3228-4ee3-a754-be69ce67bd9b";

  const [barsData, setBarsData] = useState<BarData[]>([]);
  const [qrCodesData, setQRCodesData] = useState<QRCodeData[]>([]);
  const [productsData, setProductsData] = useState<Product[]>([]);
  const [stocksData, setStocksData] = useState<InventoryData[]>([]);
  const [usersData, setUsersData] = useState<User[]>([]);
  const [staffData, setStaffData] = useState<Staff[]>([]);
  const [recipesData, setRecipesData] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState<boolean>(false);
  const [ordersData, setOrdersData] = useState<Order[]>([]);
  const [notificationsData, setNotificationsData] = useState<Notification[]>(
    []
  );
  const [tablesData, setTablesData] = useState<TableType[]>([]);
  const [ingredientsData, setIngredientsData] = useState<Ingredient[]>([]);
  const [normalizedRecipesData, setNormalizedRecipesData] = useState<NormalizedRecipe[]>([]);

  // Tenant Module State
  const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
  const [tenantModulesLoading, setTenantModulesLoading] = useState<boolean>(false);

  useEffect(() => {
    const channel = supabase
      .channel("orders_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes
          schema: "public",
          table: "orders",
        },
        async (payload: any) => {
          try {
            fetchOrders();
          } catch (err) {
            console.error("Error processing order update:", err);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
        }
        if (err) {
          console.error("Subscription error:", err);
        }
      });

    //add notification realtime
    const notificationChannel = supabase
      .channel("notifications_realtime_updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        async (payload: any) => {
          try {
            // Skip if no ID (shouldn't happen but safeguards)
            if (!payload.new?.id && payload.eventType != "DELETE") {
              console.warn("Payload missing ID:", payload);
              return;
            }

            // Fetch the full notification with relationships
            const { data: updatedNotification, error } = await supabase
              .from("notifications")
              .select(
                `
                *
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (error) {
              console.error("Error fetching updated notification:", error);
              return;
            }

            setNotificationsData((prev) => {
              switch (payload.eventType) {
                case "INSERT":
                  return [updatedNotification, ...prev];
                case "UPDATE":
                  return prev.map((notification) =>
                    notification.id === updatedNotification.id
                      ? updatedNotification
                      : notification
                  );
                case "DELETE":
                  return prev.filter(
                    (notification) => notification.id !== payload.old.id
                  );
                default:
                  console.warn("Unknown event type:", payload.eventType);
                  return prev;
              }
            });
          } catch (err) {
            console.error("Error processing notification update:", err);
          }
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
        }
        if (err) {
          console.error("Subscription error:", err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notificationChannel);
    };
  }, []);

  // ============================================
  // TENANT MODULE MANAGEMENT
  // ============================================

  /**
   * Fetch all tenant modules for the current tenant
   * Includes the apps_registry data for each module
   */
  const fetchTenantModules = useCallback(async () => {
    try {
      setTenantModulesLoading(true);

      // First, fetch tenant_modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("tenant_modules")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .order("created_by", { ascending: true });

      if (modulesError) {
        console.error("Error fetching tenant modules:", modulesError);
        throw modulesError;
      }

      // Then, fetch the corresponding apps_registry data for each module
      if (modulesData && modulesData.length > 0) {
        const appIds = modulesData.map((m) => m.app_id);

        const { data: appsData, error: appsError } = await supabase
          .from("apps_registry")
          .select("id, key, name, description, is_core")
          .in("id", appIds);

        if (appsError) {
          console.error("Error fetching apps registry:", appsError);
          // Continue even if apps fetch fails, but log the error
        }

        // Merge the data
        const mergedData = modulesData.map((module) => ({
          ...module,
          apps_registry: appsData?.find((app) => app.id === module.app_id) || null,
        }));
        setTenantModules(mergedData);
      } else {
        setTenantModules([]);
      }
    } catch (error: any) {
      console.error("Error fetching tenant modules:", error.message);
      setTenantModules([]);
    } finally {
      setTenantModulesLoading(false);
    }
  }, [TENANT_ID]);

  /**
   * Check if a specific module is enabled for the current tenant
   * @param moduleKey - The key of the module to check (e.g., 'stockqr_orders')
   * @returns boolean - true if the module is enabled, false otherwise
   */
  const isModuleEnabled = useCallback((moduleKey: ModuleKey): boolean => {
    const module = tenantModules.find(
      (m) => m.apps_registry?.key === moduleKey
    );

    if (!module) {
      console.warn(`⚠️ Module '${moduleKey}' not found in tenant modules`);
      return false;
    }

    return module.enabled;
  }, [tenantModules]);

  // ============================================
  // EXISTING FUNCTIONS
  // ============================================

  const uploadImageToSupabase = async (file: File | Blob, fileName: string) => {
    try {
      // Generate unique filename
      const fileExt = fileName.split(".").pop();
      const filePath = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabaseServerClient.storage
        .from("images-paiper") // your bucket name
        .upload(filePath, file);
      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabaseServerClient.storage
        .from("images-paiper")
        .getPublicUrl(data.path);
      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch notifications");
      }

      const data = await response.json();
      setNotificationsData(data);
    } catch (error: any) {
      console.error("Error fetching notifications:", error.message);
    }
  },[]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch orders");
      }

      const data = await response.json();
      setOrdersData(data);
    } catch (error: any) {
      console.error("Error fetching orders:", error.message);
    }
  };

  const fetchBars = useCallback(async () => {
    try {
      const response = await fetch("/api/bars", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch bars");
      }

      const data = await response.json();
      setBarsData(data);
    } catch (error: any) {
      console.error("Error fetching bars:", error.message);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch("/api/products", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch bars");
      }

      const data = await response.json();
      setProductsData(data);
    } catch (error: any) {
      console.error("Error fetching bars:", error.message);
    }
  }, []);

  const fetchQRCodes = async () => {
    try {
      const response = await fetch("/api/qr-codes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch QR codes");
      }

      const data = await response.json();
      setQRCodesData(data);
    } catch (error: any) {
      console.error("Error fetching QR codes:", error.message);
    }
  };

  const fetchTables = useCallback(async () => {
    try {
      const response = await fetch("/api/tables", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch tables");
      }

      const data = await response.json();
      setTablesData(data);
    } catch (error: any) {
      console.error("Error fetching tables:", error.message);
    }
  }, []);

  const fetchStocksOfBar = useCallback(async (barId?: number) => {
    try {
      const response = await fetch(`/api/inventory/${barId ?? ""}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bar");
      }
      const data = await response.json();
      const mappedData = data.map((item: any) => ({
        id: item.id,
        name: item.products?.name || "Unknown",
        category: item.products?.category || "Unknown",
        quantity: item.quantity,
        barId: item.bar_id,
        barName: item.bars?.name || "Unknown",
        productId: item.product_id || null,
      }));
      setStocksData(mappedData);
    } catch (error: any) {
      console.error("Error fetching Stocks:", error.message);
    }
  }, []);

  const fetchStaff = async (barId?: number | null) => {
    try {
      const response = await fetch(`/api/staff/${barId ?? ""}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bar");
      }
      const data = await response.json();
      setStaffData(data);
    } catch (error: any) {
      console.error("Error fetching Staff:", error.message);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bar");
      }
      const data = await response.json();
      setUsersData(data);
    } catch (error: any) {
      console.error("Error fetching Users:", error.message);
    }
  };

  const fetchRecipes = useCallback(async () => {
    try {
      setRecipesLoading(true);
      const res = await fetch("/api/recipe");

      if (!res.ok) {
        throw new Error(`Failed to fetch recipes: ${res.status}`);
      }

      const data = await res.json();

      data.map((recipe: Recipe) => {
        // @ts-ignore
        if (typeof recipe.ingredients === 'string') {
          recipe.ingredients = JSON.parse(recipe.ingredients);
        }
      });

      setRecipesData(data);
    } catch (error) {
      console.error("❌ Error fetching recipes:", error);
      setRecipesData([]);
    } finally {
      setRecipesLoading(false);
    }
  }, []);

  const fetchIngredients = useCallback(async () => {
    try {
      const response = await fetch('/api/ingredients');
      if (response.ok) {
        const data = await response.json();
        setIngredientsData(data);
      } else {
        console.error('Failed to fetch ingredients:', response.status);
        setIngredientsData([]);
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error);
      setIngredientsData([]);
    }
  }, []);

  const fetchNormalizedRecipes = useCallback(async () => {
    try {
      const response = await fetch('/api/recipes');
      if (response.ok) {
        const data = await response.json();
        setNormalizedRecipesData(data);
      } else {
        console.error('Failed to fetch normalized recipes:', response.status);
        setNormalizedRecipesData([]);
      }
    } catch (error) {
      console.error('Error fetching normalized recipes:', error);
      setNormalizedRecipesData([]);
    }
  }, []);

  useEffect(() => {
    fetchTables();
    // Fetch tenant modules on mount
    fetchTenantModules();
    fetchOrders();
    // fetchBars();
    // fetchQRCodes();
  }, [fetchTables, fetchTenantModules]);

  return (
    <AppContext.Provider
      value={{
        barsData,
        qrCodesData,
        productsData,
        stocksData,
        usersData,
        staffData,
        recipesData,
        recipesLoading,
        ordersData,
        notificationsData,
        ingredientsData,
        normalizedRecipesData,
        // Tenant Module Management
        tenantModules,
        tenantModulesLoading,
        isModuleEnabled,
        fetchTenantModules,
        // Existing functions
        fetchOrders,
        fetchStaff,
        fetchBars,
        fetchQRCodes,
        fetchProducts,
        fetchStocksOfBar,
        fetchRecipes,
        fetchIngredients,
        fetchNormalizedRecipes,
        fetchUsers,
        uploadImageToSupabase,
        fetchNotifications,
        fetchTables,
        tablesData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
