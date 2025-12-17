# Story 14.1: Viral Score Prediction

Status: done

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

- [x] Create ViralScoreService (AC: #1, #2)
  - [x] Implement `calculateViralScore(contentMetadata)` method
  - [x] Define scoring factors and weights
  - [x] Compare với historical viral content

- [x] Implement Scoring Factors (AC: #3)
  - [x] Hook score (first 3 seconds analysis)
  - [x] Caption score (length, style, keywords)
  - [x] Hashtag score (relevance, trending)
  - [x] Timing score (posting time vs optimal)
  - [x] Format score (Reels vs Post)

- [x] Add Improvement Suggestions (AC: #4)
  - [x] Generate suggestions based on low-scoring factors
  - [x] Prioritize by impact

- [x] Add Viral Score API endpoints (AC: #1, #5)
  - [x] POST /api/viral/score - Calculate viral score
  - [x] POST /api/viral/compare - Compare multiple drafts
  - [x] Add Swagger documentation

### Frontend Implementation

- [x] Create ViralScoreCard component (AC: #1, #3)
  - [x] Overall score display (0-100)
  - [x] Score breakdown by factor
  - [x] Visual indicators (color-coded)

- [x] Create ImprovementSuggestions component (AC: #4)
  - [x] List of actionable suggestions
  - [x] Impact indicators

- [x] Create ContentComparison component (AC: #5)
  - [x] Side-by-side comparison
  - [x] Ranking display

- [x] Add Viral Score page/modal
  - [x] Input form for content metadata
  - [x] Real-time score calculation

### Testing

- [x] Backend tests
  - [x] Unit test: Score calculation
  - [x] Unit test: Factor scoring
  - [x] Unit test: Suggestion generation

- [x] Frontend tests
  - [x] Component test: ViralScoreCard
  - [x] Component test: ImprovementSuggestions

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

**Backend:**
- `libraries/nestjs-libraries/src/database/prisma/viral/viral-score.service.ts` - Core scoring service
- `apps/backend/src/api/routes/viral.controller.ts` - API endpoints
- `libraries/nestjs-libraries/src/database/prisma/database.module.ts` - Module registration

**Frontend:**
- `apps/frontend/src/components/viral/viral-score-card.tsx` - Score display component
- `apps/frontend/src/components/viral/improvement-suggestions.tsx` - Suggestions component
- `apps/frontend/src/components/viral/content-comparison.tsx` - Comparison component

**Tests:**
- `libraries/nestjs-libraries/src/database/prisma/viral/viral-score.service.spec.ts` - Backend unit tests
- `libraries/nestjs-libraries/src/database/prisma/viral/run-tests.ts` - Test runner
- `apps/frontend/src/components/viral/viral-score-card.test.tsx` - Frontend tests
- `apps/frontend/src/components/viral/improvement-suggestions.test.tsx` - Frontend tests
- `apps/frontend/src/components/viral/content-comparison.test.tsx` - Frontend tests

## Change Log

- 2025-12-14: Story 14.1 drafted by Mary (Business Analyst)
- 2025-12-17: Backend ViralScoreService implemented with all scoring factors
- 2025-12-17: API endpoints POST /viral/score and POST /viral/compare added
- 2025-12-17: Frontend components (ViralScoreCard, ImprovementSuggestions, ContentComparison) created
- 2025-12-17: Backend tests (7/7 passed) and frontend tests created
