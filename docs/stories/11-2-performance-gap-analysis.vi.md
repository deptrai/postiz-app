# Story 11.2: Phân tích khoảng cách hiệu suất

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **phân tích gap với benchmarks** để **biết cần cải thiện gì**.

## Acceptance Criteria

1. **Given** metrics của mình và benchmarks, **when** user yêu cầu gap analysis, **then** hệ thống highlight gaps và gợi ý cải thiện.
2. **Given** gap analysis, **when** user xem chi tiết, **then** hiển thị metrics cụ thể và khoảng cách so benchmark.
3. **Given** gợi ý cải thiện, **when** user xem recommendations, **then** hiển thị bước hành động để thu hẹp gap.
4. **Given** gap trends, **when** user xem history, **then** hiển thị gap đang thu hẹp hay mở rộng.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng BenchmarkService:
  - `getGapAnalysis(orgId)`, tính gap per metric, ưu tiên theo impact
- [ ] Improvement Suggestions:
  - Map gaps → recommendations hành động
  - Ưu tiên theo effort/impact
- [ ] Gap Trends:
  - Theo dõi gaps theo thời gian
  - Tính hướng trend

### Frontend
- [ ] GapAnalysis:
  - Visualization gap
  - Breakdown metrics
- [ ] ImprovementPlan:
  - Recommendations hành động
  - Priority indicators
- [ ] GapTrends:
  - Trend chart
  - Direction indicators

### Testing
- [ ] Unit: tính gap
- [ ] Unit: trend analysis

## Dev Notes

**Prereq:** Story 11.1 hoàn tất.

[ASSUMPTION: Nếu không có benchmark cho metric, bỏ qua metric đó trong gap analysis; gợi ý cải thiện dựa trên best practices chung nếu thiếu data cụ thể.] 
