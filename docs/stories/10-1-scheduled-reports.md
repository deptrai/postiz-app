# Story 10.1: Scheduled Reports

Status: ready-for-dev

## Story

As a **Leader**,
I want **báo cáo tự động theo lịch**,
So that **tôi và team luôn có data cập nhật**.

## Acceptance Criteria

1. **Given** report configuration,
   **When** schedule trigger (daily/weekly/monthly),
   **Then** hệ thống generate và gửi report.

2. **Given** report schedule,
   **When** user configure settings,
   **Then** có thể chọn frequency, time, recipients.

3. **Given** report content,
   **When** user configure settings,
   **Then** có thể chọn metrics và sections to include.

4. **Given** scheduled report,
   **When** report generated,
   **Then** gửi qua email với summary.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create ReportSchedulerService (AC: #1)
  - [ ] Implement `generateScheduledReport(config)` method
  - [ ] Support daily/weekly/monthly schedules
  - [ ] Cron job for scheduling

- [ ] Add Report Configuration (AC: #2, #3)
  - [ ] Store schedule settings
  - [ ] Store content preferences
  - [ ] Multiple recipients support

- [ ] Add Report Delivery (AC: #4)
  - [ ] Email template for reports
  - [ ] Attachment support

### Frontend Implementation

- [ ] Create ReportScheduler component (AC: #2, #3)
  - [ ] Frequency selector
  - [ ] Time picker
  - [ ] Content checkboxes
  - [ ] Recipients input

- [ ] Create ScheduledReportsList component
  - [ ] List of scheduled reports
  - [ ] Edit/Delete actions

### Testing

- [ ] Unit test: Report generation
- [ ] Unit test: Schedule logic

## Dev Notes

**Frequencies:**
- Daily (at specified time)
- Weekly (on specified day)
- Monthly (on specified date)

**Prerequisites:** Epic 5 complete

### References

- [Source: docs/epics.md#Story-10.1]

## Change Log

- 2025-12-14: Story 10.1 drafted
