import initSqlJs, { Database as SqlJsDatabase, BindParams } from 'sql.js';
import * as fs from 'fs';
import * as path from 'path';

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'products.db');

// 单例数据库实例
let db: SqlJsDatabase | null = null;
let SQL: initSqlJs.SqlJsStatic | null = null;

/**
 * 获取 SQL.js 实例
 */
async function getSql(): Promise<initSqlJs.SqlJsStatic> {
	if (!SQL) {
		// 指定 wasm 文件路径
		const wasmPath = path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
		SQL = await initSqlJs({
			locateFile: () => wasmPath,
		});
	}
	return SQL;
}

/**
 * 获取数据库实例（单例）
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
	if (db) return db;

	const sqlJs = await getSql();

	// 确保 data 目录存在
	const dataDir = path.dirname(DB_PATH);
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true });
	}

	// 加载或创建数据库
	if (fs.existsSync(DB_PATH)) {
		const buffer = fs.readFileSync(DB_PATH);
		db = new sqlJs.Database(buffer);
	} else {
		db = new sqlJs.Database();
		// 初始化表结构
		initSchema(db);
	}

	return db;
}

/**
 * 初始化数据库表结构
 */
function initSchema(database: SqlJsDatabase): void {
	database.run(`
		CREATE TABLE IF NOT EXISTS products (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			product_name TEXT NOT NULL,
			hs_code TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		)
	`);

	// 创建索引
	database.run(`
		CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name)
	`);

	database.run(`
		CREATE INDEX IF NOT EXISTS idx_products_hs_code ON products(hs_code)
	`);

	// 持久化到文件
	saveDatabase();
}

/**
 * 保存数据库到文件
 */
export function saveDatabase(): void {
	if (db) {
		const data = db.export();
		const buffer = Buffer.from(data);
		fs.writeFileSync(DB_PATH, buffer);
	}
}

/**
 * 执行查询
 */
export async function query<T = Record<string, unknown>>(
	sqlText: string,
	params: BindParams = []
): Promise<{ rows: T[]; rowCount: number }> {
	const database = await getDatabase();
	const stmt = database.prepare(sqlText);
	stmt.bind(params);

	const rows: T[] = [];
	while (stmt.step()) {
		const row = stmt.getAsObject() as T;
		rows.push(row);
	}
	stmt.free();

	return { rows, rowCount: rows.length };
}

/**
 * 执行更新（INSERT/UPDATE/DELETE）
 */
export async function run(
	sqlText: string,
	params: BindParams = []
): Promise<{ changes: number; lastInsertRowid: number }> {
	const database = await getDatabase();
	database.run(sqlText, params);

	const changes = database.getRowsModified();
	const lastIdResult = database.exec('SELECT last_insert_rowid() as id');
	const lastInsertRowid = lastIdResult.length > 0 ? (lastIdResult[0].values[0][0] as number) : 0;

	// 持久化更改
	saveDatabase();

	return { changes, lastInsertRowid };
}

/**
 * 关闭数据库连接
 */
export function closeDatabase(): void {
	if (db) {
		saveDatabase();
		db.close();
		db = null;
	}
}
