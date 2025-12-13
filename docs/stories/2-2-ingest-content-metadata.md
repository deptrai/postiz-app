# Story 2.2: Ingest content metadata (caption/hashtags/format/publish time)

Status: ready-for-dev

## Story

As a Leader,
I want the system to ingest post/reel metadata from tracked pages,
so that tagging and format-based analytics can be computed reliably.

## Acceptance Criteria

1. Given a list of tracked pages, when the ingestion job runs, then content metadata is stored and correctly linked to the organization and integration/page.
2. And content format is distinguished at least as reels vs post (by type/enum).
3. And ingestion of metadata is idempotent (no duplicates) by key org+integration+externalContentId.
4. And if one integration fails ingestion:
   - transient failures retry per policy
   - permanent failures (token invalid/permission) are recorded and do not retry indefinitely

## Tasks / Subtasks

- [ ] Define metadata fields to persist (AC: #1, #2)
  - [ ] externalContentId
  - [ ] format/type (REELS/POST)
  - [ ] caption
  - [ ] hashtags
  - [ ] publishedAt

- [ ] Implement ingestion pipeline step for metadata (AC: #1, #2)
  - [ ] Use existing workers/cron BullMQ patterns to enqueue per org+integration.
  - [ ] Store metadata into dedicated analytics tables (preferred) or mapped existing domain (if decided).

- [ ] Idempotent upsert (AC: #3)
  - [ ] Add unique constraint and upsert logic based on orgId+integrationId+externalContentId.

- [ ] Error handling + retries (AC: #4)
  - [ ] Apply retry/backoff for transient failures.
  - [ ] Detect permanent failures and stop retry; surface state for later investigation.

- [ ] Tests (AC: #1–#4)
  - [ ] Unit/integration test: upsert does not create duplicates.

## Dev Notes

- This story consumes the BullMQ/cron scaffold from Story 1.3.
- Keep the job payload explicit: organizationId, integrationId, date/lookback.

### Project Structure Notes

- Queue scheduling/enqueue pattern lives in `apps/cron/src/tasks/*`.
- Worker processing pattern lives in `apps/workers` using BullMqServer.

### References

- [Source: docs/epics.md#Story-2.2-Ingest-metadata-nội-dung-(caption,-hashtags,-format,-publish-time)]
- [Source: docs/tech-spec.md#6)-Jobs-&-Scheduling-(MVP)]
- [Source: docs/tech-spec.md#4.3-Content-metadata-(optional-table)]
- [Source: apps/cron/src/tasks/check.missing.queues.ts]

## Dev Agent Record

### Context Reference

- `docs/stories/2-2-ingest-content-metadata.context.xml`

### Agent Model Used

Cascade

### Debug Log References

### Completion Notes List

### File List

## Senior Developer Review (AI)

### Summary

Story 2.2 correctly leverages the BullMQ job infrastructure from Story 1.3. The story aligns with Postiz patterns for scheduled ingestion and idempotent storage.

### Findings

- **Facebook provider exists**: `libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts` provides Facebook Graph API integration with error handling (`handleErrors()` method classifies token vs content errors).
- **Job scheduling pattern**: Story correctly references cron→emit→workers pattern established in 1.3.
- **Idempotency**: Prisma supports unique constraints and upsert operations (`upsert()` method on models).
- **Error classification**: Facebook provider already has `handleErrors()` that returns `{ type: 'refresh-token' | 'bad-body', value: string }` - perfect for classifying permanent (token) vs transient (bad-body/network) errors.
- **[ASSUMPTION: Content metadata table]**: Should create dedicated `AnalyticsContent` table in Prisma schema with fields: `{ id, organizationId, integrationId, externalContentId, format, caption, hashtags, publishedAt, createdAt, updatedAt }` with unique constraint on `(organizationId, integrationId, externalContentId)`.

### Action Items

- [ ] **Add Prisma model** (in Story 1.2 schema work): `AnalyticsContent` table with:
  - [ ] Fields: `organizationId`, `integrationId`, `externalContentId`, `format` (enum: REELS|POST), `caption`, `hashtags` (array or JSON), `publishedAt`
  - [ ] Unique constraint: `@@unique([organizationId, integrationId, externalContentId])`
- [ ] **Implement ingestion worker** (in `apps/workers/src/app/analytics.controller.ts` from Story 1.3):
  - [ ] `@EventPattern('analytics-ingest-metadata', Transport.REDIS)`
  - [ ] Fetch Facebook Graph API for content metadata (posts/reels) using `FacebookProvider` or direct Graph API calls
  - [ ] Use Prisma `upsert()` with `where: { org_integration_externalId: { organizationId, integrationId, externalContentId } }` for idempotency
- [ ] **Error handling in worker**:
  - [ ] Call Facebook provider's error patterns or implement similar logic
  - [ ] If error type is `'refresh-token'` → log permanent failure, update integration status, do NOT retry
  - [ ] If error type is transient (network/5xx) → throw error to trigger BullMQ retry
- [ ] **Cron task** (in `apps/cron/src/tasks/analytics.ingestion.task.ts`):
  - [ ] Fetch tracked integrations from Story 2.1 tracking service
  - [ ] Emit `'analytics-ingest-metadata'` job per integration with payload: `{ organizationId, integrationId, date }`
- [ ] **Facebook Graph API endpoints to use**:
  - [ ] `GET /{page-id}/posts` and `GET /{page-id}/videos` (or unified feed endpoint)
  - [ ] Extract: `id` (externalContentId), `message` (caption), `created_time` (publishedAt), detect format from response structure

### Evidence (Code Pointers)

- `libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts` (Facebook integration with error handling at lines 33-150)
- `apps/cron/src/tasks/check.missing.queues.ts` (cron emit pattern)
- `apps/workers/src/app/posts.controller.ts` (worker @EventPattern pattern with try-catch)
- Story 1.3 review section (BullMQ job architecture)
- Prisma schema location: `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

