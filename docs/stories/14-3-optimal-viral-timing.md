# Story 14.3: Optimal Viral Timing

Status: ready-for-dev

## Story

As a **Leader**,
I want **biết thời điểm tốt nhất để viral**,
So that **tôi maximize reach potential**.

## Acceptance Criteria

1. **Given** historical viral content data,
   **When** user request optimal timing,
   **Then** hệ thống recommend posting windows cho viral potential.

2. **Given** audience activity patterns,
   **When** calculating optimal timing,
   **Then** factor in audience online times.

3. **Given** content format (Reels vs Post),
   **When** user request timing,
   **Then** provide format-specific recommendations.

4. **Given** niche/group context,
   **When** calculating timing,
   **Then** customize recommendations per niche.

5. **Given** timing recommendations,
   **When** user xem details,
   **Then** hiển thị confidence level và historical success rate.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ViralTimingService (AC: #1, #2)
  - [ ] Implement `getOptimalViralTiming(organizationId, options)` method
  - [ ] Analyze historical viral content timing
  - [ ] Factor in audience activity patterns

- [ ] Add Format-Specific Timing (AC: #3)
  - [ ] Separate analysis for Reels vs Posts
  - [ ] Different optimal windows per format

- [ ] Add Niche-Specific Timing (AC: #4)
  - [ ] Group timing analysis by niche
  - [ ] Custom recommendations per group

- [ ] Add Confidence Metrics (AC: #5)
  - [ ] Calculate confidence based on data volume
  - [ ] Track historical success rate

- [ ] Add Viral Timing API endpoints
  - [ ] GET /api/viral/timing - Get optimal timing
  - [ ] GET /api/viral/timing/heatmap - Get timing heatmap
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create ViralTimingCard component (AC: #1, #5)
  - [ ] Recommended posting windows
  - [ ] Confidence indicators
  - [ ] Success rate display

- [ ] Create TimingHeatmap component (AC: #2)
  - [ ] Visual heatmap by day/hour
  - [ ] Interactive selection

- [ ] Create FormatTimingTabs component (AC: #3)
  - [ ] Tabs for Reels vs Posts
  - [ ] Format-specific recommendations

- [ ] Integrate into Viral Optimizer page
  - [ ] Timing section
  - [ ] Quick schedule button

### Testing

- [ ] Backend tests
  - [ ] Unit test: Timing analysis
  - [ ] Unit test: Format-specific calculation
  - [ ] Unit test: Confidence calculation

- [ ] Frontend tests
  - [ ] Component test: ViralTimingCard
  - [ ] Component test: TimingHeatmap

## Dev Notes

**Prerequisites:**
- Story 14.1 complete (Viral Score Service)
- Historical posting data with timestamps

**Timing Analysis Approach:**
1. Analyze viral content posting times
2. Cross-reference with audience activity
3. Weight by engagement velocity (early engagement)
4. Segment by format and niche

**Optimal Windows (Example):**
- **Reels:** 7-9 AM, 12-2 PM, 7-10 PM
- **Posts:** 9-11 AM, 1-3 PM, 6-8 PM

**Confidence Levels:**
- High: >100 data points, >70% success rate
- Medium: 50-100 data points, 50-70% success rate
- Low: <50 data points, <50% success rate

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/viral/viral-timing.service.ts`
- `apps/frontend/src/components/viral/viral-timing-card.tsx`
- `apps/frontend/src/components/viral/timing-heatmap.tsx`

### References

- [Source: docs/epics.md#Story-14.3]
- [Source: docs/stories/14-1-viral-score-prediction.md]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 14.3 drafted by Mary (Business Analyst)
