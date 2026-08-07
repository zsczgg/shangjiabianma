# 编码系统与库存系统部署拓扑

本文档是编码系统与库存系统的跨仓库部署约定。维护者或 AI 在修改 Docker、API 地址、端口、容器名或服务器迁移配置前，应先阅读本文档。

## 1. 仓库边界

两个系统必须继续保存在两个独立 Git 仓库中：

- 编码系统：`https://github.com/zsczgg/shangjiabianma`
- 库存系统：`https://github.com/zsczgg/shangjiabianma-kucun`

不要合并仓库、Compose 项目、数据库目录或数据卷。二者只在部署时共享一个 Docker 网络。

## 2. 数据职责

- 编码系统是商品、SKU 和编码映射的唯一数据源。
- 库存系统通过编码系统的只读 `/api/v1` 接口同步商品主数据。
- 两个系统使用永久不变的 `internalCode` 关联 SKU。
- 库存数量、流水、盘点和预警只写入库存系统数据库。
- API Key 仅保存在服务器 `.env` 中，不得提交到 Git 或暴露给浏览器。

## 3. 稳定的容器网络

两个 Compose 项目共享外部网络：

```text
shangjiabianma-internal
```

编码系统 API 容器名固定为：

```text
shangjiabianma-app
```

库存系统必须使用以下内部地址：

```dotenv
CATALOG_API_BASE_URL="http://shangjiabianma-app:3210/api/v1"
```

不要把局域网 IP、公网 IP 或 `127.0.0.1` 写成容器间的正式 API 地址。容器内部的 `127.0.0.1` 只指当前容器，主机搬迁或 DHCP 地址变化也会令硬编码 IP 失效。

## 4. 首次部署

在目标服务器创建一次外部网络；重复执行是安全的：

```bash
docker network inspect shangjiabianma-internal >/dev/null 2>&1 || \
  docker network create shangjiabianma-internal
```

先部署编码系统：

```bash
cd /opt/shangjiabianma
docker compose -f docker-compose.yml -f docker-compose.api.yml up -d --build
```

确认编码系统健康后再部署库存系统：

```bash
curl --fail http://127.0.0.1:3210/api/v1/health
cd /opt/shangjiabianma-kucun
docker compose up -d --build
```

## 5. 验证

```bash
docker network inspect shangjiabianma-internal
docker exec shangjiabianma-kucun-app-1 \
  node -e "fetch('http://shangjiabianma-app:3210/api/v1/health').then(async r => { console.log(r.status, await r.text()); process.exit(r.ok ? 0 : 1) }).catch(e => { console.error(e); process.exit(1) })"
docker compose -f /opt/shangjiabianma-kucun/docker-compose.yml logs --tail=100 app sync-worker
```

预期健康接口返回 HTTP 200，自动同步日志最终出现 `SUCCESS`。库存 Compose 使用健康检查保证 worker 在 app 就绪后启动；如果有人移除该依赖条件，首次启动可能出现 `ECONNREFUSED`。

## 6. 服务器搬迁

服务器从中国搬到韩国、切换路由器或局域网 IP 变化时，容器间 API 地址不需要修改。只需保证：

1. Docker 自动启动；
2. `shangjiabianma-internal` 网络存在；
3. 两套 Compose 项目已启动；
4. `.env` 中的 API Key 仍然匹配。

用户访问地址可通过 Tailscale 名称或固定地址解决，不应反向影响容器间 API 配置。

## 7. 故障与回退

- 提示 `network shangjiabianma-internal declared as external, but could not be found`：先执行第 4 节的网络创建命令。
- 提示无法解析 `shangjiabianma-app`：确认两个 app 容器都已加入 `shangjiabianma-internal`。
- 返回 401：检查两边 API Key 是否一致，不要为了排错关闭认证。
- 编码系统不可用：库存系统保留本地商品镜像和库存数据，但同步会失败；恢复编码系统后重新同步。
- 需要回退服务器：停止新服务器容器，在旧服务器恢复对应数据库后再启动；禁止同时使用两套可写库存数据库。

## 8. 不变量

以下名称和端口构成跨仓库契约，修改时必须同步更新两个仓库及本文档：

| 项目 | 固定值 |
| --- | --- |
| 共享网络 | `shangjiabianma-internal` |
| 编码 API 容器 | `shangjiabianma-app` |
| 编码容器端口 | `3210` |
| 编码主机端口 | `3210` |
| 库存主机端口 | `3220` |
| SKU 关联键 | `internalCode` |
