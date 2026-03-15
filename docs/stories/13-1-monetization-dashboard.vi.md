# Story 13.1: Dashboard tiến độ kiếm tiền

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **dashboard hiển thị tiến độ monetization** để **biết còn thiếu gì để bật kiếm tiền**.

## Acceptance Criteria

1. **Given** metrics page (followers, watch time, engagement), **when** user xem monetization dashboard, **then** hiển thị progress bars cho từng tính năng monetization.
2. **Given** metrics hiện tại và ngưỡng, **when** user xem dashboard, **then** hiển thị % hoàn thành mỗi feature.
3. **Given** dữ liệu tracking, **when** user xem dashboard, **then** hiển thị thời gian ước lượng đến eligibility dựa growth rate.
4. **Given** nhiều tính năng monetization, **when** user xem dashboard, **then** hiển thị status: In-Stream Ads, Reels, Stars, Fan Subscription.
5. **Given** page đã đủ điều kiện một feature, **when** user xem dashboard, **then** hiển thị badge "Eligible" với UI chúc mừng.

## Tasks / Subtasks

### Backend
- [ ] MonetizationService:
  - `getMonetizationStatus(orgId)`, tính progress mỗi feature, ước lượng thời gian đến eligibility, trả status với % và gap
- [ ] Định nghĩa ngưỡng Monetization:
  - In-Stream Ads: 10K followers + 30K one-minute views (60 ngày)
  - Reels: 600K viewed minutes
  - Stars: 500 followers (30 ngày liên tục)
  - Fan Subscription: 10K followers + 180K minutes watched
- [ ] API:
  - GET /api/monetization/status
  - GET /api/monetization/progress
  - Swagger docs

### Frontend
- [ ] MonetizationDashboard:
  - Progress bars mỗi feature
  - Hiển thị %
  - Current vs required metrics
- [ ] Estimated Time:
  - Tính theo growth rate
  - Hiển thị "X days/weeks to eligibility"
- [ ] Eligibility Status:
  - Badge (Eligible/Not Eligible/Close)
  - Celebration UI cho eligible
- [ ] Route /monetization, thêm vào navigation, responsive

### Testing
- Backend: unit progress calc, estimated time, eligibility
- Frontend: component MonetizationDashboard

## Dev Notes

**Prereq:** Epic 2 (metrics: followers, watch time, engagement).  
**Stack:** NestJS/Prisma; React/TS/TailwindCSS.

**Ngưỡng Monetization (Facebook 2025):**
| Feature | Followers | Watch Time | Khác |
|---------|-----------|------------|------|
| In-Stream Ads | 10K | 30K one-min views (60d) | Videos >3 min |
| Reels | - | 600K viewed minutes | 5+ videos |
| Stars | 500 (30d) | - | - |
| Fan Subscription | 10K hoặc 250+ return viewers | 180K minutes | 50K engagements |

**Logic:** Progress % = (current / required) * 100; Estimated time = gap / daily_growth_rate.

**File dự kiến:** monetization.service.ts, monetization.controller.ts, monetization-dashboard.tsx, /monetization page.

[ASSUMPTION: Nếu thiếu dữ liệu growth rate, hiển thị "Insufficient data"; nếu đã eligible, ẩn progress bar và hiển thị celebration badge.] 
