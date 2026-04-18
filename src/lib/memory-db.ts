/**
 * 内存数据库 - SQL.js 的替代方案
 * 用于在 Vercel 环境中 SQL.js 无法工作时使用
 */

interface Product {
  id: number;
  product_name: string;
  hs_code: string;
  created_at: string;
}

interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

interface RunResult {
  changes: number;
  lastInsertRowid: number;
}

// 内存数据库
const memoryDb = {
  products: [] as Product[],
  nextId: 1,
};

// 初始化一些示例数据
if (memoryDb.products.length === 0) {
  memoryDb.products = [
    { id: memoryDb.nextId++, product_name: '示例产品', hs_code: '123456', created_at: new Date().toISOString() },
    { id: memoryDb.nextId++, product_name: '测试商品', hs_code: '654321', created_at: new Date().toISOString() },
  ];
}

/**
 * 执行查询 - 简化版，仅支持基本的 SELECT 查询
 */
export async function query<T = Record<string, unknown>>(
  sqlText: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  console.log('Memory DB query:', { sqlText, params });

  try {
    // 解析简单的 SELECT 查询
    if (sqlText.toUpperCase().includes('SELECT')) {
      let results = [...memoryDb.products];

      // 简单的 WHERE 条件处理
      if (sqlText.includes('LIKE')) {
        const keyword = params[0]?.toString().replace(/%/g, '') || '';
        if (keyword) {
          results = results.filter(p =>
            p.product_name.includes(keyword) ||
            p.hs_code.includes(keyword)
          );
        }
      } else if (sqlText.includes('WHERE id = ?')) {
        const id = params[0];
        results = results.filter(p => p.id === id);
      }

      // ORDER BY 处理
      if (sqlText.includes('ORDER BY id DESC')) {
        results.sort((a, b) => b.id - a.id);
      }

      return {
        rows: results as T[],
        rowCount: results.length,
      };
    }

    // 其他查询类型暂不支持
    throw new Error(`Unsupported query in memory DB: ${sqlText}`);
  } catch (error) {
    console.error('Memory DB query error:', error);
    return {
      rows: [] as T[],
      rowCount: 0,
    };
  }
}

/**
 * 执行更新操作 - 简化版
 */
export async function run(
  sqlText: string,
  params: any[] = []
): Promise<RunResult> {
  console.log('Memory DB run:', { sqlText, params });

  try {
    // INSERT 处理
    if (sqlText.toUpperCase().includes('INSERT')) {
      const [product_name, hs_code] = params;
      const newProduct: Product = {
        id: memoryDb.nextId++,
        product_name,
        hs_code,
        created_at: new Date().toISOString(),
      };
      memoryDb.products.push(newProduct);

      return {
        changes: 1,
        lastInsertRowid: newProduct.id,
      };
    }

    // UPDATE 处理
    if (sqlText.toUpperCase().includes('UPDATE')) {
      const [product_name, hs_code, id] = params;
      const index = memoryDb.products.findIndex(p => p.id === id);

      if (index !== -1) {
        memoryDb.products[index] = {
          ...memoryDb.products[index],
          product_name,
          hs_code,
        };
        return {
          changes: 1,
          lastInsertRowid: id,
        };
      }

      return {
        changes: 0,
        lastInsertRowid: 0,
      };
    }

    // DELETE 处理
    if (sqlText.toUpperCase().includes('DELETE')) {
      const [id] = params;
      const initialLength = memoryDb.products.length;
      memoryDb.products = memoryDb.products.filter(p => p.id !== id);

      return {
        changes: initialLength - memoryDb.products.length,
        lastInsertRowid: 0,
      };
    }

    throw new Error(`Unsupported operation in memory DB: ${sqlText}`);
  } catch (error) {
    console.error('Memory DB run error:', error);
    return {
      changes: 0,
      lastInsertRowid: 0,
    };
  }
}

/**
 * 获取数据库实例（为了兼容性）
 */
export async function getDatabase(): Promise<any> {
  return {
    // 返回一个虚拟数据库对象
    exec: () => [],
    run: () => {},
    close: () => {},
  };
}

/**
 * 保存数据库（为了兼容性，无操作）
 */
export function saveDatabase(): void {
  // 内存数据库不需要持久化
}

/**
 * 关闭数据库（为了兼容性，无操作）
 */
export function closeDatabase(): void {
  // 内存数据库不需要关闭
}