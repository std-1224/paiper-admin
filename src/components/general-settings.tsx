"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Configuración General
        </h2>
        <p className="text-muted-foreground">
          Configuraciones básicas del sistema
        </p>
      </div>
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
            <Textarea
              id="venue-description"
              defaultValue="El mejor club nocturno de la ciudad"
              rows={3}
            />
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
          <CardTitle>Configuración de Funcionalidades</CardTitle>
          <CardDescription>
            Habilitar o deshabilitar funcionalidades específicas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                name: "Sistema de Regalos",
                description: "Permitir envío de regalos entre usuarios",
                enabled: true,
              },
              {
                name: "Campañas QR",
                description: "Gestión de campañas con códigos QR",
                enabled: true,
              },
              {
                name: "Modo VIP",
                description: "Funcionalidades exclusivas para VIP",
                enabled: true,
              },
              {
                name: "Transferencias P2P",
                description: "Transferencias entre usuarios",
                enabled: false,
              },
              {
                name: "Recargas Online",
                description: "Recargas mediante pasarela de pago",
                enabled: false,
              },
              {
                name: "Reportes Avanzados",
                description: "Analíticas y reportes detallados",
                enabled: true,
              },
            ].map((feature) => (
              <div key={feature.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">{feature.name}</Label>
                  <Switch defaultChecked={feature.enabled} />
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
