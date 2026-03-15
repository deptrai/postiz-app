# Story 14.3: Thời điểm tối ưu để viral

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **biết thời điểm tốt nhất để viral** để **maximize reach potential**.

## Acceptance Criteria

1. **Given** dữ liệu viral content lịch sử, **when** user yêu cầu optimal timing, **then** hệ thống recommend posting windows cho viral potential.
2. **Given** audience activity patterns, **when** tính optimal timing, **then** tính đến thời gian audience online.
3. **Given** content format (Reels vs Post), **when** user yêu cầu timing, **then** cung cấp recommendations theo format.
4. **Given** niche/group context, **when** tính timing, **then** tùy chỉnh recommendations per niche.
5. **Given** timing recommendations, **when** user xem chi tiết, **then** hiển thị confidence level và historical success rate.

## Tasks / Subtasks

### Backend
- [ ] ViralTimingService:
  - `getOptimalViralTiming(orgId, options)`, phân tích viral content timing lịch sử, tính audience activity patterns
- [ ] Format-Specific Timing:
  - Phân tích riêng Reels vs Posts, optimal windows khác nhau per format
- [ ] Niche-Specific Timing:
  - Group timing analysis theo niche, custom recommendations per group
- [ ] Confidence Metrics:
  - Tính confidence dựa data volume, track historical success rate
- [ ] API:
  - GET /api/viral/timing
  - GET /api/viral/timing/heatmap
  - Swagger docs

### Frontend
- [ ] ViralTimingCard:
  - Recommended posting windows, confidence indicators, success rate display
- [ ] TimingHeatmap:
  - Visual heatmap theo day/hour, interactive selection
- [ ] FormatTimingTabs:
  - Tabs cho Reels vs Posts, recommendations theo format
- [ ] Tích hợp vào Viral Optimizer page

### Testing
- [ ] Backend: unit timing analysis, format-specific calc, confidence calc
- [ ] Frontend: component ViralTimingCard, TimingHeatmap

## Dev Notes

**Prereq:** Story 14.1 hoàn tất; có historical posting data với timestamps.

**Timing Analysis Approach:**
1. Phân tích giờ đăng viral content
2. Cross-reference với audience activity
3. Trọng số theo engagement velocity (early engagement)
4. Phân đoạn theo format và niche

**Optimal Windows (ví dụ):**
- Reels: 7–9 AM, 12–2 PM, 7–10 PM
- Posts: 9–11 AM, 1–3 PM, 6–8 PM

**Confidence Levels:**
- High: >100 data points, >70% success rate
- Medium: 50–100 data points, 50–70% success rate
- Low: <50 data points, <50% success rate

[ASSUMPTION: Nếu thiếu audience activity data, dùng best practices chung; nếu <50 data points, hiển thị "Insufficient data" với confidence Low.]

**File dự kiến:** viral-timing.service.ts, viral-timing-card.tsx, timing-heatmap.tsx.
