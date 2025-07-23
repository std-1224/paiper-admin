import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { ArrowDownUp, PackagePlus, PackageX } from "lucide-react";
import { UserSearchField } from "@/components/users/UserSearchField";
import { MultiSelectBarsField } from "@/components/bars/MultiSelectBarsField";
import { useAppContext } from "@/context/AppContext";
import { Product } from "@/types/types";
import { User } from "@/types/types";

interface StockAdd {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: User | null;
  initialRole?: string;
  initialStatus?: string;
  initialAssignedBar?: number;
}

export interface AssignedUser {
  user: User | null;
  userId?: string;
  role?: string;
  status?: string;
  assignedBar?: number;
}

export function UserAssign({
  open,
  onOpenChange,
  initialUser = null,
  initialRole = "",
  initialStatus = "",
  initialAssignedBar = 0,
}: StockAdd) {
  const [selectedBars, setSelectedBars] = useState<string[]>([]);

  const assignedUser = useForm<AssignedUser>({
    defaultValues: {
      user: initialUser,
      userId: initialUser?.id?.toString(),
      role: initialRole,
      status: initialStatus,
      assignedBar: initialAssignedBar,
    },
  });

  const { fetchUsers, fetchBars, fetchStaff } = useAppContext();

  useEffect(() => {
    fetchUsers();
    fetchBars();
  }, []);

  useEffect(() => {
    assignedUser.setValue("assignedBar", initialAssignedBar);
    setSelectedBars([initialAssignedBar.toString()]);
  }, [initialAssignedBar]);

  const handleUserSelect = (user: User) => {
    assignedUser.setValue("user", user);
    assignedUser.setValue("userId", user.id.toString());
  };

  const handleBarsSelection = (bars: string[]) => {
    assignedUser.setValue("assignedBar", parseInt(bars[0]));
  };

  const handleSubmitReingress = async (data: AssignedUser) => {
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create bar");
    }
    toast.success(
      `${data.user?.name} asignado a la barra ${data.assignedBar}`
    );
    if (data.assignedBar !== undefined) {
      fetchStaff(data.assignedBar);
    }
    onOpenChange(false);
    assignedUser.reset();
    setSelectedBars([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Asignar Usuario</DialogTitle>
          <DialogDescription>
            Asignar usuario a una barra específica
          </DialogDescription>
        </DialogHeader>

        <Form {...assignedUser}>
          <form
            onSubmit={assignedUser.handleSubmit(handleSubmitReingress)}
            className="space-y-4 py-2 mh-[80vh] overflow-auto"
          >
            <FormField
              control={assignedUser.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuario</FormLabel>
                  <FormControl>
                    <UserSearchField
                      onSelect={handleUserSelect}
                      selectedUserId={
                        field.value?.id !== undefined
                          ? field.value.id.toString()
                          : null
                      }
                      placeholder="Buscar usuario..."
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Role</FormLabel>
              <FormControl>
                <Select
                  value={assignedUser.watch("role")}
                  onValueChange={(value) =>
                    assignedUser.setValue("role", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Encargado </SelectItem>
                    <SelectItem value="barman">Barman</SelectItem>
                    <SelectItem value="assistant">Asistente</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>Barras de destino</FormLabel>
              <MultiSelectBarsField
                onSelectionChange={handleBarsSelection}
                initialSelection={selectedBars}
                singleSelection={true}
                placeholder="Seleccionar barras de destino"
                disabled={true}
              />
              <FormDescription>
                Selecciona las barras donde se enviará este producto
              </FormDescription>
            </FormItem>
            <DialogFooter>
              <Button type="submit" >Asignar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
