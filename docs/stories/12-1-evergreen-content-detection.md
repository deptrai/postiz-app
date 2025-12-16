# Story 12.1: Evergreen Content Detection

Status: ready-for-dev

## Story

As a **Leader**,
I want **phát hiện evergreen content**,
So that **tôi có thể repost hiệu quả**.

## Acceptance Criteria

1. **Given** historical content performance,
   **When** hệ thống analyze patterns,
   **Then** identify content với consistent performance over time.

2. **Given** evergreen content identified,
   **When** user xem list,
   **Then** show performance metrics và evergreen score.

3. **Given** evergreen criteria,
   **When** analyzing content,
   **Then** consider engagement consistency, not just peaks.

4. **Given** evergreen content,
   **When** user xem details,
   **Then** show why content is considered evergreen.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create EvergreenService (AC: #1, #2)
  - [ ] Implement `detectEvergreenContent(organizationId)` method
  - [ ] Calculate evergreen score
  - [ ] Identify consistent performers

- [ ] Add Evergreen Criteria (AC: #3)
  - [ ] Define consistency metrics
  - [ ] Weight factors appropriately

- [ ] Add Evergreen Explanation (AC: #4)
  - [ ] Generate explanation for each content
  - [ ] Include supporting data

### Frontend Implementation

- [ ] Create EvergreenList component (AC: #2)
  - [ ] Content cards with scores
  - [ ] Performance indicators

- [ ] Create EvergreenDetail component (AC: #4)
  - [ ] Explanation display
  - [ ] Historical performance chart

### Testing

- [ ] Unit test: Evergreen detection
- [ ] Unit test: Score calculation

## Dev Notes

**Evergreen Criteria:**
- Consistent engagement over 30+ days
- Low variance in performance
- Not time-sensitive content

**Prerequisites:** Epic 2-4 complete

### References

- [Source: docs/epics.md#Story-12.1]

## Change Log

- 2025-12-14: Story 12.1 drafted
