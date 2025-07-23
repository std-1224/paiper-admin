"use client";

import { useState, useEffect } from "react";
import { Search, QrCode, User, UserPlus, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { QrScanner } from "(components)/qr-scanner";
import { User as UserType } from "@/types/types";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAppContext } from "@/context/AppContext";
import { toast } from "@/hooks/use-toast";

interface UserSelectionProps {
  onUserSelect: (user: UserType) => void;
  onAnonymousSelect: () => void;
  onUserDeselect: () => void;
  isFromTable: boolean;
  setIsFromTable: (value: boolean) => void;
  tableNumber: string;
  setTableNumber: (value: string) => void;
}

export function UserSelection({
  onUserSelect,
  onAnonymousSelect,
  onUserDeselect,
  isFromTable,
  tableNumber,
  setIsFromTable,
  setTableNumber,
}: UserSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const tableNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const {fetchUsers, usersData} = useAppContext();

  // Fetch users from Supabase
  useEffect(() => {
    fetchUsers();
    setFilteredUsers(usersData);
  }, []);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(usersData);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = usersData.filter(
        (user) =>
          user.name?.toLowerCase().includes(lowercaseQuery) ||
          user.email?.toLowerCase().includes(lowercaseQuery) ||
          user.phone?.includes(searchQuery)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, usersData]);

  const handleUserSelect = (user: UserType) => {
    setSelectedUser(user);
    onUserSelect(user);
  };

  const handleAnonymousOrder = () => {
    setSelectedUser(null);
    onAnonymousSelect();
  };

  const handleQrCodeScanned = (result: string) => {
    // In a real app, you would look up the user by the QR code value
    console.log("QR code scanned:", result);
    
    // Try to find a user with this QR code
    const user = usersData.find((u) => String(u.id) === result);
    toast({
      variant: "default",
      title: "QR Code Scanned",
      description: `QR code scanned: ${user?.name || user?.email}`,
    })
    if (user) {
      setSelectedUser(user);
      onUserSelect(user);
    } else {
      // If no user found, you might want to show an error
      console.error("No user found with this QR code");
    }

    setQrDialogOpen(false);
  };

  const handleDeselectUser = () => {
    setSelectedUser(null);
    onUserDeselect();
  };

  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Seleccionar Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Search and action buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="hidden sm:inline">Escanear QR</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Escanear Código QR</DialogTitle>
                    </DialogHeader>
                    <QrScanner onScan={handleQrCodeScanned} />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handleAnonymousOrder}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Anónimo</span>
                </Button>
              </div>
            </div>

            <div className="mb-4  rounded-md">
              <div className="flex border-slate-200 rounded-md items-center justify-start gap-12 ">
                <Label htmlFor="table-switch" className="text-sm font-medium">
                  ¿Es de mesa?
                </Label>
                <Switch
                  id="table-switch"
                  checked={isFromTable}
                  onCheckedChange={setIsFromTable}
                />
              </div>

              {isFromTable && (
                <div className="mt-3">
                  <Label
                    htmlFor="table-number"
                    className="text-sm font-medium mb-1 block"
                  >
                    Número de mesa
                  </Label>
                  <Select value={tableNumber} onValueChange={setTableNumber}>
                    <SelectTrigger
                      id="table-number"
                      className="w-full bg-white"
                    >
                      <SelectValue placeholder="Seleccionar mesa" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {tableNumbers.map((number) => (
                        <SelectItem key={number} value={number}>
                          Mesa {number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* User list */}
            <div className="border rounded-md">
              {usersData.length === 0 ? (
                // Loading skeletons
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-1/3 mb-2" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <ul className="divide-y overflow-y-auto h-[50vh]">
                  {filteredUsers.map((user) => (
                    <li key={user.id}>
                      <button
                        className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
                          selectedUser?.id === user.id ? "bg-muted/70" : ""
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <Avatar>
                          <AvatarImage
                            src={user.avatar || "/default-avatar.png"}
                            alt={user.name || "Usuario"}
                          />
                          <AvatarFallback>
                            {user.name?.substring(0, 2).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {user.name || "Usuario sin nombre"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {user.email || "Sin email"}
                          </p>
                          <div className="flex items-center mt-1 gap-2">
                            <Badge
                              variant={
                                user?.role === "client"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {user?.role || "Cliente"}
                            </Badge>
                            {user.balance && (
                              <span className="text-xs text-muted-foreground">
                                Saldo: ${user.balance}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="mx-auto h-8 w-8 mb-2" />
                  <p>No se encontraron usuarios</p>
                </div>
              )}
            </div>

            {/* Selected user info */}
            {selectedUser && (
              <div className="bg-muted/30 p-4 rounded-md relative">
                <button
                  onClick={handleDeselectUser}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50"
                  aria-label="Deseleccionar usuario"
                >
                  <XIcon className="h-4 w-4 text-muted-foreground" />
                </button>
                <p className="font-medium">
                  Seleccionado: {selectedUser.name || "Usuario sin nombre"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email || "Sin email"}
                </p>
                {selectedUser.balance && (
                  <p className="text-sm mt-1">
                    Saldo:{" "}
                    <span className="font-medium">${selectedUser.balance}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
