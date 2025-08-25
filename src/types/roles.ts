// Role-related type definitions for API and components

export interface Role {
  id: string | number
  name: string
  description: string
  permissions: string[]
  accessLevel: 'full' | 'departmental' | 'limited'
  maxTransactionAmount: number
  color?: string
  canOverride?: boolean
  workingHours?: { start: string; end: string }
  allowedDays?: string[]
  created_at?: string
  updated_at?: string
}

export interface CreateRoleRequest {
  name: string
  description?: string
  accessLevel: 'full' | 'departmental' | 'limited'
  maxTransactionAmount: number
  permissions: string[]
}

export interface UpdateRoleRequest extends CreateRoleRequest {
  id: string | number
}

export interface Permission {
  id: string
  module: string
  role_id: string
  created_at: string
  updated_at: string
}

export interface RoleWithPermissions extends Omit<Role, 'permissions'> {
  permissions: Permission[]
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface RoleApiResponse extends ApiResponse<Role> {}
export interface RolesApiResponse extends ApiResponse<Role[]> {}
