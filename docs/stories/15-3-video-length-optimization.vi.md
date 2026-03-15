# Story 15.3: Tối ưu độ dài video

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **biết video length tối ưu cho từng format và niche** để **maximize engagement và watch time**.

## Acceptance Criteria

1. **Given** video performance data, **when** user xem length analysis, **then** hiển thị performance breakdown theo length ranges (0–15s, 15–30s, 30–60s, 60–180s, 180s+).
2. **Given** performance data by length, **when** user xem analysis, **then** hiển thị optimal length recommendation per format (reel, video, story).
3. **Given** length analysis data, **when** user xem recommendations, **then** hiển thị so sánh với niche benchmarks (industry optimal lengths).
4. **Given** video history của user, **when** user xem insights, **then** hiển thị "sweet spot" length range với highest engagement rate.
5. **Given** length recommendations, **when** user xem chi tiết, **then** hiển thị actionable tips để optimize video length.

## Tasks / Subtasks

### Backend
- [ ] VideoLengthAnalyticsService:
  - `getPerformanceByLength(orgId, filters)`, định nghĩa length ranges, tính engagement rate per range, average views, completion rate per range
- [ ] Optimal Length Recommendation:
  - `getOptimalLength(orgId, format)`, phân tích top-performing videos by length, tính "sweet spot" range, trả recommendation với confidence score
- [ ] Niche Benchmark Comparison:
  - `getNicheLengthBenchmarks(niche, format)`, lưu industry optimal lengths per niche/format, tính deviation từ benchmark
- [ ] Optimization Tips:
  - `getLengthOptimizationTips(analysisData)`, sinh actionable tips, map length issues → recommendations
- [ ] API:
  - GET /api/video-analytics/length
  - GET /api/video-analytics/length/optimal
  - GET /api/video-analytics/length/benchmark
  - GET /api/video-analytics/length/tips
  - Swagger docs

### Frontend
- [ ] LengthPerformanceChart: Bar chart engagement by length range, X-axis: length ranges, Y-axis: engagement rate/views, color coding performance levels
- [ ] OptimalLengthCard: Recommended length range, confidence score, "sweet spot" visualization, format-specific recommendations
- [ ] LengthBenchmarkComparison: Side-by-side comparison với industry, deviation indicator, niche selector
- [ ] LengthOptimizationTips: Danh sách actionable tips, priority ordering, examples và best practices
- [ ] Tích hợp vào Video Analytics page

### Testing
- [ ] Backend: unit performance by length calc, optimal length detection, benchmark comparison, tips generation
- [ ] Frontend: component LengthPerformanceChart, OptimalLengthCard, LengthBenchmarkComparison

## Dev Notes

**Prereq:** Story 13.4, 15.2 (optional) hoàn tất; có video metrics, video duration data.

**Length Ranges:**
- Short (0–15s): Stories, quick tips
- Medium-Short (15–30s): Optimal cho Reels
- Medium (30–60s): Extended Reels, short videos
- Long (60–180s): Standard videos
- Extended (180s+): Long-form content

**Performance Metrics per Range:** Total videos, avg views, avg engagement rate, avg completion rate, top performer.

**Industry Benchmarks:**
| Format | Optimal Length |
|--------|----------------|
| Reels | 15–30 seconds |
| Stories | 7–15 seconds |
| Short Video | 60–90 seconds |
| Long Video | 3–10 minutes |

**Niche Adjustments:** Educational +20%, Entertainment -10%, Tutorial +50%, News standard.

[ASSUMPTION: Video duration từ content metadata hoặc ước lượng từ content type; benchmark data pre-configured từ industry research; nếu thiếu duration, skip length analysis.]

**File dự kiến:** video-length-analytics.service.ts, length-performance-chart.tsx, optimal-length-card.tsx, length-benchmark-comparison.tsx, length-optimization-tips.tsx.
