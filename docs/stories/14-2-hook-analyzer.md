# Story 14.2: Hook Analyzer

Status: done

## Story

As a **Leader**,
I want **phân tích hook effectiveness**,
So that **tôi tạo hooks thu hút hơn**.

## Acceptance Criteria

1. **Given** video content,
   **When** user request hook analysis,
   **Then** hệ thống analyze 3 giây đầu và return effectiveness score.

2. **Given** hook analysis,
   **When** user xem details,
   **Then** hiển thị breakdown: opening type, pacing, visual impact.

3. **Given** historical viral hooks,
   **When** analyzing new hook,
   **Then** compare với patterns của viral content.

4. **Given** hook analysis results,
   **When** user xem recommendations,
   **Then** gợi ý hook patterns hiệu quả theo niche/format.

5. **Given** multiple hooks,
   **When** user compare,
   **Then** rank hooks theo effectiveness score.

## Tasks / Subtasks

### Backend Implementation

- [x] Create HookAnalyzerService (AC: #1, #2)
  - [x] Implement `analyzeHook(videoMetadata)` method
  - [x] Define hook effectiveness factors
  - [x] Calculate effectiveness score

- [x] Build Hook Patterns Database (AC: #3)
  - [x] Extract patterns from viral content
  - [x] Categorize by opening type
  - [x] Store pattern metadata

- [x] Add Hook Recommendations (AC: #4)
  - [x] Generate recommendations based on niche
  - [x] Suggest proven hook patterns

- [x] Add Hook Analyzer API endpoints (AC: #1, #5)
  - [x] POST /api/viral/hook/analyze - Analyze hook
  - [x] GET /api/viral/hook/patterns - Get successful patterns
  - [x] Add Swagger documentation

### Frontend Implementation

- [x] Create HookAnalysisCard component (AC: #1, #2)
  - [x] Effectiveness score display
  - [x] Factor breakdown
  - [x] Visual indicators

- [x] Create HookPatterns component (AC: #3, #4)
  - [x] List of successful patterns
  - [x] Examples from viral content
  - [x] Apply to draft button

- [x] Create HookComparison component (AC: #5)
  - [x] Side-by-side comparison
  - [x] Ranking display

### Testing

- [x] Backend tests
  - [x] Unit test: Hook analysis
  - [x] Unit test: Pattern matching
  - [x] Unit test: Recommendation generation

- [x] Frontend tests
  - [x] Component test: HookAnalysisCard
  - [x] Component test: HookPatterns

## Dev Notes

**Prerequisites:**
- Story 14.1 complete (Viral Score Service)
- Historical video data available

**Hook Effectiveness Factors:**

| Factor | Weight | Description |
|--------|--------|-------------|
| Opening Type | 30% | Question, statement, action, etc. |
| Pacing | 25% | Fast cuts, slow reveal, etc. |
| Visual Impact | 25% | Attention-grabbing visuals |
| Audio Hook | 20% | Music, voice, sound effects |

**Hook Opening Types:**
1. **Question Hook:** "Did you know...?"
2. **Statement Hook:** "This changed everything..."
3. **Action Hook:** Jump straight into action
4. **Curiosity Hook:** "Wait for it..."
5. **Problem Hook:** "Struggling with...?"

**[ASSUMPTION]:** Hook analysis is based on metadata and caption analysis, not actual video frame analysis (which would require ML/CV).

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/viral/hook-analyzer.service.ts`
- `apps/frontend/src/components/viral/hook-analysis-card.tsx`
- `apps/frontend/src/components/viral/hook-patterns.tsx`

### References

- [Source: docs/epics.md#Story-14.2]
- [Source: docs/stories/14-1-viral-score-prediction.md]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 14.2 drafted by Mary (Business Analyst)
