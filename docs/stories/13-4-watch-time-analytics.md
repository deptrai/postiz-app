# Story 13.4: Watch Time Analytics

Status: ready-for-dev

## Story

As a **Leader**,
I want **analytics chi tiết về watch time**,
So that **tôi hiểu viewer behavior và tối ưu cho monetization**.

## Acceptance Criteria

1. **Given** video metrics,
   **When** user xem watch time analytics,
   **Then** hiển thị total watch time across all videos.

2. **Given** video metrics,
   **When** user xem analytics,
   **Then** hiển thị average view duration per video.

3. **Given** video metrics,
   **When** user xem analytics,
   **Then** hiển thị completion rate (% viewers who watch to end).

4. **Given** watch time data,
   **When** user xem trends,
   **Then** hiển thị watch time trend over time (7/14/30 days).

5. **Given** multiple videos,
   **When** user xem analytics,
   **Then** hiển thị top videos by watch time.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create WatchTimeAnalyticsService (AC: #1, #2, #3)
  - [ ] Implement `getWatchTimeMetrics(organizationId)` method
  - [ ] Calculate total watch time
  - [ ] Calculate average view duration
  - [ ] Calculate completion rate

- [ ] Add Watch Time Trends (AC: #4)
  - [ ] Implement `getWatchTimeTrends(organizationId, days)` method
  - [ ] Aggregate by day/week
  - [ ] Calculate growth rate

- [ ] Add Top Videos by Watch Time (AC: #5)
  - [ ] Implement `getTopVideosByWatchTime(organizationId, limit)` method
  - [ ] Sort by total watch time
  - [ ] Include video metadata

- [ ] Add Watch Time API endpoints
  - [ ] GET /api/monetization/watch-time - Get watch time metrics
  - [ ] GET /api/monetization/watch-time/trends - Get trends
  - [ ] GET /api/monetization/watch-time/top-videos - Get top videos
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create WatchTimeMetricsCard component (AC: #1, #2, #3)
  - [ ] Total watch time display
  - [ ] Average duration display
  - [ ] Completion rate display

- [ ] Create WatchTimeTrendChart component (AC: #4)
  - [ ] Line chart for trends
  - [ ] Date range selector
  - [ ] Growth indicator

- [ ] Create TopVideosList component (AC: #5)
  - [ ] List of top videos
  - [ ] Watch time per video
  - [ ] Link to video details

- [ ] Integrate into MonetizationDashboard
  - [ ] Watch time section
  - [ ] Trends chart
  - [ ] Top videos

### Testing

- [ ] Backend tests
  - [ ] Unit test: Watch time calculation
  - [ ] Unit test: Trend aggregation
  - [ ] Unit test: Top videos sorting

- [ ] Frontend tests
  - [ ] Component test: WatchTimeMetricsCard
  - [ ] Component test: WatchTimeTrendChart

## Dev Notes

**Prerequisites:**
- Story 13.1 complete (Monetization Dashboard)
- Video metrics available from Epic 2

**Watch Time Metrics:**
- **Total Watch Time:** Sum of all view durations
- **Average View Duration:** Total watch time / total views
- **Completion Rate:** (Views to end / total views) * 100

**Data Sources:**
- `AnalyticsDailyMetric.views` - View count
- `AnalyticsContent.duration` - Video duration (if available)
- [ASSUMPTION: Watch time data available from Facebook API or calculated from views * estimated duration]

**Monetization Relevance:**
- In-Stream Ads: 30,000 one-minute views needed
- Reels: 600,000 viewed minutes needed
- Fan Subscription: 180,000 minutes watched needed

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/monetization/watch-time-analytics.service.ts`
- `apps/frontend/src/components/monetization/watch-time-metrics-card.tsx`
- `apps/frontend/src/components/monetization/watch-time-trend-chart.tsx`
- `apps/frontend/src/components/monetization/top-videos-list.tsx`

### References

- [Source: docs/epics.md#Story-13.4]
- [Source: docs/stories/13-1-monetization-dashboard.md]
- [Note: Merged from Epic 15.1 - Video Performance Analyzer]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 13.4 drafted by Mary (Business Analyst)
- 2025-12-14: Merged from Epic 15.1 (Watch Time Analytics)
