# Story 16.4: Điểm thân thiện với nhà quảng cáo

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **biết content có advertiser-friendly không** để **maximize ad revenue**.

## Acceptance Criteria

1. **Given** content, **when** user yêu cầu ad-friendly score, **then** hệ thống score và flag sensitive topics.
2. **Given** ad-friendly analysis, **when** user xem chi tiết, **then** hiển thị breakdown by category (violence, adult, controversial, v.v.).
3. **Given** flagged content, **when** user xem recommendations, **then** gợi ý adjustments để improve ad-friendliness.
4. **Given** content library, **when** user xem ad-friendly report, **then** hiển thị percentage của ad-friendly content.
5. **Given** ad-friendly trends, **when** user xem dashboard, **then** hiển thị improvement theo thời gian.

## Tasks / Subtasks

### Backend
- [ ] AdvertiserFriendlyService:
  - `scoreAdFriendliness(contentId)`, build sensitive topics database, trả score với category breakdown
- [ ] Adjustment Suggestions:
  - Map sensitive topics → safe alternatives, sinh contextual suggestions
- [ ] Ad-Friendly Report:
  - Tính percentage ad-friendly content, identify problematic content
- [ ] Ad-Friendly Trends:
  - Track scores theo thời gian, tính improvement metrics
- [ ] API:
  - GET /api/quality/ad-friendly/:contentId
  - GET /api/quality/ad-friendly/report
  - GET /api/quality/ad-friendly/trends
  - Swagger docs

### Frontend
- [ ] AdFriendlyScoreCard: Overall ad-friendly score, category breakdown, flag indicators
- [ ] SensitiveTopicsList: Danh sách detected topics, severity indicators, explanation tooltips
- [ ] AdFriendlyReport: Percentage display, content breakdown, action items
- [ ] AdFriendlyTrends: Trend chart, improvement indicators

### Testing
- [ ] Backend: unit ad-friendly scoring, sensitive topic detection, report generation
- [ ] Frontend: component AdFriendlyScoreCard, AdFriendlyReport

## Dev Notes

**Prereq:** Story 16.1 hoàn tất.

**Sensitive Topic Categories:**
| Category | Examples | Impact on Ads |
|----------|----------|---------------|
| Violence | Fighting, weapons, gore | Limited/No ads |
| Adult Content | Sexual content, nudity | No ads |
| Controversial | Politics, religion debates | Limited ads |
| Drugs/Alcohol | Drug use, excessive alcohol | Limited ads |
| Profanity | Strong language, slurs | Limited ads |
| Tragedy | Death, disasters | Limited ads |
| Misinformation | False claims, conspiracy | No ads |

**Ad-Friendly Score Interpretation:**
- 90–100: Fully ad-friendly, all advertisers
- 70–89: Mostly ad-friendly, some restrictions
- 50–69: Limited ad-friendly, many restrictions
- 0–49: Not ad-friendly, minimal/no ads

[ASSUMPTION: MVP dùng keyword-based detection; Phase 2 sẽ thêm NLP/ML cho context-aware detection; nếu không detect sensitive topics, trả score 100 (fully ad-friendly).]

**File dự kiến:** advertiser-friendly.service.ts, ad-friendly-score-card.tsx, sensitive-topics-list.tsx, ad-friendly-report.tsx, ad-friendly-trends.tsx.
