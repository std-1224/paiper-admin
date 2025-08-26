import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Permission {
  id: string;
  module: string;
  role_id: string;
}

interface RolePermissionData {
  id: string;
  user_id: string;
  role_id: string;
  permissions?: Permission | Permission[];
}

export function useUserPermissions() {
  const { user } = useAuth();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user?.id) {
        setIsLoadingPermissions(false);
        setUserPermissions([]);
        return;
      }

      try {
        setIsLoadingPermissions(true);
        setPermissionsError(null);
        
        // Find data from role_permissions using user_id
        const response = await fetch(`/api/role_permissions?user_id=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user permissions');
        }

        const rolePermissionsData: RolePermissionData[] = await response.json();
        
        // Extract unique modules from the permissions data
        const modules = new Set<string>();
        
        rolePermissionsData.forEach((rp: any) => {
          // Handle the new API response format where permissions is an array
          if (rp.permissions && Array.isArray(rp.permissions)) {
            rp.permissions.forEach((perm: any) => {
              if (perm.module) {
                modules.add(perm.module);
              }
            });
          }
          // Fallback for single permission object
          else if (rp.permissions && rp.permissions.module) {
            modules.add(rp.permissions.module);
          }
        });

        setUserPermissions(Array.from(modules));
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        setPermissionsError(error instanceof Error ? error.message : 'Failed to fetch permissions');
        setUserPermissions([]);
      } finally {
        setIsLoadingPermissions(false);
      }
    };

    fetchUserPermissions();
  }, [user?.id]);

  const hasPermission = (module: string): boolean => {
    if (isLoadingPermissions) return false;
    return userPermissions.includes(module);
  };

  const hasAnyPermission = (modules: string[]): boolean => {
    if (isLoadingPermissions) return false;
    return modules.some(module => userPermissions.includes(module));
  };

  return {
    userPermissions,
    isLoadingPermissions,
    permissionsError,
    hasPermission,
    hasAnyPermission,
  };
}
