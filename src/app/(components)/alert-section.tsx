'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangleIcon, ShoppingCartIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Product } from '@/types/types';
import { useAppContext } from '@/context/AppContext';

export function AlertSection() {
	const [lowStockItems, setLowStockItems] = useState<Product[]>([]);
	const [outOfStockItems, setOutOfStockItems] = useState<Product[]>([]);
	const [affectedProducts, setAffectedProducts] = useState<any[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const {productsData} = useAppContext();

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Fetch all products
				const products = productsData;

				if (!products) throw new Error('No products found');

				// Filter products with low stock (less than 10 units)
				const lowStock = products.filter((product) => {
					const stock = Number(product.stock);
					return stock > 0 && stock < 10;
				});

				// Filter out of stock products
				const outOfStock = products.filter((product) => {
					const stock = Number(product.stock);
					return stock === 0;
				});

				// For affected products, we need to check if any products are used in recipes
				// This is a simplified version - in a real app, you'd need to check recipe dependencies
				const affected = [];

				// If there are out of stock items, check if they affect any products
				if (outOfStock.length > 0) {
					// This is a simplified example - in a real app, you'd need to check recipe dependencies
					// For now, we'll just show a message that some products might be affected
					affected.push({
						id: 'general',
						name: 'Productos Elaborados',
						affectedBy: outOfStock.map((item) => item.name),
					});
				}

				setLowStockItems(lowStock);
				setOutOfStockItems(outOfStock);
				setAffectedProducts(affected);
			} catch (err) {
				console.error('Error fetching products:', err);
				setError('Error loading product data');
			} finally {
				setIsLoading(false);
			}
		};

		fetchProducts();
	}, [productsData]);

	return (
		<div className='space-y-6'>
			<Card className='dark:bg-gray-900 dark:border-gray-800'>
				<CardHeader className='bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800'>
					<CardTitle className='text-amber-700 dark:text-amber-400 flex items-center'>
						<AlertTriangleIcon className='h-5 w-5 mr-2' />
						Productos en Bajo Stock
					</CardTitle>
				</CardHeader>
				<CardContent className='pt-4'>
					{isLoading ? (
						<div className='animate-pulse space-y-3'>
							<div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
							<div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
						</div>
					) : lowStockItems.length > 0 ? (
						<ul className='space-y-3'>
							{lowStockItems.map((item, index) => (
								<li
									key={item.id}
									className='flex justify-between items-center'>
									<div>
										<p className='font-medium text-gray-800 dark:text-gray-200'>{item.name}</p>
										<p className='text-sm text-gray-600 dark:text-gray-400'>{item.stock} unidades restantes</p>
									</div>
									<Badge
										variant='outline'
										className='bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'>
										Bajo
									</Badge>
								</li>
							))}
						</ul>
					) : (
						<p className='text-gray-600 dark:text-gray-400'>No hay productos en bajo stock.</p>
					)}
				</CardContent>
			</Card>

			<Card className='dark:bg-gray-900 dark:border-gray-800'>
				<CardHeader className='bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800'>
					<CardTitle className='text-red-700 dark:text-red-400 flex items-center'>
						<AlertTriangleIcon className='h-5 w-5 mr-2' />
						Productos Agotados
					</CardTitle>
				</CardHeader>
				<CardContent className='pt-4'>
					{isLoading ? (
						<div className='animate-pulse space-y-3'>
							<div className='h-10 bg-gray-200 dark:bg-gray-700 rounded'></div>
						</div>
					) : outOfStockItems.length > 0 ? (
						<ul className='space-y-3'>
							{outOfStockItems.map((item, index) => (
								<li
									key={item.id}
									className='flex justify-between items-center'>
									<div>
										<p className='font-medium text-gray-800 dark:text-gray-200'>{item.name}</p>
										<p className='text-sm text-gray-600 dark:text-gray-400'>{item.stock} unidades restantes</p>
									</div>
									<Badge
										variant='outline'
										className='bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800'>
										Agotado
									</Badge>
								</li>
							))}
						</ul>
					) : (
						<p className='text-gray-600 dark:text-gray-400'>No hay productos agotados.</p>
					)}
				</CardContent>
			</Card>

			{affectedProducts.length > 0 && (
				<Card className='dark:bg-gray-900 dark:border-gray-800'>
					<CardHeader className='bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800'>
						<CardTitle className='text-purple-700 dark:text-purple-400 flex items-center'>
							<AlertTriangleIcon className='h-5 w-5 mr-2' />
							Productos Elaborados Afectados
						</CardTitle>
					</CardHeader>
					<CardContent className='pt-4'>
						<ul className='space-y-3'>
							{affectedProducts.map((item, index) => (
								<li
									key={item.id}
									className='flex justify-between items-center'>
									<div>
										<p className='font-medium text-gray-800 dark:text-gray-200'>{item.name}</p>
										<p className='text-sm text-gray-600 dark:text-gray-400'>Falta: {item.affectedBy.join(', ')}</p>
									</div>
									<Badge
										variant='outline'
										className='bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800'>
										Bloqueado
									</Badge>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			)}

			<Button
				className='w-full dark:border-gray-700 dark:text-gray-300'
				variant='outline'>
				<ShoppingCartIcon className='h-4 w-4 mr-2' />
				Reponer Ahora
			</Button>
		</div>
	);
}
