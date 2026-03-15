# Story 6.1: Tạo Playbook từ nội dung top

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **tạo Playbook (công thức thắng) từ nội dung top** để **lặp lại pattern thành công, tăng view và engagement**.

## Acceptance Criteria

1. **Given** dữ liệu 14–30 ngày, **when** chạy playbook generator, **then** playbook được tạo và nhóm theo group/niche/pillar/format.
2. **Given** một playbook, **when** xem playbook, **then** hiển thị công thức rõ ràng:
   - Format đề xuất (post/reel)
   - Caption bucket (hook patterns, CTA patterns)
   - Hashtag bucket (hashtags hiệu quả)
   - Time bucket (khung giờ tối ưu)
   - Evidence metrics (median reach/views, engagement rate, consistency score)
3. **Given** nhiều nội dung top, **when** phân tích, **then** tìm ra yếu tố chung dẫn tới thành công.
4. **Given** playbook, **when** xem evidence, **then** hiển thị các bài nguồn đóng góp.
5. **Given** playbook tồn tại, **when** vào Playbooks page, **then** danh sách playbook có key metrics và filter theo group/niche.

## Tasks / Subtasks

### Backend
- [x] Playbook schema: model Playbook (id, name, groupId, format, recipe JSON, evidence JSON, consistencyScore, timestamps); PlaybookSourceContent liên kết bài nguồn.
- [x] PlaybookGeneratorService:
  - `generatePlaybooks(orgId, options)`
  - Lấy top content 14–30 ngày từ AnalyticsContent + AnalyticsDailyMetric
  - Nhóm theo format, group/niche
  - Trích pattern caption (hooks, CTA), hashtag top, time tối ưu
  - Tính consistency score (không dựa một bài may mắn)
- [x] PlaybookService:
  - `getPlaybooks(orgId, filters)`
  - `getPlaybookById(id)` kèm source content
  - `getPlaybookEvidence(playbookId)`
- [x] API:
  - POST /api/playbooks/generate
  - GET /api/playbooks
  - GET /api/playbooks/:id
  - Swagger docs

### Frontend
- [x] Trang /playbooks
  - PlaybooksListPage: thẻ grid, filter group/niche/format
- [x] Playbook detail (modal):
  - Recipe sections (format, caption, hashtags, time)
  - Evidence metrics + charts
  - Danh sách bài nguồn
- [x] Action Generate Playbooks:
  - Nút generate, loading, success/error feedback

### Testing
- Backend: unit pattern extraction, consistency score, API; integration E2E (pending)
- Frontend: tests cho PlaybooksListPage, PlaybookDetailPage, filter (pending)

## Dev Notes

**Prereq:** Epic 2–4 hoàn tất (ingestion, metrics, trending, best time); bảng AnalyticsContent, AnalyticsDailyMetric đã có dữ liệu.  
**Stack:** NestJS/Prisma; React/TS. Pattern extraction rule-based (có thể nâng lên ML sau).

### Chiến lược Pattern
- Caption: lấy câu đầu làm hook; phát hiện CTA; nhóm hook tương tự.
- Hashtag: đếm tần suất, tính tương quan engagement; tạo bucket theo tier.
- Time: dùng BestTimeService + giờ post của nội dung top.
- Consistency: tối thiểu 3 bài; score = (số bài trên median / tổng) * 100; phạt nếu chỉ là outlier.

### File tham chiếu (từ bản gốc)
- Backend: `playbook.service.ts`, `playbook-generator.service.ts`, controller.
- Frontend: page `/playbooks`, components list/detail.

## Senior Developer Review (tóm tắt)
- AC1–AC5: PASS.
- Ưu điểm: batch query tránh N+1, soft delete, Swagger, typing tốt, error handling đúng.
- Issues đã fix: dùng useEffect cho load data ban đầu; thêm eslint-disable cho exhaustive-deps.
- Testing: backend unit hoàn tất, frontend test còn pending.

[ASSUMPTION: Nếu schema chưa có trường description cho playbook, giữ nguyên như gốc; recipe/evidence lưu dạng JSON trong Playbook.] 
