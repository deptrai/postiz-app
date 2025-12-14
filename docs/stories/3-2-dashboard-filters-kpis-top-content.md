# Story 3.2: Dashboard core — filter + KPI cards + top posts/reels

Status: ready-for-dev

## Story

As a **Leader**,
I want **a dashboard with filters and KPI cards showing top posts/reels**,
So that **I can quickly see what's working well across my tracked pages**.

## Acceptance Criteria

1. **Given** daily metrics are available (Story 2.3),
   **When** Leader selects page/group/niche + date range + format,
   **Then** dashboard displays KPI cards (reach/views, engagement, engagement rate).

2. **And** displays a list of top content ranked by selected KPI.

3. **And** filters persist across page refreshes (URL params or local storage).

4. **And** dashboard updates when filters change without full page reload.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AnalyticsDashboardService
  - [ ] getKPIs() - Calculate aggregated KPIs for filters
  - [ ] getTopContent() - Query top content by KPI
  - [ ] Support filters: groupId, integrationIds, dateRange, format
  - [ ] Aggregate metrics from AnalyticsDailyMetric
  - [ ] Calculate engagement rate: (reactions + comments + shares) / reach

- [ ] Implement API endpoints
  - [ ] GET /api/analytics/dashboard/kpis - Get KPI summary
  - [ ] GET /api/analytics/dashboard/top-content - Get top posts/reels
  - [ ] Query parameters: groupId, integrationIds[], startDate, endDate, format, limit
  - [ ] Add Swagger documentation

- [ ] Add validation
  - [ ] Date range max 90 days
  - [ ] Format: 'post' | 'reel' | 'all'
  - [ ] integrationIds belong to organization
  - [ ] groupId belongs to organization

### Frontend Implementation

- [ ] Create Dashboard page component
  - [ ] Route: /analytics/dashboard
  - [ ] Layout: filters sidebar + KPI cards + content list

- [ ] Build filter components
  - [ ] GroupSelector - Dropdown for page groups
  - [ ] IntegrationMultiSelect - Multi-select for individual pages
  - [ ] DateRangePicker - Start/end date selection
  - [ ] FormatFilter - Radio buttons (All/Posts/Reels)

- [ ] Build KPI cards
  - [ ] TotalReach card with trend indicator
  - [ ] TotalEngagement card with trend indicator
  - [ ] EngagementRate card with trend indicator
  - [ ] AverageViews card (for reels)

- [ ] Build TopContent component
  - [ ] Content list with thumbnails
  - [ ] Display: caption, format, publishedAt, metrics
  - [ ] Sortable by: reach, engagement, engagement rate
  - [ ] Pagination (10-20 items per page)

- [ ] Implement data fetching
  - [ ] useDashboardKPIs() hook
  - [ ] useTopContent() hook
  - [ ] Auto-refresh on filter change
  - [ ] Loading states and error handling

### Testing

- [ ] Backend tests
  - [ ] Unit test: KPI calculation accuracy
  - [ ] Unit test: Top content ranking
  - [ ] Integration test: Filter combinations
  - [ ] Test edge cases: no data, single day, large date range

- [ ] Frontend tests
  - [ ] Component tests: filters, KPI cards
  - [ ] Integration test: filter → API → display
  - [ ] E2E test: Full dashboard workflow

## Dev Notes

**Prerequisites:** 
- Story 2.3 (Ingest Daily Metrics) - Provides AnalyticsDailyMetric data
- Story 3.1 (Manage Page Groups) - Provides group filtering

**Technical Stack:**
- Backend: NestJS, Prisma
- Frontend: React/Next.js, SWR or React Query for data fetching
- UI: Existing Postiz components, Tailwind CSS

### Data Aggregation Strategy

**KPI Calculation:**

```typescript
// Example aggregation query
const kpis = await prisma.analyticsDailyMetric.groupBy({
  by: ['date'],
  where: {
    organizationId,
    date: { gte: startDate, lte: endDate },
    ...(groupId && {
      integration: {
        groupMembers: {
          some: { groupId }
        }
      }
    }),
    ...(integrationIds && {
      integrationId: { in: integrationIds }
    })
  },
  _sum: {
    reach: true,
    impressions: true,
    reactions: true,
    comments: true,
    shares: true,
    videoViews: true
  }
});

// Calculate engagement rate
const totalReach = kpis.reduce((sum, k) => sum + (k._sum.reach || 0), 0);
const totalEngagement = kpis.reduce((sum, k) => 
  sum + (k._sum.reactions || 0) + (k._sum.comments || 0) + (k._sum.shares || 0), 0
);
const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;
```

**Top Content Query:**

```typescript
const topContent = await prisma.analyticsContent.findMany({
  where: {
    organizationId,
    publishedAt: { gte: startDate, lte: endDate },
    ...(format !== 'all' && { contentType: format })
  },
  include: {
    metrics: {
      where: {
        date: { gte: startDate, lte: endDate }
      }
    }
  },
  orderBy: {
    metrics: {
      _sum: {
        [sortBy]: 'desc' // reach, reactions, etc.
      }
    }
  },
  take: limit
});
```

### UI/UX Design

**Dashboard Layout:**

```
┌─────────────────────────────────────────────────────────┐
│ Analytics Dashboard                                      │
├─────────────┬───────────────────────────────────────────┤
│ Filters     │ KPI Cards                                 │
│             │ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ Group: [▼]  │ │Reach│ │Eng. │ │Eng %│ │Views│           │
│             │ │100K │ │5.2K │ │5.2% │ │25K  │           │
│ Pages: [▼]  │ │↑12% │ │↑8%  │ │↓2%  │ │↑15% │           │
│             │ └─────┘ └─────┘ └─────┘ └─────┘           │
│ Date Range: │                                           │
│ [📅 Start]  │ Top Content                               │
│ [📅 End]    │ ┌─────────────────────────────────────┐   │
│             │ │ [img] Post title/caption            │   │
│ Format:     │ │ 50K reach | 2.5K eng | 5% rate      │   │
│ ○ All       │ ├─────────────────────────────────────┤   │
│ ○ Posts     │ │ [img] Reel title/caption            │   │
│ ○ Reels     │ │ 30K reach | 1.8K eng | 6% rate      │   │
│             │ └─────────────────────────────────────┘   │
└─────────────┴───────────────────────────────────────────┘
```

**Filter Behavior:**

1. **Group selection** → Auto-loads pages in group → Updates KPIs
2. **Individual pages** → Overrides group selection → Updates KPIs
3. **Date range** → Validates max 90 days → Updates KPIs
4. **Format filter** → Filters content type → Updates top content list

**Trend Indicators:**

- Compare current period vs previous period
- Green ↑ for improvement, Red ↓ for decline
- Percentage change displayed

### API Design

**GET /api/analytics/dashboard/kpis**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];  // comma-separated
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD
  format?: 'post' | 'reel' | 'all';
}
```

Response:
```typescript
{
  period: {
    startDate: '2025-01-01',
    endDate: '2025-01-14'
  },
  kpis: {
    totalReach: 150000,
    totalImpressions: 200000,
    totalEngagement: 7500,
    engagementRate: 5.0,
    averageViews: 25000,  // For reels
    totalContent: 45
  },
  trends: {
    reachChange: 12.5,      // % vs previous period
    engagementChange: 8.2,
    engagementRateChange: -2.1
  }
}
```

**GET /api/analytics/dashboard/top-content**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];
  startDate: string;
  endDate: string;
  format?: 'post' | 'reel' | 'all';
  sortBy?: 'reach' | 'engagement' | 'engagementRate' | 'videoViews';
  limit?: number;           // Default: 20, Max: 100
  offset?: number;          // For pagination
}
```

Response:
```typescript
{
  content: [
    {
      id: 'content-uuid',
      externalContentId: 'fb_post_123',
      contentType: 'post',
      caption: 'Amazing product launch...',
      hashtags: ['#tech', '#startup'],
      publishedAt: '2025-01-10T10:00:00Z',
      integration: {
        name: 'TechCrunch',
        picture: 'https://...'
      },
      metrics: {
        totalReach: 50000,
        totalImpressions: 75000,
        totalEngagement: 2500,
        engagementRate: 5.0,
        reactions: 1800,
        comments: 500,
        shares: 200,
        videoViews: null
      }
    }
  ],
  pagination: {
    total: 45,
    limit: 20,
    offset: 0,
    hasMore: true
  }
}
```

### Performance Considerations

**Caching Strategy:**
- Cache KPIs for 5 minutes (frequent queries)
- Cache top content for 10 minutes
- Invalidate on new data ingestion

**Query Optimization:**
- Use Prisma aggregations for KPIs
- Index on (organizationId, date, integrationId)
- Limit date range to 90 days max
- Pagination for top content

**Frontend Optimization:**
- Debounce filter changes (300ms)
- Use SWR or React Query for caching
- Skeleton loaders for better UX
- Lazy load content thumbnails

### Edge Cases

**No Data:**
- Display empty state with CTA to track pages
- Show "No data for selected filters" message

**Single Day:**
- No trend comparison (show N/A)
- Still display KPIs for that day

**Large Date Range:**
- Validate max 90 days
- Show warning if performance degrades

**Mixed Content Types:**
- Handle null videoViews for posts
- Calculate engagement rate consistently

### References

- [Source: docs/epics.md#Story-3.2-Dashboard-core]
- FR coverage: FR-008, FR-009
- PRD: Dashboard Analytics section

### Related Stories

- Story 2.3: Provides AnalyticsDailyMetric data
- Story 3.1: Provides group filtering
- Story 3.3: Will add engagement rate breakdown (extends this dashboard)

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 4-6 hours
- Service layer: 2 hours
- API endpoints: 1 hour
- Testing: 1-2 hours
- Optimization: 1 hour

**Frontend:** 6-8 hours
- Components: 3 hours
- Data fetching: 1 hour
- Styling: 2 hours
- Testing: 1-2 hours
- Polish: 1 hour

**Total:** 10-14 hours (1-2 focused sessions)

### Definition of Done

- [ ] Backend service implements all KPI calculations
- [ ] API endpoints return correct data for all filter combinations
- [ ] Frontend displays KPIs with trend indicators
- [ ] Top content list is sortable and paginated
- [ ] Filters persist across page refreshes
- [ ] Loading states and error handling implemented
- [ ] Unit tests for KPI calculations
- [ ] Integration tests for API endpoints
- [ ] Component tests for filters and KPI cards
- [ ] Swagger documentation updated
- [ ] Code reviewed and merged
- [ ] Story marked as done in sprint-status.yaml

## Story Context Requirements

Before starting implementation, gather:

1. **From Story 2.3:**
   - AnalyticsDailyMetric schema
   - Available metrics fields
   - Data availability patterns

2. **From Story 3.1:**
   - AnalyticsGroup structure
   - Group-to-page relationships
   - Group query methods

3. **From PRD:**
   - KPI definitions
   - Engagement rate formula
   - Dashboard requirements

4. **From existing codebase:**
   - Postiz UI component library
   - Data fetching patterns (SWR/React Query)
   - Authentication/authorization flow

## Success Metrics

**User Metrics:**
- Leaders can view dashboard within 2 clicks
- KPIs load in <2 seconds
- Filters apply in <1 second
- Top content list loads in <3 seconds

**Technical Metrics:**
- API response time <500ms (p95)
- Cache hit rate >70%
- Zero data inconsistencies
- Test coverage >80%

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 2.3 (Daily Metrics) is complete
- [ ] Story 3.1 (Page Groups) is complete
- [ ] Prisma schema includes all required fields
- [ ] Frontend routing structure identified
- [ ] UI component library available
- [ ] Data fetching pattern decided (SWR vs React Query)

### Implementation Notes

**Critical Path:**
1. Backend service layer (blocking)
2. API endpoints (blocking)
3. Frontend components (can parallelize)

**Risk Areas:**
- Query performance for large date ranges
- Trend calculation accuracy
- Filter state management

**Recommendations:**
- Start with backend to validate data availability
- Create reusable filter components
- Implement caching early for performance
- Add comprehensive logging for debugging

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met, requirements clear, implementation path defined.
