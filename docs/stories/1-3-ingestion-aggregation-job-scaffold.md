# Story 1.3: Ingestion & aggregation job scaffold (BullMQ)

Status: ready-for-dev

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

- [ ] Decide job placement and scheduling approach (AC: #1)
  - [ ] Confirm whether jobs should live in `apps/workers` vs `apps/cron` for this repo’s conventions.
  - [ ] Confirm how scheduling is done today (Nest Schedule vs cron app) and align.

- [ ] Create BullMQ queue + job definitions for ingestion and aggregation (AC: #1)
  - [ ] Add an ingestion job that accepts: `organizationId`, `integrationId`, `date`.
  - [ ] Add an aggregation job that accepts: `organizationId`, `date`.
  - [ ] Ensure job payloads are explicit and forward-compatible for backfill.

- [ ] Add retry/backoff and failure classification (AC: #2, #3)
  - [ ] Configure retry attempts/backoff (MVP baseline per tech spec).
  - [ ] Define error handling behavior for permanent failures (invalid token/permission) so jobs do not retry indefinitely.

- [ ] Add structured logging (AC: #2, #4)
  - [ ] Ensure logs include `organizationId`, `integrationId`, `jobId`, `date`.

- [ ] Testing (AC: #1)
  - [ ] Add a minimal job enqueue + process smoke test in dev/test environment (queue boot + processor).

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

### Completion Notes List

### File List

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

