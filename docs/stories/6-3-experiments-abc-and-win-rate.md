# Story 6.3: Experiments A/B/C and Win Rate

Status: ready-for-dev

## Story

As a **Leader**,
I want **to create A/B/C experiments from playbook variants**,
So that **the system can track which variant wins and update the playbook score accordingly**.

## Acceptance Criteria

1. **Given** playbook variants exist,
   **When** the user creates an experiment,
   **Then** they can select 2-3 variants to test against each other.

2. **Given** an experiment is created,
   **When** the user configures the experiment,
   **Then** they can set:
   - Experiment name
   - Timeframe (start date, end date)
   - Success metric (reach, engagement rate, or combined)

3. **Given** an active experiment,
   **When** content is posted using experiment variants,
   **Then** the system tracks performance metrics for each variant.

4. **Given** an experiment has completed (timeframe ended),
   **When** the user views results,
   **Then** the system shows:
   - Win rate per variant
   - Statistical comparison of metrics
   - Clear winner declaration (if statistically significant)

5. **Given** an experiment has a winner,
   **When** the winner is confirmed,
   **Then** the playbook score is updated to reflect the winning formula.

6. **Given** experiments exist,
   **When** the user accesses the Experiments page,
   **Then** experiments are listed with status (active/completed) and can be filtered.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create Experiment Prisma schema (AC: #1, #2)
  - [ ] Define Experiment model with fields: id, name, playbookId, status (draft/active/completed), startDate, endDate, successMetric, winnerId, createdAt, updatedAt
  - [ ] Define ExperimentVariant model linking experiment to variants
  - [ ] Define ExperimentResult model for tracking variant performance
  - [ ] Run migration

- [ ] Create ExperimentService (AC: #1, #2, #6)
  - [ ] Implement `createExperiment(playbookId, variants, config)` method
  - [ ] Implement `getExperiments(organizationId, filters)` method
  - [ ] Implement `getExperimentById(id)` with variants and results
  - [ ] Implement `startExperiment(id)` to activate experiment
  - [ ] Implement `completeExperiment(id)` to finalize and calculate winner

- [ ] Create ExperimentTrackingService (AC: #3)
  - [ ] Implement `trackContent(experimentId, variantId, contentId)` to associate content with variant
  - [ ] Implement `updateMetrics(experimentId)` to aggregate metrics from tracked content
  - [ ] Schedule periodic metric updates for active experiments

- [ ] Create ExperimentAnalysisService (AC: #4, #5)
  - [ ] Implement `calculateWinRate(experimentId)` method
  - [ ] Implement `determineWinner(experimentId)` with statistical significance check
  - [ ] Implement `updatePlaybookScore(playbookId, winningVariantId)` method

- [ ] Add Experiment API endpoints (AC: #1, #2, #6)
  - [ ] POST /api/experiments - Create experiment
  - [ ] GET /api/experiments - List experiments with filters
  - [ ] GET /api/experiments/:id - Get experiment details
  - [ ] POST /api/experiments/:id/start - Start experiment
  - [ ] POST /api/experiments/:id/complete - Complete experiment
  - [ ] POST /api/experiments/:id/track - Track content for experiment
  - [ ] GET /api/experiments/:id/results - Get experiment results
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Create Experiments page (AC: #6)
  - [ ] Add route /experiments
  - [ ] Create ExperimentsListPage component
  - [ ] Display experiments in table with status badges
  - [ ] Add filters for status, playbook

- [ ] Create Experiment creation flow (AC: #1, #2)
  - [ ] Create CreateExperimentModal component
  - [ ] Variant selection step (from playbook)
  - [ ] Configuration step (name, timeframe, metric)
  - [ ] Review and create step

- [ ] Create Experiment detail view (AC: #3, #4)
  - [ ] Create ExperimentDetailPage component
  - [ ] Show experiment configuration
  - [ ] Display variant performance comparison (chart)
  - [ ] Show tracked content per variant
  - [ ] Display winner when experiment completed

- [ ] Create Experiment results view (AC: #4, #5)
  - [ ] Create ExperimentResultsCard component
  - [ ] Show win rate visualization
  - [ ] Display statistical comparison
  - [ ] Add "Confirm Winner" action to update playbook

### Testing

- [ ] Backend tests
  - [ ] Unit test: Experiment creation and validation
  - [ ] Unit test: Win rate calculation
  - [ ] Unit test: Statistical significance check
  - [ ] Unit test: Playbook score update
  - [ ] Integration test: Full experiment lifecycle

- [ ] Frontend tests
  - [ ] Component test: ExperimentsListPage
  - [ ] Component test: CreateExperimentModal
  - [ ] Component test: ExperimentResultsCard

## Dev Notes

**Prerequisites:**
- Story 6.1 complete (Playbook generation)
- Story 6.2 complete (Playbook variants)

**Technical Stack:**
- Backend: NestJS, Prisma ORM
- Frontend: React, TypeScript
- Charts: Recharts or similar for result visualization

### Experiment Lifecycle

1. **Draft**: Experiment created, variants selected, not yet active
2. **Active**: Experiment started, tracking content performance
3. **Completed**: Timeframe ended, results calculated, winner determined

### Win Rate Calculation

```
Win Rate = (Variant Metric / Sum of All Variant Metrics) * 100

For engagement rate metric:
- Calculate average engagement rate per variant
- Compare variants using relative performance

For reach metric:
- Calculate total reach per variant
- Normalize by content count

Statistical Significance:
- Minimum 5 content items per variant required
- Use simple comparison (>10% difference = significant)
- Future: Add proper statistical tests (t-test, chi-square)
```

### Content Tracking

Content can be manually associated with experiment variants:
- User posts content using variant recipe
- User marks content as belonging to experiment variant
- System tracks metrics for that content

[ASSUMPTION: Manual content tracking initially, automatic detection can be added later]

### Project Structure Notes

**Backend files:**
- `libraries/nestjs-libraries/src/database/prisma/experiments/experiment.service.ts`
- `libraries/nestjs-libraries/src/database/prisma/experiments/experiment-tracking.service.ts`
- `libraries/nestjs-libraries/src/database/prisma/experiments/experiment-analysis.service.ts`
- `apps/backend/src/api/routes/experiments.controller.ts`

**Frontend files:**
- `apps/frontend/src/app/(site)/experiments/page.tsx`
- `apps/frontend/src/components/experiments/experiments-list.page.tsx`
- `apps/frontend/src/components/experiments/experiment-detail.page.tsx`
- `apps/frontend/src/components/experiments/create-experiment.modal.tsx`

### References

- [Source: docs/PRD.md#FR-019] - Experiment and win rate requirements
- [Source: docs/epics.md#Epic-6] - Story 6.3 definition
- [Source: docs/stories/6-1-generate-playbooks-from-top-content.md] - Playbook structure
- [Source: docs/stories/6-2-generate-playbook-variants.md] - Variant structure

### Learnings from Previous Stories

**From Story 6-1 and 6-2 (Status: drafted)**

- **Playbook Schema**: Defined in Story 6.1
- **Variant Schema**: Defined in Story 6.2
- **Service Pattern**: Follow established patterns for new services
- **API Pattern**: Use Swagger decorators, follow REST conventions

[Source: docs/stories/6-1-generate-playbooks-from-top-content.md]
[Source: docs/stories/6-2-generate-playbook-variants.md]

## Dev Agent Record

### Context Reference

- `docs/stories/6-3-experiments-abc-and-win-rate.context.xml`

### Agent Model Used

Claude (Cascade)

### Debug Log References

### Completion Notes List

### File List

## Change Log

- 2025-12-14: Story 6.3 drafted by SM agent
