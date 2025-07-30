import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Eye, Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MultipleTransfer } from "@/components/stock/MultipleTransfer";
import { useAppContext } from "@/context/AppContext";

// Filter options
const transferTypeOptions = ["Todos", "Permanente", "Temporal"];
const statusOptions = ["Todos", "Completada", "Pendiente", "En tránsito"];

interface StockTransfersListProps {
  selectedBar: number;
  refreshTrigger?: number;
}

export const StockTransfersList = ({
  selectedBar,
  refreshTrigger,
}: StockTransfersListProps) => {
  const [transferType, setTransferType] = useState("Todos");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [multipleTransferOpen, setMultipleTransferOpen] = useState(false);
  const [transfersData, setTransfersData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { barsData } = useAppContext();

  // Fetch transfer data from API
  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/transfer');
      if (!response.ok) {
        throw new Error('Failed to fetch transfers');
      }
      const data = await response.json();
      setTransfersData(data || []);
    } catch (error) {
      console.error("Error fetching transfers:", error);
      setTransfersData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [refreshTrigger]);

  // Helper function to get bar name by ID
  const getBarName = (barId: string | number | null) => {
    if (!barId) return "Stock General";
    const bar = barsData.find(b => b.id?.toString() === barId.toString());
    return bar?.name || `Bar ${barId}`;
  };

  // Helper function to format date with relative time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    // Show relative time for recent transfers
    if (diffInMinutes < 1) {
      return "Hace un momento";
    } else if (diffInMinutes < 60) {
      return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else if (diffInDays < 7) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    } else {
      // Show full date for older transfers
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Helper function to get full date and time
  const getFullDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Filter and sort logic
  const filteredTransfers = transfersData
    .filter((transfer) => {
      const matchesBar =
        selectedBar === -1 ||
        transfer.from_bar?.toString() === selectedBar.toString() ||
        transfer.to_bar?.toString() === selectedBar.toString();
      const matchesType =
        transferType === "Todos" || transfer.transferType === transferType;
      const matchesStatus =
        statusFilter === "Todos" || transfer.status === statusFilter;
      return matchesBar && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      // Sort by created_at date in descending order (most recent first)
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });



  const handleMultipleTransferSuccess = (data: any) => {
    console.log("Nueva transferencia creada:", data);
    // Aquí iría la lógica para actualizar la lista de transferencias
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Select value={transferType} onValueChange={setTransferType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Tipo de transferencia" />
          </SelectTrigger>
          <SelectContent>
            {transferTypeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Button onClick={() => setMultipleTransferOpen(true)}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Nueva Transferencia
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Transferencias entre Barras</CardTitle>
          <CardDescription>
            Movimiento de productos entre barras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Origen</TableHead>
                <TableHead>Destino</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4">
                    Cargando transferencias...
                  </TableCell>
                </TableRow>
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                    No hay transferencias registradas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((transfer) => {
                  const transferDate = new Date(transfer.created_at);
                  const isVeryRecent = (new Date().getTime() - transferDate.getTime()) < (5 * 60 * 1000); // Less than 5 minutes

                  return (
                    <TableRow key={transfer.id} className={isVeryRecent ? "bg-green-50" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {isVeryRecent && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Transferencia reciente"></div>
                          )}
                          {transfer.inventory?.products?.name || "Producto desconocido"}
                        </div>
                      </TableCell>
                    <TableCell>{transfer.amount}</TableCell>
                    <TableCell>{getBarName(transfer.from_bar)}</TableCell>
                    <TableCell>{getBarName(transfer.to_bar)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium" title={getFullDateTime(transfer.created_at)}>
                          {formatDate(transfer.created_at)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transfer.created_at).toLocaleDateString('es-ES', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Permanente
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        Completada
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para transferencia múltiple */}
      <Dialog
        open={multipleTransferOpen}
        onOpenChange={setMultipleTransferOpen}
      >
        <DialogContent className="sm:max-w-[900px]">
          <MultipleTransfer
            onClose={() => setMultipleTransferOpen(false)}
            onSuccess={handleMultipleTransferSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
