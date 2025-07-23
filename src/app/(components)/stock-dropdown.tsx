'use client';

import { useState } from 'react';
import { Box, ClipboardList, DollarSign } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function DashboardDropdown() {
	const [open, setOpen] = useState(false);

	return (
		<DropdownMenu
			open={open}
			onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant='outline'
					className='w-full sm:w-auto'>
					Opciones del Dashboard
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='start'
				className='w-56'>
				<DropdownMenuItem onClick={() => console.log('Administrar stock')}>
					<Box className='mr-2 h-4 w-4' />
					<span>Administrar stock</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => console.log('Configurar recetas')}>
					<ClipboardList className='mr-2 h-4 w-4' />
					<span>Configurar recetas</span>
				</DropdownMenuItem>
				<DropdownMenuItem onClick={() => console.log('Gestión de precios')}>
					<DollarSign className='mr-2 h-4 w-4' />
					<span>Gestión de precios</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
