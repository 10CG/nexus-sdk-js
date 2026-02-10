# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
