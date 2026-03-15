# Story 4.2: Chủ đề/Pillar đang trend theo vận tốc (24–72h)

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **danh sách chủ đề/pillar đang trend theo vận tốc** để **bắt kịp xu hướng nhanh trong từng niche**.

## Acceptance Criteria

1. **Given** đã có tags và time-series metrics (Stories 4.1, 2.3), **when** xem Insights, **then** hiển thị top trending topics/pillars theo group/niche.
2. **And** trend có “why” (vận tốc + metrics).
3. **And** tính trend trên cửa sổ 24–72h.
4. **And** lọc theo group/niche.
5. **And** xếp hạng theo velocity score.

## Tasks / Subtasks

### Backend
- [ ] Tạo `AnalyticsTrendingService`
  - [ ] `calculateTagVelocity()`: vận tốc mention tag theo cửa sổ thời gian
  - [ ] `getTrendingTopics()`: top trending tags theo velocity
  - [ ] Hỗ trợ 24h/48h/72h
  - [ ] Filter theo group/niche
  - [ ] Kèm “why trending”

- [ ] Tính toán velocity
  - [ ] Đếm mention tag mỗi kỳ
  - [ ] Tính engagement per tag
  - [ ] Tính velocity score
  - [ ] Rank theo velocity
  - [ ] Edge cases: tag mới, baseline = 0

- [ ] API
  - [ ] `GET /api/analytics/trending/topics`
  - [ ] Query: groupId, timeWindow, limit
  - [ ] Response có velocity metrics
  - [ ] Swagger docs

### Frontend
- [ ] Widget Trending Topics
  - [ ] Hiển thị top 5–10 topics
  - [ ] Icon/indicator xu hướng (↗️)
  - [ ] Tooltip “why trending”
  - [ ] Chọn time window (24/48/72h)

- [ ] Chi tiết topic
  - [ ] Tên tag + loại (AUTO/MANUAL)
  - [ ] % velocity
  - [ ] Mentions hiện tại vs kỳ trước
  - [ ] Engagement metrics
  - [ ] Trend icon

### Testing
- [ ] Backend: unit tính velocity, ranking; edge new tags/zero; integration API
- [ ] Frontend: component trending widget; time window switch; empty state

## Dev Notes

**Prereq:** Story 4.1 (tags), Story 2.3 (metrics), Story 3.1 (groups).  
**Stack:** NestJS/Prisma; React dashboard. Data: AnalyticsTag, AnalyticsContentTag, AnalyticsDailyMetric.

### Công thức Velocity

**Velocity Score (đơn giản):**
```
Velocity = ((Current Mentions - Previous Mentions) / Previous Mentions) × 100
```

**Có trọng số Engagement:**
```
Weighted Velocity = (Mention Velocity × 0.4) + (Engagement Velocity × 0.6)
Where:
- Mention Velocity = % thay đổi mentions
- Engagement Velocity = % thay đổi avg engagement/tag
```

**Ví dụ:**
- Mentions: 10 → 18 (80%)
- Avg engagement: 50 → 70 (40%)
- Weighted = 56%

### Service (tóm tắt)
- `getTrendingTopics(orgId, { groupId?, integrationIds?, timeWindow, limit })`:
  - Xác định thời gian current & previous (timeWindow = 24/48/72h).
  - Lấy integrationIds từ group nếu có.
  - Lấy tag mentions + engagement cho hai kỳ.
  - Tính velocity từng tag; new tag → velocity 100%.
  - Sort theo velocityScore desc; trả top N.
- `getTagMentions`: query content theo thời gian + filters, aggregate mentions & engagement/tag.
- `calculateVelocities`: so sánh current vs previous, tính mentionVelocity, engagementVelocity, velocityScore; lọc >0.

### API Design

`GET /api/analytics/trending/topics`
- Query: groupId?, integrationIds?, timeWindow ('24h'|'48h'|'72h'), limit? (default 10, max 50)
- Response: danh sách trending kèm fields:
  - tag (id, name, type)
  - currentMentions, previousMentions
  - mentionVelocity, engagementVelocity, velocityScore
  - currentAvgEngagement, previousAvgEngagement
  - isNew, whyTrending
  - timeWindow, generatedAt

### UI/UX
- Widget: danh sách top topics, velocity %, “why trending”.
- Time window selector 24/48/72h.
- Filter theo group/niche từ dashboard filter.

### Performance
- Cache trending ~10 phút; invalidate khi có ingest mới.
- Sử dụng index (org, publishedAt); hạn chế time window nhỏ (≤72h).

### Edge Cases
- Tag mới: velocity=100, isNew=true.
- Previous=0: tránh chia 0 → dùng logic mặc định (new tag).
- Không có data: trả empty state, velocity=0.

[ASSUMPTION: Nếu không có baseline (previous=0), set velocity 100 cho tag mới; nếu previous>0 nhưng current=0, không coi là trending (có thể lọc ra).]
