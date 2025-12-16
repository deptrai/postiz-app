# Story 13.3: Monetization Alerts

Status: ready-for-dev

## Story

As a **Leader**,
I want **nhận thông báo khi gần đạt eligibility**,
So that **tôi không bỏ lỡ cơ hội**.

## Acceptance Criteria

1. **Given** progress tracking,
   **When** đạt 80% threshold,
   **Then** hệ thống gửi "Almost there!" notification.

2. **Given** progress tracking,
   **When** đạt 90% threshold,
   **Then** hệ thống gửi "So close!" notification với urgency.

3. **Given** progress tracking,
   **When** đạt 100% threshold,
   **Then** hệ thống gửi celebration notification.

4. **Given** metrics đang giảm,
   **When** progress drops below previous milestone,
   **Then** hệ thống gửi warning notification.

5. **Given** notification preferences,
   **When** user configure settings,
   **Then** hệ thống respect preferences (on/off, channels).

## Tasks / Subtasks

### Backend Implementation

- [ ] Create MonetizationAlertService (AC: #1, #2, #3, #4)
  - [ ] Implement milestone detection logic
  - [ ] Implement progress drop detection
  - [ ] Generate appropriate alert messages

- [ ] Create Alert Job (AC: #1, #2, #3, #4)
  - [ ] Background job to check milestones daily
  - [ ] Compare with previous day's progress
  - [ ] Trigger alerts when thresholds crossed

- [ ] Add Alert Preferences (AC: #5)
  - [ ] Store user notification preferences
  - [ ] Support enable/disable per alert type
  - [ ] Support channel preferences (in-app, email)

- [ ] Add Alert API endpoints
  - [ ] GET /api/monetization/alerts - Get recent alerts
  - [ ] PUT /api/monetization/alerts/preferences - Update preferences
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create AlertNotification component (AC: #1, #2, #3)
  - [ ] Toast notifications
  - [ ] Celebration animation for 100%
  - [ ] Urgency styling for 90%

- [ ] Create AlertPreferences component (AC: #5)
  - [ ] Toggle switches for each alert type
  - [ ] Channel selection

- [ ] Add Alert History section
  - [ ] List of recent alerts
  - [ ] Mark as read functionality

### Testing

- [ ] Backend tests
  - [ ] Unit test: Milestone detection
  - [ ] Unit test: Progress drop detection
  - [ ] Unit test: Alert generation

- [ ] Frontend tests
  - [ ] Component test: AlertNotification
  - [ ] Component test: AlertPreferences

## Dev Notes

**Prerequisites:**
- Story 13.1 complete (Monetization Dashboard)

**Alert Types:**
1. **Milestone 80%:** "Almost there! You're 80% of the way to [Feature]"
2. **Milestone 90%:** "So close! Just 10% more to unlock [Feature]"
3. **Milestone 100%:** "🎉 Congratulations! You're now eligible for [Feature]"
4. **Progress Drop:** "⚠️ Warning: Your [Metric] has dropped. Take action to maintain progress."

**Notification Channels (MVP):**
- In-app notifications
- (Future: Email, Telegram)

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/monetization/monetization-alert.service.ts`
- `apps/frontend/src/components/monetization/alert-notification.tsx`
- `apps/frontend/src/components/monetization/alert-preferences.tsx`

### References

- [Source: docs/epics.md#Story-13.3]
- [Source: docs/stories/13-1-monetization-dashboard.md]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 13.3 drafted by Mary (Business Analyst)
