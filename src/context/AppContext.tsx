import React, { createContext, useContext, useState, useEffect } from "react";
import { BarData, Product, InventoryData, Notification } from "@/types/types";
import { QRCodeData } from "@/types/types";
import { User, Staff } from "@/types/types";
import { Recipe } from "@/types/types";
import { Order } from "@/types/types";
import { supabase, supabaseServerClient } from "@/lib/supabaseClient";

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
  recipesLoading: boolean;
  fetchOrders: () => Promise<void>;
  fetchBars: () => Promise<void>;
  fetchQRCodes: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchStocksOfBar: (barId?: number) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchStaff: (barId?: number | null) => Promise<void>;
  fetchRecipes: () => Promise<void>;
  uploadImageToSupabase: (
    file: File | Blob,
    fileName: string
  ) => Promise<string | null>;
  fetchNotifications: () => Promise<void>;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

  const fetchNotifications = async () => {
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
  };

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

  const fetchBars = async () => {
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
  };

  const fetchProducts = async () => {
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
  };

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

  const fetchStocksOfBar = async (barId?: number) => {
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
  };

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

  const fetchRecipes = async () => {
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
  };

  useEffect(() => {
    fetchOrders();
    // fetchBars();
    // fetchQRCodes();
  }, []);

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
        fetchOrders,
        fetchStaff,
        fetchBars,
        fetchQRCodes,
        fetchProducts,
        fetchStocksOfBar,
        fetchRecipes,
        fetchUsers,
        uploadImageToSupabase,
        fetchNotifications,
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
