# Story 8.3: Kênh thông báo

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **nhận alert qua email/telegram** để **không bỏ lỡ thông tin quan trọng**.

## Acceptance Criteria

1. **Given** alert được trigger, **when** user đã cấu hình kênh, **then** hệ thống gửi qua channel đã chọn.
2. **Given** bật email, **when** alert trigger, **then** gửi email với summary và link dashboard.
3. **Given** in-app notifications, **when** alert trigger, **then** hiện badge và toast.
4. **Given** notification preferences, **when** user cập nhật, **then** lưu và áp dụng ngay.

## Tasks / Subtasks

### Backend
- [ ] NotificationService:
  - `sendNotification(userId, alert, channels)`
  - Hỗ trợ nhiều channel
- [ ] Email channel:
  - Template email alert
  - Tích hợp SendGrid/SES
- [ ] In-app notifications:
  - Lưu notification DB
  - WebSocket real-time
- [ ] Notification Preferences:
  - Lưu lựa chọn kênh người dùng
  - API preferences

### Frontend
- [ ] NotificationBell:
  - Badge số chưa đọc
  - Dropdown thông báo gần đây
- [ ] NotificationPreferences:
  - Bật/tắt kênh
  - Thiết lập loại alert

### Testing
- [ ] Unit: routing thông báo
- [ ] Integration: gửi email

## Dev Notes

**Channels (MVP):** In-app, Email  
**Future:** Telegram bot, Slack, SMS  
**Prereq:** Story 8.1 hoàn tất.

[ASSUMPTION: Telegram/Slack/SMS là future; MVP triển khai in-app + email. Nếu user chưa cấu hình kênh, fallback in-app.] 
