'use client';

import { useEffect, useState } from 'react';
import { Clock, RefreshCw, Search, Save, Edit, Check, Loader2Icon, LoaderCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '@/context/AppContext';
import { Product, Recipe } from '@/types/types';

interface ExtendedProduct extends Product {
	margin: number;
	calculated: boolean;
	elaborated: boolean;
	amount: number;
}

export default function PriceManagement() {
	const [searchTerm, setSearchTerm] = useState('');
	const [filter, setFilter] = useState('all');
	const [editingProductId, setEditingProductId] = useState<string | null>(null);
	const [productsList, setProductsList] = useState<ExtendedProduct[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const {productsData, fetchProducts} = useAppContext();

	useEffect(() => {
		fetchProducts();
	}, []);


	useEffect(() => {
		if (!productsData) return;
		setProductsList(productsData.map((product:Product) => ({
			...product,
			margin: Number(((product.sale_price - product.purchase_price)/product.purchase_price*100).toFixed(2)),
			calculated: product.has_recipe ,
			elaborated: product.has_recipe,
			amount: product.stock,
		} as ExtendedProduct)));
	}, [productsData]);


	// const products: Product[] = [
	// 	{ id: 1, name: 'Vodka', type: 'botella', purchasePrice: 15000, salePrice: 25000, margin: 66.67 },
		
	// ];

	const filteredProducts = productsList.filter((product) => {
		const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
		if (filter === 'all') return matchesSearch;
		if (filter === 'normal') return matchesSearch && !product.elaborated;
		if (filter === 'elaborated') return matchesSearch && product.elaborated;
		return matchesSearch;
	});

	useEffect(() => {
		console.log("Updated productsList:", productsList);
	  }, [productsList]);

	const handleChangePrice = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		const numValue = Number(value);
	
		setProductsList(prev => prev.map(product => {
			if (product.id !== editingProductId) return product;
	
			// Handle margin change
			if (name === 'margin') {
				const purchase_price = product.purchase_price;
				const sale_price = purchase_price + (purchase_price * numValue / 100);
				return { ...product, margin: numValue, sale_price };
			}
	
			// Handle purchase_price change
			if (name === 'purchase_price') {
				const margin = product.margin;
				const sale_price = numValue + (numValue * margin / 100);
				console.log('sale_price ----->', sale_price)
				return { ...product, purchase_price: numValue, sale_price };
			}
	
			// Handle sale_price change
			if (name === 'sale_price') {
				const margin = ((numValue - product.purchase_price) / product.purchase_price * 100);
				console.log('margin ----->', margin)
				return { ...product, sale_price: numValue, margin: Number(margin.toFixed(2)) };
			}
	
			return product;
		}));
	};

	const handleSaveProduct = async () => {
		setIsEditing(true);
		if (!editingProductId) return;
		const product = productsList.find(product => product.id === editingProductId);
		if (!product) return;
		await fetch(`/api/products`, {
			method: 'PUT',
			body: JSON.stringify({
				id: product.id,
				name: product.name,
				description: product.description,
				category: product.category,
				stock: product.stock,
				image_url: product.image_url,
				purchase_price: product.purchase_price,
				sale_price: product.sale_price,
				updated_at: new Date().toISOString(),
			}),
		});
		setEditingProductId(null);
		setIsEditing(false);
	};

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Gestión de Precios</h1>
				<div className='flex gap-2'>
					<Button
						variant='outline'
						className='gap-2'>
						<RefreshCw size={16} />
						Recalcular Costos
					</Button>
					<Button className='gap-2'>
						<Save size={16} />
						Actualizar Precios
					</Button>
				</div>
			</div>

			{/* Search and Filters */}
			<div className='flex flex-col sm:flex-row justify-between gap-4'>
				<div className='relative w-full sm:w-64'>
					<Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
					<Input
						placeholder='Buscar por nombre'
						className='pl-8'
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className='flex gap-2'>
					<Button
						variant={filter === 'all' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setFilter('all')}>
						Todos los Productos
					</Button>
					<Button
						variant={filter === 'normal' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setFilter('normal')}>
						Productos Normales
					</Button>
					<Button
						variant={filter === 'elaborated' ? 'default' : 'outline'}
						size='sm'
						onClick={() => setFilter('elaborated')}>
						Productos Elaborados
					</Button>
				</div>
			</div>

			{/* Products Table */}
			<div className='border rounded-lg overflow-hidden'>
				<div className='overflow-x-auto'>
					<table className='w-full'>
						<thead>
							<tr className='bg-muted/50'>
								<th className='text-left p-3 font-medium'>Producto</th>
								<th className='text-left p-3 font-medium'>Tipo</th>
								<th className='text-left p-3 font-medium'>Precio de Compra ($)</th>
								<th className='text-left p-3 font-medium'>Precio de Venta ($)</th>
								<th className='text-left p-3 font-medium'>Margen (%)</th>
								<th className='text-left p-3 font-medium'>Historial</th>
								<th className='text-left p-3 font-medium'>Acciones</th>
							</tr>
						</thead>
						<tbody>
							{filteredProducts.map((product) => (
								<tr
									key={product.id}
									className='border-t hover:bg-muted/50'>
									<td className='p-3'>
										{product.name}
										{product.elaborated && (
											<Badge
												variant='outline'
												className='ml-2 bg-purple-50 text-purple-700 border-purple-200'>
												Elaborado
											</Badge>
										)}
									</td>
									<td className='p-3'>{product.category}</td>
									<td className='p-3'>
										<div className='flex items-center gap-2'>
											<Input
												name='purchase_price'
												type='number'
												value={product.purchase_price}
												className='w-32'
												disabled={product.calculated || editingProductId !== product.id}
												onChange={handleChangePrice}
											/>
											{product.calculated && (
												<Badge
													variant='outline'
													className='bg-blue-50 text-blue-700 border-blue-200'>
													Calculado
												</Badge>
											)}
										</div>
									</td>
									<td className='p-3'>
										<Input
											name='sale_price'
											type='number'
											value={product.sale_price}
											className='w-32'
											disabled={editingProductId !== product.id}
											onChange={handleChangePrice}
										/>
									</td>
									<td className='p-3'>
										<Input
											name='margin'
											type='number'
											value={product.margin}
											className='w-32'
											disabled={editingProductId !== product.id}
											onChange={handleChangePrice}
										/>
									</td>
									<td className='p-3'>
										<Button
											variant='ghost'
											size='icon'>
											<Clock className='h-4 w-4' />
										</Button>
									</td>
									<td className='p-3'>
										{editingProductId === product.id ? (
											<Button
												variant='default'
												size='icon'
												onClick={handleSaveProduct}>
												{isEditing ? (
													<div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
												) : (
													<Save className='h-4 w-4' />
												)}
											</Button>
										) : (
											<Button
												variant='ghost'
												size='icon'
												onClick={() => setEditingProductId(product.id)}>
												<Edit className='h-4 w-4' />
											</Button>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
