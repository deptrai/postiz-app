# Story 15.4: Hiệu quả Thumbnail

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **đánh giá thumbnail effectiveness của video** để **tăng click-through rate và thu hút viewers**.

## Acceptance Criteria

1. **Given** video với thumbnail data, **when** user xem thumbnail analysis, **then** hiển thị CTR (click-through rate) analysis per thumbnail style.
2. **Given** thumbnail performance data, **when** user xem analysis, **then** hệ thống categorize thumbnails theo style (text-heavy, face, action, minimal, v.v.).
3. **Given** categorized thumbnails, **when** user xem performance comparison, **then** hiển thị thumbnail styles nào perform best cho content của user.
4. **Given** thumbnail analysis, **when** user xem suggestions, **then** hệ thống gợi ý A/B test ideas và best practices.
5. **Given** top-performing thumbnails, **when** user xem chi tiết, **then** hiển thị common elements và patterns của successful thumbnails.

## Tasks / Subtasks

### Backend
- [ ] ThumbnailAnalyticsService:
  - `getThumbnailPerformance(orgId, filters)`, tính CTR per video (clicks / impressions), categorize thumbnails by style
- [ ] Style Performance Analysis:
  - `getStylePerformance(orgId)`, aggregate CTR by thumbnail style, rank styles, tính confidence dựa sample size
- [ ] A/B Test Suggestions:
  - `getThumbnailSuggestions(analysisData)`, sinh A/B test ideas dựa performance gaps, include best practices
- [ ] Success Pattern Detection:
  - `getSuccessPatterns(orgId)`, phân tích top-performing thumbnails, extract common elements (colors, text, faces, v.v.), sinh pattern insights
- [ ] API:
  - GET /api/video-analytics/thumbnail
  - GET /api/video-analytics/thumbnail/styles
  - GET /api/video-analytics/thumbnail/suggestions
  - GET /api/video-analytics/thumbnail/patterns
  - Swagger docs

### Frontend
- [ ] ThumbnailPerformanceTable: Table videos với CTR, sortable by CTR/views/clicks, thumbnail preview column
- [ ] StylePerformanceChart: Bar chart comparing styles, CTR per style, sample size indicator
- [ ] ThumbnailSuggestions: A/B test ideas list, best practices cards, priority ordering
- [ ] SuccessPatternsCard: Common elements visualization, top thumbnail examples, pattern insights
- [ ] Tích hợp vào Video Analytics page

### Testing
- [ ] Backend: unit CTR calc, style categorization, pattern detection, suggestion generation
- [ ] Frontend: component ThumbnailPerformanceTable, StylePerformanceChart, SuccessPatternsCard

## Dev Notes

**Prereq:** Story 13.4 hoàn tất; có video metrics, impressions và clicks data.

**Thumbnail Styles:**
- Text-Heavy: Large text overlay, title-focused
- Face: Human face prominent, emotional expression
- Action: Dynamic scene, movement captured
- Minimal: Clean, simple design
- Before/After: Split comparison
- Curiosity Gap: Blurred/hidden elements

**CTR Calculation:** CTR = (Clicks / Impressions) * 100; Good CTR: >5%; Excellent CTR: >10%.

**Success Pattern Elements:** Color palette, text presence/size, face presence/expression, composition, contrast level.

**Industry Benchmarks:**
| Style | Average CTR | Best For |
|-------|-------------|----------|
| Face + Emotion | 8–12% | Personal content |
| Text + Curiosity | 6–10% | Educational |
| Action Shot | 5–8% | Entertainment |
| Minimal | 4–6% | Professional |

[ASSUMPTION: Thumbnail style categorization dựa metadata hoặc manual tagging; nếu thiếu impressions/clicks data, không tính CTR; best practices từ industry research.]

**File dự kiến:** thumbnail-analytics.service.ts, thumbnail-performance-table.tsx, style-performance-chart.tsx, thumbnail-suggestions.tsx, success-patterns-card.tsx.
