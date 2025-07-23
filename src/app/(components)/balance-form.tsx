"use client";

import React, { useState } from "react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CreditCardIcon,
  DollarSignIcon,
  WalletIcon,
  XIcon,
  CheckIcon,
  UserIcon,
  SearchIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ActiveStatus, User, UserType } from "@/types/types";

interface BalanceFormProps {
  onClose: () => void;
}

export function BalanceForm({ onClose }: BalanceFormProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | undefined>();
  const [step, setStep] = useState(1);

  // Mock users data
  const users: User[] = [
    {
      id: "1",
      name: "Carlos Ruiz",
      email: "carlos@example.com",
      avatar: "https://github.com/yusufhilmi.png",
      role: UserType.Client,
      status: ActiveStatus.Active,
      balance: "S/ 1,500.00",
      spent: "S/ 500.00",
      phone: "+51 987 654 321",
      address: "Av. Principal 123, Lima",
      created_at: "15/03/2022",
      transactions: [],
    },
    {
      id: "2",
      name: "Ana Martinez",
      email: "ana@example.com",
      avatar: "https://github.com/furkanksl.png",
      role: UserType.Client,
      status: ActiveStatus.Active,
      balance: "S/ 750.50",
      spent: "S/ 250.00",
      phone: "+51 912 345 678",
      address: "Calle Secundaria 456, Lima",
      created_at: "20/05/2022",
      transactions: [],
    },
    {
      id: "3",
      name: "Miguel Sánchez",
      email: "miguel@example.com",
      avatar: "https://github.com/polymet-ai.png",
      role: UserType.Client,
      status: ActiveStatus.Active,
      balance: "S/ 3,200.00",
      spent: "S/ 1,200.00",
      phone: "+51 945 678 123",
      address: "Jr. Los Pinos 789, Lima",
      created_at: "10/01/2022",
      transactions: [],
    },
  ];

  const handleSearch = () => {
    if (searchQuery.trim() === "") return;

    const foundUser = users.find(
      (user) =>
        user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (foundUser) {
      setSelectedUser(foundUser);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1 && selectedUser) {
      setStep(2);
      return;
    }

    if (step === 2 && amount && paymentMethod) {
      // Here you would typically make an API call to process the payment
      console.log("Processing payment:", {
        user: selectedUser,
        amount,
        paymentMethod,
      });

      // Show success message or redirect
      setStep(3);
    }
  };

  const handleReset = () => {
    setSelectedUser(undefined);
    setAmount("");
    setPaymentMethod("");
    setSearchQuery("");
    setStep(1);
  };

  const renderPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit-card":
        return <CreditCardIcon className="h-5 w-5 text-blue-500" />;
      case "cash":
        return <DollarSignIcon className="h-5 w-5 text-green-500" />;
      case "transfer":
        return <WalletIcon className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-xl dark:text-white">
          {step === 3 ? "¡Saldo Cargado!" : "Cargar Saldo"}
        </DialogTitle>
        <DialogDescription className="dark:text-gray-400">
          {step === 1
            ? "Selecciona un cliente para cargar saldo"
            : step === 2
            ? "Ingresa el monto y método de pago"
            : "La operación se ha completado exitosamente"}
        </DialogDescription>
      </DialogHeader>

      {step === 1 && (
        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente por nombre o email..."
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={handleSearch}
                className="dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                Buscar
              </Button>
            </div>

            {selectedUser ? (
              <div className="p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/50">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage
                      src={selectedUser.avatar}
                      alt={selectedUser.name}
                    />

                    <AvatarFallback>
                      {selectedUser?.name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium dark:text-white">
                      {selectedUser.name}
                    </h3>
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      {selectedUser.email}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-sm text-muted-foreground dark:text-gray-400">
                      Saldo actual
                    </p>
                    <p className="font-medium dark:text-white">
                      {selectedUser.balance}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border rounded-lg text-center dark:border-gray-700 dark:bg-gray-800/20">
                <UserIcon className="h-10 w-10 mx-auto text-muted-foreground dark:text-gray-500 mb-4" />
                <p className="text-muted-foreground dark:text-gray-400">
                  Busca un cliente para cargar saldo
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 2 && selectedUser && (
        <div className="py-6 space-y-6">
          <div className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg dark:bg-gray-800/30">
            <Avatar>
              <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
              <AvatarFallback>{selectedUser?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium dark:text-white">
                {selectedUser.name}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                Saldo actual: {selectedUser.balance}
              </p>
            </div>
          </div>

          <Separator className="dark:bg-gray-800" />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="dark:text-gray-300">
                Monto a cargar
              </Label>
              <div className="relative">
                <DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.00"
                  className="pl-10 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method" className="dark:text-gray-300">
                Método de pago
              </Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="Seleccionar método de pago" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="credit-card" className="flex items-center">
                    <div className="flex items-center">
                      <CreditCardIcon className="h-4 w-4 mr-2 text-blue-500" />
                      Tarjeta de Crédito/Débito
                    </div>
                  </SelectItem>
                  <SelectItem value="cash">
                    <div className="flex items-center">
                      <DollarSignIcon className="h-4 w-4 mr-2 text-green-500" />
                      Efectivo
                    </div>
                  </SelectItem>
                  <SelectItem value="transfer">
                    <div className="flex items-center">
                      <WalletIcon className="h-4 w-4 mr-2 text-purple-500" />
                      Transferencia Bancaria
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "credit-card" && (
              <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700 dark:bg-gray-800/20">
                <div className="space-y-2">
                  <Label htmlFor="card-number" className="dark:text-gray-300">
                    Número de tarjeta
                  </Label>
                  <Input
                    placeholder="1234 5678 9012 3456"
                    className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry" className="dark:text-gray-300">
                      Fecha de expiración
                    </Label>
                    <Input
                      placeholder="MM/YY"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvc" className="dark:text-gray-300">
                      CVC
                    </Label>
                    <Input
                      placeholder="123"
                      className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
            <CheckIcon className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-medium dark:text-white">
            ¡Operación Exitosa!
          </h3>
          <p className="text-muted-foreground dark:text-gray-400">
            Se ha cargado {amount && `$${amount}`} al saldo de{" "}
            {selectedUser?.name}.
          </p>
          <div className="p-4 bg-muted/30 rounded-lg dark:bg-gray-800/30 w-full">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground dark:text-gray-400">
                Método de pago:
              </span>
              <div className="flex items-center">
                {paymentMethod && renderPaymentMethodIcon(paymentMethod)}
                <span className="ml-2 dark:text-white">
                  {paymentMethod === "credit-card"
                    ? "Tarjeta de Crédito/Débito"
                    : paymentMethod === "cash"
                    ? "Efectivo"
                    : "Transferencia Bancaria"}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-muted-foreground dark:text-gray-400">
                Nuevo saldo:
              </span>
              <span className="font-medium dark:text-white">
                ${selectedUser?.balance}
              </span>
            </div>
          </div>
        </div>
      )}

      <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
        {step === 1 && (
          <Button
            variant="outline"
            onClick={onClose}
            className="dark:border-gray-700 dark:text-gray-300"
          >
            <XIcon className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}

        {step === 2 && (
          <>
            <Button
              variant="outline"
              onClick={() => setStep(1)}
              className="dark:border-gray-700 dark:text-gray-300"
            >
              <XIcon className="h-4 w-4 mr-2" />
              Atrás
            </Button>
          </>
        )}

        {step === 3 && (
          <Button
            variant="outline"
            onClick={handleReset}
            className="dark:border-gray-700 dark:text-gray-300"
          >
            Cargar otro saldo
          </Button>
        )}

        {step < 3 && (
          <Button
            onClick={handleSubmit}
            disabled={
              (step === 1 && !selectedUser) ||
              (step === 2 && (!amount || !paymentMethod))
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {step === 1 ? "Continuar" : "Cargar Saldo"}
          </Button>
        )}

        {step === 3 && (
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
            Finalizar
          </Button>
        )}
      </DialogFooter>
    </>
  );
}
