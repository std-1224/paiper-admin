"use client";
import React from "react";
import {
  HomeIcon,
  ShoppingCartIcon,
  DollarSignIcon,
  UsersIcon,
  FileTextIcon,
  QrCodeIcon,
  Database,
  User,
  SunIcon,
  MoonIcon,
  Settings2,
  Loader2,
} from "lucide-react";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { ExitIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/context/AuthContext";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { useVenue } from "@/context/VenueContext";
import { toast } from "sonner";

const mainNavItems = [
  { id: "dashboard", title: "Inicio", icon: HomeIcon, path: "/dashboard" },
  {
    id: "orders",
    title: "Gestión de Pedidos",
    icon: ShoppingCartIcon,
    path: "/orders",
  },
  {
    id: "finances",
    title: "Panel de Finanzas",
    icon: DollarSignIcon,
    path: "/finances",
  },
  {
    id: "roles",
    title: "Administración de Roles",
    icon: UsersIcon,
    path: "/roles",
  },
  {
    id: "menu",
    title: "Gestión de Carta",
    icon: FileTextIcon,
    path: "/menu",
  },
  // {
  //   id: "bars",
  //   title: "Barras & QRs",
  //   icon: QrCodeIcon,
  //   path: "/bars",
  // },
  {
    id: "qr-tracking",
    title: "Barras & QRs",
    icon: QrCodeIcon,
    path: "/qr-tracking",
  },
  {
    id: "stock",
    title: "Stock & Reasignaciones",
    icon: Database,
    path: "/stock",
  },
];
interface AppSidebarProps {
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export function AppSidebar({ toggleTheme, isDarkMode }: AppSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const { userPermissions, isLoadingPermissions, hasPermission } =
    useUserPermissions();
  const { venue, isLoading: isLoadingVenue } = useVenue();

  // Filter mainNavItems based on user permissions
  const filteredNavItems = mainNavItems.filter((item) => {
    // If still loading permissions, show all items
    if (isLoadingPermissions) {
      return true;
    }

    // If no permissions, only show dashboard
    if (userPermissions.length === 0) {
      return item.id === "dashboard";
    }

    // Check if user has permission for this module
    return hasPermission(item.id);
  });

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Image
            src="/assets/Logo.png"
            alt="Piper Logo"
            width={120}
            height={50}
            className="dark:filter dark:brightness-150"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {/* <SidebarGroupLabel className="text-gray-500">
            Principal
          </SidebarGroupLabel> */}
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin h-4 w-4 ml-2" />
                </div>
              ) : filteredNavItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground dark:text-gray-400">
                    No tienes permisos para acceder a ninguna sección
                  </p>
                </div>
              ) : (
                // Show filtered items based on permissions
                filteredNavItems.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.path}
                    >
                      <Link
                        href={item.path}
                        className="w-full justify-start text-left"
                      >
                        <item.icon className="h-3 w-3" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <SidebarGroup>
          <SidebarGroupContent>
            {/* Venue Name Display */}
            <div className="flex flex-col">
              {isLoadingVenue ? (
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              ) : venue ? (
                <>
                  <h1 className="text-xl font-bold text-blue-800 dark:text-blue-200 tracking-wide">
                    {venue.name}
                  </h1>
                  {venue.description && (
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1 opacity-80">
                      {venue.description}
                    </p>
                  )}
                </>
              ) : null}
            </div>

            <SidebarMenu>
              {/* Configuration - only show if user has configuration permission */}
              {(isLoadingPermissions || hasPermission("configuration")) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/configuration"}
                  >
                    <Link
                      href="/configuration"
                      className={`w-full justify-start text-left ${isLoadingPermissions ? "opacity-50" : ""}`}
                    >
                      <Settings2 className="h-3 w-3" />
                      <span>Configuración</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Theme Toggle */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={toggleTheme}
                  className="w-full justify-start text-left"
                >
                  {isDarkMode ? (
                    <SunIcon className="h-3 w-3" />
                  ) : (
                    <MoonIcon className="h-3 w-3" />
                  )}
                  <span>Theme</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* User Menu */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => signOut()}
                  className="w-full justify-start text-left"
                >
                  <ExitIcon className="h-3 w-3" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info */}
        <div className="flex items-center gap-2 px-2 py-2 border-t">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.email}
            </p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
