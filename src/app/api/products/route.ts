import { NextRequest, NextResponse } from 'next/server';
import { query, run } from '@/lib/sqlite';

// 产品类型
interface Product {
	id: number;
	product_name: string;
	hs_code: string;
	created_at: string;
}

// GET - 获取产品列表或搜索
export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams;
	const keyword = searchParams.get('keyword') || '';

	try {
		let sql: string;
		let params: string[];

		if (keyword.trim()) {
			// 搜索模式
			sql = `
				SELECT id, product_name, hs_code, created_at
				FROM products
				WHERE product_name LIKE ? OR hs_code LIKE ?
				ORDER BY id DESC
			`;
			const searchPattern = `%${keyword}%`;
			params = [searchPattern, searchPattern];
		} else {
			// 获取全部
			sql = `
				SELECT id, product_name, hs_code, created_at
				FROM products
				ORDER BY id DESC
			`;
			params = [];
		}

		const result = await query<Product>(sql, params);

		return NextResponse.json({
			success: true,
			data: result.rows,
		});
	} catch (error) {
		console.error('Error fetching products:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '获取产品列表失败' },
			{ status: 500 }
		);
	}
}

// POST - 创建新产品
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { product_name, hs_code } = body;

		// 验证必填字段
		if (!product_name?.trim()) {
			return NextResponse.json(
				{ success: false, error: '产品名称不能为空' },
				{ status: 400 }
			);
		}
		if (!hs_code?.trim()) {
			return NextResponse.json(
				{ success: false, error: 'HS编码不能为空' },
				{ status: 400 }
			);
		}

		const sql = `
			INSERT INTO products (product_name, hs_code, created_at)
			VALUES (?, ?, datetime('now'))
		`;

		const result = await run(sql, [product_name.trim(), hs_code.trim()]);

		// 获取刚插入的数据
		const newProduct = await query<Product>(
			'SELECT id, product_name, hs_code, created_at FROM products WHERE id = ?',
			[result.lastInsertRowid]
		);

		if (newProduct.rows.length === 0) {
			return NextResponse.json(
				{ success: false, error: '创建产品失败' },
				{ status: 500 }
			);
		}

		return NextResponse.json({
			success: true,
			data: newProduct.rows[0],
		});
	} catch (error) {
		console.error('Error creating product:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '创建产品失败' },
			{ status: 500 }
		);
	}
}

// PUT - 更新产品
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { id, product_name, hs_code } = body;

		// 验证必填字段
		if (!id) {
			return NextResponse.json(
				{ success: false, error: '产品ID不能为空' },
				{ status: 400 }
			);
		}
		if (!product_name?.trim()) {
			return NextResponse.json(
				{ success: false, error: '产品名称不能为空' },
				{ status: 400 }
			);
		}
		if (!hs_code?.trim()) {
			return NextResponse.json(
				{ success: false, error: 'HS编码不能为空' },
				{ status: 400 }
			);
		}

		const sql = `
			UPDATE products
			SET product_name = ?, hs_code = ?
			WHERE id = ?
		`;

		const result = await run(sql, [product_name.trim(), hs_code.trim(), id]);

		if (result.changes === 0) {
			return NextResponse.json(
				{ success: false, error: '产品不存在或更新失败' },
				{ status: 404 }
			);
		}

		// 获取更新后的数据
		const updatedProduct = await query<Product>(
			'SELECT id, product_name, hs_code, created_at FROM products WHERE id = ?',
			[id]
		);

		return NextResponse.json({
			success: true,
			data: updatedProduct.rows[0],
		});
	} catch (error) {
		console.error('Error updating product:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '更新产品失败' },
			{ status: 500 }
		);
	}
}

// DELETE - 删除产品
export async function DELETE(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const id = searchParams.get('id');

		if (!id) {
			return NextResponse.json(
				{ success: false, error: '产品ID不能为空' },
				{ status: 400 }
			);
		}

		const sql = `DELETE FROM products WHERE id = ?`;
		const result = await run(sql, [parseInt(id, 10)]);

		if (result.changes === 0) {
			return NextResponse.json(
				{ success: false, error: '产品不存在或删除失败' },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			message: '删除成功',
		});
	} catch (error) {
		console.error('Error deleting product:', error);
		return NextResponse.json(
			{ success: false, error: error instanceof Error ? error.message : '删除产品失败' },
			{ status: 500 }
		);
	}
}
