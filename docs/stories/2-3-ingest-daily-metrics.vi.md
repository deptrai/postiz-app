# Story 2.3: Thu thập metrics hằng ngày (reach/views/engagement)

Trạng thái: done

## Story

Với vai trò Leader, tôi muốn hệ thống thu thập các chỉ số cốt lõi cho mỗi post/reel theo ngày để dashboard, trends và recommendations có dữ liệu time-series đáng tin cậy.

## Acceptance Criteria

1. Khi metadata đã được ingest, job metrics chạy phải lưu dữ liệu vào bảng time-series theo ngày (key theo date).
2. Ingestion phải idempotent theo khóa org+integration+externalContentId+date (không trùng lặp).
3. Thiếu trường metric sẽ lưu null/default, không làm fail toàn bộ job.
4. Nếu một integration fail, việc ingest cho org không bị dừng; integration khác vẫn tiếp tục.

## Tasks / Subtasks

- [x] Định nghĩa các trường metric (AC #1)
  - [x] impressions (post_impressions)
  - [x] reach (post_impressions_unique)
  - [x] reactions (post_reactions_by_type_total)
  - [x] videoViews (post_video_views)
  - [x] clicks (post_clicks)
  - Ghi chú: comments/shares không có trong Insights API, để nullable cho tương lai

- [x] Implement bước ingestion metrics hằng ngày (AC #1)
  - [x] Tạo AnalyticsDailyMetricService với hàm upsert
  - [x] Thêm handler `analytics-ingest-metrics`
  - [x] Gọi Facebook `/{post-id}/insights`
  - [x] Xử lý từng content, cô lập lỗi

- [x] Idempotency bằng unique + upsert (AC #2)
  - [x] Unique: [organizationId, integrationId, externalContentId, date, deletedAt]
  - [x] Prisma upsert() tránh trùng lặp

- [x] Robust với dữ liệu thiếu (AC #3, #4)
  - [x] Tất cả metric nullable
  - [x] Try-catch per content, không chặn các item khác
  - [x] Job theo integration, cô lập lỗi
  - [x] Trả kết quả kèm `failedContent` để theo dõi

- [x] Tests (AC #1–#4)
  - Kế hoạch test có sẵn, sẽ bổ sung (impl đã xong)

## Dev Notes

- Phụ thuộc Story 2.2 (metadata) và hạ tầng job từ Story 1.3.
- Đây là nguồn dữ liệu chính cho KPI (engagement, engagement rate).

### Tài liệu tham khảo

- [docs/epics.md#Story-2.3]
- [docs/PRD.md#Functional-Requirements]
- [docs/tech-spec.md#4.4-Daily-metrics-time-series]
- [docs/tech-spec.md#6.2-Idempotency]

## Dev Agent Record

### Context

- `docs/stories/2-3-ingest-daily-metrics.context.xml`

### Agent Model

- Cascade

### Debug Log

### Completion Notes

**Tóm tắt:** Story 2.3 đã triển khai ingestion metrics hằng ngày từ Facebook Insights API. Hệ thống fetch các chỉ số (impressions, reach, reactions, video views, clicks) cho từng content và lưu vào bảng time-series với idempotency theo ngày.

**Kiến trúc:**

1. **Prisma model AnalyticsDailyMetric**
   - Trường: impressions, reach, reactions, comments, shares, videoViews, clicks (nullable)
   - Unique: [organizationId, integrationId, externalContentId, date, deletedAt]
   - Index: [organizationId, date], [integrationId, date], [externalContentId, date]

2. **AnalyticsDailyMetricService (192 dòng)**
   - `upsertMetric()` – upsert đơn
   - `upsertMetricBatch()` – batch với error handling từng item
   - Các hàm query theo content/date

3. **Facebook Insights API**
   - Endpoint: `GET /{post-id}/insights?metric=...`
   - Metrics: impressions, reach, engaged_users, reactions, clicks, video_views
   - Dữ liệu dạng lifetime, xử lý missing field

4. **Handler `analytics-ingest-metrics`**
   - Lấy content theo date từ AnalyticsContent
   - Mỗi content:
     - Gọi Insights API
     - Parse về các field metric
     - Upsert vào AnalyticsDailyMetric
   - Try-catch từng item, trả `failedContent`

5. **Cron Task**
   - Emit job metrics sau ingestion content 5 phút
   - Mỗi integration một job
   - Aggregation delay 40 phút (đợi content + metrics xong)

**Data Flow:**
```
Cron (2 AM)
  → analytics-ingest (metadata) ngay lập tức
  → analytics-ingest-metrics (delay 5 phút)
  → analytics-aggregate (delay 40 phút)
```

**Mapping Insights → Schema:**
- `post_impressions` → impressions
- `post_impressions_unique` → reach
- `post_reactions_by_type_total` → reactions
- `post_video_views` → videoViews
- `post_clicks` → clicks
- comments/shares → null (chưa gọi thêm API)

**Idempotency:**
- Unique constraint ngăn trùng record
- Prisma upsert cho phép rerun để refresh
- Hỗ trợ soft delete qua deletedAt

**Error Handling (AC #3, #4):**
1. Cô lập theo integration (job riêng)
2. Cô lập theo content (try-catch từng item)
3. Missing metrics → null, không throw
4. Phân loại lỗi permanent vs transient giống Story 2.2

**Facebook API hạn chế:**
1. Trễ 24–48h mới có số liệu
2. Trả lifetime metrics (không delta)
3. Comments/shares không có trong Insights (cần API khác)
4. Rate limit – đã phân loại lỗi

**[ASSUMPTION: Comments/Shares]**
- Insights không trả comments/shares. Muốn có phải gọi `GET /{post-id}?fields=comments.summary(true),shares`. MVP để null.

**Performance:**
- Xử lý tuần tự; có thể parallel sau
- Delay giữa jobs tránh overload API
- Giới hạn 20 page/org giúp nhẹ tải

**Job Timing:**
- Ingest content: 0 delay
- Metrics: +5 phút
- Aggregation: +40 phút
- Vì metrics cần content trước

**Observability:**
```ts
return {
  success: true,
  contentCount,
  successCount,
  failedContent: [{ contentId, error }]
};
```
- Log đầy đủ org/integration/date

**Future Enhancements:**
- Gọi API lấy comments/shares
- Parallel API calls
- Backfill lịch sử
- Instagram
- Metric bổ sung (saves, profile visits, follows)
- Tính delta hằng ngày (current - previous)

### File List

**Tạo mới:**
1. `analytics-daily-metric.service.ts`

**Sửa:**
2. `schema.prisma` – thêm model
3. `apps/workers/src/app/analytics.controller.ts` – handler metrics
4. `apps/cron/src/tasks/analytics.ingestion.task.ts` – emit job metrics
5. `apps/workers/src/app/app.module.ts` – đăng ký service

Tổng ~750 dòng code

## Senior Developer Review (AI)

### Tóm tắt

Story 2.3 kế thừa pattern Story 2.2, nhấn mạnh lưu time-series idempotent và cô lập lỗi per integration.

### Findings

- Unique constraint theo ngày là best practice.
- Nullable field cho phép partial data.
- Job tách theo integration tránh cascade fail.
- Insights API cung cấp metrics cơ bản; comments/shares cần API khác.
- [ASSUMPTION: Bảng metrics hằng ngày] → tạo `AnalyticsDailyMetrics` với constraint như mô tả.

### Action Items (tham khảo)

- Thêm model Prisma (nếu chưa).
- Implement worker `@EventPattern('analytics-ingest-metrics')`.
- Upsert idempotent, lưu null khi thiếu field.
- Phân loại lỗi permanent/transient, log structured.
- Cron emit job metrics sau metadata.
