'use client';

import React, { useState } from 'react';
import { ClockIcon, PencilIcon, CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderItemProps {
	order: {
		id: string;
		customer: {
			name: string;
			code: string;
			avatar: string;
		};
		table: string;
		status: string;
		items: number;
		time: string;
		timeExtra?: string;
		paymentMethod: string;
	};
}

export function OrderItemCmp({ order }: OrderItemProps) {
	// const [isEditOpen, setIsEditOpen] = useState(false);
	const [editedOrder, setEditedOrder] = useState({ ...order });
	const [editedItems, setEditedItems] = useState([
		{ name: 'Item 1', quantity: 1, price: 10.0 },
		{ name: 'Item 2', quantity: 2, price: 8.5 },
	]);

	const handleAddItem = () => {
		setEditedItems([...editedItems, { name: '', quantity: 1, price: 0 }]);
	};

	const handleRemoveItem = (index: number) => {
		const newItems = [...editedItems];
		newItems.splice(index, 1);
		setEditedItems(newItems);
	};

	const handleItemChange = (index: number, field: keyof (typeof editedItems)[0], value: string | number) => {
		const newItems = [...editedItems];
		newItems[index] = { ...newItems[index], [field]: value };
		setEditedItems(newItems);
	};

	const calculateTotal = () => {
		return editedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
	};

	// const handleSaveChanges = () => {
	// 	// In a real app, this would save changes to the backend
	// 	setIsEditOpen(false);
	// };

	const getStatusBadge = () => {
		switch (order.status) {
			case 'delayed':
				return <div className='px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'>Demorado</div>;

			case 'preparing':
				return <div className='px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'>En preparación</div>;

			case 'ready':
				return <div className='px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'>Listo</div>;
			case 'delivered':
				return <div className='px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-blue-800 dark:text-blue-100'>Entregado</div>;

			default:
				return <div className='px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'>Nuevo</div>;
		}
	};

	const getStatusIcon = () => {
		switch (order.status) {
			case 'delayed':
				return <ClockIcon className='h-5 w-5 text-red-500' />;
			case 'preparing':
				return <ClockIcon className='h-5 w-5 text-orange-500' />;
			case 'ready':
				return <CheckIcon className='h-5 w-5 text-green-500' />;
			default:
				return <ClockIcon className='h-5 w-5 text-gray-500' />;
		}
	};

	const getBgColor = () => {
		switch (order.status) {
			case 'delayed':
				return 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-800/20';
			case 'preparing':
				return 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800/20';
			case 'ready':
				return 'bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800/20';
			default:
				return 'bg-gray-50 border-gray-200 dark:bg-gray-800/10 dark:border-gray-700/20';
		}
	};

	return (
		<>
			<div className={`p-4 rounded-lg border ${getBgColor()}`}>
				<div className='flex justify-between items-center'>
					<div className='flex items-center space-x-5'>
						{getStatusIcon()}
						<div>
							<h3 className='font-medium dark:text-white'>Para {order.customer.name}</h3>
							<h3 className='font-light text-xs dark:text-white'>
								Table {order.table} - Order {order.id}
							</h3>
							<p className='text-sm text-muted-foreground dark:text-gray-400'>
								{order.items} items • {order.time}
								{order.timeExtra && <span className='text-red-500 ml-1'>{order.timeExtra}</span>}
							</p>
						</div>
					</div>
					<div className='flex items-center space-x-2'>
						{getStatusBadge()}
						<Button
							variant='ghost'
							size='icon'
							className='dark:text-gray-300 dark:hover:bg-gray-800'
							// onClick={() => setIsEditOpen(true)}
						>
							<PencilIcon className='h-4 w-4' />
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
