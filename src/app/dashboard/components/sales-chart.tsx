"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, CartesianGrid, LineChart, Line, Cell } from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";

// Define payment method type
type PaymentMethod = "mercadopago" | "cash" | "balance";

export function SalesChart() {
  const [activeChart, setActiveChart] = useState("payment");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ordersData } = useAppContext();

  const [gifts, setGifts] = useState([]);

  const fetchGifts = async () => {
    const res = await fetch("/api/gifts", {
      method: "GET",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch gifts");
    }
    const data = await res.json();
    console.log("Gifts data:", data);
    setGifts(data);
  };

  // State for payment methods data
  const [paymentMethodData, setPaymentMethodData] = useState([
    { name: "Mercado Pago", value: 0, color: "hsl(var(--chart-1))" },
    { name: "Cash", value: 0, color: "hsl(var(--chart-2))" },
    { name: "Balance", value: 0, color: "hsl(var(--chart-3))" },
    { name: "Gifts", value: 0, color: "hsl(var(--chart-4))" },
    { name: "Courtesy Transactions", value: 0, color: "hsl(var(--chart-5))" },
    { name: "PR Tokens", value: 0, color: "#8b5cf6" },
  ]);

  // State for peak hours data
  const [peakHoursData, setPeakHoursData] = useState([
    { hour: "8AM", orders: 0 },
    { hour: "10AM", orders: 0 },
    { hour: "12PM", orders: 0 },
    { hour: "2PM", orders: 0 },
    { hour: "4PM", orders: 0 },
    { hour: "6PM", orders: 0 },
    { hour: "8PM", orders: 0 },
    { hour: "10PM", orders: 0 },
  ]);

  

  // Fetch payment methods data
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Fetch today's orders with payment method
        // const { data: orders, error: ordersError } = await supabase
        // 	.from('orders')
        // 	.select('payment_method, total_amount, status')
        // 	.gte('created_at', today.toISOString())
        // 	.lt('created_at', tomorrow.toISOString())
        // 	.eq('status', 'delivered'); // Only count delivered orders
        const orders = ordersData?.filter(
          (order) =>
            order.status === "delivered" &&
            order.created_at >= today.toISOString() &&
            order.created_at < tomorrow.toISOString()
        );
        if (!orders) throw new Error("No orders found");

        // Calculate total by payment method
        const paymentTotals = {
          mercadopago: 0,
          cash: 0,
          balance: 0,
        };
        orders.forEach((order) => {
          if (order.payment_method && order.total_amount) {
            const method = order.payment_method as PaymentMethod;
            if (method in paymentTotals) {
              paymentTotals[method] += order.total_amount;
            }
          }
        });

        // Calculate courtesy and PR token transactions
        let courtesyCount = 0;
        let prTokenCount = 0;

        // Fetch products data to check is_courtsey and is_pr flags
        const productsResponse = await fetch('/api/products');
        const productsData = await productsResponse.json();

        // Create a map for quick product lookup
        const productsMap = new Map();
        productsData.forEach((product: any) => {
          productsMap.set(product.id, product);
        });

        // Count courtesy and PR token transactions from today's orders
        orders.forEach((order) => {
          if (order.order_items) {
            order.order_items.forEach((item: any) => {
              const product = productsMap.get(item.product_id);
              if (product) {
                if (product.is_courtsey) {
                  courtesyCount += item.quantity;
                }
                if (product.is_pr) {
                  prTokenCount += item.quantity;
                }
              }
            });
          }
        });

        // Update payment method data including courtesy and PR tokens
        setPaymentMethodData([
          { name: "Mercado Pago", value: paymentTotals.mercadopago, color: "hsl(var(--chart-1))" },
          { name: "Cash", value: paymentTotals.cash, color: "hsl(var(--chart-2))" },
          { name: "Balance", value: paymentTotals?.balance, color: "hsl(var(--chart-3))" },
          // { name: "Gifts", value: 0, color: "hsl(var(--chart-4))" }, // You can implement gifts logic if needed
          { name: "Courtesy Transactions", value: courtesyCount, color: "hsl(var(--chart-5))" },
          { name: "PR Tokens", value: prTokenCount, color: "#8b5cf6" },
        ]);

        // Fetch orders for peak hours analysis
        const allOrders = ordersData?.filter(
          (order) =>
            order.status === "delivered" &&
            order.created_at >= today.toISOString() &&
            order.created_at < tomorrow.toISOString()
        );
        if (!allOrders) throw new Error("No orders found");

        // Initialize hour counts
        const hourCounts = {
          "8AM": 0,
          "10AM": 0,
          "12PM": 0,
          "2PM": 0,
          "4PM": 0,
          "6PM": 0,
          "8PM": 0,
          "10PM": 0,
        };

        // Count orders by hour
        allOrders.forEach((order) => {
          const orderDate = new Date(order.created_at);
          const hour = orderDate.getHours();

          // Map hours to our display format
          if (hour >= 8 && hour < 10) hourCounts["8AM"]++;
          else if (hour >= 10 && hour < 12) hourCounts["10AM"]++;
          else if (hour >= 12 && hour < 14) hourCounts["12PM"]++;
          else if (hour >= 14 && hour < 16) hourCounts["2PM"]++;
          else if (hour >= 16 && hour < 18) hourCounts["4PM"]++;
          else if (hour >= 18 && hour < 20) hourCounts["6PM"]++;
          else if (hour >= 20 && hour < 22) hourCounts["8PM"]++;
          else if (hour >= 22 || hour < 8) hourCounts["10PM"]++;
        });

        // Update peak hours data
        setPeakHoursData([
          { hour: "8AM", orders: hourCounts["8AM"] },
          { hour: "10AM", orders: hourCounts["10AM"] },
          { hour: "12PM", orders: hourCounts["12PM"] },
          { hour: "2PM", orders: hourCounts["2PM"] },
          { hour: "4PM", orders: hourCounts["4PM"] },
          { hour: "6PM", orders: hourCounts["6PM"] },
          { hour: "8PM", orders: hourCounts["8PM"] },
          { hour: "10PM", orders: hourCounts["10PM"] },
        ]);
      } catch (err) {
        console.error("Error fetching sales data:", err);
        setError("Error loading sales data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentData();
  }, [ordersData]);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="payment" onValueChange={setActiveChart}>
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger
            value="payment"
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
          >
            Sales by Payment Method
          </TabsTrigger>
          <TabsTrigger
            value="peak"
            className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
          >
            Peak Order Hours
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
          {error}
        </div>
      )}

      <div className="h-[300px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-pulse text-gray-400">
              Loading chart data...
            </div>
          </div>
        ) : activeChart === "payment" ? (
          <ChartContainer config={{}} className="aspect-[none] h-full">
            <BarChart data={paymentMethodData}>
              <ChartTooltip content={<ChartTooltipContent />} />

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af" }}
              />

              <Bar
                dataKey="value"
                fill="hsl(var(--chart-1))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <ChartContainer config={{}} className="aspect-[none] h-full">
            <LineChart data={peakHoursData}>
              <ChartTooltip content={<ChartTooltipContent />} />

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />

              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#9ca3af" }}
              />

              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
