# Story 16.3: Policy Compliance Check

Status: ready-for-dev

## Story

As a **Leader**,
I want **check policy compliance trước khi đăng**,
So that **tôi không mất monetization eligibility**.

## Acceptance Criteria

1. **Given** content draft,
   **When** user request compliance check,
   **Then** hệ thống flag potential violations và suggest fixes.

2. **Given** compliance check results,
   **When** violations detected,
   **Then** explain which policy violated và severity.

3. **Given** Partner Monetization Policies,
   **When** checking content,
   **Then** verify against all relevant policy rules.

4. **Given** Content Monetization Policies,
   **When** checking content,
   **Then** verify against content-specific rules.

5. **Given** compliance history,
   **When** user xem report,
   **Then** show compliance score trends và past violations.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create PolicyComplianceService (AC: #1, #2)
  - [ ] Implement `checkCompliance(contentDraft)` method
  - [ ] Build policy rules database
  - [ ] Return violations with explanations

- [ ] Implement Partner Monetization Rules (AC: #3)
  - [ ] Original content check
  - [ ] Payment terms compliance
  - [ ] Account authenticity

- [ ] Implement Content Monetization Rules (AC: #4)
  - [ ] Clickbait prohibition
  - [ ] Misleading information check
  - [ ] Engagement solicitation rules

- [ ] Add Compliance History (AC: #5)
  - [ ] Track compliance scores over time
  - [ ] Store violation history

- [ ] Add Policy Compliance API endpoints
  - [ ] POST /api/quality/compliance/check - Check content compliance
  - [ ] GET /api/quality/compliance/history - Get compliance history
  - [ ] GET /api/quality/compliance/policies - Get policy rules
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create ComplianceCheckCard component (AC: #1, #2)
  - [ ] Compliance score display
  - [ ] Violation list with severity
  - [ ] Fix suggestions

- [ ] Create PolicyViolationDetail component (AC: #3, #4)
  - [ ] Policy name and description
  - [ ] Specific violation explanation
  - [ ] How to fix

- [ ] Create ComplianceHistory component (AC: #5)
  - [ ] Trend chart
  - [ ] Past violations list
  - [ ] Improvement tracking

- [ ] Integrate into content creation flow
  - [ ] Pre-publish compliance check
  - [ ] Warning modal before posting

### Testing

- [ ] Backend tests
  - [ ] Unit test: Policy rule checking
  - [ ] Unit test: Violation detection
  - [ ] Unit test: History tracking

- [ ] Frontend tests
  - [ ] Component test: ComplianceCheckCard
  - [ ] Component test: PolicyViolationDetail

## Dev Notes

**Prerequisites:**
- Story 16.1 complete (Quality Score Dashboard)
- Story 16.2 complete (Engagement Bait Detection)

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
- **Critical:** Immediate monetization risk
- **High:** May affect monetization
- **Medium:** Best practice violation
- **Low:** Recommendation only

**[ASSUMPTION]:** MVP uses rule-based checking. Some policies require manual review and cannot be fully automated.

### Project Structure Notes

**New Files:**
- `libraries/nestjs-libraries/src/database/prisma/quality/policy-compliance.service.ts`
- `apps/frontend/src/components/quality/compliance-check-card.tsx`
- `apps/frontend/src/components/quality/policy-violation-detail.tsx`
- `apps/frontend/src/components/quality/compliance-history.tsx`

### References

- [Source: docs/epics.md#Story-16.3]
- [Source: docs/stories/16-1-quality-score-dashboard.md]
- [Source: Facebook Partner Monetization Policies]
- [Source: Facebook Content Monetization Policies]

## Dev Agent Record

### Context Reference

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 16.3 drafted by Mary (Business Analyst)
