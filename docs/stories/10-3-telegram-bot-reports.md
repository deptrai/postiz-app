# Story 10.3: Telegram Bot Reports

Status: ready-for-dev

## Story

As a **Leader**,
I want **nhận báo cáo qua Telegram**,
So that **tôi xem nhanh trên mobile**.

## Acceptance Criteria

1. **Given** Telegram bot configured,
   **When** schedule trigger hoặc user command,
   **Then** bot gửi summary report.

2. **Given** Telegram bot,
   **When** user send command,
   **Then** bot respond với quick stats.

3. **Given** bot connection,
   **When** user setup,
   **Then** có thể link Telegram account.

4. **Given** report preferences,
   **When** user configure,
   **Then** có thể chọn what to receive via Telegram.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create TelegramBotService (AC: #1, #2)
  - [ ] Telegram Bot API integration
  - [ ] Implement report sending
  - [ ] Implement command handling

- [ ] Add Account Linking (AC: #3)
  - [ ] Generate linking code
  - [ ] Verify and store chat ID

- [ ] Add Telegram Preferences (AC: #4)
  - [ ] Store user preferences
  - [ ] Filter reports by preference

### Frontend Implementation

- [ ] Create TelegramSetup component (AC: #3)
  - [ ] QR code or link
  - [ ] Connection status

- [ ] Create TelegramPreferences component (AC: #4)
  - [ ] Report type toggles
  - [ ] Frequency settings

### Testing

- [ ] Unit test: Message formatting
- [ ] Integration test: Bot commands

## Dev Notes

**Bot Commands:**
- /stats - Quick stats summary
- /report - Full daily report
- /help - Available commands

**Prerequisites:** Story 10.1 complete

### References

- [Source: docs/epics.md#Story-10.3]

## Change Log

- 2025-12-14: Story 10.3 drafted
