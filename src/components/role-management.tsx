"use client"

import { useState } from "react"
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
} from "lucide-react"
import React from "react"

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

const mockStaff: Staff[] = [
  {
    id: 1,
    name: "Carlos Mendoza",
    email: "carlos@clubparadise.com",
    phone: "+52 555 123 4567",
    role: "Administrador",
    status: "active",
    lastLogin: "2024-01-15 14:30",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-06-15",
    department: "Administración",
  },
  {
    id: 2,
    name: "Ana García",
    email: "ana.garcia@clubparadise.com",
    phone: "+52 555 234 5678",
    role: "Bar Manager",
    status: "active",
    lastLogin: "2024-01-15 12:15",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-08-20",
    department: "Bar",
  },
  {
    id: 3,
    name: "Miguel Torres",
    email: "miguel.torres@clubparadise.com",
    phone: "+52 555 345 6789",
    role: "Barman",
    status: "active",
    lastLogin: "2024-01-15 10:45",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-09-10",
    department: "Bar",
  },
  {
    id: 4,
    name: "Sofia Ruiz",
    email: "sofia.ruiz@clubparadise.com",
    phone: "+52 555 456 7890",
    role: "PR Manager",
    status: "active",
    lastLogin: "2024-01-15 16:20",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-07-05",
    department: "Marketing",
  },
  {
    id: 5,
    name: "Diego López",
    email: "diego.lopez@clubparadise.com",
    phone: "+52 555 567 8901",
    role: "Barman",
    status: "inactive",
    lastLogin: "2024-01-10 22:30",
    avatar: "/placeholder.svg?height=40&width=40",
    joinDate: "2023-11-12",
    department: "Bar",
  },
]

const permissionModules = [
  {
    // dashboard page
    id: "dashboard",
    name: "Dashboard",
    icon: "📊",
    permissions: [
      { id: "dashboard_view", name: "Ver Dashboard", description: "Acceso al panel principal" }, // dashboard page permissions: READ
      { id: "dashboard_analytics", name: "Ver Analíticas", description: "Acceso a métricas y reportes" }, // dashboard page permissions: READ
      { id: "dashboard_export", name: "Exportar Datos", description: "Descargar reportes y datos" }, // dashboard page permissions: EXPORT
    ],
  },
  {
    // roles page
    id: "users",
    name: "Gestión de Usuarios",
    icon: "👥",
    permissions: [
      { id: "users_view", name: "Ver Usuarios", description: "Listar y buscar usuarios" }, // roles page, permisisons: READ
      { id: "users_create", name: "Crear Usuarios", description: "Registrar nuevos usuarios" }, //
      { id: "users_edit", name: "Editar Usuarios", description: "Modificar información de usuarios" },
      { id: "users_delete", name: "Eliminar Usuarios", description: "Desactivar o eliminar usuarios" },
      { id: "users_roles", name: "Asignar Roles", description: "Cambiar roles de usuarios" },
    ],
  },
  {
    // finances page
    id: "payments",
    name: "Sistema de Pagos",
    icon: "💳",
    permissions: [
      { id: "payments_view", name: "Ver Transacciones", description: "Consultar historial de pagos" },
      { id: "payments_process", name: "Procesar Pagos", description: "Realizar cobros y recargas" },
      { id: "payments_refund", name: "Reembolsos", description: "Procesar devoluciones" },
      { id: "payments_reports", name: "Reportes Financieros", description: "Generar reportes de ventas" },
      { id: "payments_config", name: "Configurar Pagos", description: "Modificar métodos y límites" },
    ],
  },
  // stock page
  {
    id: "inventory",
    name: "Inventario",
    icon: "📦",
    permissions: [
      { id: "inventory_view", name: "Ver Inventario", description: "Consultar stock y productos" }, //stock page, menu page, permission: READ
      { id: "inventory_edit", name: "Editar Inventario", description: "Modificar cantidades y productos" }, // stock page, menu page permission: CREATE, UPDATE, DELETE
      { id: "inventory_orders", name: "Gestionar Pedidos", description: "Crear y gestionar órdenes" }, // orders page permission: CREATE, UPDATE, DELETE
      { id: "inventory_suppliers", name: "Proveedores", description: "Gestionar proveedores" }, // orders page
    ],
  },
  // {

  //   id: "pos",
  //   name: "Punto de Venta",
  //   icon: "🛒",
  //   permissions: [
  //     { id: "pos_sales", name: "Realizar Ventas", description: "Procesar ventas en el POS" },
  //     { id: "pos_discounts", name: "Aplicar Descuentos", description: "Autorizar descuentos especiales" },
  //     { id: "pos_voids", name: "Anular Ventas", description: "Cancelar transacciones" },
  //     { id: "pos_reports", name: "Reportes de Ventas", description: "Ver reportes del POS" },
  //   ],
  // },
  {
    // qr-tracking page
    id: "events",
    name: "Eventos y PR",
    icon: "🎉",
    permissions: [
      { id: "events_view", name: "Ver Eventos", description: "Consultar calendario de eventos" },
      { id: "events_create", name: "Crear Eventos", description: "Programar nuevos eventos" },
      { id: "events_manage", name: "Gestionar Eventos", description: "Modificar eventos existentes" },
      { id: "events_guestlist", name: "Lista de Invitados", description: "Gestionar accesos VIP" },
      { id: "events_campaigns", name: "Campañas QR", description: "Crear campañas promocionales" },
    ],
  },
  {
    id: "settings",
    name: "Configuración",
    icon: "⚙️",
    permissions: [
      { id: "settings_view", name: "Ver Configuración", description: "Acceso a configuraciones" },
      { id: "settings_edit", name: "Editar Configuración", description: "Modificar configuraciones" },
      { id: "settings_roles", name: "Gestionar Roles", description: "Crear y editar roles" },
      { id: "settings_system", name: "Configuración del Sistema", description: "Configuraciones avanzadas" },
    ],
  },
]

const mockRoles: Role[] = [
  {
    id: 1,
    name: "Administrador",
    description: "Acceso completo al sistema",
    permissions: [
      "dashboard_view",
      "dashboard_analytics",
      "dashboard_export",
      "users_view",
      "users_create",
      "users_edit",
      "users_delete",
      "users_roles",
      "payments_view",
      "payments_process",
      "payments_refund",
      "payments_reports",
      "payments_config",
      "settings_view",
      "settings_edit",
      "settings_roles",
      "settings_system",
    ],
    color: "bg-red-100 text-red-800",
    accessLevel: "full",
    canOverride: true,
    maxTransactionAmount: 10000,
    workingHours: { start: "00:00", end: "23:59" },
    allowedDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
  },
  {
    id: 2,
    name: "Bar Manager",
    description: "Gestión completa del área de bar",
    permissions: [
      "dashboard_view",
      "inventory_view",
      "inventory_edit",
      "inventory_orders",
      "pos_sales",
      "pos_discounts",
      "pos_reports",
      "payments_view",
      "payments_process",
    ],
    color: "bg-blue-100 text-blue-800",
    accessLevel: "department",
    canOverride: true,
    maxTransactionAmount: 5000,
    workingHours: { start: "16:00", end: "04:00" },
    allowedDays: ["wednesday", "thursday", "friday", "saturday", "sunday"],
  },
  {
    id: 3,
    name: "Barman",
    description: "Operación del bar y punto de venta",
    permissions: ["pos_sales", "inventory_view", "payments_view", "payments_process"],
    color: "bg-green-100 text-green-800",
    accessLevel: "limited",
    canOverride: false,
    maxTransactionAmount: 1000,
    workingHours: { start: "18:00", end: "04:00" },
    allowedDays: ["thursday", "friday", "saturday", "sunday"],
  },
  {
    id: 4,
    name: "PR Manager",
    description: "Gestión de eventos y relaciones públicas",
    permissions: [
      "dashboard_view",
      "events_view",
      "events_create",
      "events_manage",
      "events_guestlist",
      "events_campaigns",
      "users_view",
    ],
    color: "bg-purple-100 text-purple-800",
    accessLevel: "department",
    canOverride: false,
    maxTransactionAmount: 2000,
    workingHours: { start: "14:00", end: "02:00" },
    allowedDays: ["wednesday", "thursday", "friday", "saturday", "sunday"],
  },
]

// Añadamos los datos de ejemplo para el historial de cambios después de la constante mockRoles
const mockAuditLog = [
  {
    id: 1,
    user: "Carlos Mendoza",
    userRole: "Administrador",
    action: "update",
    actionType: "role",
    targetName: "Bar Manager",
    details: "Modificó permisos: añadió 'payments_refund', eliminó 'inventory_suppliers'",
    timestamp: "2024-01-15 14:30:22",
    ipAddress: "192.168.1.45",
    status: "success",
    changes: {
      before: {
        permissions: [
          "dashboard_view",
          "inventory_view",
          "inventory_edit",
          "inventory_orders",
          "inventory_suppliers",
          "pos_sales",
          "pos_discounts",
          "pos_reports",
          "payments_view",
          "payments_process",
        ],
      },
      after: {
        permissions: [
          "dashboard_view",
          "inventory_view",
          "inventory_edit",
          "inventory_orders",
          "pos_sales",
          "pos_discounts",
          "pos_reports",
          "payments_view",
          "payments_process",
          "payments_refund",
        ],
      },
    },
  },
]

export function RoleManagement() {
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
      accessLevel: 'Acceso Completo',
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
  }

  const handleNewStaff = () => {
    setSelectedStaff(null)
    setIsStaffDialogOpen(true)
  }

  const handleCreateRole = () => {
    setSelectedRole(null)
    setCurrentStep(1) // Start from first step
    setSelectedPermissions([]) // Reset permissions for new role
    setRoleForm({
      name: '',
      description: '',
      accessLevel: 'Acceso Completo',
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
        // Here you would implement the actual delete logic
        console.log(`Deleting ${itemToDelete.type}:`, itemToDelete.item)

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))

        setSuccessMessage(`${itemToDelete.type === 'staff' ? 'Miembro del staff' : 'Rol'} eliminado exitosamente`)
        setIsDeleteDialogOpen(false)
        setItemToDelete(null)

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000)
      } catch (error) {
        console.error('Error deleting item:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSaveStaff = async () => {
    setIsLoading(true)
    try {
      // Here you would implement the actual save logic
      console.log('Saving staff:', selectedStaff)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccessMessage(`${selectedStaff ? 'Staff actualizado' : 'Staff creado'} exitosamente`)
      setIsStaffDialogOpen(false)
      setSelectedStaff(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving staff:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveRole = async () => {
    setIsLoading(true)
    try {
      // Create the role data from form
      const roleData = {
        ...roleForm,
        id: selectedRole?.id || Date.now(), // Generate ID for new roles
        permissions: selectedPermissions, // Use selected permissions from wizard
        color: selectedRole?.color || 'bg-blue-100 text-blue-800',
        workingHours: roleForm.workingHours,
        allowedDays: roleForm.allowedDays
      }

      // Here you would implement the actual save logic
      console.log('Saving role:', roleData)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccessMessage(`${selectedRole ? 'Rol actualizado' : 'Rol creado'} exitosamente`)
      handleCloseRoleDialog()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error saving role:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredStaff = mockStaff.filter((staff) => {
    const search = searchTerm.toLowerCase()
    return (
      staff.name.toLowerCase().includes(search) ||
      staff.email.toLowerCase().includes(search) ||
      staff.role.toLowerCase().includes(search)
    )
  })

  const getRoleColor = (role: string) => {
    const roleObj = mockRoles.find((r) => r.name === role)
    return roleObj ? roleObj.color : "bg-gray-100 text-gray-800"
  }

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
                        <Badge className={getRoleColor(staff.role)}>{staff.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={staff.status === "active" ? "default" : "secondary"}>
                          {staff.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{staff.lastLogin}</TableCell>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockRoles.map((role) => (
              <Card key={role.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${role.color.split(" ")[0]}`} />
                      {role.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{mockStaff.filter((s) => s.role === role.name).length} usuarios</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleEditRole(role)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteConfirmation('role', role)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={mockStaff.filter((s) => s.role === role.name).length > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
                    <Label className="text-sm font-medium">Permisos principales:</Label>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission.replace("_", " ")}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
                  {mockAuditLog.map((log) => (
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
                            <span className="text-xs text-muted-foreground">{log.userRole}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Badge className="bg-blue-100 text-blue-800">
                              {log.action === "create" && "Creación"}
                              {log.action === "update" && "Modificación"}
                              {log.action === "delete" && "Eliminación"}
                              {log.action === "failed" && "Fallido"}
                            </Badge>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <Shield className="h-3 w-3" />
                              <span className="capitalize hidden sm:inline ml-1">
                                {log.actionType === "role" && "Roles"}
                                {log.actionType === "user" && "Usuarios"}
                                {log.actionType === "inventory" && "Inventario"}
                                {log.actionType === "pos" && "Ventas"}
                                {log.actionType === "event" && "Eventos"}
                                {log.actionType === "settings" && "Config"}
                              </span>
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-medium">{log.targetName}</TableCell>
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
                                      <span className="text-sm">{log.action === "update" ? "Update - Role" : log.action}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-sm font-medium">Objetivo:</span>
                                      <span className="text-sm">{log.targetName}</span>
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
                                      <div>
                                        <h5 className="text-xs font-medium text-muted-foreground mb-2">Antes:</h5>
                                        <div className="bg-background rounded p-3 text-xs font-mono">
                                          <pre className="whitespace-pre-wrap">
{JSON.stringify({ permissions: log.changes.before.permissions }, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                      <div>
                                        <h5 className="text-xs font-medium text-muted-foreground mb-2">Después:</h5>
                                        <div className="bg-background rounded p-3 text-xs font-mono">
                                          <pre className="whitespace-pre-wrap">
{JSON.stringify({ permissions: log.changes.after.permissions }, null, 2)}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
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
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" defaultValue={selectedStaff?.name || ""} placeholder="Ingrese el nombre completo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={selectedStaff?.email || ""} placeholder="correo@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" defaultValue={selectedStaff?.phone || ""} placeholder="+52 555 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" defaultValue={selectedStaff?.department || ""} placeholder="Ej: Administración" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role-select">Rol</Label>
                <Select defaultValue={selectedStaff?.role || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockRoles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedStaff && (
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select defaultValue={selectedStaff.status}>
                    <SelectTrigger>
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
                    defaultValue={selectedStaff.joinDate || ""}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-access">Último Acceso</Label>
                  <Input
                    id="last-access"
                    defaultValue={selectedStaff.lastLogin || ""}
                    placeholder="2024-01-15 14:30"
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
                        <SelectItem value="Acceso Completo">Acceso Completo</SelectItem>
                        <SelectItem value="Acceso Departamental">Acceso Departamental</SelectItem>
                        <SelectItem value="Acceso Limitado">Acceso Limitado</SelectItem>
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
              <div className="space-y-6">
                {permissionModules.map((module) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <span className="mr-2">{module.icon}</span>
                        {module.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {module.permissions.map((permission) => (
                          <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={(checked) => handlePermissionChange(permission.id, checked as boolean)}
                            />
                            <div className="flex-1">
                              <Label htmlFor={permission.id} className="font-medium cursor-pointer">
                                {permission.name}
                              </Label>
                              <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                      <Label className="text-sm font-medium text-muted-foreground">Permisos Seleccionados</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPermissions.length > 0 ? (
                          selectedPermissions.map((permissionId) => {
                            const permission = permissionModules
                              .flatMap(module => module.permissions)
                              .find(p => p.id === permissionId)
                            return (
                              <Badge key={permissionId} variant="outline" className="text-xs">
                                {permission?.name || permissionId}
                              </Badge>
                            )
                          })
                        ) : (
                          <p className="text-sm text-muted-foreground">No se han seleccionado permisos</p>
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
