
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
import { Product, PersonType } from '@/types/types';
import { Checkbox } from '@/components/ui/checkbox';
import { personTypes } from '@/lib/utils';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface TokenPRConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  product: any;
}

const TokenPRConfigModal = ({
  isOpen,
  onClose,
  onSave,
  product
}: TokenPRConfigModalProps) => {
  const [selectedPersonTypes, setSelectedPersonTypes] = useState<PersonType[]>([]);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    // if (product && product.tokenPRConfig) {
    //   setSelectedPersonTypes(product.tokenPRConfig.allowedPersonTypes);
    // } else {
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
    //   isTokenPR: true,
    //   tokenPRConfig: {
    //     allowedPersonTypes: selectedPersonTypes
    //   }
    // };
    
    // onSave(updatedProduct);
    toast.success("Configuración de Token PR guardada");
    onClose();
  };
  
  const handleCancel = () => {
    // if (!product.courtesyConfig || product.tokenPRConfig?.allowedPersonTypes.length === 0) {
    //   // If the product doesn't have a valid config, turn off token PR
    //   const updatedProduct: Product = {
    //     ...product,
    //     isTokenPR: false,
    //     tokenPRConfig: undefined
    //   };
    //   onSave(updatedProduct);
    // }
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className={`${isMobile ? 'w-[95%] max-w-[95%] p-4' : 'sm:max-w-[500px]'} mx-auto`}>
        <DialogHeader className={isMobile ? 'space-y-1' : ''}>
          <DialogTitle>Configurar Token PR</DialogTitle>
          <DialogDescription>
            {/* Define qué perfiles pueden utilizar "{product.name}" con Token PR. */}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Perfiles autorizados para Token PR</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {personTypes.map((personType) => (
                <div key={personType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tokenPR-${personType}`}
                    checked={selectedPersonTypes.includes(personType as PersonType)}
                    onCheckedChange={() => handleTogglePersonType(personType as PersonType)}
                  />
                  <Label htmlFor={`tokenPR-${personType}`} className="text-sm">
                    {personType}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
          <Button variant="outline" onClick={handleCancel} className={isMobile ? 'w-full' : ''}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className={`bg-black hover:bg-black/90 text-white ${isMobile ? 'w-full' : ''}`}>
            Guardar Configuración
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenPRConfigModal;
