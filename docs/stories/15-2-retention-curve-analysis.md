# Story 15.2: Retention Curve Analysis

Status: ready-for-dev

## Story

As a **Leader**,
I want **xem retention curve của video**,
So that **tôi biết điểm drop-off và tối ưu content để giữ chân viewers**.

## Acceptance Criteria

1. **Given** video với watch time data,
   **When** user xem retention analysis,
   **Then** hiển thị visual retention graph (% viewers remaining at each point).

2. **Given** retention curve data,
   **When** user xem analysis,
   **Then** hệ thống identify và highlight drop-off points (>10% drop).

3. **Given** retention data,
   **When** user xem analysis,
   **Then** hiển thị comparison với niche benchmark (average retention curve).

4. **Given** identified drop-off points,
   **When** user xem suggestions,
   **Then** hệ thống gợi ý improvements dựa trên drop-off patterns.

5. **Given** multiple videos,
   **When** user xem retention analysis,
   **Then** có thể compare retention curves của 2-3 videos.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create RetentionAnalyticsService (AC: #1, #2)
  - [ ] Implement `getRetentionCurve(organizationId, videoId)` method
  - [ ] Calculate retention percentage at intervals (0%, 25%, 50%, 75%, 100%)
  - [ ] Identify drop-off points (>10% decrease)
  - [ ] [ASSUMPTION: Retention data calculated from view duration vs video length]

- [ ] Add Benchmark Comparison (AC: #3)
  - [ ] Implement `getNicheBenchmark(niche, format)` method
  - [ ] Store industry average retention curves
  - [ ] Calculate deviation from benchmark
  - [ ] [ASSUMPTION: Benchmark data is pre-configured based on industry research]

- [ ] Add Improvement Suggestions (AC: #4)
  - [ ] Implement `getRetentionSuggestions(retentionData)` method
  - [ ] Analyze drop-off patterns
  - [ ] Generate actionable suggestions
  - [ ] Map drop-off points to common issues (hook, pacing, length)

- [ ] Add Video Comparison (AC: #5)
  - [ ] Implement `compareRetentionCurves(videoIds[])` method
  - [ ] Normalize curves for comparison
  - [ ] Highlight differences

- [ ] Add Retention API endpoints
  - [ ] GET /api/video-analytics/retention/:videoId - Get retention curve
  - [ ] GET /api/video-analytics/retention/:videoId/benchmark - Get benchmark comparison
  - [ ] GET /api/video-analytics/retention/:videoId/suggestions - Get suggestions
  - [ ] POST /api/video-analytics/retention/compare - Compare multiple videos
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create RetentionCurveChart component (AC: #1)
  - [ ] Line chart showing retention over video duration
  - [ ] X-axis: video progress (0-100%)
  - [ ] Y-axis: viewer retention (0-100%)
  - [ ] Interactive tooltips

- [ ] Create DropOffIndicator component (AC: #2)
  - [ ] Visual markers on chart for drop-off points
  - [ ] Drop-off severity color coding
  - [ ] Click to see details

- [ ] Create BenchmarkOverlay component (AC: #3)
  - [ ] Overlay benchmark curve on retention chart
  - [ ] Toggle benchmark visibility
  - [ ] Show deviation percentage

- [ ] Create RetentionSuggestions component (AC: #4)
  - [ ] List of improvement suggestions
  - [ ] Priority ordering
  - [ ] Link to specific drop-off points

- [ ] Create VideoComparisonView component (AC: #5)
  - [ ] Multi-video selector
  - [ ] Overlaid retention curves
  - [ ] Legend with video names

- [ ] Integrate into Video Analytics page
  - [ ] Retention tab/section
  - [ ] Video selector
  - [ ] Full analysis view

### Testing

- [ ] Backend tests
  - [ ] Unit test: Retention curve calculation
  - [ ] Unit test: Drop-off detection
  - [ ] Unit test: Benchmark comparison
  - [ ] Unit test: Suggestion generation

- [ ] Frontend tests
  - [ ] Component test: RetentionCurveChart
  - [ ] Component test: DropOffIndicator
  - [ ] Component test: VideoComparisonView

## Dev Notes

**Prerequisites:**
- Story 13.4 complete (Watch Time Analytics)
- Video metrics available from Epic 2
- Video duration data available

**Retention Curve Calculation:**
- **Interval Points:** 0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100%
- **Retention %:** (Viewers at point / Total viewers) * 100
- **Drop-off Point:** Where retention drops >10% between intervals

**Common Drop-off Patterns:**
1. **Early Drop (0-10%):** Weak hook, misleading thumbnail
2. **Mid Drop (40-60%):** Pacing issues, content drag
3. **Late Drop (80-90%):** Too long, no payoff

**Benchmark Data Sources:**
- [ASSUMPTION: Industry averages from social media research]
- Reels: 60% retention at 50% mark is good
- Long-form: 50% retention at 50% mark is good

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/video-analytics/retention-analytics.service.ts`
- `apps/frontend/src/components/video-analytics/retention-curve-chart.tsx`
- `apps/frontend/src/components/video-analytics/drop-off-indicator.tsx`
- `apps/frontend/src/components/video-analytics/benchmark-overlay.tsx`
- `apps/frontend/src/components/video-analytics/retention-suggestions.tsx`
- `apps/frontend/src/components/video-analytics/video-comparison-view.tsx`

### References

- [Source: docs/research/feature-improvement-proposals.md#Epic-15]
- [Source: docs/stories/13-4-watch-time-analytics.md]
- [Dependency: Epic 2 - Ingestion & Storage]

## Dev Agent Record

### Context Reference

- docs/stories/15-2-retention-curve-analysis.context.xml

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-17: Story 15.2 drafted by Bob (Scrum Master)
