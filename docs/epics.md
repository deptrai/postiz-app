# postiz-app - Epic Breakdown

**Author:** Luis
**Date:** 2025-12-13
**Project Level:** Level 3 (ước lượng) 
**Target Scale:** MVP 10–20 Facebook Pages (mở rộng sau)

---

## Overview

Tài liệu này phân rã yêu cầu từ [PRD](./PRD.md) thành các epic và user stories có thể triển khai theo kiểu **vertical slice** (mỗi story có thể hoàn thành trong 1 session tập trung).

### Epic Summary (sequencing đề xuất)

1. **Epic 1 — Foundation: Analytics Intelligence Module Scaffold**
   - Mục tiêu: dựng nền trong Postiz cho module analytics intelligence (schema, jobs, API skeleton, bảo mật token).
2. **Epic 2 — Ingestion & Storage (MVP)**
   - Mục tiêu: connect 10–20 pages, ingest dữ liệu daily, lưu metrics/metadata theo thời gian.
3. **Epic 3 — Dashboard & Core Analytics (MVP)**
   - Mục tiêu: dashboard filter theo page/group/niche + top posts/reels + KPI cơ bản.
4. **Epic 4 — Insights + Daily Brief + Recommendations (MVP)**
   - Mục tiêu: trending velocity, best time to post, daily brief action-first với explainability.
5. **Epic 5 — Export Reporting (MVP)**
   - Mục tiêu: export CSV theo date range, hỗ trợ workflow báo cáo tối thiểu.
6. **Epic 6 — Playbooks + Experiments (Growth)**
   - Mục tiêu: tạo playbook từ top posts/reels + variants + A/B/C experiments.
7. **Epic 7 — Themes (Topic Clustering) (Growth)**
   - Mục tiêu: cluster caption/hashtags thành themes + theme manager + theme trending.

---

## Epic 1: Foundation — Analytics Intelligence Module Scaffold

Thiết lập nền tảng kỹ thuật trong Postiz để các epic sau có thể triển khai nhanh và ổn định.

### Story 1.1: Khởi tạo module “Analytics Intelligence” trong backend + FE route stub

As a **Leader (owner)**,
I want **một module analytics intelligence có routing/API nền trong Postiz**,
So that **các tính năng MVP có thể được phát triển tuần tự mà không phá vỡ hệ thống hiện có**.

**Acceptance Criteria:**

**Given** codebase Postiz đang chạy (apps/backend + apps/frontend)
**When** tạo module backend (NestJS) và route FE stub cho daily brief
**Then** hệ thống build/run không lỗi và có endpoint stub trả dữ liệu giả lập

**And** route FE (hoặc sub-tab analytics) hiển thị placeholder screen

**Prerequisites:** None

**Technical Notes:**
- Tạo module/service/controller mới hoặc mở rộng analytics module hiện có theo convention Postiz.
- Chuẩn bị path API dự kiến: `/analytics/daily-brief`, `/analytics/playbooks`, `/analytics/themes` (stub).
- FR coverage: FR-014, FR-015 (skeleton).

### Story 1.2: Thiết kế schema nền (Prisma) cho PageGroup/Niche, Tags, Metrics time-series

As a **Leader**,
I want **có schema DB cho group/niche, tags và metrics theo ngày**,
So that **có thể ingest và phân tích dữ liệu theo thời gian**.

**Acceptance Criteria:**

**Given** Prisma schema của Postiz
**When** bổ sung các bảng tối thiểu cho analytics intelligence
**Then** migrate/push schema thành công và không phá vỡ bảng hiện hữu

**And** có index cơ bản cho query theo org/integration/date

**Prerequisites:** Story 1.1

**Technical Notes:**
- Ưu tiên mapping vào mô hình org/workspace/integration có sẵn.
- Bảng đề xuất (tên có thể điều chỉnh theo conventions):
  - `AnalyticsPageGroup` (orgId, name, niche)
  - `AnalyticsTag` (orgId, key, type: auto/manual)
  - `AnalyticsPostMetricsDaily` (orgId, integrationId, postId, date, reach/impressions, views, reactions, comments, shares, clicks)
  - `AnalyticsContentTagMap` (postId, tagId)
- FR coverage: FR-002, FR-004, FR-005, FR-006, FR-007.

### Story 1.3: Job/queue scaffold cho ingestion & aggregation (daily)

As a **Leader**,
I want **job nền chạy theo lịch để ingest/aggregate dữ liệu**,
So that **MVP có thể chạy ổn định mỗi ngày cho 10–20 pages**.

**Acceptance Criteria:**

**Given** Redis/BullMQ đã có trong Postiz
**When** thêm job schedule ingestion daily + job aggregation daily
**Then** job có thể enqueue/run trên môi trường dev

**And** có logging + retry policy tối thiểu

**And** job failures được phân loại tối thiểu:
 - transient (network/5xx) → retry theo policy
 - permanent (invalid token/permission) → dừng retry và ghi rõ lý do

**And** logs tối thiểu phải include: `organizationId`, `integrationId`, `jobId`, `date`

**Prerequisites:** Story 1.1

**Technical Notes:**
- Gắn job vào org/integration.
- Chuẩn bị hook để mở rộng backfill/retry (NFR-I1).
- FR coverage: FR-003, NFR-C1, NFR-I1.

---

## Epic 2: Ingestion & Storage (MVP)

Triển khai ingest dữ liệu thực (daily) cho 10–20 pages và lưu time-series.

### Story 2.1: Chọn và quản lý 10–20 Facebook Pages ưu tiên (connect + list)

As a **Leader**,
I want **kết nối và chọn 10–20 pages ưu tiên để phân tích**,
So that **MVP có scope nhỏ, ổn định và đạt mục tiêu 2 tuần**.

**Acceptance Criteria:**

**Given** Postiz đã có integrations
**When** Leader chọn 10–20 pages/integrations để bật analytics intelligence
**Then** hệ thống lưu danh sách ưu tiên theo org

**And** UI/API trả danh sách pages đang được theo dõi

**Prerequisites:** Story 1.1

**Technical Notes:**
- Có thể tận dụng integrations list và thêm flag/config cho analytics.
- FR coverage: FR-001.

### Story 2.2: Ingest metadata nội dung (caption, hashtags, format, publish time)

As a **Leader**,
I want **hệ thống ingest metadata của post/reel**,
So that **có thể làm tagging và phân tích theo format/hook**.

**Acceptance Criteria:**

**Given** danh sách pages ưu tiên
**When** job ingestion chạy
**Then** metadata được lưu và liên kết đúng với integration/page

**And** có phân biệt format: reels vs post thường (ít nhất bằng type)

**And** ingestion metadata phải idempotent (không tạo duplicate) theo key org+integration+externalContentId

**And** nếu 1 integration fail ingestion:
 - transient → retry theo policy
 - permanent (token invalid/permission) → ghi lỗi rõ ràng và không retry vô hạn

**Prerequisites:** Story 2.1

**Technical Notes:**
- FR coverage: FR-004.

### Story 2.3: Ingest metrics cơ bản theo ngày (reach/views/engagement)

As a **Leader**,
I want **ingest metrics cơ bản theo ngày cho mỗi post/reel**,
So that **dashboard/trends/recommendations có dữ liệu để chạy**.

**Acceptance Criteria:**

**Given** metadata đã được ingest
**When** job ingestion lấy metrics
**Then** lưu vào bảng time-series theo date

**And** không tạo duplicate record (idempotent theo org+post+date)

**And** nếu 1 số metrics fields không có, hệ thống lưu `null`/default hợp lý và không fail toàn bộ job

**And** nếu 1 integration lỗi thì job không fail toàn bộ org; các integration còn lại vẫn được ingest

**Prerequisites:** Story 2.2

**Technical Notes:**
- Metrics tối thiểu theo PRD: reach/impressions, views (nếu có), reactions, comments, shares, clicks (optional).
- FR coverage: FR-003, FR-005.

---

## Epic 3: Dashboard & Core Analytics (MVP)

Dashboard cho phép filter theo group/niche/format/date và hiển thị top content.

### Story 3.1: Quản lý Page Groups/Niches và gán pages vào group

As a **Leader**,
I want **tạo Page Groups/Niches và gán pages vào group**,
So that **mọi analytics/trends đều theo group/niche để giảm nhiễu**.

**Acceptance Criteria:**

**Given** danh sách pages ưu tiên
**When** Leader tạo group/niche và gán pages
**Then** group/niche được lưu theo org

**And** dashboard có thể filter theo group/niche

**Prerequisites:** Story 2.1

**Technical Notes:**
- FR coverage: FR-002.

### Story 3.2: Dashboard core — filter + KPI cards + top posts/reels

As a **Leader**,
I want **dashboard có filter và hiển thị KPI + top posts/reels**,
So that **tôi nhìn nhanh cái gì đang hoạt động tốt**.

**Acceptance Criteria:**

**Given** metrics daily đã có
**When** Leader chọn page/group/niche + date range + format
**Then** dashboard hiển thị KPI cards (reach/views, engagement, engagement rate)

**And** hiển thị danh sách top content theo KPI

**Prerequisites:** Story 2.3, Story 3.1

**Technical Notes:**
- FR coverage: FR-008, FR-009.

### Story 3.3: Tính engagement rate và breakdown theo format (Reels vs post)

As a **Leader**,
I want **engagement rate và breakdown theo format**,
So that **tôi biết format nào đang thắng theo niche**.

**Acceptance Criteria:**

**Given** metrics có reactions/comments/shares và reach
**When** hiển thị dashboard
**Then** engagement rate được tính đúng và có view breakdown theo format

**Prerequisites:** Story 3.2

**Technical Notes:**
- FR coverage: FR-009 (mở rộng), FR-013 (chuẩn bị).

---

## Epic 4: Insights + Daily Brief + Recommendations (MVP)

Tạo insight và daily brief action-first: trend velocity + best time + recommendations có explainability.

### Story 4.1: Auto keyword/topic tagging (MVP) + manual campaign tag

As a **Leader**,
I want **auto tagging theo keyword/topic và manual campaign tag**,
So that **tôi phân tích theo content pillars/campaign**.

**Acceptance Criteria:**

**Given** metadata caption/hashtags
**When** job tagging chạy hoặc trigger theo schedule
**Then** hệ thống tạo auto tags và gán vào content

**And** user có thể tạo/gán manual campaign tag

**Prerequisites:** Story 2.2, Story 1.2

**Technical Notes:**
- Rule-based keyword extraction cho MVP.
- FR coverage: FR-006, FR-007.

### Story 4.2: Trending topics/pillars theo velocity 24–72h (MVP keyword-based)

As a **Leader**,
I want **danh sách trending topics/pillars theo velocity**,
So that **tôi bắt trend nhanh trong từng niche**.

**Acceptance Criteria:**

**Given** tags + metrics time-series
**When** Leader xem Insights
**Then** hệ thống hiển thị top trending topics/pillars theo group/niche

**And** trend có “vì sao” (velocity + metrics)

**Prerequisites:** Story 4.1, Story 2.3

**Technical Notes:**
- FR coverage: FR-010, FR-011.

### Story 4.3: Best time to post (heatmap đơn giản) theo group/niche

As a **Leader**,
I want **best time slots theo group/niche**,
So that **tôi đăng đúng giờ để tăng view và tương tác**.

**Acceptance Criteria:**

**Given** dữ liệu 7–14 ngày
**When** Leader xem Insights
**Then** hệ thống hiển thị heatmap/slot gợi ý theo group/niche

**And** nếu đủ dữ liệu thì phân biệt Reels vs post thường

**Prerequisites:** Story 2.3, Story 3.1

**Technical Notes:**
- FR coverage: FR-012, FR-013.

### Story 4.4: Daily Brief endpoint + UI (top topics + best time + top template)

As a **Leader**,
I want **Daily Brief mỗi ngày**,
So that **tôi ra quyết định content trong <5 phút**.

**Acceptance Criteria:**

**Given** trend + best time + top content
**When** Leader mở Daily Brief
**Then** hệ thống hiển thị:
- Top topics/pillars (trend)
- Best time slots
- Top post template (heuristics)

**And** mỗi recommendation có explainability

**And** nếu ingestion trong ngày bị thiếu (partial), Daily Brief vẫn trả response nhưng kèm dấu hiệu/giải thích rằng dữ liệu chưa đầy đủ

**And** lỗi query/invalid date được trả theo chuẩn NestJS (400 với message rõ ràng)

**Prerequisites:** Story 4.2, Story 4.3

**Technical Notes:**
- FR coverage: FR-014, FR-015.

---

## Epic 5: Export Reporting (MVP)

### Story 5.1: Export CSV report theo date range (page/group/niche)

As a **Leader**,
I want **export CSV report**,
So that **tôi có thể lưu và phân tích thêm hoặc gửi cho team**.

**Acceptance Criteria:**

**Given** dashboard/insights data
**When** user chọn date range + scope
**Then** hệ thống trả file CSV download

**And** CSV có các cột KPI tối thiểu theo PRD

**Prerequisites:** Story 3.2, Story 4.2

**Technical Notes:**
- FR coverage: FR-016.

---

## Epic 6: Playbooks + Experiments (Growth)

Ưu tiên #1 sau MVP.

### Story 6.1: Sinh Playbooks từ top posts/reels 14–30 ngày

As a **Leader**,
I want **tạo Playbooks (công thức thắng) từ top content**,
So that **tôi có thể copy công thức để tăng view/tương tác**.

**Acceptance Criteria:**

**Given** dữ liệu 14–30 ngày
**When** hệ thống chạy playbook generator
**Then** tạo playbook theo group/niche/pillar/format

**And** playbook có recipe + evidence (median reach/views, engagement rate, consistency)

**Prerequisites:** Epic 2–4 MVP complete

**Technical Notes:**
- FR coverage: FR-017.

### Story 6.2: Tạo variants (3–5) cho mỗi playbook

As a **Leader**,
I want **variants cho playbook**,
So that **tôi thử nhanh các biến thể hook/time/hashtags**.

**Acceptance Criteria:**

**Given** một playbook
**When** user mở playbook
**Then** hệ thống hiển thị 3–5 variants và cách áp dụng

**Prerequisites:** Story 6.1

**Technical Notes:**
- FR coverage: FR-018.

### Story 6.3: Experiments A/B/C + win rate

As a **Leader**,
I want **tạo experiment A/B/C từ variants**,
So that **hệ thống đo variant nào win và cập nhật playbook**.

**Acceptance Criteria:**

**Given** variants đã có
**When** user tạo experiment và chọn timeframe
**Then** hệ thống theo dõi kết quả và tính win rate

**And** cập nhật playbook score

**Prerequisites:** Story 6.2

**Technical Notes:**
- FR coverage: FR-019.

---

## Epic 7: Themes (Topic Clustering) (Growth)

Ưu tiên #2 sau MVP.

### Story 7.1: Clustering caption/hashtags thành Themes

As a **Leader**,
I want **themes (cluster) thay vì keyword rời rạc**,
So that **trend detection ít noise và actionable hơn**.

**Acceptance Criteria:**

**Given** caption/hashtags + tags
**When** chạy clustering pipeline
**Then** hệ thống tạo themes với top keywords đại diện

**Prerequisites:** Epic 2–4 MVP complete

**Technical Notes:**
- FR coverage: FR-020.

### Story 7.2: Theme manager (rename/merge/split)

As a **Leader**,
I want **quản lý themes (đổi tên/gộp/tách)**,
So that **themes ngày càng đúng với niche của tôi**.

**Acceptance Criteria:**

**Given** themes đã tạo
**When** user rename/merge/split
**Then** hệ thống cập nhật mapping và giữ traceability lịch sử

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR coverage: FR-021.

### Story 7.3: Theme trending thay cho keyword trending

As a **Leader**,
I want **trend list theo theme**,
So that **Daily Brief chỉ ra chủ đề đang lên một cách rõ ràng**.

**Acceptance Criteria:**

**Given** themes + metrics
**When** user xem Insights/Daily Brief
**Then** trend hiển thị theo theme (velocity + explainability)

**And** có link tới top posts liên quan

**Prerequisites:** Story 7.1

**Technical Notes:**
- FR coverage: FR-022.

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
