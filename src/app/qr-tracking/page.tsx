"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  SearchIcon,
  FilterIcon,
  RefreshCwIcon,
  CalendarIcon,
  DownloadIcon,
  MapPinIcon,
  QrCodeIcon,
  ArrowUpDownIcon,
  BarChartIcon,
  UsersIcon,
  DollarSignIcon,
  ClockIcon,
  Download,
  Copy,
  Loader2Icon,
  TrashIcon,
} from "lucide-react";
import { Cross2Icon } from "@radix-ui/react-icons";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { QrPerformanceChart } from "(components)/qr-performance-chart";
import { QrUsersList } from "(components)/qr-users-list";
import { QrComparisonChart } from "(components)/qr-comparison-chart";
import { PageHeader } from "@/components/PageHeader";
import {
  QrCode,
  ArrowRightLeft,
  DollarSign,
  BoxesIcon,
  Plus,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarVisualization } from "@/components/bars/BarVisualization";
import { QRGenerator } from "@/components/bars/QRGenerator";
import { BarCreator } from "@/components/bars/BarCreator";
import { useAppContext } from "@/context/AppContext";
import { QRCodeData, QrUser, QrOrder, Transaction } from "@/types/types";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import Loading from "../(components)/loading";
import { useAuth } from "@/context/AuthContext";
import { Popover } from "radix-ui";
import * as XLSX from "xlsx";

interface User {
  name: string;
  email: string;
  avatar: string;
}

interface QrPerformanceChartProps {
  qrId: string;
}

interface QrUsersListProps {
  qrId: string;
  onUserClick: (user: User) => void;
}

interface QrComparisonChartProps {
  qrId: string;
}

export default function QrTracking() {
  const [dateRange, setDateRange] = useState("month");
  const [sortField, setSortField] = useState("orders");
  const [sortDirection, setSortDirection] = useState("desc");
  const [selectedQr, setSelectedQr] = useState<QRCodeData | null>(null);
  const [isQrDetailsOpen, setIsQrDetailsOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDetailsOpen, setIsUserDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("evolution");

  const isMobile = useIsMobile();
  const colSpan = isMobile ? "col-span-12" : "col-span-3";
  const [selectedBar, setSelectedBar] = useState("all");
  const [qrGeneratorOpen, setQrGeneratorOpen] = useState(false);
  const [barCreatorOpen, setBarCreatorOpen] = useState(false);

  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalUniqueUsers, setTotalUniqueUsers] = useState(0);

  // Global statistics for all QR codes
  const [globalStats, setGlobalStats] = useState({
    totalQROrders: 0,
    totalQRRevenue: 0,
    totalQRUniqueUsers: 0,
    previousMonthOrders: 0,
    previousMonthRevenue: 0,
    previousMonthUsers: 0
  });

  const { qrCodesData, ordersData, fetchOrders, fetchQRCodes } =
    useAppContext();

  const [qrOrders, setQrOrders] = useState<QrOrder[]>([]);

  const [qrUser, setQrUser] = useState<QrUser | null>(null);
  const [transfers, setTransfers] = useState<Transaction[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const fetchTransfers = async () => {
      try {
        const response = await fetch(`/api/transfers?userId=${user?.id}`);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setTransfers(data.data);
      } catch (error) {
        console.error("Error fetching transfers:", error);
      }
    };
    fetchTransfers();
    setIsLoading(false);
  }, [user]);

  const handleGetOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/qr-orders?qrId=${selectedQr?.id}`);
      const data = await response.json();
      setTotalOrders(data.length);
      setTotalRevenue(
        data.reduce(
          (acc: number, order: QrOrder) => acc + Number(order.total_amount),
          0
        )
      );
      setTotalUniqueUsers(
        new Set(data.map((order: QrOrder) => order.user_id)).size
      );
      setQrOrders(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching orders:", error);
    }
  };

  const handleGetUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/users?userId=${userId}`);
      let data = await response.json();
      data.ordersCount = 0;
      data.totalSpent = 0;
      data.frequentItems = [];
      qrOrders.forEach((order) => {
        if (order.user_id == userId) {
          data.ordersCount++;
          data.totalSpent += Number(order.total_amount);
          data.frequentItems.push(
            ...order.order_items.map((item) => item.products?.name)
          );
        }
      });
      const frequencyMap: Record<string, number> = data.frequentItems.reduce(
        (acc: Record<string, number>, item: string) => {
          acc[item] = (acc[item] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );
      const mostFrequentItems = Object.keys(frequencyMap).slice(0, 3);
      data.frequentItems = mostFrequentItems;
      setQrUser(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      console.error("Error fetching user:", error);
    }
  };

  // Calculate global statistics
  const calculateGlobalStats = () => {
    if (!ordersData || ordersData.length === 0) {
      setGlobalStats({
        totalQROrders: 0,
        totalQRRevenue: 0,
        totalQRUniqueUsers: 0,
        previousMonthOrders: 0,
        previousMonthRevenue: 0,
        previousMonthUsers: 0
      });
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter orders for current period (based on dateRange)
    let filteredOrders = ordersData;
    if (dateRange !== "all") {
      const cutoffDate = new Date();
      switch (dateRange) {
        case "week":
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(cutoffDate.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(cutoffDate.getMonth() - 3);
          break;
        case "year":
          cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
          break;
      }
      filteredOrders = ordersData.filter(order =>
        new Date(order.created_at) >= cutoffDate
      );
    }

    // Calculate current period stats
    const totalQROrders = filteredOrders.length;
    const totalQRRevenue = filteredOrders.reduce((sum, order) =>
      sum + Number(order.total_amount), 0
    );
    const uniqueUserIds = new Set(
      filteredOrders
        .filter(order => order.user_id)
        .map(order => order.user_id)
    );
    const totalQRUniqueUsers = uniqueUserIds.size;

    // Calculate previous period stats for comparison
    const previousPeriodOrders = ordersData.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate.getMonth() === previousMonth &&
             orderDate.getFullYear() === previousYear;
    });

    const previousMonthOrders = previousPeriodOrders.length;
    const previousMonthRevenue = previousPeriodOrders.reduce((sum, order) =>
      sum + Number(order.total_amount), 0
    );
    const previousMonthUniqueUsers = new Set(
      previousPeriodOrders
        .filter(order => order.user_id)
        .map(order => order.user_id)
    ).size;

    setGlobalStats({
      totalQROrders,
      totalQRRevenue,
      totalQRUniqueUsers,
      previousMonthOrders,
      previousMonthRevenue,
      previousMonthUsers: previousMonthUniqueUsers
    });
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    calculateGlobalStats();
  }, [ordersData, dateRange]);

  useEffect(() => {
    if (selectedUserId) {
      handleGetUser(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (selectedQr) {
      handleGetOrders();
    }
  }, [selectedQr]);

  // Function to handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-canvas");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${selectedQr?.name || "code"}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = `data:image/svg+xml;base64,${btoa(
      unescape(encodeURIComponent(svgData))
    )}`;
  };

  const handleCopyLink = () => {
    if (!selectedQr) return;

    const qrLink = `${process.env.NEXT_PUBLIC_WEB_URL}qr-tracking/${selectedQr.id}`;
    navigator.clipboard.writeText(qrLink);
    toast({
      title: "Enlace copiado",
      description: "El enlace del QR ha sido copiado al portapapeles.",
    });
  };

  // Function to get sorted QR codes
  const getSortedQrCodes = () => {
    const getUniqueUserCount = (orders: typeof ordersData) => {
      const userIds = orders
        .filter((order) => order.user_id) // Filter out undefined user_ids
        .map((order) => order.user_id) as string[]; // Type assertion
      return new Set(userIds).size;
    };

    // Filter orders based on date range
    const getFilteredOrdersByDate = (orders: typeof ordersData) => {
      if (dateRange === "all") return orders;

      const now = new Date();
      const cutoffDate = new Date();

      switch (dateRange) {
        case "week":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "month":
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case "quarter":
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          return orders;
      }

      return orders.filter(order => new Date(order.created_at) >= cutoffDate);
    };

    const filteredOrdersByDate = getFilteredOrdersByDate(ordersData);

    let filteredCodes = qrCodesData.map((qr) => {
      const qrOrders = filteredOrdersByDate.filter((order) => order.qr_id === qr.id);
      const lastOrder = qrOrders.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];

      return {
        ...qr,
        orders: qrOrders.length,
        revenue: qrOrders.reduce((total, order) => total + Number(order.total_amount), 0),
        uniqueUsers: getUniqueUserCount(qrOrders),
        last_used: lastOrder ? lastOrder.created_at : qr.created_at,
      };
    });

    if (searchQuery) {
      filteredCodes = filteredCodes.filter(
        // Filter the already mapped codes
        (qr) =>
          qr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          qr.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filteredCodes.sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        // case "orders":
        //   valueA = a.orders;
        //   valueB = b.orders;
        //   break;
        // case "revenue":
        //   try {
        //     valueA = parseFloat(a.revenue.replace("$", "").replace(",", ""));
        //     valueB = parseFloat(b.revenue.replace("$", "").replace(",", ""));
        //     if (isNaN(valueA) || isNaN(valueB))
        //       throw new Error("Invalid revenue format");
        //   } catch (e) {
        //     console.error("Error parsing revenue:", e);
        //     return 0;
        //   }
        //   break;
        // case "uniqueUsers":
        //   valueA = a?.uniqueUsers;
        //   valueB = b?.uniqueUsers;
        //   break;
        case "last_used":
          valueA = new Date(a.last_used || "1");
          valueB = new Date(b.last_used || "1");
          break;
        default:
          valueA = a[sortField as keyof typeof a];
          valueB = b[sortField as keyof typeof b];
      }

      if ((valueA ?? 0) < (valueB ?? 0)) {
        return sortDirection === "asc" ? -1 : 1;
      }
      if ((valueA ?? 0) > (valueB ?? 0)) {
        return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Memoize sorted QR codes to prevent unnecessary re-sorting
  const sortedQrCodes = useMemo(
    () => getSortedQrCodes(),
    [qrCodesData, ordersData, sortField, sortDirection, searchQuery, dateRange]
  );

  const handleQrClick = (qr: QRCodeData) => {
    setSelectedQr(qr);
    setIsQrDetailsOpen(true);
  };

  const handleUserClick = (user_id: string) => {
    setSelectedUserId(user_id);
    setIsUserDetailsOpen(true);
  };

  // Handle refresh/update functionality
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchOrders(),
        fetchQRCodes()
      ]);
      toast({
        title: "Datos actualizados",
        description: "Los datos de QR tracking han sido actualizados exitosamente.",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    try {
      const exportData = sortedQrCodes.map(qr => ({
        'Nombre': qr.name,
        'Ubicación': qr.location,
        'Barra': qr.bars?.name || 'N/A',
        'Total Pedidos': qr.orders,
        'Ingresos Totales': `$${qr.revenue.toFixed(2)}`,
        'Usuarios Únicos': qr.uniqueUsers,
        'Último Uso': format(new Date(qr.last_used || ''), 'dd/MM/yyyy'),
        'Fecha Creación': format(new Date(qr.created_at || ''), 'dd/MM/yyyy'),
        'Estado': qr.orders > 0 ? 'Activo' : 'Inactivo'
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "QR Tracking");

      // Auto-size columns
      const colWidths = Object.keys(exportData[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      ws['!cols'] = colWidths;

      // Generate filename with current date and time
      const now = new Date();
      const filename = `qr_tracking_${format(now, 'yyyy-MM-dd_HH-mm')}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Exportación exitosa",
        description: `Los datos han sido exportados a ${filename}`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos.",
        variant: "destructive",
      });
    }
  };

  const [deletingQrId, setDeletingQrId] = useState<string | null>(null);

  const handleDeleteQr = async (qrId: string | undefined) => {
    if (!qrId) return;

    setDeletingQrId(qrId);
    try {
      const res = await fetch("api/qr-codes", {
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
      toast({
        title: "QR eliminado",
        description: "El código QR ha sido eliminado exitosamente.",
      });
    } catch (error) {
      console.error("Error deleting QR code:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo eliminar el código QR.",
        variant: "destructive",
      });
    } finally {
      setDeletingQrId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">
            Tracking de QRs
          </h1>
          <p className="text-muted-foreground dark:text-gray-400">
            Análisis de rendimiento de códigos QR y su impacto en ventas
          </p>
        </div>
        <div>
          <Button
            onClick={() => setQrGeneratorOpen(true)}
            className="mr-2 bg-stone-900 hover:bg-stone-800"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Generar Nuevo QR
          </Button>
          <Button
            onClick={() => setBarCreatorOpen(true)}
            className="bg-stone-900 hover:bg-stone-800"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Barra
          </Button>
        </div>
      </div>

      {/* Filter and Actions Section */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />

          <Input
            placeholder="Buscar QR por nombre o ubicación..."
            className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] dark:bg-gray-800 dark:border-gray-700 dark:text-white">
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />

              <SelectValue placeholder="Rango de fechas" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mes</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último año</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="dark:border-gray-700 dark:text-gray-300"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCwIcon className="h-4 w-4 mr-2" />
            )}
            Actualizar
          </Button>

          <Button
            variant="outline"
            className="dark:border-gray-700 dark:text-gray-300"
            onClick={handleExport}
            disabled={isLoading || sortedQrCodes.length === 0}
          >
            <DownloadIcon className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* QR Codes Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Total de Pedidos vía QR
              </p>
              <p className="text-2xl font-bold dark:text-white">
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  globalStats.totalQROrders.toLocaleString()
                )}
              </p>
              <p className={`text-xs ${
                globalStats.totalQROrders >= globalStats.previousMonthOrders
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {globalStats.previousMonthOrders > 0 ? (
                  `${globalStats.totalQROrders >= globalStats.previousMonthOrders ? '+' : ''}${
                    (((globalStats.totalQROrders - globalStats.previousMonthOrders) / globalStats.previousMonthOrders) * 100).toFixed(1)
                  }% vs mes anterior`
                ) : (
                  'Sin datos del mes anterior'
                )}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <QrCodeIcon className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Ingresos Totales vía QR
              </p>
              <p className="text-2xl font-bold dark:text-white">
                {isLoading ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  `$${globalStats.totalQRRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </p>
              <p className={`text-xs ${
                globalStats.totalQRRevenue >= globalStats.previousMonthRevenue
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {globalStats.previousMonthRevenue > 0 ? (
                  `${globalStats.totalQRRevenue >= globalStats.previousMonthRevenue ? '+' : ''}${
                    (((globalStats.totalQRRevenue - globalStats.previousMonthRevenue) / globalStats.previousMonthRevenue) * 100).toFixed(1)
                  }% vs mes anterior`
                ) : (
                  'Sin datos del mes anterior'
                )}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
              <DollarSignIcon className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-900 dark:border-gray-800">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Usuarios Únicos vía QR
              </p>
              <p className="text-2xl font-bold dark:text-white">
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  globalStats.totalQRUniqueUsers.toLocaleString()
                )}
              </p>
              <p className={`text-xs ${
                globalStats.totalQRUniqueUsers >= globalStats.previousMonthUsers
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}>
                {globalStats.previousMonthUsers > 0 ? (
                  `${globalStats.totalQRUniqueUsers >= globalStats.previousMonthUsers ? '+' : ''}${
                    (((globalStats.totalQRUniqueUsers - globalStats.previousMonthUsers) / globalStats.previousMonthUsers) * 100).toFixed(1)
                  }% vs mes anterior`
                ) : (
                  'Sin datos del mes anterior'
                )}
              </p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <UsersIcon className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <BarVisualization className="mb-6" />

      {/* QR Codes Table */}
      <Card className="dark:bg-gray-900 dark:border-gray-800 max-h-[600px] overflow-y-scroll">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 dark:bg-gray-800">
              <TableRow>
                <TableHead
                  className="font-medium cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Nombre/Ubicación
                    {sortField === "name" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer"
                  onClick={() => handleSort("bar")}
                >
                  <div className="flex items-center">
                    Barra
                    {sortField === "bar" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer text-right"
                  onClick={() => handleSort("orders")}
                >
                  <div className="flex items-center justify-end">
                    Pedidos
                    {sortField === "orders" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer text-right"
                  onClick={() => handleSort("revenue")}
                >
                  <div className="flex items-center justify-end">
                    Ingresos
                    {sortField === "revenue" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer text-right"
                  onClick={() => handleSort("uniqueUsers")}
                >
                  <div className="flex items-center justify-end">
                    Usuarios Únicos
                    {sortField === "uniqueUsers" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="font-medium cursor-pointer"
                  onClick={() => handleSort("last_used")}
                >
                  <div className="flex items-center">
                    Último Uso
                    {sortField === "last_used" && (
                      <ArrowUpDownIcon
                        className={`h-4 w-4 ml-1 ${
                          sortDirection === "asc" ? "transform rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </TableHead>
                <TableHead className="font-medium">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedQrCodes.map((qr) => (
                <TableRow
                  key={qr.id}
                  className="cursor-pointer hover:bg-muted/50 dark:hover:bg-gray-800/50"
                  onClick={(e) => {
                    // if (user?.role === "client") {
                    //   return;
                    // }
                    e.stopPropagation();
                    if (!(e.target instanceof HTMLButtonElement)) {
                      handleQrClick(qr);
                    }
                  }}
                  id={`qr-row-${qr.id}`}
                >
                  <TableCell id={`qr-name-${qr.id}`}>
                    <div
                      className="flex items-center space-x-3"
                      id={`qr-name-content-${qr.id}`}
                    >
                      <div
                        className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/20"
                        id={`qr-icon-bg-${qr.id}`}
                      >
                        <QrCodeIcon
                          className="h-5 w-5 text-blue-500"
                          id={`qr-icon-${qr.id}`}
                        />
                      </div>
                      <div id={`qr-details-${qr.id}`}>
                        <p
                          className="font-medium dark:text-white"
                          id={`qr-name-text-${qr.id}`}
                        >
                          {qr.name}
                        </p>
                        <p
                          className="text-xs text-muted-foreground dark:text-gray-400"
                          id={`qr-location-${qr.id}`}
                        >
                          <MapPinIcon
                            className="h-3 w-3 inline mr-1"
                            id={`qr-location-icon-${qr.id}`}
                          />

                          {qr.location}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-start font-medium dark:text-white"
                    id={`qr-bar-${qr.id}`}
                  >
                    {qr?.bars?.name}
                  </TableCell>
                  <TableCell
                    className="text-right font-medium dark:text-white"
                    id={`qr-orders-${qr.id}`}
                  >
                    {qr.orders}
                  </TableCell>
                  <TableCell
                    className="text-right font-medium dark:text-white"
                    id={`qr-revenue-${qr.id}`}
                  >
                    {qr.revenue}
                  </TableCell>
                  <TableCell
                    className="text-right font-medium dark:text-white"
                    id={`qr-users-${qr.id}`}
                  >
                    {qr.uniqueUsers}
                  </TableCell>
                  <TableCell id={`qr-last-used-${qr.id}`}>
                    <div
                      className="flex items-center"
                      id={`qr-last-used-content-${qr.id}`}
                    >
                      <ClockIcon
                        className="h-4 w-4 mr-2 text-muted-foreground"
                        id={`qr-last-used-icon-${qr.id}`}
                      />

                      <span
                        className="dark:text-white"
                        id={`qr-last-used-text-${qr.id}`}
                      >
                        {format(new Date(qr.last_used || ""), "dd/MM/yyyy")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell id={`qr-actions-${qr.id}`}>
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          id={`delete-button-${qr.id}`}
                        >
                          <TrashIcon
                            className="h-4 w-4"
                            id={`delete-icon-${qr.id}`}
                          />
                        </Button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content
                          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 z-50"
                          sideOffset={5}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <TrashIcon className="h-4 w-4 text-red-500" />
                              <p className="text-sm font-medium dark:text-white">
                                ¿Eliminar código QR?
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground dark:text-gray-400">
                              Esta acción no se puede deshacer. Se eliminará permanentemente el código QR "{qr.name}".
                            </p>
                            <div className="flex justify-end gap-2 pt-2">
                              <Popover.Close asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-xs"
                                >
                                  Cancelar
                                </Button>
                              </Popover.Close>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-xs"
                                disabled={deletingQrId === qr.id}
                                onClick={(e) => {
                                  // if(user?.role === "client" || user?.role === "manager") {
                                  //   toast({
                                  //     title: "Error",
                                  //     description: "No tienes permiso para eliminar códigos QR.",
                                  //     variant: "destructive",
                                  //   });
                                  //   return;
                                  // }
                                  e.stopPropagation();
                                  handleDeleteQr(qr.id);
                                }}
                              >
                                {deletingQrId === qr.id ? (
                                  <>
                                    <Loader2Icon className="h-3 w-3 mr-1 animate-spin" />
                                    Eliminando...
                                  </>
                                ) : (
                                  'Eliminar'
                                )}
                              </Button>
                            </div>
                          </div>
                          <Popover.Close
                            className="absolute top-2 right-2 p-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            aria-label="Close"
                          >
                            <Cross2Icon className="h-3 w-3" />
                          </Popover.Close>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* QR Details Dialog */}
      <Dialog open={isQrDetailsOpen} onOpenChange={setIsQrDetailsOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2Icon className="animate-spin" />
            </div>
          ) : selectedQr ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center dark:text-white">
                  <QrCodeIcon className="h-5 w-5 mr-2 text-blue-500" />

                  {selectedQr.name || ""}
                </DialogTitle>
                <DialogDescription>
                  <div className="flex items-center text-muted-foreground dark:text-gray-400">
                    <MapPinIcon className="h-4 w-4 mr-1" />

                    {selectedQr.location || ""}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 my-4">
                {/* QR Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Fecha de Creación
                    </p>
                    <p className="font-medium dark:text-white">
                      {new Date(selectedQr.created_at || "").toLocaleDateString(
                        "es-ES"
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Total de Pedidos
                    </p>
                    <p className="font-medium dark:text-white">{totalOrders}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Ingresos Totales
                    </p>
                    <p className="font-medium dark:text-white">
                      $ {totalRevenue}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Usuarios Únicos
                    </p>
                    <p className="font-medium dark:text-white">
                      {totalUniqueUsers}
                    </p>
                  </div>
                </div>

                <Separator className="dark:bg-gray-800" />

                <Separator className="dark:bg-gray-800" />

                {/* QR Performance Charts */}
                <div>
                  <Tabs
                    defaultValue="evolution"
                    className="w-full"
                    onValueChange={setActiveTab}
                    value={activeTab}
                  >
                    <TabsList className="mb-4 dark:bg-gray-800">
                      <TabsTrigger
                        value="evolution"
                        className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                      >
                        Evolución de Pedidos
                      </TabsTrigger>
                      <TabsTrigger
                        value="users"
                        className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                      >
                        Top Usuarios
                      </TabsTrigger>
                      <TabsTrigger
                        value="comparison"
                        className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                      >
                        Comparación
                      </TabsTrigger>
                      <TabsTrigger
                        value="qr"
                        className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                      >
                        QR Code
                      </TabsTrigger>
                    </TabsList>

                    <div className="h-[300px]">
                      {activeTab === "evolution" && (
                        <QrPerformanceChart qrOrders={qrOrders} />
                      )}

                      {activeTab === "users" && (
                        <QrUsersList
                          qrOrders={qrOrders}
                          onUserClick={handleUserClick}
                        />
                      )}

                      {activeTab === "comparison" && (
                        <QrComparisonChart qrId={selectedQr.id || ""} />
                      )}
                      {activeTab === "qr" && (
                        <div className="flex flex-col items-center justify-center pt-4">
                          <QRCodeSVG
                            id="qr-canvas"
                            value={`${process.env.NEXT_PUBLIC_WEB_URL}qr-tracking/${selectedQr.id}`}
                            size={240}
                            level="H"
                            includeMargin={true}
                          />
                          <CardContent className="flex justify-between gap-2">
                            <Button
                              variant="outline"
                              onClick={handleCopyLink}
                              className="flex-1"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Copiar Enlace
                            </Button>
                            <Button onClick={handleDownload} className="flex-1">
                              <Download className="mr-2 h-4 w-4" />
                              Descargar QR
                            </Button>
                          </CardContent>
                        </div>
                      )}
                    </div>
                  </Tabs>
                </div>

                <Separator className="dark:bg-gray-800" />

                {/* QR Orders List */}
                <div>
                  <h3 className="text-lg font-medium mb-4 dark:text-white">
                    Pedidos Realizados
                  </h3>
                  <div className="space-y-4">
                    {qrOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-start p-4 rounded-lg border dark:border-gray-800 hover:bg-muted/50 dark:hover:bg-gray-800/50 cursor-pointer"
                        onClick={() => handleUserClick(order.user_id || "")}
                        id={`qr-order-${order.id}`}
                      >
                        <Avatar
                          className="h-10 w-10 mr-4"
                          id={`qr-order-avatar-${order.id}`}
                        >
                          <AvatarImage
                            src={order?.user?.avatar}
                            alt={order?.user?.name}
                            id={`qr-order-avatar-img-${order.id}`}
                          />

                          <AvatarFallback
                            id={`qr-order-avatar-fallback-${order.id}`}
                          >
                            {order?.user?.name?.charAt(0) ||
                              order?.user?.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="flex-1"
                          id={`qr-order-details-${order.id}`}
                        >
                          <div
                            className="flex justify-between items-start"
                            id={`qr-order-header-${order.id}`}
                          >
                            <div id={`qr-order-user-${order.id}`}>
                              <p
                                className="font-medium dark:text-white"
                                id={`qr-order-user-name-${order.id}`}
                              >
                                {order?.user?.name}
                              </p>
                              <p
                                className="text-xs text-muted-foreground dark:text-gray-400"
                                id={`qr-order-user-email-${order.id}`}
                              >
                                {order?.user?.email}
                              </p>
                            </div>
                            <div
                              className="text-right"
                              id={`qr-order-info-${order.id}`}
                            >
                              <p
                                className="font-medium dark:text-white"
                                id={`qr-order-id-${order.id}`}
                              >
                                Order - {order.id}
                              </p>
                              <p
                                className="text-xs text-muted-foreground dark:text-gray-400"
                                id={`qr-order-date-${order.id}`}
                              >
                                {format(order.created_at, "dd/MM/yyyy")}
                              </p>
                            </div>
                          </div>
                          <div
                            className="mt-2"
                            id={`qr-order-items-${order.id}`}
                          >
                            <p
                              className="text-sm dark:text-gray-300"
                              id={`qr-order-items-list-${order.id}`}
                            >
                              {order.order_items
                                .map((item) => item?.products?.name)
                                .join(", ")}
                            </p>
                          </div>
                          <div
                            className="mt-2 flex justify-between items-center"
                            id={`qr-order-footer-${order.id}`}
                          >
                            <Badge
                              className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                              id={`qr-order-status-${order.id}`}
                            >
                              Completado
                            </Badge>
                            <p
                              className="font-bold dark:text-white"
                              id={`qr-order-total-${order.id}`}
                            >
                              ${order.total_amount}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:text-gray-300"
                  onClick={() => setIsQrDetailsOpen(false)}
                >
                  Cerrar
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  Generar Nuevo QR
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog open={isUserDetailsOpen} onOpenChange={setIsUserDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
          {selectedUserId && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center dark:text-white">
                  Detalles del Usuario
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 my-4">
                {/* User Info */}
                {qrUser ? (
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={qrUser?.avatar} alt={qrUser?.name} />

                      <AvatarFallback>
                        {qrUser?.name?.charAt(0) || qrUser?.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-medium dark:text-white">
                        {qrUser?.name}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {qrUser?.email}
                      </p>
                      <div className="flex items-center mt-1">
                        <Badge
                          variant="outline"
                          className="mr-2 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {qrUser?.ordersCount} Pedidos
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        >
                          ${qrUser?.totalSpent} Gastados
                        </Badge>
                      </div>
                    </div>
                  </div>
                ) : (
                  <Skeleton className="h-16 w-16" />
                )}

                <Separator className="dark:bg-gray-800" />
                <div>
                  <h3 className="text-md font-medium mb-2 dark:text-white">
                    Productos Frecuentes
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {qrUser?.frequentItems.map((item, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        id={`user-item-${index}`}
                      >
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator className="dark:bg-gray-800" />

                {/* User Order History */}
                <div>
                  <h3 className="text-md font-medium mb-3 dark:text-white">
                    Historial de Pedidos
                  </h3>
                  <div className="space-y-3">
                    {isLoading ? (
                      <Loading />
                    ) : (
                      qrOrders
                        .filter((order) => order.user_id == selectedUserId)
                        .map((order, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg dark:border-gray-800"
                            id={`user-order-${index}`}
                          >
                            <div
                              className="flex justify-between items-center mb-2"
                              id={`user-order-header-${index}`}
                            >
                              <p
                                className="font-medium dark:text-white"
                                id={`user-order-id-${index}`}
                              >
                                Order - {order.id}
                              </p>
                              <p
                                className="text-sm text-muted-foreground dark:text-gray-400"
                                id={`user-order-date-${index}`}
                              >
                                {format(order.created_at, "dd/MM/yyyy HH:mm")}
                              </p>
                            </div>
                            <p
                              className="text-sm dark:text-gray-300 mb-2"
                              id={`user-order-items-${index}`}
                            >
                              {order.order_items
                                .map((item) => item.products?.name)
                                .join(", ")}
                            </p>
                            <div
                              className="flex justify-end"
                              id={`user-order-total-${index}`}
                            >
                              <p
                                className="font-bold dark:text-white"
                                id={`user-order-total-value-${index}`}
                              >
                                $ {order.total_amount}
                              </p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  className="dark:border-gray-700 dark:text-gray-300 mr-2"
                  onClick={() => setIsUserDetailsOpen(false)}
                >
                  Cerrar
                </Button>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Enviar Promoción
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={qrGeneratorOpen} onOpenChange={setQrGeneratorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generador de Código QR</DialogTitle>
          </DialogHeader>
          <QRGenerator handleClose={() => setQrGeneratorOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={barCreatorOpen} onOpenChange={setBarCreatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Barra</DialogTitle>
          </DialogHeader>
          <BarCreator handleClose={() => setBarCreatorOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
