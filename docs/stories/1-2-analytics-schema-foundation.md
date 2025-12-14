# Story 1.2: Analytics schema foundation (Prisma)

Status: done

## Story

As a Leader,
I want foundational Prisma schema for analytics groups/tags/time-series metrics,
so that the system can ingest and analyze data over time without breaking existing Postiz tables.

## Acceptance Criteria

1. Given the existing Postiz Prisma schema, when adding the minimum analytics-intelligence tables/models, then schema migration/push succeeds and does not break existing tables.
2. And basic indexes exist for querying by organization/integration/date.

## Tasks / Subtasks

- [x] Confirm data-model approach for MVP content storage (AC: #1)
  - [x] Confirmed dedicated analytics content table (AnalyticsContent) to avoid coupling with scheduling domain

- [x] Implement minimal Prisma schema changes (AC: #1)
  - [x] Add models for:
    - [x] page groups / niches (AnalyticsGroup)
    - [x] tags (AUTO/MANUAL) (AnalyticsTag)
    - [x] daily metrics time-series (AnalyticsMetric)
    - [x] join table for content ↔ tag mapping (AnalyticsContentTag)
  - [x] Ensure all models are org-scoped and do not cross org boundaries.

- [x] Add constraints and indexes (AC: #2)
  - [x] Add unique constraints for idempotency keys (org + integration + externalContentId + date + metricType) on daily metrics.
  - [x] Add indexes for common queries (org/date, org/integration/date).

- [x] Apply migration/push safely (AC: #1)
  - [x] Run schema generation step per repo convention (pnpm run prisma-generate).
  - [x] Apply migration/push in a way consistent with Postiz dev workflow (pnpm run prisma-db-push).

- [x] Tests (AC: #1, #2)
  - [x] Verified Prisma client generation successful and backend runs without errors with new schema.

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

- Backend restarted successfully after schema changes
- Prisma generate completed in 270ms
- Database sync completed in 217ms

### Completion Notes List

**Schema Design Decisions:**
1. Created dedicated `AnalyticsContent` table separate from `Post` to avoid coupling analytics with scheduling domain
2. All models org-scoped using `organizationId` field with foreign key to `Organization`
3. Models also link to `Integration` where applicable for per-page data tracking
4. Implemented soft deletes via `deletedAt` field following existing Postiz patterns

**Models Implemented:**
1. **AnalyticsGroup** - For organizing pages into groups/niches
   - Fields: id, organizationId, name, description, timestamps, deletedAt
   - Unique constraint: [organizationId, name, deletedAt]
   - Indexes: organizationId, deletedAt

2. **AnalyticsTag** - For AUTO and MANUAL tagging of content
   - Fields: id, organizationId, name, type (AUTO/MANUAL), timestamps, deletedAt
   - Unique constraint: [organizationId, name, type, deletedAt]
   - Indexes: organizationId, type, deletedAt

3. **AnalyticsContent** - Stores Facebook post/reel metadata
   - Fields: id, organizationId, integrationId, externalContentId, contentType, caption, hashtags, publishedAt, timestamps, deletedAt
   - Unique constraint: [organizationId, integrationId, externalContentId, deletedAt] for idempotency
   - Indexes: organizationId, integrationId, externalContentId, publishedAt, deletedAt

4. **AnalyticsContentTag** - Join table for content-tag relationships
   - Fields: contentId, tagId, timestamps
   - Composite primary key: [contentId, tagId]
   - Unique constraint: [contentId, tagId]

5. **AnalyticsMetric** - Time-series metrics storage
   - Fields: id, organizationId, integrationId, contentId, groupId, date, metricType, metricValue, externalContentId, timestamps
   - Unique constraint: [organizationId, integrationId, externalContentId, date, metricType] for idempotency
   - Indexes: organizationId, integrationId, contentId, groupId, date, [organizationId, date], [organizationId, integrationId, date]

**Idempotency Strategy:**
- Metrics use compound unique constraint on (org + integration + externalContentId + date + metricType)
- Content uses compound unique constraint on (org + integration + externalContentId)
- Allows safe re-ingestion without duplicates

**Relations Added:**
- Organization → AnalyticsGroup[] (one-to-many)
- Organization → AnalyticsTag[] (one-to-many)
- Organization → AnalyticsContent[] (one-to-many)
- Organization → AnalyticsMetric[] (one-to-many)
- Integration → AnalyticsContent[] (one-to-many)
- Integration → AnalyticsMetric[] (one-to-many)
- AnalyticsContent → AnalyticsMetric[] (one-to-many)
- AnalyticsGroup → AnalyticsMetric[] (one-to-many)
- AnalyticsTag ↔ AnalyticsContent (many-to-many via AnalyticsContentTag)

**Schema Lifecycle:**
- Used `pnpm run prisma-generate` to generate Prisma client (282ms)
- Used `pnpm run prisma-db-push` to sync database schema (138ms)
- Backend auto-reloaded successfully with new schema
- No breaking changes to existing Postiz tables

**Critical Fix Applied (C1):**
- Made `externalContentId` required (NOT NULL) in AnalyticsMetric model
- This ensures unique constraint works correctly for idempotency
- Prevents duplicate metrics for same org+integration+externalId+date+type
- Schema regenerated and applied successfully
- Backend verified working after fix

### File List

**Modified:**
1. `libraries/nestjs-libraries/src/database/prisma/schema.prisma` - Added 5 new analytics models with relations, constraints, and indexes

**Generated:**
2. `node_modules/@prisma/client` - Prisma client regenerated with new analytics models

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

## Code Review (AI) - 2025-12-13

### Review Outcome: **Approve with Critical Fix Required**

### Summary

Story 1.2 schema implementation successfully adds 5 analytics models with proper org-scoping and follows Postiz patterns. However, there is **one critical issue** with the unique constraint design that will break idempotency and **must be fixed** before this can be used in production.

### Critical Issues ❌

**C1. Nullable Field in Unique Constraint (MUST FIX)**
- **Model:** `AnalyticsMetric`
- **Issue:** Unique constraint includes nullable field `externalContentId`
- **Line:** `@@unique([organizationId, integrationId, externalContentId, date, metricType])`
- **Problem:** In SQL, `NULL != NULL`, so multiple metrics with `NULL` externalContentId can exist, breaking idempotency
- **Impact:** Ingestion jobs (Story 2.3) will create duplicate metrics when `externalContentId` is NULL
- **Fix Required:**
```prisma
// Option 1: Make externalContentId required (NOT NULL)
externalContentId  String    // Remove the ?

// Option 2: Split into two unique constraints
@@unique([organizationId, integrationId, contentId, date, metricType])
@@unique([organizationId, integrationId, externalContentId, date, metricType])
// And add validation that either contentId OR externalContentId must be set

// Option 3 (Recommended): Use coalesce with a default value
externalContentId  String @default("UNKNOWN") // Ensures never NULL
```
**Recommendation:** Use Option 1 - make `externalContentId` required. The field exists specifically for idempotency before contentId is created, so it should always have a value from Facebook API.

### High Priority Issues ⚠️

**H1. Missing Enum Types for String Fields**
- **Models:** `AnalyticsContent.contentType`, `AnalyticsMetric.metricType`
- **Issue:** Using `String` instead of enum types
- **Impact:** No compile-time validation, potential for typos and inconsistencies
- **Fix:**
```prisma
enum AnalyticsContentType {
  POST
  REEL
  STORY
  VIDEO
}

enum AnalyticsMetricType {
  REACH
  VIEWS
  ENGAGEMENT
  LIKES
  COMMENTS
  SHARES
  SAVES
}

// Then use in models:
contentType  AnalyticsContentType
metricType   AnalyticsMetricType
```

**H2. No Cascade Delete Behavior**
- **Models:** All analytics models
- **Issue:** No `onDelete` actions specified for foreign key relations
- **Impact:** Deleting Organization/Integration may fail or leave orphaned records
- **Fix:** Add cascade delete:
```prisma
organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
integration  Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
```

### Medium Priority Issues ⚠️

**M1. Float Type for Metrics May Lose Precision**
- **Model:** `AnalyticsMetric.metricValue`
- **Issue:** Using `Float` for metric values
- **Impact:** Floating-point precision issues for large numbers (e.g., reach > 1M)
- **Fix:** Consider using `Int` or `Decimal`:
```prisma
metricValue Int  // If metrics are always whole numbers
// OR
metricValue Decimal @db.Decimal(15, 2)  // If decimals needed
```

**M2. No String Length Constraints**
- **Models:** `AnalyticsContent.caption`, `AnalyticsContent.hashtags`, `AnalyticsGroup.description`
- **Issue:** Unbounded string fields
- **Impact:** Potential database bloat, no validation
- **Fix:** Add length constraints:
```prisma
caption     String? @db.VarChar(5000)
hashtags    String? @db.VarChar(1000)
description String? @db.VarChar(500)
```

**M3. Missing Audit Fields**
- **Models:** All analytics models
- **Issue:** No `createdBy`, `updatedBy` user tracking
- **Impact:** Cannot audit who created/modified records
- **Note:** This may be intentional for system-generated data, but consider adding for manual tags/groups

### Low Priority Issues ℹ️

**L1. Index Redundancy**
- **Model:** `AnalyticsMetric`
- **Issue:** Unique constraint on `[organizationId, integrationId, externalContentId, date, metricType]` already creates an index, so separate `@@index([organizationId])` may be redundant
- **Impact:** Minimal - PostgreSQL will optimize, but adds maintenance overhead
- **Note:** Keep separate indexes if queries often filter by organizationId alone

**L2. Date Field Type**
- **Model:** `AnalyticsMetric.date`
- **Issue:** Using `DateTime` for date-only field
- **Impact:** Stores unnecessary time component
- **Fix:** Consider using `@db.Date` or normalize to midnight:
```prisma
date DateTime @db.Date  // PostgreSQL DATE type
```

**L3. JSON vs String for Arrays**
- **Model:** `AnalyticsContent.hashtags`
- **Issue:** Storing JSON as String instead of Prisma Json type
- **Impact:** No type safety, must manually parse
- **Fix:**
```prisma
hashtags Json? @db.JsonB  // PostgreSQL JSONB for better query support
```

### Strengths ✅

1. **Org-Scoping:** All models properly scoped to Organization
2. **Soft Deletes:** `deletedAt` field consistently applied
3. **Naming:** Consistent with Postiz conventions (`organizationId` not `orgId`)
4. **Relations:** Properly defined with foreign keys
5. **Indexes:** Good coverage for expected query patterns
6. **Separate Domain:** Analytics tags separate from scheduling tags
7. **Idempotency Intent:** Unique constraints designed for safe re-ingestion (except C1)

### Action Items Summary

**MUST FIX (Before Stories 2.2/2.3):**
- [x] **C1:** Fix nullable field in unique constraint on AnalyticsMetric ✅ FIXED

**SHOULD FIX (Before Production):**
- [ ] **H1:** Add enum types for contentType and metricType
- [ ] **H2:** Add cascade delete behavior to relations

**NICE TO HAVE:**
- [ ] **M1:** Consider Int or Decimal for metricValue
- [ ] **M2:** Add string length constraints
- [ ] **M3:** Consider audit fields for manual operations
- [ ] **L1-L3:** Optimize field types

### Acceptance Criteria Re-Verification

✅ **AC #1:** Schema migration/push succeeds
- Status: PASSED
- Note: Schema applied successfully, but contains design flaw (C1)

✅ **AC #2:** Basic indexes exist
- Status: PASSED
- 17 indexes created for common query patterns

### Risk Assessment

**HIGH RISK:** Issue C1 will cause duplicate metrics in production. **Must fix before Story 2.3** (Ingest Daily Metrics).

### Recommendation

**Approve with Critical Fix Required** - Fix C1 immediately. H1-H2 should be addressed before Epic 2 stories. Schema is otherwise well-designed and ready for use.

### Reviewer Notes

- The nullable unique constraint issue is a common Prisma/SQL pitfall
- Consider running Prisma validation in CI/CD to catch schema issues early
- Schema design shows good understanding of Postiz patterns
- Idempotency strategy is sound once C1 is fixed
