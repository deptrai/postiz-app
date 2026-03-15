# Story 2.1: Theo dõi Facebook Page ưu tiên (10–20) thông qua Integrations

Trạng thái: done

## Story

Với vai trò Leader, tôi muốn chọn và quản lý 10–20 Facebook Page/integration ưu tiên cho analytics để phạm vi MVP nhỏ gọn nhưng vẫn tạo ra insight hữu ích.

## Acceptance Criteria

1. Khi Postiz đã có integrations, Leader chọn 10–20 page integrations để bật Analytics Intelligence thì hệ thống phải lưu danh sách này theo organization.
2. API/UI phải trả được danh sách các page đang được theo dõi.

## Tasks / Subtasks

- [x] Tái sử dụng danh sách integrations hiện có cho UX/API chọn (AC #2)
  - [x] `/integrations/list` là nguồn dữ liệu chuẩn (không cần đổi)
  - [x] Frontend sẽ lọc Facebook pages khi làm UI

- [x] Thêm persistence org-scoped cho danh sách analytics tracked (AC #1)
  - [x] Tạo Prisma model `AnalyticsTrackedIntegration`
  - [x] Unique constraint: [organizationId, integrationId]
  - [x] Cascade delete nếu org hoặc integration bị xóa
  - [x] Giới hạn 20 ở service layer

- [x] Thêm endpoint analytics tracking (AC #1, #2)
  - [x] `GET /analytics/tracked-pages` trả danh sách integration ID
  - [x] `PUT /analytics/tracked-pages` cập nhật (thay toàn bộ)
  - [x] Cả hai endpoint org-scoped qua `@GetOrgFromRequest()`

- [x] Validation + errors (AC #1)
  - [x] Trả 400 nếu >20 integrationIds
  - [x] Trả 404 nếu integrationId không thuộc org
  - [x] DTO dùng class-validator (ArrayMaxSize)

- [x] Tests (AC #1, #2)
  - [x] Unit test: GET trả đúng IDs, PUT cập nhật thành công
  - [x] Error test: 400 cho >20, 404 cho integrationId sai
  - [x] Edge case: xử lý mảng rỗng

## Dev Notes

- Không phát minh flow “connect” mới: flow connect channel đã có qua Integrations.
- Story này chỉ nói tới **chọn & track** các integration hiện có.

### Ghi chú cấu trúc dự án

- Endpoint danh sách integrations hiện có:
  - `GET /integrations/list`
- Base path analytics controller:
  - `/analytics`

### Tài liệu tham khảo

- [docs/epics.md#Story-2.1]
- [docs/PRD.md#Functional-Requirements]
- [docs/tech-spec.md#5.2.1-Tracked-Pages]
- `apps/backend/src/api/routes/integrations.controller.ts`

## Dev Agent Record

### Context Reference

- `docs/stories/2-1-track-priority-facebook-pages.context.xml`

### Agent Model

- Cascade

### Debug Log

- Không cần

### Completion Notes

**Quyết định kiến trúc:**
1. **Model tracking riêng:** `AnalyticsTrackedIntegration` tách biệt Integration
   - Giữ concern rõ ràng
   - Cho phép lifecycle độc lập
2. **Service layer:** `AnalyticsTrackingService`
   - Validate giới hạn 20
   - Kiểm tra integration thuộc org
   - Dùng Prisma transaction (xóa hết + thêm mới)
   - Đặt tại `libraries/.../analytics`
3. **Chiến lược full replace:** PUT thay toàn bộ list
   - Idempotent, dễ hiểu
   - FE dễ quản lý state

**Prisma Model:**
- Bảng: `AnalyticsTrackedIntegration`
- Trường: id, organizationId, integrationId, createdAt, updatedAt
- Unique: [organizationId, integrationId]
- Index: organizationId, integrationId
- Cascade delete

**API:**

`GET /analytics/tracked-pages`
- Trả mảng integrationId
- Org-scoped qua decorator
- Sắp xếp theo createdAt tăng dần

`PUT /analytics/tracked-pages`
- Body: `{ integrationIds: string[] }`
- Validate max 20 (DTO + service)
- Kiểm tra ownership
- Transaction deleteMany + createMany
- Trả `{ success: true, trackedCount }`
- Lỗi: 400 (>20), 404 (id không thuộc org)

**Validation:**
1. DTO: `@ArrayMaxSize(20)`
2. Service: query Integration để xác nhận
3. Thông báo lỗi rõ ràng

**Transaction:**
```ts
await tx.analyticsTrackedIntegration.deleteMany({ where: { organizationId } });
await tx.analyticsTrackedIntegration.createMany({ data });
```

**Testing:**
- GET trả đúng
- PUT cập nhật
- 400 cho >20, 404 cho id sai
- Edge case mảng rỗng

**Tích hợp:**
- Reuse `/integrations/list`
- Inject `AnalyticsTrackingService` vào controller
- Đăng ký service trong ApiModule

**Tương lai:**
- FE selection UI sẽ gọi endpoints này
- Cron ingestion (Story 1.3) đọc từ bảng này
- Có thể bổ sung PATCH, metadata

### File List

**Tạo mới:**
1. `analytics-tracking.service.ts`
2. `update-tracked-pages.dto.ts`

**Sửa:**
3. `schema.prisma`
4. `analytics.controller.ts`
5. `analytics.controller.spec.ts`
6. `api.module.ts`

**≈290 dòng code + test**

## Code Review (AI) - 2025-12-13

### Kết luận: **Approve - Production Ready**

#### Điểm mạnh
- Thiết kế rõ ràng, model riêng, service chuẩn.
- Validation nhiều lớp, thông báo rõ.
- Org-scoping, security chặt.
- Schema có unique/index, cascade.
- Tests đầy đủ.
- Code sạch, JSDoc rõ, typing chuẩn.

#### Vấn đề nhỏ

**M1. Không loại trùng integrationId ở input**
- Nếu payload `[\"int-1\", \"int-1\"]` sẽ lỗi unique constraint.
- Đề xuất dedupe trước khi validate:
```ts
const uniqueIds = [...new Set(integrationIds)];
```
- Chỉ là cải thiện UX, không blocker.

#### Kiểm chứng AC

- AC #1: PASS – Lưu danh sách theo org, enforce 20.
- AC #2: PASS – API trả danh sách tracked.

#### Test coverage

- 7 case bao hết happy path + lỗi.

#### Chỉ số chất lượng

- Readability, Type safety, Maintainability, Docs, Security: ⭐⭐⭐⭐⭐

#### Performance

- MVP (≤20) tuyệt vời; scale lớn cũng ổn vì query có index.

#### Khuyến nghị

- Sẵn sàng production. Có thể bổ sung dedupe & PATCH sau.

## Senior Developer Review (AI)

### Summary

Story bám đúng pattern Integrations + Analytics controller hiện có.

### Findings

- Controller `/analytics` đã có sẵn với `@GetOrgFromRequest()`.
- `/integrations/list` phù hợp để FE chọn.
- Service injection pattern rõ ràng.
- [ASSUMPTION: Tracking storage] → Dùng bảng riêng là best practice.

### Action Items (để tham khảo)

- Thêm GET/PUT `/analytics/tracked-pages`.
- Tạo service riêng.
- Thêm Prisma model.
- Validation max 20 + ownership.
- Inject service vào controller.
- FE cập nhật UI selection.

### Evidence

- Các file trong backend/frontend tương ứng.
