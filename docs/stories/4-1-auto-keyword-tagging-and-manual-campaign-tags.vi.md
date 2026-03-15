# Story 4.1: Tự động gán từ khóa/chủ đề + Tag chiến dịch thủ công

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **auto-tag dựa trên keyword/topic và tag chiến dịch thủ công** để **phân tích nội dung theo pillar/campaign và biết topic nào hiệu quả**.

## Acceptance Criteria

1. **Given** content có caption/hashtags (Story 2.2), **when** job auto-tagging chạy, **then** hệ thống trích xuất keyword, tạo AUTO tag và gán vào content.
2. User có thể tạo tag CAMPAIGN thủ công qua UI.
3. User có thể gán tag thủ công cho content.
4. Tag hiển thị trên content trong dashboard.
5. Tag dùng để filter analytics (chuẩn bị cho stories sau).

## Tasks / Subtasks

### Backend
- [ ] Auto Tagging System
  - [ ] Tạo `AnalyticsTaggingService`
  - [ ] Thuật toán trích keyword từ caption
  - [ ] Parse hashtag
  - [ ] Chuẩn hóa & dedupe tag
  - [ ] Auto-assign tag cho content
  - [ ] Idempotent (rerun không tạo trùng)

- [ ] Manual Tag Management
  - [ ] CRUD API cho campaign tags
  - [ ] Gán/bỏ gán tag cho content
  - [ ] Unique name per org
  - [ ] Phân biệt type (AUTO vs MANUAL)

- [ ] Job/Worker
  - [ ] Thêm bước tagging vào analytics worker
  - [ ] Chạy sau khi ingest metadata
  - [ ] Batch cho content có sẵn
  - [ ] Error handling & logging

- [ ] API Endpoints
  - [ ] POST /api/analytics/tags (tạo tag thủ công)
  - [ ] GET /api/analytics/tags (list)
  - [ ] PUT /api/analytics/tags/:id (update)
  - [ ] DELETE /api/analytics/tags/:id (xóa)
  - [ ] POST /api/analytics/content/:id/tags (gán)
  - [ ] DELETE /api/analytics/content/:id/tags/:tagId (gỡ)
  - [ ] POST /api/analytics/tags/auto-tag (trigger job)

### Frontend
- [ ] UI quản lý Tag
  - [ ] Trang danh sách tag
  - [ ] Modal tạo/sửa
  - [ ] Hiển thị loại tag (AUTO/MANUAL)
  - [ ] Đếm số content dùng tag
  - [ ] Xác nhận xóa

- [ ] UI gán Tag cho Content
  - [ ] Badge tag trên content
  - [ ] Dropdown gán tag
  - [ ] Bộ lọc tag trong dashboard
  - [ ] Phân biệt AUTO vs MANUAL

### Testing
- [ ] Backend: unit keyword extract, hashtag parse, normalize, auto-tag job, CRUD, idempotency
- [ ] Frontend: component tạo tag, gán tag, filter tag

## Dev Notes

**Prereq:** Story 2.2 (AnalyticsContent), Story 1.2 (AnalyticsTag, AnalyticsContentTag).
**Stack:** NestJS/Prisma, BullMQ; React/UI hiện có.

### Chiến lược auto-tag (MVP)
- Rule-based, không ML/NLP.
- Bước: lấy hashtags đã parse → extract keyword từ caption → normalize/dedupe → tạo AUTO tags → gán vào content.

### Thuật toán (tóm tắt)
- Extract keywords: lower-case, bỏ URL/ký tự đặc biệt, tách từ, loại stopword/số, min length 3, dedupe.
- Parse hashtags: JSON array, lower-case, bỏ ký tự ‘#’, trim, filter rỗng.
- Normalize tags: lower-case, trim, độ dài 2–50, giới hạn 20 tag/content.

### Service (phác thảo)
- `autoTagContent(contentId)`:
  - Lấy content + tags AUTO hiện có.
  - Extract keywords + hashtags → normalize.
  - Upsert tag type AUTO (unique org+name+type+deletedAt=null).
  - Upsert bảng nối AnalyticsContentTag (idempotent).
- `autoTagBatch(contentIds)`: chạy tuần tự, trả success/failed/errors.
- `createManualTag(orgId, name)`: tạo tag type MANUAL (tên lower-case).
- `getTags(orgId, type?)`: trả danh sách, kèm `_count.content`, sort type→name.
- `assignTagToContent(orgId, contentId, tagId)`: verify tag MANUAL & thuộc org, verify content thuộc org, upsert mapping.

### UI/UX
- Trang Tag list: hiển thị type, usage count, action tạo/sửa/xóa.
- Content list: badge tag (AUTO vs MANUAL), dropdown gán tag, filter theo tag.

### Performance / Idempotency
- Upsert tag & content-tag để tránh trùng.
- Batch có thể tuần tự; future: song song/bulk.

### File dự kiến
- Backend: analytics-tagging.service.ts, controller/tag endpoints, worker step, schema (nếu cần field bổ sung).
- Frontend: trang quản lý tags, component gán tag, filter.
- Docs: Swagger cập nhật.

[ASSUMPTION: Không dùng NLP; rule-based đủ cho MVP. Nếu thiếu trường description cho tag, có thể thêm sau (hiện schema chưa có).]
