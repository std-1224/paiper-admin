"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  PencilIcon,
  ClockIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
  SaveIcon,
  EyeIcon,
  Loader2Icon,
  GiftIcon,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Order, OrderItem, Product } from "@/types/types";
import { format } from "date-fns";
import { useAppContext } from "@/context/AppContext";
import { shortenId } from "@/lib/utils";
import Loading from "./loading";
import { ProductSearchField } from "@/components/products/ProductSearchField";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { DatabaseTableStatus, updateTableStatus } from "@/lib/tableUtils";

const STATUS_BADGE_CLASSES = {
  pending: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
  preparing:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
  ready: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  completed:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
};

export const PAYMENT_BADGE_CLASSES = {
  cash: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  balance:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  mercadopago:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  courtesy:
    "bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400",
};

const NOTE_CLASSES = {
  allergy: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
  preference:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
};

export const ACTION_BUTTONS = {
  paying: {
    text: "Esperando pago",
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
  pending: {
    text: "Comenzar Preparación",
    className: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  delayed: {
    text: "Comenzar Preparación",
    className: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  preparing: {
    text: "Marcar como Listo",
    className: "bg-green-600 hover:bg-green-700 text-white",
  },
  ready: {
    text: "Marcar como Entregado",
    className: "bg-orange-600 hover:bg-orange-700 text-white",
  },
  delivered: {
    text: "Completado",
    className: "bg-gray-600 hover:bg-gray-700 text-white",
    disabled: true,
  },
  cancelled: {
    text: "Cancelled",
    className: "bg-red-600 hover:bg-red-700 text-white",
    disabled: true,
  },
};

export function OrderCard({
  order,
  handleOrderDetail,
  handleDeleteOrder,
  handleCancelOrder,
}: {
  order: Order;
  handleOrderDetail: (id: string) => void;
  handleDeleteOrder: (id: string) => void;
  handleCancelOrder: (id: string) => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editedOrder, setEditedOrder] = useState<Order>({ ...order });
  const [editedItems, setEditedItems] = useState<OrderItem[]>([
    ...order.order_items,
  ]);
  // const [editedNotes, setEditedNotes] = useState<Order["notes"]>([
  //   ...(order.notes || []),
  // ]);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { user } = useAuth();

  const { productsData, fetchOrders } = useAppContext();

  const totalAmount = useMemo(() => {
    return editedItems.reduce(
      (sum, item) => sum + item.quantity * (item?.unit_price || 0),
      0
    );
  }, [editedItems]);

  const handleAddItem = useCallback(() => {
    setEditedItems((prev) => [
      ...prev,
      { name: "", quantity: 1, price: 0, id: "" },
    ]);
  }, []);

  const handleRemoveItem = async (index: number) => {
    setEditedItems((prev) => prev.filter((_, i) => i !== index));
    setIsDeleting(true);
    await fetch(`/api/order-item`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: editedItems[index].id }),
    });
    setIsDeleting(false);
  };

  const handleItemChange = useCallback(
    (
      index: number,
      field: keyof Order["order_items"][number],
      value: string | number
    ) => {
      setEditedItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  // const handleAddNote = useCallback(() => {
  //   setEditedNotes((prev) => [...prev, { type: "preference", text: "" }]);
  // }, []);

  // const handleRemoveNote = useCallback((index: number) => {
  //   setEditedNotes((prev) => prev.filter((_, i) => i !== index));
  // }, []);

  // const handleNoteChange = useCallback(
  //   (index: number, field: keyof Order["notes"][number], value: string) => {
  //     setEditedNotes((prev) =>
  //       prev.map((note, i) =>
  //         i === index ? { ...note, [field]: value } : note
  //       )
  //     );
  //   },
  //   []
  // );

  const handleSaveChanges = async () => {
    setIsSaving(true);
    // send only updated order items from origin
    const updatedOrder = {
      id: editedOrder.id,
      total_amount: editedItems.reduce(
        (sum, item) => sum + item.quantity * (item?.unit_price || 0),
        0
      ),
      status: editedOrder.status,
      payment_method: editedOrder.payment_method,
      table_number: editedOrder.table_number,
      order_items: editedItems,
      // notes: editedNotes,
    };
    await fetch(`/api/orders`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedOrder),
    });
    // setEditedItems([]);
    // setEditedNotes([]);
    setIsEditOpen(false);
    setIsSaving(false);
  };

  useEffect(() => {
    setEditedItems(order.order_items);
    // setEditedNotes(order.notes || []);
  }, [isEditOpen]);

  const PaymentStatusBadge = useMemo(
    () => (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${PAYMENT_BADGE_CLASSES[
          order.payment_method as keyof typeof PAYMENT_BADGE_CLASSES
        ]
          }`}
      >
        {order.payment_method === "cash"
          ? "Efectivo"
          : order.payment_method === "balance"
            ? "Saldo"
            : order.payment_method === "cashless"
              ? "Cashless"
              : order.payment_method === "courtesy"
                ? "Cortesía"
                : "Mercado Pago"}
      </span>
    ),
    [order.payment_method]
  );

  const handleUpdateStatus = async () => {
    setIsButtonDisabled(true);

    try {

      if (order.table_number) {

        let status: DatabaseTableStatus;

        if ((order.status === "pending" || order.status === "delayed") && order.payment_method === "balance") {
          status = "paid"
          await updateTableStatus(order.table_number, status as DatabaseTableStatus);
        }
        if (order.status === "preparing") {
          status = "waiting_order";
          await updateTableStatus(order.table_number, status as DatabaseTableStatus);
        } if (order.status === "ready") {
          status = "producing";
          await updateTableStatus(order.table_number, status as DatabaseTableStatus);
        } if (order.status === "delivered") {
          status = "delivered";
          await updateTableStatus(order.table_number, status as DatabaseTableStatus);
        }
      }
      const newStatus =
        order.status === "pending" || order.status === "delayed"
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update order status");
      }

      // Send email notification if order is delivered
      if (newStatus === "delivered") {
        fetch("/api/mails", {
          method: "POST",
          body: JSON.stringify({
            email: user?.email,
            type: "order_delivered",
            orderNumber: order.id,
          }),
        });

        toast.success("¡Pedido entregado! Se han deducido los ingredientes del stock.");
      } else {
        toast.success(`Estado actualizado a: ${newStatus}`);
      }

      fetchOrders();
      setIsButtonDisabled(false);
      setIsEditOpen(false);
    } catch (error) {
      toast.error(`Error al actualizar el estado del pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setIsButtonDisabled(false);
    }
  };

  const ActionButton = useMemo(() => {
    const config =
      ACTION_BUTTONS[order.status as keyof typeof ACTION_BUTTONS] || {};
    return (
      <Button
        onClick={() => {
          console.log("order: ", order.status)
          // if(user?.role === "barman" || user?.role === "client") {
          //   toast.error("No tienes permiso para editar pedidos");
          //   return;
          // }
          handleUpdateStatus()
        }}
        className={`${config.className} w-[50%]`}
        disabled={
          isButtonDisabled ||
          order.status === "cancelled" ||
          order.status === "delivered"
          ||
          (order.status == "paying" && order.payment_method == "mercadopago")
        }
      >
        {config.text}
      </Button>
    );
  }, [order.status, isButtonDisabled]);
  return (
    <Card className="overflow-hidden">
      <CardContent
        className="p-0 cursor-pointer"
        onClick={(e) => {
          if (!(e.target instanceof HTMLButtonElement)) {
            handleOrderDetail(order.id);
          }
        }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="font-bold">{order.id}</div>
              {order.payment_method === "courtesy" && (
                <div title="Courtesy Gift Order">
                  <GiftIcon className="h-5 w-5 text-pink-500" />
                </div>
              )}
            </div>
            {order.table_number && (
              <div className="text-sm text-muted-foreground">
                Mesa {order.table_number}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {PaymentStatusBadge}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                // if(user?.role === "barman" || user?.role === "client") {
                //   toast.error("No tienes permiso para editar pedidos");
                //   return;
                // }
                e.stopPropagation();
                e.preventDefault();
                setIsEditOpen(true);
              }}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              className="hover:bg-red-600 hover:text-white"
              size="icon"
              onClick={(e) => {
                // if(user?.role === "barman" || user?.role === "client") {
                //   toast.error("No tienes permiso para editar pedidos");
                //   return;
                // }
                e.stopPropagation();
                e.preventDefault();
                handleDeleteOrder(order.id);
              }}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback>{order?.user_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">
                {order?.user_name || order?.user?.email}
              </div>
              <div className="text-sm text-muted-foreground">
                {order?.user?.sector_id && `SECTOR ${order?.user?.sector_id}`}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center text-sm">
              <ClockIcon className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                Ordenado: {format(order.created_at, "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <ClockIcon className="h-4 w-4 mr-1 text-muted-foreground" />
              <span>
                Entrega est.:{" "}
                {format(order.updated_at || "", "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 border-b">
          <h3 className="font-medium mb-2">Productos</h3>
          <div className="space-y-2 h-[90px] overflow-y-auto">
            {order.order_items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.quantity}x</span>{" "}
                  {item.products?.name}
                </div>
                <div className="font-medium">
                  ${item.unit_price?.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-2 border-t flex justify-between font-bold">
            <div>Total</div>
            <div>${order.total_amount?.toFixed(2)}</div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-4 border-b">
            <h3 className="font-medium mb-2">Notas</h3>
            <div className="space-y-2">
              <p>{order.notes}</p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 flex justify-around gap-2">
        <Button
          variant="outline"
          className="hover:bg-red-600 hover:text-white p-2 w-[50%]"
          size="icon"
          disabled={
            order.status === "cancelled" || order.status === "delivered"
          }
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleCancelOrder(order.id);
          }}
        >
          <XIcon className="h-4 w-4" />
          Cancelar
        </Button>
        {ActionButton}
      </CardFooter>

      {/* Order Edit Sidebar Modal */}
      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader>
            <SheetTitle>Editar Orden {order.id}</SheetTitle>
            <SheetDescription>
              Mesa {order.table} - {order.user_name}
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="status">Estado de la Orden</Label>
              <Select
                value={editedOrder.status}
                onValueChange={(value) =>
                  setEditedOrder({ ...editedOrder, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Nuevo</SelectItem>
                  <SelectItem value="preparing">En Preparación</SelectItem>
                  <SelectItem value="ready">Listo</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label htmlFor="payment-status">Estado de Pago</Label>
              <Select
                value={editedOrder.payment_method}
                onValueChange={(value) =>
                  setEditedOrder({ ...editedOrder, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado de pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="balance">Tarjeta</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="courtesy">Cortesía</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table Number */}
            <div className="space-y-2">
              <Label htmlFor="table">Número de Mesa</Label>
              <Input
                value={editedOrder.table}
                onChange={(e) =>
                  setEditedOrder({ ...editedOrder, table: e.target.value })
                }
              />
            </div>

            <Separator />

            {/* Order Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Productos</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {isDeleting ? (
                <Loading />
              ) : (
                editedItems.map((item, index) => (
                  <div
                    key={`item-${index}`}
                    className="space-y-2 p-3 border rounded-md"
                  >
                    <div className="flex justify-between" id={`item-${index}`}>
                      <Label>Producto {index + 1}</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-6 w-6 p-0"
                      >
                        <TrashIcon className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <ProductSearchField
                          onSelect={(productId) =>
                            handleItemChange(index, "product_id", productId)
                          }
                          selectedProductId={item.product_id}
                          placeholder="Seleccionar producto"
                          isLowStockDisable={true}
                        />
                        {/* <Select
                          value={item.product_id}
                          onValueChange={(value) => {

                            handleItemChange(index, "product_id", value)
                            handleItemChange(index, "unit_price", productsData.find((product) => product.id === value)?.sale_price || 0)
                          }
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar producto" />
                          </SelectTrigger>
                          <SelectContent>
                            {productsData.map((product) => (
                              <SelectItem key={product.id} value={product.id} disabled={product.stock === 0 || !!editedItems.find((item) => item.product_id === product.id)}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select> */}
                        {/* <Input
                        placeholder="Nombre del producto"
                        value={item.products?.name}
                        onChange={(e) =>
                          handleItemChange(index, "name", e.target.value)
                        }
                      /> */}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Cant."
                          value={item.quantity}
                          min={1}
                          max={
                            productsData.find(
                              (product) => product.id === item.product_id
                            )?.stock || 0
                          }
                          onKeyDown={(e) => {
                            // Prevent minus key, plus key, and 'e' key
                            if (e.key === '-' || e.key === '+' || e.key === 'e' || e.key === 'E') {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow positive numbers and empty string
                            if (value === '' || (Number(value) >= 1 && !value.includes('-'))) {
                              handleItemChange(
                                index,
                                "quantity",
                                parseInt(value) || 1
                              );
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-3 text-center">
                        ${item.unit_price || 0}
                        {/* <Input
                        type="number"
                        placeholder="Precio"
                        value={item.unit_price}
                        disabled
                        onChange={(e) =>
                          handleItemChange(index, "unit_price", parseFloat(e.target.value) || 0)
                        }
                      /> */}
                      </div>
                    </div>
                  </div>
                ))
              )}

              <div className="flex justify-between font-bold pt-2">
                <span>Total:</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Notes */}
            {/* <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Notas</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddNote}
                  className="flex items-center"
                >
                  <PlusIcon className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </div>

              {editedNotes.map((note, index) => (
                <div
                  key={`note-${index}`}
                  className="space-y-2 p-3 border rounded-md"
                >
                  <div className="flex justify-between">
                    <Label>Nota {index + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveNote(index)}
                      className="h-6 w-6 p-0"
                    >
                      <TrashIcon className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Select
                      value={note.type}
                      onValueChange={(value) =>
                        handleNoteChange(index, "type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de nota" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="allergy">Alergia</SelectItem>
                        <SelectItem value="preference">Preferencia</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Descripción"
                      value={note.text}
                      onChange={(e) =>
                        handleNoteChange(index, "text", e.target.value)
                      }
                    />
                  </div>
                </div>
              ))}
            </div> */}
          </div>

          <SheetFooter className="pt-4 border-t">
            <SheetClose asChild>
              <Button variant="outline" className="mr-2">
                <XIcon className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </SheetClose>
            <Button onClick={handleSaveChanges} disabled={isSaving}>
              {isSaving ? (
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4 mr-2" />
              )}
              Guardar Cambios
            </Button>
            <Button
              variant="destructive"
              className="mr-2"
              onClick={() => handleDeleteOrder(order.id)}
            >
              <TrashIcon className="h-4 w-4" />
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
