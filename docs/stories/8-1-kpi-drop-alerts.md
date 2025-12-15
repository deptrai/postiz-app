# Story 8.1: KPI Drop Alerts

Status: done

## Story

As a **Leader**,
I want **nhận cảnh báo khi KPI tụt đột ngột**,
So that **tôi có thể phản ứng nhanh và điều chỉnh chiến lược**.

## Acceptance Criteria

1. **Given** metrics daily đã có,
   **When** engagement rate giảm >20% so với 7 ngày trước,
   **Then** hệ thống gửi alert với chi tiết và gợi ý.

2. **Given** metrics daily đã có,
   **When** reach giảm >30% so với tuần trước,
   **Then** hệ thống gửi alert với severity level.

3. **Given** alert thresholds,
   **When** user configure settings,
   **Then** thresholds có thể customize theo group/niche.

4. **Given** alert triggered,
   **When** user xem alert details,
   **Then** hiển thị comparison data và suggested actions.

5. **Given** multiple alerts,
   **When** user xem alert history,
   **Then** hiển thị list sorted by severity và time.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AlertService (AC: #1, #2)
  - [ ] Implement `checkKPIDrops(organizationId)` method
  - [ ] Define drop thresholds per metric
  - [ ] Calculate percentage changes

- [ ] Create Alert Detection Job (AC: #1, #2)
  - [ ] Background job runs daily
  - [ ] Compare current vs previous period
  - [ ] Generate alerts when thresholds exceeded

- [ ] Add Alert Configuration (AC: #3)
  - [ ] Store user threshold preferences
  - [ ] Support per-group/niche settings

- [ ] Add Alert API endpoints (AC: #4, #5)
  - [ ] GET /api/alerts - Get alerts list
  - [ ] GET /api/alerts/:id - Get alert details
  - [ ] PUT /api/alerts/config - Update thresholds
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create AlertCard component (AC: #4)
  - [ ] Severity indicator (critical/warning/info)
  - [ ] Metric comparison display
  - [ ] Suggested actions

- [ ] Create AlertHistory component (AC: #5)
  - [ ] Sortable/filterable list
  - [ ] Mark as read functionality

- [ ] Create AlertConfig component (AC: #3)
  - [ ] Threshold sliders
  - [ ] Per-group settings

### Testing

- [ ] Backend tests
  - [ ] Unit test: Drop detection logic
  - [ ] Unit test: Threshold comparison
  - [ ] Integration test: Alert job

## Dev Notes

**Default Thresholds:**
- Engagement Rate Drop: >20%
- Reach Drop: >30%
- Views Drop: >25%

**Alert Severity:**
- Critical: >50% drop
- Warning: 30-50% drop
- Info: 20-30% drop

### References

- [Source: docs/epics.md#Story-8.1]

## Change Log

- 2025-12-14: Story 8.1 drafted
