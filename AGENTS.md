# 项目上下文

## 项目简介

**产品 HS 编码管理系统** - 用于管理产品英文名称和 HS 海关编码的增删查改工具。

### 技术栈
- **框架**: Next.js 16 (App Router)
- **数据库**: SQLite (本地文件存储)
- **ORM**: 无 (直接使用 SQL)
- **API**: 原生 REST API (`/api/products`)
- **UI**: shadcn/ui + Tailwind CSS 4
- **包管理**: pnpm

### 数据模型

```typescript
// products 表
interface Product {
  id: number;           // 自增主键
  product_name: string;  // 英文品名
  hs_code: string;       // HS 编码
  created_at: string;    // 创建时间
}
```

## 环境变量配置

**无需配置任何环境变量** - SQLite 数据库完全本地化，数据存储在 `data/products.db` 文件中。

## 数据库配置

### 存储位置
- **文件**: `data/products.db`
- **表**: `products`

### 表结构
- **表名**: `products`
- **主键**: `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- **索引**: `product_name`, `hs_code`

### API 端点

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/products` | 获取产品列表 |
| GET | `/api/products?keyword=xxx` | 搜索产品 |
| POST | `/api/products` | 创建产品 |
| PUT | `/api/products` | 更新产品 |
| DELETE | `/api/products?id=xxx` | 删除产品 |

## 文件结构

```
src/
├── app/
│   ├── page.tsx           # 产品管理主页面
│   └── api/
│       └── products/
│           └── route.ts   # SQLite API 路由
├── lib/
│   ├── products.ts        # 产品 CRUD 操作
│   └── sqlite.ts          # SQLite 数据库封装
└── components/ui/         # shadcn/ui 组件库
data/
└── products.db             # SQLite 数据库文件
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发环境
pnpm dev

# 构建生产版本
pnpm build

# 启动生产环境
pnpm start
```

## 功能特性

- ✅ 列表展示 - 分页展示所有产品
- ✅ 新增产品 - 弹窗表单添加新产品
- ✅ 编辑产品 - 点击编辑按钮修改产品信息
- ✅ 删除确认 - 二次确认后删除
- ✅ 搜索筛选 - 支持按品名或 HS 编码搜索

## 技术特点

### 零依赖外部服务
- 不需要 PostgreSQL
- 不需要 Supabase
- 不需要任何云数据库
- 不需要配置环境变量

### 数据持久化
- SQLite 数据库文件存储在 `data/products.db`
- 数据自动持久化到磁盘
- 重启服务后数据保持不变

### 适用场景
- 小规模数据（< 10000 条）
- 单实例部署
- 无需多用户并发写入
