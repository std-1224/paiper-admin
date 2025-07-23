"use client";

import React, { useState, useEffect } from "react";
import { SunIcon, MoonIcon, BellIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import { Avatar } from "radix-ui";
import { useAuth } from "@/context/AuthContext";
import { DropdownMenu } from "radix-ui";

import { ExitIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";

interface HeaderProps {
  toggleTheme: () => void;
  isDarkMode: boolean;
  setIsNotificationsOpen: (value: boolean) => void;
}
export default function Header({
  toggleTheme,
  isDarkMode,
  setIsNotificationsOpen,
}: HeaderProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { fetchNotifications, notificationsData } = useAppContext();

  useEffect(() => {
    fetchNotifications();
  }, []);

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
  const MenuAvatar = () => {
    return (
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Avatar.Root className="AvatarRoot cursor-pointer">
            {/* <Avatar.Image
            className="AvatarImage"
            src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?ixlib=rb-1.2.1&w=128&h=128&dpr=2&q=80"
            alt="Pedro Duarte"
          /> */}
            <Avatar.Fallback className="AvatarFallback">
              {user?.email ? user.email.charAt(0).toUpperCase() : "?"}
            </Avatar.Fallback>
          </Avatar.Root>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content className="DropdownMenuContent" sideOffset={5}>
            <DropdownMenu.Item
              className="DropdownMenuItem"
              onClick={() => signOut()}
            >
              Logout
              <div className="RightSlot">
                <ExitIcon />
              </div>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    );
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
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

      <div className="flex items-center space-x-4">
        <Button
          className="bg-green-600 hover:bg-green-700 flex items-center"
          onClick={() => router.push("/new-order")}
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          New Order
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <span className="sr-only">Toggle theme</span>
          {isDarkMode ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          )}
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
        <span className="text-sm font-medium dark:text-gray-300">ES</span>
        <MenuAvatar />
      </div>
    </header>
  );
}
