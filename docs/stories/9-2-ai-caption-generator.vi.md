# Story 9.2: AI tạo caption

Trạng thái: ready-for-dev

## Story

Với vai trò **Leader**, tôi muốn **AI tạo caption từ playbook templates** để **tiết kiệm thời gian viết content**.

## Acceptance Criteria

1. **Given** playbook template, **when** user yêu cầu, **then** AI tạo 3–5 biến thể với tone/style tùy chỉnh.
2. **Given** captions đã tạo, **when** user xem options, **then** hiển thị preview và cho phép edit.
3. **Given** caption variants, **when** user chọn một, **then** có thể copy hoặc áp dụng vào draft.
4. **Given** history sinh caption, **when** user xem history, **then** có thể dùng lại lần trước.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng AIAssistantService:
  - `generateCaptions(playbook, options)`
  - Hỗ trợ tone/style
  - Tạo nhiều biến thể
- [ ] Caption Templates:
  - Build prompt từ playbook
  - Gợi ý hashtag
- [ ] Generation History:
  - Lưu caption đã tạo
  - Liên kết playbook

### Frontend
- [ ] CaptionGenerator:
  - Chọn playbook
  - Chọn tone/style
  - Nút Generate
- [ ] CaptionVariants:
  - Thẻ biến thể
  - Edit inline
  - Copy/Apply

### Testing
- [ ] Unit: caption generation
- [ ] Unit: variant formatting

## Dev Notes

**Tone:** Casual, Professional, Humorous, Educational, Inspirational  
**Style:** Short & punchy, Storytelling, Question-based, List format  
**Prereq:** Story 9.1, Epic 6 xong.  

[ASSUMPTION: Nếu thiếu playbook template, fallback gợi ý tone/style chung; nếu user chưa cấu hình LLM key, trả hướng dẫn cấu hình.] 
