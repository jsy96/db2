import { pgTable, serial, timestamp, varchar, index } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 产品表 - 存储英文品名和HS编码
export const products = pgTable(
	"products",
	{
		id: serial().primaryKey(),
		product_name: varchar("product_name", { length: 500 }).notNull(),
		hs_code: varchar("hs_code", { length: 20 }).notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(table) => [
		index("products_product_name_idx").on(table.product_name),  // 英文品名索引，支持模糊搜索
		index("products_hs_code_idx").on(table.hs_code),           // HS编码索引
	]
);
