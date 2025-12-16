# Story 16.1: Quality Score Dashboard

Status: ready-for-dev

## Story

As a **Leader**,
I want **quality score cho mỗi post/video**,
So that **tôi biết content nào cần cải thiện**.

## Acceptance Criteria

1. **Given** content metrics,
   **When** user xem quality dashboard,
   **Then** hiển thị overall score 0-100 với breakdown.

2. **Given** quality score breakdown,
   **When** user xem details,
   **Then** hiển thị scores cho: engagement, watch time, compliance.

3. **Given** multiple content items,
   **When** user xem dashboard,
   **Then** hiển thị list sorted by quality score.

4. **Given** quality trends,
   **When** user xem dashboard,
   **Then** hiển thị quality trend over time (7/14/30 days).

5. **Given** low quality content,
   **When** user xem details,
   **Then** highlight areas needing improvement.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ContentQualityService (AC: #1, #2)
  - [ ] Implement `calculateQualityScore(contentId)` method
  - [ ] Define quality factors and weights
  - [ ] Calculate sub-scores for each factor

- [ ] Add Quality List endpoint (AC: #3)
  - [ ] Implement `getContentByQuality(organizationId, options)` method
  - [ ] Support sorting and filtering

- [ ] Add Quality Trends (AC: #4)
  - [ ] Implement `getQualityTrends(organizationId, days)` method
  - [ ] Aggregate by day/week

- [ ] Add Improvement Highlights (AC: #5)
  - [ ] Identify low-scoring factors
  - [ ] Generate improvement suggestions

- [ ] Add Quality Score API endpoints
  - [ ] GET /api/quality/score/:contentId - Get single content score
  - [ ] GET /api/quality/list - Get content list by quality
  - [ ] GET /api/quality/trends - Get quality trends
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create QualityScoreCard component (AC: #1, #2)
  - [ ] Overall score display (0-100)
  - [ ] Score breakdown by factor
  - [ ] Visual indicators (color-coded)

- [ ] Create QualityContentList component (AC: #3)
  - [ ] Sortable list of content
  - [ ] Quality score badges
  - [ ] Quick actions

- [ ] Create QualityTrendChart component (AC: #4)
  - [ ] Line chart for trends
  - [ ] Date range selector

- [ ] Create ImprovementHighlights component (AC: #5)
  - [ ] List of areas to improve
  - [ ] Priority indicators

- [ ] Create Quality Dashboard page
  - [ ] Overview section
  - [ ] Content list
  - [ ] Trends chart

### Testing

- [ ] Backend tests
  - [ ] Unit test: Quality score calculation
  - [ ] Unit test: Factor scoring
  - [ ] Unit test: Trend aggregation

- [ ] Frontend tests
  - [ ] Component test: QualityScoreCard
  - [ ] Component test: QualityContentList

## Dev Notes

**Prerequisites:**
- Epic 2-4 complete (content metrics available)

**Quality Factors (MVP):**

| Factor | Weight | Description |
|--------|--------|-------------|
| Engagement | 35% | Likes, comments, shares relative to reach |
| Watch Time | 25% | Average view duration, completion rate |
| Compliance | 25% | Policy adherence, no bait |
| Consistency | 15% | Regular posting, brand alignment |

**Score Interpretation:**
- 80-100: Excellent quality
- 60-79: Good quality
- 40-59: Average, needs improvement
- 0-39: Poor quality, action required

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/quality/content-quality.service.ts`
- `apps/backend/src/api/routes/quality.controller.ts`
- `apps/frontend/src/components/quality/quality-score-card.tsx`
- `apps/frontend/src/components/quality/quality-content-list.tsx`
- `apps/frontend/src/app/(app)/(site)/quality/page.tsx`

### References

- [Source: docs/epics.md#Epic-16]
- [Source: docs/research/feature-improvement-proposals.md#Epic-16]

## Dev Agent Record

### Context Reference

- `docs/stories/16-1-quality-score-dashboard.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 16.1 drafted by Mary (Business Analyst)
