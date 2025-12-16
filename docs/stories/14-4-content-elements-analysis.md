# Story 14.4: Content Elements Analysis

Status: ready-for-dev

## Story

As a **Leader**,
I want **phân tích elements của viral content**,
So that **tôi có thể replicate success**.

## Acceptance Criteria

1. **Given** top-performing content,
   **When** user request elements analysis,
   **Then** hệ thống breakdown: caption style, hashtags, format, CTA.

2. **Given** caption analysis,
   **When** user xem details,
   **Then** hiển thị: length, tone, keywords, emoji usage.

3. **Given** hashtag analysis,
   **When** user xem details,
   **Then** hiển thị: count, trending status, relevance score.

4. **Given** format analysis,
   **When** user xem details,
   **Then** hiển thị: Reels vs Post performance, video length impact.

5. **Given** CTA analysis,
   **When** user xem details,
   **Then** hiển thị: CTA types used, effectiveness by type.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ContentElementsService (AC: #1)
  - [ ] Implement `analyzeContentElements(contentId)` method
  - [ ] Aggregate analysis from sub-analyzers

- [ ] Implement Caption Analyzer (AC: #2)
  - [ ] Analyze caption length
  - [ ] Detect tone (casual, professional, etc.)
  - [ ] Extract keywords
  - [ ] Count emoji usage

- [ ] Implement Hashtag Analyzer (AC: #3)
  - [ ] Count hashtags
  - [ ] Check trending status
  - [ ] Calculate relevance score

- [ ] Implement Format Analyzer (AC: #4)
  - [ ] Categorize by format
  - [ ] Analyze video length impact
  - [ ] Compare performance by format

- [ ] Implement CTA Analyzer (AC: #5)
  - [ ] Detect CTA types
  - [ ] Calculate effectiveness per type

- [ ] Add Content Elements API endpoints
  - [ ] GET /api/viral/elements/:contentId - Analyze single content
  - [ ] GET /api/viral/elements/patterns - Get successful patterns
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create ContentElementsCard component (AC: #1)
  - [ ] Overview of all elements
  - [ ] Expandable sections

- [ ] Create CaptionAnalysis component (AC: #2)
  - [ ] Length indicator
  - [ ] Tone badge
  - [ ] Keyword highlights

- [ ] Create HashtagAnalysis component (AC: #3)
  - [ ] Hashtag list with scores
  - [ ] Trending indicators

- [ ] Create FormatAnalysis component (AC: #4)
  - [ ] Format comparison chart
  - [ ] Video length insights

- [ ] Create CTAAnalysis component (AC: #5)
  - [ ] CTA type breakdown
  - [ ] Effectiveness chart

### Testing

- [ ] Backend tests
  - [ ] Unit test: Caption analysis
  - [ ] Unit test: Hashtag analysis
  - [ ] Unit test: Format analysis
  - [ ] Unit test: CTA detection

- [ ] Frontend tests
  - [ ] Component test: ContentElementsCard
  - [ ] Component test: Sub-components

## Dev Notes

**Prerequisites:**
- Story 14.1 complete (Viral Score Service)
- Content metadata available

**Caption Analysis Factors:**
- **Length:** Short (<50 chars), Medium (50-150), Long (>150)
- **Tone:** Casual, Professional, Humorous, Educational
- **Keywords:** Top keywords from viral content
- **Emoji:** Count and placement

**Hashtag Analysis:**
- **Count:** Optimal range (5-15 for Facebook)
- **Trending:** Check against trending hashtags
- **Relevance:** Match with content topic

**CTA Types:**
1. **Engagement CTA:** "Comment below", "Share your thoughts"
2. **Action CTA:** "Click link", "Follow for more"
3. **Save CTA:** "Save for later"
4. **Share CTA:** "Tag a friend"

**Format Insights:**
- Reels: Higher reach, shorter attention span
- Posts: Better for detailed content, longer engagement

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/viral/content-elements.service.ts`
- `apps/frontend/src/components/viral/content-elements-card.tsx`
- `apps/frontend/src/components/viral/caption-analysis.tsx`
- `apps/frontend/src/components/viral/hashtag-analysis.tsx`

### References

- [Source: docs/epics.md#Story-14.4]
- [Source: docs/stories/14-1-viral-score-prediction.md]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 14.4 drafted by Mary (Business Analyst)
