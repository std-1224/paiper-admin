"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceMetrics } from "(components)/finance-metrics";
import { SalesAnalysisChart } from "(components)/sales-analysis-chart";
import { TopProducts } from "(components)/top-products";
import { RefreshCwIcon, SearchIcon, CalendarIcon } from "lucide-react";
import Transactions from "pages/transactions";
import { useAppContext } from "@/context/AppContext";
import { Order } from "@/types/types";

const DEFAULT_METRICS = [
  {
    id: "total-sales",
    title: "Ventas Totales",
    value: "$0",
    change: "0% vs mes anterior",
    icon: "chart-line",
    color: "orange",
  },
  {
    id: "completed-orders",
    title: "Pedidos Completados",
    value: "0",
    change: "0% vs mes anterior",
    icon: "check",
    color: "green",
  },
  {
    id: "urgent-orders",
    title: "Margen de beneficio",
    value: "0",
    change: "0% vs mes anterior",
    icon: "alert",
    color: "yellow",
  },
  {
    id: "balance-load",
    title: "Balance Load",
    value: "$0",
    change: "$0 unused balance",
    icon: "plus-circle",
    color: "blue",
  },
];

const TIME_FILTER_OPTIONS = [
  { value: "day", label: "Por día" },
  { value: "week", label: "Por semana" },
  { value: "month", label: "Por mes" },
];

export default function FinancePanel() {
  type TimeFilterType = 'day' | 'week' | 'month';

interface SalesDataEntry {
  time: string;
  sales: number;
}

interface FilteredSalesData {
  day: SalesDataEntry[];
  week: SalesDataEntry[];
  month: SalesDataEntry[];
}

const [timeFilter, setTimeFilter] = useState<TimeFilterType>("week");
  const [activeTab, setActiveTab] = useState("general");
  const { ordersData, fetchOrders } = useAppContext();
  const [metricsData, setMetricsData] = useState(DEFAULT_METRICS);
  const [balanceTransactions, setBalanceTransactions] = useState<any[]>([]);
  const [userBalances, setUserBalances] = useState<any[]>([]);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filteredSalesData, setFilteredSalesData] = useState<FilteredSalesData>({
    day: [],
    week: [],
    month: [],
  });

  // Comprehensive refresh function
  const refreshAllData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchBalanceTransactions(),
        fetchUserBalances()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchOrders]);

  // Fetch balance transactions function
  const fetchBalanceTransactions = useCallback(async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setBalanceTransactions(data);
      }
    } catch (error) {
      console.error('Error fetching balance transactions:', error);
    }
  }, []);

  // Fetch user balances function
  const fetchUserBalances = useCallback(async () => {
    try {
      const response = await fetch('/api/user-balances');
      if (response.ok) {
        const data = await response.json();
        setUserBalances(data);
      }
    } catch (error) {
      console.error('Error fetching user balances:', error);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);



  // Memoized calculation of metrics
  const calculateMetrics = useCallback(() => {
    if (!ordersData?.length && !balanceTransactions?.length) return DEFAULT_METRICS;

    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Apply date range filtering if dates are provided
    let filteredOrders = ordersData || [];
    let filteredBalanceTransactions = balanceTransactions || [];

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999); // Include the entire end date

      filteredOrders = ordersData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= from && orderDate <= to;
      }) || [];

      filteredBalanceTransactions = balanceTransactions?.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        return transactionDate >= from && transactionDate <= to;
      }) || [];
    }

    const filterByMonth = (orders: Order[], monthOffset = 0) => 
      orders.filter(order => {
        const orderDate = new Date(order.created_at);
        const targetMonth = currentMonth - monthOffset;
        const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;

        return (
          orderDate.getMonth() === (targetMonth + 12) % 12 &&
          orderDate.getFullYear() === targetYear
        );
      });

    // Use filtered data for calculations
    const lastMonthOrders = fromDate && toDate ? [] : filterByMonth(ordersData || [], 1);
    const thisMonthOrders = fromDate && toDate ? filteredOrders : filterByMonth(filteredOrders);

    const calculateChange = (current: number, previous: number) =>
      previous === 0 ? 0 : ((current - previous) / previous) * 100;

    // Only count sales from delivered orders
    const totalSales = filteredOrders.filter(order => order.status === 'delivered' || order.status === 'approved').reduce((total, order) => total + (order.total_amount || 0), 0);
    const thisMonthSales = thisMonthOrders.filter(order => order.status === 'delivered' || order.status === 'approved').reduce((total, order) => total + (order.total_amount || 0), 0);
    const lastMonthSales = lastMonthOrders.filter(order => order.status === 'delivered' || order.status === 'approved').reduce((total, order) => total + (order.total_amount || 0), 0);
    const salesChange = fromDate && toDate ? 0 : calculateChange(thisMonthSales, lastMonthSales);

    const completedOrders = filteredOrders.filter(order => order.status === 'delivered').length;
    const lastMonthCompleted = lastMonthOrders.filter(order => order.status === 'delivered').length;
    const completedChange = fromDate && toDate ? 0 : calculateChange(completedOrders, lastMonthCompleted);

    const urgentOrders = filteredOrders.filter(order => order.status === 'urgent').length;
    const lastMonthUrgent = lastMonthOrders.filter(order => order.status === 'urgent').length;
    const urgentChange = fromDate && toDate ? 0 : calculateChange(urgentOrders, lastMonthUrgent);

    // Calculate balance load metrics
    const thisMonthBalanceTransactions = fromDate && toDate
      ? filteredBalanceTransactions
      : balanceTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          return (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          );
        });

    const lastMonthBalanceTransactions = fromDate && toDate
      ? []
      : balanceTransactions.filter(transaction => {
          const transactionDate = new Date(transaction.created_at);
          const targetMonth = currentMonth - 1;
          const targetYear = targetMonth < 0 ? currentYear - 1 : currentYear;
          return (
            transactionDate.getMonth() === (targetMonth + 12) % 12 &&
            transactionDate.getFullYear() === targetYear
          );
        });

    const totalBalanceLoaded = thisMonthBalanceTransactions.reduce((total, transaction) =>
      total + (transaction.amount || 0), 0);
    const lastMonthBalanceLoaded = lastMonthBalanceTransactions.reduce((total, transaction) =>
      total + (transaction.amount || 0), 0);
    const balanceLoadChange = fromDate && toDate ? 0 : calculateChange(totalBalanceLoaded, lastMonthBalanceLoaded);

    // Calculate total unused balance across all users
    const totalUnusedBalance = userBalances.reduce((total, user) =>
      total + (user.balance || 0), 0);

    const dateRangeLabel = fromDate && toDate
      ? `${fromDate} to ${toDate}`
      : "vs mes anterior";

    return [
      {
        id: "total-sales",
        title: "Ventas Totales",
        value: `$${totalSales.toFixed(2)}`,
        change: fromDate && toDate ? dateRangeLabel : `${salesChange.toFixed(2)}% vs mes anterior`,
        icon: "chart-line",
        color: "orange",
      },
      {
        id: "completed-orders",
        title: "Pedidos Completados",
        value: `${completedOrders}`,
        change: fromDate && toDate ? dateRangeLabel : `${completedChange.toFixed(2)}% vs mes anterior`,
        icon: "check",
        color: "green",
      },
      {
        id: "urgent-orders",
        title: "Margen de beneficio",
        value: `${urgentOrders}`,
        change: fromDate && toDate ? dateRangeLabel : `${urgentChange.toFixed(2)}% vs mes anterior`,
        icon: "alert",
        color: "yellow",
      },
      {
        id: "balance-load",
        title: "Balance Load",
        value: `$${totalBalanceLoaded.toFixed(2)}`,
        change: `$${totalUnusedBalance.toFixed(2)} unused balance`,
        icon: "plus-circle",
        color: "blue",
      },
    ];
  }, [ordersData, balanceTransactions, userBalances, fromDate, toDate]);


  // if (timeFilter === 'day') {
  //   // Hourly data for a day
  //   for (let i = 0; i < 24; i++) {
  //     data.push({
  //       time: `${i}:00`,
  //       sales: Math.floor(Math.random() * 1000) + 800,
  //     });
  //   }
  // } else if (timeFilter === 'week') {
  //   // Daily data for a week
  //   const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  //   for (let i = 0; i < 7; i++) {
  //     data.push({
  //       time: days[i],
  //       sales: Math.floor(Math.random() * 2000) + 1500,
  //     });
  //   }
  // } else {
  //   // Monthly data for a year
  //   const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  //   for (let i = 0; i < 12; i++) {
  //     data.push({
  //       time: months[i],
  //       sales: Math.floor(Math.random() * 3000) + 2000,
  //     });
  //   }
  // }
  useEffect(() => {
    if (!ordersData?.length) return;

    // Apply date range filtering and status filtering to orders data
    // Only include orders with "delivered" status for sales analysis
    let filteredOrdersForChart = ordersData.filter(order => order.status === 'delivered' || order.status === 'approved');

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      filteredOrdersForChart = filteredOrdersForChart.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= from && orderDate <= to;
      });
    }
  
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentDay = now.getDate();
    const currentDayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
  
    // Initialize aggregators
    const hourlySales: Record<string, number> = {};
    const dailySales: Record<string, number> = {};
    const monthlySales: Record<string, number> = {};
  
    // Calculate start of week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(currentDay - currentDayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
  
    // Calculate start of month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
  
    filteredOrdersForChart.forEach(order => {
      const orderDate = new Date(order.created_at);
      const sales = order.total_amount || 0;
  
      // TODAY - Hourly data
      if (orderDate.getDate() === currentDay && 
          orderDate.getMonth() === currentMonth && 
          orderDate.getFullYear() === currentYear) {
        const hourKey = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
        hourlySales[hourKey] = (hourlySales[hourKey] || 0) + sales;
      }
  
      // THIS WEEK - Daily data
      if (orderDate >= startOfWeek && orderDate <= now) {
        const dayKey = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
        dailySales[dayKey] = (dailySales[dayKey] || 0) + sales;
      }
  
      // THIS MONTH - Daily data
      if (orderDate >= startOfMonth && orderDate <= now) {
        const dayKey = `${orderDate.getDate().toString().padStart(2, '0')}/${(orderDate.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlySales[dayKey] = (monthlySales[dayKey] || 0) + sales;
      }
    });
  
    // Process today's hourly data (00:00 to 23:00)
    const todayHourlyData = Array.from({ length: 24 }, (_, hour) => {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      return {
        time,
        sales: hourlySales[time] || 0
      };
    });
  
    // Process this week's daily data
    const thisWeekDailyData = [];
    const tempDate = new Date(startOfWeek);
    while (tempDate <= now) {
      const dayKey = `${tempDate.getDate().toString().padStart(2, '0')}/${(tempDate.getMonth() + 1).toString().padStart(2, '0')}`;
      thisWeekDailyData.push({
        time: dayKey,
        sales: dailySales[dayKey] || 0
      });
      tempDate.setDate(tempDate.getDate() + 1);
    }
  
    // Process this month's daily data
    const thisMonthDailyData = [];
    const tempMonthDate = new Date(startOfMonth);
    while (tempMonthDate <= now) {
      const dayKey = `${tempMonthDate.getDate().toString().padStart(2, '0')}/${(tempMonthDate.getMonth() + 1).toString().padStart(2, '0')}`;
      thisMonthDailyData.push({
        time: dayKey,
        sales: monthlySales[dayKey] || 0
      });
      tempMonthDate.setDate(tempMonthDate.getDate() + 1);
    }
  
    setFilteredSalesData({
      day: todayHourlyData,
      week: thisWeekDailyData,
      month: thisMonthDailyData
    });
  }, [ordersData, fromDate, toDate]);

  // Update metrics when ordersData changes
  React.useEffect(() => {
    setMetricsData(calculateMetrics());
  }, [calculateMetrics]);

  // Memoized top products data
  const topProductsData = useMemo(() => {
    if (!ordersData?.length) return [];

    // Apply date range filtering and status filtering to orders data
    // Only include orders with "delivered" status for top products calculation
    let filteredOrdersForProducts = ordersData.filter(order => order.status === 'delivered' || order.status === 'approved');

    if (fromDate && toDate) {
      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      filteredOrdersForProducts = filteredOrdersForProducts.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= from && orderDate <= to;
      });
    }

    const orderItems = filteredOrdersForProducts.flatMap(order => order.order_items);
    const productSales = orderItems.reduce((acc, item) => {
      if (!item?.product_id) return acc;
      if (!acc[item?.product_id]) {
        acc[item?.product_id] = {
          id: item?.product_id?.toString() || '',
          name: item?.products?.name || "Unknown",
          sales: 0,
          revenue: '0',
        };
      }
      acc[item?.product_id].sales += item.quantity;
      const currentRevenue = parseFloat(acc[item?.product_id].revenue) + (item.quantity * (item?.unit_price || 0));
      acc[item?.product_id].revenue = currentRevenue.toString();
      return acc;
    }, {} as Record<string, { id: string; name: string; sales: number; revenue: string }>);
    const topProducts = Object.values(productSales)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4 );
    return topProducts;
  }, [ordersData, fromDate, toDate]);


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel de Finanzas</h1>
          <p className="text-muted-foreground">Resumen financiero del negocio</p>
        </div>
      </div>

      <FinanceMetrics data={metricsData} />

      <div className="flex justify-between items-center">
        <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="general">Vista General</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "general" ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Análisis de Ventas</h2>
            <div className="flex items-center space-x-2">
              {TIME_FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={timeFilter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTimeFilter(option.value as TimeFilterType)}
                  className="rounded-full"
                >
                  {option.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshAllData}
                disabled={isRefreshing}
              >
                <RefreshCwIcon className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground dark:text-gray-400">From:</span>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border-0 p-0 h-auto w-auto dark:bg-transparent dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md p-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground dark:text-gray-400">To:</span>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border-0 p-0 h-auto w-auto dark:bg-transparent dark:text-white"
                />
              </div>

              {(fromDate || toDate) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear Dates
                </Button>
              )}
            </div>
          </div>

          <div className="relative w-full max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar transacciones..." className="pl-10" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-lg border p-6">
              <SalesAnalysisChart data={filteredSalesData[timeFilter]} />
            </div>
            <div className="bg-card rounded-lg border p-6">
              <TopProducts products={topProductsData} />
            </div>
          </div>
        </div>
      ) : (
        <Transactions />
      )}
    </div>
  );
}