# Story 13.3: Cảnh báo Monetization

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **nhận thông báo khi gần đạt eligibility** để **không bỏ lỡ cơ hội**.

## Acceptance Criteria

1. **Given** tracking tiến độ, **when** đạt 80% ngưỡng, **then** hệ thống gửi "Almost there!" notification.
2. **Given** tracking tiến độ, **when** đạt 90% ngưỡng, **then** hệ thống gửi "So close!" notification với urgency.
3. **Given** tracking tiến độ, **when** đạt 100% ngưỡng, **then** hệ thống gửi celebration notification.
4. **Given** metrics đang giảm, **when** progress giảm xuống dưới milestone trước, **then** hệ thống gửi warning notification.
5. **Given** notification preferences, **when** user cấu hình, **then** hệ thống tôn trọng lựa chọn (on/off, channels).

## Tasks / Subtasks

### Backend
- [ ] MonetizationAlertService:
  - Logic phát hiện milestone
  - Phát hiện progress drop
  - Sinh alert messages phù hợp
- [ ] Alert Job:
  - Background job check milestones daily
  - So sánh với progress ngày trước
  - Trigger alerts khi vượt ngưỡng
- [ ] Alert Preferences:
  - Lưu lựa chọn notification user
  - Bật/tắt per alert type
  - Chọn channel (in-app, email)
- [ ] API:
  - GET /api/monetization/alerts
  - PUT /api/monetization/alerts/preferences
  - Swagger docs

### Frontend
- [ ] AlertNotification:
  - Toast notifications
  - Animation chúc mừng cho 100%
  - Styling urgency cho 90%
- [ ] AlertPreferences:
  - Toggle switches mỗi loại alert
  - Chọn channel
- [ ] Alert History:
  - Danh sách alerts gần đây
  - Mark as read

### Testing
- Backend: unit milestone detection, progress drop, alert generation
- Frontend: component AlertNotification, AlertPreferences

## Dev Notes

**Prereq:** Story 13.1 hoàn tất.

**Loại Alerts:**
1. Milestone 80%: "Almost there! You're 80% of the way to [Feature]"
2. Milestone 90%: "So close! Just 10% more to unlock [Feature]"
3. Milestone 100%: "🎉 Congratulations! You're now eligible for [Feature]"
4. Progress Drop: "⚠️ Warning: Your [Metric] has dropped. Take action to maintain progress."

**Channels (MVP):** In-app (Future: Email, Telegram).

**File dự kiến:** monetization-alert.service.ts, alert-notification.tsx, alert-preferences.tsx.

[ASSUMPTION: Nếu user tắt notifications, vẫn lưu alert history để xem sau; progress drop chỉ cảnh báo nếu giảm >5% so với ngày trước.] 
