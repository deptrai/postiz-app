# Story 10.1: Báo cáo tự động theo lịch

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **báo cáo tự động theo lịch** để **tôi và team luôn có data cập nhật**.

## Acceptance Criteria

1. **Given** cấu hình report, **when** đến lịch (daily/weekly/monthly), **then** hệ thống generate và gửi report.
2. **Given** report schedule, **when** user cấu hình, **then** chọn frequency, time, recipients.
3. **Given** report content, **when** user cấu hình, **then** chọn metrics và sections cần đưa vào.
4. **Given** scheduled report, **when** report generate, **then** gửi email kèm summary.

## Tasks / Subtasks

### Backend
- [ ] ReportSchedulerService:
  - `generateScheduledReport(config)`
  - Hỗ trợ daily/weekly/monthly
  - Cron job
- [ ] Report Configuration:
  - Lưu cài đặt lịch
  - Lưu nội dung (metrics/sections)
  - Hỗ trợ nhiều recipients
- [ ] Report Delivery:
  - Template email
  - Đính kèm (attachment)

### Frontend
- [ ] ReportScheduler component:
  - Frequency selector
  - Time picker
  - Content checkboxes
  - Recipients input
- [ ] ScheduledReportsList:
  - Danh sách lịch gửi
  - Sửa/Xóa

### Testing
- [ ] Unit: report generation
- [ ] Unit: schedule logic

## Dev Notes

**Frequencies:** Daily (giờ chỉ định), Weekly (ngày chỉ định), Monthly (ngày chỉ định)  
**Prereq:** Epic 5 hoàn tất.  

[ASSUMPTION: Nếu email chưa cấu hình, hiển thị cảnh báo và không gửi; có thể lưu file export ở backend để tải tay.] 
