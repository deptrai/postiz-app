# Story 3.3: Engagement Rate và Format Breakdown

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **tính toán engagement rate và breakdown theo định dạng** để biết **format nào (Posts vs Reels) đang thắng cho từng niche**.

## Acceptance Criteria

1. **Given** metrics có reactions/comments/shares và reach (Story 2.3), **when** hiển thị dashboard, **then** engagement rate được tính đúng: (reactions + comments + shares) / reach × 100.
2. **And** dashboard hiển thị format breakdown cho Posts vs Reels.
3. **And** engagement rate được tính riêng cho từng format.
4. **And** visualization highlight format có engagement tốt hơn với filter đã chọn.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng AnalyticsDashboardService (Story 3.2)
  - [ ] `getFormatBreakdown()` – aggregate theo contentType
  - [ ] Tính engagement rate từng format
  - [ ] So sánh và xác định winner
  - [ ] Xử lý edge case: không có post/reel, hoặc bằng nhau

- [ ] API endpoint
  - [ ] `GET /api/analytics/dashboard/format-breakdown`
  - [ ] Query: groupId, integrationIds[], startDate, endDate
  - [ ] Trả breakdown theo format kèm engagement rate
  - [ ] Swagger docs

### Frontend
- [ ] Mở rộng Dashboard (Story 3.2)
  - [ ] Thêm FormatBreakdownChart
  - [ ] Hiển thị engagement rate mỗi format
  - [ ] Highlight format thắng
  - [ ] Hiển thị so sánh (reach, engagement, rate)

- [ ] Visualization
  - [ ] Bar chart hoặc donut
  - [ ] So sánh cạnh nhau
  - [ ] Badge “winner”

- [ ] Data fetching
  - [ ] `useFormatBreakdown()` hook
  - [ ] Tích hợp filter dashboard
  - [ ] Auto refresh khi đổi filter

### Testing
- [ ] Backend: unit tính rate; aggregate format; edge no-data, single format, equal rates
- [ ] Frontend: component FormatBreakdownChart; integration filter→API→chart; logic winner

## Dev Notes

**Prerequisite:** Story 3.2 (Dashboard KPIs).
**Stack:** mở rộng AnalyticsDashboardService; FE thêm component và chart library có sẵn.

### Công thức Engagement Rate
```
Engagement Rate = ((Reactions + Comments + Shares) / Reach) × 100
```
- Dùng reach (unique), không dùng impressions.
- Null/undefined tính là 0.
- Reach = 0 → 0%.
- Làm tròn 1 chữ số thập phân khi hiển thị.

### Format Breakdown Aggregation (mẫu dữ liệu)
```json
{
  "posts": {
    "totalContent": 25,
    "totalReach": 80000,
    "totalEngagement": 4000,
    "engagementRate": 5.0,
    "metrics": { "reactions": 2800, "comments": 800, "shares": 400 }
  },
  "reels": {
    "totalContent": 20,
    "totalReach": 70000,
    "totalEngagement": 5600,
    "engagementRate": 8.0,
    "metrics": {
      "reactions": 4200, "comments": 1000, "shares": 400, "videoViews": 45000
    }
  },
  "winner": "reels",
  "winnerBy": 3.0
}
```

### Backend gợi ý (pseudocode)
```ts
async getFormatBreakdown(orgId, filters) {
  const posts = await getFormatMetrics(orgId, filters, 'post');
  const reels = await getFormatMetrics(orgId, filters, 'reel');

  const postsRate = calcRate(posts);
  const reelsRate = calcRate(reels);

  const winner = reelsRate > postsRate ? 'reels' : postsRate > reelsRate ? 'posts' : 'tie';
  const winnerBy = Math.abs(reelsRate - postsRate);

  return {
    posts: { ...posts, engagementRate: postsRate },
    reels: { ...reels, engagementRate: reelsRate },
    winner,
    winnerBy: winner === 'tie' ? 0 : winnerBy,
  };
}
```

### Frontend gợi ý

**FormatBreakdownChart**: hai thẻ Posts/Reels, highlight winner, hiển thị Content/Reach/Engagement/Engagement Rate; thêm chart so sánh; banner “Reels performing X% better”.

### API Design
`GET /api/analytics/dashboard/format-breakdown`
- Query: groupId?, integrationIds?, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
- Response: breakdown như mẫu trên (posts, reels, winner, winnerBy)

### Performance
- Tái sử dụng filter của Story 3.2.
- Cache breakdown ~10 phút; có thể gộp chung với KPI call để giảm API.
- Query dùng index (org, contentType, publishedAt); filter group/integration.

### Edge Cases
- Không có dữ liệu: trả zero, winner = tie.
- Chỉ có 1 format: winner là format có dữ liệu, winnerBy = rate.
- Bằng nhau: winner = tie.

### File List (dự kiến)
- Sửa: `analytics-dashboard.service.ts`, `analytics.controller.ts` (endpoint)
- FE: component FormatBreakdownChart + hook `useFormatBreakdown`
- Docs: cập nhật Swagger, story này

[ASSUMPTION: Dùng reach để tính rate; nếu comments/shares thiếu, đặt 0. Nếu muốn tính videoViews riêng, chỉ áp dụng cho reels.]
