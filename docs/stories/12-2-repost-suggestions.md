# Story 12.2: Repost Suggestions

Status: ready-for-dev

## Story

As a **Leader**,
I want **gợi ý repost timing**,
So that **tôi maximize reach của evergreen content**.

## Acceptance Criteria

1. **Given** evergreen content identified,
   **When** user xem suggestions,
   **Then** hệ thống recommend optimal repost timing.

2. **Given** repost suggestion,
   **When** user xem details,
   **Then** show expected performance và reasoning.

3. **Given** repost history,
   **When** suggesting timing,
   **Then** avoid too-frequent reposts of same content.

4. **Given** repost suggestions,
   **When** user accept,
   **Then** có thể schedule repost directly.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend EvergreenService (AC: #1, #2)
  - [ ] Implement `getRepostSuggestions(organizationId)` method
  - [ ] Calculate optimal timing
  - [ ] Estimate expected performance

- [ ] Add Repost History Tracking (AC: #3)
  - [ ] Track repost dates
  - [ ] Enforce minimum interval

- [ ] Add Scheduling Integration (AC: #4)
  - [ ] Connect to scheduling system
  - [ ] Create scheduled post from suggestion

### Frontend Implementation

- [ ] Create RepostSuggestions component (AC: #1, #2)
  - [ ] Suggestion cards
  - [ ] Timing recommendations

- [ ] Create RepostScheduler component (AC: #4)
  - [ ] Quick schedule button
  - [ ] Date/time picker

### Testing

- [ ] Unit test: Timing calculation
- [ ] Unit test: Interval enforcement

## Dev Notes

**Repost Timing Factors:**
- Time since last post
- Audience growth since original
- Seasonal relevance

**Minimum Repost Interval:** 30 days (configurable)

**Prerequisites:** Story 12.1 complete

### References

- [Source: docs/epics.md#Story-12.2]

## Change Log

- 2025-12-14: Story 12.2 drafted
