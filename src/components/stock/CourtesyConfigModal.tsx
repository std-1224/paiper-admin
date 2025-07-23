
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Product, PersonType } from '@/types/types';
import { Checkbox } from '@/components/ui/checkbox';
import { personTypes } from '@/lib/utils';
import { toast } from 'sonner';

interface CourtesyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: any;
}

const CourtesyConfigModal = ({
  isOpen,
  onClose,
  onSave,
  product
}: CourtesyConfigModalProps) => {
  const [limitPerNight, setLimitPerNight] = useState<number>(5);
  const [selectedPersonTypes, setSelectedPersonTypes] = useState<PersonType[]>([]);
  
  useEffect(() => {
    // if (product && product.courtesyConfig) {
    //   setLimitPerNight(product.courtesyConfig.limitPerNight);
    //   setSelectedPersonTypes(product.courtesyConfig.allowedPersonTypes);
    // } else {
    //   setLimitPerNight(5);
    //   setSelectedPersonTypes([]);
    // }
  }, [product, isOpen]);
  
  const handleTogglePersonType = (personType: PersonType) => {
    setSelectedPersonTypes(prev => {
      if (prev.includes(personType)) {
        return prev.filter(p => p !== personType);
      } else {
        return [...prev, personType];
      }
    });
  };
  
  const handleSave = () => {
    if (selectedPersonTypes.length === 0) {
      toast.error("Debes seleccionar al menos un tipo de persona");
      return;
    }
    
    // const updatedProduct: Product = {
    //   ...product,
    //   isCourtesy: true,
    //   courtesyConfig: {
    //     limitPerNight,
    //     allowedPersonTypes: selectedPersonTypes
    //   }
    // };
    
    // onSave(updatedProduct);
    toast.success("Configuración de cortesía guardada");
    onClose();
  };
  
  const handleCancel = () => {
    // if (!product.courtesyConfig || product.courtesyConfig.allowedPersonTypes.length === 0) {
    //   // If the product doesn't have a valid config, turn off courtesy
    //   const updatedProduct: Product = {
    //     ...product,
    //     isCourtesy: false,
    //     courtesyConfig: undefined
    //   };
    //   onSave(updatedProduct);
    // }
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configurar Cortesía</DialogTitle>
          <DialogDescription>
            {/* Define los límites y permisos para el producto "{product.name}" como cortesía. */}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="limitPerNight">Límite por noche</Label>
            <Input
              id="limitPerNight"
              type="number"
              min={1}
              value={limitPerNight}
              onChange={e => setLimitPerNight(parseInt(e.target.value))}
            />
            <p className="text-sm text-muted-foreground">
              Número máximo de unidades que se pueden ofrecer como cortesía por noche.
            </p>
          </div>
          
          <div className="space-y-3">
            <Label>Personas autorizadas para cortesía</Label>
            <div className="grid grid-cols-2 gap-2">
              {personTypes.map((personType) => (
                <div key={personType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`personType-${personType}`}
                    checked={selectedPersonTypes.includes(personType as PersonType)}
                    onCheckedChange={() => handleTogglePersonType(personType as PersonType)}
                  />
                  <Label htmlFor={`personType-${personType}`} className="text-sm">
                    {personType}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-[#1A1F2C] hover:bg-[#1A1F2C]/90">
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourtesyConfigModal;
