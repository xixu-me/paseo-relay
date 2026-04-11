# paseo-relay

**_[English](./README.md)_**

自托管的 Paseo relay。

该存储库将上游 `@getpaseo/relay/cloudflare` 适配器封装为一个轻量部署包装层。它不实现自定义 relay 协议、管理 API 或认证层。运行时契约与上游 Paseo 保持一致，而该存储库负责部署、校验和运维打包。

## 此存储库提供的内容

- 一个极简的 Worker 入口，重新导出上游 relay worker 和 `RelayDurableObject`
- 通过 Wrangler 完成 Durable Object 绑定
- 使用 Bun、TypeScript、Vitest 和 Wrangler dry-run 进行本地校验
- 一个在 `workerd` 上运行打包后 Worker 的 OCI 镜像
- 用于 PR 校验、`main` 分支部署和 OCI 发布的 GitHub Actions

## 运行时契约

对外暴露的运行时接口刻意保持精简：

- `GET /health` 返回 `200`，并附带 `{"status":"ok"}`
- `GET /ws?...` 处理 relay 和 WebSocket 流量

该存储库不会添加任何存储库特有的 API 端点。

## 快速开始

### 前置要求

- Bun `1.3.12`
- 如果你要构建或运行 OCI 镜像，需要 Docker
- 如果你要部署 Worker，需要一个 Cloudflare 账户

### 安装

```bash
bun install
```

### 运行校验

```bash
bun run check
```

该命令会执行：

- Worker 类型生成
- TypeScript 检查
- Vitest Worker 测试
- 生成的类型漂移检查
- `wrangler deploy --dry-run`

### 本地 Worker 开发

```bash
bun run dev
```

### 构建并运行 OCI 镜像

```bash
bun run oci:build
bun run oci:run
```

OCI 镜像会在 `8080` 端口暴露 relay。

## Cloudflare 部署

`wrangler.jsonc` 是 Worker 部署的单一事实来源：

- entrypoint: `src/index.ts`
- Durable Object binding: `RELAY`
- Durable Object class: `RelayDurableObject`
- SQLite-backed Durable Object migration: `v1`

使用以下命令部署：

```bash
bun run deploy
```

> [!NOTE]
> `workers.dev` 适合做初始验证，但面向生产的目标路径是自定义域名。

## 连接 Paseo 守护进程

Paseo 要求 relay endpoint 使用 `host:port` 形式。

> [!WARNING]
> 这里不要使用 `https://relay.example.com`。请使用 `relay.example.com:443`。

示例：

```bash
export PASEO_RELAY_ENDPOINT="relay.example.com:443"
export PASEO_RELAY_PUBLIC_ENDPOINT="relay.example.com:443"
```

- `PASEO_RELAY_ENDPOINT` 是守护进程连接的地址
- `PASEO_RELAY_PUBLIC_ENDPOINT` 是嵌入到配对链接和二维码中的地址

## 测试

Worker 测试套件覆盖：

- `/health` 返回 `200`
- 未知路径返回 `404`
- 缺少 `serverId` 时返回 `400`
- relay 版本无效时返回 `400`
- 非 WebSocket 的 relay 请求会被拒绝
- 有效的 WebSocket 升级请求会成功

OCI 校验路径还会额外检查：

- 容器启动
- 通过 HTTP 访问 `/health`
- 针对容器化运行时的 v2 WebSocket 升级冒烟测试

## CI/CD

存储库使用四个工作流：

- `validate-reusable.yml`: 唯一的校验事实来源
- `ci.yml`: 为 pull request 和 merge group 运行校验
- `release.yml`: 先校验，再从 `main` 部署 Worker 并发布 OCI 镜像
- `auto-merge.yml`: 只为带有 `dependencies` 标签的 Dependabot PR 启用自动合并

### 发布行为

- 推送到 `main` 且变更涉及发布相关文件时，会先运行校验，然后部署 Worker 并发布 `ghcr.io/xixu-me/paseo-relay:main`
- 手动触发的 `workflow_dispatch` 运行可以选择只部署 Worker 和/或只发布 OCI 镜像

### 所需 secrets

Worker 部署需要：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

OCI 发布使用内置的 `GITHUB_TOKEN`。

## OCI 说明

镜像基于 Wrangler 生成的 Worker bundle 构建，并由 `workerd` 提供服务。运行时镜像：

- 监听 `:8080`
- 将 Durable Object 状态持久化到 `/var/lib/paseo-relay/do`
- 以非 root 用户运行

## 设计目标

- 尽可能贴近上游 Paseo relay 架构
- 将存储库自有逻辑限制在部署、校验和打包
- 让 Worker 和 OCI 两条路径都能通过同一份契约进行测试
