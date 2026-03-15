# Story 13.2: Phân tích gap & Gợi ý

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **phân tích gap và gợi ý cách đạt eligibility** để **có action plan rõ ràng**.

## Acceptance Criteria

1. **Given** metrics hiện tại và ngưỡng, **when** user xem gap analysis, **then** hiển thị "Bạn cần thêm X followers, Y watch minutes".
2. **Given** gap analysis data, **when** user xem recommendations, **then** gợi ý content types để tăng metrics.
3. **Given** dữ liệu tăng trưởng lịch sử, **when** user xem recommendations, **then** gợi ý posting frequency tối ưu.
4. **Given** nhiều gaps, **when** user xem analysis, **then** ưu tiên gaps theo impact và effort.
5. **Given** recommendations, **when** user xem chi tiết, **then** hiển thị expected impact của mỗi gợi ý.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng MonetizationService:
  - `getGapAnalysis(orgId)`, tính gap mỗi metric, ưu tiên theo impact
- [ ] RecommendationEngine:
  - `getRecommendations(orgId, gaps)`, sinh gợi ý content type, posting frequency, tính expected impact
- [ ] API:
  - GET /api/monetization/gaps
  - GET /api/monetization/recommendations
  - Swagger docs

### Frontend
- [ ] GapAnalysisCard:
  - Hiển thị gaps với visual indicators
  - Priority badges
  - Messaging "Bạn cần thêm X"
- [ ] RecommendationsPanel:
  - Danh sách gợi ý hành động
  - Hiển thị expected impact
  - Action buttons
- [ ] Tích hợp vào MonetizationDashboard

### Testing
- Backend: unit gap calc, recommendation gen, impact estimation
- Frontend: component GapAnalysisCard, RecommendationsPanel

## Dev Notes

**Prereq:** Story 13.1 hoàn tất.

**Loại Recommendations:**
1. Content Type: "Đăng nhiều Reels hơn để tăng watch time"
2. Posting Frequency: "Tăng lên 2 bài/ngày để tăng trưởng nhanh"
3. Engagement: "Dùng nhiều CTA hơn để tăng engagement"
4. Timing: "Đăng vào giờ cao điểm để reach tốt hơn"

**Gap Prioritization:**
- High: >50% gap, metric impact cao
- Medium: 20–50% gap
- Low: <20% gap (gần đạt!)

**File dự kiến:** recommendation.service.ts, gap-analysis-card.tsx, recommendations-panel.tsx.

[ASSUMPTION: Nếu thiếu dữ liệu lịch sử, gợi ý dựa best practices chung; expected impact ước lượng dựa growth rate trung bình.] 
