import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppContext } from "@/context/AppContext";

interface Bar {
  id: string;
  name: string;
}

// Sample bars data
const bars: Bar[] = [
  { id: "barCentral", name: "Bar Central" },
  { id: "barNorte", name: "Bar Norte" },
  { id: "barSur", name: "Bar Sur" },
  { id: "elAlamo", name: "El Alamo" },
];

interface MultiSelectBarsFieldProps {
  onSelectionChange: (selectedBars: string[]) => void;
  placeholder?: string;
  className?: string;
  initialSelection?: string[];
  singleSelection?: boolean;
  disabled?: boolean;
  includeGeneralStock?: boolean;
  excludeBarIds?: string[];
}

export function MultiSelectBarsField({
  onSelectionChange,
  placeholder = "Seleccionar barras",
  className,
  initialSelection = [],
  singleSelection = false,
  disabled = false,
  includeGeneralStock = false,
  excludeBarIds = [],
}: MultiSelectBarsFieldProps) {
  const [open, setOpen] = useState(false);
  const [selectedValues, setSelectedValues] =
    useState<string[]>(initialSelection);
  const { barsData } = useAppContext();
  useEffect(() => {
    if (initialSelection.length > 0) setSelectedValues(initialSelection);
  }, [initialSelection]);

  // Create combined list of bars and general stock option, excluding specified bars
  const allOptions = [
    ...barsData.filter(bar => !excludeBarIds.includes(bar.id || "")),
    ...(includeGeneralStock ? [{ id: "general-stock", name: "Stock General" }] : [])
  ];

  const selectedBars = allOptions.filter((option) =>
    selectedValues.includes(option.id || "")
  );

  const handleSelect = (barId: string) => {
    if (singleSelection) {
      setSelectedValues([barId]);
      onSelectionChange([barId]);
      setOpen(false); // Close dropdown after single selection
    } else {
      setSelectedValues((current) => {
        let newSelection;

        if (current.includes(barId)) {
          // Remove the selected item
          newSelection = current.filter((id) => id !== barId);
        } else {
          // Add the selected item
          newSelection = [...current, barId];

          // If selecting general stock, remove all other bars (they're mutually exclusive)
          if (barId === "general-stock") {
            newSelection = ["general-stock"];
          }
          // If selecting a specific bar while general stock is selected, remove general stock
          else if (current.includes("general-stock")) {
            newSelection = newSelection.filter(id => id !== "general-stock");
          }
        }

        onSelectionChange(newSelection);
        return newSelection;
      });
      // Don't close dropdown for multi-select to allow multiple selections
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
          {selectedBars.length > 0 ? (
            <div className="flex flex-wrap gap-1 mr-2">
              {selectedBars.length <= 2 ? (
                selectedBars.map((bar) => (
                  <Badge key={bar.id} variant="secondary">
                    {bar.name}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge variant="secondary">{selectedBars[0].name}</Badge>
                  <Badge variant="secondary">
                    +{selectedBars.length - 1} más
                  </Badge>
                </>
              )}
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar barras..." />
          <CommandList>
            <CommandEmpty>No se encontraron barras.</CommandEmpty>
            <CommandGroup>
              {allOptions?.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => handleSelect(option.id || "")}
                  disabled={disabled}
                >
                  <div className="flex items-center w-full">
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        selectedValues.includes(option.id || "")
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-primary opacity-50"
                      )}
                    >
                      {selectedValues.includes(option.id || "") && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    <span className={option.id === "general-stock" ? "font-medium text-blue-600" : ""}>
                      {option.name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
