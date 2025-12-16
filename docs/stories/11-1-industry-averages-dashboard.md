# Story 11.1: Industry Averages Dashboard

Status: ready-for-dev

## Story

As a **Leader**,
I want **so sánh metrics với industry averages**,
So that **tôi biết mình đang ở đâu**.

## Acceptance Criteria

1. **Given** industry benchmark data,
   **When** user xem dashboard,
   **Then** hiển thị comparison với averages theo niche.

2. **Given** own metrics,
   **When** compared to benchmarks,
   **Then** hiển thị above/below average indicators.

3. **Given** benchmark data,
   **When** user select niche,
   **Then** show relevant benchmarks for that niche.

4. **Given** manual input option,
   **When** user enter competitor data,
   **Then** store and use for comparison.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create BenchmarkService (AC: #1, #2)
  - [ ] Implement `getBenchmarks(niche)` method
  - [ ] Calculate comparison metrics
  - [ ] Return above/below indicators

- [ ] Add Industry Data (AC: #1, #3)
  - [ ] Seed industry averages by niche
  - [ ] Support multiple niches

- [ ] Add Manual Input (AC: #4)
  - [ ] Store user-entered competitor data
  - [ ] Include in comparisons

### Frontend Implementation

- [ ] Create BenchmarkDashboard component (AC: #1, #2)
  - [ ] Comparison charts
  - [ ] Above/below indicators

- [ ] Create NicheSelector component (AC: #3)
  - [ ] Niche dropdown
  - [ ] Auto-update benchmarks

- [ ] Create ManualInput component (AC: #4)
  - [ ] Competitor data form
  - [ ] Save functionality

### Testing

- [ ] Unit test: Comparison calculation
- [ ] Unit test: Benchmark retrieval

## Dev Notes

**Industry Averages (Examples):**
- Engagement Rate: 3-6% (varies by niche)
- Reach Rate: 10-20%
- Video Completion: 40-60%

**Niches:**
- Lifestyle, Business, Entertainment, Education, etc.

**[ASSUMPTION]:** Industry averages are seeded data, not scraped from competitors.

### References

- [Source: docs/epics.md#Story-11.1]

## Change Log

- 2025-12-14: Story 11.1 drafted
