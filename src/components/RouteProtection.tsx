"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAuth } from '@/context/AuthContext';
import { useAppContext, ModuleKey } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

// Define route to permission mapping
const ROUTE_PERMISSIONS: Record<string, string[]> = {
  '/dashboard': ['dashboard'],
  '/orders': ['orders'],
  '/finances': ['finances'],
  '/roles': ['roles'],
  '/menu': ['menu'],
  '/qr-tracking': ['qr-tracking'],
  '/stock': ['stock'],
  '/configuration': ['configuration'],
};

// Define route to module mapping
const ROUTE_MODULES: Record<string, ModuleKey> = {
  '/dashboard': 'stockqr',
  '/orders': 'stockqr_orders',
  '/finances': 'stockqr_finances',
  '/roles': 'stockqr_roles',
  '/menu': 'stockqr_menu',
  '/qr-tracking': 'stockqr_qr_tracking',
  '/stock': 'stockqr_stock',
};

// Routes that don't require specific permissions (always accessible)
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/new-order', // Special case for customer orders
];

// Routes that require authentication but no specific permissions
const AUTH_ONLY_ROUTES = [
  '/profile',
  '/settings',
];

// Navigation items in order of priority for redirect
const NAVIGATION_PRIORITY = [
  { id: "dashboard", path: "/dashboard", moduleKey: "stockqr" as ModuleKey },
  { id: "orders", path: "/orders", moduleKey: "stockqr_orders" as ModuleKey },
  { id: "finances", path: "/finances", moduleKey: "stockqr_finances" as ModuleKey },
  { id: "roles", path: "/roles", moduleKey: "stockqr_roles" as ModuleKey },
  { id: "menu", path: "/menu", moduleKey: "stockqr_menu" as ModuleKey },
  { id: "qr-tracking", path: "/qr-tracking", moduleKey: "stockqr_qr_tracking" as ModuleKey },
  { id: "stock", path: "/stock", moduleKey: "stockqr_stock" as ModuleKey },
  { id: "configuration", path: "/configuration", moduleKey: "stockqr" as ModuleKey },
];

interface RouteProtectionProps {
  children: React.ReactNode;
}

export function RouteProtection({ children }: RouteProtectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const { userPermissions, isLoadingPermissions, hasAnyPermission } = useUserPermissions();
  const { isModuleEnabled, tenantModulesLoading } = useAppContext();

  // Don't render anything while auth or modules are loading
  if (authLoading || tenantModulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    router.push('/login');
    return null;
  }

  // If user is authenticated but trying to access public routes, redirect to dashboard
  if (user && PUBLIC_ROUTES.includes(pathname) && pathname !== '/new-order') {
    router.push('/dashboard');
    return null;
  }

  // Handle root path "/" - redirect to first allowed page
  if (user && pathname === '/') {
    if (isLoadingPermissions || tenantModulesLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    // Find first allowed page based on user permissions AND module enablement
    const firstAllowedPage = NAVIGATION_PRIORITY.find(nav =>
      userPermissions.includes(nav.id) && isModuleEnabled(nav.moduleKey)
    );

    if (firstAllowedPage) {
      router.push(firstAllowedPage.path);
    } else {
      // Fallback to dashboard if no permissions found
      router.push('/dashboard');
    }
    return null;
  }

  // Check if route requires specific permissions
  const requiredPermissions = ROUTE_PERMISSIONS[pathname];
  const requiredModule = ROUTE_MODULES[pathname];

  // If route doesn't require specific permissions, allow access
  if (!requiredPermissions) {
    // Check if it's an auth-only route
    if (AUTH_ONLY_ROUTES.includes(pathname)) {
      return user ? <>{children}</> : null;
    }

    // For public routes or unspecified routes, allow access
    if (PUBLIC_ROUTES.includes(pathname)) {
      return <>{children}</>;
    }

    // For authenticated users on unspecified routes, allow access
    if (user) {
      return <>{children}</>;
    }

    return null;
  }

  // Still loading permissions or modules, show loading state
  if (isLoadingPermissions || tenantModulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user has required permissions
  const hasPermissionAccess = hasAnyPermission(requiredPermissions);

  // Check if module is enabled (if route requires a module)
  const hasModuleAccess = requiredModule ? isModuleEnabled(requiredModule) : true;

  // User needs both permission AND module enabled
  const hasAccess = hasPermissionAccess && hasModuleAccess;

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <ShieldX className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-gray-600">
              {!hasPermissionAccess
                ? "No tienes permisos para acceder a esta página."
                : "Este módulo no está habilitado para tu organización."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-gray-500 text-center">
              <p>Página solicitada: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{pathname}</span></p>
              {!hasPermissionAccess && (
                <>
                  <p className="mt-2">Permisos requeridos: <span className="font-semibold">{requiredPermissions.join(', ')}</span></p>
                  <p className="mt-2">Tus permisos: <span className="font-semibold">{userPermissions.length > 0 ? userPermissions.join(', ') : 'Ninguno'}</span></p>
                </>
              )}
              {!hasModuleAccess && requiredModule && (
                <p className="mt-2">Módulo requerido: <span className="font-semibold">{requiredModule}</span> (no habilitado)</p>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Find first allowed page based on user permissions AND module enablement
                  const firstAllowedPage = NAVIGATION_PRIORITY.find(nav =>
                    userPermissions.includes(nav.id) && isModuleEnabled(nav.moduleKey)
                  );

                  if (firstAllowedPage) {
                    router.push(firstAllowedPage.path);
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <Button
                onClick={() => {
                  // Find first allowed page based on user permissions
                  const firstAllowedPage = NAVIGATION_PRIORITY.find(nav =>
                    userPermissions.includes(nav.id)
                  );

                  if (firstAllowedPage) {
                    router.push(firstAllowedPage.path);
                  } else {
                    router.push('/dashboard');
                  }
                }}
                className="flex-1"
              >
                <Home className="h-4 w-4 mr-2" />
                Inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render the page
  return <>{children}</>;
}
