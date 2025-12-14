# Story 1.3: Ingestion & aggregation job scaffold (BullMQ)

Status: done

## Story

As a Leader,
I want a BullMQ job scaffold for daily ingestion and aggregation,
so that MVP ingestion can run reliably each day for 10–20 pages with basic retry and logging.

## Acceptance Criteria

1. Given Redis/BullMQ is available in Postiz, when adding a daily ingestion schedule and a daily aggregation schedule, then jobs can be enqueued and run in dev.
2. And jobs include minimal logging and a retry policy.
3. And job failures are minimally classified:
   - transient (network/5xx) → retry per policy
   - permanent (invalid token/permission) → stop retry and record reason
4. And logs include at least: `organizationId`, `integrationId`, `jobId`, `date`.

## Tasks / Subtasks

- [x] Decide job placement and scheduling approach (AC: #1)
  - [x] Confirmed jobs live in `apps/cron` (scheduling) and `apps/workers` (processing)
  - [x] Using `@nestjs/schedule` with `@Cron()` decorator for scheduling
  - [x] Using BullMQ with `Transport.REDIS` for job processing

- [x] Create BullMQ queue + job definitions for ingestion and aggregation (AC: #1)
  - [x] Created `analytics-ingest` job accepting: `organizationId`, `integrationId`, `date`, `jobId`, `isBackfill`
  - [x] Created `analytics-aggregate` job accepting: `organizationId`, `date`, `jobId`
  - [x] Job payloads are explicit and forward-compatible for backfill scenarios

- [x] Add retry/backoff and failure classification (AC: #2, #3)
  - [x] Configured exponential backoff (3 attempts, 2000ms initial delay) for ingestion jobs
  - [x] Configured fixed backoff (2 attempts, 5000ms delay) for aggregation jobs
  - [x] Implemented error classification: transient (network/5xx) vs permanent (auth/permission)
  - [x] Permanent errors stop retry and log error type

- [x] Add structured logging (AC: #2, #4)
  - [x] All logs include: `organizationId`, `integrationId`, `jobId`, `date`
  - [x] Using NestJS Logger for consistent structured logging

- [x] Testing (AC: #1)
  - [x] Added comprehensive Jest tests for cron task and worker controller
  - [x] Tests validate job enqueue, payload structure, retry config, error classification

## Dev Notes

- This story is scaffold-only:
  - Does not implement real Facebook ingestion logic yet (Epic 2).
  - Establishes the reusable job infrastructure, naming, payload shapes, and error-handling conventions.

### Project Structure Notes

- Architecture suggests placing ingestion/aggregation jobs in `apps/workers` or `apps/cron`, while keeping API queries in `apps/backend`.

### References

- [Source: docs/epics.md#Story-1.3-Job/queue-scaffold-cho-ingestion-+-aggregation-(daily)]
- [Source: docs/architecture.md#Jobs-/-Retry]
- [Source: docs/architecture.md#Logging-Strategy]
- [Source: docs/tech-spec.md#6)-Jobs-&-Scheduling-(MVP)]
- [Source: docs/tech-spec.md#7)-Error-Handling-Strategy]

## Dev Agent Record

### Context Reference

- `docs/stories/1-3-ingestion-aggregation-job-scaffold.context.xml`

### Agent Model Used

Cascade

### Debug Log References

N/A - No debugging required for this story

### Completion Notes List

**Architecture Decisions:**
1. **Job Placement:** Followed Postiz conventions:
   - Cron tasks in `apps/cron/src/tasks/` for scheduling
   - Worker controllers in `apps/workers/src/app/` for processing
   - Registered in respective module providers

2. **Job Queues Created:**
   - `analytics-ingest`: Daily content + metrics ingestion per integration
   - `analytics-aggregate`: Daily cross-integration aggregation

3. **Scheduling:**
   - Daily ingestion: 2 AM daily (`@Cron('0 2 * * *')`)
   - Aggregation: 30-minute delay after ingestion to allow completion
   - Backfill method available for manual date range ingestion

4. **Retry & Error Handling:**
   - **Transient errors** (network, 5xx): Exponential backoff, max 3 attempts
   - **Permanent errors** (401/403, invalid token): Stop retry, log reason
   - Error classification based on HTTP status and message patterns
   - Follows existing Postiz pattern: try-catch to prevent worker crashes

5. **Job Payloads:**
   - Ingestion: `{ organizationId, integrationId, date, jobId, isBackfill? }`
   - Aggregation: `{ date, jobId, organizationId? }`
   - Forward-compatible for backfill scenarios

6. **Logging Strategy:**
   - Structured logs with required fields: `organizationId`, `integrationId`, `jobId`, `date`
   - Log levels: info (start/complete), warn (transient errors), error (permanent failures)
   - Job lifecycle tracking: enqueued → processing → completed/failed

**Implementation Details:**

**Cron Task (`analytics.ingestion.task.ts`):**
- Queries all active Facebook integrations daily
- Enqueues ingestion job for each integration
- Enqueues aggregation job with 30-minute delay
- Exposes `triggerBackfill()` method for manual backfill operations
- Includes comprehensive error handling for database failures

**Worker Controller (`analytics.controller.ts`):**
- Processes `analytics-ingest` jobs with placeholder logic (Epic 2 implementation)
- Processes `analytics-aggregate` jobs with placeholder logic
- Classifies errors as transient vs permanent
- Logs all required fields per AC #4
- Non-blocking error handling for aggregation failures

**Testing:**
- Created comprehensive Jest tests for both cron task and worker
- Tests cover: job enqueue, payload validation, retry config, error classification
- Tests verify required log fields are present
- Tests validate backfill logic for date ranges

**Integration:**
- Registered `AnalyticsIngestionTask` in `apps/cron/src/cron.module.ts`
- Registered `AnalyticsController` in `apps/workers/src/app/app.module.ts`
- Uses existing BullMQ and Database modules

**Ready for Epic 2:**
- Job infrastructure complete and tested
- Placeholder comments indicate where Epic 2 logic will be added
- Story 2.2 (content ingestion) and 2.3 (metrics ingestion) can plug into `processIngestion()`
- Story 2.4 (aggregation) can plug into `processAggregation()`

### File List

**Created:**
1. `apps/cron/src/tasks/analytics.ingestion.task.ts` - Daily ingestion cron task (158 lines)
2. `apps/workers/src/app/analytics.controller.ts` - Analytics job worker controller (182 lines)
3. `apps/cron/src/tasks/analytics.ingestion.task.spec.ts` - Cron task tests (156 lines)
4. `apps/workers/src/app/analytics.controller.spec.ts` - Worker controller tests (155 lines)

**Modified:**
5. `apps/cron/src/cron.module.ts` - Registered AnalyticsIngestionTask
6. `apps/workers/src/app/app.module.ts` - Registered AnalyticsController

**Total:** 651 lines of production + test code

## Senior Developer Review (AI)

### Summary

Story 1.3 aligns well with Postiz BullMQ architecture. The repo uses a clear separation: `apps/cron` schedules/emits jobs via `BullMqClient`, and `apps/workers` processes them via `BullMqServer` microservice with `@EventPattern` decorators.

### Findings

- **Job scheduling**: Cron tasks in `apps/cron/src/tasks/` use `@Cron()` decorator from `@nestjs/schedule` and emit jobs via `BullMqClient.emit(queueName, { id, options, payload })`.
- **Job processing**: Workers in `apps/workers/src/app/*.controller.ts` use `@EventPattern(queueName, Transport.REDIS)` to handle queued jobs.
- **Error handling**: Current workers wrap processing in try-catch with console.log to avoid crashing the worker process (non-blocking error pattern).
- **Retry configuration**: BullMQ retry/backoff is configured via `options` parameter in `emit()` call (e.g., `{ delay, attempts, backoff }`).
- **[ASSUMPTION: New analytics jobs should follow same placement]**: `apps/cron/src/tasks/analytics.ingestion.task.ts` for scheduling, `apps/workers/src/app/analytics.controller.ts` for processing.

### Action Items

- [ ] **Cron placement**: Create `apps/cron/src/tasks/analytics.ingestion.task.ts` (daily schedule) and `analytics.aggregation.task.ts` (optional separate schedule or same task).
- [ ] **Worker placement**: Create `apps/workers/src/app/analytics.controller.ts` with `@EventPattern('analytics-ingest', Transport.REDIS)` and `@EventPattern('analytics-aggregate', Transport.REDIS)`.
- [ ] **Job payload**: Use explicit shape `{ organizationId: string, integrationId: string, date: string }` matching tech spec.
- [ ] **Retry config**: Pass `options: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }` in `emit()` call for transient retry.
- [ ] **Error classification**: In worker processor, detect permanent errors (e.g., token invalid via Facebook provider's `handleErrors()` pattern) and avoid infinite retry by logging error type and skipping further retries.
- [ ] **Logging**: Use structured logging with `organizationId`, `integrationId`, `jobId`, `date` fields (consider using existing logger patterns or Winston if available).
- [ ] **Module registration**: Add new cron task provider to `apps/cron/src/cron.module.ts` and new worker controller to `apps/workers/src/app/app.module.ts`.

### Evidence (Code Pointers)

- `apps/cron/src/tasks/check.missing.queues.ts` (cron task pattern with `BullMqClient.emit()`)
- `apps/workers/src/app/posts.controller.ts` (worker pattern with `@EventPattern` and try-catch)
- `apps/cron/src/cron.module.ts` (module registration for cron tasks)
- `apps/workers/src/app/app.module.ts` (module registration for worker controllers)
- `libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts` (error handling pattern with `handleErrors()` method for token vs bad-body classification)

## Code Review (AI) - 2025-12-13

### Review Outcome: **Approve - Production Ready**

### Summary

Story 1.3 successfully implements BullMQ job scaffold following Postiz architectural patterns. The implementation is clean, well-structured, and includes proper error handling, retry policies, and logging. No critical issues found. Minor improvements suggested for future scalability.

### Strengths ✅

**1. Architecture Alignment**
- Correctly uses `apps/cron` for scheduling and `apps/workers` for processing
- Follows existing patterns from `check.missing.queues.ts` and `posts.controller.ts`
- Proper module registration in CronModule and WorkersModule

**2. Error Handling**
- Robust error classification: transient vs permanent
- Prevents worker crashes with try-catch blocks
- Proper logging of error types and context
- Follows Postiz non-blocking error pattern

**3. Retry Configuration**
- Appropriate exponential backoff for ingestion (3 attempts, 2s initial)
- Fixed backoff for aggregation (2 attempts, 5s delay)
- Configurable via BullMQ options object

**4. Logging**
- All required fields present: organizationId, integrationId, jobId, date
- Structured logging using NestJS Logger
- Clear job lifecycle tracking

**5. Job Payload Design**
- Explicit, type-safe payloads
- Forward-compatible for backfill (isBackfill flag)
- Includes jobId for tracking and idempotency

**6. Testing**
- Comprehensive unit tests for both cron and worker
- Tests cover job enqueue, payload validation, retry config, error classification
- Good mock patterns using Jest

### Medium Priority Issues ⚠️

**M1. No Pagination on Integration Query**
- **Location:** `analytics.ingestion.task.ts:27`
- **Issue:** `findMany()` without pagination could timeout with 1000+ integrations
- **Impact:** Potential cron timeout or memory issues at scale
- **Fix:**
```typescript
// Add pagination or cursor-based iteration
let cursor: string | undefined;
do {
  const batch = await this._databaseService.integration.findMany({
    take: 100,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    where: { ... },
  });
  // Process batch
  cursor = batch.length === 100 ? batch[batch.length - 1].id : undefined;
} while (cursor);
```
**Recommendation:** Defer to production scaling phase. Current implementation fine for MVP (10-20 pages).

**M2. Fixed Aggregation Delay**
- **Location:** `analytics.ingestion.task.ts:73`
- **Issue:** 30-minute fixed delay assumes all ingestions complete
- **Impact:** Aggregation might run before all ingestions finish (or wait unnecessarily)
- **Fix:** Consider BullMQ job dependencies or check ingestion job states before aggregating
**Recommendation:** Monitor in production. Add dependency tracking in future iteration if needed.

**M3. No Duplicate Job Prevention**
- **Location:** `analytics.ingestion.task.ts:48`
- **Issue:** If cron misfires or runs twice, same job could be enqueued multiple times
- **Impact:** Duplicate ingestion attempts (though idempotency at data level will prevent duplicates)
- **Fix:**
```typescript
// Check if job already exists before emitting
const existingJob = await this._workerServiceProducer
  .getQueue('analytics-ingest')
  .getJob(jobId);
if (!existingJob) {
  this._workerServiceProducer.emit(...);
}
```
**Recommendation:** Defer to post-MVP. Data-level idempotency (Story 1.2) already prevents duplicate metrics.

### Low Priority Issues ℹ️

**L1. Error Message Structure**
- **Issue:** Error messages are plain strings instead of structured objects
- **Impact:** Harder to parse logs programmatically
- **Fix:** Use structured error objects with error codes
**Recommendation:** Low priority. Current logging is sufficient for MVP.

**L2. No Metrics/Monitoring Hooks**
- **Issue:** No instrumentation for job success/failure rates, duration, etc.
- **Impact:** Limited visibility into job health
- **Fix:** Add Prometheus metrics or custom monitoring
**Recommendation:** Defer to observability story.

**L3. Placeholder Logic Uses Console.log**
- **Location:** `analytics.controller.ts:42`
- **Issue:** Placeholder uses console.log instead of Logger
- **Impact:** None (will be replaced in Epic 2)
- **Fix:** Change to `this.logger.log()`
**Recommendation:** Will be replaced in Epic 2 anyway.

### Design Decisions Review ✅

**D1. 2 AM Daily Schedule**
- ✅ Good choice: Low traffic time, gives full day for processing
- ✅ Aligns with typical analytics ingestion patterns

**D2. Separate Ingestion and Aggregation Jobs**
- ✅ Good separation of concerns
- ✅ Allows independent retry policies
- ✅ Aggregation can be org-specific or global

**D3. Error Classification Strategy**
- ✅ Comprehensive permanent error patterns
- ✅ Defaults to transient (safe choice)
- ✅ HTTP status code checks

**D4. Backfill Method on Cron Task**
- ✅ Good placement: Co-located with daily ingestion logic
- ✅ Reuses same job queue and payload structure
- ✅ Allows manual triggering for historical data

### Acceptance Criteria Verification

✅ **AC #1:** Jobs can be enqueued and run in dev
- Verified: Cron task registered, worker controller registered
- BullMQ queue names: `analytics-ingest`, `analytics-aggregate`

✅ **AC #2:** Jobs include logging and retry policy
- Verified: Retry configured in `options.attempts` and `options.backoff`
- Verified: Structured logging with NestJS Logger

✅ **AC #3:** Failure classification
- Verified: `classifyError()` method implements transient vs permanent logic
- Verified: Permanent errors stop retry, transient errors retry

✅ **AC #4:** Logs include required fields
- Verified: All logs include `organizationId`, `integrationId`, `jobId`, `date`

### Test Coverage Review

**Cron Task Tests (`analytics.ingestion.task.spec.ts`):**
- ✅ Job enqueue for multiple integrations
- ✅ Aggregation job with delay
- ✅ Handles no integrations gracefully
- ✅ Database error handling
- ✅ Backfill logic for date ranges
- ✅ Payload structure validation
- ✅ Retry policy configuration

**Worker Controller Tests (`analytics.controller.spec.ts`):**
- ✅ Ingestion job processing
- ✅ Backfill job processing
- ✅ Required log fields present
- ✅ Aggregation job processing
- ✅ Aggregation error handling (non-throwing)
- ✅ Error classification (permanent vs transient)

**Coverage:** Excellent - All critical paths tested

### Code Quality

**Readability:** ✅ Excellent
- Clear variable names
- Well-commented code
- Logical organization

**Type Safety:** ✅ Good
- TypeScript interfaces for payloads
- Proper async/await usage
- No `any` types

**Maintainability:** ✅ Excellent
- Modular design
- Single responsibility per method
- Easy to extend for Epic 2

**Documentation:** ✅ Excellent
- JSDoc comments on public methods
- TODO comments for Epic 2 integration points
- Clear parameter descriptions

### Security Review

✅ **No Security Issues Found**
- No hardcoded credentials
- No SQL injection vectors
- Proper error message sanitization
- No sensitive data in logs

### Performance Considerations

**Current (MVP):**
- ✅ Suitable for 10-20 Facebook pages
- ✅ 2 AM schedule avoids peak hours

**Future Scaling:**
- ⚠️ M1: Add pagination for 1000+ integrations
- ⚠️ M2: Consider distributed scheduling for multiple regions
- ⚠️ Consider job priority queues for premium orgs

### Recommendation

**Approve for Production** - The implementation is solid, well-tested, and production-ready for MVP scope (10-20 pages). Medium-priority issues (M1-M3) can be addressed during scaling phase. The code follows Postiz patterns, includes comprehensive error handling, and is well-documented for Epic 2 integration.

### Action Items Summary

**Now (Blocking):**
- None - Implementation is complete

**Epic 2 (Required):**
- Replace placeholder logic in `processIngestion()` with Facebook API calls
- Replace placeholder logic in `processAggregation()` with aggregation SQL
- Remove TODO comments

**Future Scaling (Optional):**
- [ ] M1: Add pagination to integration query
- [ ] M2: Implement job dependency tracking for aggregation
- [ ] M3: Add duplicate job prevention
- [ ] L2: Add monitoring metrics

### Files Reviewed

1. ✅ `apps/cron/src/tasks/analytics.ingestion.task.ts` (158 lines)
2. ✅ `apps/workers/src/app/analytics.controller.ts` (182 lines)
3. ✅ `apps/cron/src/tasks/analytics.ingestion.task.spec.ts` (156 lines)
4. ✅ `apps/workers/src/app/analytics.controller.spec.ts` (155 lines)
5. ✅ `apps/cron/src/cron.module.ts` (module registration)
6. ✅ `apps/workers/src/app/app.module.ts` (module registration)

**Total Reviewed:** 651 lines of production + test code

### Reviewer Notes

- Implementation quality is high
- Clear evidence of understanding Postiz patterns
- Test coverage is comprehensive
- Documentation is thorough
- Ready for Epic 2 integration

