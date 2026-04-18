# 产品 HS 编码管理系统

用于管理产品英文名称和 HS 海关编码的增删查改工具。

## 技术栈

- **框架**: Next.js 16 (App Router)
- **数据库**: Supabase PostgreSQL
- **UI**: shadcn/ui + Tailwind CSS 4
- **包管理**: pnpm

## 快速开始

### 1. 配置环境变量

复制 `.env.example` 为 `.env.local` 并填写你的 Supabase 配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. 创建 Supabase 数据库

#### 创建表

在 Supabase SQL Editor 中执行：

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(500) NOT NULL,
  hs_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 创建索引
CREATE INDEX products_product_name_idx ON products (product_name);
CREATE INDEX products_hs_code_idx ON products (hs_code);

-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 公开读写策略
CREATE POLICY "products_允许公开读取" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_允许公开写入" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_允许公开更新" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "products_允许公开删除" ON products
  FOR DELETE USING (true);
```

### 3. 安装依赖

```bash
pnpm install
```

### 4. 运行开发服务器

```bash
pnpm dev
```

访问 http://localhost:5000

### 5. 构建生产版本

```bash
pnpm build
pnpm start
```

## 部署到 Vercel

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 添加环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 部署

## 数据模型

```typescript
interface Product {
  id: number;           // 自增主键
  product_name: string;  // 英文品名 (varchar 500)
  hs_code: string;      // HS 编码 (varchar 20)
  created_at: string;   // 创建时间
}
```

## 功能特性

- 列表展示 - 分页展示所有产品
- 新增产品 - 弹窗表单添加新产品
- 编辑产品 - 点击编辑按钮修改产品信息
- 删除确认 - 二次确认后删除
- 搜索筛选 - 支持按品名或 HS 编码搜索

## 项目结构

```
src/
├── app/
│   └── page.tsx           # 产品管理主页面
├── lib/
│   ├── products.ts        # 产品 CRUD 操作函数
│   └── utils.ts           # 通用工具
├── components/ui/         # shadcn/ui 组件库
└── storage/database/
    └── supabase-client-browser.ts  # Supabase 客户端
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
