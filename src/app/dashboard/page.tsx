"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, GiftIcon, BellIcon, PrinterIcon } from "lucide-react";
import { MetricsCard } from "(components)/metrics-card";
import { LiveOrders } from "(components)/live-orders";
import { SalesChart } from "@/app/dashboard/components/sales-chart";
import { DailySummary } from "(components)/daily-summary";
import { GiftButton } from "(components)/gift-button";
import { GiftHistory } from "(components)/gift-history";
import { GiftNotification } from "(components)/gift-notification";
import { GiftService } from "(components)/gift-service";
import { ProfitabilitySummary } from "../(components)/profitability-summary";
import { AlertSection } from "../(components)/alert-section";
import { createSupaClient } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";
import { Order } from "@/types/types";
import { useAuth } from "@/context/AuthContext";

// Default metrics data structure
const DEFAULT_METRICS = [
  {
    id: "total-sales",
    title: "Total Sales Today",
    value: "$0",
    change: "0%",
    icon: "dollar",
    iconColor: "text-green-500",
    iconBg: "bg-green-100 dark:bg-green-900/20",
  },
  {
    id: "pending-orders",
    title: "Pending Orders",
    value: "0",
    subtext: "0 urgent",
    icon: "clock",
    iconColor: "text-orange-500",
    iconBg: "bg-orange-100 dark:bg-orange-900/20",
  },
  {
    id: "active-users",
    title: "Active Users",
    value: "0",
    change: "+0 today",
    icon: "users",
    iconColor: "text-blue-500",
    iconBg: "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id: "completed-orders",
    title: "Completed Orders Today",
    value: "0",
    change: "0%",
    icon: "check",
    iconColor: "text-purple-500",
    iconBg: "bg-purple-100 dark:bg-purple-900/20",
  },
];

// Default daily summary data structure
const DEFAULT_DAILY_SUMMARY = [
  {
    id: "daily-orders",
    title: "Order Management",
    value: "0",
    change: "0%",
    icon: "clipboard",
  },
  {
    id: "daily-sales",
    title: "Total Sales",
    value: "$0",
    change: "0%",
    icon: "dollar",
  },
  {
    id: "daily-users",
    title: "Active Users",
    value: "0",
    change: "0%",
    icon: "users",
  },
];

export default function Dashboard() {
  const [isGiftHistoryOpen, setIsGiftHistoryOpen] = useState(false);
  const [showGiftNotification, setShowGiftNotification] = useState(false);
  const [isGiftServiceOpen, setIsGiftServiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fetchOrders, fetchProducts, ordersData } = useAppContext();
  const [metricsData, setMetricsData] = useState(DEFAULT_METRICS);
  const [dailySummaryData, setDailySummaryData] = useState(
    DEFAULT_DAILY_SUMMARY
  );

  const { user } = useAuth();

  // Memoized date calculations
  const dateRanges = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      today,
      tomorrow: new Date(new Date(today).setDate(today.getDate() + 1)),
      yesterday: new Date(new Date(today).setDate(today.getDate() - 1)),
      last24Hours: new Date(new Date().setHours(new Date().getHours() - 24)),
    };
  }, []);

  // Process orders and calculate metrics
  const processOrders = useCallback(
    (orders: Order[]) => {
      const { today, tomorrow, yesterday, last24Hours } = dateRanges;

      // Filter orders by date ranges
      const todayOrders = orders.filter(
        (order) =>
          new Date(order.created_at) >= today &&
          new Date(order.created_at) < tomorrow
      );

      const yesterdayOrders = orders.filter(
        (order) =>
          new Date(order.created_at) >= yesterday &&
          new Date(order.created_at) < today
      );

      const last24HoursOrders = orders.filter(
        (order) => new Date(order.created_at) >= last24Hours
      );

      // Calculate sales totals - only count delivered orders (approved sales)
      const todayDeliveredOrders = todayOrders.filter(
        (order) => order.status === "delivered"
      );
      const yesterdayDeliveredOrders = yesterdayOrders.filter(
        (order) => order.status === "delivered"
      );

      const todayTotalSales = todayDeliveredOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      const yesterdayTotalSales = yesterdayDeliveredOrders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      // Calculate percentages
      const salesChangePercent =
        yesterdayTotalSales > 0
          ? (
              ((todayTotalSales - yesterdayTotalSales) / yesterdayTotalSales) *
              100
            ).toFixed(1)
          : "0";

      const completedOrdersChangePercent =
        yesterdayOrders.length > 0
          ? (
              ((todayOrders.length - yesterdayOrders.length) /
                yesterdayOrders.length) *
              100
            ).toFixed(1)
          : "0";

      // Process pending and urgent orders
      const pendingOrders = last24HoursOrders.filter(
        (order) => order.status === "pending"
      );
      const urgentOrders = pendingOrders.filter((order) => {
        const orderTime = new Date(order.created_at);
        return (Date.now() - orderTime.getTime()) / (1000 * 60) > 30;
      });

      // Count unique users
      const uniqueUsers = new Set(
        last24HoursOrders
          .filter((order) => order.user_id)
          .map((order) => order.user_id)
      );

      return {
        todayTotalSales,
        salesChangePercent,
        pendingOrders,
        urgentOrders,
        uniqueUsers,
        todayOrders,
        completedOrdersChangePercent,
      };
    },
    [dateRanges]
  );

  // Fetch and update metrics data
  const fetchMetricsData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!ordersData) {
        throw new Error("No orders data available");
      }

      const {
        todayTotalSales,
        salesChangePercent,
        pendingOrders,
        urgentOrders,
        uniqueUsers,
        todayOrders,
        completedOrdersChangePercent,
      } = processOrders(ordersData);

      // Update metrics data
      setMetricsData([
        {
          ...DEFAULT_METRICS[0],
          value: `$${todayTotalSales.toFixed(2)}`,
          change: `${salesChangePercent}%`,
          subtext: undefined,
        },
        {
          ...DEFAULT_METRICS[1],
          value: pendingOrders.length.toString(),
          subtext: `${urgentOrders.length} urgent`,
          change: undefined,
        },
        {
          ...DEFAULT_METRICS[2],
          value: uniqueUsers.size.toString(),
          change: `+${uniqueUsers.size} today`,
          subtext: undefined,
        },
        {
          ...DEFAULT_METRICS[3],
          value: todayOrders.length.toString(),
          change: `${completedOrdersChangePercent}%`,
          subtext: undefined,
        },
      ]);

      // Update daily summary data
      setDailySummaryData([
        {
          ...DEFAULT_DAILY_SUMMARY[0],
          value: todayOrders.length.toString(),
          change: `${completedOrdersChangePercent}%`,
        },
        {
          ...DEFAULT_DAILY_SUMMARY[1],
          value: `$${todayTotalSales.toFixed(2)}`,
          change: `${salesChangePercent}%`,
        },
        {
          ...DEFAULT_DAILY_SUMMARY[2],
          value: uniqueUsers.size.toString(),
          change: `${uniqueUsers.size}%`,
        },
      ]);
    } catch (err) {
      console.error("Error fetching metrics data:", err);
      setError(
        err instanceof Error ? err.message : "Error loading dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  }, [ordersData, processOrders]);

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // Update metrics when ordersData changes
  useEffect(() => {
    if (ordersData?.length > 0) {
      fetchMetricsData();
    }
  }, [ordersData, fetchMetricsData]);

  // Loading skeletons
  const loadingSkeletons = useMemo(
    () =>
      Array(4)
        .fill(0)
        .map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 h-32 animate-pulse"
          />
        )),
    []
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">Bienvenido</h1>
        </div>
        {/* <div className="flex space-x-2">
          <Button
            variant="outline"
            className="flex items-center dark:border-gray-700 dark:text-gray-300"
            onClick={() => setIsGiftHistoryOpen(true)}
          >
            <GiftIcon className="mr-2 h-4 w-4 text-purple-500" />
            Regalos
          </Button>
          <Button
            variant="outline"
            className="flex items-center dark:border-gray-700 dark:text-gray-300"
            onClick={() => setShowGiftNotification(true)}
          >
            <BellIcon className="mr-2 h-4 w-4 text-blue-500" />
            Notificaciones
          </Button>
          <Button
            variant="outline"
            className="flex items-center dark:border-gray-700 dark:text-gray-300"
            onClick={() => setIsGiftServiceOpen(true)}
          >
            <GiftIcon className="mr-2 h-4 w-4 text-purple-500" />
            Enviar Regalo
          </Button>
        </div> */}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading
          ? loadingSkeletons
          : metricsData.map((metric) => (
              <MetricsCard key={metric.id} data={metric} />
            ))}
      </div>

      {/* Sales Analysis and Live Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-card rounded-lg border dark:bg-gray-900 dark:border-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-6 dark:text-white">
            Sales Analysis
          </h2>
          <SalesChart />
        </div>
        <LiveOrders />
      </div>

      {/* Profitability Summary and Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <ProfitabilitySummary onViewDetails={() => {}} />
        <AlertSection />
      </div>

      {/* Gift Components */}
      <GiftButton />

      <GiftHistory
        isOpen={isGiftHistoryOpen}
        onClose={() => setIsGiftHistoryOpen(false)}
      />

      {showGiftNotification && (
        <GiftNotification onClose={() => setShowGiftNotification(false)} />
      )}

      <GiftService
        isOpen={isGiftServiceOpen}
        onClose={() => setIsGiftServiceOpen(false)}
      />
    </div>
  );
}
