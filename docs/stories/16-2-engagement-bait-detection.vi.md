# Story 16.2: Phát hiện Engagement Bait

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **phát hiện engagement bait** để **tránh bị Facebook phạt**.

## Acceptance Criteria

1. **Given** content caption, **when** hệ thống analyze, **then** flag clickbait patterns ("LIKE this!", "SHARE now!").
2. **Given** detected bait patterns, **when** user xem chi tiết, **then** highlight specific phrases và giải thích tại sao problematic.
3. **Given** kết quả bait detection, **when** user xem suggestions, **then** gợi ý authentic alternatives.
4. **Given** content draft, **when** user yêu cầu pre-publish check, **then** scan bait patterns trước khi đăng.
5. **Given** historical content, **when** user xem bait report, **then** hiển thị bait score trends và flagged content.

## Tasks / Subtasks

### Backend
- [ ] EngagementBaitService:
  - `detectEngagementBait(caption)`, build bait patterns database, trả detected patterns với explanations
- [ ] Authentic Alternatives:
  - Map bait patterns → authentic alternatives, sinh contextual suggestions
- [ ] Pre-Publish Check:
  - `checkBeforePublish(contentDraft)`, trả warnings và suggestions
- [ ] Bait Report:
  - `getBaitReport(orgId)`, track bait scores theo thời gian
- [ ] API:
  - POST /api/quality/bait/detect
  - POST /api/quality/bait/check
  - GET /api/quality/bait/report
  - Swagger docs

### Frontend
- [ ] BaitDetectionCard: Bait score display, highlighted problematic phrases, explanation tooltips
- [ ] AuthenticAlternatives: Danh sách suggestions, copy to clipboard button, apply suggestion button
- [ ] PrePublishChecker: Real-time bait detection, warning indicators, inline suggestions
- [ ] BaitReport: Trend chart, flagged content list

### Testing
- [ ] Backend: unit bait pattern detection, alternative generation, pre-publish check
- [ ] Frontend: component BaitDetectionCard, PrePublishChecker

## Dev Notes

**Prereq:** Story 16.1 hoàn tất.

**Bait Patterns Database (MVP - Rule-based):**
| Pattern Type | Examples | Severity |
|--------------|----------|----------|
| Like Bait | "LIKE this!", "Hit that like button!" | High |
| Share Bait | "SHARE now!", "Share with friends!" | High |
| Comment Bait | "Comment YES if you agree!" | Medium |
| Tag Bait | "Tag 3 friends!" | Medium |
| Vote Bait | "Like for A, Comment for B" | High |
| Reaction Bait | "React with ❤️ if..." | Medium |

**Authentic Alternatives:**
| Bait Pattern | Authentic Alternative |
|--------------|----------------------|
| "LIKE this post!" | "What do you think about this?" |
| "SHARE with friends!" | "Know someone who'd find this helpful?" |
| "Comment YES!" | "Share your experience in the comments" |
| "Tag 3 friends!" | "Who comes to mind when you see this?" |

[ASSUMPTION: MVP dùng rule-based keyword detection; Phase 2 sẽ thêm NLP cho detection phức tạp hơn; nếu không detect bait, trả score 0 (clean).]

**File dự kiến:** engagement-bait.service.ts, bait-detection-card.tsx, authentic-alternatives.tsx, pre-publish-checker.tsx, bait-report.tsx.
