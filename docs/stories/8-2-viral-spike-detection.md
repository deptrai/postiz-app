# Story 8.2: Viral Spike Detection

Status: done

## Story

As a **Leader**,
I want **phát hiện content đang viral**,
So that **tôi có thể tận dụng momentum**.

## Acceptance Criteria

1. **Given** metrics real-time hoặc daily,
   **When** engagement spike >200% trong 24h,
   **Then** hệ thống highlight viral content.

2. **Given** viral content detected,
   **When** user xem alert,
   **Then** hiển thị spike metrics và comparison.

3. **Given** viral content,
   **When** user xem recommendations,
   **Then** gợi ý follow-up content ideas.

4. **Given** viral history,
   **When** user xem dashboard,
   **Then** hiển thị past viral content với patterns.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend AlertService for spike detection (AC: #1, #2)
  - [ ] Implement `detectViralSpikes(organizationId)` method
  - [ ] Define spike thresholds
  - [ ] Track spike duration

- [ ] Add Follow-up Recommendations (AC: #3)
  - [ ] Analyze viral content patterns
  - [ ] Generate content suggestions

- [ ] Add Viral History (AC: #4)
  - [ ] Store viral events
  - [ ] Track patterns over time

### Frontend Implementation

- [ ] Create ViralSpikeCard component (AC: #1, #2)
  - [ ] Spike indicator with animation
  - [ ] Metrics comparison

- [ ] Create ViralRecommendations component (AC: #3)
  - [ ] Follow-up content ideas
  - [ ] Quick action buttons

- [ ] Create ViralHistory component (AC: #4)
  - [ ] Timeline of viral content
  - [ ] Pattern insights

### Testing

- [ ] Unit test: Spike detection logic
- [ ] Unit test: Recommendation generation

## Dev Notes

**Spike Thresholds:**
- Engagement: >200% increase in 24h
- Reach: >300% increase in 24h
- Views: >250% increase in 24h

**Prerequisites:** Story 8.1 complete

### References

- [Source: docs/epics.md#Story-8.2]

## Change Log

- 2025-12-14: Story 8.2 drafted
