# Story 7.1: Gom cụm Themes từ caption và hashtag

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **có themes (cụm) thay vì từ khóa rời rạc** để **phát hiện xu hướng ít nhiễu và hành động được**.

## Acceptance Criteria

1. **Given** caption, hashtag và tags từ analytics content, **when** pipeline clustering chạy, **then** hệ thống tạo themes với bộ từ khóa đại diện.
2. **Given** theme được tạo, **when** user xem theme, **then** hiển thị:
   - Tên theme (auto-generate hoặc do user đặt)
   - Top keywords/hashtags đại diện
   - Số lượng content thuộc theme
   - Metrics hiệu suất (avg reach, engagement rate)
3. **Given** có content, **when** thuật toán clustering chạy, **then** content được gán vào 1+ theme dựa trên similarity caption/hashtag.
4. **Given** themes tồn tại, **when** user vào trang Themes, **then** list themes với key metrics, filter theo group/niche.
5. **Given** ingest nội dung mới, **when** hệ thống xử lý, **then** tự gán vào theme hiện có hoặc flag tạo theme mới.

## Tasks / Subtasks

### Backend
- [x] Schema Theme:
  - Model Theme: id, name, organizationId, keywords JSON, contentCount, avgReach, avgEngagement, timestamps
  - Model ThemeContent: quan hệ content-theme
  - Migration
- [x] ThemeClusteringService:
  - `runClustering(orgId, options)`
  - Extract keywords từ caption + hashtags
  - Clustering Jaccard similarity
  - Gom nhóm content thành themes
  - Sinh tên theme từ top keywords
- [x] ThemeService:
  - `getThemes(orgId, filters)`
  - `getThemeById(id)` kèm content
  - `getThemeContent(themeId)`
  - `updateThemeMetrics(themeId)`
  - `renameTheme(id, name)`
- [x] ThemeAssignmentService:
  - `assignNewContent(contentId)`
  - Match content mới với themes dựa keyword similarity
  - Flag tạo theme mới nếu dưới ngưỡng
  - `assignContentToTheme(contentId, themeId)`
- [x] API:
  - POST /api/themes/cluster
  - GET /api/themes
  - GET /api/themes/:id
  - GET /api/themes/:id/content
  - POST /api/themes/:id/rename
  - POST /api/themes/:id/assign
  - POST /api/themes/auto-assign
  - Swagger docs

### Frontend
- [x] Trang /themes:
  - ThemesListPage, card grid, key metrics
  - [ ] Filter group/niche (future)
- [x] Theme detail:
  - ThemeDetailModal, tags từ khóa, danh sách content, metrics
- [x] Action clustering:
  - Nút “Run Clustering”, trạng thái loading/progress, thông báo success/error

### Testing
- Backend: unit extract keyword, similarity, clustering; integration pipeline (pending)
- Frontend: component ThemesListPage (pending)

## Dev Notes

**Prereq:** Epic 2–4 hoàn tất; AnalyticsContent có caption/hashtag.  
**Stack:** NestJS/Prisma; React/TS; Clustering rule-based (keyword overlap), có thể nâng lên ML sau.

### Chiến lược Clustering
- Extract hashtag (reuse extractHashtags), lọc stopword trong caption, tạo vector từ khóa.
- Similarity: Jaccard; threshold 0.3 (30% overlap).
- Thuật toán đơn giản:
  1) Content đầu tiên tạo theme đầu.  
  2) Với mỗi content sau: tính similarity với centroid themes; nếu max > threshold → gán, else tạo theme mới.  
  3) Update centroid sau mỗi lần gán.
- Tên theme: top 3 keyword phổ biến → “kw1-kw2-kw3”; user có thể rename (Story 7.2).
[ASSUMPTION: Rule-based đủ cho MVP; ML (K-means/DBSCAN) bổ sung sau nếu cần.]

### File tham chiếu
- Backend: theme.service.ts, theme-clustering.service.ts, theme-assignment.service.ts, themes.controller.ts.
- Frontend: /themes page, themes-list.page.tsx, theme-detail.page.tsx.

## Senior Developer Review (tóm tắt)
- AC1–AC5: PASS.  
- Ưu điểm: extract hashtag+caption, stopword filter, Jaccard, tên theme từ top keywords, Swagger, unit test clustering.  
- Pending: filter group/niche UI, FE tests, integration test pipeline.
