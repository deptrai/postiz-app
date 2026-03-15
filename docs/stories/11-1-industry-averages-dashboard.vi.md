# Story 11.1: Dashboard so sánh trung bình ngành

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **so sánh metrics với trung bình ngành** để **biết mình đang ở đâu**.

## Acceptance Criteria

1. **Given** có benchmark data ngành, **when** user xem dashboard, **then** hiển thị so sánh với averages theo niche.
2. **Given** metrics của mình, **when** so với benchmarks, **then** hiển thị indicator above/below average.
3. **Given** benchmark data, **when** user chọn niche, **then** hiển thị benchmarks liên quan niche đó.
4. **Given** tùy chọn nhập thủ công, **when** user nhập data đối thủ, **then** lưu và dùng để so sánh.

## Tasks / Subtasks

### Backend
- [ ] BenchmarkService:
  - `getBenchmarks(niche)`, tính comparison metrics, trả above/below indicators
- [ ] Industry Data:
  - Seed averages theo niche
  - Hỗ trợ nhiều niches
- [ ] Manual Input:
  - Lưu data đối thủ do user nhập
  - Đưa vào so sánh

### Frontend
- [ ] BenchmarkDashboard:
  - Charts so sánh
  - Above/below indicators
- [ ] NicheSelector:
  - Dropdown niche
  - Auto-update benchmarks
- [ ] ManualInput:
  - Form nhập data đối thủ
  - Save

### Testing
- [ ] Unit: tính comparison
- [ ] Unit: lấy benchmark

## Dev Notes

**Industry Averages (ví dụ):**
- Engagement Rate: 3–6% (tùy niche)
- Reach Rate: 10–20%
- Video Completion: 40–60%

**Niches:** Lifestyle, Business, Entertainment, Education, v.v.

[ASSUMPTION: Industry averages là dữ liệu seed, không scrape từ đối thủ; nếu thiếu niche, hiển thị "chưa có benchmark".] 
