# 商品统一编码系统 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建一个可部署到云服务器的单用户商品主档系统，用固定规则生成 SKU 内部编码，并统一映射厂家、平台和菜鸟云仓编码。

**Architecture:** 使用 Next.js 全栈应用提供响应式管理后台与服务端接口；Prisma 管理关系数据模型，开发演示使用 SQLite，生产部署使用 PostgreSQL。商品（SPU）与库存规格（SKU）分层，平台商品映射位于商品层，平台 SKU、厂家条码和仓库编码位于规格层。

**Tech Stack:** Next.js 14、TypeScript、Prisma、PostgreSQL、NextAuth/Credentials、Zod、JsBarcode、xlsx、Vitest、Docker Compose

---

### Task 1: 初始化应用与质量工具

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `.env.example`
- Create: `vitest.config.ts`

1. 定义运行、构建、数据库迁移和测试脚本。
2. 安装依赖并运行空测试，预期命令成功。
3. 建立基础 App Router 布局。

### Task 2: 建立商品编码领域模型

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/internal-code.ts`
- Test: `src/lib/internal-code.test.ts`

1. 先测试 `yyhxfz` 加四位流水号、溢出和不可回收规则。
2. 创建 Product、Sku、ExternalCode、ChannelListing、ChannelSkuMapping 与 Sequence 模型。
3. 执行迁移并生成演示数据。

### Task 3: 商品与规格管理接口

**Files:**
- Create: `src/app/api/products/route.ts`
- Create: `src/app/api/products/[id]/route.ts`
- Create: `src/lib/validation.ts`

1. 测试商品、规格及映射输入校验。
2. 实现事务式新增、编辑、停用和搜索。
3. 验证内部编码及外部编码唯一约束。

### Task 4: 管理后台页面

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/products/page.tsx`
- Create: `src/app/products/new/page.tsx`
- Create: `src/app/products/[id]/page.tsx`
- Create: `src/app/globals.css`

1. 实现仓储工作台风格的响应式布局。
2. 实现总览、搜索、商品列表、新建商品和详情编辑。
3. 验证桌面与手机宽度下的可用性。

### Task 5: 扫码、条码与数据交换

**Files:**
- Create: `src/app/scan/page.tsx`
- Create: `src/components/barcode-label.tsx`
- Create: `src/app/api/export/route.ts`
- Create: `src/app/api/import/route.ts`

1. 任意内部或外部编码可定位到唯一 SKU。
2. 生成并打印 Code 128 标签。
3. 提供 Excel 模板、导入校验和导出。

### Task 6: 登录、部署与验收

**Files:**
- Create: `src/middleware.ts`
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `README.md`

1. 增加单管理员登录与安全 Cookie。
2. 配置 PostgreSQL 容器、应用容器和持久卷。
3. 运行单元测试、生产构建和端到端冒烟检查。

