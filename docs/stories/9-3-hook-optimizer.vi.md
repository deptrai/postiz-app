# Story 9.3: Hook Optimizer

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **AI gợi ý hooks hiệu quả** để **content thu hút hơn**.

## Acceptance Criteria

1. **Given** có database hooks top-performing, **when** user yêu cầu gợi ý, **then** AI sinh hook variants theo niche/format.
2. **Given** hook suggestions, **when** user xem, **then** hiển thị kèm effectiveness prediction.
3. **Given** context nội dung, **when** generate hooks, **then** hooks phải liên quan chủ đề.
4. **Given** history hooks, **when** user xem analytics, **then** hiển thị hooks hiệu quả nhất.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng AIAssistantService:
  - `generateHooks(context, options)` với niche/format
  - Sinh nhiều biến thể
- [ ] Hook Performance Tracking:
  - Theo dõi hook usage
  - Liên kết performance content

### Frontend
- [ ] HookOptimizer:
  - Nhập context
  - Hiển thị variants
  - Indicator hiệu quả dự đoán
- [ ] HookAnalytics:
  - Lịch sử performance
  - Danh sách hooks tốt nhất

### Testing
- [ ] Unit: hook generation
- [ ] Unit: performance tracking

## Dev Notes

**Hook types:** Question, Statement, Action, Curiosity, Problem  
**Prereq:** Story 9.1 hoàn tất.  

[ASSUMPTION: Nếu thiếu dữ liệu hook top-performing, fallback dùng template chung theo niche/format; nếu chưa có tracking, effectiveness chỉ hiển thị predicted score.] 
