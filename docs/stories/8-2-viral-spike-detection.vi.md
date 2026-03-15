# Story 8.2: Phát hiện viral spike

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **phát hiện nội dung đang viral** để **tận dụng momentum**.

## Acceptance Criteria

1. **Given** metrics real-time hoặc daily, **when** engagement spike >200% trong 24h, **then** hệ thống highlight viral content.
2. **Given** viral content detected, **when** user xem alert, **then** hiển thị spike metrics và so sánh.
3. **Given** viral content, **when** user xem recommendations, **then** gợi ý follow-up content ideas.
4. **Given** viral history, **when** user xem dashboard, **then** hiển thị các viral cũ và pattern.

## Tasks / Subtasks

### Backend
- [ ] Mở rộng AlertService cho spike detection:
  - `detectViralSpikes(orgId)`, ngưỡng spike, theo dõi duration
- [ ] Follow-up Recommendations:
  - Phân tích pattern của viral content
  - Sinh gợi ý nội dung tiếp theo
- [ ] Viral History:
  - Lưu sự kiện viral
  - Theo dõi pattern theo thời gian

### Frontend
- [ ] ViralSpikeCard:
  - Indicator spike (animation)
  - So sánh metrics
- [ ] ViralRecommendations:
  - Ý tưởng follow-up
  - Nút hành động nhanh
- [ ] ViralHistory:
  - Timeline các nội dung viral
  - Insight về pattern

### Testing
- [ ] Unit: spike detection logic
- [ ] Unit: recommendation generation

## Dev Notes

**Ngưỡng spike (mặc định):**
- Engagement: >200% trong 24h
- Reach: >300% trong 24h
- Views: >250% trong 24h

**Prereq:** Story 8.1 hoàn tất.

[ASSUMPTION: Nếu thiếu metric views hoặc real-time, fallback dùng daily; nếu không có kỳ trước để so sánh, không bắn spike.] 
