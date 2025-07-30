import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { PackagePlus, PackageX, Filter, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface StockAdjustmentHistoryProps {
  className?: string;
  selectedBar?: number;
}

export interface StockAdjustmentHistoryRef {
  refreshHistory: () => void;
}

export const StockAdjustmentHistory = forwardRef<
  StockAdjustmentHistoryRef,
  StockAdjustmentHistoryProps
>(({ className, selectedBar = -1 }, ref) => {
  const [activeTab, setActiveTab] = useState("reingress");
  const [filterBar, setFilterBar] = useState(selectedBar);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  interface AdjustmentData {
    id: string;
    date: string;
    product: string;
    quantity: number;
    reason: string;
    bar: string;
    bar_id: number;
    status: string;
    cost: number;
    isOpened: boolean;
    type: string;
    previouslyRegistered?: boolean;
  }

  const [reingresData, setReingresData] = useState<AdjustmentData[]>([]);
  const [lossesData, setLossesData] = useState<AdjustmentData[]>([]);

  // Filter data based on bar and search term
  const filteredReingresData = reingresData.filter((item) => {
    const matchesBar = filterBar === -1 || item.bar_id == filterBar;
    const matchesSearch =
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBar && matchesSearch;
  });

  const filteredLossesData = lossesData.filter((item) => {
    const matchesBar = filterBar === -1 || item.bar_id == filterBar;
    const matchesSearch =
      item.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reason.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesBar && matchesSearch;
  });

  const fetchAdjustHistory = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/adjust", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to fetch adjustment history"
        );
      }
      const data = await response.json();
      const adjustList = data.map((item: any) => ({
        id: item.id,
        date: format(new Date(item.created_at), "dd/MM/yyyy HH:mm"),
        product: item?.inventory?.products?.name || "Unknown",
        quantity: item.amount,
        reason: item.reason,
        bar: item?.inventory?.bars?.name || "Unknown",
        bar_id: item?.inventory?.bar_id,
        status: item.status || "pending",
        cost: item.economic_value,
        isOpened: item.is_opened,
        type: item.type,
      }));

      const entryList = adjustList.filter(
        (item: any) => item.type === "re-entry"
      );
      const lossList = adjustList.filter((item: any) => item.type === "loss");
      setReingresData(entryList);
      setLossesData(lossList);
    } catch (error) {
      console.error("Error fetching adjustment history:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshHistory: fetchAdjustHistory,
  }));

  useEffect(() => {
    fetchAdjustHistory();
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historial de Ajustes de Stock</CardTitle>
            <CardDescription>
              Registro de reingresos y pérdidas de inventario
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAdjustHistory}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Buscar por producto o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* {selectedBar === -1 && (
            <Select value={filterBar} onValueChange={setFilterBar}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Seleccionar bar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los bares</SelectItem>
                <SelectItem value="Bar Central">Bar Central</SelectItem>
                <SelectItem value="Bar Norte">Bar Norte</SelectItem>
                <SelectItem value="Bar Sur">Bar Sur</SelectItem>
                <SelectItem value="Bar VIP">Bar VIP</SelectItem>
              </SelectContent>
            </Select>
          )} */}
        </div>

        <Tabs
          defaultValue="reingress"
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reingress" className="flex items-center">
              <PackagePlus className="mr-2 h-4 w-4" />
              Reingresos
            </TabsTrigger>
            <TabsTrigger value="losses" className="flex items-center">
              <PackageX className="mr-2 h-4 w-4" />
              Pérdidas
            </TabsTrigger>
          </TabsList>

          {/* Reingresos */}
          <TabsContent value="reingress">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Bar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReingresData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">
                      {item.product}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.bar}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">
                          Costo: {item.cost}
                        </div>
                        {item.isOpened && (
                          <Badge
                            variant="outline"
                            className="text-amber-600 border-amber-600 text-xs"
                          >
                            Abierto
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredReingresData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No hay reingresos que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>

          {/* Pérdidas */}
          <TabsContent value="losses">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Bar</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLossesData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.date}</TableCell>
                    <TableCell className="font-medium">
                      {item.product}
                    </TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.reason}</TableCell>
                    <TableCell>{item.bar}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-red-50 text-red-700 border-red-200"
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="text-xs text-muted-foreground">
                          {item.previouslyRegistered
                            ? "Previamente registrado"
                            : "No registrado en sistema"}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredLossesData.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-muted-foreground"
                    >
                      No hay pérdidas que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
