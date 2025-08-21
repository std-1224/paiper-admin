// services/productService.ts
import { supabase } from '@/lib/supabaseClient';
import { Product } from '../types/types';

export class ProductService {
	static async getAllProducts(): Promise<Product[]> {
		const { data, error } = await supabase
			.from('products')
			.select('*')
			.is('deleted_at', null);
		if (error) throw error;
		return data as Product[];
	}

	// static async createProduct(product: CreateProductInput): Promise<Product> {
	// 	const { data, error } = await supabase.from('products').insert(product).select().single();

	// 	if (error) throw error;
	// 	return data as Product;
	// }

	// Otros métodos CRUD: updateProduct, deleteProduct, etc.
}
