# Story 11.2: Performance Gap Analysis

Status: ready-for-dev

## Story

As a **Leader**,
I want **phân tích gap với benchmarks**,
So that **tôi biết cần cải thiện gì**.

## Acceptance Criteria

1. **Given** own metrics và benchmarks,
   **When** user request gap analysis,
   **Then** hệ thống highlight gaps và gợi ý improvements.

2. **Given** gap analysis,
   **When** user xem details,
   **Then** show specific metrics và how far from benchmark.

3. **Given** improvement suggestions,
   **When** user xem recommendations,
   **Then** show actionable steps to close gaps.

4. **Given** gap trends,
   **When** user xem history,
   **Then** show if gaps are closing or widening.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend BenchmarkService (AC: #1, #2)
  - [ ] Implement `getGapAnalysis(organizationId)` method
  - [ ] Calculate gaps per metric
  - [ ] Prioritize by impact

- [ ] Add Improvement Suggestions (AC: #3)
  - [ ] Map gaps to actionable recommendations
  - [ ] Prioritize by effort/impact

- [ ] Add Gap Trends (AC: #4)
  - [ ] Track gaps over time
  - [ ] Calculate trend direction

### Frontend Implementation

- [ ] Create GapAnalysis component (AC: #1, #2)
  - [ ] Gap visualization
  - [ ] Metric breakdown

- [ ] Create ImprovementPlan component (AC: #3)
  - [ ] Actionable recommendations
  - [ ] Priority indicators

- [ ] Create GapTrends component (AC: #4)
  - [ ] Trend chart
  - [ ] Direction indicators

### Testing

- [ ] Unit test: Gap calculation
- [ ] Unit test: Trend analysis

## Dev Notes

**Prerequisites:** Story 11.1 complete

### References

- [Source: docs/epics.md#Story-11.2]

## Change Log

- 2025-12-14: Story 11.2 drafted
