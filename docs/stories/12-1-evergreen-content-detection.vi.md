# Story 12.1: Phát hiện nội dung evergreen

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **phát hiện evergreen content** để **repost hiệu quả**.

## Acceptance Criteria

1. **Given** lịch sử hiệu suất content, **when** hệ thống phân tích pattern, **then** xác định content có hiệu suất ổn định theo thời gian.
2. **Given** đã xác định evergreen content, **when** user xem list, **then** hiển thị metrics và evergreen score.
3. **Given** tiêu chí evergreen, **when** phân tích content, **then** xét tính nhất quán engagement, không chỉ đỉnh.
4. **Given** evergreen content, **when** user xem chi tiết, **then** hiển thị lý do được coi là evergreen.

## Tasks / Subtasks

### Backend
- [ ] EvergreenService:
  - `detectEvergreenContent(orgId)`, tính evergreen score, xác định consistent performers
- [ ] Evergreen Criteria:
  - Định nghĩa consistency metrics
  - Trọng số các yếu tố
- [ ] Evergreen Explanation:
  - Sinh giải thích cho từng content
  - Kèm data hỗ trợ

### Frontend
- [ ] EvergreenList:
  - Thẻ content với score
  - Performance indicators
- [ ] EvergreenDetail:
  - Hiển thị giải thích
  - Chart hiệu suất lịch sử

### Testing
- [ ] Unit: evergreen detection
- [ ] Unit: score calculation

## Dev Notes

**Tiêu chí Evergreen:**
- Engagement nhất quán >30 ngày
- Phương sai hiệu suất thấp
- Không phải nội dung nhạy cảm thời gian

**Prereq:** Epic 2–4 hoàn tất.

[ASSUMPTION: Nếu content <30 ngày, không đủ dữ liệu để xét evergreen; score dựa trên coefficient of variation của engagement.] 
