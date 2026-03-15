# Story 13.4: Phân tích Watch Time

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **analytics chi tiết về watch time** để **hiểu viewer behavior và tối ưu cho monetization**.

## Acceptance Criteria

1. **Given** video metrics, **when** user xem watch time analytics, **then** hiển thị total watch time tất cả videos.
2. **Given** video metrics, **when** user xem analytics, **then** hiển thị average view duration per video.
3. **Given** video metrics, **when** user xem analytics, **then** hiển thị completion rate (% viewers xem đến cuối).
4. **Given** watch time data, **when** user xem trends, **then** hiển thị watch time trend theo thời gian (7/14/30 ngày).
5. **Given** nhiều videos, **when** user xem analytics, **then** hiển thị top videos theo watch time.

## Tasks / Subtasks

### Backend
- [ ] WatchTimeAnalyticsService:
  - `getWatchTimeMetrics(orgId)`, tính total watch time, average view duration, completion rate
- [ ] Watch Time Trends:
  - `getWatchTimeTrends(orgId, days)`, aggregate theo day/week, tính growth rate
- [ ] Top Videos by Watch Time:
  - `getTopVideosByWatchTime(orgId, limit)`, sort theo total watch time, kèm metadata
- [ ] API:
  - GET /api/monetization/watch-time
  - GET /api/monetization/watch-time/trends
  - GET /api/monetization/watch-time/top-videos
  - Swagger docs

### Frontend
- [ ] WatchTimeMetricsCard:
  - Hiển thị total watch time, average duration, completion rate
- [ ] WatchTimeTrendChart:
  - Line chart trends, date range selector, growth indicator
- [ ] TopVideosList:
  - Danh sách top videos, watch time per video, link chi tiết
- [ ] Tích hợp vào MonetizationDashboard

### Testing
- Backend: unit watch time calc, trend aggregation, top videos sorting
- Frontend: component WatchTimeMetricsCard, WatchTimeTrendChart

## Dev Notes

**Prereq:** Story 13.1 hoàn tất; video metrics từ Epic 2.

**Watch Time Metrics:**
- Total Watch Time: tổng duration views
- Average View Duration: total watch time / total views
- Completion Rate: (views to end / total views) * 100

**Data Sources:**
- `AnalyticsDailyMetric.views` (view count)
- `AnalyticsContent.duration` (video duration nếu có)

[ASSUMPTION: Watch time data từ Facebook API hoặc tính từ views * estimated duration; nếu thiếu duration, ước lượng dựa contentType (Reels ~30s, Videos ~3min).]

**Liên quan Monetization:**
- In-Stream Ads: 30K one-minute views
- Reels: 600K viewed minutes
- Fan Subscription: 180K minutes watched

**File dự kiến:** watch-time-analytics.service.ts, watch-time-metrics-card.tsx, watch-time-trend-chart.tsx, top-videos-list.tsx.
