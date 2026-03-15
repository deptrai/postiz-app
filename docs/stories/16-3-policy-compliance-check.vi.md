# Story 16.3: Kiểm tra tuân thủ chính sách

Trạng thái: done

## Story

Với vai trò **Leader**, tôi muốn **check policy compliance trước khi đăng** để **không mất monetization eligibility**.

## Acceptance Criteria

1. **Given** content draft, **when** user yêu cầu compliance check, **then** hệ thống flag potential violations và suggest fixes.
2. **Given** kết quả compliance check, **when** violations detected, **then** giải thích policy nào bị vi phạm và severity.
3. **Given** Partner Monetization Policies, **when** checking content, **then** verify với tất cả relevant policy rules.
4. **Given** Content Monetization Policies, **when** checking content, **then** verify với content-specific rules.
5. **Given** compliance history, **when** user xem report, **then** hiển thị compliance score trends và past violations.

## Tasks / Subtasks

### Backend
- [ ] PolicyComplianceService:
  - `checkCompliance(contentDraft)`, build policy rules database, trả violations với explanations
- [ ] Partner Monetization Rules:
  - Original content check, payment terms compliance, account authenticity
- [ ] Content Monetization Rules:
  - Clickbait prohibition, misleading information check, engagement solicitation rules
- [ ] Compliance History:
  - Track compliance scores theo thời gian, lưu violation history
- [ ] API:
  - POST /api/quality/compliance/check
  - GET /api/quality/compliance/history
  - GET /api/quality/compliance/policies
  - Swagger docs

### Frontend
- [ ] ComplianceCheckCard: Compliance score display, violation list với severity, fix suggestions
- [ ] PolicyViolationDetail: Policy name và description, specific violation explanation, how to fix
- [ ] ComplianceHistory: Trend chart, past violations list, improvement tracking
- [ ] Tích hợp vào content creation flow: Pre-publish compliance check, warning modal trước khi đăng

### Testing
- [ ] Backend: unit policy rule checking, violation detection, history tracking
- [ ] Frontend: component ComplianceCheckCard, PolicyViolationDetail

## Dev Notes

**Prereq:** Story 16.1, 16.2 hoàn tất.

**Policy Categories:**

**Partner Monetization Policies:**
1. Original content creation
2. Proper payment terms
3. Account authenticity
4. Community standards compliance

**Content Monetization Policies:**
1. No clickbait
2. No engagement solicitation
3. No misleading medical information
4. No controversial/sensitive topics
5. Advertiser-friendly content

**Violation Severity:**
- Critical: Immediate monetization risk
- High: May affect monetization
- Medium: Best practice violation
- Low: Recommendation only

[ASSUMPTION: MVP dùng rule-based checking; một số policies cần manual review và không thể fully automated; nếu không detect violation, trả compliance score 100 (clean).]

**File dự kiến:** policy-compliance.service.ts, compliance-check-card.tsx, policy-violation-detail.tsx, compliance-history.tsx.
