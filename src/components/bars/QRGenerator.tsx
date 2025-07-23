import React, { useState, useEffect, useCallback } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode, Download, Copy } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppContext } from "@/context/AppContext";
import { QRCodeData } from "@/types/types";
import {QRCodeSVG} from "qrcode.react";
// import { saveAs } from "file-saver";

interface QRGeneratorProps {
  handleClose: () => void;
}

const PURPOSE_OPTIONS = [
  { value: "orders", label: "Pedidos" },
  { value: "menu", label: "Menú" },
  { value: "promos", label: "Promociones" },
  { value: "events", label: "Eventos" },
];

export const QRGenerator = ({ handleClose }: QRGeneratorProps) => {
  const [formData, setFormData] = useState({
    name: "",
    barId: "",
    location: "",
    purpose: "orders",
  });
  const [generatedQRs, setGeneratedQRs] = useState<QRCodeData[]>([]);
  const [currentQR, setCurrentQR] = useState<QRCodeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const { barsData, fetchQRCodes } = useAppContext();
  const handleInputChange = useCallback(
    (field: keyof typeof formData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleGenerateQR = useCallback(async () => {
    if (!formData.name || !formData.barId || !formData.location) {
      toast({
        title: "Datos incompletos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const newQr = {
        name: formData.name,
        barId: formData.barId.split("-*-")[1],
        location: formData.location,
        purpose: formData.purpose,
      }
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newQr),
      });

      if (!response.ok) {
        throw new Error("Failed to create QR code");
      }

      setGeneratedQRs((prev) => [...prev, newQr]);
      setCurrentQR(newQr);
      
      toast({
        title: "QR generado exitosamente",
        description: `QR para ${formData.name} en ${formData.location} ha sido creado.`,
      });

      fetchQRCodes();
      setFormData({
        name: "",
        barId: "",
        location: "",
        purpose: "orders",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el código QR",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [formData, fetchQRCodes]);

  const handleDownload = () => {
    const svg = document.getElementById("qr-canvas");
    if (!svg) return;
  
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
  
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${currentQR?.name || 'code'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
  
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const handleCopyLink = useCallback(() => {
    if (!currentQR) return;

    const qrLink = `${window.location.origin}/qr/${currentQR.barId}`;
    navigator.clipboard.writeText(qrLink);
    toast({
      title: "Enlace copiado",
      description: "El enlace del QR ha sido copiado al portapapeles.",
    });
  }, [currentQR]);

  const getPurposeLabel = useCallback((purpose: string) => {
    const option = PURPOSE_OPTIONS.find((opt) => opt.value === purpose);
    return option ? option.label : purpose;
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generador de QR</CardTitle>
          <CardDescription>Crea códigos QR para tus barras</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-name">Nombre del QR</Label>
              <Input
                id="qr-name"
                placeholder="ej. QR Barra Central Entrada"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bar-select">Barra asociada</Label>
              <Select
                value={formData.barId}
                onValueChange={(value) => handleInputChange("barId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una barra" />
                </SelectTrigger>
                <SelectContent>
                  {barsData.map((bar) => (
                    <SelectItem key={bar?.id} value={ `${bar?.name}-*-${bar?.id}` }>
                      {bar?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-location">Ubicación</Label>
              <Input
                id="qr-location"
                placeholder="ej. Entrada, Mesa 5, VIP"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qr-purpose">Propósito</Label>
              <Select
                value={formData.purpose}
                onValueChange={(value) => handleInputChange("purpose", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el propósito" />
                </SelectTrigger>
                <SelectContent>
                  {PURPOSE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </form>
        </CardContent>
        <CardContent>
          <Button
            onClick={handleGenerateQR}
            className="w-full"
            disabled={isGenerating}
          >
            <QrCode className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando..." : "Generar QR"}
          </Button>
        </CardContent>
      </Card>

      {currentQR ? (
        <Card>
          <CardHeader>
            <CardTitle>Vista previa del QR</CardTitle>
            <CardDescription>ID: {currentQR.id}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="w-48 h-48 border border-gray-300 rounded-lg flex items-center justify-center mb-4 p-4">
              <QRCodeSVG  
                id="qr-canvas"
                value={`${currentQR.id}`}
                size={160}
                level="H"
                includeMargin={true}  
              />
            </div>
            <div className="w-full space-y-2 text-center">
              <div>
                <strong>Nombre:</strong> {currentQR.name}
              </div>
              <div>
                <strong>Barra:</strong>{" "}
                {barsData.find((b) => b.id === currentQR.barId)?.name}
              </div>
              <div>
                <strong>Ubicación:</strong> {currentQR.location}
              </div>
              <div>
                <strong>Propósito:</strong> {getPurposeLabel(currentQR.purpose)}
              </div>
            </div>
          </CardContent>
          <CardContent className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="flex-1"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copiar Enlace
            </Button>
            <Button onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Descargar QR
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>QRs Generados</CardTitle>
            <CardDescription>
              {generatedQRs.length > 0
                ? `Total: ${generatedQRs.length} códigos QR`
                : "No hay códigos QR generados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {generatedQRs.length > 0 ? (
                generatedQRs.map((qr) => (
                  <div
                    key={qr?.id}
                    className="p-3 border rounded-md flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => setCurrentQR(qr)}
                  >
                    <div>
                      <div className="font-medium">{qr?.name}</div>
                      <div className="text-sm text-gray-500">{qr?.id}</div>
                    </div>
                    <QrCode size={20} />
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay códigos QR generados aún
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};