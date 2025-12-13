# Story 2.3: Ingest daily metrics (reach/views/engagement)

Status: ready-for-dev

## Story

As a Leader,
I want the system to ingest core metrics per post/reel per day,
so that dashboard, trends, and recommendations have reliable time-series data.

## Acceptance Criteria

1. Given metadata has been ingested, when the ingestion job fetches metrics, then metrics are stored in a daily time-series table keyed by date.
2. And ingestion is idempotent (no duplicate record) by key org+integration+externalContentId+date.
3. And missing metric fields are stored as null/default without failing the entire job.
4. And if one integration fails, the overall org ingestion does not fail; other integrations continue.

## Tasks / Subtasks

- [ ] Define metric fields (AC: #1)
  - [ ] reach/impressions (if available)
  - [ ] views (if available)
  - [ ] reactions/comments/shares
  - [ ] clicks (optional)

- [ ] Implement daily metrics ingestion job step (AC: #1)
  - [ ] For each tracked integration, fetch metrics for target date.
  - [ ] Persist results to analytics daily metrics table.

- [ ] Idempotency via unique constraint + upsert (AC: #2)
  - [ ] Unique(orgId, integrationId, externalContentId, date)

- [ ] Robustness for partial data (AC: #3, #4)
  - [ ] Handle nulls for absent metrics.
  - [ ] Ensure per-integration failures do not abort processing other integrations.

- [ ] Tests (AC: #1–#4)
  - [ ] Integration test: upsert idempotency (same payload twice results in one record).

## Dev Notes

- This story depends on Story 2.2 (metadata) and uses job infrastructure from Story 1.3.
- This story is the primary source for later KPI computations (engagement, engagement rate).

### References

- [Source: docs/epics.md#Story-2.3-Ingest-metrics-cơ-bản-theo-ngày-(reach/views/engagement)]
- [Source: docs/PRD.md#Functional-Requirements]
- [Source: docs/tech-spec.md#4.4-Daily-metrics-time-series]
- [Source: docs/tech-spec.md#6.2-Idempotency]

## Dev Agent Record

### Context Reference

- `docs/stories/2-3-ingest-daily-metrics.context.xml`

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

### Summary

Story 2.3 builds on Story 2.2 (metadata) and follows the same BullMQ ingestion patterns. The story correctly emphasizes idempotent time-series storage and per-integration failure isolation.

### Findings

- **Time-series pattern**: Daily metrics keyed by date is standard practice; Prisma unique constraint on `(organizationId, integrationId, externalContentId, date)` ensures idempotency.
- **Partial data handling**: Prisma allows nullable fields; missing metrics can be stored as `null` without failing the transaction.
- **Per-integration isolation**: Job scheduling (from Story 1.3/2.2) should emit separate jobs per integration, so one failure doesn't block others.
- **Facebook Insights API**: Facebook provides metrics via Graph API Insights endpoints (e.g., `/page-id/insights` or per-post insights `/post-id/insights`).
- **[ASSUMPTION: Daily metrics table]**: Should create `AnalyticsDailyMetrics` table in Prisma schema with fields: `{ id, organizationId, integrationId, externalContentId, date, reach, views, reactions, comments, shares, clicks?, createdAt, updatedAt }` with unique constraint on `(organizationId, integrationId, externalContentId, date)`.

### Action Items

- [ ] **Add Prisma model** (in Story 1.2 schema work): `AnalyticsDailyMetrics` table with:
  - [ ] Fields: `organizationId`, `integrationId`, `externalContentId`, `date` (DateTime or Date type), `reach` (nullable Int), `views` (nullable Int), `reactions` (nullable Int), `comments` (nullable Int), `shares` (nullable Int), `clicks` (nullable Int)
  - [ ] Unique constraint: `@@unique([organizationId, integrationId, externalContentId, date])`
- [ ] **Implement metrics ingestion worker** (extend `apps/workers/src/app/analytics.controller.ts` from Story 1.3):
  - [ ] `@EventPattern('analytics-ingest-metrics', Transport.REDIS)`
  - [ ] Fetch Facebook Graph API Insights for daily metrics (posts/videos insights)
  - [ ] Use Prisma `upsert()` with unique constraint for idempotency
  - [ ] Handle nullable metrics: if API doesn't return a field, store as `null` (don't throw error)
- [ ] **Error handling in worker**:
  - [ ] Wrap per-integration processing in try-catch so one integration failure doesn't stop others
  - [ ] Use Facebook provider error classification pattern (permanent vs transient)
  - [ ] Log structured errors with `organizationId`, `integrationId`, `date`, `errorType`
- [ ] **Cron task** (extend `apps/cron/src/tasks/analytics.ingestion.task.ts` from Story 2.2):
  - [ ] After metadata ingestion, emit `'analytics-ingest-metrics'` jobs
  - [ ] Or combine metadata + metrics in single job (decide based on API rate limits and payload size)
  - [ ] Emit separate job per integration to ensure isolation
- [ ] **Facebook Graph API endpoints**:
  - [ ] Page-level insights: `GET /{page-id}/insights?metric=page_impressions,page_post_engagements&period=day`
  - [ ] Post-level insights: `GET /{post-id}/insights?metric=post_impressions,post_engaged_users,post_reactions_by_type_total`
  - [ ] Map API response to Prisma model fields (reach→impressions, views→video_views, etc.)

### Evidence (Code Pointers)

- `libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts` (Facebook integration patterns)
- `apps/cron/src/tasks/post.now.pending.queues.ts` (per-item job emission pattern at lines 12-41)
- `apps/workers/src/app/posts.controller.ts` (worker try-catch pattern for resilience)
- Story 1.3 and 2.2 review sections (BullMQ job architecture and metadata ingestion patterns)
- Prisma schema location: `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

