
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  DollarSign, 
  Banknote, 
  Tag,
  User
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for income by type
const incomeByTypeData = [
  { id: 1, type: "App Saldo", amount: "$64,350", orders: 385, avgTicket: "$167", percentage: "37%" },
  { id: 2, type: "NFC", amount: "$52,800", orders: 310, avgTicket: "$170", percentage: "31%" },
  { id: 3, type: "Efectivo", amount: "$34,650", orders: 195, avgTicket: "$178", percentage: "20%" },
  { id: 4, type: "EPR Tokens", amount: "$15,400", orders: 175, avgTicket: "$88", percentage: "9%" },
  { id: 5, type: "Cortesías", amount: "$5,000", orders: 45, avgTicket: "$111", percentage: "3%" },
];

// Mock data for income transactions
const incomeTransactionsData = [
  { id: 1, type: "App Saldo", product: "Gin Tonic", amount: "$800", bar: "Bar Central", time: "22:45", user: "Cliente #152" },
  { id: 2, type: "NFC", product: "Vodka Tonic", amount: "$750", bar: "Bar Norte", time: "23:12", user: "Pulsera #086" },
  { id: 3, type: "Efectivo", product: "Cerveza x2", amount: "$1000", bar: "El Alamo", time: "23:30", user: "Efectivo" },
  { id: 4, type: "EPR Token", product: "Vodka Red Bull", amount: "$850", bar: "Bar Central", time: "00:15", user: "PR Juan" },
  { id: 5, type: "Cortesía", product: "Champagne", amount: "$12500", bar: "Bar VIP", time: "01:20", user: "Admin VIP" },
  { id: 6, type: "App Saldo", product: "Fernet con Coca", amount: "$700", bar: "Bar Sur", time: "01:35", user: "Cliente #089" },
];

// Filter options
const timeOptions = ["Todo el día", "19:00 - 22:00", "22:00 - 01:00", "01:00 - 05:00"];
const productOptions = ["Todos los productos", "Bebidas", "Bebidas Premium", "Comidas", "Combos"];

export const IncomePanel = ({ selectedBar }: { selectedBar: string }) => {
  const [timeFilter, setTimeFilter] = useState("Todo el día");
  const [productFilter, setProductFilter] = useState("Todos los productos");
  
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={timeFilter} onValueChange={setTimeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por horario" />
          </SelectTrigger>
          <SelectContent>
            {timeOptions.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por producto" />
          </SelectTrigger>
          <SelectContent>
            {productOptions.map(option => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo Pagado</CardTitle>
            <CardDescription>App + NFC + Efectivo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$151,800</div>
            <p className="text-sm text-muted-foreground">890 órdenes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Consumo Bonificado</CardTitle>
            <CardDescription>EPR + Cortesías</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$20,400</div>
            <p className="text-sm text-muted-foreground">220 órdenes</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Ingresos</CardTitle>
            <CardDescription>Todos los tipos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$172,200</div>
            <p className="text-sm text-muted-foreground">1,110 órdenes</p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Resumen de Ingresos</TabsTrigger>
          <TabsTrigger value="transactions">Transacciones Detalladas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo de Ingreso</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Órdenes</TableHead>
                <TableHead>Ticket Prom.</TableHead>
                <TableHead>% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeByTypeData.map((income) => (
                <TableRow key={income.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {income.type === "App Saldo" && <CreditCard className="h-4 w-4" />}
                      {income.type === "NFC" && <CreditCard className="h-4 w-4" />}
                      {income.type === "Efectivo" && <Banknote className="h-4 w-4" />}
                      {income.type === "EPR Tokens" && <Tag className="h-4 w-4" />}
                      {income.type === "Cortesías" && <User className="h-4 w-4" />}
                      {income.type}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{income.amount}</TableCell>
                  <TableCell>{income.orders}</TableCell>
                  <TableCell>{income.avgTicket}</TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-vares-500 h-2.5 rounded-full" 
                        style={{ width: income.percentage }}
                      ></div>
                    </div>
                    <span className="text-xs">{income.percentage}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Importe</TableHead>
                <TableHead>Barra</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incomeTransactionsData
                .filter(item => selectedBar === "all" || item.bar.toLowerCase().includes(selectedBar.replace(/([A-Z])/g, ' $1').trim().toLowerCase()))
                .map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {transaction.type === "App Saldo" && <CreditCard className="h-4 w-4" />}
                        {transaction.type === "NFC" && <CreditCard className="h-4 w-4" />}
                        {transaction.type === "Efectivo" && <Banknote className="h-4 w-4" />}
                        {transaction.type === "EPR Token" && <Tag className="h-4 w-4" />}
                        {transaction.type === "Cortesía" && <User className="h-4 w-4" />}
                        {transaction.type}
                      </div>
                    </TableCell>
                    <TableCell>{transaction.product}</TableCell>
                    <TableCell className="font-medium">{transaction.amount}</TableCell>
                    <TableCell>{transaction.bar}</TableCell>
                    <TableCell>{transaction.time}</TableCell>
                    <TableCell>{transaction.user}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
};
