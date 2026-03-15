# Story 1.2: Nền tảng schema Analytics (Prisma)

Trạng thái: done

## Story

Với vai trò Leader, tôi muốn có Prisma schema nền tảng cho analytics (groups, tags, time-series metrics) để hệ thống có thể ingest và phân tích dữ liệu theo thời gian mà không ảnh hưởng các bảng Postiz hiện có.

## Acceptance Criteria

1. Khi bổ sung các bảng/models cần thiết cho analytics vào Prisma schema hiện tại, việc migrate/push phải thành công và không phá vỡ bảng cũ.
2. Và phải có các index cơ bản phục vụ truy vấn theo organization/integration/date.

## Tasks / Subtasks

- [x] Xác nhận hướng data-model cho lưu trữ content MVP (AC #1)
  - [x] Đồng ý dùng bảng AnalyticsContent riêng để tránh phụ thuộc domain scheduling

- [x] Triển khai thay đổi Prisma schema tối thiểu (AC #1)
  - [x] Thêm model:
    - [x] AnalyticsGroup (page groups / niches)
    - [x] AnalyticsTag (AUTO/MANUAL)
    - [x] AnalyticsMetric (daily metrics time-series)
    - [x] AnalyticsContentTag (bảng nối content ↔ tag)
  - [x] Đảm bảo mọi model đều org-scoped, không vượt boundary org.

- [x] Thêm ràng buộc & index (AC #2)
  - [x] Unique constraint đảm bảo idempotency (org + integration + externalContentId + date + metricType) cho metrics.
  - [x] Index cho các truy vấn phổ biến (org/date, org/integration/date).

- [x] Áp dụng migration/push an toàn (AC #1)
  - [x] Chạy `pnpm run prisma-generate`.
  - [x] Chạy `pnpm run prisma-db-push` đúng workflow.

- [x] Tests (AC #1,#2)
  - [x] Xác minh generate thành công và backend chạy ổn với schema mới.

## Dev Notes

- Tất cả thay đổi phải additive.
- Thiết kế idempotency bằng unique constraint ngay từ đầu để ingestion dựa vào.

### Ghi chú cấu trúc dự án

- Prisma schema tập trung tại `libraries/nestjs-libraries/src/database/prisma/schema.prisma`.

### Tài liệu tham chiếu

- [docs/epics.md#Story-1.2-Thiết-kế-schema-nền-(Prisma)]
- [docs/architecture.md#Database]
- [docs/architecture.md#Data-Architecture]
- [docs/tech-spec.md#4)-Data-Model-(MVP)]

## Dev Agent Record

### Context

- `docs/stories/1-2-analytics-schema-foundation.context.xml`

### Agent Model

- Cascade

### Debug Log

- Backend khởi động lại thành công sau khi đổi schema
- `pnpm run prisma-generate` hoàn tất 270ms
- DB sync 217ms

### Completion Notes

**Quyết định thiết kế:**
1. Tạo bảng `AnalyticsContent` tách khỏi domain Post.
2. Mọi model dùng `organizationId` để scope.
3. Model liên kết integration khi cần để theo dõi từng page.
4. Áp dụng soft delete qua `deletedAt`.

**Models:**
1. **AnalyticsGroup** – nhóm/niche
   - Unique: [organizationId, name, deletedAt]
   - Index: organizationId, deletedAt
2. **AnalyticsTag** – tag AUTO/MANUAL
   - Unique: [organizationId, name, type, deletedAt]
   - Index: organizationId, type, deletedAt
3. **AnalyticsContent** – metadata post/reel FB
   - Unique: [organizationId, integrationId, externalContentId, deletedAt]
   - Index: organizationId, integrationId, externalContentId, publishedAt, deletedAt
4. **AnalyticsContentTag** – bảng nối content-tag
   - Khóa chính & unique: [contentId, tagId]
5. **AnalyticsMetric** – lưu time-series
   - Unique: [organizationId, integrationId, externalContentId, date, metricType]
   - Index: organizationId, integrationId, contentId, groupId, date, [organizationId, date], [organizationId, integrationId, date]

**Chiến lược idempotency:**
- Metrics dùng unique constraint nêu trên.
- Content dùng unique (org + integration + externalContentId).

**Quan hệ:**
- Organization → AnalyticsGroup/Tag/Content/Metric
- Integration → AnalyticsContent/Metric
- AnalyticsContent → AnalyticsMetric
- AnalyticsGroup → AnalyticsMetric
- AnalyticsTag ↔ AnalyticsContent qua bảng nối

**Chu trình schema:**
- `pnpm run prisma-generate` (282ms)
- `pnpm run prisma-db-push` (138ms)
- Backend reload thành công

**Fix quan trọng (C1):**
- `externalContentId` trong AnalyticsMetric được chuyển sang bắt buộc để unique constraint hoạt động đúng.

### File

- `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

## Senior Developer Review (AI)

### Tóm tắt

Story 1.2 phù hợp kiến trúc Postiz: schema tập trung, script chuẩn `pnpm`.

### Findings

- Schema ở `libraries/.../schema.prisma`.
- Repo dùng script `prisma-generate`, `prisma-db-push`.
- Domain scheduling có `Tags`, nên analytics tag phải tách riêng.

### Action Items

- [ ] Dùng script gốc khi generate/push.
- [ ] Giữ naming `organizationId`.
- [ ] Không reuse bảng Tag hiện tại.

### Code Review (AI) - 2025-12-13

Kết luận: **Approve với Critical Fix Required**

#### Critical ❌

**C1. Trường nullable trong unique constraint**
- Model AnalyticsMetric dùng `externalContentId?`.
- SQL coi NULL khác nhau → phá idempotency.
- Fix: bắt buộc trường hoặc chia constraint. (Đã fix trong implementation).

#### High ⚠️

**H1. Thiếu enum cho contentType/metricType** → đề xuất tạo enum.

**H2. Thiếu onDelete cascade** → thêm `onDelete: Cascade`.

#### Medium ⚠️

**M1. metricValue dùng Float** → cân nhắc Int/Decimal.

**M2. Không giới hạn độ dài chuỗi** → thêm VarChar.

**M3. Thiếu audit fields** → cân nhắc thêm cho thao tác thủ công.

#### Low ℹ️

**L1. Có thể dư index**.

**L2. Nên dùng @db.Date cho trường date**.

**L3. Hashtags nên dùng JsonB**.

### Điểm mạnh ✅

- Org-scoping chuẩn.
- Soft delete đồng nhất.
- Tên trường tuân chuẩn.
- Quan hệ & index đầy đủ.
- Idempotency rõ ràng (sau khi fix C1).

### Action Items Summary

- [x] C1 đã fix.
- [ ] H1, H2 nên xử lý.
- [ ] Các đề xuất khác có thể cân nhắc sau.

### Kiểm chứng AC

- AC #1: PASS – schema apply thành công.
- AC #2: PASS – index đáp ứng.

### Risk

- Nếu không fix C1 sẽ duplicate metrics → đã xử lý.

### Khuyến nghị

Approve với yêu cầu fix C1 (hoàn tất). Các cải tiến khác có thể thực hiện trước Epic 2.
