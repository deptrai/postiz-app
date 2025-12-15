# Story 8.3: Notification Channels

Status: done

## Story

As a **Leader**,
I want **nhận alerts qua email/telegram**,
So that **tôi không bỏ lỡ thông tin quan trọng**.

## Acceptance Criteria

1. **Given** alert được trigger,
   **When** user đã configure notification preferences,
   **Then** hệ thống gửi qua channels đã chọn.

2. **Given** email channel enabled,
   **When** alert triggered,
   **Then** gửi email với summary và link to dashboard.

3. **Given** in-app notifications,
   **When** alert triggered,
   **Then** hiển thị notification badge và toast.

4. **Given** notification preferences,
   **When** user update settings,
   **Then** hệ thống save và apply immediately.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create NotificationService (AC: #1)
  - [ ] Implement `sendNotification(userId, alert, channels)` method
  - [ ] Support multiple channels

- [ ] Add Email Channel (AC: #2)
  - [ ] Email template for alerts
  - [ ] SendGrid/SES integration

- [ ] Add In-App Notifications (AC: #3)
  - [ ] Store notifications in database
  - [ ] WebSocket for real-time updates

- [ ] Add Notification Preferences (AC: #4)
  - [ ] Store user preferences
  - [ ] API endpoints for preferences

### Frontend Implementation

- [ ] Create NotificationBell component (AC: #3)
  - [ ] Badge with unread count
  - [ ] Dropdown with recent notifications

- [ ] Create NotificationPreferences component (AC: #4)
  - [ ] Channel toggles
  - [ ] Alert type settings

### Testing

- [ ] Unit test: Notification routing
- [ ] Integration test: Email sending

## Dev Notes

**Channels (MVP):**
- In-app notifications
- Email

**Future Channels:**
- Telegram bot
- Slack integration
- SMS

**Prerequisites:** Story 8.1 complete

### References

- [Source: docs/epics.md#Story-8.3]

## Change Log

- 2025-12-14: Story 8.3 drafted
