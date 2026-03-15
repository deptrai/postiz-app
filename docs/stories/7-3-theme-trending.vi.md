# Story 7.3: Theme Trending

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **danh sách trend theo theme thay vì keyword** để **Daily Brief hiển thị chủ đề đang lên rõ ràng**.

## Acceptance Criteria

1. **Given** themes và metrics liên quan, **when** xem Insights/Daily Brief, **then** trend hiển thị theo theme (velocity + explainability).
2. **Given** theme đang trend, **when** xem trend, **then** hiển thị:
   - Tên theme
   - Velocity score (tốc độ tăng)
   - Hướng trend (rising/falling/stable)
   - Top posts của theme
3. **Given** có theme trends, **when** click theme trend, **then** xem liên kết tới top posts của theme.
4. **Given** Daily Brief được tạo, **when** thêm theme, **then** theme trends thay thế/bo sung keyword trends.
5. **Given** theme velocity được tính, **when** so sánh kỳ, **then** dùng thuật toán velocity giống keyword trending (Story 4.2).

## Tasks / Subtasks

### Backend
- [x] ThemeTrendingService:
  - `getThemeTrends(orgId, options)` tính velocity theo theme (growth engagement)
  - Tổng hợp metrics từ content/theme
  - Trả velocity + direction; `getTrendingSummary()` cho rising/falling
- [x] ThemeService (trending):
  - `getThemeTopContent(themeId, limit)` sắp xếp theo engagement
- [ ] Tích hợp Daily Brief:
  - Mở rộng AnalyticsDailyBriefService (tương lai)
- [x] API:
  - GET /api/themes/trending
  - GET /api/themes/trending/summary
  - GET /api/themes/:id/top-content
  - Swagger docs

### Frontend
- [x] Theme Trending widget:
  - ThemeTrendingWidget hiển thị velocity, icon up/down/stable, màu (green/yellow/red)
- [ ] Thêm vào Daily Brief (tương lai)
- [x] Top content links:
  - Card mở rộng, top 3 posts với metrics (reach, engagement, rate)

### Testing
- Backend: unit velocity calc, trend direction, top content, summary
- Frontend: component ThemeTrendingWidget (pending)

## Dev Notes

**Prereq:** Story 7.1 (clustering themes), Story 4.2 (velocity).  
**Stack:** NestJS/Prisma; React/TS.

### Velocity
Tái dùng thuật toán TrendingService (Story 4.2):  
```
Velocity = (current - previous) / previous * 100
```
- Dùng count & engagement growth per theme.

### Trend Direction
- Rising: > 10%
- Stable: -10% đến 10%
- Falling: < -10%

### Daily Brief integration
- Thêm mục “Trending Themes”: top 5 themes theo velocity + giải thích.
[ASSUMPTION: Chỉ hiển thị nếu có đủ dữ liệu theme; fallback sang keyword trending nếu thiếu.]

### File tham chiếu
- Backend: theme-trending.service.ts (+spec), themes.controller.ts endpoints, api.module.ts register.
- Frontend: theme-trending.widget.tsx; mở rộng daily-brief page (tương lai).

## Senior Developer Review (tóm tắt)
- AC1–AC3, AC5: PASS; AC4 partial (Daily Brief bổ sung sau).  
- Ưu điểm: velocity có hướng, summary rising/falling, top content, Swagger, unit tests.  
- Pending: FE tests, Daily Brief integration.
