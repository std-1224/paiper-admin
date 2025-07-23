import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(text: string) {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

export function shortenId(uuid: string, visibleChars: number = 6): string {
	if (!uuid || uuid.length <= visibleChars * 2) return uuid;
	return `${uuid.substring(0, visibleChars)}...${uuid.substring(uuid.length - visibleChars)}`;
  }

  
export const categoryList = [
	{ value: 'bebida', label: 'Bebida' },
	{ value: 'comida', label: 'Comida' },
	{ value: 'insumo', label: 'Insumo' },
];

export const personTypes = [
	'Staff', 
	'Invitados VIP', 
	'Clientes frecuentes', 
	'Promotores', 
	'PR', 
	'Embajadores de marca', 
	'Staff interno autorizado'
  ];


// CONST

export const LOW_STOCK_THRESHOLD = 5;