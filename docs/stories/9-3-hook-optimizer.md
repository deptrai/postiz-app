# Story 9.3: Hook Optimizer

Status: ready-for-dev

## Story

As a **Leader**,
I want **AI gợi ý hooks hiệu quả**,
So that **content của tôi thu hút hơn**.

## Acceptance Criteria

1. **Given** top-performing hooks database,
   **When** user request hook suggestions,
   **Then** AI generate hook variants based on niche/format.

2. **Given** hook suggestions,
   **When** user xem options,
   **Then** hiển thị với effectiveness prediction.

3. **Given** content context,
   **When** generating hooks,
   **Then** hooks relevant to content topic.

4. **Given** hook history,
   **When** user xem analytics,
   **Then** show which hooks performed best.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend AIAssistantService (AC: #1, #3)
  - [ ] Implement `generateHooks(context, options)` method
  - [ ] Include niche/format context
  - [ ] Generate multiple variants

- [ ] Add Hook Performance Tracking (AC: #4)
  - [ ] Track hook usage
  - [ ] Link to content performance

### Frontend Implementation

- [ ] Create HookOptimizer component (AC: #1, #2)
  - [ ] Context input
  - [ ] Hook variants display
  - [ ] Effectiveness indicators

- [ ] Create HookAnalytics component (AC: #4)
  - [ ] Performance history
  - [ ] Best hooks list

### Testing

- [ ] Unit test: Hook generation
- [ ] Unit test: Performance tracking

## Dev Notes

**Hook Types:**
- Question, Statement, Action, Curiosity, Problem

**Prerequisites:** Story 9.1 complete

### References

- [Source: docs/epics.md#Story-9.3]

## Change Log

- 2025-12-14: Story 9.3 drafted
