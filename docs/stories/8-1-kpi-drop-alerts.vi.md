# Story 8.1: Cảnh báo KPI tụt giảm

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **nhận cảnh báo khi KPI tụt đột ngột** để **phản ứng nhanh và điều chỉnh chiến lược**.

## Acceptance Criteria

1. **Given** đã có metrics daily, **when** engagement rate giảm >20% so với 7 ngày trước, **then** hệ thống gửi alert kèm chi tiết và gợi ý.
2. **Given** metrics daily, **when** reach giảm >30% so với tuần trước, **then** hệ thống gửi alert với mức độ nghiêm trọng (severity).
3. **Given** ngưỡng cảnh báo, **when** user cấu hình, **then** thresholds có thể tùy chỉnh theo group/niche.
4. **Given** alert được bắn, **when** user xem chi tiết, **then** hiển thị dữ liệu so sánh và hành động đề xuất.
5. **Given** nhiều alert, **when** xem lịch sử, **then** hiển thị danh sách sắp xếp theo severity và thời gian.

## Tasks / Subtasks

### Backend
- [ ] AlertService:
  - `checkKPIDrops(orgId)`: tính % thay đổi, so ngưỡng
  - Định nghĩa ngưỡng per metric
- [ ] Alert Detection Job:
  - Job chạy daily
  - So sánh kỳ hiện tại vs kỳ trước
  - Tạo alert nếu vượt ngưỡng
- [ ] Alert Configuration:
  - Lưu tùy chỉnh ngưỡng user
  - Hỗ trợ per-group/niche
- [ ] API:
  - GET /api/alerts (list)
  - GET /api/alerts/:id (detail)
  - PUT /api/alerts/config (update thresholds)
  - Swagger docs

### Frontend
- [ ] AlertCard (chi tiết):
  - Indicator severity (critical/warning/info)
  - So sánh metric
  - Suggested actions
- [ ] AlertHistory:
  - List sort/filter
  - Mark as read
- [ ] AlertConfig:
  - Threshold sliders
  - Per-group settings

### Testing
- Backend: unit drop detection, threshold compare, integration job
- Frontend: n/a (chưa liệt kê)

## Dev Notes

**Ngưỡng mặc định:**
- Engagement Rate Drop: >20%
- Reach Drop: >30%
- Views Drop: >25%

**Severity:**
- Critical: >50% drop
- Warning: 30–50% drop
- Info: 20–30% drop

[ASSUMPTION: Nếu thiếu metric views, bỏ qua ngưỡng views; nếu không có dữ liệu tuần trước, không bắn alert.] 
