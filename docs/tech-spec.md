# postiz-app — Tech Spec (Facebook Page Analytics)

**Author:** Luis

**Date:** 2025-12-13

**Version:** 1.0

---

## 1) Purpose

Tài liệu này chốt đặc tả kỹ thuật để triển khai MVP “Facebook Page Analytics” như một **extension** trong Postiz monorepo.

Mục tiêu của Tech Spec là làm rõ những điểm “implementation-ready” mà PRD/Epics/Architecture mới dừng ở mức định hướng:

- API contracts (request/response shape, filters, pagination)
- Data model tối thiểu + constraints
- Job semantics: idempotency, retry/backfill, partial failure behavior
- Error handling strategy
- Sequencing & Definition of Done ở mức kỹ thuật

---

## 2) Scope

### 2.1 In-scope (MVP)

- Connect và chọn **10–20 Facebook Pages ưu tiên** cho analytics
- Ingestion daily: content metadata + daily metrics
- Taxonomy:
  - Auto keyword/topic tagging (rule-based)
  - Manual campaign/series tags
- Dashboard query: filter theo group/niche + format + date range, KPI + top posts/reels
- Insights:
  - Trending velocity 24–72h (keyword-based)
  - Best time slots (7–14d)
- Daily Brief: trends + best time + top template recommendations (rule-based) + explainability
- Export CSV

### 2.2 Out-of-scope (MVP)

- Social listening/sentiment
- Competitor benchmarking sâu
- AI assistant phức tạp (LLM) cho “vì sao KPI thay đổi?”
- Auto publish/scheduler

---

## 3) System Context & Constraints

- Extend existing Postiz architecture (monorepo pnpm workspace)
- Multi-tenancy theo organization (org-scoped) + JWT auth
- Versions pin theo repo (tham chiếu `docs/architecture.md`)

---

## 4) Data Model (MVP)

> Lưu ý: Tên model có thể cần điều chỉnh theo conventions trong `schema.prisma`. Mục tiêu ở đây là **chốt semantics + constraints**.

### 4.1 Analytics tracking config

- **AnalyticsTrackedIntegration**
  - `id`
  - `organizationId`
  - `integrationId`
  - `enabled` (boolean)
  - `createdAt`, `updatedAt`

**Constraints:**

- Unique: `(organizationId, integrationId)`

### 4.2 Groups / Niches

- **AnalyticsPageGroup**
  - `id`
  - `organizationId`
  - `name`
  - `niche` (string, optional)
  - `createdAt`, `updatedAt`

- **AnalyticsPageGroupIntegration** (join)
  - `id`
  - `organizationId`
  - `groupId`
  - `integrationId`

**Constraints:**

- Unique: `(organizationId, groupId, integrationId)`
- Foreign keys scoped by `organizationId` (đảm bảo không cross-org)

### 4.3 Content metadata (optional table)

Tùy quyết định implement:

- Option A (**recommended MVP**): bảng analytics riêng để không đụng domain scheduling
- Option B: reuse Postiz posts (nếu đã có mapping external content đầy đủ)

**AnalyticsContent** (Option A)

- `id`
- `organizationId`
- `integrationId`
- `externalContentId` (string)
- `format` (enum: `REELS` | `POST`)
- `caption` (text)
- `hashtags` (string[] hoặc json)
- `publishedAt` (timestamp)
- `createdAt`, `updatedAt`

**Constraints:**

- Unique: `(organizationId, integrationId, externalContentId)`
- Index: `(organizationId, integrationId, publishedAt)`

### 4.4 Daily metrics time-series

- **AnalyticsContentMetricsDaily**
  - `id`
  - `organizationId`
  - `integrationId`
  - `externalContentId`
  - `date` (date)
  - `reach` (int, nullable)
  - `impressions` (int, nullable)
  - `views` (int, nullable)
  - `reactions` (int, nullable)
  - `comments` (int, nullable)
  - `shares` (int, nullable)
  - `clicks` (int, nullable)
  - `createdAt`, `updatedAt`

**Constraints:**

- Unique idempotency key: `(organizationId, integrationId, externalContentId, date)`
- Index: `(organizationId, date)` và `(organizationId, integrationId, date)`

### 4.5 Tags

- **AnalyticsTag**
  - `id`
  - `organizationId`
  - `key` (string)
  - `type` (enum: `AUTO` | `MANUAL`)
  - `createdAt`, `updatedAt`

**Constraints:**

- Unique: `(organizationId, key, type)`

- **AnalyticsContentTag** (join)
  - `id`
  - `organizationId`
  - `externalContentId`
  - `integrationId`
  - `tagId`

**Constraints:**

- Unique: `(organizationId, integrationId, externalContentId, tagId)`

---

## 5) API Contracts (MVP)

> Nguyên tắc: bám theo NestJS conventions của Postiz (`@UseGuards(AuthGuard('jwt'))` + `@GetOrg()`), không invent response wrapper mới.

### 5.1 Common query primitives

- `date`: ISO-8601 date (YYYY-MM-DD)
- `startDate`, `endDate`: ISO-8601 date
- `range`: one of `7d`, `14d`, `30d` (ưu tiên dùng range để đơn giản)
- `format`: `reels` | `post` | `all`
- `groupId`: string
- Pagination:
  - `page`: number (default 1)
  - `pageSize`: number (default 20, max 100)

### 5.2 Endpoints

#### 5.2.1 Tracked Pages

- `GET /analytics/tracked-pages`
  - Returns danh sách integrations đang bật analytics theo org.

- `PUT /analytics/tracked-pages`
  - Body: `{ integrationIds: string[] }`
  - Rule: max 20 (MVP)

**Errors:**

- 400 nếu vượt quota 20
- 404 nếu integrationId không thuộc org

#### 5.2.2 Groups/Niches

- `GET /analytics/groups`
- `POST /analytics/groups`
  - Body: `{ name: string, niche?: string }`
- `PUT /analytics/groups/:groupId`
  - Body: `{ name?: string, niche?: string }`
- `PUT /analytics/groups/:groupId/integrations`
  - Body: `{ integrationIds: string[] }`

#### 5.2.3 Dashboard

- `GET /analytics/dashboard`
  - Query: `groupId?`, `format=all`, `range=7d|14d|30d`, `startDate?`, `endDate?`

**Response (draft):**

```json
{
  "scope": { "groupId": "grp_123", "format": "reels", "range": "14d" },
  "kpis": {
    "reach": 123456,
    "views": 234567,
    "engagement": 3456,
    "engagementRate": 0.027
  },
  "topContent": [
    {
      "externalContentId": "123",
      "integrationId": "int_1",
      "format": "REELS",
      "publishedAt": "2025-12-10T12:00:00.000Z",
      "captionSnippet": "...",
      "metrics": { "views": 10000, "reach": 9000, "engagement": 300 }
    }
  ]
}
```

**Rules:**

- `engagement = reactions + comments + shares`
- `engagementRate = engagement / max(reach, 1)` nếu reach có; nếu reach null thì fallback `views` (document behavior trong code).

#### 5.2.4 Trends

- `GET /analytics/trends`
  - Query: `groupId?`, `windowHours=24|48|72` (default 72), `range=7d|14d` (default 7d), `format=all`

**Response (draft):**

```json
{
  "windowHours": 72,
  "items": [
    {
      "key": "mua-dong",
      "score": 0.87,
      "evidence": { "viewsDeltaPct": 32, "sampleSize": 14 }
    }
  ]
}
```

#### 5.2.5 Best Time

- `GET /analytics/best-time`
  - Query: `groupId?`, `range=7d|14d` (default 14d), `format=all`

**Response (draft):**

```json
{
  "range": "14d",
  "format": "reels",
  "slots": [
    { "weekday": 5, "hour": 20, "score": 0.81, "sampleSize": 18 }
  ]
}
```

#### 5.2.6 Daily Brief

- `GET /analytics/daily-brief`
  - Query: `date?` (default today), `groupId?`, `format=all`

**Response:** theo example trong `docs/architecture.md`.

#### 5.2.7 Export CSV

- `GET /analytics/export.csv`
  - Query: `groupId?`, `format=all`, `range=7d|14d|30d`, `startDate?`, `endDate?`

**Rules:**

- Content-Type: `text/csv`
- Filename: include org + date range

---

## 6) Jobs & Scheduling (MVP)

### 6.1 Jobs

- **Ingestion Job (daily)**
  - Input: `organizationId`, `integrationId`, `date`
  - Actions:
    - Fetch content list (posts/reels) for lookback window (recommend 7d for MVP)
    - Upsert `AnalyticsContent` (if using Option A)
    - Upsert `AnalyticsContentMetricsDaily` for `date`

- **Tagging Job (daily or after ingestion)**
  - Input: `organizationId`, `date`
  - Actions:
    - Extract keywords from caption + hashtags (rule-based)
    - Upsert AUTO tags + join table

- **Aggregation Job (daily)**
  - Input: `organizationId`, `date`
  - Actions:
    - Precompute rollups (optional MVP) hoặc compute on-demand

### 6.2 Idempotency

- Ingestion metrics MUST be idempotent via unique constraint `(orgId, integrationId, externalContentId, date)`.
- Upsert semantics: nếu record đã tồn tại, update fields; không tạo duplicate.

### 6.3 Retry & Backoff (NFR-I1)

- Retry policy (MVP):
  - attempts: 5
  - backoff: exponential (base 30s)
  - timeout per job: 60–120s (tùy call FB)

- Failure classification:
  - **Transient** (network, 5xx): retry
  - **Permanent** (invalid token, permission): mark integration as errored, stop retry until user re-auth

### 6.4 Partial failure behavior

- Nếu 1 integration fail ingestion trong ngày:
  - Job vẫn tiếp tục cho integrations khác
  - Daily Brief vẫn trả kết quả nhưng:
    - kèm explainability “data incomplete” (flag trong response hoặc log-only theo convention)

---

## 7) Error Handling Strategy

### 7.1 API

- Use NestJS standard exceptions:
  - 400: invalid date/range/query
  - 401: unauth
  - 403: forbidden (integration/group không thuộc org)
  - 404: not found

### 7.2 Jobs

- Logging tối thiểu (structured):
  - `organizationId`, `integrationId`, `jobId`, `date`
- Khi token invalid:
  - Emit log event + store minimal error state (nếu có nơi phù hợp trong Postiz) hoặc expose qua `/analytics/tracked-pages`.

---

## 8) Sequencing (Implementation Order)

- 1) Scaffold module + route stubs (Epic 1.1)
- 2) DB schema + migrations (Epic 1.2)
- 3) Tracking 10–20 pages (Epic 2.1)
- 4) Ingestion metadata + metrics daily (Epic 2.2, 2.3)
- 5) Groups/Niches mgmt + mapping (Epic 3.1)
- 6) Dashboard endpoint + basic FE (Epic 3.2)
- 7) Tagging + trends + best time (Epic 4.1–4.3)
- 8) Daily brief endpoint + FE (Epic 4.4)
- 9) Export CSV (Epic 5.1)

---

## 9) Testing (MVP)

- Unit tests:
  - Trend calculator
  - Best time slot calculator
- Integration tests:
  - `/analytics/dashboard`
  - `/analytics/daily-brief`
  - Auth + org scoping

---

## 10) Open Decisions (explicit)

1. **Data model choice:** reuse Postiz posts vs analytics content table (Option A vs B).
2. **Rollups:** pre-aggregate vs compute on-demand (MVP có thể on-demand để nhanh hơn, nhưng phải đảm bảo <3s).
3. **Where to store integration error state** (nếu Postiz đã có pattern, reuse).
