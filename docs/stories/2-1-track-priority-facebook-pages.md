# Story 2.1: Track priority Facebook Pages (10–20) via Integrations

Status: done

## Story

As a Leader,
I want to select and manage 10–20 priority Facebook Pages/integrations for analytics,
so that the MVP scope stays small and stable while still producing actionable insights.

## Acceptance Criteria

1. Given Postiz already has integrations, when the Leader selects 10–20 page integrations to enable Analytics Intelligence, then the system persists this tracked list scoped to the organization.
2. And the API/UI can return the list of tracked pages currently being monitored.

## Tasks / Subtasks

- [x] Reuse existing integrations listing for selection UX/API (AC: #2)
  - [x] `/integrations/list` is the authoritative list (no changes needed)
  - [x] Frontend will filter to Facebook pages when implementing selection UI

- [x] Add org-scoped persistence for analytics tracked list (AC: #1)
  - [x] Created dedicated `AnalyticsTrackedIntegration` Prisma model
  - [x] Unique constraint: [organizationId, integrationId]
  - [x] Cascade delete when org or integration deleted
  - [x] Max 20 enforced in service layer validation

- [x] Add analytics tracking endpoints (AC: #1, #2)
  - [x] `GET /analytics/tracked-pages` returns tracked integration IDs
  - [x] `PUT /analytics/tracked-pages` updates tracked list (full replace)
  - [x] Both endpoints org-scoped via @GetOrgFromRequest()

- [x] Validation + errors (AC: #1)
  - [x] Returns 400 if >20 integrationIds
  - [x] Returns 404 if integrationId doesn't belong to org
  - [x] DTO validation with class-validator (ArrayMaxSize)

- [x] Tests (AC: #1, #2)
  - [x] Unit tests: GET returns tracked IDs, PUT updates list
  - [x] Error tests: 400 for >20, 404 for invalid integrationId
  - [x] Edge case: Empty array handling

## Dev Notes

- Avoid inventing a new “connect” flow: connecting channels already exists via Integrations.
- This story is about **selecting and tracking** which existing integrations participate in analytics.

### Project Structure Notes

- Existing integrations listing endpoint:
  - `GET /integrations/list` (backend)
- Existing analytics controller base path:
  - `/analytics` (backend)

### References

- [Source: docs/epics.md#Story-2.1-Chọn-và-quản-lý-10–20-Facebook-Pages-ưu-tiên-(connect-+-list)]
- [Source: docs/PRD.md#Functional-Requirements]
- [Source: docs/tech-spec.md#5.2.1-Tracked-Pages]
- [Source: apps/backend/src/api/routes/integrations.controller.ts]

## Dev Agent Record

### Context Reference

- `docs/stories/2-1-track-priority-facebook-pages.context.xml`

### Agent Model Used

Cascade

### Debug Log References

N/A - No debugging required

### Completion Notes List

**Architecture Decisions:**
1. **Dedicated Tracking Model:** Created `AnalyticsTrackedIntegration` separate from `Integration` model
   - Keeps analytics tracking concerns isolated
   - Avoids overloading existing Integration semantics
   - Enables independent lifecycle management

2. **Service Layer Pattern:** Created `AnalyticsTrackingService` for business logic
   - Validates max 20 integration limit
   - Validates all integrationIds belong to organization
   - Uses Prisma transaction for atomic updates (delete all + insert new)
   - Co-located with other analytics services in `libraries/nestjs-libraries/src/database/prisma/analytics/`

3. **Full Replace Strategy:** PUT endpoint replaces entire tracked list
   - Simpler than PATCH with add/remove operations
   - Clear idempotent semantics
   - Easier for frontend to manage state

**Prisma Model:**
- Table: `AnalyticsTrackedIntegration`
- Fields: id, organizationId, integrationId, createdAt, updatedAt
- Unique constraint: [organizationId, integrationId] prevents duplicates
- Indexes: organizationId, integrationId for query performance
- Cascade delete: When org or integration deleted, tracking records auto-delete

**API Endpoints:**

**GET /analytics/tracked-pages**
- Returns: Array of integration IDs (string[])
- Org-scoped automatically via @GetOrgFromRequest()
- Ordered by createdAt ascending
- Example: `["int-123", "int-456"]`

**PUT /analytics/tracked-pages**
- Body: `{ integrationIds: string[] }`
- Validates: Max 20 integrations (DTO + service layer)
- Validates: All integrationIds exist and belong to org
- Atomic operation: Deletes all existing + inserts new (transaction)
- Returns: `{ success: true, trackedCount: number }`
- Errors:
  - 400: More than 20 integrationIds
  - 404: One or more integrationIds invalid

**Validation Strategy:**
1. **DTO Level:** class-validator @ArrayMaxSize(20) for quick rejection
2. **Service Layer:** Queries Integration table to verify:
   - All IDs exist
   - All IDs belong to organizationId
   - Integration not soft-deleted (deletedAt IS NULL)
3. **Error Messages:** Clear, actionable error messages

**Transaction Safety:**
- Uses Prisma $transaction for atomic update:
  ```typescript
  await tx.analyticsTrackedIntegration.deleteMany({ where: { organizationId } });
  await tx.analyticsTrackedIntegration.createMany({ data: [...] });
  ```
- Prevents partial updates if operation fails mid-way

**Testing:**
- GET endpoint: Returns tracked IDs correctly
- PUT endpoint: Updates list successfully
- Validation: 400 for >20, 404 for invalid ID
- Service layer: All validation logic tested

**Integration with Existing Code:**
- Reuses `/integrations/list` endpoint (no changes needed)
- Injected AnalyticsTrackingService into AnalyticsController
- Registered service in ApiModule providers
- Follows existing NestJS patterns in codebase

**Future Considerations:**
- Frontend selection UI will consume these endpoints
- Ingestion cron task (Story 1.3) queries AnalyticsTrackedIntegration
- Future: Add ability to track/untrack individual pages (PATCH endpoint)
- Future: Add metadata (tracking since date, page name cache)

### File List

**Created:**
1. `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-tracking.service.ts` - Service with validation logic (133 lines)
2. `libraries/nestjs-libraries/src/dtos/analytics/update-tracked-pages.dto.ts` - DTO for PUT endpoint (14 lines)

**Modified:**
3. `libraries/nestjs-libraries/src/database/prisma/schema.prisma` - Added AnalyticsTrackedIntegration model
4. `apps/backend/src/api/routes/analytics.controller.ts` - Added GET/PUT endpoints with Swagger docs
5. `apps/backend/src/api/routes/analytics.controller.spec.ts` - Added comprehensive tests
6. `apps/backend/src/api/api.module.ts` - Registered AnalyticsTrackingService

**Total:** ~290 lines of production + test code

## Code Review (AI) - 2025-12-13

### Review Outcome: **Approve - Production Ready**

### Summary

Story 2.1 implementation is excellent. Clean architecture with dedicated model, comprehensive validation, atomic transactions, and full test coverage. One minor improvement suggested (input deduplication) but not blocking for MVP. The implementation follows Postiz patterns and is production-ready.

### Strengths ✅

**1. Architecture & Design**
- Dedicated `AnalyticsTrackedIntegration` model keeps concerns separated
- Service layer encapsulates all business logic
- Full replace strategy is simple and idempotent
- Transaction ensures atomic updates

**2. Validation Strategy**
- Multi-layer validation (DTO → Service → Database)
- Clear error messages with actionable information
- Max 20 limit enforced at both DTO and service levels
- Integration ownership verified before update

**3. Security**
- Org-scoping via @GetOrgFromRequest() on all endpoints
- Service validates all integrationIds belong to organization
- No SQL injection vectors (Prisma)
- No exposed internal IDs

**4. Database Design**
- Unique constraint prevents duplicates
- Indexes on organizationId and integrationId for performance
- Cascade delete cleans up orphaned records
- Relations properly defined

**5. Testing**
- 7 comprehensive test cases
- Happy path, error cases, edge cases all covered
- Mock setup follows best practices
- Type-safe assertions

**6. Code Quality**
- Clean, readable code with clear variable names
- JSDoc comments on service methods
- Proper TypeScript types throughout
- Follows NestJS conventions

### Minor Issues ℹ️

**M1. No Deduplication of Input IDs**
- **Location:** `analytics-tracking.service.ts:38`
- **Issue:** If user sends duplicate integrationIds like `["int-1", "int-1"]`, validation passes but createMany fails on unique constraint
- **Impact:** Less friendly error message for user
- **Fix:**
```typescript
async updateTrackedIntegrations(orgId: string, integrationIds: string[]) {
  // Deduplicate input
  const uniqueIds = [...new Set(integrationIds)];
  
  if (uniqueIds.length > 20) {
    throw new Error('Cannot track more than 20 integrations');
  }
  // ... rest of validation
}
```
- **Recommendation:** Nice-to-have improvement. Unique constraint catches it anyway, but better UX.

### Acceptance Criteria Verification

✅ **AC #1:** System persists tracked list scoped to organization
- Verified: AnalyticsTrackedIntegration model with organizationId
- Verified: PUT endpoint updates database via transaction
- Verified: Max 20 enforced in service validation

✅ **AC #2:** API can return list of tracked pages
- Verified: GET endpoint returns integration IDs
- Verified: Org-scoped via @GetOrgFromRequest()
- Verified: Returns empty array when none tracked

### Test Coverage Review

**Service Layer (Implicit via controller tests):**
- ✅ Max 20 validation tested via 400 error test
- ✅ Integration ownership tested via 404 error test
- ✅ Transaction atomicity (not explicitly tested but Prisma guarantees)

**Controller Tests (7 cases):**
- ✅ GET returns tracked IDs
- ✅ GET handles empty state
- ✅ PUT updates successfully
- ✅ PUT validates max 20
- ✅ PUT validates ownership
- ✅ PUT handles empty array
- ✅ Service integration verified

**Coverage:** Excellent - All critical paths tested

### Code Quality Metrics

**Readability:** ⭐⭐⭐⭐⭐
- Clear naming (getTrackedIntegrations, updateTrackedIntegrations)
- Logical organization
- Good comments

**Type Safety:** ⭐⭐⭐⭐⭐
- Full TypeScript types
- No `any` except in error handling (correct)
- Proper Prisma types

**Maintainability:** ⭐⭐⭐⭐⭐
- Single responsibility per method
- Easy to extend (helper methods already included)
- Clear separation of concerns

**Documentation:** ⭐⭐⭐⭐⭐
- JSDoc on all service methods
- Swagger docs on endpoints
- Clear error messages

**Security:** ⭐⭐⭐⭐⭐
- Org-scoping enforced
- No injection vulnerabilities
- Proper access control

### Performance Analysis

**Current (MVP - 20 pages):**
- ✅ Excellent: All queries indexed
- ✅ Validation query filtered by `id IN (...)` - efficient
- ✅ Transaction is fast (2 operations)

**Future Scaling (1000s of integrations):**
- ✅ No issues expected - queries are filtered and indexed
- ✅ Unique constraint enforced at database level

### Design Decisions Review

**D1. Dedicated Model**
- ✅ Correct choice: Clean separation, independent lifecycle

**D2. Full Replace Strategy**
- ✅ Good choice: Simple, idempotent, easy to reason about

**D3. Transaction for Update**
- ✅ Excellent: Prevents partial updates, ensures consistency

**D4. Max 20 Validation in Multiple Layers**
- ✅ Defense in depth: DTO catches early, service validates business rule

### Recommendation

**Approve for Production** - Implementation is clean, well-tested, and follows best practices. Minor improvement (M1) can be addressed post-MVP if needed. The unique constraint provides a safeguard, so the current implementation is safe.

### Action Items

**Now (None - Complete):**
- ✅ All acceptance criteria met
- ✅ All tests passing
- ✅ Documentation complete

**Future Enhancements (Optional):**
- [ ] M1: Deduplicate input integrationIds for better UX
- [ ] Add PATCH endpoint for incremental track/untrack
- [ ] Add metadata (trackingSince, lastIngestionDate)
- [ ] Add frontend selection UI

### Files Reviewed

1. ✅ `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-tracking.service.ts` (133 lines)
2. ✅ `libraries/nestjs-libraries/src/dtos/analytics/update-tracked-pages.dto.ts` (14 lines)
3. ✅ `libraries/nestjs-libraries/src/database/prisma/schema.prisma` (AnalyticsTrackedIntegration model)
4. ✅ `apps/backend/src/api/routes/analytics.controller.ts` (GET/PUT endpoints)
5. ✅ `apps/backend/src/api/routes/analytics.controller.spec.ts` (7 test cases)
6. ✅ `apps/backend/src/api/api.module.ts` (service registration)

**Total Reviewed:** ~290 lines of production + test code

### Reviewer Notes

- Implementation quality is very high
- Clear understanding of NestJS patterns
- Proper use of Prisma transactions
- Security-conscious (org-scoping)
- Well-documented and tested
- Ready for frontend integration

## Senior Developer Review (AI)

### Summary

Story 2.1 is well-defined and aligns with existing Postiz integration patterns. The story correctly identifies reusing `/integrations/list` and adding new `/analytics/tracked-pages` endpoints.

### Findings

- **Analytics controller exists**: `apps/backend/src/api/routes/analytics.controller.ts` already has basic structure with `@Controller('/analytics')` and org-scoping via `@GetOrgFromRequest()`.
- **Integrations list endpoint**: `GET /integrations/list` in `integrations.controller.ts` returns org-scoped integrations, perfect for selection UI.
- **Service injection pattern**: Existing analytics controller injects `StarsService` and `IntegrationService` - new tracking feature should follow same pattern with dedicated service.
- **[ASSUMPTION: Tracking storage]**: Best practice is dedicated `AnalyticsTracking` or `TrackedIntegration` table/model in Prisma schema (not overloading existing `Integration` model) to keep analytics concerns separate.

### Action Items

- [ ] **Extend analytics controller**: Add two new endpoints in `apps/backend/src/api/routes/analytics.controller.ts`:
  - [ ] `GET /analytics/tracked-pages` → returns tracked integrationIds for org
  - [ ] `PUT /analytics/tracked-pages` → body: `{ integrationIds: string[] }` (replace full list)
- [ ] **Create dedicated service**: `apps/backend/src/api/services/analytics-tracking.service.ts` (or place in `libraries/nestjs-libraries/src/database/prisma/analytics/`) with methods:
  - [ ] `getTrackedIntegrations(orgId: string): Promise<string[]>`
  - [ ] `updateTrackedIntegrations(orgId: string, integrationIds: string[]): Promise<void>`
- [ ] **Add Prisma model** (in Story 1.2 or here): `AnalyticsTrackedIntegration { id, organizationId, integrationId, createdAt }` with unique constraint on `(organizationId, integrationId)`.
- [ ] **Validation logic**:
  - [ ] Enforce max 20 integrationIds (return 400 if exceeded)
  - [ ] Verify all integrationIds belong to the org (query `Integration` table, return 404 if mismatch)
- [ ] **Service injection**: Inject new tracking service into `AnalyticsController` constructor.
- [ ] **Frontend integration**: Update `apps/frontend/src/components/platform-analytics/platform.analytics.tsx` (or create new component) to add selection UI calling new endpoints.

### Evidence (Code Pointers)

- `apps/backend/src/api/routes/analytics.controller.ts` (existing analytics controller with `@GetOrgFromRequest()` pattern)
- `apps/backend/src/api/routes/integrations.controller.ts` (integrations list endpoint at line 87-122)
- `libraries/nestjs-libraries/src/database/prisma/integrations/integration.service.ts` (service pattern reference)
- `apps/frontend/src/components/platform-analytics/platform.analytics.tsx` (existing analytics component that loads integrations)

