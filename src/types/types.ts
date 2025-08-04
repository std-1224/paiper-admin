export enum UserType {
	Client = 'client',
	Master = 'master',
	Admin = 'admin',
	Barman = 'barman',
};

export enum ActiveStatus {
	Active = 'active',
	Inactive = 'inactive',
};

export enum ApprovalStatus {
	Pending = 'pending',
	Approved = 'approved',
};

export type MailType = "sign_up" | 'new_order' | "order_delivered" | "order_cancelled" | "order_delayed" | "balance_updated" | "reminder"


export interface Note {
	type: string;
	text: string;
}
export interface OrderItem {
	id: string;
	name: string;
	sale_price?: number;
	quantity: number;
	image_url?: string;
	description?: string;
	category?: string;
	product_id?: string;
	unit_price?: number;
	products?: Product;
}
export interface Customer {
	name: string;
	code: string;
	avatar: string;
}
export interface Order {
	id: string;
	table: string;
	status: string;
	items: number;
	time: string;
	timeExtra?: string;
	customer: Customer;
	paymentStatus: string;
	orderTime: string;
	deliveryTime: string;
	order_items: OrderItem[];
	orderItems: OrderItem[];
	notes: string;
	paymentMethod: string;
	user_name?: string;
	table_amount?: string;
	table_number?: string;
	payment_amount?: string;
	payment_method?: string;
	updated_at?: string;
	qr_id?: string;
	user?: User;
}

export interface User {
	id: string;
	name?: string;
	email: string;
	avatar?: string;
	role: UserType;
	status?: ActiveStatus;
	approval_status?: ApprovalStatus;
	balance?: string;
	spent?: string;
	phone?: string;
	address?: string;
	created_at: string;
	transactions?: UserTransaction[];
	sector_id?: number;

}

export interface QrUser extends User {
	ordersCount: number;
	totalSpent: number;
	frequentItems: string[];
}

export interface QrOrder extends Order {
}

export interface Staff {
	id: number;
	user_id: string;
	bar_id: number;
	user: any;
	bar: any;
	role: string;
	status: string;
}

export interface sender {
	name: string;
	avatar: string;
}
export interface drink {
	name: string;
	image: string;
	category: string;
}
export interface gifts {
	id: string;
	sender?: sender;
	recipient?: {
		name: string;
		avatar?: string;
		table?: string;
	};
	drink: drink;
	message?: string;
	timestamp: string;
	status: 'pending' | 'redeemed' | 'expired';
}

export interface guest {
	id: number;
	name: string;
	table: string;
	avatar: string;
	status: 'active' | 'decline' | 'rest';
}

export interface table {
	id: number;
	name: string;
	capacity: number;
	status: 'free' | 'occupied';
}
export interface drinks {
	id: number;
	name: string;
	category: string;
	price: string;
	image: string;
	available: boolean;
}

export interface MetricData {
	id: string;
	title: string;
	value: string;
	icon: string;
	color: string;
}

export interface OrderItem {
	name: string;
	quantity: number;
	price: number;
}

export interface OrderNote {
	type: 'allergy' | 'preference';
	text: string;
}

export interface OrderCustomer {
	name: string;
	code: string;
	avatar: string;
}

export interface Order {
	id: string;
	table: string;
	customer: OrderCustomer;
	status: string;
	paymentStatus: string;
	orderTime: string;
	deliveryTime: string;
	items: number;
	total: number;
	notes: string;
	created_at: string;
	user_id?: string;
	total_amount?: number;
	qr_codes: any
}

// Rename to avoid conflict with existing interfaces
export interface OrderManagementItem {
	name: string;
	quantity: number;
	price: number;
}

export interface OrderManagementNote {
	type: 'allergy' | 'preference';
	text: string;
}

export interface OrderManagementCustomer {
	name: string;
	code: string;
	avatar: string;
}

export interface OrderManagement {
	id: string;
	table: string;
	customer: OrderManagementCustomer;
	// status: 'new' | 'preparing' | 'ready' | 'completed' | 'delayed';
	status: any;
	// paymentStatus: 'Pagado' | 'Pendiente';
	paymentStatus: any;
	orderTime: string;
	deliveryTime: string;
	items: OrderManagementItem[];
	total: number;
	notes: string;
}

export interface UserTransaction {
	id: string;
	date: string;
	amount: string;
	type: 'Compra' | 'Recarga';
	status: 'Completada' | 'Pendiente';
	method: 'Tarjeta' | 'Efectivo' | 'Transferencia' | 'Saldo';
}

export interface Transaction {
	id: string;
	user_id: string;
	amount: number;
	type: string;
	status: string;
	createdAt?: string;
	paymentUrl?: string;
	counterparty?: string;

}

export interface Product {
	id: string;
	name: string;
	description?: string;
	category: string;
	stock: number;
	image_url: string;
	purchase_price: number;
	sale_price: number;
	created_at: string;
	updated_at: string;
	type?: 'product' | 'recipe' | 'ingredient'; // Type field to distinguish between products, recipes, and ingredients
	has_recipe?: boolean;
	ingredients?: string; // JSON string containing recipe ingredients
	is_active?: boolean;
	is_pr?: boolean;
	is_courtsey?: boolean;
	is_liquid?: boolean; // Toggle for liquid products
}

export interface CartItem extends Product {
	quantity: number;
}


export interface BarData {
	id?: string;
	name: string;
	location: string;
	description: string;
	isVip: boolean;
	type: string;
	capacity: number;
	status?: ActiveStatus;
}

export interface QRCodeData {
	id?: string;
	name: string;
	barId: string;
	location: string;
	purpose: string;
	last_used?: string;
	created_at?: string;
	bars?: BarData;
}

export interface InventoryData {
	id?: number,
	barId: number,
	productId: string,
	quantity: number,
	category: string,
	name: string,
	barName: string,
	status?: string,
	created_at?: string,
}


export type Ingredient = {
	name: string;
	quantity: string;
	unit: string;
};

export type Recipe = {
	id: number;
	name: string;
	stock: number | null;
	ingredients: Ingredient[];
	purchase_price?: number;
	sale_price?: number;
	category?: string;
	type?: string;
};

export type PersonType = 'Staff' | 'Invitados VIP' | 'Clientes frecuentes' | 'Promotores' | 'PR' | 'Embajadores de marca' | 'Staff interno autorizado';

export type Notification = {
	id: string
	title: string
	message: string
	type: string
	is_read: boolean
	created_at: string
	metadata?: any
}



