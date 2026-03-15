# Story 4.4: Daily Brief Endpoint + UI

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **Daily Brief hàng ngày** để **ra quyết định nội dung trong <5 phút**.

## Acceptance Criteria

1. **Given** trending topics + best time slots + top content, **when** mở Daily Brief, **then** hiển thị:
   - Top trending topics/pillars
   - Best time slots
   - Top performing content templates
2. **And** mỗi recommendation có giải thích (explainability).
3. **And** nếu ingestion hằng ngày bị thiếu, vẫn trả Brief kèm cảnh báo/indicator.
4. **And** lỗi query/date trả 400 chuẩn NestJS với thông báo rõ.
5. **And** Brief load <3 giây.

## Tasks / Subtasks

### Backend
- [ ] Tạo `AnalyticsDailyBriefService`
  - [ ] Aggregate nhiều nguồn
  - [ ] Gọi TrendingService (topics)
  - [ ] Gọi BestTimeService (khung giờ)
  - [ ] Query top content
  - [ ] Sinh recommendations
  - [ ] Thêm explainability cho từng insight

- [ ] Data Aggregation
  - [ ] Trending 24–48h
  - [ ] Best time 7 ngày
  - [ ] Top 5 content theo engagement
  - [ ] Format breakdown summary
  - [ ] Kiểm tra độ đầy đủ dữ liệu (completeness)

- [ ] API
  - [ ] `GET /api/analytics/daily-brief`
  - [ ] Query: groupId, date?
  - [ ] Response: tổng hợp insight + giải thích
  - [ ] Swagger docs

### Frontend
- [ ] Trang Daily Brief
  - [ ] Layout sạch, quét nhanh
  - [ ] Phân section: Trending, Best Times, Top Content, Quick Actions
  - [ ] Indicator “data completeness”
  - [ ] Tooltip giải thích
  - [ ] Date selector (xem brief lịch sử)
  - [ ] Print/export

### Testing
- [ ] Backend: unit aggregation, explainability, partial data; integration API
- [ ] Frontend: component Brief, cảnh báo data thiếu, loading states

## Dev Notes

**Prereq:** Story 4.1 (tags), 4.2 (trending), 4.3 (best time), 3.2 (top content), 3.3 (format breakdown).
**Stack:** NestJS (tổng hợp service), React (dashboard layout), cache 10 phút.

### Cấu trúc Daily Brief
Sections:
1. Summary – key metrics
2. Trending Topics – nội dung hot
3. Best Times – giờ đăng hôm nay
4. Top Performers – nội dung hiệu quả
5. Recommendations – hành động

[ASSUMPTION]: MVP tạo on-demand; tương lai có cron 6am.  
[ASSUMPTION]: Mặc định 24h gần nhất; có selector để xem ngày khác.

### Service (tóm tắt)
`getDailyBrief(orgId, { groupId?, date? })`:
- Xác định targetDate (default hôm nay).
- `checkDataCompleteness()` cho ngày đó.
- Chạy song song:
  - getTrendingTopics (24h, limit 5)
  - getBestTimesToday (từ best-time 7 ngày, lọc theo ngày hiện tại)
  - getTopContent (7 ngày, top 5 theo engagement)
  - getFormatInsights (Posts vs Reels, 7 ngày)
- Sinh recommendations từ kết quả.
- Trả: date, generatedAt, dataCompleteness, summary, insights, recommendations, explainability.

### Response (ví dụ tóm tắt)
- `summary`: totalContent, trendingTopicsCount, bestTimeSlotsCount
- `insights`:
  - `trending`: tag, velocityScore, currentMentions, explanation
  - `bestTimes`: timeRange, dayName, avgEngagement, confidence, explanation
  - `topContent`: id, caption, type, publishedAt, integration, engagement, reach, engagementRate, explanation
  - `formatInsights`: posts vs reels, winner, giải thích
- `recommendations`: trending/timing/format hành động
- `dataCompleteness`: trạng thái ingestion

### Performance
- Cache 10 phút; chạy song song trong service.
- Giới hạn kết quả (top 5) để <3s.

### Edge Cases
- Data thiếu: vẫn trả Brief + cảnh báo completeness.
- Lỗi query: 400 chuẩn, thông điệp rõ.
- Không có trending/best time: trả mảng rỗng, recommendations rỗng.

### File dự kiến
- Backend: `analytics-daily-brief.service.ts`, controller endpoint.
- FE: trang Daily Brief + widget components.
- Docs: Swagger, story này.

[ASSUMPTION: Khi không đủ dữ liệu top content, lấy tối đa có sẵn; explainability hiển thị lý do thiếu.] 
