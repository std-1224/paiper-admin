"use client";

import React, { useState, useEffect } from "react";
import { AppSidebar } from "./sidebar";
import { BellIcon, XIcon, PlusCircleIcon, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BalanceForm } from "./balance-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import BalanceRechargeForm from "./balance-recharge-form";
import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "./ProtectedRoute";
import { RouteProtection } from "@/components/RouteProtection";
import { VenueProvider } from "@/context/VenueContext";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Loading from "./loading";
import Header from "./header";
import { useAppContext } from "@/context/AppContext";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { format } from "date-fns";
import { Notification } from "@/types/types";
import { supabase } from "@/lib/supabaseClient";
import { toast } from '@/hooks/use-toast'

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBalanceFormOpen, setIsBalanceFormOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const pathname = usePathname();
  const { fetchNotifications, notificationsData } = useAppContext();



  const router = useRouter();

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  React.useEffect(() => {
    document.documentElement.classList.add("light");
  }, []);

  // Don't show the standard layout for the new order page
  

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "order":
        return (
          <div className="p-2 rounded-full h-8 w-8 bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-blue-500" />
          </div>
        );

      case "ready":
        return (
          <div className="p-2 rounded-full h-8 w-8 bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-green-500" />
          </div>
        );

      case "stock":
        return (
          <div className="p-2 rounded-full h-8 w-8 bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-orange-500" />
          </div>
        );

      case "review":
        return (
          <div className="p-2 rounded-full h-8 w-8 bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-purple-500" />
          </div>
        );

      default:
        return (
          <div className="p-2 rounded-full h-8 w-8 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </div>
        );
    }
  };
  const markAllAsRead = () => {
    fetch(`/api/notifications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_read: true }),
    });
  };

  const onMarkAsRead = (notificationId: string) => {
    // Implement mark as read logic here
    fetch(`/api/notifications`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: notificationId, is_read: true }),
    });
  };

  const handleDeleteNotification = async (notificationId: string) => {
    setIsDeleting(true);
    await fetch(`/api/notifications`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: notificationId }),
    });
    setIsDeleting(false);
    fetchNotifications();
  };

  const handleViewNotification = (notification: Notification) => {

    if(notification.type === "order"||notification.type=="order_cancelled") {
      router.push(`/orders?orderId=${notification?.metadata?.order_id}`)
      setIsNotificationsOpen(false)

    }
    if(notification.type === "stock") {
      router.push(`/menu`)
      setIsNotificationsOpen(false)
    }
  };

  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const readNotifications = notificationsData
  .filter(notification => !notification.is_read)
  .slice(0, showAllNotifications ? undefined : 5);

  useEffect(() => {
    const channel = supabase.channel('custom-all-notifications').on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
    }, async (payload) => {
      if(payload.new) {
        toast({
          title: payload.new.title,
          description: payload.new.message,
          variant: 'default',
        })
      }
    }).subscribe()
  }, [])

  // // useEffect(() => {
  // if (!loading && !user) {
  //   router.push("/login");
  //   return <Loading />;
  // }
  // // }, [loading, user, router]);

  // if (loading) {
  //   return <Loading />;
  // }

  if (pathname === "/new-order") {
    return (
      <RouteProtection>
        {children}
        <Dialog open={isBalanceFormOpen} onOpenChange={setIsBalanceFormOpen}>
          <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
            <BalanceForm onClose={() => setIsBalanceFormOpen(false)} />
          </DialogContent>
        </Dialog>
        {/* <Button
					className='fixed bottom-6 left-6 bg-green-600 hover:bg-green-700 rounded-full shadow-lg'
					size='lg'
					onClick={() => setIsBalanceFormOpen(true)}>
					<PlusCircleIcon className='h-6 w-6 mr-2' />
					Cargar Saldo
				</Button> */}
      </RouteProtection>
    );
  }

  return (
    <RouteProtection>
      <ProtectedRoute allowedRoles={["admin"]}>
        <VenueProvider>
          <SidebarProvider>
            <AppSidebar
              toggleTheme={toggleTheme}
              isDarkMode={isDarkMode}
            />
            <SidebarInset>
              <Header
                setIsNotificationsOpen={setIsNotificationsOpen}
              />
              <main className="overflow-y-auto dark:bg-gray-950 flex-1 p-4 md:p-8 overflow-auto">
                {children}
              </main>
            </SidebarInset>
          </SidebarProvider>
        </VenueProvider>

      {/* Notifications Sidebar Modal */}
      <Sheet open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto" side="right">
          <SheetHeader className="pb-4">
            <SheetTitle className="flex justify-between items-center">
              <span>Notificaciones</span>
              <Badge variant="outline" className="rounded-full">
                {notificationsData.filter((n) => !n.is_read).length} nuevas
              </Badge>
            </SheetTitle>
            <SheetDescription>
              Recibe actualizaciones sobre pedidos, inventario y sistema
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {notificationsData.length === 0 ? (
              <div className="flex items-center justify-center">
                <p className="text-muted-foreground">
                  No hay notificaciones
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground">Hoy</h3>
                  <div className="space-y-4">
                    {readNotifications.map((notification, index) => (
                      <div
                        key={notification.id}
                        className={`flex gap-4 cursor-pointer p-3 rounded-lg ${notification.is_read
                            ? "opacity-70 bg-gray-100/40 dark:bg-gray-400/60"
                            : "bg-gray-200/40 dark:bg-gray-400/60"
                          }`}
                        id={`lx2qv6_${index}`}
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1" id={`jxcy5e_${index}`} onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // check if the target is the XIcon
                          if (e.target instanceof SVGElement && e.target.tagName === 'svg') {
                            return;
                          }
                          handleViewNotification(notification)
                        }}>
                          <div
                            className="flex justify-between items-start relative pt-2"
                            id={`h0jg1x_${index}`}
                          >
                            <XIcon
                              className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors absolute top-[-4px] right-[-4px] cursor-pointer"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onMarkAsRead(notification.id)
                              }}
                            />
                            <h4
                              className="text-sm font-medium"
                              id={`5vbva1_${index}`}
                            >
                              {notification.title}
                            </h4>
                            <span
                              className="text-xs text-muted-foreground pr-4"
                              id={`uvwht3_${index}`}
                            >
                              {format(notification.created_at, "dd/MM/yyyy")}
                            </span>
                          </div>
                          <p
                            className="text-sm text-muted-foreground mt-1"
                            id={`nvd3tt_${index}`}
                          >
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    ))}
                    {notificationsData.filter((notification) => notification.is_read === false).length > 5 && (
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="w-full text-primary"
                        onClick={() => setShowAllNotifications(!showAllNotifications)}
                      >
                        {showAllNotifications ? 'Show Less' : 'Show More'}
                      </Button>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Earlier notifications */}
                {isDeleting ? <Loading /> :
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Anteriores
                    </h3>
                    <div className="space-y-4">
                      {notificationsData.filter((notification) => notification.is_read === true).slice(3).map((notification, index) => (
                        <div
                          key={notification.id}
                          className={`flex gap-4 p-3 cursor-pointer rounded-lg ${notification.is_read
                              ? "opacity-70"
                              : "bg-muted/40 dark:bg-gray-800/40"
                            }`}
                          id={`ae754j_${index}`}
                        >
                          {getNotificationIcon(notification.type)}
                          <div className="flex-1" id={`pees62_${index}`} onClick={(e) => {
                            // check if the target is the XIcon
                            if (e.target instanceof SVGElement && e.target.tagName === 'svg') {
                              return;
                            }
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewNotification(notification)
                          }}>
                            <div
                              className="flex justify-between items-start relative pt-2 pr-4"
                              id={`duhhz4_${index}`}
                            >
                              <TrashIcon
                                className="h-4 w-4 text-muted-foreground hover:text-red-500 transition-colors absolute top-[-4px] right-[-4px] cursor-pointer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleDeleteNotification(notification.id)
                                }}
                              />
                              <h4
                                className="text-sm font-medium"
                                id={`zou2lb_${index}`}
                              >
                                {notification.title}
                              </h4>
                              <span
                                className="text-xs text-muted-foreground"
                                id={`7se52g_${index}`}
                              >
                                {format(notification.created_at, "dd/MM/yyyy")}
                              </span>
                            </div>
                            <p
                              className="text-sm text-muted-foreground mt-1"
                              id={`zip0y3_${index}`}
                            >
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                    </div>
                  </div>
                }
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700">
            <Button variant="outline" size="sm" onClick={() => markAllAsRead()} >
              Marcar todas como leídas
            </Button>
            <SheetClose asChild>
              <Button variant="outline" size="sm">
                <XIcon className="h-4 w-4 mr-2" />
                Cerrar
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      {/* Balance Form Dialog */}
      <Dialog open={isBalanceFormOpen} onOpenChange={setIsBalanceFormOpen}>
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-800">
          <BalanceRechargeForm />
        </DialogContent>
      </Dialog>

      {/* Fixed Button for Balance Form */}
      <div>
        <Button
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 rounded-full shadow-lg"
          size="lg"
          onClick={() => setIsBalanceFormOpen(true)}
        >
          <PlusCircleIcon className="h-6 w-6 mr-2" />
          Cargar Saldo
        </Button>
      </div>
    </ProtectedRoute>
    </RouteProtection>
  );
}
