# Story 16.2: Engagement Bait Detection

Status: ready-for-dev

## Story

As a **Leader**,
I want **phát hiện engagement bait**,
So that **tôi tránh bị Facebook phạt**.

## Acceptance Criteria

1. **Given** content caption,
   **When** hệ thống analyze,
   **Then** flag clickbait patterns ("LIKE this!", "SHARE now!").

2. **Given** detected bait patterns,
   **When** user xem details,
   **Then** highlight specific phrases và explain why problematic.

3. **Given** bait detection results,
   **When** user xem suggestions,
   **Then** suggest authentic alternatives.

4. **Given** content draft,
   **When** user request pre-publish check,
   **Then** scan for bait patterns before posting.

5. **Given** historical content,
   **When** user xem bait report,
   **Then** show bait score trends và flagged content.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create EngagementBaitService (AC: #1, #2)
  - [ ] Implement `detectEngagementBait(caption)` method
  - [ ] Build bait patterns database
  - [ ] Return detected patterns with explanations

- [ ] Add Authentic Alternatives (AC: #3)
  - [ ] Map bait patterns to authentic alternatives
  - [ ] Generate contextual suggestions

- [ ] Add Pre-Publish Check (AC: #4)
  - [ ] Implement `checkBeforePublish(contentDraft)` method
  - [ ] Return warnings and suggestions

- [ ] Add Bait Report (AC: #5)
  - [ ] Implement `getBaitReport(organizationId)` method
  - [ ] Track bait scores over time

- [ ] Add Engagement Bait API endpoints
  - [ ] POST /api/quality/bait/detect - Detect bait in caption
  - [ ] POST /api/quality/bait/check - Pre-publish check
  - [ ] GET /api/quality/bait/report - Get bait report
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create BaitDetectionCard component (AC: #1, #2)
  - [ ] Bait score display
  - [ ] Highlighted problematic phrases
  - [ ] Explanation tooltips

- [ ] Create AuthenticAlternatives component (AC: #3)
  - [ ] List of suggestions
  - [ ] Copy to clipboard button
  - [ ] Apply suggestion button

- [ ] Create PrePublishChecker component (AC: #4)
  - [ ] Real-time bait detection
  - [ ] Warning indicators
  - [ ] Inline suggestions

- [ ] Create BaitReport component (AC: #5)
  - [ ] Trend chart
  - [ ] Flagged content list

### Testing

- [ ] Backend tests
  - [ ] Unit test: Bait pattern detection
  - [ ] Unit test: Alternative generation
  - [ ] Unit test: Pre-publish check

- [ ] Frontend tests
  - [ ] Component test: BaitDetectionCard
  - [ ] Component test: PrePublishChecker

## Dev Notes

**Prerequisites:**
- Story 16.1 complete (Quality Score Dashboard)

**Bait Patterns Database (MVP - Rule-based):**

| Pattern Type | Examples | Severity |
|--------------|----------|----------|
| Like Bait | "LIKE this!", "Hit that like button!" | High |
| Share Bait | "SHARE now!", "Share with friends!" | High |
| Comment Bait | "Comment YES if you agree!" | Medium |
| Tag Bait | "Tag 3 friends!" | Medium |
| Vote Bait | "Like for A, Comment for B" | High |
| Reaction Bait | "React with ❤️ if..." | Medium |

**Authentic Alternatives:**

| Bait Pattern | Authentic Alternative |
|--------------|----------------------|
| "LIKE this post!" | "What do you think about this?" |
| "SHARE with friends!" | "Know someone who'd find this helpful?" |
| "Comment YES!" | "Share your experience in the comments" |
| "Tag 3 friends!" | "Who comes to mind when you see this?" |

**[ASSUMPTION]:** MVP uses rule-based keyword detection. Phase 2 will add NLP for more sophisticated detection.

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/quality/engagement-bait.service.ts`
- `apps/frontend/src/components/quality/bait-detection-card.tsx`
- `apps/frontend/src/components/quality/authentic-alternatives.tsx`
- `apps/frontend/src/components/quality/pre-publish-checker.tsx`

### References

- [Source: docs/epics.md#Story-16.2]
- [Source: docs/stories/16-1-quality-score-dashboard.md]
- [Source: Facebook Partner Monetization Policies]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 16.2 drafted by Mary (Business Analyst)
