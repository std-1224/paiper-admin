"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
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
import { StockAdjustmentHistory } from "@/components/stock/StockAdjustmentHistory";
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
} from "lucide-react";
import { StockAdd } from "@/components/stock/StockAdd";
import { InventoryData, Product } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { UserAssign } from "@/components/bars/UserAssign";
import { User } from "@/types/types";
import { format } from "date-fns";
import { PAYMENT_BADGE_CLASSES } from "@/app/(components)/order-card";
import { get } from "http";

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

// Mock data for stock items
const barStockItems = [
  {
    id: 1,
    product: "Vodka Absolut 750ml",
    category: "Alcoholico",
    quantity: 12,
    status: "En Stock",
  },
  {
    id: 2,
    product: "Cerveza",
    category: "Alcoholico",
    quantity: 48,
    status: "En Stock",
  },
  {
    id: 3,
    product: "Agua Mineral 500ml",
    category: "No Alcoholico",
    quantity: 36,
    status: "En Stock",
  },
  {
    id: 4,
    product: "Red Bull 250ml",
    category: "Energéticas",
    quantity: 24,
    status: "En Stock",
  },
  {
    id: 5,
    product: "Gin Beefeater 750ml",
    category: "Alcoholico",
    quantity: 8,
    status: "En Stock",
  },
  {
    id: 6,
    product: "Whicky Johnnie Walker",
    category: "Alcoholico",
    quantity: 6,
    status: "En Stock",
  },
];

const BarDetail = () => {
  const { id } = useParams<{ id: string }>();
  const barId = parseInt(id || "1");

  const [activeTab, setActiveTab] = useState("overview");
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [stockToAdjust, setStockToAdjust] = useState<number | null>(null);
  const [productToAdd, setProductToAdd] = useState<Product | null>(null);

  const [stockAddOpen, setStockAddOpen] = useState(false);

  const [userAssignOpen, setUserAssignOpen] = useState(false);
  const [userToAssign, setUserToAssign] = useState<User | null>(null);

  const {
    fetchStocksOfBar,
    stocksData,
    fetchStaff,
    staffData,
    ordersData,
    barsData,
    fetchBars,
  } = useAppContext();

  const bar =
    barsData.find((b) => b.id?.toString() === barId.toString()) || barsData[0];

  useEffect(() => {
    fetchBars();
  }, []);

  useEffect(() => {
    if (barId) {
      fetchStocksOfBar(barId);
      fetchStaff(barId);
    }
  }, [barId]);

  const handleAdjustStock = (id: number | null = null) => {
    setStockToAdjust(id);
    setStockAdjustmentOpen(true);
  };

  const handleAddStock = () => {
    setStockAddOpen(true);
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
        <Button className="mr-2" onClick={() => handleAdjustStock()}>
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
              <TabsTrigger value="staff">
                <Users className="h-4 w-4 mr-2" />
                Personal
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
            {/* Stock tab */}
            <TabsContent value="stock">
              <div className="flex justify-end mb-4">
                <Button
                  size="sm"
                  className="ml-auto"
                  onClick={() => handleAdjustStock()}
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
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {/* {item.status} */}
                          {barStockItems[0].status}
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
              <StockAdjustmentHistory selectedBar={barId} />
            </TabsContent>

            {/* Staff tab */}
            <TabsContent value="staff">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">
                    Personal Asignado a {bar?.name}
                  </h3>
                  <Button size="sm" onClick={() => setUserAssignOpen(true)}>
                    <Users className="mr-2 h-4 w-4" />
                    Asignar Personal
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffData.map((staff) => (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">
                          {staff.user.name || staff.user.email}
                        </TableCell>
                        <TableCell>{staff.role}</TableCell>
                        <TableCell>
                          <Badge>{staff.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            Ver Perfil
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
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

      {/* Modal to assign user */}
      <UserAssign
        open={userAssignOpen}
        onOpenChange={setUserAssignOpen}
        initialUser={userToAssign}
        initialAssignedBar={barId}
      />
    </>
  );
};

export default BarDetail;
