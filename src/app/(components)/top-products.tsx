'use client';

import React from 'react';
import { PackageIcon } from 'lucide-react';

interface ProductProps {
	id: string;
	name: string;
	sales: number;
	revenue: string;
}

export function TopProducts({ products }: { products: ProductProps[] }) {
	return (
		<div className='space-y-4'>
			<h3 className='text-lg font-semibold'>Top Productos</h3>
			<div className='space-y-4'>
				{products.map((product, index) => (
					<div
						key={product.id}
						className='flex items-center justify-between'
						id={`product-item-${index}`}>
						<div
							className='flex items-center'
							id={`product-info-${index}`}>
							<div
								className='p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 mr-3'
								id={`product-icon-bg-${index}`}>
								<PackageIcon
									className='h-5 w-5 text-orange-500'
									id={`product-icon-${index}`}
								/>
							</div>
							<div id={`product-details-${index}`}>
								<h4
									className='font-medium'
									id={`product-name-${index}`}>
									{product.name}
								</h4>
								<p
									className='text-sm text-muted-foreground'
									id={`product-sales-${index}`}>
									{product.sales} ventas
								</p>
							</div>
						</div>
						<div
							className='text-lg font-bold text-orange-500'
							id={`product-revenue-${index}`}>
							{product.revenue}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
