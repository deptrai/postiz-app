# Story 12.2: Gợi ý repost

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **gợi ý thời điểm repost** để **tối đa hóa reach của evergreen content**.

## Acceptance Criteria

1. **Given** đã xác định evergreen content, **when** user xem gợi ý, **then** hệ thống recommend thời điểm repost tối ưu.
2. **Given** gợi ý repost, **when** user xem chi tiết, **then** hiển thị hiệu suất dự kiến và lý do.
3. **Given** lịch sử repost, **when** gợi ý timing, **then** tránh repost quá thường xuyên cùng content.
4. **Given** gợi ý repost, **when** user chấp nhận, **then** có thể schedule repost trực tiếp.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng EvergreenService:
  - `getRepostSuggestions(orgId)`, tính timing tối ưu, ước lượng hiệu suất
- [ ] Repost History Tracking:
  - Theo dõi ngày repost
  - Thực thi khoảng cách tối thiểu
- [ ] Scheduling Integration:
  - Kết nối hệ thống scheduling
  - Tạo scheduled post từ gợi ý

### Frontend
- [ ] RepostSuggestions:
  - Thẻ gợi ý
  - Timing recommendations
- [ ] RepostScheduler:
  - Nút schedule nhanh
  - Date/time picker

### Testing
- [ ] Unit: tính timing
- [ ] Unit: enforce interval

## Dev Notes

**Yếu tố Repost Timing:**
- Thời gian từ lần đăng cuối
- Tăng trưởng audience từ bài gốc
- Tính phù hợp theo mùa

**Khoảng cách tối thiểu:** 30 ngày (có thể cấu hình)  
**Prereq:** Story 12.1 hoàn tất.

[ASSUMPTION: Nếu chưa có lịch sử repost, gợi ý sau 30 ngày kể từ bài gốc; nếu audience không tăng, ưu tiên content khác.] 
