# postiz-app - Epic Breakdown

**Author:** Luis
**Date:** 2025-12-13
**Project Level:** Level 3 (ước lượng) 
**Target Scale:** MVP 10–20 Facebook Pages (mở rộng sau)

---

## Overview

Tài liệu này phân rã yêu cầu từ [PRD](./PRD.md) thành các epic và user stories có thể triển khai theo kiểu **vertical slice** (mỗi story có thể hoàn thành trong 1 session tập trung).

### Epic Summary (sequencing đề xuất)

**MVP (Epic 1-5):**
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

**Growth Phase 1 (Epic 6-7):**
6. **Epic 6 — Playbooks + Experiments (Growth)**
   - Mục tiêu: tạo playbook từ top posts/reels + variants + A/B/C experiments.
7. **Epic 7 — Themes (Topic Clustering) (Growth)**
   - Mục tiêu: cluster caption/hashtags thành themes + theme manager + theme trending.

**Growth Phase 2 - Monetization & Viral (Epic 13-14, 16):**
13. **Epic 13 — Monetization Readiness Tracker (Growth) ⭐**
    - Mục tiêu: track tiến độ monetization, gap analysis, alerts khi gần đạt eligibility.
14. **Epic 14 — Viral Content Optimizer (Growth)**
    - Mục tiêu: viral score prediction, hook analyzer, optimal timing, content elements analysis.
16. **Epic 16 — Content Quality Scoring (Growth)**
    - Mục tiêu: quality score, engagement bait detection, policy compliance, advertiser-friendly scoring.

**Growth Phase 3 - Alerts & AI (Epic 8-9):**
8. **Epic 8 — Alerts & Anomaly Detection (Growth)**
   - Mục tiêu: KPI drop alerts, viral spike detection, notification channels.
9. **Epic 9 — AI Content Assistant (Growth)**
   - Mục tiêu: GenAI Q&A analytics, AI caption generator, hook optimizer.

**Growth Phase 4 - Advanced (Epic 10-12):**
10. **Epic 10 — Report Automation (Growth)**
    - Mục tiêu: scheduled reports, PDF/PPT export, Telegram bot.
11. **Epic 11 — Industry Benchmarking (Growth)**
    - Mục tiêu: industry averages comparison, performance gap analysis.
12. **Epic 12 — Content Recycling (Growth)**
    - Mục tiêu: evergreen content detection, repost suggestions.

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

## Epic 8: Alerts & Anomaly Detection (Growth)

Ưu tiên #3 sau Monetization.

### Story 8.1: KPI Drop Alerts

As a **Leader**,
I want **nhận cảnh báo khi KPI tụt đột ngột**,
So that **tôi có thể phản ứng nhanh và điều chỉnh chiến lược**.

**Acceptance Criteria:**

**Given** metrics daily đã có
**When** engagement rate giảm >20% so với 7 ngày trước
**Then** hệ thống gửi alert với chi tiết và gợi ý

**And** thresholds có thể configure theo group/niche

**Prerequisites:** Epic 2-4 MVP complete

**Technical Notes:**
- Background job check thresholds daily
- Notification service (email/in-app)

### Story 8.2: Viral Spike Detection

As a **Leader**,
I want **phát hiện content đang viral**,
So that **tôi có thể tận dụng momentum**.

**Acceptance Criteria:**

**Given** metrics real-time hoặc daily
**When** engagement spike >200% trong 24h
**Then** hệ thống highlight viral content và gợi ý follow-up

**Prerequisites:** Story 8.1

### Story 8.3: Notification Channels

As a **Leader**,
I want **nhận alerts qua email/telegram**,
So that **tôi không bỏ lỡ thông tin quan trọng**.

**Acceptance Criteria:**

**Given** alert được trigger
**When** user đã configure notification preferences
**Then** hệ thống gửi qua channels đã chọn

**Prerequisites:** Story 8.1

---

## Epic 9: AI Content Assistant (Growth)

Ưu tiên #4 - Major differentiator.

### Story 9.1: GenAI Q&A Analytics

As a **Leader**,
I want **hỏi AI "vì sao KPI thay đổi?"**,
So that **tôi hiểu nguyên nhân và có action rõ ràng**.

**Acceptance Criteria:**

**Given** analytics data đã có
**When** user hỏi natural language question
**Then** AI trả lời dựa trên data với explainability

**Prerequisites:** Epic 2-4 MVP complete, LLM API integration

**Technical Notes:**
- OpenAI/Claude API integration
- Prompt engineering cho analytics context
- Rate limiting và cost management

### Story 9.2: AI Caption Generator

As a **Leader**,
I want **AI tạo caption từ playbook templates**,
So that **tôi tiết kiệm thời gian viết content**.

**Acceptance Criteria:**

**Given** playbook template
**When** user request caption generation
**Then** AI tạo 3-5 variants với tone/style customizable

**Prerequisites:** Story 9.1, Epic 6 complete

### Story 9.3: Hook Optimizer

As a **Leader**,
I want **AI gợi ý hooks hiệu quả**,
So that **content của tôi thu hút hơn**.

**Acceptance Criteria:**

**Given** top-performing hooks database
**When** user request hook suggestions
**Then** AI generate hook variants based on niche/format

**Prerequisites:** Story 9.1

---

## Epic 10: Report Automation (Growth)

Ưu tiên #5 - Nice-to-have.

### Story 10.1: Scheduled Reports

As a **Leader**,
I want **báo cáo tự động theo lịch**,
So that **tôi và team luôn có data cập nhật**.

**Acceptance Criteria:**

**Given** report configuration
**When** schedule trigger (daily/weekly/monthly)
**Then** hệ thống generate và gửi report

**Prerequisites:** Epic 5 complete

### Story 10.2: PDF/PPT Export

As a **Leader**,
I want **export báo cáo dạng PDF/PPT**,
So that **tôi có thể present cho stakeholders**.

**Acceptance Criteria:**

**Given** report data
**When** user request PDF/PPT export
**Then** hệ thống generate file với professional template

**Prerequisites:** Story 10.1

### Story 10.3: Telegram Bot Reports

As a **Leader**,
I want **nhận báo cáo qua Telegram**,
So that **tôi xem nhanh trên mobile**.

**Acceptance Criteria:**

**Given** Telegram bot configured
**When** schedule trigger hoặc user command
**Then** bot gửi summary report

**Prerequisites:** Story 10.1

---

## Epic 11: Industry Benchmarking (Growth)

Ưu tiên #6 - Revised from Competitor Benchmarking.

### Story 11.1: Industry Averages Dashboard

As a **Leader**,
I want **so sánh metrics với industry averages**,
So that **tôi biết mình đang ở đâu**.

**Acceptance Criteria:**

**Given** industry benchmark data
**When** user xem dashboard
**Then** hiển thị comparison với averages theo niche

**Prerequisites:** Epic 3 complete

**Technical Notes:**
- Dùng industry averages (không scrape competitors)
- User có thể manual input competitor data

### Story 11.2: Performance Gap Analysis

As a **Leader**,
I want **phân tích gap với benchmarks**,
So that **tôi biết cần cải thiện gì**.

**Acceptance Criteria:**

**Given** own metrics và benchmarks
**When** user request gap analysis
**Then** hệ thống highlight gaps và gợi ý improvements

**Prerequisites:** Story 11.1

---

## Epic 12: Content Recycling (Growth)

Ưu tiên #7 - Lower priority.

### Story 12.1: Evergreen Content Detection

As a **Leader**,
I want **phát hiện evergreen content**,
So that **tôi có thể repost hiệu quả**.

**Acceptance Criteria:**

**Given** historical content performance
**When** hệ thống analyze patterns
**Then** identify content với consistent performance over time

**Prerequisites:** Epic 2-4 complete

### Story 12.2: Repost Suggestions

As a **Leader**,
I want **gợi ý repost timing**,
So that **tôi maximize reach của evergreen content**.

**Acceptance Criteria:**

**Given** evergreen content identified
**When** user xem suggestions
**Then** hệ thống recommend optimal repost timing

**Prerequisites:** Story 12.1

---

## Epic 13: Monetization Readiness Tracker (Growth) ⭐

Ưu tiên #1 - TOP PRIORITY sau Epic 7.

### Story 13.1: Monetization Dashboard

As a **Leader**,
I want **dashboard hiển thị tiến độ monetization**,
So that **tôi biết còn thiếu gì để bật kiếm tiền**.

**Acceptance Criteria:**

**Given** page metrics (followers, watch time, engagement)
**When** user xem monetization dashboard
**Then** hiển thị progress bars cho từng monetization feature

**And** estimated time to eligibility

**Prerequisites:** Epic 2 complete

**Technical Notes:**
- Thresholds: In-Stream Ads (10K followers, 30K 1-min views), Reels (600K viewed minutes), Stars (500 followers), Fan Subscription (10K followers, 180K minutes)

### Story 13.2: Gap Analysis & Recommendations

As a **Leader**,
I want **phân tích gap và gợi ý cách đạt eligibility**,
So that **tôi có action plan rõ ràng**.

**Acceptance Criteria:**

**Given** current metrics và thresholds
**When** user xem gap analysis
**Then** hiển thị "Bạn cần thêm X followers, Y watch minutes"

**And** gợi ý content types để tăng metrics

**Prerequisites:** Story 13.1

### Story 13.3: Monetization Alerts

As a **Leader**,
I want **nhận thông báo khi gần đạt eligibility**,
So that **tôi không bỏ lỡ cơ hội**.

**Acceptance Criteria:**

**Given** progress tracking
**When** đạt 80%, 90%, 100% thresholds
**Then** hệ thống gửi celebration/warning notifications

**Prerequisites:** Story 13.1

### Story 13.4: Watch Time Analytics

As a **Leader**,
I want **analytics chi tiết về watch time**,
So that **tôi hiểu viewer behavior và tối ưu cho monetization**.

**Acceptance Criteria:**

**Given** video metrics
**When** user xem watch time analytics
**Then** hiển thị total watch time, average view duration, completion rate

**Prerequisites:** Story 13.1

**Technical Notes:**
- Merged from Epic 15.1

---

## Epic 14: Viral Content Optimizer (Growth)

Ưu tiên #2 sau Monetization.

### Story 14.1: Viral Score Prediction

As a **Leader**,
I want **dự đoán viral score trước khi đăng**,
So that **tôi biết content nào có tiềm năng cao**.

**Acceptance Criteria:**

**Given** content metadata (caption, hashtags, format, timing)
**When** user request viral score
**Then** hệ thống return score 0-100 với breakdown

**Prerequisites:** Epic 2-4 complete

**Technical Notes:**
- MVP: Rule-based scoring (không ML)
- Factors: engagement rate history, timing, format, hashtags

### Story 14.2: Hook Analyzer

As a **Leader**,
I want **phân tích hook effectiveness**,
So that **tôi tạo hooks thu hút hơn**.

**Acceptance Criteria:**

**Given** video content
**When** user request hook analysis
**Then** hệ thống analyze 3 giây đầu và compare với viral hooks

**Prerequisites:** Story 14.1

### Story 14.3: Optimal Viral Timing

As a **Leader**,
I want **biết thời điểm tốt nhất để viral**,
So that **tôi maximize reach potential**.

**Acceptance Criteria:**

**Given** historical viral content data
**When** user request optimal timing
**Then** hệ thống recommend posting windows cho viral potential

**Prerequisites:** Story 14.1

### Story 14.4: Content Elements Analysis

As a **Leader**,
I want **phân tích elements của viral content**,
So that **tôi có thể replicate success**.

**Acceptance Criteria:**

**Given** top-performing content
**When** user request elements analysis
**Then** hệ thống breakdown: caption style, hashtags, format, CTA

**Prerequisites:** Story 14.1

---

## Epic 16: Content Quality Scoring (Growth)

Ưu tiên #2 cùng với Epic 14.

### Story 16.1: Quality Score Dashboard

As a **Leader**,
I want **quality score cho mỗi post/video**,
So that **tôi biết content nào cần cải thiện**.

**Acceptance Criteria:**

**Given** content metrics
**When** user xem quality dashboard
**Then** hiển thị overall score 0-100 với breakdown

**Prerequisites:** Epic 2-4 complete

### Story 16.2: Engagement Bait Detection

As a **Leader**,
I want **phát hiện engagement bait**,
So that **tôi tránh bị Facebook phạt**.

**Acceptance Criteria:**

**Given** content caption
**When** hệ thống analyze
**Then** flag clickbait patterns ("LIKE this!", "SHARE now!")

**And** suggest authentic alternatives

**Prerequisites:** Story 16.1

**Technical Notes:**
- MVP: Rule-based keyword detection
- Phase 2: NLP model

### Story 16.3: Policy Compliance Check

As a **Leader**,
I want **check policy compliance trước khi đăng**,
So that **tôi không mất monetization eligibility**.

**Acceptance Criteria:**

**Given** content draft
**When** user request compliance check
**Then** hệ thống flag potential violations và suggest fixes

**Prerequisites:** Story 16.1

### Story 16.4: Advertiser-Friendly Scoring

As a **Leader**,
I want **biết content có advertiser-friendly không**,
So that **tôi maximize ad revenue**.

**Acceptance Criteria:**

**Given** content
**When** user request ad-friendly score
**Then** hệ thống score và flag sensitive topics

**Prerequisites:** Story 16.1

---

_For implementation: Use the `create-story` workflow to generate individual story implementation plans from this epic breakdown._
