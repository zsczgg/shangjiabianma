# 媛媛和小肥朱｜商家编码系统

面向多平台电商与菜鸟云仓的商品统一编码系统。系统使用 SQLite 数据库，以商品组织多个库存规格（SKU），每个新规格自动获得 `yyhxfz000001` 格式的永久内部编码，并关联厂家条码、平台商品 ID 与仓库编码。

## 功能

- 商品信息与多规格 SKU 管理
- 自动生成六位流水内部编码，生成后不可修改
- 厂家条码、菜鸟编码及平台商品 ID 映射
- 淘宝、闲鱼、小红书和其他平台的多店铺关系
- Code 128 条形码展示
- 任意编码反查商品或规格
- 停用代替删除，保留历史编码和修改记录
- SQLite 单文件数据库，便于备份和迁移

## 本地运行

```powershell
npm install
Copy-Item .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

默认打开：`http://127.0.0.1:3000`

## 数据库

数据库连接由 `.env` 中的 `DATABASE_URL` 配置。SQLite 数据库文件不会提交到 GitHub。

正式录入数据后，应使用 SQLite 一致性备份机制生成备份，不能只在系统写入期间直接复制数据库文件。建议同时保留数据库副本、CSV/JSON 导出和商品编码总对应表，并将至少一份备份存放到另一台设备或云存储。

## 检查

```powershell
npm test
npm run build
```
