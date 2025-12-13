# Story 1.2: Analytics schema foundation (Prisma)

Status: ready-for-dev

## Story

As a Leader,
I want foundational Prisma schema for analytics groups/tags/time-series metrics,
so that the system can ingest and analyze data over time without breaking existing Postiz tables.

## Acceptance Criteria

1. Given the existing Postiz Prisma schema, when adding the minimum analytics-intelligence tables/models, then schema migration/push succeeds and does not break existing tables.
2. And basic indexes exist for querying by organization/integration/date.

## Tasks / Subtasks

- [ ] Confirm data-model approach for MVP content storage (AC: #1)
  - [ ] Confirm whether MVP uses a dedicated analytics content table (recommended) vs reusing Postiz posts, and document decision for subsequent stories.

- [ ] Implement minimal Prisma schema changes (AC: #1)
  - [ ] Add models for:
    - [ ] page groups / niches
    - [ ] tags (AUTO/MANUAL)
    - [ ] daily metrics time-series
    - [ ] join table for content ↔ tag mapping
  - [ ] Ensure all models are org-scoped and do not cross org boundaries.

- [ ] Add constraints and indexes (AC: #2)
  - [ ] Add unique constraints for idempotency keys (org + integration + externalContentId + date) on daily metrics.
  - [ ] Add indexes for common queries (org/date, org/integration/date).

- [ ] Apply migration/push safely (AC: #1)
  - [ ] Run schema generation step per repo convention.
  - [ ] Apply migration/push in a way consistent with Postiz dev workflow.

- [ ] Tests (AC: #1, #2)
  - [ ] Add a minimal test that Prisma client can initialize and query new tables (smoke / integration).

## Dev Notes

- This story must keep changes **additive** to avoid breaking existing Postiz functionality.
- Prefer defining idempotency via unique constraints early; later ingestion jobs will rely on these keys.

### Project Structure Notes

- Prisma schema location is centralized in the repo:
  - `libraries/nestjs-libraries/src/database/prisma/schema.prisma`

### References

- [Source: docs/epics.md#Story-1.2-Thiết-kế-schema-nền-(Prisma)-cho-PageGroup/Niche,-Tags,-Metrics-time-series]
- [Source: docs/architecture.md#Database]
- [Source: docs/architecture.md#Data-Architecture]
- [Source: docs/tech-spec.md#4)-Data-Model-(MVP)]

## Dev Agent Record

### Context Reference

- `docs/stories/1-2-analytics-schema-foundation.context.xml`

### Agent Model Used

Cascade

### Debug Log References
 
### Completion Notes List
 
### File List

## Senior Developer Review (AI)

### Summary

Story 1.2 matches Postiz architecture well: Prisma schema is centralized and repo already standardizes schema generation and db push via root scripts.

### Findings

- Prisma schema lives at `libraries/nestjs-libraries/src/database/prisma/schema.prisma` (correct in story).
- Repo uses `pnpm run prisma-generate` and `pnpm run prisma-db-push` scripts pinned to Prisma `6.5.0` (preferred over ad-hoc Prisma CLI usage).
- Existing domain already has `Tags` and `TagsPosts` for scheduled posts; analytics tagging should avoid colliding with this domain by using dedicated analytics models (aligns with Tech Spec Option A).

### Action Items

- [ ] Use **root scripts** for schema lifecycle:
  - [ ] `pnpm run prisma-generate`
  - [ ] `pnpm run prisma-db-push`
- [ ] Choose naming and field conventions consistent with existing schema:
  - [ ] Prefer `organizationId` (as used by `Integration.organizationId`) for new models rather than mixing `orgId` unless matching an existing pattern.
- [ ] Do **not** reuse existing `Tags` table for analytics tags unless explicitly decided; keep analytics tags separate to avoid coupling scheduling tags with analytics taxonomy.

### Evidence (Code Pointers)

- `libraries/nestjs-libraries/src/database/prisma/schema.prisma` (central schema)
- `package.json` scripts: `prisma-generate`, `prisma-db-push`
- Existing tag domain: `model Tags`, `model TagsPosts` in Prisma schema
