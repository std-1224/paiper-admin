"use client";
import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  QrCode,
  ArrowRightLeft,
  DollarSign,
  BoxesIcon,
  Plus,
  Eye,
} from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { useIsMobile } from "@/hooks/use-mobile";
import { BarVisualization } from "@/components/bars/BarVisualization";
import { QRGenerator } from "@/components/bars/QRGenerator";
import { BarCreator } from "@/components/bars/BarCreator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Mock data for QR performance
const qrPerformanceData = [
  {
    id: 1,
    qrCode: "QR-BAR-CENTRAL-01",
    location: "Barra Central (Entrada)",
    scans: 523,
    orders: 487,
    revenue: "$43,850",
  },
  {
    id: 2,
    qrCode: "QR-BAR-CENTRAL-02",
    location: "Barra Central (VIP)",
    scans: 289,
    orders: 254,
    revenue: "$35,200",
  },
  {
    id: 3,
    qrCode: "QR-BAR-NORTE-01",
    location: "Barra Norte (General)",
    scans: 478,
    orders: 412,
    revenue: "$38,750",
  },
  {
    id: 4,
    qrCode: "QR-EL-ALAMO-01",
    location: "El Alamo (Entrada)",
    scans: 356,
    orders: 320,
    revenue: "$29,600",
  },
  {
    id: 5,
    qrCode: "QR-BAR-SUR-01",
    location: "Barra Sur (General)",
    scans: 298,
    orders: 265,
    revenue: "$24,800",
  },
];

// Mock data for bar staff
const barStaffData = [
  {
    id: 1,
    name: "Juan García",
    role: "Bartender Principal",
    bar: "Bar Central",
    shift: "19:00 - 02:00",
    performance: "97%",
  },
  {
    id: 2,
    name: "María López",
    role: "Bartender",
    bar: "Bar Norte",
    shift: "19:00 - 02:00",
    performance: "94%",
  },
  {
    id: 3,
    name: "Carlos Ruiz",
    role: "Bartender Asistente",
    bar: "Bar Central",
    shift: "22:00 - 05:00",
    performance: "91%",
  },
  {
    id: 4,
    name: "Ana Martínez",
    role: "Bartender",
    bar: "El Alamo",
    shift: "19:00 - 02:00",
    performance: "95%",
  },
  {
    id: 5,
    name: "Roberto Sánchez",
    role: "Bartender Principal",
    bar: "Bar Sur",
    shift: "22:00 - 05:00",
    performance: "93%",
  },
];
const Bars = () => {
  const isMobile = useIsMobile();
  const colSpan = isMobile ? "col-span-12" : "col-span-3";
  const [selectedBar, setSelectedBar] = useState("all");
  const [activeTab, setActiveTab] = useState("management");
  const [qrGeneratorOpen, setQrGeneratorOpen] = useState(false);
  const [barCreatorOpen, setBarCreatorOpen] = useState(false);
  return (
    <>
      <PageHeader
        title="Gestión de Barras & QRs"
        description="Control de barras, QRs, ingresos y transferencias"
      >
        <Button
          onClick={() => window.location.href = '/bars/qr-view'}
          variant="outline"
          className="mr-2"
        >
          <Eye className="mr-2 h-4 w-4" />
          Ver QRs
        </Button>
        <Button
          onClick={() => setQrGeneratorOpen(true)}
          className="mr-2 bg-stone-900 hover:bg-stone-800"
        >
          <QrCode className="mr-2 h-4 w-4" />
          Generar Nuevo QR
        </Button>
        <Button
          onClick={() => setBarCreatorOpen(true)}
          className="bg-stone-900 hover:bg-stone-800"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Barra
        </Button>
      </PageHeader>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <StatsCard
          title="Total Ingresos"
          value="$172,200"
          description="Todas las barras"
          icon={<DollarSign className="h-4 w-4" />}
          className={colSpan}
        />
        <StatsCard
          title="Escaneos QR"
          value="1,944"
          description="Conversión: 89%"
          icon={<QrCode className="h-4 w-4" />}
          className={colSpan}
        />
        <StatsCard
          title="Transferencias"
          value="53"
          description="Entre barras"
          icon={<ArrowRightLeft className="h-4 w-4" />}
          className={colSpan}
        />
        <StatsCard
          title="Reingresos"
          value="28"
          description="Al stock disponible"
          icon={<BoxesIcon className="h-4 w-4" />}
          className={colSpan}
        />
      </div>

      {/* Visualización de barras */}
      <BarVisualization className="mb-6" />

      <Card></Card>

      {/* Modals */}
      <Dialog open={qrGeneratorOpen} onOpenChange={setQrGeneratorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Generador de Código QR</DialogTitle>
          </DialogHeader>
          <QRGenerator handleClose={() => setQrGeneratorOpen(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={barCreatorOpen} onOpenChange={setBarCreatorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Nueva Barra</DialogTitle>
          </DialogHeader>
          <BarCreator handleClose={() => setBarCreatorOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};
export default Bars;
