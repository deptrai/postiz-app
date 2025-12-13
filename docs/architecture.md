# Architecture

## Executive Summary

Kiến trúc đề xuất cho hệ thống **Facebook Page Analytics (Daily Brief / Trends / Best Time / Playbooks / Themes)** là **mở rộng trực tiếp trên Postiz** (monorepo pnpm workspace) thay vì tạo dự án mới. Ta bổ sung một “Analytics Intelligence layer” chạy song song với các module hiện có (Integrations / Posts / Analytics), tận dụng **NestJS + Prisma/Postgres + Redis/BullMQ** để ingest dữ liệu theo lịch và phục vụ dashboard/insights theo org.

## Project Initialization

Dự án đã tồn tại (Postiz). Story đầu tiên không phải “create new app”, mà là **set up dev environment đúng chuẩn repo**.

**Setup Commands (recommended):**

```bash
pnpm install
pnpm dev
```

Ghi chú thực tế (từ hành vi chạy lệnh gần đây): nếu chạy `apps/frontend` trực tiếp khi chưa cài `node_modules`, lệnh `dotenv -e ../../.env -- ...` có thể bị trỏ nhầm sang một CLI `dotenv` khác trên máy (không phải `dotenv-cli` của Node). Vì vậy cần chạy `pnpm install` ở root trước, sau đó chạy `pnpm dev` ở root (workspace) để đảm bảo dùng đúng binary.

**Starter Template Decision:** Đây không phải dự án greenfield. “Starter template” của dự án chính là **Postiz repo hiện tại**. Kiến trúc yêu cầu mọi thay đổi đều là **extend trong monorepo**, không tạo app mới ngoài workspace.

## Decision Summary

| Category | Decision | Version | Affects Epics | Rationale |
| -------- | -------- | ------- | ------------- | --------- |
| Base Platform | Extend existing Postiz monorepo (pnpm workspace) | Postiz repo (current) | 1–7 | Tận dụng auth/org/integrations/infra sẵn có, giảm time-to-MVP |
| Runtime | Node.js | 22.12.x (per engines: >=22.12.0 <23.0.0) | 1–7 | Đồng bộ theo repo constraints |
| Package Manager | pnpm | 10.6.1 | 1–7 | Đồng bộ theo repo `packageManager` |
| Frontend | Next.js | 14.2.30 | 3–5 | Postiz FE hiện tại dùng Next, phù hợp dashboard |
| Backend | NestJS | 10.0.2 (CLI/Common/Core baseline) | 1–5 | Đồng bộ major version với Postiz backend |
| ORM/DB | Prisma + PostgreSQL | Prisma 6.5.0 | 1–5 | Postiz dùng Prisma schema central, phù hợp analytic tables |
| Queue | Redis + BullMQ | BullMQ 5.12.12 | 1–4 | Ingestion/aggregation theo lịch, hỗ trợ retry/backfill |
| Scheduling | Nest Schedule | 4.0.0 | 1–4 | Lập lịch daily jobs (hoặc cron app hiện có) |
| Integrations | Reuse Postiz integrations framework | Postiz integrations (current) | 2–4 | Kết nối Facebook Pages qua integration layer |
| API Style | REST (Nest Controller) | Postiz REST conventions (current) | 1–5 | Đồng bộ pattern hiện tại của Postiz |
| Multi-tenancy | Org-scoped data + auth guard | Postiz org-scoping (current) | 1–7 | Bảo mật theo org, least-privilege (NFR-S1) |

## Version Verification

**Verification Date:** 2025-12-13

**Policy:** Dự án này **không chọn “latest versions” theo internet**, mà **pin theo versions đang dùng trong Postiz repo** để đảm bảo tương thích và tránh breaking changes trong quá trình mở rộng.

**Pinned versions (from repo):**

- Node.js constraint: `>=22.12.0 <23.0.0` (root `package.json` engines)
- pnpm: `10.6.1` (root `package.json` packageManager)
- Next.js: `14.2.30` (root dependencies)
- Prisma / @prisma/client: `6.5.0`
- BullMQ: `5.12.12`
- NestJS baseline: `10.0.2` (CLI/Common/Core)

Nếu sau này cần nâng version, phải làm như một story riêng (upgrade plan + regression tests), không tự động “bump” khi đang implement feature.

## Project Structure

```
/Users/mac_1/Documents/GitHub/postiz-app/
  package.json
  pnpm-workspace.yaml
  docker-compose.dev.yaml
  railway.toml
  apps/
    backend/
      package.json
      src/
        api/
          api.module.ts
          routes/
            analytics.controller.ts
            integrations.controller.ts
            posts.controller.ts
      nest-cli.json
    commands/
      package.json
      src/
    cron/
      package.json
      src/
    extension/
      package.json
      src/
    frontend/
      package.json
      src/
      (Next.js app)
    sdk/
      package.json
    workers/
      package.json
      src/
  libraries/
    helpers/
      src/
    nestjs-libraries/
      src/
        database/
          prisma/
            schema.prisma
        integrations/
          social/
            (providers)
    react-shared-libraries/
      src/
  docs/
    PRD.md
    epics.md
    architecture.md
```

**Starter-provided decisions (PROVIDED BY STARTER):** Postiz repo hiện tại đã cung cấp sẵn:

- AuthN/AuthZ baseline: JWT guard + org-scoping pattern (`AuthGuard('jwt')` + `@GetOrg()`)
- API framework: NestJS controllers/services + DTO validation
- DB access: Prisma client + central schema location
- Queue/async infra: Redis + BullMQ apps (`apps/workers`, `apps/cron`)
- FE framework: Next.js app trong `apps/frontend`

**Remaining decisions (NOT covered by starter):** Analytics Intelligence module boundaries, data models (analytics tables), job semantics (idempotency/retry), daily brief composition logic, and analytics-specific endpoints/UI.

**New/Extended components (proposed) — bám conventions Postiz:**

- Backend (NestJS):
  - `apps/backend/src/api/routes/analytics-intelligence.controller.ts` (hoặc mở rộng `analytics.controller.ts` nếu muốn gộp)
  - `apps/backend/src/api/routes/analytics-intelligence.service.ts`
  - `apps/backend/src/shared/analytics-intelligence/*` (helpers/calculations)
- Database (Prisma):
  - `libraries/nestjs-libraries/src/database/prisma/schema.prisma` bổ sung models/tables
- Workers/Jobs:
  - Ưu tiên đặt ingestion/aggregation jobs trong `apps/workers` (hoặc `apps/cron` nếu Postiz đang dùng cron app cho schedule), nhưng giữ API query ở `apps/backend`.
- Frontend (Next.js):
  - Thêm page/tab trong analytics area (do repo hiện tại chưa thấy string route `/analytics` trong FE source search, nhưng docs nói có `/analytics`; cần locate theo code thực tế khi triển khai).

## Epic to Architecture Mapping

| Epic | Value | Lives In | Notes |
| ---- | ----- | -------- | ----- |
| Epic 1: Foundation | Scaffold module + schema + job skeleton | backend + libraries/prisma + workers/cron | Thiết lập “Analytics Intelligence” boundaries |
| Epic 2: Ingestion & Storage | Daily ingest metadata/metrics | workers/cron + libraries/integrations + prisma | Idempotency + retry/backfill hooks |
| Epic 3: Dashboard | Filters + KPIs + top content | frontend + backend (query endpoints) | Query optimized cho 10–20 pages (NFR-P1) |
| Epic 4: Insights/Daily Brief | trends + best time + recs | backend (compute) + frontend (UI) | Explainability first-class |
| Epic 5: Export | CSV export | backend endpoint + FE download | Khuôn CSV theo scope filters |
| Epic 6: Playbooks | recipes + variants + experiments | backend + prisma + frontend | Growth, có thể bổ sung AI sau |
| Epic 7: Themes | clustering + manager | backend pipeline + frontend | Growth, có thể dùng embeddings sau |

## FR Traceability

| FR ID | Requirement (short) | Epic / Story | Primary Components |
| ----- | ------------------- | ------------ | ------------------ |
| FR-001 | Connect + lưu 10–20 Pages ưu tiên | Epic 2 / Story 2.1 | backend integrations + prisma |
| FR-002 | Page Groups/Niches + gán pages | Epic 3 / Story 3.1 | backend + prisma + frontend |
| FR-003 | Ingest daily | Epic 2 / Story 2.3 | workers/cron + bullmq |
| FR-004 | Lưu metadata content | Epic 2 / Story 2.2 | workers/cron + prisma |
| FR-005 | Lưu metrics tối thiểu | Epic 2 / Story 2.3 | workers/cron + prisma |
| FR-006 | Auto keyword/topic tags | Epic 4 / Story 4.1 | backend compute + prisma |
| FR-007 | Manual campaign tags | Epic 4 / Story 4.1 | backend + prisma + frontend |
| FR-008 | Dashboard filter | Epic 3 / Story 3.2 | frontend + backend query |
| FR-009 | Top posts/reels + KPI | Epic 3 / Story 3.2 | frontend + backend query |
| FR-010 | Trending velocity 24–72h | Epic 4 / Story 4.2 | backend compute |
| FR-011 | Trend theo group/niche | Epic 4 / Story 4.2 | backend compute + prisma |
| FR-012 | Best time slots | Epic 4 / Story 4.3 | backend compute |
| FR-013 | Best time slots theo format | Epic 4 / Story 4.3 | backend compute |
| FR-014 | Daily Brief | Epic 4 / Story 4.4 | frontend + backend |
| FR-015 | Explainability | Epic 4 / Story 4.4 | backend (compose reasons) |
| FR-016 | Export CSV | Epic 5 / Story 5.1 | backend export + frontend download |
| FR-017 | Playbooks from top content | Epic 6 / Story 6.1 | backend + prisma |
| FR-018 | Variants | Epic 6 / Story 6.2 | backend + frontend |
| FR-019 | Experiments + win rate | Epic 6 / Story 6.3 | backend + prisma |
| FR-020 | Theme clustering | Epic 7 / Story 7.1 | backend pipeline |
| FR-021 | Theme manager | Epic 7 / Story 7.2 | backend + frontend |
| FR-022 | Theme trending | Epic 7 / Story 7.3 | backend compute + frontend |

## Technology Stack Details

### Core Technologies

- **Monorepo:** pnpm workspace (`pnpm-workspace.yaml`)
- **Backend:** NestJS (controllers/services, AuthGuard JWT)
- **Frontend:** Next.js (port 4200 theo `apps/frontend/package.json`)
- **DB:** PostgreSQL + Prisma schema đặt tại `libraries/nestjs-libraries/src/database/prisma/schema.prisma`
- **Queue:** Redis + BullMQ (ingestion, aggregation, retries)

### Integration Points

- **Integrations → Analytics Intelligence**
  - Nguồn dữ liệu Facebook Pages/posts/reels đi qua integration providers.
  - Analytics ingestion job sẽ iterate theo integrations thuộc org.

- **Analytics Intelligence → Backend API**
  - Backend cung cấp endpoints dạng org-scoped, ví dụ:
    - `GET /analytics/daily-brief?groupId=&date=`
    - `GET /analytics/trends?groupId=&window=72h`
    - `GET /analytics/best-time?groupId=&range=14d&format=reels`
    - `GET /analytics/dashboard?groupId=&range=&format=`
    - `GET /analytics/export.csv?...`

- **Frontend → Backend API**
  - UI gọi API với auth JWT hiện có.
  - Cache strategy: SWR/React-query pattern tùy Postiz conventions (cần check code khi triển khai).

## Novel Pattern Designs

### Pattern: “Daily Brief Generator” (Action-first, Explainable)

**Purpose:** Biến dữ liệu metrics + taxonomy + trends thành 1 output “ra quyết định trong <5 phút”.

**Components:**
- `IngestionJob` (daily): pull posts/reels + metrics
- `AggregationJob` (daily): rollup per group/niche/format
- `TrendCalculator` (24–72h velocity)
- `BestTimeCalculator` (heatmap/slot scoring 7–14d)
- `RecommendationComposer` (top 3–5, kèm explainability)

**Data Flow:**
1. Job ingest → lưu raw/time-series
2. Job aggregate → lưu rollups
3. API `GET /analytics/daily-brief` → compose brief từ rollups + trend calculators

**Failure modes:**
- Partial data ingestion → brief vẫn trả nhưng đánh dấu dữ liệu thiếu (explainability)
- Retry/backfill theo NFR-I1

## Implementation Patterns

### API & Naming

- Controllers dùng plural resource style theo Postiz hiện có (ví dụ: `Controller('analytics')`).
- DTO validation qua `class-validator`.
- Org scoping qua decorator `@GetOrg()` + `AuthGuard('jwt')`.

### Database

- Prisma model naming: PascalCase, fields camelCase (theo Prisma standard) và index cho query theo `organizationId`, `integrationId`, `date`.
- Idempotency key cho metrics time-series: unique constraint `(organizationId, integrationId, externalPostId, date)`.

### Jobs / Retry

- Mọi ingestion chạy qua BullMQ queue.
- Retry/backoff policy theo NFR-I1: exponential backoff; dead-letter concept (post-MVP).

### Testing

- Unit tests và integration tests chạy bằng **Jest** (theo `jest.config.ts` ở root).
- Test placement: ưu tiên co-located `*.spec.ts`/`*.test.ts` theo convention hiện có trong repo (không tự tạo cấu trúc mới nếu Postiz đã có sẵn).
- Analytics Intelligence yêu cầu tối thiểu:
  - Unit tests cho calculators: `TrendCalculator`, `BestTimeCalculator`
  - Integration tests cho query endpoints `/analytics/*` theo org scope

### Time & Timezone

- Lưu timestamp dạng UTC trong DB.
- Query/report convert sang timezone theo org/user settings (nếu Postiz đã có, reuse).

## Consistency Rules

### Naming Conventions

- **Backend:** `*.controller.ts`, `*.service.ts`, DTO: `*.dto.ts`.
- **Routes:** `/analytics/...` giữ consistent với module analytics hiện có.

### Code Organization

- Ưu tiên “by feature” cho analytics intelligence (module folder riêng) để tránh rải logic vào nhiều nơi.

### Error Handling

- Errors trả theo pattern Postiz hiện tại (Nest exceptions). Không tự invent error wrapper nếu Postiz đã có.

### Logging Strategy

- Structured logs trong jobs: include `organizationId`, `integrationId`, `jobId`, `dateRange`.

## Data Architecture

### MVP Models (proposed)

- `AnalyticsPageGroup`:
  - `id`, `organizationId`, `name`, `niche`, timestamps
- `AnalyticsContent` (nếu cần tách content khỏi Postiz posts):
  - `id`, `organizationId`, `integrationId`, `externalContentId`, `format`, `caption`, `hashtags`, `publishedAt`
- `AnalyticsPostMetricsDaily`:
  - `id`, `organizationId`, `integrationId`, `externalContentId`, `date`, `reach`, `impressions`, `views`, `reactions`, `comments`, `shares`, `clicks`
- `AnalyticsTag`:
  - `id`, `organizationId`, `key`, `type (AUTO|MANUAL)`
- `AnalyticsContentTag` (join)

**Note:** Khi implement cần quyết định: reuse `posts` của Postiz hay tạo bảng analytics content riêng. Kiến trúc này cho phép cả hai, nhưng **MVP khuyến nghị** bảng analytics riêng để không phá domain scheduling.

## API Contracts

- All endpoints require JWT + org context.
- Response should be consistent with Postiz conventions (cần verify trong codebase khi implement).
- Dates in JSON: ISO-8601 strings.

**API Response Rule:** Không tự ý invent response wrapper mới. Nếu Postiz trả “raw payload” (không `{data: ...}`), Analytics Intelligence phải bám theo đúng format đó.

### Example: Success Response (Daily Brief)

```json
{
  "date": "2025-12-13",
  "scope": {
    "groupId": "grp_123",
    "format": "reels"
  },
  "trends": [
    {
      "key": "mua-dong",
      "velocityWindowHours": 72,
      "score": 0.87,
      "evidence": {
        "viewsDeltaPct": 32,
        "sampleSize": 14
      }
    }
  ],
  "bestTimeSlots": [
    {
      "weekday": 5,
      "hour": 20,
      "score": 0.81
    }
  ],
  "recommendations": [
    {
      "type": "POST_TEMPLATE",
      "title": "Hook ngắn + CTA",
      "reason": "Top posts 7d có engagement rate cao nhất ở slot 20:00"
    }
  ]
}
```

### Example: Error Response (NestJS)

```json
{
  "statusCode": 400,
  "message": "Invalid date format",
  "error": "Bad Request"
}
```

## Security Architecture

- Token/integration secrets: không lưu plaintext (NFR-S1). Reuse Postiz integration storage + encryption approach.
- Authorization: org-scoped; chỉ owner/admin được cấu hình group/niche và tracking pages.
- Audit log (NFR-S2): MVP có thể chỉ log events, post-MVP nâng cấp table audit.

## Performance Considerations

- MVP 10–20 pages:
  - Pre-aggregate theo ngày + group/niche để dashboard <3s (NFR-P1)
  - Index đúng cho `(organizationId, date)` và các filter phổ biến
- Cache layer:
  - Có thể cache daily brief per org/group/date trong Redis (TTL 24h) để giảm load.

## Deployment Architecture

- Giữ flow deploy theo Postiz hiện tại (backend + frontend + workers/cron).
- Production: chạy workers/cron riêng process (PM2 scripts có sẵn).

**Deployment Target (explicit):**

- **Dev:** Docker Compose theo `docker-compose.dev.yaml` (Postgres + Redis) + chạy apps bằng `pnpm dev`.
- **Prod (baseline):** Docker-based deployment (phù hợp với scripts/compose) hoặc Railway (repo có `railway.toml`).

## Development Environment

### Prerequisites

- Node theo constraints repo
- pnpm
- Docker (Postgres + Redis) theo `docs/setup-guide.md`

### Setup Commands

```bash
# 1) from repo root
pnpm install

# 2) start dependencies
pnpm dev:docker

# 3) generate prisma client / push schema
a) pnpm prisma-generate
b) pnpm prisma-db-push

# 4) run all apps
pnpm dev
```

## Architecture Decision Records (ADRs)

1. **ADR-001:** Extend Postiz instead of new project
   - Rationale: reuse org/auth/integrations/queue infra, fastest path to MVP 2 tuần
2. **ADR-002:** Analytics Intelligence uses BullMQ jobs for ingestion/aggregation
   - Rationale: aligns với Postiz architecture, supports retry/backfill (NFR-I1)
3. **ADR-003:** Store analytics time-series in dedicated Prisma models
   - Rationale: query performance + separation from scheduling domain

---

_Generated by BMAD Decision Architecture Workflow v1.0_
_Date: 2025-12-13_
_For: Luis_
