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
  Settings,
  User,
} from "lucide-react";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { usePathname } from "next/navigation";

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
export function AppSidebar() {
  const pathname = usePathname();
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
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton asChild isActive={pathname === item.path}>
                    <Link
                      href={item.path}
                      className="w-full justify-start text-left"
                    >
                      <item.icon className="h-3 w-3" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {/* <SidebarFooter className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Admin</p>
              <p className="text-xs text-gray-500">admin@vares.com</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter> */}
    </Sidebar>
  );
}
