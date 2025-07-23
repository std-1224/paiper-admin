import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";
import { Product } from "@/types/types";
import { LOW_STOCK_THRESHOLD } from "@/lib/utils";

interface ProductSearchFieldProps {
  onSelect: (product: any) => void;
  placeholder?: string;
  selectedProductId?: string | null;
  className?: string;
  disabled?: boolean;
  isLowStockDisable?: boolean;
}

export function ProductSearchField({
  onSelect,
  placeholder = "Buscar productos...",
  selectedProductId = null,
  className,
  disabled = false,
  isLowStockDisable = false,
}: ProductSearchFieldProps) {
  const { productsData } = useAppContext();
  const [open, setOpen] = useState(false);

  const selectedProduct = productsData.find(
    (product) => product.id == selectedProductId
  );

  const [value, setValue] = useState(selectedProduct?.id || "");
  const [name, setName] = useState(selectedProduct?.name || "");

  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);

    // Find the selected product object
    const selectedProductObj = productsData.find(
      (product) => product.id === currentValue
    );
    setName(selectedProductObj?.name || "");

    if (selectedProductObj) {
      onSelect(selectedProductObj);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {name || placeholder}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar productos..." />
          <CommandList>
            <CommandEmpty>No se encontraron productos.</CommandEmpty>
            <CommandGroup>
              {productsData.map((product: Product) => (
                <CommandItem
                  key={product.id}
                  onSelect={() => handleSelect(product.id)}
                  className="flex items-center justify-between"
                  disabled={isLowStockDisable && product.stock < LOW_STOCK_THRESHOLD}
                >
                  <div>
                    <span>{product.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {product.category}
                    </span>
                  </div>
                  {value === product.id && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
