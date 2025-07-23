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
import { User } from "@/types/types";

interface UserSearchFieldProps {
  onSelect: (user: any) => void;
  placeholder?: string;
  selectedUserId?: string | null;
  className?: string;
}

export function UserSearchField({
  onSelect,
  placeholder = "Buscar usuarios...",
  selectedUserId = null,
  className,
}: UserSearchFieldProps) {
  const { usersData, fetchUsers } = useAppContext();
  const [open, setOpen] = useState(false);

  const selectedUser = usersData.find((user) => user.id.toString() == selectedUserId);

  const [value, setValue] = useState(selectedUser?.id || "");
  const [name, setName] = useState(selectedUser?.name || "");



  const handleSelect = (currentValue: string) => {
    setValue(currentValue);
    setOpen(false);

    // Find the selected user object
    const selectedUserObj = usersData.find(
      (user) => user.id.toString() === currentValue
    );
    setName(selectedUserObj?.name || selectedUserObj?.email || "");

    if (selectedUserObj) {
      onSelect(selectedUserObj);
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
        >
          {name || placeholder}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar usuarios..." />
          <CommandList>
            <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
            <CommandGroup>
              {usersData.map((user: User) => (
                <CommandItem
                  key={user.id}
                  onSelect={() => handleSelect(user.id.toString())}
                  className="flex items-center justify-between"
                >
                  <div>
                    <span>{user.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  {value === user.id && (
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
