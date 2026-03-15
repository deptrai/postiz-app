# Story 3.2: Dashboard core — bộ lọc + thẻ KPI + top posts/reels

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **dashboard có bộ lọc và thẻ KPI hiển thị top posts/reels** để **nhanh chóng thấy nội dung hiệu quả trên các page được theo dõi**.

## Acceptance Criteria

1. **Given** đã có daily metrics (Story 2.3), **when** Leader chọn page/group/niche + date range + format, **then** dashboard hiển thị KPI cards (reach/views, engagement, engagement rate).
2. **And** hiển thị danh sách top content xếp hạng theo KPI đã chọn.
3. **And** bộ lọc được lưu khi refresh (URL params hoặc local storage).
4. **And** dashboard cập nhật khi thay đổi filter mà không reload toàn trang.

## Tasks / Subtasks

### Backend
- [ ] Tạo `AnalyticsDashboardService`
  - [ ] `getKPIs()` – tính KPI theo filter
  - [ ] `getTopContent()` – truy vấn top content theo KPI
  - [ ] Hỗ trợ filter: groupId, integrationIds, dateRange, format
  - [ ] Aggregate từ `AnalyticsDailyMetric`
  - [ ] Tính engagement rate: (reactions + comments + shares) / reach

- [ ] API endpoints
  - [ ] `GET /api/analytics/dashboard/kpis`
  - [ ] `GET /api/analytics/dashboard/top-content`
  - [ ] Query: groupId, integrationIds[], startDate, endDate, format, limit
  - [ ] Swagger docs

- [ ] Validation
  - [ ] Date range tối đa 90 ngày
  - [ ] Format: 'post' | 'reel' | 'all'
  - [ ] integrationIds thuộc org
  - [ ] groupId thuộc org

### Frontend
- [ ] Trang /analytics/dashboard
  - [ ] Layout: sidebar filters + KPI cards + content list

- [ ] Filter components
  - [ ] GroupSelector (dropdown)
  - [ ] IntegrationMultiSelect
  - [ ] DateRangePicker
  - [ ] FormatFilter (All/Posts/Reels)

- [ ] KPI cards
  - [ ] TotalReach + trend
  - [ ] TotalEngagement + trend
  - [ ] EngagementRate + trend
  - [ ] AverageViews (reels)

- [ ] TopContent component
  - [ ] Danh sách có thumbnail
  - [ ] Hiển thị caption, format, publishedAt, metrics
  - [ ] Sort theo reach/engagement/engagement rate
  - [ ] Pagination (10-20 item/trang)

- [ ] Data fetching
  - [ ] `useDashboardKPIs()`
  - [ ] `useTopContent()`
  - [ ] Tự refresh khi đổi filter
  - [ ] Loading + error state

### Testing
- [ ] Backend: unit KPI, top content; integration filter combos; edge no-data, single-day, large range
- [ ] Frontend: component filters/KPI; integration filter→API→UI; E2E flow dashboard

## Dev Notes

**Prerequisites:** Story 2.3 (metrics), Story 3.1 (groups).

**Stack:** NestJS/Prisma; Next.js/React; SWR/React Query; Tailwind/UI hiện có.

### Chiến lược tính toán

**KPI Aggregation** (ví dụ):
```ts
// groupBy AnalyticsDailyMetric theo date và filter
// tính totalReach, totalImpressions, totalEngagement
const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
```

**Top Content** (ví dụ):
```ts
prisma.analyticsContent.findMany({
  where: { organizationId, publishedAt: { gte: startDate, lte: endDate }, ...(format!=='all' && { contentType: format }) },
  include: { metrics: { where: { date: { gte: startDate, lte: endDate } } } },
  orderBy: { metrics: { _sum: { [sortBy]: 'desc' } } },
  take: limit,
});
```

### UI/UX

**Layout:** Sidebar filters + KPI cards + Top Content list. Filter thay đổi → cập nhật KPI + top content. Trend indicator so sánh kỳ trước (↑ xanh, ↓ đỏ).

### API Design

`GET /api/analytics/dashboard/kpis`
Query: groupId?, integrationIds?, startDate, endDate, format? ('post'|'reel'|'all')
Response: period, kpis (reach, impressions, engagement, engagementRate, averageViews, totalContent), trends (% đổi kỳ trước).

`GET /api/analytics/dashboard/top-content`
Query: groupId?, integrationIds?, startDate, endDate, format?, sortBy?, limit?, offset?
Response: content[] (caption, format, publishedAt, metrics tổng hợp) + pagination.

### Performance

- Cache KPI 5 phút, top content 10 phút; invalidate khi có dữ liệu mới.
- Prisma aggregation, index (org, date, integrationId); date range ≤ 90 ngày.
- FE: debounce 300ms, SWR/React Query cache, skeleton loaders, lazy thumbnails.

### Edge Cases

- No data: empty state + CTA track pages.
- Single day: trend N/A.
- Large range: cảnh báo hiệu năng.
- Mixed types: videoViews null cho post; tính engagement rate nhất quán.

### Effort (ước tính)
- Backend: 4–6h; Frontend: 6–8h; Tổng: 10–14h.

### Definition of Done
- Backend KPI đúng, API đáp ứng mọi filter; FE hiển thị KPI + trend; top content sortable + paginate; filters persist; loading/error; tests (unit/integration/E2E); Swagger; merge + đánh dấu done.

## Story Context Requirements

- Từ Story 2.3: schema AnalyticsDailyMetric, các field, pattern data.
- Từ Story 3.1: cấu trúc group, quan hệ group-page, query group.
- Từ PRD: định nghĩa KPI, công thức engagement rate, yêu cầu dashboard.
- Từ codebase: pattern API/FE hiện hữu.

[ASSUMPTION: Nếu thiếu yêu cầu UI cụ thể, dùng layout chuẩn analytics của Postiz: sidebar filters bên trái, KPI cards hàng đầu, top content bên dưới.]
