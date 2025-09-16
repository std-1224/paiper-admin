"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderCard } from "(components)/order-card";
import { OrderMetrics } from "(components)/order-metrics";
import { QrScanner } from "(components)/qr-scanner";
import {
  RefreshCwIcon,
  FilterIcon,
  SearchIcon,
  XIcon,
  QrCodeIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useAppContext } from "@/context/AppContext";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { shortenId } from "@/lib/utils";
import type { MetricData, Order } from "@/types/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Product } from "@/types/types";
import { useSearchParams } from "next/navigation";
import { ACTION_BUTTONS } from "(components)/order-card";
import { useAuth } from "@/context/AuthContext";

// Constants
const STATUS_CONFIG = {
  pending: { label: "Nuevo", color: "blue" },
  preparing: { label: "En Preparación", color: "orange" },
  ready: { label: "Listo", color: "green" },
  delayed: { label: "Demorado", color: "red" },
  delivered: { label: "Entregado", color: "purple" },
  cancelled: { label: "Cancelado", color: "gray" },
};

const DEFAULT_METRICS = Object.entries(STATUS_CONFIG).map(
  ([status, config], index) => ({
    id: `${status}-orders`,
    title: config.label,
    value: "0",
    icon: ["shopping-cart", "clock", "check", "clock", "archive", "x"][index],
    color: config.color,
  })
);

const FILTER_OPTIONS = [
  { value: "all", label: "Todos" },
  ...Object.entries(STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  })),
];

export default function OrdersManagement() {
  // get query param
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  // State
  const [activeFilter, setActiveFilter] = useState<Order["status"] | "all">(
    "all"
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const { ordersData, productsData, fetchOrders, fetchProducts } =
    useAppContext();
  const [confirmType, setConfirmType] = useState<"cancel" | "delete" | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");

  const { user } = useAuth();

  useEffect(() => {
    if (!orderId) return;
    const order = ordersData.find((order) => order.id == orderId);
    if (!order) return;
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, [orderId, ordersData]);

  // Process orders to mark delayed ones
  const processedOrders = ordersData.map((order) => {
    const orderAgeInSeconds =
      (Date.now() - new Date(order.created_at).getTime()) / 1000;
    return orderAgeInSeconds > 600 && order.status === "pending"
      ? { ...order, status: "delayed" }
      : order;
  });

  const filteredOrders =
    activeFilter === "all"
      ? processedOrders
      : processedOrders.filter((order) => order.status === activeFilter);

  // Filter orders based on active filter
  const filteredOrdersBySearch = useMemo(() => {
    if (!searchTerm) return filteredOrders;
    return filteredOrders.filter(
      (order) =>
        order?.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id == searchTerm
    );
  }, [filteredOrders, searchTerm]);
  // Calculate metrics
  const metricsData = useMemo(() => {
    const metrics = DEFAULT_METRICS.map((metric) => ({
      ...metric,
      value: "0",
    }));

    processedOrders.forEach((order) => {
      const metricIndex = Object.keys(STATUS_CONFIG).indexOf(order.status);
      if (metricIndex >= 0) {
        metrics[metricIndex].value = (
          parseInt(metrics[metricIndex].value) + 1
        ).toString();
      }
    });

    return metrics;
  }, [processedOrders]);

  // Handlers
  const handleOrderDetail = useCallback(
    (result: string) => {
      const order = processedOrders.find((order) => order.id === result);
      if (order) {
        setSelectedOrder(order);
        setIsOrderDetailsOpen(true);
      }
      setQrDialogOpen(false);
    },
    [processedOrders]
  );

  const hadleQrCodeScanned = async (result: string) => {
    const order = processedOrders.find((order) => order.id == result);
    if (order) {
      if (order.status == "paying") {
        toast({
          variant: "destructive",
          title: "Error",
          description: "El pedido está en estado de pago",
        });
        return;
      }
      // const response = await fetch(`/api/orders`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     id: order?.id,
      //     status: "delivered",
      //   }),
      // });
    }
    fetchOrders();
  };

  const renderFilterButton = useCallback(
    (filter: Order["status"] | "all", label: string, index: number) => (
      <Button
        key={index}
        variant={activeFilter === filter ? "default" : "outline"}
        size="sm"
        onClick={() => setActiveFilter(filter)}
        className={`rounded-full ${activeFilter === filter
            ? `bg-${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.color ||
            "blue"
            }-600 hover:bg-${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.color ||
            "blue"
            }-700`
            : ""
          }`}
      >
        {label}
      </Button>
    ),
    [activeFilter]
  );

  // Effects
  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const handleDeleteOrderConfirm = async () => {
    try {
      const response = await fetch(`/api/orders`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedOrderId }),
      });
      if (!response.ok) {
        throw new Error("Failed to delete order");
      }
      fetchOrders();
      toast({
        variant: "default",
        title: "Success",
        description: "Order deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
    }
    setIsConfirmDialogOpen(false);
    setSelectedOrderId(null);
  };

  const handleDeleteOrderCancel = () => {
    setSelectedOrderId(null);
    setIsConfirmDialogOpen(false);
  };

  const handleDeleteOrder = async (id: string) => {
    setConfirmType("delete");
    setSelectedOrderId(id);
    setIsConfirmDialogOpen(true);
  };

  const handleCancelOrder = async (id: string) => {
    setConfirmType("cancel");
    setSelectedOrderId(id);
    setIsConfirmDialogOpen(true);
  };

  const OrderDetailsContent = ({ order }: { order: Order }) => {
    const handleUpdateStatus = async () => {
      try {
        const newStatus =
          order.status === "paying" && order.payment_method === "cash"
            ? "pending"
            : order.status === "pending" || order.status === "delayed"
              ? "preparing"
              : order.status === "preparing" || order.status === "delayed"
                ? "ready"
                : "delivered";
        const response = await fetch(`/api/orders`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: order.id,
            status: newStatus,
          }),
        });

        if (newStatus == "delivered") {
          fetch("/api/mails", {
            method: "POST",
            body: JSON.stringify({
              email: user?.email,
              type: "order_delivered",
              orderNumber: order.id,
            }),
          });
        }

        fetchOrders();
        setIsOrderDetailsOpen(false);
        setSelectedOrder(null);
        if (!response.ok) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to update order status",
          });
          throw new Error("Failed to update order status");
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update order status",
        });
        console.error("Error updating order status:", error);
      }
    };

    return (
      <div className="space-y-6 my-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{order.user_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium dark:text-white">{order.user_name}</h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {order?.user?.sector_id && `SECTOR ${order?.user?.sector_id}`}
              </p>
            </div>
          </div>
          <Badge
            variant={
              order.payment_method === "cash" ? "outline" : "destructive"
            }
          >
            {order.payment_method}
          </Badge>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Mesa
            </p>
            <p className="font-medium dark:text-white">
              {order?.qr_codes?.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Hora del pedido
            </p>
            <p className="font-medium dark:text-white">
              {format(order.created_at, "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Entrega estimada
            </p>
            <p className="font-medium dark:text-white">
              {format(order?.updated_at || new Date(), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Total
            </p>
            <p className="font-medium dark:text-white">
              ${order.total_amount?.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground dark:text-gray-400">
              Notas
            </p>
            <p className="font-medium dark:text-white">{order?.notes}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-medium mb-3 dark:text-white">Productos</h3>
          <div className="space-y-2">
            {order.order_items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex justify-between">
                <div>
                  <span className="font-medium dark:text-white">
                    {item.quantity}x{" "}
                  </span>
                  <span className="dark:text-white">{item.products?.name}</span>
                </div>
                <div className="font-medium dark:text-white">
                  ${((item.unit_price || 0) * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2 border-t flex justify-between font-bold dark:text-white">
            <div>Total</div>
            <div>${order.total_amount?.toFixed(2)}</div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="mr-2">
              <XIcon className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </DialogClose>
          <Button
            onClick={handleUpdateStatus}
            className={`${ACTION_BUTTONS[order.status as keyof typeof ACTION_BUTTONS]
                ?.className || ""
              }`}
            disabled={
              order.status === "cancelled" ||
              order.status === "delivered" ||
              (order.status == "paying" &&
                order.payment_method == "mercadopago ")
            }
          >
            {ACTION_BUTTONS[order.status as keyof typeof ACTION_BUTTONS]
              ?.text || "Update Status"}
          </Button>
        </DialogFooter>
      </div>
    );
  };

  const handleCancelOrderConfirm = async () => {
    try {
      // Get order details before cancellation for audit log
      const orderToCancel = ordersData.find(order => order.id === selectedOrderId);

      const response = await fetch(`/api/orders`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedOrderId, status: "cancelled" }),
      });
      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      // Create audit log for order cancellation
      if (user && orderToCancel) {
        try {
          // Generate a UUID for the target_id since order IDs are not UUIDs
          // We'll use the user's ID as the target_id and include the order ID in the description
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
              action: "cancel",
              action_type: "order_cancellation",
              target_type: "order",
              target_id: user.id, // Use user ID as target_id since order ID is not UUID
              target_name: `Pedido #${selectedOrderId}`,
              description: `Pedido cancelado - ID: ${selectedOrderId} - Total: $${orderToCancel.total_amount} - Cliente: ${orderToCancel.user_name || orderToCancel.user?.email}`,
              changes_before: { status: orderToCancel.status, order_id: selectedOrderId },
              changes_after: { status: "cancelled", order_id: selectedOrderId },
              status: "success"
            }),
          });
        } catch (auditError) {
          console.error("Error creating audit log:", auditError);
        }
      }

      fetch("/api/mails", {
        method: "POST",
        body: JSON.stringify({
          email: user?.email,
          type: "order_cancelled",
          orderNumber: selectedOrderId,
        }),
      });
      fetchOrders();
      toast({
        variant: "default",
        title: "Success",
        description: "Order canceled successfully",
      });
      setIsConfirmDialogOpen(false);
      setSelectedOrderId(null);
    } catch (error) {
      console.error("Error canceling order:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestión de Pedidos</h1>
        <div className="flex items-center">
          <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
          <span className="text-sm text-muted-foreground">En línea</span>
        </div>
      </div>

      <OrderMetrics data={metricsData} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar pedido..."
            className="pl-10"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrDialogOpen(true)}
          >
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Escanear código QR
          </Button>
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {FILTER_OPTIONS.map(({ value, label }, index) =>
          renderFilterButton(value as Order["status"] | "all", label, index)
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrdersBySearch.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            handleOrderDetail={() => handleOrderDetail(order.id)}
            handleDeleteOrder={() => handleDeleteOrder(order.id)}
            handleCancelOrder={() => handleCancelOrder(order.id)}
          />
        ))}
      </div>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
          <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>Detalles del Pedido {selectedOrder.id}</span>
                <Badge
                  className={`bg-${STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.color
                    }-100 text-${STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.color
                    }-800 dark:bg-${STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.color
                    }-900/20 dark:text-${STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.color
                    }-400`}
                >
                  {
                    STATUS_CONFIG[
                      selectedOrder.status as keyof typeof STATUS_CONFIG
                    ]?.label
                  }
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <OrderDetailsContent order={selectedOrder} />
          </DialogContent>
        </Dialog>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanear Código QR</DialogTitle>
          </DialogHeader>
          <QrScanner onScan={hadleQrCodeScanned} />
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmType === "delete" ? "Eliminar" : "Cancelar"} orden
            </DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                variant="outline"
                onClick={() => handleDeleteOrderCancel()}
              >
                Cancelar
              </Button>
            </DialogClose>
            {confirmType === "delete" && (
              <Button onClick={() => handleDeleteOrderConfirm()}>
                Eliminar
              </Button>
            )}
            {confirmType === "cancel" && (
              <Button onClick={() => handleCancelOrderConfirm()}>
                Cancelar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Extracted Order Details Component
