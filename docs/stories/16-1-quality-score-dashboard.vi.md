# Story 16.1: Dashboard điểm chất lượng

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **quality score cho mỗi post/video** để **biết content nào cần cải thiện**.

## Acceptance Criteria

1. **Given** content metrics, **when** user xem quality dashboard, **then** hiển thị overall score 0–100 với breakdown.
2. **Given** quality score breakdown, **when** user xem chi tiết, **then** hiển thị scores cho: engagement, watch time, compliance.
3. **Given** nhiều content items, **when** user xem dashboard, **then** hiển thị list sorted by quality score.
4. **Given** quality trends, **when** user xem dashboard, **then** hiển thị quality trend theo thời gian (7/14/30 ngày).
5. **Given** low quality content, **when** user xem chi tiết, **then** highlight areas cần cải thiện.

## Tasks / Subtasks

### Backend
- [ ] ContentQualityService:
  - `calculateQualityScore(contentId)`, định nghĩa quality factors & weights, tính sub-scores mỗi factor
- [ ] Quality List endpoint:
  - `getContentByQuality(orgId, options)`, hỗ trợ sorting và filtering
- [ ] Quality Trends:
  - `getQualityTrends(orgId, days)`, aggregate theo day/week
- [ ] Improvement Highlights:
  - Identify low-scoring factors, sinh improvement suggestions
- [ ] API:
  - GET /api/quality/score/:contentId
  - GET /api/quality/list
  - GET /api/quality/trends
  - Swagger docs

### Frontend
- [ ] QualityScoreCard: Overall score 0–100, breakdown by factor, visual indicators (color-coded)
- [ ] QualityContentList: Sortable list, quality score badges, quick actions
- [ ] QualityTrendChart: Line chart trends, date range selector
- [ ] ImprovementHighlights: Danh sách areas to improve, priority indicators
- [ ] Quality Dashboard page: Overview, content list, trends chart

### Testing
- [ ] Backend: unit quality score calc, factor scoring, trend aggregation
- [ ] Frontend: component QualityScoreCard, QualityContentList

## Dev Notes

**Prereq:** Epic 2–4 hoàn tất (có content metrics).

**Quality Factors (MVP):**
| Factor | Weight | Mô tả |
|--------|--------|-------|
| Engagement | 35% | Likes, comments, shares relative to reach |
| Watch Time | 25% | Average view duration, completion rate |
| Compliance | 25% | Policy adherence, no bait |
| Consistency | 15% | Regular posting, brand alignment |

**Score Interpretation:**
- 80–100: Excellent quality
- 60–79: Good quality
- 40–59: Average, cần cải thiện
- 0–39: Poor quality, cần hành động

**File dự kiến:** content-quality.service.ts, quality.controller.ts, quality-score-card.tsx, quality-content-list.tsx, quality-trend-chart.tsx, improvement-highlights.tsx, /quality page.

[ASSUMPTION: Compliance score dựa policy check (Story 16.3); nếu thiếu watch time, dùng engagement thay thế với weight cao hơn.]
