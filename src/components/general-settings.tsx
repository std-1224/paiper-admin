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
import { Bell, Shield, Palette } from "lucide-react";
import { VenueSettings } from "@/components/VenueSettings";

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

      {/* Venue Settings */}
      <VenueSettings />

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
