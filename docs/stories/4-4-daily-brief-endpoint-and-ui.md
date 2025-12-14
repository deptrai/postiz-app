# Story 4.4: Daily Brief Endpoint + UI

Status: ready-for-dev

## Story

As a **Leader**,
I want **a Daily Brief every day**,
So that **I can make content decisions in <5 minutes**.

## Acceptance Criteria

1. **Given** trending topics + best time slots + top content,
   **When** Leader opens Daily Brief,
   **Then** system displays:
   - Top trending topics/pillars
   - Best time slots for posting
   - Top performing content templates

2. **And** each recommendation has explainability (why it's recommended).

3. **And** if daily ingestion is partial/incomplete, Daily Brief still returns response with indicator/explanation that data is not fully complete.

4. **And** query errors/invalid dates return standard NestJS format (400 with clear message).

5. **And** Brief loads in <3 seconds for quick decision-making.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AnalyticsDailyBriefService
  - [ ] Aggregate data from multiple sources
  - [ ] Call TrendingService for trending topics
  - [ ] Call BestTimeService for optimal posting times
  - [ ] Query top performing content
  - [ ] Generate recommendations
  - [ ] Add explainability to each insight

- [ ] Data Aggregation
  - [ ] Trending topics (last 24-48 hours)
  - [ ] Best posting times (last 7 days)
  - [ ] Top 5 content by engagement
  - [ ] Format breakdown summary
  - [ ] Data completeness check

- [ ] API Endpoints
  - [ ] GET /api/analytics/daily-brief - Get today's brief
  - [ ] Query params: groupId, date (optional)
  - [ ] Response: Aggregated insights with explanations
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Daily Brief Page
  - [ ] Clean, scannable layout
  - [ ] Section-based design
  - [ ] Trending Topics widget
  - [ ] Best Times widget
  - [ ] Top Content carousel
  - [ ] Quick Actions section

- [ ] UI Components
  - [ ] Brief summary header
  - [ ] Data completeness indicator
  - [ ] Explainability tooltips
  - [ ] Date selector (view historical briefs)
  - [ ] Print/export option

### Testing

- [ ] Backend tests
  - [ ] Unit test: Data aggregation
  - [ ] Unit test: Explainability generation
  - [ ] Test partial data scenarios
  - [ ] Integration test: API endpoint

- [ ] Frontend tests
  - [ ] Component test: Brief page
  - [ ] Test data completeness warning
  - [ ] Test loading states

## Dev Notes

**Prerequisites:**
- Story 4.1 (Auto tagging - provides topics)
- Story 4.2 (Trending topics - velocity analysis)
- Story 4.3 (Best time to post - scheduling)
- Story 3.2 (Dashboard - top content)
- Story 3.3 (Format breakdown - Posts vs Reels)

**Technical Stack:**
- Backend: NestJS, aggregates multiple services
- Frontend: React, dashboard-style layout
- Caching: 10-minute cache for brief data

### Daily Brief Structure

**Sections:**
1. **Summary** - Key metrics at a glance
2. **Trending Topics** - What's hot in your niche
3. **Best Times** - When to post today
4. **Top Performers** - What's working well
5. **Recommendations** - Actionable next steps

**[ASSUMPTION]:** Generated on-demand for MVP. Future: Pre-compute via cron at 6am daily.

**[ASSUMPTION]:** Default shows last 24 hours. Historical briefs accessible via date selector.

### Service Implementation

**AnalyticsDailyBriefService:**

```typescript
@Injectable()
export class AnalyticsDailyBriefService {
  constructor(
    private _trendingService: AnalyticsTrendingService,
    private _bestTimeService: AnalyticsBestTimeService,
    private _prismaService: PrismaService
  ) {}

  /**
   * Generate daily brief with all insights
   */
  async getDailyBrief(
    organizationId: string,
    options: {
      groupId?: string;
      date?: string; // YYYY-MM-DD, defaults to today
    }
  ) {
    const targetDate = options.date ? dayjs(options.date) : dayjs();
    
    // Check data completeness
    const completeness = await this.checkDataCompleteness(
      organizationId,
      targetDate.toDate()
    );

    // Aggregate insights (parallel execution)
    const [trending, bestTimes, topContent, formatInsights] = await Promise.all([
      this.getTrendingTopics(organizationId, options.groupId),
      this.getBestTimesToday(organizationId, options.groupId),
      this.getTopContent(organizationId, options.groupId),
      this.getFormatInsights(organizationId, options.groupId)
    ]);

    // Generate recommendations
    const recommendations = this.generateRecommendations({
      trending,
      bestTimes,
      topContent,
      formatInsights
    });

    return {
      date: targetDate.format('YYYY-MM-DD'),
      generatedAt: new Date().toISOString(),
      dataCompleteness: completeness,
      summary: {
        totalContent: topContent.total,
        trendingTopicsCount: trending.length,
        bestTimeSlotsCount: bestTimes.length
      },
      insights: {
        trending,
        bestTimes,
        topContent: topContent.items,
        formatInsights
      },
      recommendations,
      explainability: this.generateExplainability(completeness)
    };
  }

  private async getTrendingTopics(organizationId: string, groupId?: string) {
    // Get trending from last 24-48 hours
    const trending = await this._trendingService.getTrendingTopics(
      organizationId,
      {
        groupId,
        timeWindow: '24h',
        limit: 5
      }
    );

    return trending.map(item => ({
      tag: item.tag.name,
      velocityScore: item.velocityScore,
      currentMentions: item.currentMentions,
      explanation: `Trending up ${item.velocityScore}% with ${item.currentMentions} mentions in last 24h`
    }));
  }

  private async getBestTimesToday(organizationId: string, groupId?: string) {
    // Get today's best posting times
    const bestTime = await this._bestTimeService.getBestTimeSlots(
      organizationId,
      {
        groupId,
        format: 'all',
        days: 7
      }
    );

    // Filter recommendations for today's day of week
    const todayDayOfWeek = dayjs().day();
    const todaySlots = bestTime.recommendations.filter(
      rec => rec.dayOfWeek === todayDayOfWeek
    );

    return todaySlots.slice(0, 3).map(slot => ({
      timeRange: slot.timeRange,
      dayName: slot.dayName,
      avgEngagement: slot.avgEngagement,
      confidence: slot.confidenceScore,
      explanation: `Based on ${slot.contentCount} posts, this time achieves ${slot.avgEngagement} avg engagement`
    }));
  }

  private async getTopContent(organizationId: string, groupId?: string) {
    // Get top 5 performing content from last 7 days
    const startDate = dayjs().subtract(7, 'days').toDate();
    const endDate = new Date();

    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        publishedAt: { gte: startDate, lte: endDate },
        ...(groupId && {
          integration: {
            groupMembers: {
              some: { groupId }
            }
          }
        })
      },
      include: {
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        },
        integration: {
          select: {
            name: true,
            picture: true
          }
        }
      },
      take: 100
    });

    // Calculate total engagement and rank
    const ranked = content
      .map(item => {
        const totalEngagement = item.metrics.reduce((sum, m) =>
          sum + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0), 0
        );
        const totalReach = item.metrics.reduce((sum, m) =>
          sum + (m.reach || 0), 0
        );
        return {
          ...item,
          totalEngagement,
          totalReach,
          engagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
        };
      })
      .sort((a, b) => b.totalEngagement - a.totalEngagement)
      .slice(0, 5);

    return {
      total: content.length,
      items: ranked.map(item => ({
        id: item.id,
        caption: item.caption?.substring(0, 100) + '...',
        contentType: item.contentType,
        publishedAt: item.publishedAt,
        integration: item.integration,
        engagement: item.totalEngagement,
        reach: item.totalReach,
        engagementRate: Math.round(item.engagementRate * 10) / 10,
        explanation: `${item.totalEngagement} total engagement with ${item.engagementRate.toFixed(1)}% engagement rate`
      }))
    };
  }

  private async getFormatInsights(organizationId: string, groupId?: string) {
    // Get Posts vs Reels performance (last 7 days)
    const startDate = dayjs().subtract(7, 'days').toDate();
    
    const posts = await this.getFormatPerformance(
      organizationId,
      groupId,
      'post',
      startDate
    );
    const reels = await this.getFormatPerformance(
      organizationId,
      groupId,
      'reel',
      startDate
    );

    const winner = reels.avgEngagementRate > posts.avgEngagementRate ? 'reels' : 'posts';

    return {
      posts,
      reels,
      winner,
      explanation: winner === 'reels'
        ? `Reels performing ${(reels.avgEngagementRate - posts.avgEngagementRate).toFixed(1)}% better`
        : `Posts performing ${(posts.avgEngagementRate - reels.avgEngagementRate).toFixed(1)}% better`
    };
  }

  private async getFormatPerformance(
    organizationId: string,
    groupId: string | undefined,
    format: string,
    startDate: Date
  ) {
    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        contentType: format,
        publishedAt: { gte: startDate },
        ...(groupId && {
          integration: {
            groupMembers: {
              some: { groupId }
            }
          }
        })
      },
      include: {
        metrics: {
          where: {
            date: { gte: startDate }
          }
        }
      }
    });

    const totalEngagement = content.reduce((sum, c) =>
      sum + c.metrics.reduce((s, m) =>
        s + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0), 0
      ), 0
    );
    const totalReach = content.reduce((sum, c) =>
      sum + c.metrics.reduce((s, m) => s + (m.reach || 0), 0), 0
    );

    return {
      count: content.length,
      totalEngagement,
      totalReach,
      avgEngagementRate: totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0
    };
  }

  private generateRecommendations(data: any) {
    const recommendations = [];

    // Trending topic recommendation
    if (data.trending.length > 0) {
      const topTrending = data.trending[0];
      recommendations.push({
        type: 'trending',
        priority: 'high',
        title: `Create content about "${topTrending.tag}"`,
        description: `This topic is trending up ${topTrending.velocityScore}% with ${topTrending.currentMentions} mentions`,
        action: 'Create post'
      });
    }

    // Best time recommendation
    if (data.bestTimes.length > 0) {
      const nextSlot = data.bestTimes[0];
      recommendations.push({
        type: 'timing',
        priority: 'medium',
        title: `Post today at ${nextSlot.timeRange}`,
        description: `Historically achieves ${nextSlot.avgEngagement} avg engagement`,
        action: 'Schedule post'
      });
    }

    // Format recommendation
    if (data.formatInsights.winner) {
      recommendations.push({
        type: 'format',
        priority: 'medium',
        title: `Focus on ${data.formatInsights.winner}`,
        description: data.formatInsights.explanation,
        action: `Create ${data.formatInsights.winner}`
      });
    }

    // Top content template
    if (data.topContent.length > 0) {
      const topItem = data.topContent[0];
      recommendations.push({
        type: 'template',
        priority: 'low',
        title: 'Replicate top performer',
        description: `Similar to "${topItem.caption}" (${topItem.engagement} engagement)`,
        action: 'Use template'
      });
    }

    return recommendations;
  }

  private async checkDataCompleteness(organizationId: string, date: Date) {
    // Check if ingestion completed for the date
    const startOfDay = dayjs(date).startOf('day').toDate();
    const endOfDay = dayjs(date).endOf('day').toDate();

    const contentCount = await this._prismaService.analyticsContent.count({
      where: {
        organizationId,
        publishedAt: { gte: startOfDay, lte: endOfDay }
      }
    });

    const metricsCount = await this._prismaService.analyticsDailyMetric.count({
      where: {
        organizationId,
        date: { gte: startOfDay, lte: endOfDay }
      }
    });

    const isComplete = contentCount > 0 && metricsCount > 0;
    const completenessPercentage = contentCount > 0 && metricsCount > 0 ? 100 :
                                    contentCount > 0 ? 50 : 0;

    return {
      isComplete,
      percentage: completenessPercentage,
      contentCount,
      metricsCount,
      message: isComplete
        ? 'Data complete'
        : contentCount > 0
        ? 'Content ingested, metrics pending'
        : 'Ingestion incomplete for this date'
    };
  }

  private generateExplainability(completeness: any) {
    if (completeness.isComplete) {
      return 'All recommendations based on complete data from your tracked pages';
    }

    return `Note: ${completeness.message}. Recommendations may be partial or based on available data only.`;
  }
}
```

### API Design

**GET /api/analytics/daily-brief**

Query Parameters:
```typescript
{
  groupId?: string;
  date?: string; // YYYY-MM-DD, defaults to today
}
```

Response:
```json
{
  "date": "2025-01-14",
  "generatedAt": "2025-01-14T10:00:00Z",
  "dataCompleteness": {
    "isComplete": true,
    "percentage": 100,
    "contentCount": 45,
    "metricsCount": 180,
    "message": "Data complete"
  },
  "summary": {
    "totalContent": 45,
    "trendingTopicsCount": 5,
    "bestTimeSlotsCount": 3
  },
  "insights": {
    "trending": [
      {
        "tag": "ai",
        "velocityScore": 56.0,
        "currentMentions": 18,
        "explanation": "Trending up 56% with 18 mentions in last 24h"
      }
    ],
    "bestTimes": [
      {
        "timeRange": "14:00-15:00",
        "dayName": "Tuesday",
        "avgEngagement": 120,
        "confidence": 1.0,
        "explanation": "Based on 8 posts, this time achieves 120 avg engagement"
      }
    ],
    "topContent": [
      {
        "id": "content-uuid",
        "caption": "Amazing product launch...",
        "contentType": "post",
        "publishedAt": "2025-01-10T14:00:00Z",
        "integration": {
          "name": "TechPage",
          "picture": "https://..."
        },
        "engagement": 2500,
        "reach": 50000,
        "engagementRate": 5.0,
        "explanation": "2500 total engagement with 5.0% engagement rate"
      }
    ],
    "formatInsights": {
      "posts": {
        "count": 25,
        "avgEngagementRate": 5.0
      },
      "reels": {
        "count": 20,
        "avgEngagementRate": 8.0
      },
      "winner": "reels",
      "explanation": "Reels performing 3.0% better"
    }
  },
  "recommendations": [
    {
      "type": "trending",
      "priority": "high",
      "title": "Create content about \"ai\"",
      "description": "This topic is trending up 56% with 18 mentions",
      "action": "Create post"
    },
    {
      "type": "timing",
      "priority": "medium",
      "title": "Post today at 14:00-15:00",
      "description": "Historically achieves 120 avg engagement",
      "action": "Schedule post"
    }
  ],
  "explainability": "All recommendations based on complete data from your tracked pages"
}
```

### Controller Implementation

```typescript
@Get('/daily-brief')
@ApiOperation({ summary: 'Get daily brief with aggregated insights' })
@ApiQuery({ name: 'groupId', required: false })
@ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD' })
@ApiResponse({ status: 200, description: 'Daily brief returned' })
@ApiResponse({ status: 400, description: 'Invalid date format' })
async getDailyBrief(
  @GetOrgFromRequest() org: Organization,
  @Query('groupId') groupId?: string,
  @Query('date') date?: string
) {
  try {
    // Validate date format
    if (date && !dayjs(date, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    return await this._dailyBriefService.getDailyBrief(org.id, {
      groupId,
      date
    });
  } catch (error: any) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw error;
  }
}
```

### Frontend Implementation

**DailyBriefPage:**

```typescript
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import dayjs from 'dayjs';

export const DailyBriefPage = ({ groupId }) => {
  const fetch = useFetch();
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const queryString = new URLSearchParams({
    date: selectedDate,
    ...(groupId && { groupId })
  }).toString();

  const { data, isLoading } = useSWR(
    `/analytics/daily-brief?${queryString}`,
    async (url) => (await fetch(url)).json(),
    { refreshInterval: 600000 } // 10 min refresh
  );

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="max-w-[1200px] mx-auto p-[24px]">
      {/* Header */}
      <div className="flex justify-between items-center mb-[24px]">
        <div>
          <h1 className="text-[32px] font-bold">📊 Daily Brief</h1>
          <p className="text-neutral-400">
            {dayjs(selectedDate).format('dddd, MMMM D, YYYY')}
          </p>
        </div>
        <DateSelector value={selectedDate} onChange={setSelectedDate} />
      </div>

      {/* Data Completeness Warning */}
      {!data.dataCompleteness.isComplete && (
        <DataCompletenessWarning data={data.dataCompleteness} />
      )}

      {/* Summary Cards */}
      <SummaryCards summary={data.summary} />

      {/* Main Sections */}
      <div className="grid grid-cols-2 gap-[24px] mt-[24px]">
        {/* Trending Topics */}
        <TrendingSection trending={data.insights.trending} />

        {/* Best Times */}
        <BestTimesSection bestTimes={data.insights.bestTimes} />

        {/* Top Content */}
        <TopContentSection topContent={data.insights.topContent} />

        {/* Format Insights */}
        <FormatInsightsSection formatInsights={data.insights.formatInsights} />
      </div>

      {/* Recommendations */}
      <RecommendationsSection recommendations={data.recommendations} />

      {/* Explainability */}
      <div className="mt-[16px] text-sm text-neutral-400 text-center">
        {data.explainability}
      </div>
    </div>
  );
};

const SummaryCards = ({ summary }) => (
  <div className="grid grid-cols-3 gap-[16px]">
    <SummaryCard
      icon="📝"
      label="Total Content"
      value={summary.totalContent}
    />
    <SummaryCard
      icon="🔥"
      label="Trending Topics"
      value={summary.trendingTopicsCount}
    />
    <SummaryCard
      icon="⏰"
      label="Best Time Slots"
      value={summary.bestTimeSlotsCount}
    />
  </div>
);

const TrendingSection = ({ trending }) => (
  <div className="bg-third p-[20px] rounded-[8px]">
    <h3 className="text-[18px] mb-[12px]">🔥 Trending Topics</h3>
    <div className="space-y-[8px]">
      {trending.slice(0, 3).map((item, index) => (
        <div key={index} className="p-[12px] bg-forth rounded-[6px]">
          <div className="flex justify-between items-center">
            <span className="font-medium">{item.tag}</span>
            <span className="text-green-400 text-sm">+{item.velocityScore}%</span>
          </div>
          <div className="text-xs text-neutral-400 mt-[4px]">
            {item.explanation}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const BestTimesSection = ({ bestTimes }) => (
  <div className="bg-third p-[20px] rounded-[8px]">
    <h3 className="text-[18px] mb-[12px]">⏰ Best Times Today</h3>
    <div className="space-y-[8px]">
      {bestTimes.map((slot, index) => (
        <div key={index} className="p-[12px] bg-forth rounded-[6px]">
          <div className="font-medium">{slot.timeRange}</div>
          <div className="text-xs text-neutral-400 mt-[4px]">
            {slot.explanation}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RecommendationsSection = ({ recommendations }) => (
  <div className="mt-[24px] bg-third p-[20px] rounded-[8px]">
    <h3 className="text-[18px] mb-[12px]">💡 Recommended Actions</h3>
    <div className="space-y-[12px]">
      {recommendations.map((rec, index) => (
        <div key={index} className="p-[16px] bg-forth rounded-[6px] flex items-center gap-[16px]">
          <div className={`w-[4px] h-[60px] rounded ${
            rec.priority === 'high' ? 'bg-red-500' :
            rec.priority === 'medium' ? 'bg-yellow-500' :
            'bg-green-500'
          }`}></div>
          <div className="flex-1">
            <div className="font-medium">{rec.title}</div>
            <div className="text-sm text-neutral-400 mt-[4px]">{rec.description}</div>
          </div>
          <button className="px-[16px] py-[8px] bg-primary text-white rounded-[4px] text-sm">
            {rec.action}
          </button>
        </div>
      ))}
    </div>
  </div>
);
```

### UI/UX Design

**Daily Brief Layout:**

```
┌────────────────────────────────────────────────────────┐
│ 📊 Daily Brief                       [Date Selector]   │
│ Tuesday, January 14, 2025                              │
├────────────────────────────────────────────────────────┤
│ [⚠️ Data completeness: 100%]                           │
├────────────────────────────────────────────────────────┤
│ 📝 Total Content: 45  🔥 Trending: 5  ⏰ Best Times: 3│
├─────────────────────────┬──────────────────────────────┤
│ 🔥 Trending Topics      │ ⏰ Best Times Today          │
│ #1 ai (+56%)            │ 14:00-15:00                  │
│ #2 startup (+45%)       │ Avg 120 engagement           │
│ #3 product (+32%)       │ ...                          │
├─────────────────────────┼──────────────────────────────┤
│ 🏆 Top Content          │ 📊 Format Insights           │
│ "Amazing launch..."     │ Reels: 8.0%                  │
│ 2500 engagement         │ Posts: 5.0%                  │
│ ...                     │ Winner: Reels (+3.0%)        │
└─────────────────────────┴──────────────────────────────┘
│ 💡 Recommended Actions                                 │
│ [HIGH] Create content about "ai"                       │
│ [MED]  Post today at 14:00-15:00                       │
│ [MED]  Focus on reels                                  │
└────────────────────────────────────────────────────────┘
```

### Performance Considerations

**Parallel Execution:**
- Fetch trending, best times, top content in parallel
- Use Promise.all() for concurrent queries
- Target total load time <3 seconds

**Caching:**
- Cache daily brief for 10 minutes
- Key: org:{orgId}:brief:{date}:{groupId}
- Invalidate on new ingestion

**Data Volume:**
- Limit trending to 5 topics
- Limit best times to 3 slots
- Limit top content to 5 items
- Total payload ~50KB

### Edge Cases

**Incomplete Data:**
- Show warning banner
- Include explainability message
- Still display available insights
- Don't block page load

**No Data:**
- Show empty state
- Suggest ingesting content
- Provide setup instructions

**Historical Briefs:**
- Allow viewing past dates
- Cache historical data longer (1 hour)
- Show "Historical Brief" indicator

### References

- [Source: docs/epics.md#Story-4.4]
- FR coverage: FR-014, FR-015
- Story 4.1: Auto tagging
- Story 4.2: Trending topics
- Story 4.3: Best time to post
- Story 3.2: Top content
- Story 3.3: Format breakdown

### Related Files

- `docs/stories/4-1-auto-keyword-tagging-and-manual-campaign-tags.md` - Topics source
- `docs/stories/4-2-trending-topics-velocity.md` - Trending analysis
- `docs/stories/4-3-best-time-to-post-heatmap.md` - Scheduling insights
- `docs/stories/3-2-dashboard-filters-kpis-top-content.md` - Top content
- `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-daily-brief.service.ts` - New service

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 6-8 hours
- AnalyticsDailyBriefService: 4 hours
- Data aggregation logic: 2 hours
- API endpoint: 1 hour
- Testing: 1-2 hours

**Frontend:** 5-6 hours
- DailyBriefPage: 3 hours
- Section components: 2 hours
- Date selector: 0.5 hours
- Integration: 0.5 hours
- Testing: 1 hour

**Total:** 11-14 hours (1-2 focused sessions)

### Definition of Done

- [ ] AnalyticsDailyBriefService aggregates all insights
- [ ] Data completeness check implemented
- [ ] Trending topics included in brief
- [ ] Best time slots included
- [ ] Top content included
- [ ] Format insights included
- [ ] Recommendations generated
- [ ] Explainability added to all insights
- [ ] API endpoint returns brief
- [ ] Invalid date returns 400 error
- [ ] Frontend page displays all sections
- [ ] Data completeness warning shows when needed
- [ ] Date selector works (historical briefs)
- [ ] Recommendations actionable
- [ ] Brief loads in <3 seconds
- [ ] Code follows Postiz patterns
- [ ] Story marked as done in sprint-status.yaml

## Success Metrics

**User Metrics:**
- Leaders make decisions in <5 minutes
- Brief loads in <3 seconds
- All insights actionable

**Technical Metrics:**
- Data aggregation accurate
- Parallel execution efficient
- Cache hit rate >70%
- API response <3 seconds

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 4.1, 4.2, 4.3 complete
- [ ] Story 3.2 (top content) available
- [ ] All source services accessible
- [ ] Parallel execution supported

### Implementation Notes

**Critical Path:**
1. Service layer (blocking)
2. Data aggregation (blocking)
3. API endpoint (blocking)
4. Frontend page (can parallelize)

**Risk Areas:**
- Performance with multiple service calls
- Data completeness edge cases
- Recommendation quality

**Recommendations:**
- Implement parallel execution (Promise.all)
- Add comprehensive caching
- Monitor aggregation performance
- Test partial data scenarios

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites defined (4.1, 4.2, 4.3), aggregation strategy clear, valuable for Leaders.
