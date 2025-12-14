# Story 6.2: Generate Playbook Variants

Status: ready-for-dev

## Story

As a **Leader**,
I want **to have 3-5 variants generated for each playbook**,
So that **I can quickly test different variations of hooks, timing, and hashtags**.

## Acceptance Criteria

1. **Given** an existing playbook,
   **When** the user opens the playbook detail view,
   **Then** the system displays 3-5 variants with clear differentiation.

2. **Given** a playbook variant,
   **When** the user views the variant,
   **Then** it shows:
   - Variant name/label (e.g., "Hook Variation A", "Time Slot B")
   - Modified elements compared to base playbook
   - Suggested application instructions

3. **Given** a playbook,
   **When** variants are generated,
   **Then** variants cover different dimensions:
   - Hook variations (different opening patterns)
   - Time variations (different posting times)
   - Hashtag variations (different hashtag combinations)

4. **Given** a variant,
   **When** the user wants to use it,
   **Then** they can copy the variant recipe to clipboard or export it.

5. **Given** playbook variants exist,
   **When** the user creates an experiment (Story 6.3),
   **Then** they can select variants to include in the experiment.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend Playbook schema for variants (AC: #1, #2)
  - [ ] Add PlaybookVariant model with fields: id, playbookId, name, type (hook/time/hashtag), recipe (JSON), createdAt
  - [ ] Add relation Playbook -> PlaybookVariant (1:many)
  - [ ] Run migration

- [ ] Create PlaybookVariantService (AC: #1, #3)
  - [ ] Implement `generateVariants(playbookId)` method
  - [ ] Generate hook variations by analyzing alternative patterns from source content
  - [ ] Generate time variations using BestTimeService data for different slots
  - [ ] Generate hashtag variations by creating different combinations from hashtag bucket
  - [ ] Limit to 3-5 variants per playbook

- [ ] Add Variant API endpoints (AC: #1, #4)
  - [ ] GET /api/playbooks/:id/variants - List variants for a playbook
  - [ ] POST /api/playbooks/:id/variants/generate - Generate variants
  - [ ] GET /api/playbooks/:id/variants/:variantId - Get variant details
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Extend PlaybookDetailPage for variants (AC: #1, #2)
  - [ ] Add variants section to playbook detail view
  - [ ] Display variant cards with type badge and key differences
  - [ ] Show variant recipe details on click/expand

- [ ] Create variant interaction features (AC: #4)
  - [ ] Add "Copy Recipe" button for each variant
  - [ ] Add "Export" option for variant
  - [ ] Show success toast on copy

- [ ] Add variant generation UI (AC: #3)
  - [ ] Add "Generate Variants" button on playbook detail
  - [ ] Show loading state during generation
  - [ ] Refresh variant list after generation

### Testing

- [ ] Backend tests
  - [ ] Unit test: Variant generation logic
  - [ ] Unit test: Hook variation extraction
  - [ ] Unit test: Time variation generation
  - [ ] Unit test: Hashtag combination generation
  - [ ] Integration test: API endpoints

- [ ] Frontend tests
  - [ ] Component test: Variant display
  - [ ] Test copy to clipboard functionality

## Dev Notes

**Prerequisites:**
- Story 6.1 complete (Playbook generation)
- Playbook model and service exist

**Technical Stack:**
- Backend: NestJS, Prisma ORM
- Frontend: React, TypeScript

### Variant Generation Strategy

**Hook Variations:**
- Analyze source content hooks from playbook
- Group by pattern type (question, statement, statistic, story)
- Create variants using different pattern types
- Example: If base uses question hook, variants use statement/statistic hooks

**Time Variations:**
- Use BestTimeService heatmap data
- Select top 3 different time slots
- Consider weekday vs weekend variations
- Example: Morning slot, Afternoon slot, Evening slot

**Hashtag Variations:**
- From playbook's hashtag bucket, create combinations:
  - High-reach focused (top reach hashtags)
  - High-engagement focused (top engagement hashtags)
  - Mixed balanced combination
  - Niche-specific subset

### Project Structure Notes

**Backend files:**
- `libraries/nestjs-libraries/src/database/prisma/playbooks/playbook-variant.service.ts`
- Extend `apps/backend/src/api/routes/playbooks.controller.ts`

**Frontend files:**
- Extend `apps/frontend/src/components/playbooks/playbook-detail.page.tsx`
- `apps/frontend/src/components/playbooks/variant-card.component.tsx`

### References

- [Source: docs/PRD.md#FR-018] - Variant generation requirements
- [Source: docs/epics.md#Epic-6] - Story 6.2 definition
- [Source: docs/stories/6-1-generate-playbooks-from-top-content.md] - Playbook structure

### Learnings from Previous Story

**From Story 6-1-generate-playbooks-from-top-content (Status: drafted)**

- **Playbook Schema**: Will be defined in Story 6.1, this story extends it
- **Service Pattern**: Follow PlaybookService pattern for PlaybookVariantService
- **API Pattern**: Extend existing playbooks controller with variant endpoints

[Source: docs/stories/6-1-generate-playbooks-from-top-content.md]

## Dev Agent Record

### Context Reference

- `docs/stories/6-2-generate-playbook-variants.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 6.2 drafted by SM agent
