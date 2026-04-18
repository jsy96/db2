'use client';

// 产品类型
export interface Product {
	id: number;
	product_name: string;
	hs_code: string;
	created_at: string;
}

// API 响应类型
interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	message?: string;
}

// 创建产品
export async function createProduct(product_name: string, hs_code: string): Promise<Product> {
	const response = await fetch('/api/products', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ product_name, hs_code }),
	});

	const result: ApiResponse<Product> = await response.json();

	if (!result.success || !result.data) {
		throw new Error(result.error || '添加产品失败');
	}

	return result.data;
}

// 获取所有产品
export async function getProducts(): Promise<Product[]> {
	const response = await fetch('/api/products');
	const result: ApiResponse<Product[]> = await response.json();

	if (!result.success) {
		throw new Error(result.error || '获取产品列表失败');
	}

	return result.data || [];
}

// 更新产品
export async function updateProduct(id: number, product_name: string, hs_code: string): Promise<Product> {
	const response = await fetch('/api/products', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ id, product_name, hs_code }),
	});

	const result: ApiResponse<Product> = await response.json();

	if (!result.success || !result.data) {
		throw new Error(result.error || '更新产品失败');
	}

	return result.data;
}

// 删除产品
export async function deleteProduct(id: number): Promise<void> {
	const response = await fetch(`/api/products?id=${id}`, {
		method: 'DELETE',
	});

	const result: ApiResponse<void> = await response.json();

	if (!result.success) {
		throw new Error(result.error || '删除产品失败');
	}
}

// 搜索产品
export async function searchProducts(keyword: string): Promise<Product[]> {
	const response = await fetch(`/api/products?keyword=${encodeURIComponent(keyword)}`);
	const result: ApiResponse<Product[]> = await response.json();

	if (!result.success) {
		throw new Error(result.error || '搜索产品失败');
	}

	return result.data || [];
}
