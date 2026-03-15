# Story 4.3: Best Time to Post (Heatmap) theo Group/Niche

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **khung giờ tốt nhất theo group/niche** để **đăng đúng thời điểm, tăng view và engagement**.

## Acceptance Criteria

1. **Given** dữ liệu 7–14 ngày, **when** xem Insights, **then** hiển thị heatmap/slot gợi ý theo group/niche.
2. **And** đủ dữ liệu thì tách Reels vs Posts.
3. **And** heatmap hiển thị day-of-week × hour-of-day với cường độ engagement.
4. **And** highlight top 3–5 khung giờ gợi ý.
5. **And** gợi ý dựa trên hiệu suất thực tế.

## Tasks / Subtasks

### Backend
- [ ] Tạo `AnalyticsBestTimeService`
  - [ ] aggregatePostPerformanceByTimeSlot() – gom theo ngày/giờ
  - [ ] getBestTimeSlots() – tính khung giờ tốt nhất
  - [ ] Filter group/niche
  - [ ] Filter format (post vs reel)
  - [ ] Tính confidence theo volume dữ liệu

- [ ] Phân tích Time Slot
  - [ ] Lấy day-of-week + hour từ publishedAt
  - [ ] Aggregate engagement/slot
  - [ ] Tính avg engagement/slot
  - [ ] Rank slots
  - [ ] Xử lý timezone

- [ ] API
  - [ ] `GET /api/analytics/best-time`
  - [ ] Query: groupId, format, days
  - [ ] Response: lưới 7×24 + top recommendations
  - [ ] Swagger docs

### Frontend
- [ ] Best Time Heatmap Component
  - [ ] Lưới 7×24
  - [ ] Màu theo cường độ engagement
  - [ ] Tooltip hover
  - [ ] Hiển thị top recommendations
  - [ ] Chọn phạm vi ngày (7/14)

- [ ] Visualization
  - [ ] Hàng: Mon–Sun, Cột: 0–23
  - [ ] Gradient màu (thấp→cao)
  - [ ] Hover, responsive

### Testing
- [ ] Backend: unit (time slot extract, aggregate, rank), edge thiếu dữ liệu; integration API
- [ ] Frontend: component heatmap, gradient calc, hover

## Dev Notes

**Prereq:** Story 2.3 (engagement), Story 2.2 (publishedAt), Story 3.1 (groups).  
**Stack:** NestJS/Prisma/dayjs; React + heatmap/custom grid; dữ liệu: AnalyticsContent, AnalyticsDailyMetric.

### Chiến lược phân tích Time Slot
1. Nhóm nội dung theo day-of-week (0–6) và hour (0–23).
2. Tính engagement slot = reactions+comments+shares.
3. Tính avg/slot, chuẩn hóa theo số bài.
4. Rank slot → chọn top.
5. **[ASSUMPTION]:** Dùng UTC cho MVP; sau có thể đổi theo timezone audience.

### Tính engagement per slot (pseudo)
```ts
// slotMap: key = day-hour, value = { count, totalEngagement }
// avgEngagement = totalEngagement / count
// confidence = min(count/5, 1)  // ≥5 bài => full confidence
```

### Service (tóm tắt)
- `getBestTimeSlots(orgId, { groupId?, integrationIds?, format?, days: 7|14 })`:
  - Tính start/end (now - days).
  - Lấy integrationIds từ group nếu có.
  - Query content + metrics trong khoảng.
  - calculateSlotPerformance(content) → slots
  - generateHeatmap(slots) → lưới 7×24
  - getTopRecommendations(slots, 5) → top slot + confidence + gợi ý

### API Design
`GET /api/analytics/best-time`
- Query: groupId?, integrationIds?, format? ('post'|'reel'|'all'), days (7|14, default 7)
- Response: period (start/end, days), totalContent, format, heatmap[7][24] (engagement, count, confidence), recommendations (day, hour, timeRange, avgEngagement, count, confidence, recommendation text)

### Performance
- Filter ngày (7–14) giới hạn dataset.
- Dùng index (org, publishedAt); filter group/integration.
- Cache có thể 5–10 phút; invalidate khi ingest mới.

### Edge Cases
- Dữ liệu ít: confidence thấp, vẫn hiển thị nhưng đánh dấu.
- Không data: empty state, recommendations rỗng.
- Timezone: MVP dùng UTC; có thể thêm offset user sau.

[ASSUMPTION: Nếu format không đủ dữ liệu (VD Reels ít), vẫn hiển thị nhưng confidence thấp; winner slot dựa trên avgEngagement.] 
