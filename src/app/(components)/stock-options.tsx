'use client';

import { useState } from 'react';
import { Box, ClipboardList, DollarSign } from 'lucide-react';

import { cn } from '@/lib/utils';

export default function DashboardOptions() {
	const [selectedOption, setSelectedOption] = useState('stock');

	const options = [
		{ id: 'stock', label: 'Administrar stock', icon: Box },
		{ id: 'recipes', label: 'Configurar recetas', icon: ClipboardList },
		{ id: 'prices', label: 'Gestión de precios', icon: DollarSign },
	];

	return (
		<div className='flex flex-wrap gap-2'>
			{options.map((option) => {
				const Icon = option.icon;
				const isSelected = selectedOption === option.id;

				return (
					<button
						key={option.id}
						onClick={() => setSelectedOption(option.id)}
						className={cn(
							'flex items-center gap-2 px-4 py-2 rounded-md border transition-all',
							'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
							isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input'
						)}>
						<Icon className='h-4 w-4' />
						<span>{option.label}</span>
					</button>
				);
			})}
		</div>
	);
}
