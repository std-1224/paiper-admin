"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useVenue } from '@/context/VenueContext';
import { toast } from 'sonner';
import { Building2, Clock, Users, Save, Loader2 } from 'lucide-react';

export function VenueSettings() {
  const { venue, isLoading, error, updateVenue } = useVenue();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    open_time: '09:00',
    closing_time: '23:00',
    max_capacity: 100
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Update form data when venue data is loaded
  useEffect(() => {
    if (venue) {
      setFormData({
        name: venue.name || '',
        description: venue.description || '',
        open_time: venue.open_time || '09:00',
        closing_time: venue.closing_time || '23:00',
        max_capacity: venue.max_capacity || 100
      });
      setIsCreating(false);
    } else if (!isLoading) {
      // No venue exists, we're in create mode
      setIsCreating(true);
    }
  }, [venue, isLoading]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Validate required fields
      if (!formData.name.trim()) {
        toast.error('El nombre del venue es requerido');
        return;
      }

      if (formData.max_capacity < 1) {
        toast.error('La capacidad máxima debe ser mayor a 0');
        return;
      }

      // Debug: Log the form data to see what we're sending
      console.log('Form data being sent:', formData);

      await updateVenue(formData);
      toast.success(isCreating
        ? 'Venue creado exitosamente'
        : 'Información del venue actualizada exitosamente'
      );
    } catch (err) {
      console.error('Error saving venue:', err);
      toast.error(isCreating
        ? 'Error al crear el venue'
        : 'Error al actualizar la información del venue'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información del Venue
          </CardTitle>
          <CardDescription>
            Configura la información básica de tu establecimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {isCreating ? 'Crear Venue' : 'Información del Venue'}
        </CardTitle>
        <CardDescription>
          {isCreating
            ? 'Configura la información básica de tu nuevo establecimiento'
            : 'Actualiza la información básica de tu establecimiento'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Venue Name */}
        <div className="space-y-2">
          <Label htmlFor="venue-name">Nombre del Venue *</Label>
          <Input
            id="venue-name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="Nombre de tu establecimiento"
            className="text-lg font-medium"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="venue-description">Descripción</Label>
          <Textarea
            id="venue-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Descripción breve de tu establecimiento"
            rows={3}
          />
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="open-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora de Apertura
            </Label>
            <Input
              id="open-time"
              type="time"
              value={formData.open_time}
              onChange={(e) => handleInputChange('open_time', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="closing-time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora de Cierre
            </Label>
            <Input
              id="closing-time"
              type="time"
              value={formData.closing_time}
              onChange={(e) => handleInputChange('closing_time', e.target.value)}
            />
          </div>
        </div>

        {/* Max Capacity */}
        <div className="space-y-2">
          <Label htmlFor="max-capacity" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Capacidad Máxima
          </Label>
          <Input
            id="max-capacity"
            type="number"
            min="1"
            value={formData.max_capacity}
            onChange={(e) => handleInputChange('max_capacity', parseInt(e.target.value) || 0)}
            placeholder="Número máximo de personas"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving
              ? 'Guardando...'
              : isCreating
                ? 'Crear Venue'
                : 'Guardar Cambios'
            }
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
