# Story 1.1: Bộ khung mô-đun Analytics Intelligence (backend + FE route stub)

Trạng thái: review

## Story

Với vai trò Leader (owner), tôi muốn có bộ khung “Analytics Intelligence” mới trong Postiz (gồm module backend và route stub tối thiểu ở FE) để có thể phát triển dần các tính năng analytics MVP mà không làm ảnh hưởng hành vi hiện tại của Postiz.

## Acceptance Criteria

1. Khi codebase Postiz (apps/backend + apps/frontend) có thể chạy bình thường, việc tạo backend module (NestJS) và FE route stub cho Daily Brief phải đảm bảo hệ thống build/run không lỗi và lộ ra endpoint stub trả mock data.
2. Và route FE (hoặc sub-tab analytics) hiển thị màn placeholder cho khu vực Daily Brief mới.

## Tasks / Subtasks

- [x] Tạo bộ khung backend cho Analytics Intelligence (AC #1)
  - [x] Quyết định vị trí: mở rộng `analytics` module hiện có hoặc tạo controller/service riêng dưới `apps/backend/src/api/routes/` tuân theo convention resource dạng số nhiều.
  - [x] Thêm endpoint stub `/analytics/daily-brief` trả payload mock.
  - [x] Đảm bảo endpoint được scope theo org bằng `@GetOrgFromRequest()` giống pattern tại `apps/backend/src/api/routes/*`.
  - [x] Thêm DTO validation tối thiểu cho các query param (date/groupId/format).
  - [x] Testing: viết integration test đơn giản cho endpoint stub (smoke) (AC #1)

- [x] Tạo FE route stub cho Daily Brief (AC #2)
  - [x] Thêm trang/màn placeholder trong khu vực analytics hiện có (hoặc pattern điều hướng tương tự) mà không thay đổi route hiện có.
  - [x] Kết nối FE call tới endpoint stub (có thể optional ở pass đầu) và render placeholder hoặc mock response.
  - [x] Testing: smoke test/bài test render cơ bản (AC #2)

## Dev Notes

- Ưu tiên tái sử dụng conventions hiện có của Postiz:
  - Controllers dùng `@UseGuards(AuthGuard('jwt'))`, `@ApiBearerAuth()`, `@ApiTags()`.
  - Org scoping thông qua `@GetOrg()`.

- Story này chỉ mang tính **scaffold**:
  - Không thay đổi schema DB (thuộc Story 1.2).
  - Không triển khai ingestion job (thuộc Story 1.3 / Epic 2).

### Ghi chú cấu trúc dự án

- Ứng viên backend đã đề xuất trong kiến trúc:
  - `apps/backend/src/api/routes/analytics-intelligence.controller.ts` (hoặc mở rộng `analytics.controller.ts`).
- FE cần theo cấu trúc Next.js hiện hữu ở `apps/frontend`.

### Tài liệu tham chiếu

- [docs/epics.md#Story-1.1-Khởi-tạo-module-“Analytics-Intelligence”-trong-backend-+-FE-route-stub]
- [docs/architecture.md#Implementation-Patterns]
- [docs/architecture.md#Project-Structure]
- [docs/tech-spec.md#5)-API-Contracts-(MVP)]

## Dev Agent Record

### Context Reference

- `docs/stories/1-1-analytics-intelligence-module-scaffold.context.xml`

### Agent Model

- Cascade

### Debug Log

#### Kế hoạch triển khai

**Backend (AC #1):**
- Mở rộng `apps/backend/src/api/routes/analytics.controller.ts` với endpoint mới `GET /analytics/daily-brief`
- Tạo `DailyBriefQueryDto` để validate query param (date, groupId, format)
- Sử dụng `@GetOrgFromRequest()` để scope theo org giống pattern hiện hữu
- Trả payload mock gồm organizationId, date, summary, recommendations, trends, format

**Frontend (AC #2):**
- Tạo component `DailyBriefPlaceholder` tại `apps/frontend/src/components/analytics/`
- Mở rộng `PlatformAnalytics` với tab (Platform Analytics | Daily Brief)
- Component gọi `/analytics/daily-brief` qua useSWR
- Render placeholder UI với mock data từ backend

**Testing:**
- Backend: Integration test cho `/analytics/daily-brief` với org context
- Frontend: Smoke test cho `DailyBriefPlaceholder`

### Completion Notes

**2025-12-13 - Hoàn tất Story 1.1**

✅ **Backend:**
- Mở rộng `analytics.controller.ts` với `GET /analytics/daily-brief`
- Tạo `DailyBriefQueryDto` validate optional query param
- Endpoint trả payload mock org-scoped
- Thêm Jest integration test với 4 case (default, custom date, format, groupId)

✅ **Frontend:**
- Tạo `DailyBriefPlaceholder` dùng SWR
- Mở rộng `PlatformAnalytics` với tab mới
- Component render placeholder với summary metrics (totalPosts, totalEngagement, topPerformer)
- Thêm Jest smoke test kiểm tra render, text, metrics, binding

✅ **Alignment kiến trúc:**
- Theo đúng review: mở rộng controller hiện hữu
- Dùng `@GetOrgFromRequest()` (không dùng `AuthGuard` ở controller)
- Tích hợp vào `/analytics` sẵn có
- Payload mock chuẩn bị cho dữ liệu thật sau này

**Không gây break:**
- Thay đổi dạng additive, không ảnh hưởng tính năng analytics cũ
- Endpoint/UI mới chỉ hiển thị khi user chọn tab mới

### Danh sách file

**Backend:**
- `apps/backend/src/api/routes/analytics.controller.ts` (sửa)
- `libraries/nestjs-libraries/src/dtos/analytics/daily-brief.query.dto.ts` (tạo)
- `apps/backend/src/api/routes/analytics.controller.spec.ts` (tạo)

**Frontend:**
- `apps/frontend/src/components/analytics/daily-brief.placeholder.tsx` (tạo)
- `apps/frontend/src/components/analytics/daily-brief.placeholder.spec.tsx` (tạo)
- `apps/frontend/src/components/platform-analytics/platform.analytics.tsx` (sửa)

**Docs:**
- `docs/sprint-status.yaml` (update trạng thái story)

## Senior Developer Review (AI)

### Tóm tắt

Story 1.1 đúng hướng nhưng cần tinh chỉnh nhỏ để bám sát pattern Postiz hiện tại (auth/org scoping backend và routing frontend).

### Findings

- Controllers backend dùng `@GetOrgFromRequest()` thay vì `@UseGuards(AuthGuard('jwt'))` ở level controller → story phải bám pattern này.
- Route FE `apps/frontend/src/app/(app)/(site)/analytics/page.tsx` đã render `PlatformAnalytics`, nên “route stub” chỉ cần là tab/sub-section bên trong, không tạo route mới.

### Hành động

- [ ] **Backend:** Cài `GET /analytics/daily-brief` bằng cách mở rộng `analytics.controller.ts`, dùng `@GetOrgFromRequest()`.
- [ ] **Backend:** Giữ response format theo controller hiện hữu; payload mock phải tương thích spec.
- [ ] **Frontend:** Thêm UI placeholder bên trong trang analytics hiện tại, không đổi route `/analytics`.

### Bằng chứng

- `apps/backend/src/api/routes/analytics.controller.ts`
- `apps/backend/src/api/routes/integrations.controller.ts`
- `apps/frontend/src/app/(app)/(site)/analytics/page.tsx`

## Code Review (AI) - 2025-12-13

### Kết luận: **Approve với minor changes**

#### Điểm mạnh

1. **Alignment kiến trúc** – Mở rộng controller đúng chỗ, tuân theo org scoping, route order chuẩn.
2. **Bảo mật** – Org-scoped đúng, DTO validation tốt, không có vấn đề injection.
3. **Chất lượng code** – Rõ ràng, typing chuẩn, thay đổi additive.
4. **Testing** – Backend & frontend đều có test phù hợp scope.

#### Issues mức trung bình

**M1. Thiếu error handling ở component frontend** → cần render thông báo lỗi khi SWR fail.

**M2. Thiếu Swagger docs cho endpoint** → cần `@ApiOperation`, `@ApiQuery`, `@ApiResponse`.

**M3. Thiếu dependency trong `useCallback`** → thêm `[fetch]`.

#### Issues mức thấp

**L1. Mock Organization trong test chưa khớp schema** → nên dùng Partial.

**L2. Chưa có interface TypeScript cho response**.

**L3. Loading UI còn chung chung** → cân nhắc skeleton sau.

### Kiểm tra AC

- AC #1: PASS – endpoint stub hoạt động, không lỗi build/run.
- AC #2: PASS – FE render placeholder trong tab mới.

### Đánh giá rủi ro

Thấp – các issue đều nhỏ, không chặn merge. Scaffold đủ mục đích.

### Khuyến nghị

Approve với minor changes (sửa M1 trước). M2-M3 có thể xử lý kế tiếp.
