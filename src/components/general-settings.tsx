"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Globe, Shield, Database, FileText, Download } from "lucide-react"

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuración General</h2>
        <p className="text-muted-foreground">Configuraciones básicas del sistema</p>
      </div>

      <Tabs defaultValue="app">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="app">Aplicación</TabsTrigger>
          <TabsTrigger value="localization">Localización</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="backup">Respaldos</TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="app" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Información del Venue
                </CardTitle>
                <CardDescription>Datos básicos del establecimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venue-name">Nombre del Venue</Label>
                  <Input id="venue-name" defaultValue="Club Paradise" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue-description">Descripción</Label>
                  <Textarea id="venue-description" defaultValue="El mejor club nocturno de la ciudad" rows={3} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening-time">Hora de Apertura</Label>
                    <Input id="opening-time" type="time" defaultValue="18:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closing-time">Hora de Cierre</Label>
                    <Input id="closing-time" type="time" defaultValue="04:00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-capacity">Capacidad Máxima</Label>
                  <Input id="max-capacity" type="number" defaultValue="500" />
                </div>

                <Button className="w-full">Guardar Información</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Operación</CardTitle>
                <CardDescription>Horarios y configuraciones operativas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="opening-time">Hora de Apertura</Label>
                    <Input id="opening-time" type="time" defaultValue="18:00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="closing-time">Hora de Cierre</Label>
                    <Input id="closing-time" type="time" defaultValue="04:00" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-capacity">Capacidad Máxima</Label>
                  <Input id="max-capacity" type="number" defaultValue="500" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Mantenimiento</Label>
                    <div className="text-sm text-muted-foreground">Deshabilitar acceso temporal</div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de Actividad</Label>
                    <div className="text-sm text-muted-foreground">Registrar todas las acciones</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Funcionalidades</CardTitle>
              <CardDescription>Habilitar o deshabilitar funcionalidades específicas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    name: "Sistema de Regalos",
                    description: "Permitir envío de regalos entre usuarios",
                    enabled: true,
                  },
                  { name: "Campañas QR", description: "Gestión de campañas con códigos QR", enabled: true },
                  { name: "Modo VIP", description: "Funcionalidades exclusivas para VIP", enabled: true },
                  { name: "Transferencias P2P", description: "Transferencias entre usuarios", enabled: false },
                  { name: "Recargas Online", description: "Recargas mediante pasarela de pago", enabled: false },
                  { name: "Reportes Avanzados", description: "Analíticas y reportes detallados", enabled: true },
                ].map((feature) => (
                  <div key={feature.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="font-medium">{feature.name}</Label>
                      <Switch defaultChecked={feature.enabled} />
                    </div>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="localization" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="mr-2 h-5 w-5" />
                  Configuración Regional
                </CardTitle>
                <CardDescription>Idioma y zona horaria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Idioma Principal</Label>
                  <Input id="language" defaultValue="Español" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Input id="timezone" defaultValue="América/Ciudad de México" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda Local</Label>
                  <Input id="currency" defaultValue="Peso Mexicano (MXN)" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modo Mantenimiento</Label>
                    <div className="text-sm text-muted-foreground">Deshabilitar acceso temporal</div>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de Actividad</Label>
                    <div className="text-sm text-muted-foreground">Registrar acciones del sistema</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <Button className="w-full">Guardar Configuración</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración de Contenido</CardTitle>
                <CardDescription>Personalización de textos y mensajes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Mensaje de Bienvenida</Label>
                  <Textarea
                    id="welcome-message"
                    defaultValue="¡Bienvenido a Club Paradise! Disfruta de una experiencia única."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms-url">URL de Términos y Condiciones</Label>
                  <Input id="terms-url" defaultValue="https://clubparadise.com/terms" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy-url">URL de Política de Privacidad</Label>
                  <Input id="privacy-url" defaultValue="https://clubparadise.com/privacy" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="support-email">Email de Soporte</Label>
                  <Input id="support-email" type="email" defaultValue="soporte@clubparadise.com" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Configuración de Seguridad
                </CardTitle>
                <CardDescription>Políticas de seguridad y autenticación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="session-timeout">Tiempo de Sesión (minutos)</Label>
                  <Input id="session-timeout" type="number" defaultValue="60" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-min-length">Longitud Mínima de Contraseña</Label>
                  <Input id="password-min-length" type="number" defaultValue="8" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir Mayúsculas</Label>
                    <div className="text-sm text-muted-foreground">En las contraseñas</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir Números</Label>
                    <div className="text-sm text-muted-foreground">En las contraseñas</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requerir Símbolos</Label>
                    <div className="text-sm text-muted-foreground">En las contraseñas</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Control de Acceso</CardTitle>
                <CardDescription>Configuración de accesos y permisos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="max-login-attempts">Máximo Intentos de Login</Label>
                  <Input id="max-login-attempts" type="number" defaultValue="5" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lockout-duration">Duración de Bloqueo (minutos)</Label>
                  <Input id="lockout-duration" type="number" defaultValue="15" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Autenticación de Dos Factores</Label>
                    <div className="text-sm text-muted-foreground">Para administradores</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Registro de Accesos</Label>
                    <div className="text-sm text-muted-foreground">Mantener log de accesos</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificar Accesos Sospechosos</Label>
                    <div className="text-sm text-muted-foreground">Alertar sobre actividad inusual</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backup" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" />
                  Configuración de Respaldos
                </CardTitle>
                <CardDescription>Configuración automática de respaldos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Respaldos Automáticos</Label>
                    <div className="text-sm text-muted-foreground">Crear respaldos automáticamente</div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Frecuencia de Respaldo</Label>
                  <Select defaultValue="daily">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Cada hora</SelectItem>
                      <SelectItem value="daily">Diario</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-time">Hora de Respaldo</Label>
                  <Input id="backup-time" type="time" defaultValue="03:00" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-retention">Retención (días)</Label>
                  <Input id="backup-retention" type="number" defaultValue="30" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compresión de Respaldos</Label>
                    <div className="text-sm text-muted-foreground">Comprimir archivos de respaldo</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Gestión de Respaldos
                </CardTitle>
                <CardDescription>Administrar respaldos existentes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Último Respaldo</Label>
                  <div className="text-sm text-muted-foreground">Hace 6 horas - 2.3 GB</div>
                </div>

                <div className="space-y-2">
                  <Label>Respaldos Disponibles</Label>
                  <div className="text-sm text-muted-foreground">15 respaldos (34.5 GB total)</div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-location">Ubicación de Respaldos</Label>
                  <Input id="backup-location" defaultValue="/backups/venue-app/" />
                </div>

                <div className="flex space-x-2">
                  <Button size="sm">
                    <Database className="mr-2 h-4 w-4" />
                    Crear Respaldo
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Modo Mantenimiento</CardTitle>
              <CardDescription>Configuración para el modo de mantenimiento del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Modo Mantenimiento Activo</Label>
                  <div className="text-sm text-muted-foreground">Deshabilitar acceso para usuarios</div>
                </div>
                <Switch />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-message">Mensaje de Mantenimiento</Label>
                <Textarea
                  id="maintenance-message"
                  defaultValue="El sistema está en mantenimiento. Volveremos pronto."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance-end">Fin Estimado del Mantenimiento</Label>
                <Input id="maintenance-end" type="datetime-local" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Permitir Acceso de Administradores</Label>
                  <div className="text-sm text-muted-foreground">Admins pueden acceder durante mantenimiento</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Limpieza del Sistema</CardTitle>
              <CardDescription>Herramientas de limpieza y optimización</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline">
                  <Database className="mr-2 h-4 w-4" />
                  Limpiar Logs Antiguos
                </Button>
                <Button variant="outline">
                  <FileText className="mr-2 h-4 w-4" />
                  Limpiar Archivos Temporales
                </Button>
                <Button variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Optimizar Base de Datos
                </Button>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Generar Reporte del Sistema
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="log-retention">Retención de Logs (días)</Label>
                <Input id="log-retention" type="number" defaultValue="90" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Limpieza Automática</Label>
                  <div className="text-sm text-muted-foreground">Limpiar archivos antiguos automáticamente</div>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
