# Story 13.1: Monetization Dashboard

Status: ready-for-dev

## Story

As a **Leader**,
I want **dashboard hiển thị tiến độ monetization**,
So that **tôi biết còn thiếu gì để bật kiếm tiền**.

## Acceptance Criteria

1. **Given** page metrics (followers, watch time, engagement),
   **When** user xem monetization dashboard,
   **Then** hiển thị progress bars cho từng monetization feature.

2. **Given** current metrics và thresholds,
   **When** user xem dashboard,
   **Then** hiển thị percentage completion cho mỗi feature.

3. **Given** progress tracking data,
   **When** user xem dashboard,
   **Then** hiển thị estimated time to eligibility dựa trên growth rate.

4. **Given** multiple monetization features,
   **When** user xem dashboard,
   **Then** hiển thị status cho: In-Stream Ads, Reels, Stars, Fan Subscription.

5. **Given** page đã eligible cho một feature,
   **When** user xem dashboard,
   **Then** hiển thị "Eligible" badge với celebration UI.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create MonetizationService (AC: #1, #2, #3)
  - [ ] Implement `getMonetizationStatus(organizationId)` method
  - [ ] Calculate progress for each monetization feature
  - [ ] Calculate estimated time to eligibility
  - [ ] Return status with percentages and gaps

- [ ] Define Monetization Thresholds (AC: #4)
  - [ ] In-Stream Ads: 10,000 followers + 30,000 one-minute views (60 days)
  - [ ] Reels: 600,000 viewed minutes
  - [ ] Stars: 500 followers (30 days continuous)
  - [ ] Fan Subscription: 10,000 followers + 180,000 minutes watched

- [ ] Add Monetization API endpoints (AC: #1, #4)
  - [ ] GET /api/monetization/status - Get monetization status
  - [ ] GET /api/monetization/progress - Get detailed progress
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create MonetizationDashboard component (AC: #1, #2)
  - [ ] Progress bars for each feature
  - [ ] Percentage display
  - [ ] Current vs required metrics

- [ ] Add Estimated Time display (AC: #3)
  - [ ] Calculate based on growth rate
  - [ ] Show "X days/weeks to eligibility"

- [ ] Add Eligibility Status (AC: #4, #5)
  - [ ] Status badges (Eligible/Not Eligible/Close)
  - [ ] Celebration UI for eligible features

- [ ] Create Monetization page route
  - [ ] Add to navigation
  - [ ] Responsive design

### Testing

- [ ] Backend tests
  - [ ] Unit test: Progress calculation
  - [ ] Unit test: Estimated time calculation
  - [ ] Unit test: Eligibility determination

- [ ] Frontend tests
  - [ ] Component test: MonetizationDashboard

## Dev Notes

**Prerequisites:**
- Epic 2 complete (Ingestion & Storage)
- Metrics data available (followers, watch time, engagement)

**Technical Stack:**
- Backend: NestJS, Prisma ORM
- Frontend: React, TypeScript, TailwindCSS

**Monetization Thresholds (Facebook 2025):**

| Feature | Followers | Watch Time | Other |
|---------|-----------|------------|-------|
| In-Stream Ads | 10,000 | 30,000 one-minute views (60 days) | Videos >3 min |
| Reels | - | 600,000 viewed minutes | 5+ videos |
| Stars | 500 (30 days) | - | - |
| Fan Subscription | 10,000 or 250+ return viewers | 180,000 minutes | 50,000 engagements |

**Calculation Logic:**
- Progress % = (current / required) * 100
- Estimated time = gap / daily_growth_rate

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/monetization/monetization.service.ts`
- `apps/backend/src/api/routes/monetization.controller.ts`
- `apps/frontend/src/components/monetization/monetization-dashboard.tsx`
- `apps/frontend/src/app/(app)/(site)/monetization/page.tsx`

### References

- [Source: docs/epics.md#Epic-13]
- [Source: docs/research/feature-improvement-proposals.md#Epic-13]
- [Source: Facebook Monetization Requirements 2025]

## Dev Agent Record

### Context Reference

- `docs/stories/13-1-monetization-dashboard.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 13.1 drafted by Mary (Business Analyst)
