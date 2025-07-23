import { useState, useEffect } from 'react';
import { ProductService } from '@/services/productService';
import { Product } from '@/types/types';

export function useProducts() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchProducts() {
			try {
				const fetchedProducts = await ProductService.getAllProducts();
				setProducts(fetchedProducts);
				setLoading(false);
			} catch (err) {
				setError('no se pudieron cargar los productos');
				setLoading(false);
			}
		}
		fetchProducts();
	}, []);
	return { products, error, loading };
}
