# Story 14.2: Hook Analyzer

Status: ready-for-dev

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

- [ ] Create HookAnalyzerService (AC: #1, #2)
  - [ ] Implement `analyzeHook(videoMetadata)` method
  - [ ] Define hook effectiveness factors
  - [ ] Calculate effectiveness score

- [ ] Build Hook Patterns Database (AC: #3)
  - [ ] Extract patterns from viral content
  - [ ] Categorize by opening type
  - [ ] Store pattern metadata

- [ ] Add Hook Recommendations (AC: #4)
  - [ ] Generate recommendations based on niche
  - [ ] Suggest proven hook patterns

- [ ] Add Hook Analyzer API endpoints (AC: #1, #5)
  - [ ] POST /api/viral/hook/analyze - Analyze hook
  - [ ] GET /api/viral/hook/patterns - Get successful patterns
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create HookAnalysisCard component (AC: #1, #2)
  - [ ] Effectiveness score display
  - [ ] Factor breakdown
  - [ ] Visual indicators

- [ ] Create HookPatterns component (AC: #3, #4)
  - [ ] List of successful patterns
  - [ ] Examples from viral content
  - [ ] Apply to draft button

- [ ] Create HookComparison component (AC: #5)
  - [ ] Side-by-side comparison
  - [ ] Ranking display

### Testing

- [ ] Backend tests
  - [ ] Unit test: Hook analysis
  - [ ] Unit test: Pattern matching
  - [ ] Unit test: Recommendation generation

- [ ] Frontend tests
  - [ ] Component test: HookAnalysisCard
  - [ ] Component test: HookPatterns

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
