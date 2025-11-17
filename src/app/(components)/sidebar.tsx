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
import { useUserRole } from "@/hooks/useUserRole";
import { useVenue } from "@/context/VenueContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppContext } from "@/context/AppContext";

const mainNavItems = [
  {
    id: "dashboard",
    title: "Inicio",
    icon: HomeIcon,
    path: "/dashboard",
    moduleKey: "stockqr" as const, // Core module - always required
  },
  {
    id: "orders",
    title: "Gestión de Pedidos",
    icon: ShoppingCartIcon,
    path: "/orders",
    moduleKey: "stockqr_orders" as const,
  },
  {
    id: "finances",
    title: "Panel de Finanzas",
    icon: DollarSignIcon,
    path: "/finances",
    moduleKey: "stockqr_finances" as const,
  },
  {
    id: "roles",
    title: "Administración de Roles",
    icon: UsersIcon,
    path: "/roles",
    moduleKey: "stockqr_roles" as const,
  },
  {
    id: "menu",
    title: "Gestión de Carta",
    icon: FileTextIcon,
    path: "/menu",
    moduleKey: "stockqr_menu" as const,
  },
  {
    id: "qr-tracking",
    title: "Barras & QRs",
    icon: QrCodeIcon,
    path: "/qr-tracking",
    moduleKey: "stockqr_qr_tracking" as const,
  },
  {
    id: "stock",
    title: "Stock & Reasignaciones",
    icon: Database,
    path: "/stock",
    moduleKey: "stockqr_stock" as const,
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
  const { userRole, isLoadingRole } = useUserRole();
  const { venue, isLoading: isLoadingVenue } = useVenue();
  const { isModuleEnabled, tenantModulesLoading } = useAppContext();

  // Filter mainNavItems based on user permissions (but keep disabled modules visible)
  const filteredNavItems = mainNavItems.filter((item) => {
    // If still loading permissions or modules, show all items
    if (isLoadingPermissions || tenantModulesLoading) {
      return true;
    }

    // If no permissions, only show dashboard
    if (userPermissions.length === 0) {
      return item.id === "dashboard";
    }

    // Check if user has permission for this module
    const hasUserPermission = hasPermission(item.id);

    // Show item if user has permission (regardless of module enablement)
    return hasUserPermission;
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
              {isLoadingPermissions || tenantModulesLoading ? (
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
                // Show items - enabled ones are clickable, disabled ones are grayed out
                filteredNavItems.map((item) => {
                  const moduleEnabled = isModuleEnabled(item.moduleKey);
                  const isDisabled = !moduleEnabled;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild={!isDisabled}
                              isActive={pathname === item.path && !isDisabled}
                              disabled={isDisabled}
                              className={isDisabled ? "opacity-50 cursor-not-allowed" : ""}
                            >
                              {isDisabled ? (
                                <div className="w-full justify-start text-left flex items-center gap-2">
                                  <item.icon className="h-3 w-3" />
                                  <span>{item.title}</span>
                                </div>
                              ) : (
                                <Link
                                  href={item.path}
                                  className="w-full justify-start text-left"
                                >
                                  <item.icon className="h-3 w-3" />
                                  <span>{item.title}</span>
                                </Link>
                              )}
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          {isDisabled && (
                            <TooltipContent side="right">
                              <p className="text-xs">Módulo no habilitado para tu organización</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </SidebarMenuItem>
                  );
                })
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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 px-2 py-2 border-t cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {user?.email}
                  </p>
                  {isLoadingRole ? (
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-16"></div>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {userRole?.name || 'Sin rol asignado'}
                    </p>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            {userRole && (
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold text-sm">{userRole.name}</p>
                    {userRole.description && (
                      <p className="text-xs text-muted-foreground">{userRole.description}</p>
                    )}
                  </div>
                  <div className="text-xs space-y-1">
                    <p><span className="font-medium">Nivel:</span> {
                      userRole.level === 'full' ? 'Completo' :
                      userRole.level === 'departmental' ? 'Departamental' : 'Limitado'
                    }</p>
                    <p><span className="font-medium">Límite de transacción:</span> ${userRole.transaction_limit?.toLocaleString() || '0'}</p>
                  </div>
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </SidebarFooter>
    </Sidebar>
  );
}
