"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SaveIcon,
  XIcon,
  CreditCardIcon,
  DollarSignIcon,
  CalendarIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  HomeIcon,
  GiftIcon,
  QrCodeIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GiftService } from "(components)/gift-service";
import {
  ActiveStatus,
  ApprovalStatus,
  TableType,
  Transaction,
  User,
  UserTransaction,
  UserType,
} from "@/types/types";
import { format } from "date-fns";
import { Popover } from "radix-ui";
import { MixerHorizontalIcon, Cross2Icon } from "@radix-ui/react-icons";
import { QrScanner } from "(components)/qr-scanner";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";

type TabType = "clientes" | "equipoPublicas" | "clientesVIP" | "equipo";
type SortDirection = "asc" | "desc";

export default function RoleManagement() {
  const [activeTab, setActiveTab] = useState<TabType>("clientes");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<
    "profile" | "transactions" | "assign-table"
  >("profile");
  const [isGiftServiceOpen, setIsGiftServiceOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const { tablesData } = useAppContext();
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on active tab
  const filteredUsers = users
    .filter(
      (user) =>
        user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        user?.email?.toLowerCase().includes(search.toLowerCase())
    )
    .filter((user) => {
      switch (activeTab) {
        case "clientes":
          return user.role === "client";
        case "equipoPublicas":
          return user.role === "barman";
        case "clientesVIP":
          return user.role === "client";
        case "equipo":
          return user.role === "master";
        default:
          return true;
      }
    });

  const handleSort = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  };

  const handleEditUser = (user: User) => {
    // if(currentUser?.role === "admin" || currentUser?.role === "master") {
    setSelectedUser(user);
    setTransfers([]);
    setIsEditDialogOpen(true);
    // } else {
    //   toast({
    //     title: "No tienes permiso para editar usuarios",
    //     description: "Solo los administradores pueden editar usuarios",
    //   })
    // }
  };

  const handleSendGift = (user: User) => {
    setSelectedUser(user);
    setIsGiftServiceOpen(true);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "Tarjeta":
        return <CreditCardIcon className="h-4 w-4 mr-2" />;
      case "Efectivo":
        return <DollarSignIcon className="h-4 w-4 mr-2" />;
      case "Transferencia":
      case "Saldo":
        return <DollarSignIcon className="h-4 w-4 mr-2" />;
      default:
        return <DollarSignIcon className="h-4 w-4 mr-2" />;
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      // Get the original user data to track changes
      const originalUser = users.find(u => u.id === selectedUser.id);
      const balanceChanged = originalUser && originalUser.balance !== selectedUser.balance;

      const response = await fetch("/api/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...selectedUser,
        }), // Send the updated user data
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const data = await response.json();
      console.log("User updated successfully:", data);

      // Log balance change if it occurred
      if (balanceChanged && currentUser) {
        try {
          await fetch("/api/audit-log", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: currentUser.id,
              user_name: currentUser.email?.split('@')[0] || 'Unknown',
              user_email: currentUser.email || '',
              user_role: currentUser.role || 'user',
              action: "update",
              action_type: "balance_update",
              target_type: "user",
              target_id: selectedUser.id,
              target_name: selectedUser.name || selectedUser.email,
              description: `Balance actualizado de ${originalUser?.balance || 0} a ${selectedUser.balance}`,
              changes_before: { balance: originalUser?.balance || 0 },
              changes_after: { balance: selectedUser.balance },
              status: "success"
            }),
          });
        } catch (auditError) {
          console.error("Error creating audit log:", auditError);
        }
      }

      // Optionally, refresh the user list or close the dialog
      fetchUsers();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const handleDeleteUser = async (id: any) => {
    if (!id) return;

    try {
      const response = await fetch("/api/users", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }), // Send the updated user data
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      const data = await response.json();
      console.log("User deleted successfully:", data);
      //   setIsDeleteDialogOpen(false);
      // Optionally, refresh the user list or close the dialog
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const handleGiftDetail = async (result: string) => {
    const response = await fetch(`/api/gifts?giftId=${result}`);
    const data = await response.json();
    const gift = data.data;
    if (gift.status === "pending") {
      const response = await fetch("/api/gifts", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: gift.id,
          status: "redeemed",
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      toast(
        {
          title: "QR Code Scanned",
          description: `El regalo se ha canjeado exitosamente`,
        }
      );
    } else {
      toast({
        title: "QR Code Scanned",
        description: `El regalo ya se encuentra ${gift.status}`,
      });
    }
  };

  const [transfers, setTransfers] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedUser) return;
    setIsLoading(true);

    const fetchTransfers = async () => {
      try {
        const response = await fetch(
          `/api/transfers?userId=${selectedUser?.id}`
        );
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
  }, [selectedUser]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Administración de Roles</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios y sus roles en el sistema
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <Input
            placeholder="Buscar usuarios..."
            className="pl-10"
            onChange={(e) => setSearch(e.target.value)}
          />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setQrDialogOpen(true)}
          >
            <QrCodeIcon className="h-4 w-4 mr-2" />
            Escanear código QR
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setIsGiftServiceOpen(true)}
          >
            <GiftIcon className="mr-2 h-4 w-4" /> Enviar Regalo
          </Button>
          {/* <Button className="bg-green-600 hover:bg-green-700">
            <PlusIcon className="mr-2 h-4 w-4" /> Agregar Usuario
          </Button> */}
        </div>
      </div>

      <div className="bg-card rounded-lg border">
        <div className="border-b">
          <div className="flex overflow-x-auto">
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === "clientes"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
                }`}
              onClick={() => setActiveTab("clientes")}
            >
              Clientes
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === "equipoPublicas"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
                }`}
              onClick={() => setActiveTab("equipoPublicas")}
            >
              Equipo Publicas
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === "clientesVIP"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
                }`}
              onClick={() => setActiveTab("clientesVIP")}
            >
              Clientes VIP
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === "equipo"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground"
                }`}
              onClick={() => setActiveTab("equipo")}
            >
              Equipo
            </button>
          </div>
        </div>

        <div className="p-4">
          <table className="w-full">
            <thead>
              <tr className="text-left text-muted-foreground text-sm">
                <th className="p-3 font-medium">Usuario</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={handleSort}
                  >
                    Saldo Actual
                    {sortDirection === "asc" ? (
                      <ChevronUpIcon className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="ml-1 h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-3 font-medium">Total Gastado</th>
                <th className="p-3 font-medium">Estado de Aprobación</th>
                <th className="p-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-t"
                  id={`user-row-${user.id}`}
                >
                  <td className="p-3" id={`user-cell-${user.id}`}>
                    <div
                      className="flex items-center"
                      id={`user-info-${user.id}`}
                    >
                      {/* <Avatar
                        className="mr-3 h-10 w-10"
                        id={`user-avatar-${user.id}`}
                      >
                        <AvatarImage
                          src={user.avatar}
                          alt={user.name}
                          id={`avatar-img-${user.id}`}
                        />

                        <AvatarFallback id={`avatar-fallback-${user.id}`}>
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar> */}
                      <div id={`user-details-${user.id}`}>
                        <div
                          className="font-medium"
                          id={`user-name-${user.id}`}
                        >
                          {user.name}
                        </div>
                        <div
                          className="text-sm text-muted-foreground"
                          id={`user-email-${user.id}`}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3" id={`type-cell-${user.id}`}>
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                      id={`type-badge-${user.id}`}
                    >
                      {user.role}
                    </Badge>
                  </td>
                  <td className="p-3" id={`status-cell-${user.id}`}>
                    <div
                      className="flex items-center"
                      id={`status-container-${user.id}`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ${user.status === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                          } mr-2`}
                        id={`status-indicator-${user.id}`}
                      ></div>
                      <span className="text-sm" id={`status-text-${user.id}`}>
                        {user.status === "active" ? "active" : "inactive"}
                      </span>
                    </div>
                  </td>
                  <td className="p-3" id={`balance-cell-${user.id}`}>
                    {user.balance && Number(user.balance) > 0 ? user.balance : 0}
                  </td>
                  <td className="p-3" id={`spent-cell-${user.id}`}>
                    {user.spent}
                  </td>
                  <td className="p-3" id={`approval-status-cell-${user.id}`}>
                    <div className="flex items-center">
                      <Badge
                        variant={user.approval_status === ApprovalStatus.Approved ? "default" : "secondary"}
                        className={`${user.approval_status === ApprovalStatus.Approved
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          }`}
                      >
                        {user.approval_status === ApprovalStatus.Approved ? "Aprobado" : "Pendiente"}
                      </Badge>
                    </div>
                  </td>
                  <td className="p-3 text-right" id={`actions-cell-${user.id}`}>
                    <div
                      className="flex justify-end space-x-2"
                      id={`actions-container-${user.id}`}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        id={`gift-button-${user.id}`}
                        onClick={() => handleSendGift(user)}
                        className="text-purple-500 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900/20"
                      >
                        <GiftIcon
                          className="h-4 w-4"
                          id={`gift-icon-${user.id}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        id={`edit-button-${user.id}`}
                        onClick={() => handleEditUser(user)}
                      >
                        <PencilIcon
                          className="h-4 w-4"
                          id={`edit-icon-${user.id}`}
                        />
                      </Button>
                      <Popover.Root>
                        <Popover.Trigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            id={`delete-button-${user.id}`}
                          >
                            <TrashIcon
                              className="h-4 w-4"
                              id={`delete-icon-${user.id}`}
                            />
                          </Button>
                        </Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Content
                            className="PopoverContent"
                            sideOffset={5}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                              }}
                            >
                              <p className="Text" style={{ marginBottom: 10 }}>
                                Are you sure to delete?
                              </p>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  gap: 10,
                                }}
                              >
                                {/* <Button
                                  variant="ghost"
                                  onClick={() => setIsDeleteDialogOpen(false)}
                                >
                                  Cancel
                                </Button> */}
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <Popover.Close
                              className="PopoverClose"
                              aria-label="Close"
                            >
                              <Cross2Icon />
                            </Popover.Close>
                            <Popover.Arrow className="PopoverArrow" />
                          </Popover.Content>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Edit Dialog with Profile and Transaction History */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  Editar Usuario: {selectedUser.name}
                </DialogTitle>
                <DialogDescription>
                  Actualiza la información del usuario y visualiza su historial
                  de transacciones
                </DialogDescription>
              </DialogHeader>

              <Tabs
                defaultValue="profile"
                value={activeProfileTab}
                onValueChange={(value: string) => {
                  setActiveProfileTab(
                    value as "profile" | "transactions" | "assign-table"
                  );
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 dark:bg-gray-800">
                  <TabsTrigger
                    value="profile"
                    className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                  >
                    Perfil
                  </TabsTrigger>
                  <TabsTrigger
                    value="transactions"
                    className="dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white dark:text-gray-300"
                  >
                    Historial de Transacciones
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-4 mt-4">
                  <div className="flex items-center space-x-4">
                    {/* <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={selectedUser.avatar}
                        alt={selectedUser.name}
                      />

                      <AvatarFallback>
                        {selectedUser.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar> */}
                    <div>
                      <h3 className="text-lg font-medium dark:text-white">
                        {selectedUser.name}
                      </h3>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {selectedUser.role} • Miembro desde{" "}
                        {format(
                          new Date(selectedUser.created_at),
                          "MM/dd/yyyy HH:mm:ss"
                        )}
                      </p>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="dark:text-gray-300">
                        <UserIcon className="h-4 w-4 inline mr-2" />
                        Nombre Completo
                      </Label>
                      <Input
                        defaultValue={selectedUser.name}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            name: e.target.value,
                          })
                        }
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="dark:text-gray-300">
                        <MailIcon className="h-4 w-4 inline mr-2" />
                        Correo Electrónico
                      </Label>
                      <Input
                        defaultValue={selectedUser.email}
                        disabled
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="dark:text-gray-300">
                        <PhoneIcon className="h-4 w-4 inline mr-2" />
                        Teléfono
                      </Label>
                      <Input
                        defaultValue={selectedUser.phone}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            phone: e.target.value,
                          })
                        }
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="dark:text-gray-300">
                        <HomeIcon className="h-4 w-4 inline mr-2" />
                        Dirección
                      </Label>
                      <Input
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            address: e.target.value,
                          })
                        }
                        defaultValue={selectedUser.address}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="type" className="dark:text-gray-300">
                        Tipo de Usuario
                      </Label>
                      <Select
                        defaultValue={selectedUser.role}
                        onValueChange={(value) =>
                          setSelectedUser({
                            ...selectedUser,
                            role: value as UserType,
                          })
                        }
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value="client">Cliente</SelectItem>
                          {/* <SelectItem value="client">Cliente VIP</SelectItem> */}
                          <SelectItem value="barman">Equipo</SelectItem>
                          <SelectItem value="master">
                            Equipo Publicas
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="dark:text-gray-300">
                        Estado
                      </Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Switch
                          checked={selectedUser.status === "active"}
                          onCheckedChange={(checked) =>
                            setSelectedUser({
                              ...selectedUser,
                              status: checked
                                ? ActiveStatus.Active
                                : ActiveStatus.Inactive,
                            })
                          }
                        />

                        <Label htmlFor="status" className="dark:text-gray-300">
                          {selectedUser.status === "active"
                            ? "Activo"
                            : "Inactivo"}
                        </Label>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="approval_status" className="dark:text-gray-300">
                        Estado de Aprobación
                      </Label>
                      <Select
                        defaultValue={selectedUser.approval_status || ApprovalStatus.Pending}
                        onValueChange={(value) =>
                          setSelectedUser({
                            ...selectedUser,
                            approval_status: value as ApprovalStatus,
                          })
                        }
                      >
                        <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                          <SelectValue placeholder="Seleccionar estado de aprobación" />
                        </SelectTrigger>
                        <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                          <SelectItem value={ApprovalStatus.Pending}>Pendiente</SelectItem>
                          <SelectItem value={ApprovalStatus.Approved}>Aprobado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="dark:text-gray-300">
                        <HomeIcon className="h-4 w-4 inline mr-2" />
                        Balance
                      </Label>
                      <Input
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            balance: e.target.value,
                          })
                        }
                        defaultValue={selectedUser.balance}
                        className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status" className="dark:text-gray-300">
                        Seleccionar Mesa
                      </Label>
                      <Select
                        value={selectedUser?.table_id?.toString()} // bind to table_id
                        onValueChange={(value) => {
                          const selectedTable = tablesData.find((s) => s.id.toString() === value);
                          setSelectedUser({
                            ...selectedUser,
                            table_id: value, // store the table id
                            sector_id: selectedTable?.table_number, // store the table number
                          });
                        }}
                      >
                        <SelectTrigger className="max-w-xs">
                          <SelectValue placeholder="Seleccionar Mesa" />
                        </SelectTrigger>
                        <SelectContent>
                          {tablesData.map((s: TableType) => (
                            <SelectItem key={s.id} value={s.id.toString()}>
                              Mesa {s.table_number} {/* show table number in dropdown */}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                    </div>
                  </div>

                  {selectedUser.role.includes("Cliente") && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium dark:text-white">
                          Información Financiera
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label
                              htmlFor="balance"
                              className="dark:text-gray-300"
                            >
                              <DollarSignIcon className="h-4 w-4 inline mr-2" />
                              Saldo Actual
                            </Label>
                            <Input
                              //   defaultValue={selectedUser.balance.replace(
                              //     "S/ ",
                              //     ""
                              //   )}
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label
                              htmlFor="spent"
                              className="dark:text-gray-300"
                            >
                              <CreditCardIcon className="h-4 w-4 inline mr-2" />
                              Total Gastado
                            </Label>
                            <Input
                              defaultValue={selectedUser?.spent?.replace(
                                "S/ ",
                                ""
                              )}
                              disabled
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="transactions" className="mt-4">
                  {transfers && transfers.length > 0 && !isLoading ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium dark:text-white">
                          Historial de Transacciones
                        </h3>
                        <div className="flex items-center space-x-2">
                          <CalendarIcon className="h-4 w-4 text-muted-foreground" />

                          <span className="text-sm text-muted-foreground dark:text-gray-400">
                            Últimos 3 meses
                          </span>
                        </div>
                      </div>

                      <div className="border rounded-lg overflow-hidden dark:border-gray-700">
                        <table className="w-full">
                          <thead className="bg-muted/50 dark:bg-gray-800 text-left">
                            <tr>
                              <th className="p-3 font-medium text-muted-foreground dark:text-gray-400">
                                ID
                              </th>
                              <th className="p-3 font-medium text-muted-foreground dark:text-gray-400">
                                Fecha
                              </th>
                              <th className="p-3 font-medium text-muted-foreground dark:text-gray-400">
                                Tipo
                              </th>
                              <th className="p-3 font-medium text-muted-foreground dark:text-gray-400">
                                Método
                              </th>
                              <th className="p-3 font-medium text-muted-foreground dark:text-gray-400">
                                Estado
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {transfers.map(
                              (transaction: Transaction, index: number) => (
                                <tr
                                  key={transaction.id}
                                  className="border-t dark:border-gray-700 hover:bg-muted/50 dark:hover:bg-gray-800/50"
                                  id={`9nikes_${index}`}
                                >
                                  <td
                                    className="p-3 dark:text-white"
                                    id={`ecipm8_${index}`}
                                  >
                                    {index + 1}
                                  </td>
                                  <td
                                    className="p-3 dark:text-white"
                                    id={`eixv92_${index}`}
                                  >
                                    {new Date(
                                      transaction.createdAt || ""
                                    ).toLocaleDateString("es-ES")}
                                  </td>
                                  <td
                                    className="p-3 dark:text-white"
                                    id={`b1hxao_${index}`}
                                  >
                                    <Badge
                                      className={
                                        transaction.type === "charge"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                          : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                      }
                                      id={`igek41_${index}`}
                                    >
                                      {transaction.type}
                                    </Badge>
                                  </td>
                                  <td
                                    className="p-3 dark:text-white"
                                    id={`j75e4l_${index}`}
                                  >
                                    <div
                                      className="flex items-center"
                                      id={`s2wq8f_${index}`}
                                    >
                                      {getMethodIcon(transaction.type)}
                                      {transaction.amount}
                                    </div>
                                  </td>
                                  <td className="p-3" id={`ki5886_${index}`}>
                                    <Badge
                                      className={
                                        transaction.status === "Completada"
                                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
                                      }
                                      id={`siydzg_${index}`}
                                    >
                                      {transaction.status}
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground dark:text-gray-400">
                        Cargando transacciones...
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground dark:text-gray-400">
                        No hay transacciones disponibles para este usuario.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="dark:border-gray-700 dark:text-gray-300"
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleUpdateUser}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Gift Service Dialog */}
      <GiftService
        isOpen={isGiftServiceOpen}
        onClose={() => {
          setIsGiftServiceOpen(false);
          setSelectedUser(null);
        }}
        userId={selectedUser?.id}
      />

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Escanear Código QR</DialogTitle>
          </DialogHeader>
          <QrScanner onScan={handleGiftDetail} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
