"use client"

import { useState } from "react"
import { Box, CheckCircle, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import StockManagement from "../(components)/stock-management"
import PriceManagement from "../(components)/price-managment"
import { CustomDrinks } from "@/components/products/CustomDrinks"

export default function Home() {
  const [selectedOption, setSelectedOption] = useState("stock")
  
  const options = [
    { id: "stock", label: "Administrar stock", icon: Box },
    // { id: "custom", label: "Tragos Personalizados", icon: CheckCircle },
    { id: "prices", label: "Gestión de precios", icon: DollarSign },
  ]

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex border rounded-md overflow-hidden">
        {options.map((option) => {
          const Icon = option.icon
          const isSelected = selectedOption === option.id

          return (
            <button
              key={option.id}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 flex-1",
                "border-r last:border-r-0",
                isSelected ? "bg-slate-100 font-medium" : "bg-white hover:bg-slate-50",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        {selectedOption === "stock" && <StockManagement />}
        {/* {selectedOption === "custom" && <CustomDrinks selectedBar="all" showCheckboxes={false} />} */}
        {selectedOption === "prices" && <PriceManagement />}
      </div>
    </div>
  )
}

