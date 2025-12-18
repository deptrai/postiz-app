# Story 15.4: Thumbnail Effectiveness

Status: ready-for-dev

## Story

As a **Leader**,
I want **đánh giá thumbnail effectiveness của video**,
So that **tôi tăng click-through rate và thu hút viewers**.

## Acceptance Criteria

1. **Given** video với thumbnail data,
   **When** user xem thumbnail analysis,
   **Then** hiển thị CTR (click-through rate) analysis per thumbnail style.

2. **Given** thumbnail performance data,
   **When** user xem analysis,
   **Then** hệ thống categorize thumbnails theo style (text-heavy, face, action, minimal, etc.).

3. **Given** categorized thumbnails,
   **When** user xem performance comparison,
   **Then** hiển thị which thumbnail styles perform best cho user's content.

4. **Given** thumbnail analysis,
   **When** user xem suggestions,
   **Then** hệ thống gợi ý A/B test ideas và best practices.

5. **Given** top-performing thumbnails,
   **When** user xem details,
   **Then** hiển thị common elements và patterns của successful thumbnails.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ThumbnailAnalyticsService (AC: #1, #2)
  - [ ] Implement `getThumbnailPerformance(organizationId, filters)` method
  - [ ] Calculate CTR per video (clicks / impressions)
  - [ ] Categorize thumbnails by style
  - [ ] [ASSUMPTION: Thumbnail style categorization based on metadata or manual tagging]

- [ ] Add Style Performance Analysis (AC: #3)
  - [ ] Implement `getStylePerformance(organizationId)` method
  - [ ] Aggregate CTR by thumbnail style
  - [ ] Rank styles by performance
  - [ ] Calculate confidence based on sample size

- [ ] Add A/B Test Suggestions (AC: #4)
  - [ ] Implement `getThumbnailSuggestions(analysisData)` method
  - [ ] Generate A/B test ideas based on performance gaps
  - [ ] Include best practices recommendations
  - [ ] [ASSUMPTION: Best practices based on industry research]

- [ ] Add Success Pattern Detection (AC: #5)
  - [ ] Implement `getSuccessPatterns(organizationId)` method
  - [ ] Analyze top-performing thumbnails
  - [ ] Extract common elements (colors, text, faces, etc.)
  - [ ] Generate pattern insights

- [ ] Add Thumbnail API endpoints
  - [ ] GET /api/video-analytics/thumbnail - Get thumbnail performance
  - [ ] GET /api/video-analytics/thumbnail/styles - Get style performance
  - [ ] GET /api/video-analytics/thumbnail/suggestions - Get A/B test suggestions
  - [ ] GET /api/video-analytics/thumbnail/patterns - Get success patterns
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create ThumbnailPerformanceTable component (AC: #1)
  - [ ] Table showing videos with CTR
  - [ ] Sortable by CTR, views, clicks
  - [ ] Thumbnail preview column

- [ ] Create StylePerformanceChart component (AC: #2, #3)
  - [ ] Bar chart comparing styles
  - [ ] CTR per style
  - [ ] Sample size indicator

- [ ] Create ThumbnailSuggestions component (AC: #4)
  - [ ] A/B test ideas list
  - [ ] Best practices cards
  - [ ] Priority ordering

- [ ] Create SuccessPatternsCard component (AC: #5)
  - [ ] Common elements visualization
  - [ ] Top thumbnail examples
  - [ ] Pattern insights

- [ ] Integrate into Video Analytics page
  - [ ] Thumbnail tab/section
  - [ ] Style filter
  - [ ] Date range selector

### Testing

- [ ] Backend tests
  - [ ] Unit test: CTR calculation
  - [ ] Unit test: Style categorization
  - [ ] Unit test: Pattern detection
  - [ ] Unit test: Suggestion generation

- [ ] Frontend tests
  - [ ] Component test: ThumbnailPerformanceTable
  - [ ] Component test: StylePerformanceChart
  - [ ] Component test: SuccessPatternsCard

## Dev Notes

**Prerequisites:**
- Story 13.4 complete (Watch Time Analytics)
- Video metrics available from Epic 2
- Impressions and clicks data available

**Thumbnail Styles (ASSUMPTION):**
- **Text-Heavy:** Large text overlay, title-focused
- **Face:** Human face prominent, emotional expression
- **Action:** Dynamic scene, movement captured
- **Minimal:** Clean, simple design
- **Before/After:** Split comparison
- **Curiosity Gap:** Blurred/hidden elements

**CTR Calculation:**
- CTR = (Clicks / Impressions) * 100
- Good CTR: >5% for organic content
- Excellent CTR: >10%

**Success Pattern Elements:**
- Color palette (bright vs muted)
- Text presence and size
- Face presence and expression
- Composition (centered vs rule of thirds)
- Contrast level

**Industry Benchmarks (ASSUMPTION):**
| Style | Average CTR | Best For |
|-------|-------------|----------|
| Face + Emotion | 8-12% | Personal content |
| Text + Curiosity | 6-10% | Educational |
| Action Shot | 5-8% | Entertainment |
| Minimal | 4-6% | Professional |

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/video-analytics/thumbnail-analytics.service.ts`
- `apps/frontend/src/components/video-analytics/thumbnail-performance-table.tsx`
- `apps/frontend/src/components/video-analytics/style-performance-chart.tsx`
- `apps/frontend/src/components/video-analytics/thumbnail-suggestions.tsx`
- `apps/frontend/src/components/video-analytics/success-patterns-card.tsx`

### References

- [Source: docs/research/feature-improvement-proposals.md#Epic-15]
- [Source: docs/stories/13-4-watch-time-analytics.md]
- [Source: docs/stories/15-2-retention-curve-analysis.md]
- [Source: docs/stories/15-3-video-length-optimization.md]
- [Dependency: Epic 2 - Ingestion & Storage]

## Dev Agent Record

### Context Reference

- docs/stories/15-4-thumbnail-effectiveness.context.xml

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-17: Story 15.4 drafted by Bob (Scrum Master)
