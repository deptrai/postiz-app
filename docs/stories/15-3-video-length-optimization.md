# Story 15.3: Video Length Optimization

Status: ready-for-dev

## Story

As a **Leader**,
I want **biết video length tối ưu cho từng format và niche**,
So that **tôi maximize engagement và watch time**.

## Acceptance Criteria

1. **Given** video performance data,
   **When** user xem length analysis,
   **Then** hiển thị performance breakdown by video length ranges (0-15s, 15-30s, 30-60s, 60-180s, 180s+).

2. **Given** performance data by length,
   **When** user xem analysis,
   **Then** hiển thị optimal length recommendation per format (reel, video, story).

3. **Given** length analysis data,
   **When** user xem recommendations,
   **Then** hiển thị comparison với niche benchmarks (industry optimal lengths).

4. **Given** user's video history,
   **When** user xem insights,
   **Then** hiển thị "sweet spot" length range với highest engagement rate.

5. **Given** length recommendations,
   **When** user xem details,
   **Then** hiển thị actionable tips để optimize video length.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create VideoLengthAnalyticsService (AC: #1, #2)
  - [ ] Implement `getPerformanceByLength(organizationId, filters)` method
  - [ ] Define length ranges: 0-15s, 15-30s, 30-60s, 60-180s, 180s+
  - [ ] Calculate engagement rate per length range
  - [ ] Calculate average views, completion rate per range
  - [ ] [ASSUMPTION: Video duration available from content metadata or estimated from content type]

- [ ] Add Optimal Length Recommendation (AC: #2, #4)
  - [ ] Implement `getOptimalLength(organizationId, format)` method
  - [ ] Analyze user's top-performing videos by length
  - [ ] Calculate "sweet spot" range with highest engagement
  - [ ] Return recommendation with confidence score

- [ ] Add Niche Benchmark Comparison (AC: #3)
  - [ ] Implement `getNicheLengthBenchmarks(niche, format)` method
  - [ ] Store industry optimal lengths per niche/format
  - [ ] Calculate deviation from benchmark
  - [ ] [ASSUMPTION: Benchmark data pre-configured based on industry research]

- [ ] Add Optimization Tips (AC: #5)
  - [ ] Implement `getLengthOptimizationTips(analysisData)` method
  - [ ] Generate actionable tips based on user's data
  - [ ] Map length issues to specific recommendations

- [ ] Add Video Length API endpoints
  - [ ] GET /api/video-analytics/length - Get performance by length
  - [ ] GET /api/video-analytics/length/optimal - Get optimal length recommendation
  - [ ] GET /api/video-analytics/length/benchmark - Get niche benchmarks
  - [ ] GET /api/video-analytics/length/tips - Get optimization tips
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create LengthPerformanceChart component (AC: #1)
  - [ ] Bar chart showing engagement by length range
  - [ ] X-axis: length ranges
  - [ ] Y-axis: engagement rate / views
  - [ ] Color coding for performance levels

- [ ] Create OptimalLengthCard component (AC: #2, #4)
  - [ ] Display recommended length range
  - [ ] Show confidence score
  - [ ] "Sweet spot" visualization
  - [ ] Format-specific recommendations

- [ ] Create LengthBenchmarkComparison component (AC: #3)
  - [ ] Side-by-side comparison with industry
  - [ ] Deviation indicator
  - [ ] Niche selector

- [ ] Create LengthOptimizationTips component (AC: #5)
  - [ ] List of actionable tips
  - [ ] Priority ordering
  - [ ] Examples and best practices

- [ ] Integrate into Video Analytics page
  - [ ] Length optimization tab/section
  - [ ] Format filter
  - [ ] Date range selector

### Testing

- [ ] Backend tests
  - [ ] Unit test: Performance by length calculation
  - [ ] Unit test: Optimal length detection
  - [ ] Unit test: Benchmark comparison
  - [ ] Unit test: Tips generation

- [ ] Frontend tests
  - [ ] Component test: LengthPerformanceChart
  - [ ] Component test: OptimalLengthCard
  - [ ] Component test: LengthBenchmarkComparison

## Dev Notes

**Prerequisites:**
- Story 13.4 complete (Watch Time Analytics)
- Story 15.2 complete (Retention Curve Analysis) - optional but recommended
- Video metrics available from Epic 2
- Video duration data available

**Length Ranges:**
- **Short (0-15s):** Stories, quick tips
- **Medium-Short (15-30s):** Optimal for Reels
- **Medium (30-60s):** Extended Reels, short videos
- **Long (60-180s):** Standard videos
- **Extended (180s+):** Long-form content

**Performance Metrics per Range:**
- Total videos in range
- Average views
- Average engagement rate
- Average completion rate
- Top performer in range

**Industry Benchmarks (ASSUMPTION):**
| Format | Optimal Length | Source |
|--------|----------------|--------|
| Reels | 15-30 seconds | Industry research |
| Stories | 7-15 seconds | Industry research |
| Short Video | 60-90 seconds | Industry research |
| Long Video | 3-10 minutes | Industry research |

**Niche Adjustments (ASSUMPTION):**
- Educational: +20% longer optimal
- Entertainment: -10% shorter optimal
- Tutorial: +50% longer optimal
- News: Standard optimal

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/video-analytics/video-length-analytics.service.ts`
- `apps/frontend/src/components/video-analytics/length-performance-chart.tsx`
- `apps/frontend/src/components/video-analytics/optimal-length-card.tsx`
- `apps/frontend/src/components/video-analytics/length-benchmark-comparison.tsx`
- `apps/frontend/src/components/video-analytics/length-optimization-tips.tsx`

### References

- [Source: docs/research/feature-improvement-proposals.md#Epic-15]
- [Source: docs/stories/13-4-watch-time-analytics.md]
- [Source: docs/stories/15-2-retention-curve-analysis.md]
- [Dependency: Epic 2 - Ingestion & Storage]

## Dev Agent Record

### Context Reference

- docs/stories/15-3-video-length-optimization.context.xml

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-17: Story 15.3 drafted by Bob (Scrum Master)
