import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, QrCode, ArrowRightLeft, Users, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BarData } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { TrashIcon } from "@radix-ui/react-icons";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// Mock data para las barras
// const barsData = [
//   {
//     id: 1,
//     name: "Bar Central",
//     sales: "$82,350",
//     orders: 875,
//     qrCodes: 3,
//     staff: 5,
//     stockItems: 42,
//     status: "active",
//   }
// ];
interface Statistics {
  barId: string;
  totalOrders: number;
  totalStaff: number;
  totalQrs: number;
  totalProducts: number;
  totalRevenue: number;
}
interface BarVisualizationProps {
  className?: string;
}
export function BarVisualization({ className }: BarVisualizationProps) {
  const router = useRouter();
  const {user} = useAuth()
  const { barsData, qrCodesData, ordersData, staffData, stocksData, fetchBars, fetchQRCodes, fetchOrders, fetchStaff, fetchStocksOfBar } = useAppContext();
  const [statistics, setStatistics] = useState<Statistics[]>([]);
  const [selectedBarId, setSelectedBarId] = useState<string|null>(null);
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchBars();
    fetchQRCodes();
    fetchOrders();
    fetchStaff();
    fetchStocksOfBar();
  }, []);

  const calculateBarStatistics = () => {

    if (!barsData || !qrCodesData || !ordersData || !staffData || !stocksData) return [];
    const barStatsMap = new Map<string, Statistics>();
    barsData.forEach(bar => {
      barStatsMap.set(bar.id || "", {
        barId: bar.id || "",
        totalOrders: 0,
        totalStaff: 0,
        totalQrs: 0,
        totalProducts: 0,
        totalRevenue: 0
      });
    });

    // Count QR codes per bar
    qrCodesData.forEach((qr: any) => {
      const stats = barStatsMap.get(qr.bar_id);
      if (stats) {
        stats.totalQrs++;
      }
    });

    // Count orders per bar
    ordersData.forEach((order: any) => {
      const stats = barStatsMap.get(order?.qr_codes?.bar_id);
      if (stats) {
        stats.totalOrders++;
        stats.totalRevenue += order.total_amount;
      }
    });

    // Count staff per bar
    staffData.forEach((staff: any) => {
      const stats = barStatsMap.get(staff.bar_id);
      if (stats) {
        stats.totalStaff++;
      }
    });
    stocksData.forEach((stock: any) => {
      const stats = barStatsMap.get(stock.barId);
      if (stats) {
        stats.totalProducts++;
      }
    });
    // Convert the map to an array of results
    return Array.from(barStatsMap.values());

  }

  useEffect(() => {
    const stats = calculateBarStatistics();
    if (stats) {
      setStatistics(stats);
    }
  }, [barsData, qrCodesData, ordersData, staffData, stocksData]);

  const handleViewBarDetail = (barId: string) => {
    router.push(`/bars/${barId}`);
  };

  const handleDeleteOrder = async (id: string | undefined) => {
    if(id == undefined) return;
    setSelectedBarId(id);
    setConfirmOpen(true);
  };

  const handleDeleteBarConfirm = async () => {
    const res =  await fetch(`/api/bars`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: selectedBarId }),
    });

    if (!res.ok) {
      throw new Error("Failed to deleted");
    }
    setConfirmOpen(false);
    fetchBars();
  }

  const handleDeleteBarCancel = () => {
    setConfirmOpen(false);
  }

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Visualización de Barras</h2>
        <Button variant="outline" size="sm">
          <BarChart className="mr-2 h-4 w-4" />
          Ver Estadísticas Detalladas
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {barsData.map((bar) => (
          <Card
            key={bar.id}
            className="overflow-hidden border-t-4 border-t-stone-500 relative"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center mt-2 mr-2">
                <CardTitle className="text-lg">{bar.name}</CardTitle>
                <Badge
                  variant={bar.status === "active" ? "default" : "outline"}
                >
                  {bar.status === "active" ? "Activa" : "Inactiva"}
                </Badge>
                <Button
                  variant="ghost"
                  className="hover:text-red-600 absolute top-[2px] right-[2px] padding-0"
                  size="icon"
                  onClick={(e) => {
                    // if(user?.role === "client" || user?.role === "manager") {
                    //   toast.error("No tienes permiso para eliminar barras");
                    //   return;
                    // }
                    e.stopPropagation();
                    e.preventDefault();
                    handleDeleteOrder(bar?.id);
                  }}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
              <CardDescription>Ventas: {"$" + (statistics.find((stat) => stat.barId === bar.id)?.totalRevenue || 0)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.find((stat) => stat.barId === bar.id)?.totalOrders || 0}</div>
                  <div className="text-xs text-muted-foreground">Pedidos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.find((stat) => stat.barId === bar.id)?.totalQrs || 0}</div>
                  <div className="text-xs text-muted-foreground">QRs</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{statistics.find((stat) => stat.barId === bar.id)?.totalProducts || 0}</div>
                  <div className="text-xs text-muted-foreground">Productos</div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-100"
                >
                  {statistics.find((stat) => stat.barId === bar.id)?.totalProducts || 0} productos en stock
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // if(user?.role === "client" || user?.role === "manager") {
                    //   toast.error("No tienes permiso para ver detalles de barras");
                    //   return;
                    // }
                    handleViewBarDetail(bar?.id || "1")
                  }}
                >
                  Ver Detalle
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{'Eliminar'} bar</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => handleDeleteBarCancel()}>Cancelar</Button>
            </DialogClose>
            <Button onClick={() => handleDeleteBarConfirm()}>Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
