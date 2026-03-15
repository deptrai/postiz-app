# Story 6.2: Tạo biến thể Playbook

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **có 3–5 biến thể cho mỗi playbook** để **nhanh chóng thử nghiệm khác nhau về hook, thời gian đăng, hashtags**.

## Acceptance Criteria

1. **Given** playbook có sẵn, **when** mở chi tiết playbook, **then** hiển thị 3–5 biến thể phân biệt rõ.
2. **Given** một biến thể, **when** xem, **then** hiển thị:
   - Tên/nhãn (vd: “Hook Variation A”, “Time Slot B”)
   - Các yếu tố khác so với playbook gốc
   - Hướng dẫn áp dụng
3. **Given** playbook, **when** sinh biến thể, **then** bao phủ nhiều chiều:
   - Hook variations (pattern mở khác nhau)
   - Time variations (khung giờ đăng khác)
   - Hashtag variations (tổ hợp hashtag khác)
4. **Given** variant, **when** muốn dùng, **then** copy recipe vào clipboard hoặc export.
5. **Given** variants tồn tại, **when** tạo experiment (Story 6.3), **then** chọn variant đưa vào experiment.

## Tasks / Subtasks

### Backend
- [x] Mở rộng schema Playbook cho variants:
  - Model PlaybookVariant: id, playbookId, name, type (hook/time/hashtag), recipe JSON, createdAt
  - Quan hệ Playbook 1:N PlaybookVariant
  - Migration
- [x] PlaybookVariantService:
  - `generateVariants(playbookId)`
  - Hook variations từ pattern nội dung nguồn
  - Time variations dùng BestTimeService
  - Hashtag variations từ hashtag bucket
  - Giới hạn 3–5 variant/playbook
- [x] API:
  - GET /api/playbooks/:id/variants
  - POST /api/playbooks/:id/variants/generate
  - GET /api/playbooks/:id/variants/:variantId
  - Swagger docs

### Frontend
- [x] Mở rộng PlaybookDetailPage:
  - Section variants, card có badge type, khác biệt chính
  - Xem chi tiết recipe khi click/expand
- [ ] Tính năng tương tác (AC #4):
  - [ ] Nút “Copy Recipe”
  - [ ] Export variant
  - [ ] Toast thành công khi copy
- [x] UI generate variants:
  - Nút generate, loading, refresh list sau khi tạo

### Testing
- Backend: unit logic sinh variant (hook/time/hashtag), API (integration pending)
- Frontend: component hiển thị variant, copy-to-clipboard (pending)

## Dev Notes

**Prereq:** Story 6.1 hoàn tất.  
**Stack:** NestJS/Prisma; React/TS.

### Chiến lược sinh variant
- **Hook:** phân tích hook nguồn, nhóm theo loại (question/statement/statistic/story); tạo variant khác loại so với base.
- **Time:** lấy heatmap BestTimeService, chọn 3 slot khác nhau (sáng/chiều/tối; weekday/weekend).
- **Hashtag:** tạo tổ hợp: high-reach, high-engagement, balanced, niche-specific.

### File tham chiếu
- Backend: `playbook-variant.service.ts`; mở rộng controller playbooks.
- Frontend: mở rộng `playbook-detail.page.tsx`; `variant-card.component.tsx`.

## Senior Developer Review (tóm tắt)
- AC1–AC3 PASS; AC4/AC5 pending/future.
- Ưu điểm: error handling đúng, xóa variants cũ trước khi tạo mới, type-safe, Swagger, unit tests.
- Pending: copy/export, integration tests, frontend tests.

[ASSUMPTION: Nếu schema chưa có trường description cho variant, giữ nguyên như gốc; recipe lưu JSON.] 
