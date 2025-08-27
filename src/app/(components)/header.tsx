"use client";

import React, { useEffect } from "react";
import { BellIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface HeaderProps {
  setIsNotificationsOpen: (value: boolean) => void;
}
export default function Header({
  setIsNotificationsOpen,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { fetchNotifications, notificationsData } = useAppContext();
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadNotifications = notificationsData.filter(
    (notification) => !notification.is_read
  ).length;

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "Home";
      case "/orders":
        return "Gestión de Pedidos";
      case "/finances":
        return "Panel de Finanzas";
      case "/roles":
        return "Administración de Roles";
      case "/menu":
        return "Gestión de Carta";
      case "/new-order":
        return "Nueva Orden";
      case "/qr-tracking":
        return "Gestión de Barras & QRs";
      case "/stock":
        return "Gestión de Stock Avanzado";
      default:
        return "Home";
    }
  };


  return (
    <header className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="flex items-center">
          <h1 className="text-xl font-semibold dark:text-white">
            {getPageTitle()}
          </h1>
          <div className="ml-4 flex items-center">
            <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
            <span className="text-sm text-muted-foreground dark:text-gray-400">
              En línea
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button
          className="bg-black flex items-center"
          onClick={() => {
            // if (user?.role === "barman" || user?.role === "client") {
            //   toast.error("No tienes permiso para crear pedidos");
            //   return;
            // }
            router.push("/new-order");
          }}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New Order
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="dark:text-gray-300 dark:hover:bg-gray-800 relative"
          onClick={() => setIsNotificationsOpen(true)}
        >
          <BellIcon className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
          {unreadNotifications > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] flex items-center justify-center">
              {unreadNotifications}
            </Badge>
          )}
        </Button>
      </div>
    </header>
  );
}
