# Story 16.4: Advertiser-Friendly Scoring

Status: ready-for-dev

## Story

As a **Leader**,
I want **biết content có advertiser-friendly không**,
So that **tôi maximize ad revenue**.

## Acceptance Criteria

1. **Given** content,
   **When** user request ad-friendly score,
   **Then** hệ thống score và flag sensitive topics.

2. **Given** ad-friendly analysis,
   **When** user xem details,
   **Then** hiển thị breakdown by category (violence, adult, controversial, etc.).

3. **Given** flagged content,
   **When** user xem recommendations,
   **Then** suggest adjustments to improve ad-friendliness.

4. **Given** content library,
   **When** user xem ad-friendly report,
   **Then** show percentage of ad-friendly content.

5. **Given** ad-friendly trends,
   **When** user xem dashboard,
   **Then** show improvement over time.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AdvertiserFriendlyService (AC: #1, #2)
  - [ ] Implement `scoreAdFriendliness(contentId)` method
  - [ ] Build sensitive topics database
  - [ ] Return score with category breakdown

- [ ] Add Adjustment Suggestions (AC: #3)
  - [ ] Map sensitive topics to safe alternatives
  - [ ] Generate contextual suggestions

- [ ] Add Ad-Friendly Report (AC: #4)
  - [ ] Calculate percentage of ad-friendly content
  - [ ] Identify problematic content

- [ ] Add Ad-Friendly Trends (AC: #5)
  - [ ] Track scores over time
  - [ ] Calculate improvement metrics

- [ ] Add Advertiser-Friendly API endpoints
  - [ ] GET /api/quality/ad-friendly/:contentId - Score single content
  - [ ] GET /api/quality/ad-friendly/report - Get ad-friendly report
  - [ ] GET /api/quality/ad-friendly/trends - Get trends
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create AdFriendlyScoreCard component (AC: #1, #2)
  - [ ] Overall ad-friendly score
  - [ ] Category breakdown
  - [ ] Flag indicators

- [ ] Create SensitiveTopicsList component (AC: #2)
  - [ ] List of detected topics
  - [ ] Severity indicators
  - [ ] Explanation tooltips

- [ ] Create AdFriendlyReport component (AC: #4)
  - [ ] Percentage display
  - [ ] Content breakdown
  - [ ] Action items

- [ ] Create AdFriendlyTrends component (AC: #5)
  - [ ] Trend chart
  - [ ] Improvement indicators

### Testing

- [ ] Backend tests
  - [ ] Unit test: Ad-friendly scoring
  - [ ] Unit test: Sensitive topic detection
  - [ ] Unit test: Report generation

- [ ] Frontend tests
  - [ ] Component test: AdFriendlyScoreCard
  - [ ] Component test: AdFriendlyReport

## Dev Notes

**Prerequisites:**
- Story 16.1 complete (Quality Score Dashboard)

**Sensitive Topic Categories:**

| Category | Examples | Impact on Ads |
|----------|----------|---------------|
| Violence | Fighting, weapons, gore | Limited/No ads |
| Adult Content | Sexual content, nudity | No ads |
| Controversial | Politics, religion debates | Limited ads |
| Drugs/Alcohol | Drug use, excessive alcohol | Limited ads |
| Profanity | Strong language, slurs | Limited ads |
| Tragedy | Death, disasters | Limited ads |
| Misinformation | False claims, conspiracy | No ads |

**Ad-Friendly Score Interpretation:**
- 90-100: Fully ad-friendly, all advertisers
- 70-89: Mostly ad-friendly, some restrictions
- 50-69: Limited ad-friendly, many restrictions
- 0-49: Not ad-friendly, minimal/no ads

**[ASSUMPTION]:** MVP uses keyword-based detection. Phase 2 will add NLP/ML for context-aware detection.

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/quality/advertiser-friendly.service.ts`
- `apps/frontend/src/components/quality/ad-friendly-score-card.tsx`
- `apps/frontend/src/components/quality/sensitive-topics-list.tsx`
- `apps/frontend/src/components/quality/ad-friendly-report.tsx`

### References

- [Source: docs/epics.md#Story-16.4]
- [Source: docs/stories/16-1-quality-score-dashboard.md]
- [Source: Facebook Advertising Policies]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 16.4 drafted by Mary (Business Analyst)
