"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Shield,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  DollarSign,
  X,
  Package,
} from "lucide-react"
import React from "react"
import { useAuth } from "@/context/AuthContext"

// Type definitions
interface Staff {
  id: number
  name: string
  email: string
  phone: string
  role: string
  status: string
  lastLogin: string
  avatar: string
  joinDate: string
  department: string
  roleDetails: {
    id: number
    name: string
    description: string
    level: string
    transaction_limit: number
  }
  permissions: {
    id: number
    module: string
    role_id: number
  }[]
  rolePermissions: {
    id: number
    user_id: number
    role_id: number
    created_at: string
    updated_at: string
  }[]
}

interface Role {
  id: number
  name: string
  description: string
  permissions: string[]
  color: string
  accessLevel: string
  canOverride: boolean
  maxTransactionAmount: number
  workingHours: { start: string; end: string }
  allowedDays: string[]
}



const permissionModules = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: "📊",
    description: "Acceso al panel principal y métricas"
  },
  {
    id: "orders",
    name: "Orders",
    icon: "📋",
    description: "Gestión de pedidos y órdenes"
  },
  {
    id: "roles",
    name: "Roles",
    icon: "👥",
    description: "Gestión de roles y permisos de usuarios"
  },
  {
    id: "menu",
    name: "Menu",
    icon: "🍽️",
    description: "Gestión del menú y productos"
  },
  {
    id: "qr-tracking",
    name: "QR Tracking",
    icon: "📱",
    description: "Seguimiento y campañas QR"
  },
  {
    id: "stock",
    name: "Stock",
    icon: "📦",
    description: "Gestión de inventario y stock"
  },
  {
    id: "finances",
    name: "Finances",
    icon: "💰",
    description: "Gestión financiera y reportes"
  },
  {
    id: "configuration",
    name: "Configuration",
    icon: "💰",
    description: "Gestión financiera y reportes"
  }
]

// Interface for audit log entries
interface AuditLogEntry {
  id: number;
  user: string;
  userRole: string;
  action: string;
  actionType: string;
  targetName: string;
  details: string;
  timestamp: string;
  ipAddress: string;
  status: string;
  changes?: {
    before?: any;
    after?: any;
  };
}

export function RoleManagement() {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [activeTab, setActiveTab] = useState("staff")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{ type: 'staff' | 'role', item: Staff | Role } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [roles, setRoles] = useState<Role[]>([]) // Initialize with empty array
  const [isLoadingRoles, setIsLoadingRoles] = useState(false)
  const [expandedRolePermissions, setExpandedRolePermissions] = useState<Set<string | number>>(new Set())
  const [staff, setStaff] = useState<Staff[]>([]) // Initialize with empty array
  const [isLoadingStaff, setIsLoadingStaff] = useState(false)
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([])
  const [isLoadingAuditLog, setIsLoadingAuditLog] = useState(false)

  // Helper function to get role name from audit log entry
  const getRoleNameFromAuditLog = (log: AuditLogEntry): string => {
    // For role operations, use the target name (which is the role name)
    if (log.actionType === "role") {
      return log.targetName
    }

    // For staff role assignments, extract role name from changes
    if (log.actionType === "staff_role_assignment" && log.changes) {
      // For updates, prefer the new role name
      if (log.changes.after?.role_name) {
        return log.changes.after.role_name
      }
      // For deletions, use the old role name
      if (log.changes.before?.role_name) {
        return log.changes.before.role_name
      }
    }

    // Fallback to generic category
    return log.actionType === "staff_role_assignment" ? "Asignación Staff" : "Roles"
  }

  // Helper function to get descriptive target info
  const getTargetDescription = (log: AuditLogEntry): string => {
    if (log.actionType === "role") {
      return `Rol: ${log.targetName}`
    }
    if (log.actionType === "balance_update") {
      return `Usuario: ${log.targetName}`
    }
    if (log.actionType === "order_cancellation") {
      return `Pedido: ${log.targetName}`
    }
    if (log.actionType === "stock_update") {
      return `Producto: ${log.targetName}`
    }

    return log.targetName
  }

  // Staff form state
  const [staffForm, setStaffForm] = useState({
    email: '',
    phone: '',
    role_id: '',
    status: 'active'
  })

  // Fetch roles from API
  const fetchRoles = async () => {
    setIsLoadingRoles(true)
    try {
      const response = await fetch('/api/roles')
      if (response.ok) {
        const fetchedRoles = await response.json()
        setRoles(fetchedRoles)
      } else {
        console.error('Failed to fetch roles')
        setRoles([]) // Set empty array if API fails
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRoles([]) // Set empty array if API fails
    } finally {
      setIsLoadingRoles(false)
    }
  }

  // Fetch staff from API
  const fetchStaff = async () => {
    setIsLoadingStaff(true)
    try {
      const response = await fetch('/api/role_permissions?all_staff=true')
      if (response.ok) {
        const fetchedStaff = await response.json()
        setStaff(fetchedStaff)
      } else {
        console.error('Failed to fetch staff')
        setStaff([]) // Set empty array if API fails
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaff([]) // Set empty array if API fails
    } finally {
      setIsLoadingStaff(false)
    }
  }

  // Fetch audit log from API
  const fetchAuditLog = async () => {
    setIsLoadingAuditLog(true)
    try {
      const response = await fetch('/api/audit-log?limit=50')
      if (response.ok) {
        const fetchedAuditLog = await response.json()
        setAuditLog(fetchedAuditLog)
      } else {
        console.error('Failed to fetch audit log')
        setAuditLog([]) // Set empty array if API fails
      }
    } catch (error) {
      console.error('Error fetching audit log:', error)
      setAuditLog([]) // Set empty array if API fails
    } finally {
      setIsLoadingAuditLog(false)
    }
  }

  // Fetch roles, staff, and audit log on component mount
  useEffect(() => {
    fetchRoles()
    fetchStaff()
    fetchAuditLog()
  }, [])

  // Form state for role editing
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    accessLevel: '',
    maxTransactionAmount: 10000,
    canOverride: false,
    workingHours: {
      start: '12:00',
      end: '23:59'
    },
    allowedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    requireTwoFactor: false,
    restrictByIP: false,
    autoTimeout: true,
    logAllActions: true,
    sessionDuration: 60,
    maxConcurrentSessions: 1
  })

  const [auditLogFilters, setAuditLogFilters] = useState({
    user: "",
    role: "",
    action: "",
    actionType: "",
    dateFrom: "",
    dateTo: "",
  })

  // State for expanded audit log rows
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  // Function to toggle row expansion
  const toggleRowExpansion = (rowId: number) => {
    const newExpandedRows = new Set(expandedRows)
    if (newExpandedRows.has(rowId)) {
      newExpandedRows.delete(rowId)
    } else {
      newExpandedRows.add(rowId)
    }
    setExpandedRows(newExpandedRows)
  }

  const handleNewRole = () => {
    handleCreateRole()
  }

  const handleCloseRoleDialog = () => {
    setIsRoleDialogOpen(false)
    setSelectedRole(null)
    setCurrentStep(1) // Reset to first step
    setSelectedPermissions([]) // Reset permissions
    setRoleForm({
      name: '',
      description: '',
      accessLevel: 'full',
      maxTransactionAmount: 10000,
      canOverride: false,
      workingHours: {
        start: '12:00',
        end: '23:59'
      },
      allowedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      requireTwoFactor: false,
      restrictByIP: false,
      autoTimeout: true,
      logAllActions: true,
      sessionDuration: 60,
      maxConcurrentSessions: 1
    })
  }

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return roleForm.name.trim() !== '' && roleForm.description.trim() !== ''
      case 2:
        return true // Permissions step - always allow to proceed
      case 3:
        return true // Review step
      default:
        return false
    }
  }

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId])
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId))
    }
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Información Básica"
      case 2:
        return "Permisos y Accesos"
      case 3:
        return "Revisar y Crear"
      default:
        return ""
    }
  }

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff)
    setIsStaffDialogOpen(true)
    // Find the role ID from the role name
    const selectedRole = roles.find(role => role.name === staff.role)
    // Populate form with existing staff data
    setStaffForm({
      email: staff.email,
      phone: staff.phone,
      role_id: selectedRole?.id?.toString() || '',
      status: staff.status
    })
  }



  const handleNewStaff = () => {
    setSelectedStaff(null)
    setIsStaffDialogOpen(true)
    setStaffForm({
      email: '',
      phone: '',
      role_id: '',
      status: 'active'
    })
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setCurrentStep(1) // Start from first step
    setSelectedPermissions([]) // Reset permissions for new role
    setRoleForm({
      name: '',
      description: '',
      accessLevel: 'full',
      maxTransactionAmount: 10000,
      canOverride: false,
      workingHours: {
        start: '12:00',
        end: '23:59'
      },
      allowedDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      requireTwoFactor: false,
      restrictByIP: false,
      autoTimeout: true,
      logAllActions: true,
      sessionDuration: 60,
      maxConcurrentSessions: 1
    })
    setIsRoleDialogOpen(true)
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setCurrentStep(1) // Start from first step
    setSelectedPermissions(role.permissions || []) // Load existing permissions
    setRoleForm({
      name: role.name,
      description: role.description,
      accessLevel: role.accessLevel,
      maxTransactionAmount: role.maxTransactionAmount,
      canOverride: role.canOverride,
      workingHours: role.workingHours || { start: '12:00', end: '23:59' },
      allowedDays: role.allowedDays || ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      requireTwoFactor: false,
      restrictByIP: false,
      autoTimeout: true,
      logAllActions: true,
      sessionDuration: 60,
      maxConcurrentSessions: 1
    })
    setIsRoleDialogOpen(true)
  }

  const handleDeleteConfirmation = (type: 'staff' | 'role', item: Staff | Role) => {
    setItemToDelete({ type, item })
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    if (itemToDelete) {
      setIsLoading(true)
      try {
        if (itemToDelete.type === 'staff') {
          // Delete staff member using role_permissions API
          const staff = itemToDelete.item as Staff
          const response = await fetch(`/api/role_permissions?user_id=${staff.id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete staff member')
          }

          setSuccessMessage('Miembro del staff eliminado exitosamente')

          // Refresh the staff list
          await fetchStaff()
        } else if (itemToDelete.type === 'role') {
          // Delete role using roles API
          const role = itemToDelete.item as Role
          const response = await fetch(`/api/roles?id=${role.id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to delete role')
          }

          setSuccessMessage('Rol eliminado exitosamente')

          // Refresh the roles list
          await fetchRoles()
          await fetchStaff()
        }

        setIsDeleteDialogOpen(false)
        setItemToDelete(null)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        console.error('Error deleting item:', error)
        setSuccessMessage(`Error: ${error instanceof Error ? error.message : 'Failed to delete item'}`)
        setTimeout(() => setSuccessMessage(null), 5000)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveStaff = async () => {
    setIsLoading(true)
    try {
      // Validate required fields
      if (!staffForm.email || !staffForm.role_id) {
        throw new Error('Email and role are required')
      }

      // Prepare current user info for audit logging
      const currentUserInfo = user ? {
        current_user_id: user.id,
        current_user_email: user.email
      } : {}

      let response
      if (selectedStaff) {
        // Update existing staff using role_permissions API
        response = await fetch('/api/role_permissions', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: selectedStaff.id,
            role_id: staffForm.role_id,
            phone: staffForm.phone,
            ...currentUserInfo
          }),
        })
      } else {
        // Create new staff using role_permissions API
        response = await fetch('/api/role_permissions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: staffForm.email,
            phone: staffForm.phone,
            role_id: staffForm.role_id,
            ...currentUserInfo
          }),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save staff member')
      }

      const result = await response.json()
      console.log('Staff saved successfully:', result)

      setSuccessMessage(`${selectedStaff ? 'Staff actualizado' : 'Staff creado'} exitosamente`)
      setIsStaffDialogOpen(false)
      setSelectedStaff(null)
      setStaffForm({
        email: '',
        phone: '',
        role_id: '',
        status: 'active'
      })

      // Refresh the staff list and audit log
      await fetchStaff()
      await fetchAuditLog()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving staff:', error)
      setSuccessMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save staff member'}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRole = async () => {
    setIsLoading(true)
    try {
      // Prepare current user info for audit logging
      const currentUserInfo = user ? {
        current_user_id: user.id,
        current_user_email: user.email
      } : {}

      // Create the role data from form
      const roleData = {
        name: roleForm.name,
        description: roleForm.description,
        accessLevel: roleForm.accessLevel,
        maxTransactionAmount: roleForm.maxTransactionAmount,
        permissions: selectedPermissions, // Use selected permissions from wizard
        ...currentUserInfo
      }

      let response
      if (selectedRole) {
        // Update existing role
        response = await fetch('/api/roles', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: selectedRole.id,
            ...roleData
          }),
        })
      } else {
        // Create new role
        response = await fetch('/api/roles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(roleData),
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save role')
      }

      const savedRole = await response.json()
      console.log('Role saved successfully:', savedRole)

      setSuccessMessage(`${selectedRole ? 'Rol actualizado' : 'Rol creado'} exitosamente`)
      handleCloseRoleDialog()

      // Refresh the roles list and audit log
      await fetchRoles()
      await fetchAuditLog()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving role:', error)
      setSuccessMessage(`Error: ${error instanceof Error ? error.message : 'Failed to save role'}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRolePermissions = (roleId: string | number) => {
    const newExpanded = new Set(expandedRolePermissions)
    if (newExpanded.has(roleId)) {
      newExpanded.delete(roleId)
    } else {
      newExpanded.add(roleId)
    }
    setExpandedRolePermissions(newExpanded)
  }

  const handleDeleteRole = async (roleId: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/roles?id=${roleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete role')
      }

      setSuccessMessage('Rol eliminado exitosamente')

      // Refresh the roles list
      await fetchRoles()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting role:', error)
      setSuccessMessage(`Error: ${error instanceof Error ? error.message : 'Failed to delete role'}`)
      setTimeout(() => setSuccessMessage(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStaff = staff.filter((staffMember) => {
    const search = searchTerm.toLowerCase()
    return (
      staffMember.name.toLowerCase().includes(search) ||
      staffMember.email.toLowerCase().includes(search) ||
      staffMember.role.toLowerCase().includes(search)
    )
  })

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Staff y Roles</h2>
          <p className="text-muted-foreground">Administra el personal y sus permisos en el sistema</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleNewRole}>
            <Shield className="mr-2 h-4 w-4" />
            Nuevo Rol
          </Button>
          <Button onClick={handleNewStaff}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Staff
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="staff">Personal</TabsTrigger>
          <TabsTrigger value="roles">Roles y Permisos</TabsTrigger>
          <TabsTrigger value="history">Historial de Cambios</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o rol..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              {isLoadingStaff ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Cargando personal...</p>
                  </div>
                </div>
              ) : filteredStaff.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay personal disponible</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {searchTerm ? 'No se encontraron resultados para tu búsqueda.' : 'Aún no se han agregado miembros del personal.'}
                    </p>
                    {!searchTerm && (
                      <Button onClick={handleNewStaff} className="flex items-center space-x-2">
                        <Plus className="h-4 w-4" />
                        <span>Agregar Primer Staff</span>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personal</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Último Acceso</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStaff.map((staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={staff.avatar || "/placeholder.svg"} />
                            <AvatarFallback>
                              {staff.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{staff.name}</div>
                            <div className="text-sm text-muted-foreground">{staff.department}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="mr-1 h-3 w-3" />
                            {staff.email}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Phone className="mr-1 h-3 w-3" />
                            {staff.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-gray-100 text-gray-800">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                          {staff.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{staff.roleDetails.level}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewStaff(staff)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteConfirmation('staff', staff)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {isLoadingRoles ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-muted-foreground">Cargando roles...</p>
              </div>
            </div>
          ) : roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay roles disponibles</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aún no se han creado roles en el sistema.
                </p>
                <Button onClick={handleCreateRole} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Crear Primer Rol</span>
                </Button>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {roles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${role.color.split(" ")[0]}`} />
                      {role.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {role.name === "Owner" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfirmation('role', role)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        // disabled={staff.filter((s) => s.role === role.name).length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nivel de Acceso:</Label>
                    <Badge variant="outline" className="capitalize">
                      {role.accessLevel === "full"
                        ? "Completo"
                        : role.accessLevel === "department"
                          ? "Departamental"
                          : "Limitado"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Límite de Transacción:</Label>
                    <div className="text-sm text-muted-foreground">${role.maxTransactionAmount.toLocaleString()}</div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Horario de Trabajo:</Label>
                    <div className="text-sm text-muted-foreground">
                      {role.workingHours.start} - {role.workingHours.end}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Módulos de acceso:</Label>
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const isExpanded = expandedRolePermissions.has(role.id)
                        const displayPermissions = isExpanded ? role.permissions : role.permissions.slice(0, 4)

                        return (
                          <>
                            {displayPermissions.map((moduleId) => {
                              const moduleData = permissionModules.find(m => m.id === moduleId)
                              return (
                                <Badge key={moduleId} variant="outline" className="text-xs flex items-center">
                                  <span className="mr-1">{moduleData?.icon}</span>
                                  {moduleData?.name || moduleId}
                                </Badge>
                              )
                            })}
                            {role.permissions.length > 4 && (
                              <Badge
                                variant="secondary"
                                className="text-xs cursor-pointer hover:bg-gray-200 transition-colors"
                                onClick={() => toggleRolePermissions(role.id)}
                              >
                                {isExpanded
                                  ? "Ver menos"
                                  : `+${role.permissions.length - 4} más`
                                }
                              </Badge>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por usuario, acción o detalles..."
                className="pl-8"
                value={auditLogFilters.user}
                onChange={(e) => setAuditLogFilters({ ...auditLogFilters, user: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button variant="outline" size="sm" className="h-9">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[180px]">Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead className="hidden md:table-cell">Objetivo</TableHead>
                    <TableHead className="hidden md:table-cell">Detalles</TableHead>
                    <TableHead className="hidden md:table-cell">Fecha</TableHead>
                    <TableHead className="text-right">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingAuditLog ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-muted-foreground">Cargando historial...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : auditLog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="text-center">
                          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-muted-foreground mb-2">No hay registros de auditoría</h3>
                          <p className="text-sm text-muted-foreground">
                            Los cambios en roles, balances, pedidos cancelados y actualizaciones de stock aparecerán aquí.
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLog.map((log: AuditLogEntry) => (
                    <>
                      <TableRow key={log.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(log.id)}
                            className="h-8 w-8 p-0"
                          >
                            {expandedRows.has(log.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.user}</span>
                            <span className="text-xs text-muted-foreground">{getRoleNameFromAuditLog(log)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className={`${
                              log.action === "create" ? "bg-green-100 text-green-800" :
                              log.action === "update" ? "bg-blue-100 text-blue-800" :
                              log.action === "delete" ? "bg-red-100 text-red-800" :
                              log.action === "cancel" ? "bg-orange-100 text-orange-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {log.action === "create" && "Creación"}
                              {log.action === "update" && "Modificación"}
                              {log.action === "delete" && "Eliminación"}
                              {log.action === "cancel" && "Cancelación"}
                              {log.action === "failed" && "Fallido"}
                            </Badge>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              {log.actionType === "role" || log.actionType === "staff_role_assignment" || log.actionType === "permission" ? (
                                <Shield className="h-3 w-3" />
                              ) : log.actionType === "balance_update" ? (
                                <DollarSign className="h-3 w-3 text-green-600" />
                              ) : log.actionType === "order_cancellation" ? (
                                <X className="h-3 w-3 text-red-600" />
                              ) : log.actionType === "stock_update" ? (
                                <Package className="h-3 w-3 text-blue-600" />
                              ) : log.actionType === "recipe_update" ? (
                                <Package className="h-3 w-3 text-purple-600" />
                              ) : log.actionType === "ingredient_update" ? (
                                <Package className="h-3 w-3 text-orange-600" />
                              ) : (
                                <Shield className="h-3 w-3" />
                              )}
                              <span className="ml-1 text-xs sm:text-sm">
                                {log.actionType === "balance_update" && "💰 Balance"}
                                {log.actionType === "order_cancellation" && "❌ Pedido"}
                                {log.actionType === "stock_update" && "📦 Stock"}
                                {log.actionType === "recipe_update" && "🍽️ Receta"}
                                {log.actionType === "ingredient_update" && "🥄 Ingrediente"}
                                {(log.actionType === "role" || log.actionType === "staff_role_assignment" || log.actionType === "permission") && getRoleNameFromAuditLog(log)}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-medium">{getTargetDescription(log)}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{log.details}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-sm">{log.timestamp.split(" ")[0]}</span>
                            <span className="text-xs text-muted-foreground">{log.timestamp.split(" ")[1]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>
                        </TableCell>
                      </TableRow>

                      {expandedRows.has(log.id) && (
                        <TableRow key={`${log.id}-expanded`}>
                          <TableCell colSpan={7} className="p-0">
                            <div className="bg-muted/30 border-l-4 border-blue-500 p-6">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                                    Información del Cambio
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Usuario:</span>
                                      <span className="text-sm">{log.user} ({log.userRole})</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Acción:</span>
                                      <span className="text-sm">
                                        {log.action === "create" && "Creación"}
                                        {log.action === "update" && "Modificación"}
                                        {log.action === "delete" && "Eliminación"}
                                        {log.action === "cancel" && "Cancelación"}
                                        {" - "}
                                        {log.actionType === "role" && "Rol"}
                                        {log.actionType === "staff_role_assignment" && "Asignación de Rol"}
                                        {log.actionType === "permission" && "Permiso"}
                                        {log.actionType === "balance_update" && "Actualización de Balance"}
                                        {log.actionType === "order_cancellation" && "Cancelación de Pedido"}
                                        {log.actionType === "stock_update" && "Actualización de Stock"}
                                        {log.actionType === "recipe_update" && "Actualización de Receta"}
                                        {log.actionType === "ingredient_update" && "Actualización de Ingrediente"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Objetivo:</span>
                                      <span className="text-sm">
                                        {log.actionType === "balance_update" && "Usuario: "}
                                        {log.actionType === "order_cancellation" && "Pedido: "}
                                        {log.actionType === "stock_update" && "Producto: "}
                                        {log.actionType === "recipe_update" && "Receta: "}
                                        {log.actionType === "ingredient_update" && "Ingrediente: "}
                                        {(log.actionType === "role" || log.actionType === "staff_role_assignment" || log.actionType === "permission") && "Rol: "}
                                        {log.targetName}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Fecha:</span>
                                      <span className="text-sm">{log.timestamp}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">IP:</span>
                                      <span className="text-sm">{log.ipAddress}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Estado:</span>
                                      <div className="flex items-center space-x-1">
                                        <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                        <span className="text-sm">Exitoso</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4">
                                  <h4 className="font-semibold text-sm text-muted-foreground border-b pb-2">
                                    Detalles del Cambio
                                  </h4>
                                  {log.changes && (
                                    <div className="space-y-4">
                                      {/* Only show "Before" section if there's a before state */}
                                      {log.changes.before && (
                                        <div>
                                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Antes:</h5>
                                          <div className="bg-background rounded p-3 text-xs font-mono">
                                            <pre className="whitespace-pre-wrap">
{JSON.stringify(log.changes.before, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* Always show "After" section for creates and updates */}
                                      {log.changes.after && (
                                        <div>
                                          <h5 className="text-xs font-medium text-muted-foreground mb-2">
                                            {log.changes.before ? 'Después:' : 'Estado Creado:'}
                                          </h5>
                                          <div className="bg-background rounded p-3 text-xs font-mono">
                                            <pre className="whitespace-pre-wrap">
{JSON.stringify(log.changes.after, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* For deletions, only show the before state */}
                                      {!log.changes.after && log.changes.before && (
                                        <div>
                                          <h5 className="text-xs font-medium text-muted-foreground mb-2">Estado Eliminado:</h5>
                                          <div className="bg-background rounded p-3 text-xs font-mono">
                                            <pre className="whitespace-pre-wrap">
{JSON.stringify(log.changes.before, null, 2)}
                                            </pre>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Staff Dialog */}
      <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStaff ? `Editar: ${selectedStaff.name}` : "Agregar Nuevo Staff"}</DialogTitle>
            <DialogDescription>
              {selectedStaff ? "Modifica la información del personal" : "Agrega un nuevo miembro al equipo"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedStaff && (
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStaff.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-lg">
                    {selectedStaff.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{selectedStaff.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedStaff.department}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  disabled={!!selectedStaff}
                  className={selectedStaff ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+52 555 123 4567"
                  disabled={!!selectedStaff}
                  className={selectedStaff ? "bg-muted" : ""}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Rol</Label>
                <Select
                  value={staffForm.role_id}
                  onValueChange={(value) => setStaffForm(prev => ({ ...prev, role_id: value }))}
                  disabled={isLoadingRoles}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      isLoadingRoles
                        ? "Cargando roles..."
                        : roles.length === 0
                          ? "No hay roles disponibles"
                          : "Selecciona un rol"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRoles ? (
                      <SelectItem value="" disabled>
                        Cargando roles...
                      </SelectItem>
                    ) : roles.length > 0 ? (
                      roles.map((role) => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          <div className="flex items-center justify-between w-full">
                            <span>{role.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="" disabled>
                        No hay roles disponibles
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedStaff && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={staffForm.status}
                    onValueChange={(value) => setStaffForm(prev => ({ ...prev, status: value }))}
                    disabled={true}
                  >
                    <SelectTrigger className="bg-muted">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                      <SelectItem value="suspended">Suspendido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {selectedStaff && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="join-date">Fecha de Ingreso</Label>
                  <Input
                    id="join-date"
                    type="date"
                    defaultValue={selectedStaff.joinDate ? (() => {
                      // Convert DD/MM/YYYY or D/M/YYYY to YYYY-MM-DD format
                      const parts = selectedStaff.joinDate.split('/');
                      if (parts.length === 3) {
                        const day = parts[0].padStart(2, '0');
                        const month = parts[1].padStart(2, '0');
                        const year = parts[2];
                        return `${year}-${month}-${day}`;
                      }
                      return selectedStaff.joinDate;
                    })() : ""}
                    className="w-full bg-muted"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-access">Último Acceso</Label>
                  <Input
                    id="last-access"
                    defaultValue={selectedStaff.roleDetails?.level || ""}
                    placeholder="Nivel de acceso"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStaffDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStaff} disabled={isLoading}>
              {isLoading ? "Guardando..." : selectedStaff ? "Guardar Cambios" : "Crear Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={handleCloseRoleDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedRole ? `Editar Rol: ${selectedRole.name}` : "Crear Nuevo Rol"}</DialogTitle>
            <DialogDescription>
              {selectedRole
                ? "Modifica los permisos y configuraciones del rol"
                : "Define un nuevo rol con sus permisos correspondientes"}
            </DialogDescription>
          </DialogHeader>

          {/* Step Progress Indicator */}
          <div className="flex items-center justify-between mb-6">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step === currentStep
                      ? "bg-blue-600 text-white"
                      : step < currentStep
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step < currentStep ? "✓" : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      step < currentStep ? "bg-green-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Title */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold">{getStepTitle()}</h3>
            <p className="text-sm text-muted-foreground">
              Paso {currentStep} de {totalSteps}
            </p>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role-name">Nombre del Rol</Label>
                    <Input
                      id="role-name"
                      value={roleForm.name}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ej: Supervisor de Bar"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="access-level">Nivel de Acceso</Label>
                    <Select
                      value={roleForm.accessLevel}
                      onValueChange={(value) => setRoleForm(prev => ({ ...prev, accessLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Acceso Completo</SelectItem>
                        <SelectItem value="departmental">Acceso Departamental</SelectItem>
                        <SelectItem value="limited">Acceso Limitado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role-description">Descripción</Label>
                  <Textarea
                    id="role-description"
                    value={roleForm.description}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe las responsabilidades de este rol..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction-limit">Límite de Transacción ($)</Label>
                    <Input
                      id="transaction-limit"
                      type="number"
                      value={roleForm.maxTransactionAmount}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, maxTransactionAmount: Number(e.target.value) }))}
                      placeholder="10000"
                      min="0"
                      step="100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="can-cancel-transactions">Puede Anular Transacciones</Label>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="can-cancel-transactions"
                        checked={roleForm.canOverride}
                        onCheckedChange={(checked) => setRoleForm(prev => ({ ...prev, canOverride: checked as boolean }))}
                      />
                      <Label htmlFor="can-cancel-transactions" className="text-sm font-normal">
                        Permitir anular/modificar transacciones
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Permissions */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-4">
                  Selecciona los módulos a los que este rol tendrá acceso:
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permissionModules.map((module) => (
                    <div key={module.id} className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={module.id}
                        checked={selectedPermissions.includes(module.id)}
                        onCheckedChange={(checked) => handlePermissionChange(module.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={module.id} className="font-medium cursor-pointer flex items-center">
                          <span className="mr-2">{module.icon}</span>
                          {module.name}
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Review and Create */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Rol</CardTitle>
                    <CardDescription>Revisa la información antes de crear el rol</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nombre del Rol</Label>
                        <p className="text-sm font-medium">{roleForm.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nivel de Acceso</Label>
                        <p className="text-sm font-medium">{roleForm.accessLevel}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Descripción</Label>
                      <p className="text-sm">{roleForm.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Límite de Transacción</Label>
                        <p className="text-sm font-medium">${roleForm.maxTransactionAmount.toLocaleString()}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Puede Anular Transacciones</Label>
                        <p className="text-sm font-medium">{roleForm.canOverride ? "Sí" : "No"}</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Módulos Seleccionados</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPermissions.length > 0 ? (
                          selectedPermissions.map((moduleId) => {
                            const moduleData = permissionModules.find(m => m.id === moduleId)
                            return (
                              <Badge key={moduleId} variant="outline" className="text-xs flex items-center">
                                <span className="mr-1">{moduleData?.icon}</span>
                                {moduleData?.name || moduleId}
                              </Badge>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No se han seleccionado módulos</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePreviousStep} disabled={isLoading}>
                  Anterior
                </Button>
              )}
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCloseRoleDialog} disabled={isLoading}>
                Cancelar
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!canProceedToNextStep() || isLoading}
                >
                  Siguiente
                </Button>
              ) : (
                <Button onClick={handleSaveRole} disabled={isLoading}>
                  {isLoading ? "Creando..." : selectedRole ? "Guardar Cambios" : "Crear Rol"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span>Confirmar Eliminación</span>
            </DialogTitle>
            <DialogDescription>
              {itemToDelete && (
                <>
                  ¿Estás seguro de que deseas eliminar {itemToDelete.type === 'staff' ? 'al miembro del staff' : 'el rol'}{' '}
                  <strong>
                    {'name' in itemToDelete.item ? itemToDelete.item.name : 'este elemento'}
                  </strong>?
                  <br />
                  <span className="text-red-600 text-sm mt-2 block">
                    Esta acción no se puede deshacer.
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed} disabled={isLoading}>
              <Trash2 className="mr-2 h-4 w-4" />
              {isLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
