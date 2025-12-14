# Story 3.3: Engagement Rate and Format Breakdown

Status: ready-for-dev

## Story

As a **Leader**,
I want **engagement rate calculation and breakdown by format**,
So that **I know which format (Posts vs Reels) is winning per niche**.

## Acceptance Criteria

1. **Given** metrics have reactions/comments/shares and reach (Story 2.3),
   **When** displaying the dashboard,
   **Then** engagement rate is calculated correctly using formula: (reactions + comments + shares) / reach × 100.

2. **And** dashboard displays format breakdown showing Posts vs Reels performance.

3. **And** engagement rate is calculated separately for each format.

4. **And** visualization highlights which format has better engagement for the selected filters.

## Tasks / Subtasks

### Backend Implementation

- [ ] Extend AnalyticsDashboardService (from Story 3.2)
  - [ ] getFormatBreakdown() - Aggregate metrics by contentType
  - [ ] Calculate engagement rate per format
  - [ ] Compare formats and identify winner
  - [ ] Handle edge cases (no posts, no reels, equal performance)

- [ ] Add API endpoint
  - [ ] GET /api/analytics/dashboard/format-breakdown
  - [ ] Query parameters: groupId, integrationIds[], startDate, endDate
  - [ ] Returns breakdown for each format with engagement rates
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Extend Dashboard component (from Story 3.2)
  - [ ] Add FormatBreakdownChart component
  - [ ] Display engagement rate per format
  - [ ] Highlight winning format
  - [ ] Show metrics comparison (reach, engagement, rate)

- [ ] Create visualization
  - [ ] Bar chart or donut chart for format distribution
  - [ ] Side-by-side comparison cards
  - [ ] Engagement rate indicator per format
  - [ ] Winner badge/highlight

- [ ] Implement data fetching
  - [ ] useFormatBreakdown() hook
  - [ ] Integrate with existing dashboard filters
  - [ ] Auto-refresh on filter change

### Testing

- [ ] Backend tests
  - [ ] Unit test: Engagement rate calculation accuracy
  - [ ] Unit test: Format breakdown aggregation
  - [ ] Test edge cases: no data, single format, equal rates

- [ ] Frontend tests
  - [ ] Component test: FormatBreakdownChart rendering
  - [ ] Integration test: Filter → API → chart display
  - [ ] Test winner highlighting logic

## Dev Notes

**Prerequisites:** Story 3.2 (Dashboard core with KPIs)

**Technical Stack:**
- Backend: Extends AnalyticsDashboardService
- Frontend: New component in dashboard
- Visualization: Chart library (existing in Postiz)

### Engagement Rate Formula

```
Engagement Rate = ((Reactions + Comments + Shares) / Reach) × 100
```

**Notes:**
- Use reach (unique impressions) not impressions (total)
- Handle null/undefined values (treat as 0)
- Return 0% if reach is 0
- Round to 1 decimal place for display

### Format Breakdown Aggregation

**Data Model:**
```typescript
{
  posts: {
    totalContent: 25,
    totalReach: 80000,
    totalEngagement: 4000,
    engagementRate: 5.0,
    metrics: {
      reactions: 2800,
      comments: 800,
      shares: 400
    }
  },
  reels: {
    totalContent: 20,
    totalReach: 70000,
    totalEngagement: 5600,
    engagementRate: 8.0,
    metrics: {
      reactions: 4200,
      comments: 1000,
      shares: 400,
      videoViews: 45000
    }
  },
  winner: 'reels',
  winnerBy: 3.0  // percentage point difference
}
```

### Backend Implementation

**Extend AnalyticsDashboardService:**

```typescript
async getFormatBreakdown(
  organizationId: string,
  filters: DashboardFiltersDto
): Promise<FormatBreakdownDto> {
  // Get content and metrics filtered by format
  const posts = await this.getFormatMetrics(organizationId, filters, 'post');
  const reels = await this.getFormatMetrics(organizationId, filters, 'reel');

  // Calculate engagement rates
  const postsEngagementRate = this.calculateEngagementRate(posts);
  const reelsEngagementRate = this.calculateEngagementRate(reels);

  // Determine winner
  const winner = reelsEngagementRate > postsEngagementRate ? 'reels' : 
                 postsEngagementRate > reelsEngagementRate ? 'posts' : 
                 'tie';
  const winnerBy = Math.abs(reelsEngagementRate - postsEngagementRate);

  return {
    posts: {
      totalContent: posts.count,
      totalReach: posts.totalReach,
      totalEngagement: posts.totalEngagement,
      engagementRate: postsEngagementRate,
      metrics: posts.metrics
    },
    reels: {
      totalContent: reels.count,
      totalReach: reels.totalReach,
      totalEngagement: reels.totalEngagement,
      engagementRate: reelsEngagementRate,
      metrics: reels.metrics
    },
    winner,
    winnerBy: winner !== 'tie' ? winnerBy : 0
  };
}

private async getFormatMetrics(
  organizationId: string,
  filters: DashboardFiltersDto,
  format: 'post' | 'reel'
) {
  const content = await this._prismaService.analyticsContent.findMany({
    where: {
      organizationId,
      contentType: format,
      publishedAt: {
        gte: filters.startDate,
        lte: filters.endDate
      },
      ...(filters.groupId && {
        integration: {
          groupMembers: {
            some: { groupId: filters.groupId }
          }
        }
      }),
      ...(filters.integrationIds && {
        integrationId: { in: filters.integrationIds }
      })
    },
    include: {
      metrics: {
        where: {
          date: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        }
      }
    }
  });

  // Aggregate all metrics
  const totalReach = content.reduce((sum, c) => 
    sum + c.metrics.reduce((s, m) => s + (m.reach || 0), 0), 0
  );
  const totalReactions = content.reduce((sum, c) =>
    sum + c.metrics.reduce((s, m) => s + (m.reactions || 0), 0), 0
  );
  const totalComments = content.reduce((sum, c) =>
    sum + c.metrics.reduce((s, m) => s + (m.comments || 0), 0), 0
  );
  const totalShares = content.reduce((sum, c) =>
    sum + c.metrics.reduce((s, m) => s + (m.shares || 0), 0), 0
  );
  const totalVideoViews = format === 'reel' ? content.reduce((sum, c) =>
    sum + c.metrics.reduce((s, m) => s + (m.videoViews || 0), 0), 0
  ) : null;

  return {
    count: content.length,
    totalReach,
    totalEngagement: totalReactions + totalComments + totalShares,
    metrics: {
      reactions: totalReactions,
      comments: totalComments,
      shares: totalShares,
      ...(format === 'reel' && { videoViews: totalVideoViews })
    }
  };
}

private calculateEngagementRate(formatData: any): number {
  if (formatData.totalReach === 0) return 0;
  return Math.round((formatData.totalEngagement / formatData.totalReach) * 1000) / 10;
}
```

### Frontend Implementation

**FormatBreakdownChart Component:**

```typescript
'use client';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const FormatBreakdownChart = ({ filters }) => {
  const fetch = useFetch();
  
  const { data, isLoading } = useSWR(
    `/analytics/dashboard/format-breakdown?${buildQueryString(filters)}`,
    async (url) => (await fetch(url)).json()
  );

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="bg-third p-[24px] rounded-[8px]">
      <h3 className="text-[18px] mb-[16px]">Format Performance</h3>
      
      <div className="flex gap-[16px]">
        {/* Posts Card */}
        <FormatCard
          format="Posts"
          icon="📝"
          data={data.posts}
          isWinner={data.winner === 'posts'}
        />

        {/* Reels Card */}
        <FormatCard
          format="Reels"
          icon="🎬"
          data={data.reels}
          isWinner={data.winner === 'reels'}
        />
      </div>

      {data.winner !== 'tie' && (
        <div className="mt-[16px] p-[12px] bg-primary rounded-[4px]">
          <p className="text-sm">
            <strong>{data.winner === 'posts' ? 'Posts' : 'Reels'}</strong> 
            {' '}performing {data.winnerBy.toFixed(1)}% better in engagement rate
          </p>
        </div>
      )}

      <FormatComparisonChart data={data} />
    </div>
  );
};

const FormatCard = ({ format, icon, data, isWinner }) => (
  <div className={`flex-1 p-[16px] rounded-[6px] border-2 ${
    isWinner ? 'border-green-500 bg-green-50/10' : 'border-fifth'
  }`}>
    {isWinner && (
      <span className="text-xs px-[8px] py-[4px] bg-green-500 text-white rounded-full">
        Winner
      </span>
    )}
    <div className="flex items-center gap-[8px] mt-[8px]">
      <span className="text-[24px]">{icon}</span>
      <h4 className="text-[16px]">{format}</h4>
    </div>
    <div className="mt-[12px] space-y-[8px]">
      <MetricRow label="Content" value={data.totalContent} />
      <MetricRow label="Reach" value={data.totalReach.toLocaleString()} />
      <MetricRow label="Engagement" value={data.totalEngagement.toLocaleString()} />
      <div className="pt-[8px] border-t border-fifth">
        <MetricRow 
          label="Engagement Rate" 
          value={`${data.engagementRate}%`}
          highlight={true}
        />
      </div>
    </div>
  </div>
);
```

### UI/UX Design

**Format Breakdown Section (added to Dashboard):**

```
┌──────────────────────────────────────────────┐
│ Format Performance                           │
├──────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐  │
│ │ 📝 Posts         │  │ 🎬 Reels [Winner]│  │
│ │                  │  │                  │  │
│ │ Content: 25      │  │ Content: 20      │  │
│ │ Reach: 80K       │  │ Reach: 70K       │  │
│ │ Engagement: 4K   │  │ Engagement: 5.6K │  │
│ │ ─────────────    │  │ ─────────────    │  │
│ │ Rate: 5.0%       │  │ Rate: 8.0% ✓     │  │
│ └──────────────────┘  └──────────────────┘  │
│                                              │
│ Reels performing 3.0% better in engagement  │
│                                              │
│ [Chart: Format Comparison]                  │
└──────────────────────────────────────────────┘
```

### API Design

**GET /api/analytics/dashboard/format-breakdown**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
}
```

Response:
```json
{
  "posts": {
    "totalContent": 25,
    "totalReach": 80000,
    "totalEngagement": 4000,
    "engagementRate": 5.0,
    "metrics": {
      "reactions": 2800,
      "comments": 800,
      "shares": 400
    }
  },
  "reels": {
    "totalContent": 20,
    "totalReach": 70000,
    "totalEngagement": 5600,
    "engagementRate": 8.0,
    "metrics": {
      "reactions": 4200,
      "comments": 1000,
      "shares": 400,
      "videoViews": 45000
    }
  },
  "winner": "reels",
  "winnerBy": 3.0
}
```

### Performance Considerations

**Optimization:**
- Reuse existing dashboard filters from Story 3.2
- Cache format breakdown for 10 minutes (same as other dashboard data)
- Combine with KPIs query if possible to reduce API calls

**Query Strategy:**
- Use existing indexes on (organizationId, contentType, publishedAt)
- Fetch both formats in parallel if separate queries needed
- Aggregate in application layer (already fetching content for top content)

### Edge Cases

**No Posts:**
- Show "No posts found" in posts card
- Reels automatically win
- Display appropriate message

**No Reels:**
- Show "No reels found" in reels card
- Posts automatically win
- Display appropriate message

**Equal Engagement Rate:**
- Set winner to 'tie'
- Show message: "Both formats performing equally"
- No winner badge

**Zero Reach:**
- Engagement rate = 0%
- Display "—" or "No data"
- Don't show winner

### References

- [Source: docs/epics.md#Story-3.3-Tính-engagement-rate-và-breakdown-theo-format]
- FR coverage: FR-009 (extended), FR-013 (preparation)
- Story 3.2: Base dashboard implementation

### Related Files

- `docs/stories/3-2-dashboard-filters-kpis-top-content.md` - Base dashboard
- `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-dashboard.service.ts` - Extend this service
- `apps/frontend/src/components/analytics/dashboard/` - Add FormatBreakdown component

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 2-3 hours
- Extend service: 1 hour
- API endpoint: 0.5 hours
- Testing: 0.5-1 hours
- Edge case handling: 0.5 hours

**Frontend:** 3-4 hours
- FormatBreakdown component: 1.5 hours
- Chart/visualization: 1 hour
- Integration with dashboard: 0.5 hours
- Testing: 0.5-1 hours

**Total:** 5-7 hours (1 focused session)

### Definition of Done

- [ ] Backend service calculates engagement rate correctly for each format
- [ ] API endpoint returns format breakdown with winner
- [ ] Frontend displays format comparison cards
- [ ] Winner is highlighted visually
- [ ] Edge cases handled (no posts, no reels, tie)
- [ ] Engagement rate formula verified (unit tests)
- [ ] Component tests for format breakdown
- [ ] Swagger documentation updated
- [ ] Code follows Postiz patterns
- [ ] Integration with Story 3.2 dashboard complete
- [ ] Story marked as done in sprint-status.yaml

## Story Context Requirements

Before starting implementation, review:

1. **From Story 3.2:**
   - AnalyticsDashboardService structure
   - Dashboard component layout
   - Filter implementation
   - Data fetching patterns

2. **From Story 2.3:**
   - AnalyticsDailyMetric schema
   - Metrics fields (reach, reactions, comments, shares, videoViews)
   - Nullable field handling

3. **From Story 2.2:**
   - AnalyticsContent schema
   - contentType field values ('post', 'reel', 'story')
   - publishedAt field for filtering

4. **From existing codebase:**
   - Chart component library
   - Color scheme for winner highlighting
   - Card component patterns

## Success Metrics

**User Metrics:**
- Leaders can identify winning format in <5 seconds
- Format breakdown loads in <2 seconds
- Clear visual distinction between formats

**Technical Metrics:**
- Engagement rate calculation 100% accurate
- API response time <500ms (p95)
- Zero calculation errors

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 3.2 (Dashboard core) is complete
- [ ] AnalyticsDashboardService exists and is testable
- [ ] Dashboard component structure identified
- [ ] Chart library available in frontend
- [ ] Engagement rate formula validated

### Implementation Notes

**Critical Path:**
1. Backend service extension (blocking)
2. API endpoint (blocking)
3. Frontend component (can parallelize)

**Risk Areas:**
- Engagement rate calculation accuracy
- Edge case handling (no data, tie)
- Visual distinction for winner

**Recommendations:**
- Start with backend and verify calculations
- Add comprehensive unit tests for edge cases
- Use existing card components from Postiz
- Consider A/B testing winner highlight color

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met (Story 3.2), requirements clear, extends existing dashboard.

---

## Integration with Story 3.2

Story 3.3 **extends** the dashboard from Story 3.2:

**Dashboard Layout (after Story 3.3):**
```
┌─────────────┬────────────────────────────────┐
│ Filters     │ KPI Cards (Story 3.2)          │
│             ├────────────────────────────────┤
│ Group: [▼]  │ Format Breakdown (Story 3.3)   │
│ Pages: [▼]  ├────────────────────────────────┤
│ Date: [📅]  │ Top Content List (Story 3.2)   │
│ Format: [○] │                                │
└─────────────┴────────────────────────────────┘
```

**Shared Context:**
- Same filters apply to both KPIs and format breakdown
- Format filter can highlight selected format
- Data fetched once and shared if possible

**API Coordination:**
- Format breakdown can be separate endpoint OR
- Combined with KPIs endpoint (single API call)
- Decision: Separate for cleaner separation of concerns

---

## Additional Insights

**Niche-Specific Analysis:**
When groupId is selected (via filters from Story 3.2), format breakdown shows which format works better **for that specific niche**.

Example use cases:
- "Tech niche" → Reels at 8% vs Posts at 5%
- "Sports niche" → Posts at 7% vs Reels at 6%

This helps Leaders optimize content strategy per niche.

**Future Enhancements (Not MVP):**
- Time-series chart showing format performance over time
- Format breakdown by hashtag
- Recommended posting schedule per format
- A/B test suggestions
