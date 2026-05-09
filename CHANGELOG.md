# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-05-09

### Added

- `ContextRequest.as_of?: string` — RFC 3339 datetime **with required timezone
  offset** for point-in-time retrieval. When set, semantic/recent layers scope
  results to facts known at that timestamp (replay past states, deterministic
  evaluations against a historical snapshot). Naive datetimes are rejected
  client-side by zod (`.datetime({ offset: true })`) to prevent silent UTC vs
  local-time drift at the ingest boundary. (US-037 Wave 1 TASK-005, sub-story
  US-037c, ai R2 D-9)

### Verified — already shipped, now contractually documented

- `RequestOptions.signal?: AbortSignal` — already implemented in `services/base.ts`
  and threaded through every `HttpClient` verb (`get/post/put/patch/delete`)
  to `axios`. v1.3.0 promotes this from "incidental" to "part of the public
  contract" — MCP cancel notifications can now be reliably forwarded from
  the upcoming `@nexus/mcp-server` (US-037a) into SDK calls. No behaviour
  change. (R2 ai D-9 SDK side)

### Errata

- 1.2.1 / 1.2.2 were CI auto-publish smoke tests against the Forgejo registry
  and shipped no functional changes. 1.3.0 is the first feature release after
  1.2.0.

## [1.2.0] - 2026-04-08

### Added
- FeedbackService: submit() + list() — 反馈闭环 API 补全
- Context depth 便捷参数: L0/L1/L2/L3 预设 (来源 MemPalace 渐进加载)
- Feedback 类型定义: FeedbackSubmitRequest, FeedbackResponse, FeedbackListItem, FeedbackListResponse
- 17 个 FeedbackService 单元测试 + 14 个 depth 单元测试

### Changed
- publishConfig 指向 Forgejo npm registry (内部发布)
- CI workflow: tag push 自动 build + test + publish

## [1.1.0] - 2026-02-16

### Added
- TenantService API Key CRUD: listApiKeys(), createApiKey(), revokeApiKey()
- apiKeyCreateSchema zod 校验 (name/scopes/expires_days)
- TenantService 单元测试 (6 tests)
- apiKeyCreateSchema 单元测试 (7 tests)

### Changed
- OfflineQueue.enqueue 泛型化: `enqueue<T>()` 替代 `as Promise<T>` 强转
- NexusConfig/CacheConfig/RetryConfig 去重: types/common.ts 移除重复定义，统一从 config.ts 导出

## [1.0.0] - 2026-02-09

### Added
- NexusClient 主类，支持 6 个服务模块
- ContextService: 聚合上下文检索 (三层)
- MemoryService: 记忆 CRUD + 语义搜索 + Journal
- ConversationService: 对话管理 + 消息 + 摘要
- KnowledgeService: 知识图谱查询 + 实体提取
- ActivityService: 活动流摄入 + 批量操作
- TenantService: 租户信息 + 用量统计
- HTTP 客户端: axios 基础层 + 认证拦截
- LRU 缓存: 智能失效策略 + 可观测统计
- 重试策略: 指数退避 + 429 Retry-After 支持
- 离线队列: 自动入队 + 网络恢复重放
- 完整 TypeScript 类型导出
- ESM/CJS 双格式输出

## [0.1.0] - 2026-02-02

### Added
- 初始项目脚手架
- 基础 SDK 结构
