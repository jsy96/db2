import * as fs from 'fs';
import * as path from 'path';

// 尝试导入内存数据库作为备选方案
let memoryDb: any = null;
try {
  memoryDb = require('./memory-db');
} catch (error) {
  // 如果导入失败，我们将在运行时处理
  console.log('Memory DB module not available:', error.message);
}

// 数据库文件路径
const DB_PATH = path.join(process.cwd(), 'data', 'products.db');

// 单例数据库实例
let db: any = null;
let SQL: any = null;

// 标记是否使用内存数据库作为备选方案
let useMemoryDB = false;

/**
 * 获取 SQL.js 实例 - 使用 ASM.js 版本避免 WASM 问题
 * 如果所有 SQL.js 方法都失败，将自动回退到内存数据库
 */
async function getSql(): Promise<any> {
	if (!SQL) {
		try {
			// 方法1：尝试使用 ASM.js 版本，它不需要 WASM 文件
			console.log('Trying SQL.js ASM.js version...');
			const initSqlJs = (await import('sql.js/dist/sql-asm.js')).default;

			// ASM.js 版本不需要 locateFile 配置
			SQL = await initSqlJs();
			console.log('SQL.js ASM.js version initialized successfully');
		} catch (asmError) {
			console.log('ASM.js version failed, trying WASM with direct file path...', asmError.message);

			try {
				// 方法2：尝试 WASM 版本，但使用绝对路径
				const initSqlJs = (await import('sql.js')).default;

				// 尝试多种可能的路径
				const possibleWasmPaths = [
					// Vercel 生产环境路径
					'/var/task/public/sql-wasm.wasm',
					// 标准公共目录路径
					path.join(process.cwd(), 'public', 'sql-wasm.wasm'),
					// 相对 URL 路径
					'/sql-wasm.wasm',
				];

				let success = false;
				for (const wasmPath of possibleWasmPaths) {
					try {
						console.log(`Trying WASM path: ${wasmPath}`);
						SQL = await initSqlJs({
							locateFile: () => wasmPath,
						});
						console.log(`SQL.js initialized with path: ${wasmPath}`);
						success = true;
						break;
					} catch (pathError) {
						console.log(`Path ${wasmPath} failed: ${pathError.message}`);
						continue;
					}
				}

				if (!success) {
					throw new Error('All WASM path attempts failed');
				}
			} catch (wasmError) {
				console.error('All SQL.js attempts failed, switching to memory database fallback');

				// 标记使用内存数据库
				useMemoryDB = true;

				// 返回一个虚拟的 SQL 对象，使其不会崩溃
				SQL = {
					Database: class MockDatabase {
						constructor(buffer?: Uint8Array) {
							console.log('Using mock database (memory fallback)');
						}
						run() {}
						prepare() {
							return {
								bind() {},
								step() { return false; },
								getAsObject() { return {}; },
								free() {},
							};
						}
						close() {}
						export() { return new Uint8Array(); }
						getRowsModified() { return 0; }
						exec() { return []; }
					}
				};
			}
		}
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
	// 如果使用内存数据库，调用内存数据库的查询方法
	if (useMemoryDB && memoryDb) {
		console.log('Using memory database for query');
		return memoryDb.query<T>(sqlText, params);
	}

	try {
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
	} catch (error) {
		console.error('SQL.js query failed, falling back to memory DB:', error);

		// 尝试使用内存数据库作为回退
		if (memoryDb) {
			useMemoryDB = true;
			return memoryDb.query<T>(sqlText, params);
		}

		throw error;
	}
}

/**
 * 执行更新（INSERT/UPDATE/DELETE）
 */
export async function run(
	sqlText: string,
	params: BindParams = []
): Promise<{ changes: number; lastInsertRowid: number }> {
	// 如果使用内存数据库，调用内存数据库的 run 方法
	if (useMemoryDB && memoryDb) {
		console.log('Using memory database for run');
		return memoryDb.run(sqlText, params);
	}

	try {
		const database = await getDatabase();
		database.run(sqlText, params);

		const changes = database.getRowsModified();
		const lastIdResult = database.exec('SELECT last_insert_rowid() as id');
		const lastInsertRowid = lastIdResult.length > 0 ? (lastIdResult[0].values[0][0] as number) : 0;

		// 持久化更改
		saveDatabase();

		return { changes, lastInsertRowid };
	} catch (error) {
		console.error('SQL.js run failed, falling back to memory DB:', error);

		// 尝试使用内存数据库作为回退
		if (memoryDb) {
			useMemoryDB = true;
			return memoryDb.run(sqlText, params);
		}

		throw error;
	}
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
