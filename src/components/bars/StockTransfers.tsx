import { useState, useRef } from "react";
import { StockTransfersList } from "@/components/stock/StockTransfersList";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowRightLeft, AlertCircle, Info, Loader2 } from "lucide-react";
import { MultiSelectBarsField } from "@/components/bars/MultiSelectBarsField";
import { useAppContext } from "@/context/AppContext";
import { StockControlInfo } from "@/components/stock/StockControlInfo";
import { useAuth } from "@/context/AuthContext";

// Mock data for bar stock items - would be replaced with real data from API
const barStockItems = [
  {
    id: 1,
    product: "Vodka Absolut 750ml",
    category: "Alcoholico",
    quantity: 12,
    status: "En Stock",
  },
];

export const StockTransfers = ({ selectedBar }: { selectedBar: number }) => {
  const [selectedItems, setSelectedItems] = useState<{
    [key: number]: boolean;
  }>({});

  const [transferQuantities, setTransferQuantities] = useState<{
    [key: number]: number;
  }>({});
  const {user} = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDestinationBars, setSelectedDestinationBars] = useState<
    string[]
  >([]);
  const [isTransferring, setIsTransferring] = useState(false);
  const transferInProgress = useRef(false);
  const lastClickTime = useRef(0);

  const { stocksData, fetchStocksOfBar } = useAppContext();

  console.log("selectedBar ------>", selectedBar);

  // Filter stock items for the selected bar, for a real app this would use the selectedBar param
  const filteredStockItems =
    selectedBar == -1
      ? stocksData
      : stocksData.filter((item) => Number(item.barId) == selectedBar);

  const handleSelectItem = (itemId: number, barId: number) => {
    setSelectedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));

    // Initialize quantity to 1 if selecting, or remove if deselecting
    setTransferQuantities((prev) => {
      if (!prev[itemId] || prev[itemId] === undefined) {
        return { ...prev, [itemId]: 1 };
      } else if (!selectedItems[itemId]) {
        const newQuantities = { ...prev };
        delete newQuantities[itemId];
        return newQuantities;
      }
      return prev;
    });
  };

  const handleQuantityChange = (itemId: number, quantity: string) => {
    // If itemId became NaN (e.g. from Number(undefined) or Number("foo"))
    // it's not a valid key for an object typed with [key: number]: number
    // because "NaN" is not a string representation of a valid number.
    if (isNaN(itemId)) {
      toast.error("Error: Se intentó actualizar un artículo con ID inválido.");
      console.error(
        "Invalid itemId (NaN) in handleQuantityChange. Original value that led to NaN is not directly available here."
      );
      return;
    }

    const numericQuantity = parseInt(quantity);
    // If quantity is not a positive number, we might want to clear it or do nothing.
    // Let's adjust this: if input is cleared (empty string) or invalid, remove from transferQuantities or set to 0.
    // For now, if it's not a valid positive number, we effectively do nothing or revert.
    if (quantity === "" || isNaN(numericQuantity) || numericQuantity < 0) {
      // Allow 0 for clearing
      setTransferQuantities((prev) => {
        const updatedQuantities = { ...prev };
        if (
          quantity === "" ||
          (numericQuantity === 0 && !isNaN(numericQuantity))
        ) {
          // Explicitly clear or set to 0
          delete updatedQuantities[itemId];
          // Or updatedQuantities[itemId] = 0; if 0 is a valid transfer quantity
        } else {
          // If input was invalid (e.g. "abc", or negative), do not change, or revert.
          // Current behavior: effectively ignores invalid positive numbers.
          // For negative or truly NaN, we might want to also delete or ignore.
          // The original code returned if numericQuantity <= 0. Let's stick to modifying only for positive.
          if (numericQuantity <= 0 && !isNaN(numericQuantity)) {
            // if it was 0 or negative (but a number)
            delete updatedQuantities[itemId];
            // Or set to 0
          }
          // If it was NaN from parseInt, we just don't update. The input field will still hold "abc".
        }
        return updatedQuantities;
      });
      return;
    }
    // At this point, numericQuantity is a positive integer.

    const itemFound = filteredStockItems.find((item) => {
      // Ensure comparison is robust, assuming item.id could be string or number
      const currentItemId = Number(item.id);
      return !isNaN(currentItemId) && currentItemId === itemId;
    });

    let maxStock = 0;
    if (itemFound) {
      if (typeof itemFound.quantity === "string") {
        maxStock = parseInt(itemFound.quantity, 10) || 0;
      } else if (typeof itemFound.quantity === "number") {
        maxStock = itemFound.quantity;
      }
    } else {
      // If item not found (e.g. after a filter change), this could be an issue.
      // However, itemId itself should be valid from the rendered list.
      console.warn(
        `Item with id ${itemId} not found in filteredStockItems during quantity change.`
      );
      // Depending on desired behavior, might want to return or prevent update.
    }

    if (numericQuantity > maxStock) {
      toast.error("No puedes transferir más unidades que el stock disponible");
      // Optionally, cap the quantity at maxStock instead of just showing an error
      // setTransferQuantities((prev) => ({
      //   ...prev,
      //   [itemId]: maxStock,
      // }));
      return;
    }

    setTransferQuantities((prev) => ({
      ...prev,
      [itemId]: numericQuantity,
    }));
  };

  const handleSelectAll = () => {
    // If all are selected, unselect all. Otherwise, select all
    const allSelected = filteredStockItems.every(
      (item) => selectedItems[Number(item.id)]
    );

    if (allSelected) {
      setSelectedItems({});
      setTransferQuantities({});
    } else {
      const newSelectedItems: { [key: number]: boolean } = {};
      const newQuantities: { [key: number]: number } = {};

      filteredStockItems.forEach((item) => {
        newSelectedItems[Number(item.id)] = true;
        newQuantities[Number(item.id)] = 1;
      });

      setSelectedItems(newSelectedItems);
      setTransferQuantities(newQuantities);
    }
  };

  const handleTransfer = async () => {
    // Prevent multiple clicks using both state and ref for extra safety
    if (isTransferring || transferInProgress.current) {
      console.log("Transfer already in progress, ignoring click");
      return;
    }

    // Prevent rapid clicks (within 500ms)
    const now = Date.now();
    if (now - lastClickTime.current < 10) {
      console.log("Click too fast, ignoring");
      return;
    }
    lastClickTime.current = now;

    // Validate selections
    const selectedItemsCount = Object.keys(selectedItems).filter(
      (key) => selectedItems[Number(key)]
    ).length;

    if (selectedItemsCount === 0) {
      toast.error("Selecciona al menos un producto para transferir");
      return;
    }

    if (selectedDestinationBars.length === 0) {
      toast.error("Selecciona al menos un destino (barra o stock general)");
      return;
    }

    // Validate quantities before starting transfer
    for (const itemId of Object.keys(selectedItems)) {
      if (selectedItems[Number(itemId)]) {
        const quantity = transferQuantities[Number(itemId)] || 0;
        const item = filteredStockItems.find(item => Number(item.id) === Number(itemId));
        
        if (quantity <= 0) {
          toast.error(`Debes especificar una cantidad mayor a 0 para ${item?.name || 'el producto'}`);
          return;
        }
        
        if (item && quantity > item.quantity) {
          toast.error(`No puedes transferir más unidades que el stock disponible para ${item.name}`);
          return;
        }
      }
    }

    // Set both state and ref BEFORE any async operations
    setIsTransferring(true);
    transferInProgress.current = true;
    console.log("Starting transfer, isTransferring set to true");

    let fromBars: any[] = [];
    if (selectedBar == -1) {
      Object.keys(selectedItems).forEach((key) => {
        fromBars.push(
          stocksData.filter((item) => item.id == Number(key))[0].barId
        );
      });
    } else {
      fromBars = [selectedBar];
    }

    const isTransferToGeneralStock = selectedDestinationBars.includes("general-stock");
    const destinationBars = isTransferToGeneralStock
      ? ["general-stock"]
      : selectedDestinationBars.filter(bar => bar !== "general-stock");

    const body = {
      inventory_id: Object.keys(selectedItems),
      from_id: fromBars,
      to_id: destinationBars,
      quantity: Object.values(transferQuantities),
      transfer_to_general_stock: isTransferToGeneralStock,
    };

    console.log("body", body);

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to transfer stock");
      }

      // Process transfer
      const destination = isTransferToGeneralStock
        ? "stock general"
        : destinationBars.length === 1
          ? "la barra seleccionada"
          : `${destinationBars.length} barras`;
      toast.success(
        `Se ha transferido stock exitosamente a ${destination}`
      );

      // Refresh inventory data
      await fetchStocksOfBar(selectedBar === -1 ? undefined : selectedBar);

      // Trigger transfer history refresh
      setRefreshTrigger(prev => prev + 1);

      // Reset state
      setSelectedItems({});
      setTransferQuantities({});
      setSelectedDestinationBars([]);
      setDialogOpen(false);
    } catch (error: any) {
      console.error("Error al transferir stock:", error);
      toast.error(error.message || "Error al transferir stock");
    } finally {
      setIsTransferring(false);
      transferInProgress.current = false;
    }
  };

  const getSelectedItemsCount = () => {
    return Object.keys(selectedItems).filter(
      (key) => selectedItems[Number(key)]
    ).length;
  };

  const handleDestinationBarsChange = (bars: string[]) => {
    setSelectedDestinationBars(bars);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">
            Transferencias de Stock{" "}
            {selectedBar !== -1 ? `- Bar ${selectedBar}` : "- Todas las barras"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Gestiona transferencias entre barras y hacia stock general
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowInfoModal(true)}
          >
            <Info className="h-4 w-4" />
            Cómo funciona
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              // if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
              //   toast.error("No tienes permiso para transferir stock");
              //   return;
              // }
              handleSelectAll();
            }}
          >
            <Checkbox
              checked={filteredStockItems.every(
                (item) => selectedItems[Number(item.id)]
              )}
            />
            Seleccionar todos
          </Button>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                disabled={getSelectedItemsCount() === 0}
                onClick={() => setDialogOpen(true)}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                Transferir seleccionados ({getSelectedItemsCount()})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferir productos</DialogTitle>
                <DialogDescription>
                  Selecciona uno o múltiples destinos para transferir los productos
                  seleccionados (barras específicas o stock general)
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                <div className="mb-4">
                  <label className="text-sm font-medium">Destino de transferencia</label>
                  <MultiSelectBarsField
                    onSelectionChange={handleDestinationBarsChange}
                    placeholder="Seleccionar destino (barras o stock general)"
                    singleSelection={false}
                    initialSelection={[]}
                    includeGeneralStock={true}
                    excludeBarIds={selectedBar !== -1 ? [selectedBar.toString()] : []}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Puedes seleccionar múltiples barras destino o transferir al stock general
                  </p>
                </div>

                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        {selectedBar == -1 && <TableHead>Barra</TableHead>}
                        <TableHead>Cantidad</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStockItems
                        .filter((item) => selectedItems[Number(item.id)])
                        .map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                            </TableCell>
                            {selectedBar == -1 && (
                              <TableCell>{item.barName}</TableCell>
                            )}
                            <TableCell>
                              {transferQuantities[Number(item.id)] || 1}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {getSelectedItemsCount() === 0 && (
                  <div className="flex items-center justify-center p-4 text-amber-600">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>No hay productos seleccionados</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isTransferring}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleTransfer}
                  disabled={isTransferring}
                  className={isTransferring ? "opacity-50 cursor-not-allowed" : ""}
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transfiriendo...
                    </>
                  ) : (
                    "Confirmar transferencia"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Producto</TableHead>
                {selectedBar == -1 && <TableHead>Barra</TableHead>}

                <TableHead>Stock Actual</TableHead>
                <TableHead>Cantidad a Transferir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedItems[Number(item.id)] || false}
                      onCheckedChange={() =>
                        {
                          // if (user?.role === "barman" || user?.role === "client" || user?.role === "manager") {
                          //   toast.error("No tienes permiso para transferir stock");
                          //   return;
                          // }
                          handleSelectItem(Number(item.id), item.barId)
                        }
                      }
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  {selectedBar == -1 && <TableCell>{item.barName}</TableCell>}
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-20"
                      type="number"
                      min={1}
                      max={Number(item.quantity)}
                      value={transferQuantities[Number(item.id)] || ""}
                      disabled={!selectedItems[Number(item.id)]}
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
                          handleQuantityChange(Number(item.id), value);
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transferencias</CardTitle>
          <CardDescription>
            Registro de todas las transferencias realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockTransfersList selectedBar={selectedBar} refreshTrigger={refreshTrigger} />
        </CardContent>
      </Card>

      {/* Stock Control Information Modal */}
      <Dialog open={showInfoModal} onOpenChange={setShowInfoModal}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Control de Stock y Transferencias</DialogTitle>
            <DialogDescription>
              Información detallada sobre cómo funciona el sistema de control de inventario
            </DialogDescription>
          </DialogHeader>
          <StockControlInfo />
        </DialogContent>
      </Dialog>
    </div>
  );
};
