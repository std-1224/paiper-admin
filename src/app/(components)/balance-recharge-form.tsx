"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode, RotateCw, Search } from "lucide-react";
import { QrScanner } from "./qr-scanner";
import { UserSearchField } from "@/components/users/UserSearchField";
import { User } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
import { set } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function BalanceRechargeForm() {
  const [clientCode, setClientCode] = useState("");
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("card");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { usersData, fetchUsers } = useAppContext();
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentLink, setPaymentLink] = useState("");
  const [isAddingBalance, setIsAddingBalance] = useState(false);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setAmount(value);
  };

  const handlePresetAmount = (value: number) => {
    setAmount(value);
  };

  const handleClientCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientCode(e.target.value);
    if (e.target.value) {
      const user = usersData.find((user) => user.id === e.target.value);
      user && setSelectedUser(user);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };

  const handleScanUser = (result: string) => {
    setClientCode(result);
    const [userId, clientAmount] = result.split("/");
    const user = usersData.find((user) => user.id.toString() === userId);
    if (user) setSelectedUser(user);
    clientAmount && setAmount(Number(clientAmount));
  };

  useEffect(() => {
    usersData.length === 0 && fetchUsers();
  }, []);

  const handleAddBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingBalance(true);
    if (!selectedUser) {
      toast.success("Por favor, seleccione un usuario.");
      return;
    }
    if (paymentMethod === "card") {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chargeAmount: amount,
          userId: selectedUser?.id,
          payer: {
            email: selectedUser?.email,
            name: selectedUser?.name,
          },
        }),
      });
      const data = await res.json();
      console.log("Payment data:", data);
      setPaymentLink(data.data.paymentUrl);
      setPaymentModal(true);
      setIsAddingBalance(false);
    } else if (paymentMethod === "cash") {
      const res = await fetch("/api/balance-recharge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser?.id,
          chargeAmount: amount,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Carga de balance exitosa para ${
            selectedUser.name || selectedUser.email
          }`
        );
        setClientCode("");
        setAmount(0);
      } else {
        toast.error(`Error al cargar balance: ${data.error}`);
      }
      setIsAddingBalance(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-gray-100 dark:bg-gray-800 p-6 rounded-md mb-2 w-32 h-32 flex items-center justify-center">
          <QrCode className="w-16 h-16 text-gray-500 dark:text-gray-400" />
        </div>
        <CardTitle className="text-center text-base font-medium">
          <QrScanner onScan={handleScanUser} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="clientCode">Código de Cliente</Label>
          <Input
            placeholder="Ingrese código de cliente"
            value={clientCode}
            onChange={handleClientCodeChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="searchUser">Buscar Usuario</Label>
          <div className="flex space-x-2">
            <UserSearchField
              onSelect={handleUserSelect}
              selectedUserId={selectedUser?.id}
              placeholder="Buscar usuario..."
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Monto</Label>
          <Input
            placeholder="$0.00"
            value={`$${amount}`}
            onChange={handleAmountChange}
          />

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button variant="outline" onClick={() => handlePresetAmount(100)}>
              $100
            </Button>
            <Button variant="outline" onClick={() => handlePresetAmount(500)}>
              $500
            </Button>
            <Button variant="outline" onClick={() => handlePresetAmount(1000)}>
              $1000
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Método de Pago</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccione método de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Efectivo</SelectItem>
              <SelectItem value="card">Tarjeta de Crédito</SelectItem>
              {/* <SelectItem value='Transferencia'>Transferencia</SelectItem> */}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <div className="border rounded-lg p-3 space-y-2 bg-gray-50 dark:bg-gray-800">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Cliente:
              </span>
              <span className="font-medium">
                {selectedUser.name || selectedUser.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Monto:
              </span>
              <span className="font-medium">${amount}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button
          className="w-full"
          disabled={!selectedUser || amount === 0 || isAddingBalance}
          onClick={handleAddBalance}
        >
          {isAddingBalance && (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Procesando...
            </div>
          )}
          Confirmar Carga de Balance
        </Button>
        <Button variant="outline" className="w-full">
          Cancelar
        </Button>
      </CardFooter>
      <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
        <DialogContent className="sm:max-w-100vw bg-card border-0">
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold mb-1">{`Complete your payment`}</h2>
            <p className="text-sm text-muted-foreground">
              The payment link is:{" "}
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {paymentLink}
              </a>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
