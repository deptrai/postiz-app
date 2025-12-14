# Story 4.2: Trending Topics/Pillars by Velocity (24-72h)

Status: ready-for-dev

## Story

As a **Leader**,
I want **a list of trending topics/pillars by velocity**,
So that **I can catch trends quickly within each niche**.

## Acceptance Criteria

1. **Given** tags and metrics time-series (Stories 4.1, 2.3),
   **When** Leader views Insights,
   **Then** system displays top trending topics/pillars by group/niche.

2. **And** trend shows "why" explanation (velocity + metrics).

3. **And** trending is calculated over 24-72 hour windows.

4. **And** trends can be filtered by group/niche.

5. **And** trending topics are ranked by velocity score.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AnalyticsTrendingService
  - [ ] calculateTagVelocity() - Tag mention velocity over time windows
  - [ ] getTrendingTopics() - Top trending tags by velocity
  - [ ] Support multiple time windows (24h, 48h, 72h)
  - [ ] Filter by group/niche
  - [ ] Include "why trending" metrics

- [ ] Velocity Calculation
  - [ ] Count tag mentions per period
  - [ ] Calculate engagement per tag
  - [ ] Compute velocity score
  - [ ] Rank by velocity
  - [ ] Handle edge cases (new tags, zero baseline)

- [ ] API Endpoints
  - [ ] GET /api/analytics/trending/topics - Get trending topics
  - [ ] Query params: groupId, timeWindow, limit
  - [ ] Response includes velocity metrics
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Trending Topics Widget
  - [ ] Display on dashboard/insights page
  - [ ] Show top 5-10 trending topics
  - [ ] Velocity indicator (↗️ trending up)
  - [ ] "Why trending" tooltip/details
  - [ ] Time window selector (24h/48h/72h)

- [ ] Topic Details
  - [ ] Tag name and type (AUTO/MANUAL)
  - [ ] Velocity percentage
  - [ ] Current mentions vs previous period
  - [ ] Engagement metrics
  - [ ] Trend direction icon

### Testing

- [ ] Backend tests
  - [ ] Unit test: Velocity calculation
  - [ ] Unit test: Ranking algorithm
  - [ ] Test edge cases: new tags, zero baseline
  - [ ] Integration test: API endpoints

- [ ] Frontend tests
  - [ ] Component test: Trending widget
  - [ ] Test time window switching
  - [ ] Test empty state

## Dev Notes

**Prerequisites:**
- Story 4.1 (Auto tagging - provides tag data)
- Story 2.3 (Daily metrics - provides engagement data)
- Story 3.1 (Groups - for niche filtering)

**Technical Stack:**
- Backend: NestJS, Prisma
- Frontend: React, existing dashboard components
- Data: AnalyticsTag, AnalyticsContentTag, AnalyticsDailyMetric

### Velocity Calculation Formula

**Velocity Score:**
```
Velocity = ((Current Period Mentions - Previous Period Mentions) / Previous Period Mentions) × 100
```

**With Engagement Weight:**
```
Weighted Velocity = (Mention Velocity × 0.4) + (Engagement Velocity × 0.6)

Where:
- Mention Velocity = Change in tag mention count
- Engagement Velocity = Change in avg engagement per tagged content
```

**Example:**
```
Tag: "AI"

Previous 24h:
- Mentions: 10 content items
- Total engagement: 500 (avg 50 per item)

Current 24h:
- Mentions: 18 content items
- Total engagement: 1260 (avg 70 per item)

Mention Velocity = ((18 - 10) / 10) × 100 = 80%
Engagement Velocity = ((70 - 50) / 50) × 100 = 40%
Weighted Velocity = (80 × 0.4) + (40 × 0.6) = 32 + 24 = 56%
```

### Service Implementation

**AnalyticsTrendingService:**

```typescript
@Injectable()
export class AnalyticsTrendingService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get trending topics by velocity
   */
  async getTrendingTopics(
    organizationId: string,
    options: {
      groupId?: string;
      integrationIds?: string[];
      timeWindow: '24h' | '48h' | '72h';
      limit?: number;
    }
  ) {
    const limit = options.limit || 10;
    const hours = this.parseTimeWindow(options.timeWindow);

    // Calculate current and previous periods
    const now = new Date();
    const currentPeriodStart = dayjs(now).subtract(hours, 'hours').toDate();
    const previousPeriodStart = dayjs(now).subtract(hours * 2, 'hours').toDate();
    const previousPeriodEnd = currentPeriodStart;

    // Get integration IDs if groupId provided
    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // Get tags with mentions in current period
    const currentPeriodTags = await this.getTagMentions(
      organizationId,
      integrationIds,
      currentPeriodStart,
      now
    );

    // Get tags with mentions in previous period
    const previousPeriodTags = await this.getTagMentions(
      organizationId,
      integrationIds,
      previousPeriodStart,
      previousPeriodEnd
    );

    // Calculate velocity for each tag
    const trendingTags = this.calculateVelocities(
      currentPeriodTags,
      previousPeriodTags
    );

    // Sort by velocity score (descending)
    const sorted = trendingTags.sort((a, b) => b.velocityScore - a.velocityScore);

    // Return top N
    return sorted.slice(0, limit);
  }

  private async getTagMentions(
    organizationId: string,
    integrationIds: string[],
    startDate: Date,
    endDate: Date
  ) {
    // Get content with tags in period
    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        publishedAt: { gte: startDate, lte: endDate },
        ...(integrationIds.length > 0 && {
          integrationId: { in: integrationIds }
        })
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    // Aggregate by tag
    const tagMap = new Map<string, {
      tag: any;
      mentions: number;
      totalEngagement: number;
      contentIds: Set<string>;
    }>();

    for (const item of content) {
      for (const { tag } of item.tags) {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, {
            tag,
            mentions: 0,
            totalEngagement: 0,
            contentIds: new Set()
          });
        }

        const tagData = tagMap.get(tag.id)!;
        tagData.contentIds.add(item.id);
        tagData.mentions = tagData.contentIds.size;

        // Aggregate engagement for this content
        const contentEngagement = item.metrics.reduce((sum, m) =>
          sum + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0), 0
        );
        tagData.totalEngagement += contentEngagement;
      }
    }

    return Array.from(tagMap.values()).map(data => ({
      tag: data.tag,
      mentions: data.mentions,
      totalEngagement: data.totalEngagement,
      avgEngagement: data.mentions > 0 ? data.totalEngagement / data.mentions : 0
    }));
  }

  private calculateVelocities(
    currentPeriod: any[],
    previousPeriod: any[]
  ) {
    const previousMap = new Map(
      previousPeriod.map(item => [item.tag.id, item])
    );

    return currentPeriod.map(current => {
      const previous = previousMap.get(current.tag.id);

      if (!previous) {
        // New tag - 100% velocity (from 0 to current)
        return {
          tag: current.tag,
          currentMentions: current.mentions,
          previousMentions: 0,
          mentionVelocity: 100,
          currentAvgEngagement: current.avgEngagement,
          previousAvgEngagement: 0,
          engagementVelocity: 100,
          velocityScore: 100,
          isNew: true
        };
      }

      // Calculate mention velocity
      const mentionVelocity = previous.mentions > 0
        ? ((current.mentions - previous.mentions) / previous.mentions) * 100
        : 0;

      // Calculate engagement velocity
      const engagementVelocity = previous.avgEngagement > 0
        ? ((current.avgEngagement - previous.avgEngagement) / previous.avgEngagement) * 100
        : 0;

      // Weighted velocity score
      const velocityScore = (mentionVelocity * 0.4) + (engagementVelocity * 0.6);

      return {
        tag: current.tag,
        currentMentions: current.mentions,
        previousMentions: previous.mentions,
        mentionVelocity: Math.round(mentionVelocity * 10) / 10,
        currentAvgEngagement: Math.round(current.avgEngagement),
        previousAvgEngagement: Math.round(previous.avgEngagement),
        engagementVelocity: Math.round(engagementVelocity * 10) / 10,
        velocityScore: Math.round(velocityScore * 10) / 10,
        isNew: false
      };
    }).filter(item => item.velocityScore > 0); // Only trending up
  }

  private parseTimeWindow(window: string): number {
    const map = { '24h': 24, '48h': 48, '72h': 72 };
    return map[window] || 24;
  }

  private async getIntegrationIdsFromGroup(
    organizationId: string,
    groupId: string
  ): Promise<string[]> {
    const group = await this._prismaService.analyticsGroup.findFirst({
      where: {
        id: groupId,
        organizationId,
        deletedAt: null
      },
      include: {
        members: {
          include: {
            trackedIntegration: true
          }
        }
      }
    });

    if (!group) return [];

    return group.members.map(m => m.trackedIntegration.integrationId);
  }
}
```

### API Design

**GET /api/analytics/trending/topics**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];
  timeWindow: '24h' | '48h' | '72h';
  limit?: number;  // Default: 10, Max: 50
}
```

Response:
```json
{
  "timeWindow": "24h",
  "generatedAt": "2025-01-14T10:00:00Z",
  "trending": [
    {
      "tag": {
        "id": "tag-uuid",
        "name": "ai",
        "type": "AUTO"
      },
      "currentMentions": 18,
      "previousMentions": 10,
      "mentionVelocity": 80.0,
      "currentAvgEngagement": 70,
      "previousAvgEngagement": 50,
      "engagementVelocity": 40.0,
      "velocityScore": 56.0,
      "isNew": false,
      "whyTrending": "80% increase in mentions and 40% increase in engagement"
    },
    {
      "tag": {
        "id": "tag-uuid-2",
        "name": "startup",
        "type": "AUTO"
      },
      "currentMentions": 12,
      "previousMentions": 8,
      "mentionVelocity": 50.0,
      "currentAvgEngagement": 85,
      "previousAvgEngagement": 60,
      "engagementVelocity": 41.7,
      "velocityScore": 45.0,
      "isNew": false,
      "whyTrending": "50% increase in mentions and 42% increase in engagement"
    }
  ]
}
```

### Controller Implementation

```typescript
@Get('/trending/topics')
@ApiOperation({ summary: 'Get trending topics by velocity' })
@ApiQuery({ name: 'groupId', required: false })
@ApiQuery({ name: 'integrationIds', required: false, type: [String] })
@ApiQuery({ name: 'timeWindow', required: false, enum: ['24h', '48h', '72h'], default: '24h' })
@ApiQuery({ name: 'limit', required: false, type: Number, default: 10 })
@ApiResponse({ status: 200, description: 'Trending topics returned' })
async getTrendingTopics(
  @GetOrgFromRequest() org: Organization,
  @Query('groupId') groupId?: string,
  @Query('integrationIds') integrationIds?: string,
  @Query('timeWindow') timeWindow: '24h' | '48h' | '72h' = '24h',
  @Query('limit') limit: string = '10'
) {
  try {
    const trending = await this._trendingService.getTrendingTopics(org.id, {
      groupId,
      integrationIds: integrationIds?.split(',').filter(Boolean),
      timeWindow,
      limit: parseInt(limit, 10)
    });

    return {
      timeWindow,
      generatedAt: new Date().toISOString(),
      trending: trending.map(item => ({
        ...item,
        whyTrending: this.generateWhyTrending(item)
      }))
    };
  } catch (error: any) {
    throw error;
  }
}

private generateWhyTrending(item: any): string {
  if (item.isNew) {
    return `New trending topic with ${item.currentMentions} mentions`;
  }

  const parts = [];
  if (item.mentionVelocity > 0) {
    parts.push(`${item.mentionVelocity}% increase in mentions`);
  }
  if (item.engagementVelocity > 0) {
    parts.push(`${item.engagementVelocity}% increase in engagement`);
  }

  return parts.join(' and ');
}
```

### Frontend Implementation

**TrendingTopicsWidget:**

```typescript
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const TrendingTopicsWidget = ({ groupId }) => {
  const fetch = useFetch();
  const [timeWindow, setTimeWindow] = useState<'24h' | '48h' | '72h'>('24h');

  const queryString = new URLSearchParams({
    timeWindow,
    ...(groupId && { groupId }),
    limit: '10'
  }).toString();

  const { data, isLoading } = useSWR(
    `/analytics/trending/topics?${queryString}`,
    async (url) => (await fetch(url)).json()
  );

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="bg-third p-[24px] rounded-[8px]">
      <div className="flex justify-between items-center mb-[16px]">
        <h3 className="text-[18px]">🔥 Trending Topics</h3>
        <TimeWindowSelector value={timeWindow} onChange={setTimeWindow} />
      </div>

      {data?.trending?.length > 0 ? (
        <div className="space-y-[12px]">
          {data.trending.map((item, index) => (
            <TrendingTopicItem key={item.tag.id} item={item} rank={index + 1} />
          ))}
        </div>
      ) : (
        <div className="text-center text-neutral-400 py-[24px]">
          No trending topics in selected period
        </div>
      )}
    </div>
  );
};

const TrendingTopicItem = ({ item, rank }) => (
  <div className="p-[12px] bg-forth rounded-[6px] flex items-center gap-[12px]">
    <div className="text-[20px] font-bold text-neutral-500">#{rank}</div>

    <div className="flex-1">
      <div className="flex items-center gap-[8px]">
        <span className="font-medium">{item.tag.name}</span>
        {item.tag.type === 'MANUAL' && (
          <span className="text-xs px-[6px] py-[2px] bg-blue-500/20 text-blue-300 rounded-full">
            CAMPAIGN
          </span>
        )}
        {item.isNew && (
          <span className="text-xs px-[6px] py-[2px] bg-green-500/20 text-green-300 rounded-full">
            NEW
          </span>
        )}
      </div>

      <div className="text-sm text-neutral-400 mt-[4px]">
        {item.whyTrending}
      </div>

      <div className="flex gap-[16px] mt-[6px] text-xs">
        <span>
          {item.currentMentions} mentions
          {item.mentionVelocity > 0 && (
            <span className="text-green-400 ml-[4px]">
              ↗️ +{item.mentionVelocity}%
            </span>
          )}
        </span>
        <span>
          {item.currentAvgEngagement} avg engagement
          {item.engagementVelocity > 0 && (
            <span className="text-green-400 ml-[4px]">
              ↗️ +{item.engagementVelocity}%
            </span>
          )}
        </span>
      </div>
    </div>

    <div className="text-right">
      <div className="text-[20px] font-bold text-green-400">
        {item.velocityScore > 0 ? '+' : ''}{item.velocityScore}%
      </div>
      <div className="text-xs text-neutral-500">velocity</div>
    </div>
  </div>
);

const TimeWindowSelector = ({ value, onChange }) => (
  <div className="flex gap-[8px]">
    {['24h', '48h', '72h'].map(window => (
      <button
        key={window}
        onClick={() => onChange(window)}
        className={`px-[12px] py-[6px] rounded-[4px] text-sm ${
          value === window
            ? 'bg-primary text-white'
            : 'bg-forth text-neutral-400'
        }`}
      >
        {window}
      </button>
    ))}
  </div>
);
```

### UI/UX Design

**Trending Topics Widget:**

```
┌──────────────────────────────────────────────┐
│ 🔥 Trending Topics    [24h][48h][72h]        │
├──────────────────────────────────────────────┤
│ #1  ai [NEW]                         +100%   │
│     New trending topic with 18 mentions       │
│     18 mentions  70 avg eng ↗️ +40%           │
├──────────────────────────────────────────────┤
│ #2  startup                          +56%    │
│     80% increase in mentions and              │
│     40% increase in engagement                │
│     18 mentions ↗️ +80%  70 avg eng ↗️ +40%   │
├──────────────────────────────────────────────┤
│ #3  product launch [CAMPAIGN]        +45%    │
│     50% increase in mentions and              │
│     42% increase in engagement                │
│     12 mentions ↗️ +50%  85 avg eng ↗️ +42%   │
└──────────────────────────────────────────────┘
```

### Performance Considerations

**Query Optimization:**
- Index on (organizationId, publishedAt) for content queries
- Include tags and metrics in single query
- Cache trending topics for 10 minutes
- Limit to top 50 max

**Calculation:**
- Aggregate in application layer (acceptable for MVP)
- Consider pre-computing for large datasets (future)
- Time windows: 24h, 48h, 72h only (no arbitrary ranges)

### Edge Cases

**New Tags:**
- Velocity = 100% (from 0 to current)
- Mark as "NEW" in UI
- Include in trending list

**Zero Baseline:**
- Previous period = 0 mentions
- Velocity = 100%
- Handle division by zero

**No Trending Tags:**
- All velocities ≤ 0
- Display empty state
- Suggest expanding time window

**Same Mentions, Different Engagement:**
- Engagement velocity captures this
- Weighted score shows trend

### References

- [Source: docs/epics.md#Story-4.2]
- FR coverage: FR-010, FR-011
- Story 4.1: Auto tagging (provides tags)
- Story 2.3: Daily metrics (provides engagement)
- Story 3.1: Groups (for niche filtering)

### Related Files

- `docs/stories/4-1-auto-keyword-tagging-and-manual-campaign-tags.md` - Tag source
- `docs/stories/2-3-ingest-daily-metrics.md` - Metrics source
- `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-trending.service.ts` - New service

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 5-6 hours
- AnalyticsTrendingService: 3 hours
- Velocity calculation algorithm: 1 hour
- API endpoint: 1 hour
- Testing: 1 hour

**Frontend:** 3-4 hours
- TrendingTopicsWidget: 2 hours
- Time window selector: 0.5 hours
- Integration with dashboard: 0.5 hours
- Testing: 1 hour

**Total:** 8-10 hours (1-2 focused sessions)

### Definition of Done

- [ ] AnalyticsTrendingService implements velocity calculation
- [ ] Velocity score formula validated
- [ ] API endpoint returns trending topics
- [ ] Time window filtering works (24h/48h/72h)
- [ ] Group/niche filtering works
- [ ] Frontend widget displays trending topics
- [ ] "Why trending" explanation shown
- [ ] Edge cases handled (new tags, zero baseline)
- [ ] Velocity calculation tested and accurate
- [ ] UI shows rank, velocity score, metrics
- [ ] Code follows Postiz patterns
- [ ] Story marked as done in sprint-status.yaml

## Success Metrics

**User Metrics:**
- Leaders can identify trends in <10 seconds
- Trending topics update every 10 minutes
- Clear explanation why topic is trending

**Technical Metrics:**
- Velocity calculation accuracy >90%
- API response time <1 second
- Cache hit rate >80%
- Top 10 trending topics identified correctly

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 4.1 (Auto tagging) complete
- [ ] Story 2.3 (Daily metrics) complete
- [ ] AnalyticsTag schema includes usage tracking
- [ ] Time-series data available

### Implementation Notes

**Critical Path:**
1. Service layer (blocking)
2. API endpoint (blocking)
3. Frontend widget (can parallelize)

**Risk Areas:**
- Velocity calculation accuracy
- Performance with large tag counts
- Cache invalidation timing

**Recommendations:**
- Start with simple velocity formula
- Add weighted scoring iteratively
- Monitor query performance
- Consider pre-computing for scale

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met (Stories 4.1, 2.3), clear velocity formula, feasible for MVP.
