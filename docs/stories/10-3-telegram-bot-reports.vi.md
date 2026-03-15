# Story 10.3: Báo cáo qua Telegram Bot

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **nhận báo cáo qua Telegram** để **xem nhanh trên mobile**.

## Acceptance Criteria

1. **Given** bot Telegram đã cấu hình, **when** đến lịch hoặc user gửi lệnh, **then** bot gửi summary report.
2. **Given** bot Telegram, **when** user gửi command, **then** bot phản hồi quick stats.
3. **Given** bot connection, **when** user setup, **then** có thể link tài khoản Telegram.
4. **Given** report preferences, **when** user cấu hình, **then** chọn nội dung nhận qua Telegram.

## Tasks / Subtasks

### Backend
- [ ] TelegramBotService:
  - Tích hợp Telegram Bot API
  - Gửi report
  - Xử lý command
- [ ] Account Linking:
  - Sinh mã liên kết
  - Verify & lưu chat ID
- [ ] Telegram Preferences:
  - Lưu lựa chọn người dùng
  - Lọc báo cáo theo preference

### Frontend
- [ ] TelegramSetup:
  - QR/link kết nối
  - Trạng thái kết nối
- [ ] TelegramPreferences:
  - Bật/tắt loại báo cáo
  - Cài đặt tần suất

### Testing
- [ ] Unit: định dạng message
- [ ] Integration: bot commands

## Dev Notes

**Bot Commands:** /stats (quick stats), /report (daily report), /help (commands).  
**Prereq:** Story 10.1 hoàn tất.  

[ASSUMPTION: Token bot lưu an toàn server-side; nếu user chưa link Telegram, gửi hướng dẫn link trước khi cho nhận báo cáo.] 
