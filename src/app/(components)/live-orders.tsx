"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { OrderItemCmp } from "(components)/order-item";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { XIcon } from "lucide-react";
import { Note, Customer, Order, OrderItem } from "@/types/types";
import { supabase } from "@/lib/supabaseClient";
import { useAppContext } from "@/context/AppContext";

// interface ExtendedOrderItem extends orderItems {
//   price: number;
//   product_id: number;
// }

// interface ExtendedOrder extends Order {
//   order_items: ExtendedOrderItem[];
//   total: number;
//   notes: Note[];
//   customer: Customer;
//   orderTime: string;
//   deliveryTime: string;
// }

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "En preparación", color: "orange" },
  { value: "delayed", label: "Retrasados", color: "red" },
  { value: "ready", label: "Listos", color: "green" },
];

const STATUS_BADGE_CONFIG = {
  delayed: {
    text: "Demorado",
    className: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  },
  preparation: {
    text: "En Preparación",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  },
  ready: {
    text: "Listo",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  },
  new: {
    text: "Nuevo",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  delivered: {
    text: "Entregado",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  },
  default: {
    text: "",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
};

export function LiveOrders() {
  const [filter, setFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ordersData, productsData, fetchOrders, fetchProducts } =
    useAppContext();
  // Transform orders data into the format we need
  const orders = useMemo(() => {
    if (!ordersData) return [];

    return ordersData.map((order) => {
      const customer: Customer = order.user_id
        ? {
            name: order.user_name || "Unknown User",
            code: `#${order.user_id.substring(0, 4)}`,
            avatar: "https://github.com/shadcn.png",
          }
        : {
            name: "Anonymous Customer",
            code: "#ANON",
            avatar: "https://github.com/shadcn.png",
          };

      const orderItems: OrderItem[] =
        order.order_items?.map((item) => ({
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          name: item.products?.name || "Unknown Product",
          price: item.unit_price || 0,
        })) || [];

      const total = orderItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const orderTime = new Date(order.created_at);
      const deliveryTime = new Date(order.created_at);
      deliveryTime.setMinutes(deliveryTime.getMinutes() + 30);

      const now = new Date();
      const isDelayed = order.status === "pending" && now > deliveryTime;

      // const notes: Note[] = order.notes
      //   ? order.notes.map((note) => ({
      //       type: note.type || "preference",
      //       text: note.text || "",
      //     }))
      //   : [];

      return {
        ...order,
        table: order.table_number || "N/A",
        status: isDelayed ? "delayed" : order.status,
        items: orderItems.length,
        time: orderTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        timeExtra: isDelayed ? "+15min" : undefined,
        customer,
        paymentStatus: "Pendiente",
        paymentMethod: order.payment_method || "MercadoLibre",
        orderTime: orderTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        deliveryTime: deliveryTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        orderItems,
        total,
        // notes,
      };
    });
  }, [ordersData]);
  const filteredOrders = useMemo(() => {
    return filter === "all"
      ? orders
      : orders.filter((order) => order.status == filter);
  }, [filter, orders]);

  const handleOrderClick = useCallback((order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  }, []);

  const handleOrderStatusChange = useCallback(async (order: Order) => {
    if (order.status === "delivered") {
      setError("Cannot update an order that is already delivered");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const newStatus =
        order.status === "new"
          ? "preparing"
          : order.status === "preparing" ||
              order.status === "delayed" ||
              order.status === "pending"
            ? "ready"
            : "delivered";

      // Update order status
      const response = await fetch(`/api/orders`, {
        method: "PUT",
        body: JSON.stringify({
          id: order.id,
          status: newStatus,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      fetchOrders();
      fetchProducts();
      // Close the modal
      setIsOrderDetailsOpen(false);
    } catch (err) {
      console.error("Error updating order status:", err);
      setError("Error updating order status");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getStatusBadge = useCallback((status: string) => {
    const config =
      STATUS_BADGE_CONFIG[status as keyof typeof STATUS_BADGE_CONFIG] ||
      STATUS_BADGE_CONFIG.default;
    return <Badge className={config.className}>{config.text || status}</Badge>;
  }, []);

  const getStatusButtonText = useCallback((status: string) => {
    switch (status) {
      case "new":
        return "Comenzar Preparación";
      case "preparing":
      case "delayed":
      case "pending":
        return "Marcar como Listo";
      case "ready":
        return "Completar Pedido";
      default:
        return "Pedido Completado";
    }
  }, []);

  const getStatusButtonColor = useCallback((status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-600 hover:bg-blue-700";
      case "preparing":
        return "bg-orange-600 hover:bg-orange-700";
      case "delayed":
        return "bg-red-600 hover:bg-red-700";
      default:
        return "bg-green-600 hover:bg-green-700";
    }
  }, []);

  return (
    <div className="bg-card rounded-lg border dark:bg-gray-900 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold mb-6 dark:text-white">
        Live Orders
      </h2>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600 mb-4">
          {error}
        </div>
      )}

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {STATUS_FILTERS.map(({ value, label, color }) => (
          <Button
            key={value}
            variant={filter === value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(value)}
            className={
              filter === value
                ? color
                  ? `bg-${color}-100 text-${color}-800 hover:bg-${color}-200 hover:text-${color}-900 dark:bg-${color}-900/20 dark:text-${color}-400 dark:hover:bg-${color}-900/30`
                  : ""
                : `bg-${color}-100 text-${color}-800 hover:bg-${color}-200 hover:text-${color}-900 dark:bg-transparent dark:text-gray-300 dark:border-gray-700`
            }
          >
            {label}
          </Button>
        ))}
      </div>

      {!ordersData ? (
        <div className="space-y-4">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-24 animate-pulse"
              />
            ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4 h-[40vh] overflow-y-auto">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="cursor-pointer"
              onClick={() => handleOrderClick(order)}
            >
              <OrderItemCmp order={order} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No orders found
        </div>
      )}

      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] dark:bg-gray-900 dark:border-gray-800">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Detalles del Pedido {selectedOrder.id}</span>
                </DialogTitle>
                {selectedOrder.status === "delivered" && (
                  <div className="text-sm text-gray-500 mt-1">
                    Este pedido ya ha sido entregado y no puede ser actualizado.
                  </div>
                )}
              </DialogHeader>

              <div className="space-y-6 my-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={selectedOrder.customer.avatar}
                        alt={selectedOrder.customer.name}
                      />
                      <AvatarFallback>
                        {selectedOrder.customer.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium dark:text-white">
                        {selectedOrder.customer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        Código: {selectedOrder.customer.code}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Mesa
                    </p>
                    <p className="font-medium dark:text-white">
                      {selectedOrder?.qr_codes?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Hora del pedido
                    </p>
                    <p className="font-medium dark:text-white">
                      {selectedOrder.orderTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Total
                    </p>
                    <p className="font-medium dark:text-white">
                      ${selectedOrder.total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Metodo de pago
                    </p>
                    <p className="font-medium dark:text-white">
                      {selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-medium mb-3 dark:text-white">Products</h3>
                  <div className="space-y-2">
                    {selectedOrder?.orderItems?.map((item, idx) => (
                      <div key={idx} className="flex justify-between">
                        <div>
                          <span className="font-medium dark:text-white">
                            {item.quantity}x{" "}
                          </span>
                          <span className="dark:text-white">{item.name}</span>
                        </div>
                        <div className="font-medium dark:text-white">
                          ${(item?.unit_price || 1 * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-2 border-t flex justify-between font-bold dark:text-white">
                    <div>Total</div>
                    <div>${selectedOrder.total.toFixed(2)}</div>
                  </div>
                </div>

                {selectedOrder.notes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-medium mb-3 dark:text-white">
                        Notas
                      </h3>
                      <div className="space-y-2">
                        {/* {selectedOrder.notes.map((note, idx) => (
                          <div
                            key={idx}
                            className={`px-3 py-2 rounded-md text-sm ${
                              note.type === "allergy"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                            }`}
                          >
                            {note.type === "allergy"
                              ? "Alergia: "
                              : "Preferencia: "}
                            {note.text}
                          </div>
                        ))} */}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="mr-2">
                    <XIcon className="h-4 w-4 mr-2" />
                    Cerrar
                  </Button>
                </DialogClose>
                <Button
                  onClick={() => handleOrderStatusChange(selectedOrder)}
                  disabled={isLoading || selectedOrder.status === "delivered"}
                  className={getStatusButtonColor(selectedOrder.status)}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Procesando...
                    </div>
                  ) : (
                    getStatusButtonText(selectedOrder.status)
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
