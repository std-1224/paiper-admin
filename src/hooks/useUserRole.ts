import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Permission {
  id: string;
  module: string;
  role_id: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
  level: string;
  transaction_limit: number;
}

interface RolePermissionData {
  id: string;
  user_id: string;
  role_id: string;
  roles?: Role;
  permissions?: Permission[];
}

export function useUserRole() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [roleError, setRoleError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user?.id) {
        setIsLoadingRole(false);
        setUserRole(null);
        setUserPermissions([]);
        return;
      }

      try {
        setIsLoadingRole(true);
        setRoleError(null);
        
        // Fetch user role and permissions from role_permissions API
        const response = await fetch(`/api/role_permissions?user_id=${user.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user role');
        }

        const rolePermissionsData: RolePermissionData[] = await response.json();
        
        if (rolePermissionsData.length > 0) {
          const firstRolePermission = rolePermissionsData[0];
          
          // Set the user's role
          if (firstRolePermission.roles) {
            setUserRole(firstRolePermission.roles);
          }
          
          // Extract unique modules from the permissions data
          const modules = new Set<string>();
          
          rolePermissionsData.forEach((rp: RolePermissionData) => {
            // Handle the permissions array
            if (rp.permissions && Array.isArray(rp.permissions)) {
              rp.permissions.forEach((perm: Permission) => {
                if (perm.module) {
                  modules.add(perm.module);
                }
              });
            }
          });

          setUserPermissions(Array.from(modules));
        } else {
          setUserRole(null);
          setUserPermissions([]);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRoleError(error instanceof Error ? error.message : 'Failed to fetch role');
        setUserRole(null);
        setUserPermissions([]);
      } finally {
        setIsLoadingRole(false);
      }
    };

    fetchUserRole();
  }, [user?.id]);

  const hasPermission = (module: string): boolean => {
    if (isLoadingRole) return false;
    return userPermissions.includes(module);
  };

  const hasAnyPermission = (modules: string[]): boolean => {
    if (isLoadingRole) return false;
    return modules.some(module => userPermissions.includes(module));
  };

  return {
    userRole,
    userPermissions,
    isLoadingRole,
    roleError,
    hasPermission,
    hasAnyPermission,
  };
}
