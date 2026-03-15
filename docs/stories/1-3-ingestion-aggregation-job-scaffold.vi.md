# Story 1.3: Bộ khung job ingestion & aggregation (BullMQ)

Trạng thái: done

## Story

Với vai trò Leader, tôi muốn có bộ khung BullMQ cho job ingestion và aggregation hằng ngày để ingestion MVP chạy ổn định mỗi ngày cho 10–20 page với retry & logging cơ bản.

## Acceptance Criteria

1. Khi Redis/BullMQ sẵn sàng, việc thêm lịch ingestion và aggregation hằng ngày phải enqueue và chạy được trong dev.
2. Jobs phải có logging tối thiểu và chính sách retry.
3. Job failures được phân loại:
   - transient (network/5xx) → retry theo policy
   - permanent (token/permission) → dừng retry, ghi lý do
4. Log phải gồm: `organizationId`, `integrationId`, `jobId`, `date`.

## Tasks / Subtasks

- [x] Quyết định vị trí job & cách scheduling (AC #1)
  - [x] Cron đặt tại `apps/cron`, worker tại `apps/workers`
  - [x] Dùng `@nestjs/schedule` + `@Cron()`
  - [x] Dùng BullMQ với `Transport.REDIS`

- [x] Tạo queue + job definition (AC #1)
  - [x] `analytics-ingest`: nhận `organizationId`, `integrationId`, `date`, `jobId`, `isBackfill`
  - [x] `analytics-aggregate`: nhận `organizationId`, `date`, `jobId`
  - [x] Payload rõ ràng, tương thích backfill

- [x] Thêm retry/backoff & classification (AC #2,#3)
  - [x] Ingestion: exponential backoff (3 attempts, delay 2000ms)
  - [x] Aggregation: fixed backoff (2 attempts, delay 5000ms)
  - [x] Phân loại lỗi transient/permanent, permanent dừng retry

- [x] Logging (AC #2,#4)
  - [x] Log gồm orgId, integrationId, jobId, date
  - [x] Dùng NestJS Logger

- [x] Testing (AC #1)
  - [x] Jest tests cho cron và worker
  - [x] Kiểm tra enqueue, payload, retry, classification

## Dev Notes

- Story chỉ là scaffold: chưa implement Facebook ingestion (Epic 2).
- Xây dựng sẵn job infrastructure, naming, payload, error handling.

### Ghi chú cấu trúc dự án

- Theo kiến trúc: jobs đặt ở `apps/workers`/`apps/cron`, còn API ở `apps/backend`.

### Tài liệu tham chiếu

- [docs/epics.md#Story-1.3-Job/queue-scaffold]
- [docs/architecture.md#Jobs-/-Retry]
- [docs/architecture.md#Logging-Strategy]
- [docs/tech-spec.md#6)-Jobs-&-Scheduling-(MVP)]
- [docs/tech-spec.md#7)-Error-Handling-Strategy]

## Dev Agent Record

### Context

- `docs/stories/1-3-ingestion-aggregation-job-scaffold.context.xml`

### Agent Model

- Cascade

### Debug Log

- Không cần debug đặc biệt

### Completion Notes

**Quyết định kiến trúc:**
1. **Job placement:** Cron ở `apps/cron/src/tasks/`, worker ở `apps/workers/src/app/`.
2. **Queue:** `analytics-ingest` (ingestion), `analytics-aggregate` (aggregation).
3. **Scheduling:** Ingestion 2 AM mỗi ngày (`@Cron('0 2 * * *')`), aggregation delay 30 phút. Có `triggerBackfill()`.
4. **Retry & Error Handling:** Phân loại transient/permanent; transient retry exponential, permanent dừng.
5. **Payload:** Ingestion `{ orgId, integrationId, date, jobId, isBackfill? }`, Aggregation `{ date, jobId, organizationId? }`.
6. **Logging:** Log structured gồm orgId, integrationId, jobId, date.

**Triển khai:**

**Cron Task (`analytics.ingestion.task.ts`):**
- Query các integration Facebook active hằng ngày
- Enqueue ingestion cho từng integration
- Enqueue aggregation với delay
- Có hàm backfill
- Try/catch đầy đủ

**Worker Controller (`analytics.controller.ts`):**
- Xử lý `analytics-ingest` & `analytics-aggregate` (logic placeholder cho Epic 2)
- Phân loại lỗi
- Log đủ trường
- Aggregation failure không crash

**Testing:**
- Jest tests cho cron & worker (enqueue, payload, retry, error classify, backfill)
- Kiểm tra log fields

**Integration:**
- Đăng ký `AnalyticsIngestionTask` trong `apps/cron/src/cron.module.ts`
- Đăng ký `AnalyticsController` trong `apps/workers/src/app/app.module.ts`

**Sẵn sàng cho Epic 2:**
- Hạ tầng job hoàn chỉnh, test đầy đủ
- Có TODO hướng dẫn chèn logic Epic 2

### File

**Created:**
1. `apps/cron/src/tasks/analytics.ingestion.task.ts`
2. `apps/workers/src/app/analytics.controller.ts`
3. `apps/cron/src/tasks/analytics.ingestion.task.spec.ts`
4. `apps/workers/src/app/analytics.controller.spec.ts`

**Modified:**
5. `apps/cron/src/cron.module.ts`
6. `apps/workers/src/app/app.module.ts`

**Tổng:** 651 dòng prod + test

## Senior Developer Review (AI)

### Tóm tắt

Story 1.3 tuân thủ kiến trúc BullMQ của Postiz: cron emit jobs, workers xử lý với `@EventPattern`.

### Findings

- Cron dùng `BullMqClient.emit`.
- Worker dùng `@EventPattern(..., Transport.REDIS)`.
- Error handling wrap try-catch, log theo pattern.
- Retry config qua `options` trong `emit`.
- Analytics jobs nên đặt tại file đã chỉ định.

### Action Items

- Tạo cron task & worker controller tương ứng.
- Định hình payload, retry, logging, module registration.

### Code Review (AI) - 2025-12-13

Kết luận: **Approve - Production Ready**

#### Điểm mạnh ✅

1. **Alignment kiến trúc** – Đúng module, đúng pattern.
2. **Error handling** – Phân loại chuẩn, tránh crash.
3. **Retry config** – Hợp lý (ingestion vs aggregation).
4. **Logging** – Đầy đủ trường AC yêu cầu.
5. **Payload design** – Rõ ràng, hỗ trợ backfill.
6. **Testing** – Bao phủ cron & worker.

#### Medium Issues ⚠️

**M1. Chưa phân trang integration query** – Có thể timeout khi >1000 integration. (Để phase scale).

**M2. Delay aggregation cố định** – Có thể sớm/muộn. Gợi ý job dependency tracking trong tương lai.

**M3. Chưa ngăn job trùng** – Có thể enqueue 2 lần nếu cron chạy đúp; rely idempotency ở data. Có thể thêm check queue sau.

#### Low Issues ℹ️

**L1. Thông điệp lỗi dạng chuỗi** – Có thể nâng cấp structured error.

**L2. Chưa có monitoring metrics** – Nên thêm Prometheus hooks sau.

**L3. Placeholder dùng console.log** – Sẽ thay khi implement Epic 2.

### Thiết kế được duyệt

- 2 AM daily schedule hợp lý.
- Tách ingestion/aggregation rõ ràng.
- Error classification logic tốt.
- Backfill method hữu ích.

### Kiểm chứng AC

- AC #1: PASS – cron/worker hoạt động, queue đúng.
- AC #2: PASS – có logging + retry config.
- AC #3: PASS – error classification.
- AC #4: PASS – log có đủ trường.

### Test Coverage

- Cron tests: enqueue multi integration, aggregation delay, no integration, DB error, backfill, payload, retry config.
- Worker tests: ingestion, backfill, log field, aggregation, aggregation error, error classification.

### Chất lượng code

- Đọc dễ, module hoá tốt, typing chuẩn, docs rõ.

### Security

- Không vấn đề.

### Performance

- Đáp ứng 10–20 page (MVP). Khi scale cần pagination, distributed scheduling.

### Khuyến nghị

Approved cho production. M1-M3 xử lý ở giai đoạn scale. Ready để Epic 2 plug-in logic thật.
