# Story 15.2: Phân tích Retention Curve

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **xem retention curve của video** để **biết điểm drop-off và tối ưu content giữ chân viewers**.

## Acceptance Criteria

1. **Given** video với watch time data, **when** user xem retention analysis, **then** hiển thị visual retention graph (% viewers còn lại tại mỗi điểm).
2. **Given** retention curve data, **when** user xem analysis, **then** hệ thống identify và highlight drop-off points (>10% drop).
3. **Given** retention data, **when** user xem analysis, **then** hiển thị so sánh với niche benchmark (average retention curve).
4. **Given** drop-off points đã xác định, **when** user xem suggestions, **then** hệ thống gợi ý improvements dựa drop-off patterns.
5. **Given** nhiều videos, **when** user xem retention analysis, **then** có thể compare retention curves của 2–3 videos.

## Tasks / Subtasks

### Backend
- [ ] RetentionAnalyticsService:
  - `getRetentionCurve(orgId, videoId)`, tính retention % tại intervals (0%, 25%, 50%, 75%, 100%), identify drop-off points (>10% decrease)
- [ ] Benchmark Comparison:
  - `getNicheBenchmark(niche, format)`, lưu industry average retention curves, tính deviation từ benchmark
- [ ] Improvement Suggestions:
  - `getRetentionSuggestions(retentionData)`, phân tích drop-off patterns, sinh gợi ý hành động, map drop-off → common issues (hook, pacing, length)
- [ ] Video Comparison:
  - `compareRetentionCurves(videoIds[])`, normalize curves, highlight differences
- [ ] API:
  - GET /api/video-analytics/retention/:videoId
  - GET /api/video-analytics/retention/:videoId/benchmark
  - GET /api/video-analytics/retention/:videoId/suggestions
  - POST /api/video-analytics/retention/compare
  - Swagger docs

### Frontend
- [ ] RetentionCurveChart: Line chart retention over duration, X-axis: video progress (0–100%), Y-axis: viewer retention (0–100%), interactive tooltips
- [ ] DropOffIndicator: Visual markers cho drop-off points, color coding severity, click xem chi tiết
- [ ] BenchmarkOverlay: Overlay benchmark curve, toggle visibility, hiển thị deviation %
- [ ] RetentionSuggestions: Danh sách gợi ý cải thiện, priority ordering, link tới drop-off points
- [ ] VideoComparisonView: Multi-video selector, overlaid retention curves, legend với video names
- [ ] Tích hợp vào Video Analytics page

### Testing
- [ ] Backend: unit retention curve calc, drop-off detection, benchmark comparison, suggestion generation
- [ ] Frontend: component RetentionCurveChart, DropOffIndicator, VideoComparisonView

## Dev Notes

**Prereq:** Story 13.4 hoàn tất; có video metrics, video duration data.

**Retention Curve Calculation:**
- Interval Points: 0%, 10%, 20%, ..., 100%
- Retention %: (Viewers at point / Total viewers) * 100
- Drop-off Point: retention drops >10% giữa intervals

**Common Drop-off Patterns:**
1. Early Drop (0–10%): Weak hook, misleading thumbnail
2. Mid Drop (40–60%): Pacing issues, content drag
3. Late Drop (80–90%): Too long, no payoff

**Benchmark Data:**
- Reels: 60% retention at 50% mark is good
- Long-form: 50% retention at 50% mark is good

[ASSUMPTION: Retention data tính từ view duration vs video length; nếu thiếu retention data chi tiết, ước lượng dựa average view duration; benchmark data từ industry research, pre-configured.]

**File dự kiến:** retention-analytics.service.ts, retention-curve-chart.tsx, drop-off-indicator.tsx, benchmark-overlay.tsx, retention-suggestions.tsx, video-comparison-view.tsx.
