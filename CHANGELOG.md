# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.0.0] - 2026-06-13

### Changed — BREAKING (memlist-convreq-contract-reconciliation)

Final type-pass of the cataloged contract drift (closes nexus-sdk-js #25).
Same doctrine as 2.0.0/3.0.0/4.0.0 — backend Pydantic `response_model` wire
names are ground truth. The backend was already correct this cycle; the SDK
and OpenAPI catch up. See nexus
`openspec/changes/memlist-convreq-contract-reconciliation/proposal.md`.

**`MemoryList`** (`GET /memories`) — FLAT container (backend
`MemoryListResponse`):

| 4.x (removed) | 5.0.0 (canonical) |
|---|---|
| `{ data: Memory[], pagination: { total, limit, offset, has_more } }` | `{ memories, total_count, limit, offset, has_next }` |

The old nested shape never existed on the wire — `result.data` was always
`undefined` at runtime. (Same flat-vs-nested fix already applied to
`ConversationList`/`MessageList` in 4.0.0; `MemoryList` was missed.)

**`ConversationCreate`** (`POST /conversations` request) — mirrors backend
`CreateConversationRequest`:

| 4.x (removed) | 5.0.0 (canonical) |
|---|---|
| `session_id?` (**phantom** — backend `extra=ignore` silently drops it; session id is always auto-generated server-side) | — (removed) |
| — (missing) | `agent_id?` (backend accepts it; SDK previously could not send it) |

**List params now require `user_id`** — `MemoryListParams.user_id` and
`ConversationListParams.user_id` changed `user_id?: string` → `user_id: string`.
The backend declares `user_id` as `Query(..., min_length=1)`; omitting it
returns 422.

**`Conversation` required-nullable convention** — `agent_id` / `summary` /
`metadata` changed from optional (`field?: T | null`) to required-nullable
(`field: T | null`), matching the backend (always emitted, value may be null)
and the OpenAPI `required[]` convention adopted 2026-06-11.

### Fixed (non-breaking, docs)

- `conversations.ts` stale JSDoc: removed "Zep OSS" / "temporal graph" / "API
  v2.0" references (the backend uses a Native SummaryWorker); `getSummary`
  doc no longer advertises removed `key_points` / `generated_at`;
  `@param conversationId` now documents the compound id (not "UUID");
  `delete()` documented as soft-delete (was "permanently removed").
- `memories.ts`: removed "via Mem0" (Native pgvector).
- `tenant.ts` `ApiKeyCreate.scopes` `@default` corrected `["*"]` →
  `["read", "write"]` (backend tightened in security-scopes-admin-hardening,
  2026-06-11).

### Migration

- `memories.list(...)`: `result.data` → `result.memories`;
  `result.pagination.total` → `result.total_count`;
  `result.pagination.has_more` → `result.has_next`.
- `conversations.create({ session_id })` → drop `session_id` (it was ignored
  anyway); pass `agent_id` instead if you need agent association.
- `memories.list()` / `conversations.list()` now require `user_id` — add it if
  you were relying on it being optional (the call would 422 at runtime before).

## [4.0.0] - 2026-06-11

### Changed — BREAKING (memory-conversation-contract-reconciliation)

Canonical = backend Pydantic `response_model` wire names, same doctrine as
2.0.0/3.0.0. This realigns the conversation domain (structurally drifted) and
completes the `Memory` field set. See nexus
`openspec/changes/memory-conversation-contract-reconciliation/proposal.md`.

**`Conversation`** (`GET /conversations/{id}`):

| 3.x (removed) | 4.0.0 (canonical) |
|---|---|
| `session_id?` (**phantom** — never on the wire) | `conversation_id` (the real wire key; backend `compound_session_id` serializes via alias) |
| — (missing) | `tenant_id`, `agent_id`, `status` |

**`ConversationList` / `MessageList`** — FLAT containers (backend
`ConversationListResponse` / `MessageListResponse`):
`{conversations|messages, total_count, limit, offset, has_next}`. The old
nested `{data, pagination:{...}}` / `{data, has_more}` shapes never existed
on the wire.

**`Message`** — full 11-field realignment: adds `message_id`,
`conversation_id` (UUID), `conversation_compound_id`, `tenant_id`, `user_id`;
`sequence` is now required (always emitted).

**`ConversationSummary`** — realigned to backend `SummaryResponse`: adds
`summary_message_count` / `message_count` / `created_at`; **removes phantom**
`key_points[]` / `generated_at`. The wire id key is `conversation_id`
(unified backend-side 2026-06-11 — previously this endpoint emitted
`compound_session_id`, an internal third id variant).

**`Memory`** — adds the compound-identifier trio (`memory_id` / `tenant_id` /
`agent_id`) and the US-035 temporal-validity window (`valid_from` /
`valid_until` / `valid_until_source`) — all emitted by the backend but
previously invisible to SDK readers.

### Removed — BREAKING

- **`ConversationDetail`** type — phantom shape: the backend
  `GET /conversations/{id}` response has no `messages` array (and the
  `include_messages` query param never existed). `conversations.get()` now
  returns `Conversation`; fetch messages via `conversations.getMessages()`.

## [3.0.0] - 2026-06-10

### Changed — BREAKING (tenant-contract-reconciliation)

Canonical = backend Pydantic `response_model` (`schemas/tenant.py`), same
doctrine as 2.0.0. The tenant domain types were structurally drifted; this
realigns them and removes two knowledge-domain phantoms. See nexus
`openspec/changes/tenant-contract-reconciliation/proposal.md`.

**`Tenant`** (`GET /tenants/me`) — flat shape:

| 2.x (removed) | 3.0.0 (canonical) |
|---|---|
| `usage?: TenantUsage` (nested, **phantom** — never on the wire) | flat `memories_count` / `conversations_count` / `graph_nodes_count` |
| — (missing) | `quota_remaining: Record<string, number>` |
| `quotas?: TenantQuotas` (optional) | `quotas: TenantQuotas` (required; + index signature) |

**`UsageStats`** (`GET /tenants/me/usage`) — full 13-field realignment:
adds `tenant_id`, `success_rate`, `avg_latency_ms`, `p50/p95/p99_latency_ms`,
`memories_count`, `conversations_count`, `graph_nodes_count`,
`storage_used_bytes`, `storage_limit_bytes`; **removes phantom**
`tokens_used` / `memories_created` / `conversations_created`.
`TenantService.usage()` now returns `UsageStats` (was the 3-field phantom
`TenantUsage`) and takes `period?: 'day' | 'week' | 'month'` as its first
argument (options moved to the second).

**`ApiKeyCreate`** — request field `expires_days` → **`expires_in_days`**
(the real wire name; the old name was silently dropped by the backend, so
keys created through the SDK never expired). `name` max length 100 → 255.

**`scopes`** — `ApiKeyScope` enum (`read|write|admin`) **removed**; scopes
are `string[]` documenting backend reality (known values: `read`, `write`,
`admin`, and the `"*"` wildcard — the backend's actual default, which the
enum could not represent).

### Removed — BREAKING

- **`TenantUsage`** type (phantom nested usage shape).
- **`ApiKeyScope`** type (see scopes above).
- **`KnowledgeService.createEntity()` + `EntityCreate` + `entityCreateSchema`**
  — phantom endpoint: the SDK POSTed `/knowledge/entities`, a route the
  backend has never had (404/405 at runtime). Owner decision Q8-A: drop the
  SDK method. Entities are created via `knowledge.extract()`.

### Fixed

- **`EntityListParams.user_id`** is now required — the backend demands it
  (`Query(..., min_length=1)`); the old optional typing let calls compile
  that 422'd at runtime. `listEntities(params)` first argument is now
  required accordingly.

## [2.0.0] - 2026-06-05

### Changed — BREAKING (contract reconciliation, ADR-003)

Canonical response shape is now the backend **flat-array** wire shape
(`ContextResponse` / `MemorySearchResponse` `response_model`). The previously
declared nested SDK shapes were a structural drift; there is no additive path,
so this is a single major bump (no transitional/dual shape). See nexus
`openspec/changes/context-response-contract-reconciliation/` + ADR-003.

**`ContextRetrieveResponse`** — was nested `{profile,history,graph,meta}`, now flat:

| 1.x (removed) | 2.0.0 (canonical) |
|---|---|
| `profile: ContextProfile` (`{memories, total_count}`) | `profile: ProfileMemory[] \| null` |
| `history: ContextHistory` (`{messages, summary, session_id}`) | `history: ConversationMessage[] \| null` |
| `graph: ContextGraph` (`{entities, relations}`) | `graph: ContextGraphEntity[] \| null` |
| `meta: ContextMeta` (`{took_ms, ...}`) | **removed** → use `total_latency_ms` |
| — | **added** `retrieve_id`, `ai_profile` (`Record<string,unknown>`), `retrieved_at`, `total_latency_ms`, `errors`, `experiment_group`, `temporal_filtered_count`, `as_of` |

Element key renames: `ContextMemory.id/score` → `ProfileMemory.memory_id/similarity_score`;
`ContextMessage` → `ConversationMessage` (+ `message_id`); `ContextEntity.entity_type`
→ `ContextGraphEntity.type` (+ `relationships`, `relevance_score`).

**`MemorySearchResult`** — was nested `Memory[]`, now flat:

| 1.x (removed) | 2.0.0 (canonical) |
|---|---|
| `results: Memory[]` | `results: SearchResult[]` (`{memory_id, content, memory_type, similarity, metadata}`) |
| `took_ms: number` | `search_time_ms: number` |
| — | **added** `total_found: number` |

### Removed

- Types `ContextMemory`, `ContextProfile`, `ContextMessage`, `ContextHistory`,
  `ContextEntity`, `ContextRelation`, `ContextGraph`, `ContextMeta`, `OwnerType`.

### Added

- Types `ProfileMemory`, `ConversationMessage`, `ContextGraphEntity`, `SearchResult`.
- `tests/unit/context-contract-shape.test.ts` — locks the flat shape against regression.

### Migration

Consumers reading `resp.profile.memories` / `resp.history.messages` /
`resp.graph.entities` must switch to iterating `resp.profile` / `resp.history` /
`resp.graph` directly; `resp.meta.took_ms` → `resp.total_latency_ms`;
`searchResult.took_ms` → `searchResult.search_time_ms`; `results[].memory.*`
→ `results[].*` (flat). Tracked for Kairos in [10CG/Kairos#52](https://forgejo.10cg.pub/10CG/Kairos/issues/52).

## [1.3.3] - 2026-05-29

### Fixed

- `src/http/cache.ts` — resolved 3 `TS2344` errors (`Type 'unknown' does not
  satisfy the constraint '{}'`) on the internal `LRUCache` value type
  parameter. `lru-cache` v10+ constrains its value parameter to `V extends {}`;
  `unknown` does not satisfy it. Changed the internal cache value type from
  `unknown` to `NonNullable<unknown>` (≡ `{}`, but doesn't trip
  `@typescript-eslint/no-empty-object-type`), with a single narrowing cast at
  the `set` boundary. Public API (`get<T>`, `set(value: unknown)`) unchanged —
  no consumer-visible behaviour change. `tsc --noEmit` is now clean (was red
  while `tsup` build stayed green, masking the debt). Closes
  FU-SDK-CACHE-TS-TYPE-FIX.

## [1.3.2] - 2026-05-28

### Added

- `repository`, `homepage`, `bugs` fields in `package.json` — required for
  Sigstore provenance attestation to validate. `repository.url` points to the
  GitHub mirror (`10CG/nexus-sdk-js`) so npm provenance verification can
  cross-check the artifact against the GitHub Actions build context. Forgejo
  (`forgejo.10cg.pub/10CG/nexus-sdk-js`) remains the canonical source of
  truth; `bugs.url` points there since issues are filed on Forgejo.

### Changed

- This is the first release with end-to-end automated publish via GitHub
  Actions (FU-MCP-SERVER-GITHUB-MIRROR). No functional SDK changes.

### Notes

- `1.3.1` was attempted but rejected by npm (`E422 Unprocessable Entity`,
  provenance bundle could not validate empty `repository.url`). The version
  was never accepted into the registry; `1.3.2` is the first published
  artifact of this batch.

## [1.3.1] - 2026-05-28 [UNPUBLISHED]

Attempted publish via GitHub Actions; rejected by npm provenance validation
(see `1.3.2` notes above). Tag `v1.3.1` retained as historical record of the
failed attempt; no registry artifact exists for this version.

### Changed

- **Release pipeline** — `@nexusm/sdk` releases are now automated via GitHub
  Actions on the `10CG/nexus-sdk-js` GitHub mirror (FU-MCP-SERVER-GITHUB-MIRROR).
  Tag push `v*` on Forgejo `main` → mirror force-pushes to GitHub → GitHub
  Actions `publish.yml` runs `npm publish --access public --provenance`.
  Local CLI publish remains documented in [`RUNBOOK.md`](./RUNBOOK.md) as a
  fallback.

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
  and shipped no functional changes. 1.3.0 is the first feature release with
  user-visible API additions after 1.2.0.
- The 1.2.x range did, however, ship `services/errors.ts` (`ErrorService` —
  client-side error reporting + auto HTTP capture, AC-031-5 / commit
  `3805228`); this landed without a CHANGELOG entry of its own at the time.
  Recording it here for retrospective traceability — its public API surface
  (`client.errors.report(...)`) is unchanged in 1.3.0.
  (R1 audit fix 2026-05-10, tech-lead minor finding)

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
