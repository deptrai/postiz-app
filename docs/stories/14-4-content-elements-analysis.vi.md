# Story 14.4: Phân tích yếu tố nội dung

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **phân tích elements của viral content** để **có thể replicate success**.

## Acceptance Criteria

1. **Given** top-performing content, **when** user yêu cầu elements analysis, **then** hệ thống breakdown: caption style, hashtags, format, CTA.
2. **Given** caption analysis, **when** user xem chi tiết, **then** hiển thị: length, tone, keywords, emoji usage.
3. **Given** hashtag analysis, **when** user xem chi tiết, **then** hiển thị: count, trending status, relevance score.
4. **Given** format analysis, **when** user xem chi tiết, **then** hiển thị: Reels vs Post performance, video length impact.
5. **Given** CTA analysis, **when** user xem chi tiết, **then** hiển thị: CTA types used, effectiveness by type.

## Tasks / Subtasks

### Backend
- [ ] ContentElementsService:
  - `analyzeContentElements(contentId)`, aggregate analysis từ sub-analyzers
- [ ] Caption Analyzer:
  - Phân tích caption length, detect tone (casual, professional, v.v.), extract keywords, đếm emoji usage
- [ ] Hashtag Analyzer:
  - Đếm hashtags, check trending status, tính relevance score
- [ ] Format Analyzer:
  - Phân loại theo format, phân tích video length impact, so sánh performance by format
- [ ] CTA Analyzer:
  - Detect CTA types, tính effectiveness per type
- [ ] API:
  - GET /api/viral/elements/:contentId
  - GET /api/viral/elements/patterns
  - Swagger docs

### Frontend
- [ ] ContentElementsCard:
  - Overview tất cả elements, expandable sections
- [ ] CaptionAnalysis:
  - Length indicator, tone badge, keyword highlights
- [ ] HashtagAnalysis:
  - Hashtag list với scores, trending indicators
- [ ] FormatAnalysis:
  - Format comparison chart, video length insights
- [ ] CTAAnalysis:
  - CTA type breakdown, effectiveness chart

### Testing
- [ ] Backend: unit caption analysis, hashtag analysis, format analysis, CTA detection
- [ ] Frontend: component ContentElementsCard, sub-components

## Dev Notes

**Prereq:** Story 14.1 hoàn tất; có content metadata.

**Caption Analysis Factors:**
- Length: Short (<50 chars), Medium (50–150), Long (>150)
- Tone: Casual, Professional, Humorous, Educational
- Keywords: Top keywords từ viral content
- Emoji: Count và placement

**Hashtag Analysis:**
- Count: Optimal range (5–15 cho Facebook)
- Trending: Check với trending hashtags
- Relevance: Match với content topic

**CTA Types:**
1. Engagement CTA: "Comment below", "Share your thoughts"
2. Action CTA: "Click link", "Follow for more"
3. Save CTA: "Save for later"
4. Share CTA: "Tag a friend"

**Format Insights:**
- Reels: Higher reach, shorter attention span
- Posts: Better cho detailed content, longer engagement

[ASSUMPTION: Nếu thiếu tone detection, ước lượng dựa keywords; CTA detection dựa pattern matching trong caption.]

**File dự kiến:** content-elements.service.ts, content-elements-card.tsx, caption-analysis.tsx, hashtag-analysis.tsx.
