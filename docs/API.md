# 进销存对接 API 使用文档

版本：`v1`

接口基地址：`http://你的服务器地址:3210/api/v1`

这套 API 用于让进销存、库存管理系统或其他程序读取商品、SKU 与编码对应关系。v1 是只读接口，不能修改内部编码，也不会增删商品。

## 1. 认证

除健康检查外，请求必须携带 API Key。推荐使用标准 Bearer 方式：

```http
Authorization: Bearer YOUR_API_KEY
```

也支持：

```http
X-API-Key: YOUR_API_KEY
```

API Key 属于服务器密码，不要写入前端网页、公开仓库、聊天截图或公开文档。系统后台的“API 管理”页面可以创建、查看状态和停用密钥。

### 在后台创建密钥

1. 登录商品编码系统。
2. 打开左侧“API 管理”。
3. 输入用途名称，例如“进销存正式环境”。
4. 点击“创建密钥”，立即复制完整密钥。

完整密钥只在创建时显示一次，数据库只保存不可逆哈希。后台以后只能看到前后几位、状态、创建时间和最近使用时间。不要让多个系统共用一个密钥，应为每位开发者或每套系统单独创建，方便独立停用。

## 2. 通用响应格式

成功：

```json
{
  "success": true,
  "data": {}
}
```

失败：

```json
{
  "success": false,
  "error": {
    "code": "SKU_NOT_FOUND",
    "message": "没有找到该内部编码"
  }
}
```

## 3. 健康检查

```http
GET /api/v1/health
```

不需要 API Key，可用于判断服务是否运行。

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "v1",
    "time": "2026-08-03T08:00:00.000Z"
  }
}
```

## 4. 分页获取 SKU

```http
GET /api/v1/skus?page=1&pageSize=50&status=ACTIVE&query=
```

| 参数 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `page` | 否 | `1` | 页码，从 1 开始 |
| `pageSize` | 否 | `50` | 每页数量，最大 100 |
| `status` | 否 | `ACTIVE` | `ACTIVE`、`INACTIVE` 或 `ALL` |
| `query` | 否 | 空 | 搜索商品名、规格、内部编码及各种关联编码 |

PowerShell 示例：

```powershell
$headers = @{ Authorization = "Bearer YOUR_API_KEY" }
Invoke-RestMethod -Headers $headers -Uri "http://你的服务器地址:3210/api/v1/skus?page=1&pageSize=50"
```

JavaScript 示例：

```javascript
const response = await fetch(`${baseUrl}/api/v1/skus?page=1&pageSize=50`, {
  headers: { Authorization: `Bearer ${apiKey}` }
});
const result = await response.json();
```

响应中的 `meta`：

```json
{
  "page": 1,
  "pageSize": 50,
  "total": 120,
  "totalPages": 3
}
```

## 5. 按内部编码获取 SKU

```http
GET /api/v1/skus/yyhxfz000001
```

内部编码生成后永久不变，因此这是进销存保存商品关联关系时最推荐的接口。

## 6. 任意编码反查

```http
GET /api/v1/lookup?code=6931234567890
```

支持精确匹配：

- 公司内部编码
- 厂家条码
- 规格仓配编码
- 商品级仓配编码
- 平台商品 ID
- 平台 SKU ID
- 商家编码

商品级编码或平台商品 ID 可能对应多个规格，因此 `data` 始终返回数组。`matchedBy` 表示本次匹配类型。

## 7. SKU 数据结构

```json
{
  "skuId": "系统SKU ID",
  "internalCode": "yyhxfz000001",
  "spec": "黑色 / XL",
  "status": "ACTIVE",
  "warning": null,
  "createdAt": "2026-08-03T08:00:00.000Z",
  "product": {
    "productId": "系统商品ID",
    "name": "商品名称",
    "brand": "品牌",
    "category": "分类",
    "imageUrl": null,
    "note": null,
    "status": "ACTIVE",
    "warehouseCode": "商品级仓配编码",
    "createdAt": "2026-08-03T08:00:00.000Z",
    "updatedAt": "2026-08-03T08:00:00.000Z"
  },
  "codes": {
    "manufacturerBarcode": "厂家条码",
    "warehouseCode": "规格仓配编码",
    "otherCodes": []
  },
  "platformMappings": [
    {
      "channel": "淘宝",
      "shop": "店铺名称",
      "platformProductId": "平台商品ID",
      "platformSkuId": "平台SKU ID",
      "merchantCode": "平台商家编码",
      "status": "ACTIVE"
    }
  ]
}
```

当商品或规格停用时，历史数据仍然返回，同时 `status` 为 `INACTIVE`，`warning` 会提示禁止用于新业务。

## 8. HTTP 状态码与错误码

| HTTP | 错误码 | 说明 |
| --- | --- | --- |
| `400` | `CODE_REQUIRED` | 缺少编码参数 |
| `400` | `INVALID_STATUS` | 状态参数不合法 |
| `401` | `UNAUTHORIZED` | API Key 缺失或错误 |
| `404` | `SKU_NOT_FOUND` | 内部编码不存在 |
| `404` | `CODE_NOT_FOUND` | 关联编码不存在 |
| `500` | `INTERNAL_ERROR` | 服务器读取失败 |

## 9. 对接规则

1. 进销存系统应把 `internalCode` 作为唯一、永久的规格标识。
2. 不要使用商品名称或规格名称建立唯一关联，它们后期可以修改。
3. `INACTIVE` 数据只用于历史追溯，不应创建新采购、入库或销售记录。
4. 定时全量同步建议使用 `pageSize=100`，逐页读取到 `totalPages`。
5. 收到非 2xx 响应时应记录错误，避免静默丢失关联关系。
6. OpenAPI 机器可读规范见 [`openapi.yaml`](./openapi.yaml)，可以直接交给开发工具或 AI。

## 10. 旧版服务器密钥

早期部署生成的服务器环境变量密钥会显示为“服务器旧密钥”。创建并测试至少一个后台新密钥后，可以停用旧密钥。停用操作不需要重启服务器。

后台创建的新密钥按创建时间倒序排列。新版本创建的完整密钥经过 AES-256-GCM 加密后保存在 SQLite 中，可在受后台密码保护的“API 管理”页面查看和复制；数据库中仍同时保存不可逆哈希用于接口鉴权。旧版本创建、只保存过哈希的密钥无法恢复明文，页面会提示新建替代密钥。使用中的密钥不能直接删除，必须先停用，再确认删除。

以下内容仅用于首次部署或灾难恢复，日常增加密钥请使用后台“API 管理”。

## 11. 部署配置

生成随机密钥：

```powershell
[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()
```

在服务器项目 `.env` 中添加：

```dotenv
INTEGRATION_API_KEY=生成的随机密钥
API_KEY_ENCRYPTION_SECRET=另一个至少32位的随机密钥
```

Docker 启动时加入 API 配置文件：

```bash
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --build
```
