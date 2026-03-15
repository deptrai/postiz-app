# Story 14.1: Dự đoán Viral Score

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **dự đoán viral score trước khi đăng** để **biết content nào có tiềm năng cao**.

## Acceptance Criteria

1. **Given** content metadata (caption, hashtags, format, timing), **when** user yêu cầu viral score, **then** hệ thống trả score 0–100 với breakdown.
2. **Given** dữ liệu hiệu suất lịch sử, **when** tính viral score, **then** hệ thống so sánh với top-performing content.
3. **Given** viral score breakdown, **when** user xem chi tiết, **then** hiển thị scores cho từng factor (hook, caption, hashtags, timing, format).
4. **Given** viral score thấp, **when** user xem recommendations, **then** hệ thống gợi ý cải thiện để tăng score.
5. **Given** nhiều content drafts, **when** user so sánh scores, **then** hệ thống rank drafts theo viral potential.

## Tasks / Subtasks

### Backend
- [x] ViralScoreService:
  - `calculateViralScore(contentMetadata)`, định nghĩa factors & weights, so sánh với viral content lịch sử
- [x] Scoring Factors:
  - Hook score (first 3s analysis), Caption score (length, style, keywords), Hashtag score (relevance, trending), Timing score (posting time vs optimal), Format score (Reels vs Post)
- [x] Improvement Suggestions:
  - Sinh gợi ý dựa factors thấp, ưu tiên theo impact
- [x] API:
  - POST /api/viral/score
  - POST /api/viral/compare
  - Swagger docs

### Frontend
- [x] ViralScoreCard:
  - Overall score 0–100, breakdown by factor, visual indicators (color-coded)
- [x] ImprovementSuggestions:
  - Danh sách gợi ý hành động, impact indicators
- [x] ContentComparison:
  - So sánh side-by-side, ranking display
- [x] Viral Score page/modal:
  - Form nhập metadata, tính score real-time

### Testing
- [x] Backend: unit score calc, factor scoring, suggestion generation
- [x] Frontend: component ViralScoreCard, ImprovementSuggestions

## Dev Notes

**Prereq:** Epic 2–4 hoàn tất (có historical data).

**Technical Approach:** MVP rule-based (không ML); factors & weights có thể tune dựa data.

**Scoring Factors (MVP):**
| Factor | Weight | Mô tả |
|--------|--------|-------|
| Hook | 25% | Hiệu quả 3 giây đầu |
| Caption | 20% | Độ dài, keywords, CTAs |
| Hashtags | 15% | Relevance, trending |
| Timing | 20% | Giờ đăng vs tối ưu |
| Format | 20% | Reels vs Post performance |

**Score Interpretation:**
- 80–100: High viral potential
- 60–79: Good potential
- 40–59: Average
- 0–39: Low, cần cải thiện

**File dự kiến:** viral-score.service.ts, viral.controller.ts, viral-score-card.tsx, improvement-suggestions.tsx, content-comparison.tsx.

[ASSUMPTION: Nếu thiếu historical data, dùng benchmark chung; hook score ước lượng dựa caption đầu nếu không có video analysis.] 
