import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { BarData } from "@/types/types";
import { useAppContext } from "@/context/AppContext";
interface BarCreatorProps {
  handleClose: () => void;
}

export const BarCreator = ({ handleClose }: BarCreatorProps) => {
  const [barName, setBarName] = useState("");
  const [barLocation, setBarLocation] = useState("");
  const [barDescription, setBarDescription] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [barType, setBarType] = useState("main");
  const [capacity, setCapacity] = useState("");
  const { fetchBars } = useAppContext();

  const handleCreateBar = async () => {
    if (!barName || !barLocation) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa al menos el nombre y la ubicación.",
        variant: "destructive",
      });
      return;
    }

    const newBar: BarData = {
      name: barName,
      location: barLocation,
      description: barDescription,
      isVip,
      type: barType,
      capacity: parseInt(capacity) || 0,
    };

    const response = await fetch("/api/bars", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newBar),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    fetchBars();
    toast({
      title: "Barra creada exitosamente",
      description: `La barra ${barName} ha sido creada.`,
    });

    // Reset form
    setBarName("");
    setBarLocation("");
    setBarDescription("");
    setIsVip(false);
    setBarType("main");
    setCapacity("");
    handleClose();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nueva Barra</CardTitle>
        <CardDescription>
          Define los detalles de una nueva barra
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bar-name">Nombre de la Barra</Label>
            <Input
              id="bar-name"
              placeholder="ej. Barra Central"
              value={barName}
              onChange={(e) => setBarName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bar-location">Ubicación</Label>
            <Input
              id="bar-location"
              placeholder="ej. Entrada Principal, Zona VIP"
              value={barLocation}
              onChange={(e) => setBarLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bar-description">Descripción</Label>
            <Textarea
              id="bar-description"
              placeholder="Descripción de la barra y sus características"
              value={barDescription}
              onChange={(e) => setBarDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bar-type">Tipo de Barra</Label>
            <Select value={barType} onValueChange={setBarType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Principal</SelectItem>
                <SelectItem value="secondary">Secundaria</SelectItem>
                <SelectItem value="mobile">Móvil</SelectItem>
                <SelectItem value="specialized">Especializada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bar-capacity">Capacidad</Label>
            <Input
              id="bar-capacity"
              type="number"
              placeholder="Cantidad de personas"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="is-vip" checked={isVip} onCheckedChange={setIsVip} />
            <Label htmlFor="is-vip">Barra VIP</Label>
          </div>
        </form>
      </CardContent>
      <CardFooter>
        <Button onClick={handleCreateBar} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Crear Barra
        </Button>
      </CardFooter>
    </Card>
  );
};
