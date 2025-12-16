# Story 14.1: Viral Score Prediction

Status: ready-for-dev

## Story

As a **Leader**,
I want **dự đoán viral score trước khi đăng**,
So that **tôi biết content nào có tiềm năng cao**.

## Acceptance Criteria

1. **Given** content metadata (caption, hashtags, format, timing),
   **When** user request viral score,
   **Then** hệ thống return score 0-100 với breakdown.

2. **Given** historical performance data,
   **When** calculating viral score,
   **Then** hệ thống compare với top-performing content.

3. **Given** viral score breakdown,
   **When** user xem details,
   **Then** hiển thị scores cho từng factor (hook, caption, hashtags, timing, format).

4. **Given** low viral score,
   **When** user xem recommendations,
   **Then** hệ thống suggest improvements để tăng score.

5. **Given** multiple content drafts,
   **When** user compare scores,
   **Then** hệ thống rank drafts theo viral potential.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ViralScoreService (AC: #1, #2)
  - [ ] Implement `calculateViralScore(contentMetadata)` method
  - [ ] Define scoring factors and weights
  - [ ] Compare với historical viral content

- [ ] Implement Scoring Factors (AC: #3)
  - [ ] Hook score (first 3 seconds analysis)
  - [ ] Caption score (length, style, keywords)
  - [ ] Hashtag score (relevance, trending)
  - [ ] Timing score (posting time vs optimal)
  - [ ] Format score (Reels vs Post)

- [ ] Add Improvement Suggestions (AC: #4)
  - [ ] Generate suggestions based on low-scoring factors
  - [ ] Prioritize by impact

- [ ] Add Viral Score API endpoints (AC: #1, #5)
  - [ ] POST /api/viral/score - Calculate viral score
  - [ ] POST /api/viral/compare - Compare multiple drafts
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create ViralScoreCard component (AC: #1, #3)
  - [ ] Overall score display (0-100)
  - [ ] Score breakdown by factor
  - [ ] Visual indicators (color-coded)

- [ ] Create ImprovementSuggestions component (AC: #4)
  - [ ] List of actionable suggestions
  - [ ] Impact indicators

- [ ] Create ContentComparison component (AC: #5)
  - [ ] Side-by-side comparison
  - [ ] Ranking display

- [ ] Add Viral Score page/modal
  - [ ] Input form for content metadata
  - [ ] Real-time score calculation

### Testing

- [ ] Backend tests
  - [ ] Unit test: Score calculation
  - [ ] Unit test: Factor scoring
  - [ ] Unit test: Suggestion generation

- [ ] Frontend tests
  - [ ] Component test: ViralScoreCard
  - [ ] Component test: ImprovementSuggestions

## Dev Notes

**Prerequisites:**
- Epic 2-4 complete (historical data available)

**Technical Approach:**
- MVP: Rule-based scoring (không ML)
- Factors và weights có thể tune dựa trên data

**Scoring Factors (MVP):**

| Factor | Weight | Description |
|--------|--------|-------------|
| Hook | 25% | First 3 seconds effectiveness |
| Caption | 20% | Length, keywords, CTAs |
| Hashtags | 15% | Relevance, trending status |
| Timing | 20% | Posting time vs optimal |
| Format | 20% | Reels vs Post performance |

**Score Interpretation:**
- 80-100: High viral potential
- 60-79: Good potential
- 40-59: Average
- 0-39: Low potential, needs improvement

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/viral/viral-score.service.ts`
- `apps/backend/src/api/routes/viral.controller.ts`
- `apps/frontend/src/components/viral/viral-score-card.tsx`
- `apps/frontend/src/components/viral/improvement-suggestions.tsx`

### References

- [Source: docs/epics.md#Epic-14]
- [Source: docs/research/feature-improvement-proposals.md#Epic-14]

## Dev Agent Record

### Context Reference

- `docs/stories/14-1-viral-score-prediction.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 14.1 drafted by Mary (Business Analyst)
