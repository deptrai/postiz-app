# Story 6.1: Generate Playbooks from Top Content

Status: ready-for-dev

## Story

As a **Leader**,
I want **to generate Playbooks (winning formulas) from top-performing content**,
So that **I can replicate successful content patterns to increase views and engagement**.

## Acceptance Criteria

1. **Given** analytics data from the last 14–30 days,
   **When** the system runs the playbook generator,
   **Then** playbooks are created grouped by group/niche/pillar/format.

2. **Given** a generated playbook,
   **When** the user views the playbook,
   **Then** it displays a clear recipe with:
   - Format recommendation (post/reel)
   - Caption bucket (hook patterns, CTA patterns)
   - Hashtag bucket (top-performing hashtags)
   - Time bucket (best posting times)
   - Evidence metrics (median reach/views, engagement rate, consistency score)

3. **Given** multiple top-performing content items,
   **When** the system analyzes patterns,
   **Then** it identifies common elements that contribute to success.

4. **Given** a playbook,
   **When** the user views evidence,
   **Then** the system shows source content items that contributed to the playbook.

5. **Given** playbooks exist,
   **When** the user accesses the Playbooks page,
   **Then** playbooks are listed with key metrics and can be filtered by group/niche.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create Playbook Prisma schema (AC: #1, #2)
  - [ ] Define Playbook model with fields: id, name, groupId, format, recipe (JSON), evidence (JSON), consistencyScore, createdAt, updatedAt
  - [ ] Define PlaybookSourceContent relation to track source content items
  - [ ] Run migration

- [ ] Create PlaybookGeneratorService (AC: #1, #3)
  - [ ] Implement `generatePlaybooks(organizationId, options)` method
  - [ ] Query top content from last 14-30 days using AnalyticsContent and AnalyticsDailyMetric
  - [ ] Group content by format, group/niche
  - [ ] Extract common patterns from captions (hook patterns, CTA patterns)
  - [ ] Extract top hashtags from successful content
  - [ ] Calculate optimal posting times from successful content
  - [ ] Calculate consistency score (not based on single lucky post)

- [ ] Create PlaybookService (AC: #2, #4, #5)
  - [ ] Implement `getPlaybooks(organizationId, filters)` method
  - [ ] Implement `getPlaybookById(id)` with source content
  - [ ] Implement `getPlaybookEvidence(playbookId)` to show source content

- [ ] Add Playbook API endpoints (AC: #5)
  - [ ] POST /api/playbooks/generate - Trigger playbook generation
  - [ ] GET /api/playbooks - List playbooks with filters
  - [ ] GET /api/playbooks/:id - Get playbook details with evidence
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create Playbooks page (AC: #5)
  - [ ] Add route /playbooks
  - [ ] Create PlaybooksListPage component
  - [ ] Display playbooks in card grid with key metrics
  - [ ] Add filters for group/niche/format

- [ ] Create Playbook detail view (AC: #2, #4)
  - [ ] Create PlaybookDetailPage component
  - [ ] Display recipe sections (format, caption, hashtags, time)
  - [ ] Display evidence metrics with charts
  - [ ] Show source content items that contributed

- [ ] Create Generate Playbooks action (AC: #1)
  - [ ] Add "Generate Playbooks" button
  - [ ] Show loading state during generation
  - [ ] Display success/error feedback

### Testing

- [ ] Backend tests
  - [ ] Unit test: PlaybookGeneratorService pattern extraction
  - [ ] Unit test: Consistency score calculation
  - [ ] Unit test: API endpoints
  - [ ] Integration test: End-to-end playbook generation

- [ ] Frontend tests
  - [ ] Component test: PlaybooksListPage
  - [ ] Component test: PlaybookDetailPage
  - [ ] Test filter functionality

## Dev Notes

**Prerequisites:**
- Epic 2-4 MVP complete (content ingestion, daily metrics, trending topics, best time)
- AnalyticsContent and AnalyticsDailyMetric tables populated with data

**Technical Stack:**
- Backend: NestJS, Prisma ORM
- Frontend: React, TypeScript
- Pattern extraction: Rule-based initially (can evolve to ML later)

### Pattern Extraction Strategy

**Caption Analysis:**
- Extract first sentence as "hook" pattern
- Identify CTA patterns (questions, calls to action)
- Group similar hooks using simple text similarity

**Hashtag Analysis:**
- Count hashtag frequency in top content
- Calculate engagement correlation per hashtag
- Create hashtag buckets by performance tier

**Time Analysis:**
- Use existing BestTimeService data
- Cross-reference with top content posting times

**Consistency Score:**
- Minimum 3 content items required for playbook
- Score = (items above median) / (total items) * 100
- Penalize playbooks based on single outlier

### Project Structure Notes

**Backend files:**
- `libraries/nestjs-libraries/src/database/prisma/playbooks/playbook.service.ts`
- `libraries/nestjs-libraries/src/database/prisma/playbooks/playbook-generator.service.ts`
- `apps/backend/src/api/routes/playbooks.controller.ts`

**Frontend files:**
- `apps/frontend/src/app/(site)/playbooks/page.tsx`
- `apps/frontend/src/components/playbooks/playbooks-list.page.tsx`
- `apps/frontend/src/components/playbooks/playbook-detail.page.tsx`

### References

- [Source: docs/PRD.md#FR-017] - Playbook generation requirements
- [Source: docs/epics.md#Epic-6] - Epic 6 story breakdown
- [Source: docs/stories/5-1-export-csv-report.md#Dev-Agent-Record] - Previous story patterns

### Learnings from Previous Story

**From Story 5-1-export-csv-report (Status: done)**

- **Pattern Established**: Analytics services follow pattern in `libraries/nestjs-libraries/src/database/prisma/analytics/`
- **Batch Query Pattern**: Use batch queries with `IN (...)` to avoid N+1 problems
- **Frontend Modal Pattern**: Use backdrop click and ESC key for modal UX
- **API Pattern**: Use Swagger decorators for documentation
- **Testing Pattern**: Create `.spec.ts` files alongside service files

[Source: docs/stories/5-1-export-csv-report.md#Dev-Agent-Record]

## Dev Agent Record

### Context Reference

- `docs/stories/6-1-generate-playbooks-from-top-content.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 6.1 drafted by SM agent
