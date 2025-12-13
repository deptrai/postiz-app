# Story 2.1: Track priority Facebook Pages (10–20) via Integrations

Status: ready-for-dev

## Story

As a Leader,
I want to select and manage 10–20 priority Facebook Pages/integrations for analytics,
so that the MVP scope stays small and stable while still producing actionable insights.

## Acceptance Criteria

1. Given Postiz already has integrations, when the Leader selects 10–20 page integrations to enable Analytics Intelligence, then the system persists this tracked list scoped to the organization.
2. And the API/UI can return the list of tracked pages currently being monitored.

## Tasks / Subtasks

- [ ] Reuse existing integrations listing for selection UX/API (AC: #2)
  - [ ] Use `/integrations/list` as the authoritative list of available channels.
  - [ ] Filter/limit to relevant identifiers (facebook pages) in the UI layer.

- [ ] Add org-scoped persistence for “analytics tracked” flag/list (AC: #1)
  - [ ] Add DB storage for tracked integrations (preferred: dedicated analytics tracking table/model rather than overloading existing integration fields).
  - [ ] Enforce max 20 tracked integrations (MVP constraint).

- [ ] Add analytics tracking endpoints (AC: #1, #2)
  - [ ] `GET /analytics/tracked-pages` returns tracked integrations for the org.
  - [ ] `PUT /analytics/tracked-pages` updates tracked integrationIds (replace full list).

- [ ] Validation + errors (AC: #1)
  - [ ] 400 if more than 20 integrationIds.
  - [ ] 404 if an integrationId does not belong to the org.

- [ ] Tests (AC: #1, #2)
  - [ ] Integration test: updating tracked list then fetching it returns expected values.

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

### Completion Notes List

### File List

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

