# Story 13.2: Gap Analysis & Recommendations

Status: ready-for-dev

## Story

As a **Leader**,
I want **phân tích gap và gợi ý cách đạt eligibility**,
So that **tôi có action plan rõ ràng**.

## Acceptance Criteria

1. **Given** current metrics và thresholds,
   **When** user xem gap analysis,
   **Then** hiển thị "Bạn cần thêm X followers, Y watch minutes".

2. **Given** gap analysis data,
   **When** user xem recommendations,
   **Then** gợi ý content types để tăng metrics.

3. **Given** historical growth data,
   **When** user xem recommendations,
   **Then** gợi ý posting frequency tối ưu.

4. **Given** multiple gaps,
   **When** user xem analysis,
   **Then** prioritize gaps theo impact và effort.

5. **Given** recommendations,
   **When** user xem chi tiết,
   **Then** hiển thị expected impact của mỗi recommendation.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend MonetizationService (AC: #1, #4)
  - [ ] Implement `getGapAnalysis(organizationId)` method
  - [ ] Calculate gaps for each metric
  - [ ] Prioritize gaps by impact

- [ ] Create RecommendationEngine (AC: #2, #3, #5)
  - [ ] Implement `getRecommendations(organizationId, gaps)` method
  - [ ] Generate content type recommendations
  - [ ] Generate posting frequency recommendations
  - [ ] Calculate expected impact

- [ ] Add Gap Analysis API endpoints (AC: #1)
  - [ ] GET /api/monetization/gaps - Get gap analysis
  - [ ] GET /api/monetization/recommendations - Get recommendations
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create GapAnalysisCard component (AC: #1, #4)
  - [ ] Display gaps with visual indicators
  - [ ] Priority badges
  - [ ] "Bạn cần thêm X" messaging

- [ ] Create RecommendationsPanel component (AC: #2, #3, #5)
  - [ ] List of actionable recommendations
  - [ ] Expected impact display
  - [ ] Action buttons

- [ ] Integrate into MonetizationDashboard
  - [ ] Gap analysis section
  - [ ] Recommendations section

### Testing

- [ ] Backend tests
  - [ ] Unit test: Gap calculation
  - [ ] Unit test: Recommendation generation
  - [ ] Unit test: Impact estimation

- [ ] Frontend tests
  - [ ] Component test: GapAnalysisCard
  - [ ] Component test: RecommendationsPanel

## Dev Notes

**Prerequisites:**
- Story 13.1 complete (Monetization Dashboard)

**Recommendation Types:**
1. **Content Type:** "Post more Reels to increase watch time"
2. **Posting Frequency:** "Increase to 2 posts/day to grow faster"
3. **Engagement:** "Use more CTAs to boost engagement"
4. **Timing:** "Post at peak hours for better reach"

**Gap Prioritization Logic:**
- High: >50% gap, high impact metric
- Medium: 20-50% gap
- Low: <20% gap (almost there!)

### Project Structure Notes

**New/Modified Files:**
- `libraries/nestjs-libraries/src/database/prisma/monetization/recommendation.service.ts`
- `apps/frontend/src/components/monetization/gap-analysis-card.tsx`
- `apps/frontend/src/components/monetization/recommendations-panel.tsx`

### References

- [Source: docs/epics.md#Story-13.2]
- [Source: docs/stories/13-1-monetization-dashboard.md]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 13.2 drafted by Mary (Business Analyst)
