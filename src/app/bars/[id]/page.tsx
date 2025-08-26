"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
// import { useParams, Link } from "react-router-dom";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { StockTransfers } from "@/components/bars/StockTransfers";
import { StockAdjustment } from "@/components/stock/StockAdjustment";
import { StockAdjustmentHistory, StockAdjustmentHistoryRef } from "@/components/stock/StockAdjustmentHistory";
import {
  ArrowLeft,
  BarChart,
  QrCode,
  Users,
  PieChart,
  ArrowRightLeft,
  PackagePlus,
  Clock,
  ChevronRight,
  Box,
  Logs,
  Trash2,
  Eye,
} from "lucide-react";
import { StockAdd } from "@/components/stock/StockAdd";
import { InventoryData, Product } from "@/types/types";
import { useAppContext } from "@/context/AppContext";

import { format } from "date-fns";
import { PAYMENT_BADGE_CLASSES } from "@/app/(components)/order-card";
import { get } from "http";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Mock data for bars
const sampleBar = {
  id: 1,
  name: "Bar Central",
  sales: "$82,350",
  orders: 875,
  qrCodes: 3,
  staff: 5,
  stockItems: 42,
  status: "active",
};



const BarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const barId = parseInt(id || "1");
  const adjustmentHistoryRef = useRef<StockAdjustmentHistoryRef>(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [stockToAdjust, setStockToAdjust] = useState<number | null>(null);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);

  const [stockAddOpen, setStockAddOpen] = useState(false);
  const {user} = useAuth();


  const {
    fetchStocksOfBar,
    stocksData,
    ordersData,
    barsData,
    fetchBars,
    qrCodesData,
    fetchQRCodes,
  } = useAppContext();

  const bar =
    barsData.find((b) => b.id?.toString() === barId.toString()) || barsData[0];

  useEffect(() => {
    fetchBars();
    fetchQRCodes();
  }, []);

  useEffect(() => {
    if (barId) {
      fetchStocksOfBar(barId);
    }
  }, [barId]);

  const handleAdjustStock = (id: number | null = null) => {
    setStockToAdjust(id);
    setStockAdjustmentOpen(true);
  };

  const handleAddStock = () => {
    setStockAddOpen(true);
  };

  const handleDeleteQr = async (qrId: string | undefined) => {
    if (!qrId) return;

    try {
      const res = await fetch("/api/qr-codes", {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: qrId }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete QR code');
      }

      await fetchQRCodes();
      // You could add a toast notification here if needed
    } catch (error) {
      console.error("Error deleting QR code:", error);
      // You could add error toast notification here if needed
    }
  };

  // Inside your component
  const getBarOrders = useCallback((orders: any[], barId: number) => {
    return orders.filter((order) => order?.qr_codes?.bar_id == barId);
  }, []);

  const barOrders = useMemo(
    () => getBarOrders(ordersData, barId),
    [ordersData, barId, getBarOrders]
  );

  const handleStockReingress = async (data: any) => {
    // Aquí iría la lógica para actualizar el stock
    const response = await fetch("/api/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        inventory_id: stockToAdjust,
        type: "re-entry",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }

    // Refresh the inventory data after successful adjustment
    if (barId) {
      await fetchStocksOfBar(barId);
    }

    // Refresh adjustment history
    adjustmentHistoryRef.current?.refreshHistory();
  };

  const handleStockLoss = async (data: any) => {
    console.log("Pérdida registrada:", data);
    // Aquí iría la lógica para actualizar el stock
    const response = await fetch("/api/adjust", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...data,
        inventory_id: stockToAdjust,
        type: "loss",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }

    // Refresh the inventory data after successful adjustment
    if (barId) {
      await fetchStocksOfBar(barId);
    }

    // Refresh adjustment history
    adjustmentHistoryRef.current?.refreshHistory();
  };

  const getProducts = (items: any[]) => {
    return items.map((item: any) => `${item.products.name} * ${item.quantity}`);
  };

  const getPaymentMethod = (method: string) => {
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${
          PAYMENT_BADGE_CLASSES[method as keyof typeof PAYMENT_BADGE_CLASSES]
        }`}
      >
        {method === "cash"
          ? "Efectivo"
          : method === "balance"
          ? "Saldo"
          : method === "cashless"
          ? "Cashless"
          : "Mercado Pago"}
      </span>
    );
  };
  return (
    <>
      <PageHeader
        title={bar?.name}
        description={`Control y análisis detallado de ${bar?.name}`}
        breadcrumb={
          <div className="flex items-center text-sm text-muted-foreground">
            <Link href="/bars" className="hover:text-primary">
              Barras
            </Link>
            <ChevronRight className="h-4 w-4 mx-1" />
            <span>{bar?.name}</span>
          </div>
        }
      >
        <Button variant="outline" className="mr-2" asChild>
          <Link href="/qr-tracking">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <Button className="mr-2" onClick={() =>{ 
          // if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
          //   toast.error("No tienes permiso para ajustar stock");
          //   return;
          // }
          handleAdjustStock()}}>
          <PackagePlus className="mr-2 h-4 w-4" />
          Ajustar Stock
        </Button>
        <Button onClick={() => handleAddStock()}>
          <Box className="mr-2 h-4 w-4" />
          Añadir Stock
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBar.sales}</div>
            <p className="text-xs text-muted-foreground mt-1">Último mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBar.orders}</div>
            <p className="text-xs text-muted-foreground mt-1">Último mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Productos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBar.stockItems}</div>
            <p className="text-xs text-muted-foreground mt-1">En stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleBar.staff}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Empleados activos
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestión de {bar?.name}</CardTitle>
          <CardDescription>Stock, ventas, pedidos y más</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-1 md:grid-cols-6 w-full">
              <TabsTrigger value="overview">
                <BarChart className="h-4 w-4 mr-2" />
                Resumen
              </TabsTrigger>
              <TabsTrigger value="orders">
                <Logs className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="qrcodes">
                <QrCode className="h-4 w-4 mr-2" />
                QR Codes
              </TabsTrigger>
              <TabsTrigger value="stock">
                <Box className="h-4 w-4 mr-2" />
                Inventario
              </TabsTrigger>
              <TabsTrigger value="transfers">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transferencias
              </TabsTrigger>
              <TabsTrigger value="adjustments">
                <PackagePlus className="h-4 w-4 mr-2" />
                Ajustes de Stock
              </TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Rendimiento Reciente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex items-center justify-center bg-muted/20 rounded-md">
                      <PieChart className="h-8 w-8 text-muted-foreground" />
                      <span className="ml-2 text-muted-foreground">
                        Gráfico de rendimiento
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h4 className="font-medium">Categorías más vendidas</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex justify-between">
                            <span>Bebidas alcohólicas</span>
                            <span className="font-medium">64%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Bebidas sin alcohol</span>
                            <span className="font-medium">21%</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Energizantes</span>
                            <span className="font-medium">15%</span>
                          </li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">Productos top</h4>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex justify-between">
                            <span>Gin Tonic</span>
                            <span className="font-medium">145</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Cerveza</span>
                            <span className="font-medium">132</span>
                          </li>
                          <li className="flex justify-between">
                            <span>Fernet con Coca</span>
                            <span className="font-medium">98</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Información de la Barra
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Códigos QR</h4>
                        <div className="flex items-center mt-1">
                          <QrCode className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{sampleBar.qrCodes} códigos activos</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {Array.from({ length: sampleBar.qrCodes }).map(
                            (_, i) => (
                              <div
                                key={i}
                                className="bg-muted/20 p-2 rounded text-center text-sm"
                              >
                                QR #{i + 1}
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div className="pt-4">
                        <h4 className="font-medium">Personal</h4>
                        <div className="flex items-center mt-1">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>{sampleBar.staff} empleados activos</span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <div className="flex justify-between items-center bg-muted/20 p-2 rounded text-sm">
                            <span>Encargado: Juan Pérez</span>
                            <Badge>Principal</Badge>
                          </div>
                          <div className="flex justify-between items-center bg-muted/20 p-2 rounded text-sm">
                            <span>Barman: Laura Gómez</span>
                            <Badge variant="outline">Activo</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        <h4 className="font-medium">Horas de Operación</h4>
                        <div className="flex items-center mt-1">
                          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Jueves a Domingo: 21:00 - 05:00</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            {/* Orders tab */}
            <TabsContent value="orders">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date&Time</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {barOrders.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item?.user?.email}
                      </TableCell>
                      <TableCell>
                        {format(
                          item.created_at || new Date(),
                          "dd/MM/yyyy HH:mm"
                        )}
                      </TableCell>
                      <TableCell>
                        {getProducts(item.order_items).join(", ")}
                      </TableCell>
                      <TableCell>
                        {getPaymentMethod(item.payment_method)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* QR Codes tab */}
            <TabsContent value="qrcodes">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Códigos QR de {bar?.name}
                  </h3>
                  <Button size="sm" onClick={() => window.location.href = '/qr-tracking'}>
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Todos los QRs
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead>Propósito</TableHead>
                      <TableHead>Último Uso</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qrCodesData
                      .filter((qr: any) => qr.bar_id === barId || qr.barId === barId)
                      .map((qr: any) => (
                        <TableRow key={qr.id}>
                          <TableCell className="font-medium">{qr.name}</TableCell>
                          <TableCell>{qr.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {qr.purpose === 'orders' ? 'Pedidos' :
                               qr.purpose === 'menu' ? 'Menú' :
                               qr.purpose === 'promos' ? 'Promociones' :
                               qr.purpose === 'events' ? 'Eventos' : qr.purpose}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {qr.last_used ? format(new Date(qr.last_used), "dd/MM/yyyy") : 'Nunca'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = `/qr-tracking?qr=${qr.id}`}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  // if (user?.role === "client" || user?.role === "manager") {
                                  //   toast.error("No tienes permiso para eliminar códigos QR");
                                  //   return;
                                  // }
                                  handleDeleteQr(qr.id)
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>

                {qrCodesData.filter((qr: any) => qr.bar_id === barId || qr.barId === barId).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay códigos QR asociados a esta barra
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Stock tab */}
            <TabsContent value="stock">
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => {
                    // if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
                    //   toast.error("No tienes permiso para ajustar stock");
                    //   return;
                    // }
                    handleAdjustStock()}}
                >
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Ajustar Stock
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocksData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={item.quantity > 0 ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}
                        >
                          {item.quantity > 0 ? "En Stock" : "Sin Stock"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdjustStock(item.id)}
                          >
                            <PackagePlus className="mr-2 h-4 w-4" />
                            Ajustar
                          </Button>
                          <Link href="/stock">
                            <Button variant="ghost" size="sm">
                              Ver en Stock
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Transfers tab */}
            <TabsContent value="transfers">
              <StockTransfers selectedBar={barId} />
            </TabsContent>

            {/* Adjustments tab */}
            <TabsContent value="adjustments">
              <StockAdjustmentHistory ref={adjustmentHistoryRef} selectedBar={barId} />
            </TabsContent>


          </Tabs>
        </CardContent>
      </Card>

      {/* Modal para ajustar stock */}
      <StockAdjustment
        open={stockAdjustmentOpen}
        onOpenChange={setStockAdjustmentOpen}
        initialStockId={stockToAdjust}
        onSubmitReingress={handleStockReingress}
        onSubmitLoss={handleStockLoss}
      />

      {/* Modal to add stock */}
      <StockAdd
        open={stockAddOpen}
        onOpenChange={setStockAddOpen}
        initialProduct={productToAdd}
      />


    </>
  );
};

export default BarDetail;
