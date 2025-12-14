# Story 4.3: Best Time to Post (Simple Heatmap) by Group/Niche

Status: ready-for-dev

## Story

As a **Leader**,
I want **best time slots by group/niche**,
So that **I post at the right time to increase views and engagement**.

## Acceptance Criteria

1. **Given** 7-14 days of data,
   **When** Leader views Insights,
   **Then** system displays heatmap/recommended slots by group/niche.

2. **And** if sufficient data available, differentiate Reels vs regular posts.

3. **And** heatmap shows day of week × hour of day with engagement intensity.

4. **And** top 3-5 recommended time slots highlighted.

5. **And** recommendations based on actual performance data.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AnalyticsBestTimeService
  - [ ] aggregatePostPerformanceByTimeSlot() - Aggregate by day/hour
  - [ ] getBestTimeSlots() - Calculate best times by engagement
  - [ ] Support group/niche filtering
  - [ ] Support format filtering (post vs reel)
  - [ ] Calculate confidence scores based on data volume

- [ ] Time Slot Analysis
  - [ ] Extract day of week + hour from publishedAt
  - [ ] Aggregate engagement per time slot
  - [ ] Calculate average engagement per slot
  - [ ] Rank slots by performance
  - [ ] Handle timezone considerations

- [ ] API Endpoints
  - [ ] GET /api/analytics/best-time - Get heatmap data
  - [ ] Query params: groupId, format, days
  - [ ] Response: 7×24 grid + top recommendations
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Best Time Heatmap Component
  - [ ] 7×24 grid visualization
  - [ ] Color-coded engagement intensity
  - [ ] Hover tooltips with details
  - [ ] Top recommendations display
  - [ ] Day range selector (7/14 days)

- [ ] Heatmap Visualization
  - [ ] Day of week (rows: Mon-Sun)
  - [ ] Hour of day (columns: 0-23)
  - [ ] Color gradient (low → high engagement)
  - [ ] Interactive hover states
  - [ ] Mobile-responsive

### Testing

- [ ] Backend tests
  - [ ] Unit test: Time slot extraction
  - [ ] Unit test: Engagement aggregation
  - [ ] Unit test: Ranking algorithm
  - [ ] Test edge cases: insufficient data
  - [ ] Integration test: API endpoints

- [ ] Frontend tests
  - [ ] Component test: Heatmap rendering
  - [ ] Test color gradient calculation
  - [ ] Test hover interactions

## Dev Notes

**Prerequisites:**
- Story 2.3 (Daily metrics - provides engagement data)
- Story 2.2 (Content metadata - provides publishedAt timestamps)
- Story 3.1 (Groups - for niche filtering)

**Technical Stack:**
- Backend: NestJS, Prisma, dayjs for date handling
- Frontend: React, heatmap library or custom grid
- Data: AnalyticsContent, AnalyticsDailyMetric

### Time Slot Analysis Strategy

**Approach:**
1. Group content by day of week (0-6) and hour (0-23)
2. Aggregate engagement per slot (reactions + comments + shares)
3. Calculate average engagement per slot
4. Normalize by content volume in each slot
5. Rank slots to identify best times

**Time Slots:**
- 7 days × 24 hours = 168 total slots
- Each slot represents a specific hour on a specific day of week

**[ASSUMPTION]:** Use UTC time for MVP. Facebook API provides timestamps in UTC. Future enhancement: timezone conversion based on audience location.

### Engagement Calculation Per Slot

```typescript
interface TimeSlot {
  dayOfWeek: number;  // 0 = Sunday, 6 = Saturday
  hour: number;       // 0-23
  contentCount: number;
  totalEngagement: number;
  avgEngagement: number;
  confidenceScore: number;  // Based on content count
}

function calculateSlotPerformance(content: Content[]): TimeSlot[] {
  const slotMap = new Map<string, {
    count: number;
    totalEngagement: number;
  }>();

  // Aggregate by slot
  for (const item of content) {
    const publishedAt = dayjs(item.publishedAt);
    const dayOfWeek = publishedAt.day();
    const hour = publishedAt.hour();
    const slotKey = `${dayOfWeek}-${hour}`;

    if (!slotMap.has(slotKey)) {
      slotMap.set(slotKey, { count: 0, totalEngagement: 0 });
    }

    const slot = slotMap.get(slotKey)!;
    slot.count++;
    
    // Sum engagement from metrics
    const engagement = item.metrics.reduce((sum, m) =>
      sum + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0), 0
    );
    slot.totalEngagement += engagement;
  }

  // Convert to array with averages
  const slots: TimeSlot[] = [];
  slotMap.forEach((data, key) => {
    const [dayOfWeek, hour] = key.split('-').map(Number);
    const avgEngagement = data.count > 0 ? data.totalEngagement / data.count : 0;
    
    // Confidence score (0-1) based on sample size
    const confidenceScore = Math.min(data.count / 5, 1); // 5+ posts = full confidence

    slots.push({
      dayOfWeek,
      hour,
      contentCount: data.count,
      totalEngagement: data.totalEngagement,
      avgEngagement: Math.round(avgEngagement),
      confidenceScore: Math.round(confidenceScore * 100) / 100
    });
  });

  return slots;
}
```

### Service Implementation

**AnalyticsBestTimeService:**

```typescript
@Injectable()
export class AnalyticsBestTimeService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Get best time slots for posting
   */
  async getBestTimeSlots(
    organizationId: string,
    options: {
      groupId?: string;
      integrationIds?: string[];
      format?: 'post' | 'reel' | 'all';
      days: 7 | 14;
    }
  ) {
    const startDate = dayjs().subtract(options.days, 'days').toDate();
    const endDate = new Date();

    // Get integration IDs if groupId provided
    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // Query content with metrics
    const content = await this._prismaService.analyticsContent.findMany({
      where: {
        organizationId,
        publishedAt: { gte: startDate, lte: endDate },
        ...(integrationIds.length > 0 && {
          integrationId: { in: integrationIds }
        }),
        ...(options.format && options.format !== 'all' && {
          contentType: options.format
        })
      },
      include: {
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        }
      }
    });

    // Calculate slot performance
    const slots = this.calculateSlotPerformance(content);

    // Generate heatmap grid (7 days × 24 hours)
    const heatmap = this.generateHeatmap(slots);

    // Get top recommendations
    const recommendations = this.getTopRecommendations(slots, 5);

    return {
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: options.days
      },
      totalContent: content.length,
      heatmap,
      recommendations,
      format: options.format || 'all'
    };
  }

  private calculateSlotPerformance(content: any[]): TimeSlot[] {
    const slotMap = new Map<string, {
      count: number;
      totalEngagement: number;
    }>();

    for (const item of content) {
      const publishedAt = dayjs(item.publishedAt);
      const dayOfWeek = publishedAt.day();
      const hour = publishedAt.hour();
      const slotKey = `${dayOfWeek}-${hour}`;

      if (!slotMap.has(slotKey)) {
        slotMap.set(slotKey, { count: 0, totalEngagement: 0 });
      }

      const slot = slotMap.get(slotKey)!;
      slot.count++;
      
      const engagement = item.metrics.reduce((sum, m) =>
        sum + (m.reactions || 0) + (m.comments || 0) + (m.shares || 0), 0
      );
      slot.totalEngagement += engagement;
    }

    const slots: TimeSlot[] = [];
    slotMap.forEach((data, key) => {
      const [dayOfWeek, hour] = key.split('-').map(Number);
      const avgEngagement = data.count > 0 ? data.totalEngagement / data.count : 0;
      const confidenceScore = Math.min(data.count / 5, 1);

      slots.push({
        dayOfWeek,
        hour,
        contentCount: data.count,
        totalEngagement: data.totalEngagement,
        avgEngagement: Math.round(avgEngagement),
        confidenceScore: Math.round(confidenceScore * 100) / 100
      });
    });

    return slots;
  }

  private generateHeatmap(slots: TimeSlot[]) {
    // Create 7×24 grid
    const grid: Array<Array<{
      hour: number;
      engagement: number;
      count: number;
      confidence: number;
    }>> = [];

    for (let day = 0; day < 7; day++) {
      grid[day] = [];
      for (let hour = 0; hour < 24; hour++) {
        const slot = slots.find(s => s.dayOfWeek === day && s.hour === hour);
        grid[day][hour] = {
          hour,
          engagement: slot?.avgEngagement || 0,
          count: slot?.contentCount || 0,
          confidence: slot?.confidenceScore || 0
        };
      }
    }

    return grid;
  }

  private getTopRecommendations(slots: TimeSlot[], limit: number) {
    // Filter slots with sufficient data (confidence > 0.4)
    const qualifiedSlots = slots.filter(s => s.confidenceScore >= 0.4);

    // Sort by average engagement
    const sorted = qualifiedSlots.sort((a, b) => 
      b.avgEngagement - a.avgEngagement
    );

    // Return top N
    return sorted.slice(0, limit).map(slot => ({
      dayOfWeek: slot.dayOfWeek,
      dayName: this.getDayName(slot.dayOfWeek),
      hour: slot.hour,
      timeRange: `${slot.hour}:00-${slot.hour + 1}:00`,
      avgEngagement: slot.avgEngagement,
      contentCount: slot.contentCount,
      confidenceScore: slot.confidenceScore,
      recommendation: this.generateRecommendation(slot)
    }));
  }

  private getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  private generateRecommendation(slot: TimeSlot): string {
    return `Best time: ${this.getDayName(slot.dayOfWeek)} at ${slot.hour}:00-${slot.hour + 1}:00 (avg ${slot.avgEngagement} engagement)`;
  }
}
```

### API Design

**GET /api/analytics/best-time**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];
  format?: 'post' | 'reel' | 'all';
  days: 7 | 14;  // Default: 7
}
```

Response:
```json
{
  "period": {
    "startDate": "2025-01-07T00:00:00Z",
    "endDate": "2025-01-14T00:00:00Z",
    "days": 7
  },
  "totalContent": 45,
  "format": "all",
  "heatmap": [
    [
      { "hour": 0, "engagement": 35, "count": 2, "confidence": 0.4 },
      { "hour": 1, "engagement": 25, "count": 1, "confidence": 0.2 },
      ...
    ],
    ...
  ],
  "recommendations": [
    {
      "dayOfWeek": 2,
      "dayName": "Tuesday",
      "hour": 14,
      "timeRange": "14:00-15:00",
      "avgEngagement": 120,
      "contentCount": 8,
      "confidenceScore": 1.0,
      "recommendation": "Best time: Tuesday at 14:00-15:00 (avg 120 engagement)"
    }
  ]
}
```

### Controller Implementation

```typescript
@Get('/best-time')
@ApiOperation({ summary: 'Get best time to post heatmap' })
@ApiQuery({ name: 'groupId', required: false })
@ApiQuery({ name: 'integrationIds', required: false, type: [String] })
@ApiQuery({ name: 'format', required: false, enum: ['post', 'reel', 'all'] })
@ApiQuery({ name: 'days', required: false, enum: [7, 14], default: 7 })
@ApiResponse({ status: 200, description: 'Best time data returned' })
async getBestTime(
  @GetOrgFromRequest() org: Organization,
  @Query('groupId') groupId?: string,
  @Query('integrationIds') integrationIds?: string,
  @Query('format') format: 'post' | 'reel' | 'all' = 'all',
  @Query('days') days: string = '7'
) {
  try {
    return await this._bestTimeService.getBestTimeSlots(org.id, {
      groupId,
      integrationIds: integrationIds?.split(',').filter(Boolean),
      format,
      days: parseInt(days, 10) as 7 | 14
    });
  } catch (error: any) {
    throw error;
  }
}
```

### Frontend Implementation

**BestTimeHeatmap Component:**

```typescript
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const BestTimeHeatmap = ({ groupId }) => {
  const fetch = useFetch();
  const [days, setDays] = useState<7 | 14>(7);
  const [format, setFormat] = useState<'all' | 'post' | 'reel'>('all');

  const queryString = new URLSearchParams({
    days: days.toString(),
    format,
    ...(groupId && { groupId })
  }).toString();

  const { data, isLoading } = useSWR(
    `/analytics/best-time?${queryString}`,
    async (url) => (await fetch(url)).json()
  );

  if (isLoading) return <LoadingComponent />;

  return (
    <div className="bg-third p-[24px] rounded-[8px]">
      <div className="flex justify-between items-center mb-[16px]">
        <h3 className="text-[18px]">⏰ Best Time to Post</h3>
        <div className="flex gap-[8px]">
          <DaysSelector value={days} onChange={setDays} />
          <FormatSelector value={format} onChange={setFormat} />
        </div>
      </div>

      {data?.totalContent >= 10 ? (
        <>
          <HeatmapGrid data={data.heatmap} />
          <TopRecommendations recommendations={data.recommendations} />
        </>
      ) : (
        <InsufficientDataMessage minRequired={10} current={data?.totalContent || 0} />
      )}
    </div>
  );
};

const HeatmapGrid = ({ data }) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Find max engagement for color scaling
  const maxEngagement = Math.max(
    ...data.flat().map(cell => cell.engagement)
  );

  const getColor = (engagement: number, confidence: number) => {
    if (confidence < 0.2) return 'bg-neutral-800'; // Insufficient data
    
    const intensity = engagement / maxEngagement;
    if (intensity > 0.8) return 'bg-green-500';
    if (intensity > 0.6) return 'bg-green-400';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-orange-400';
    return 'bg-red-400';
  };

  return (
    <div className="overflow-x-auto mb-[16px]">
      <div className="min-w-[800px]">
        {/* Header: Hours */}
        <div className="flex mb-[4px]">
          <div className="w-[60px]"></div>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-center text-xs text-neutral-400">
              {i}
            </div>
          ))}
        </div>

        {/* Rows: Days */}
        {data.map((day, dayIdx) => (
          <div key={dayIdx} className="flex gap-[2px] mb-[2px]">
            <div className="w-[60px] text-sm text-neutral-400 flex items-center">
              {dayNames[dayIdx]}
            </div>
            {day.map((cell, hourIdx) => (
              <HeatmapCell
                key={hourIdx}
                cell={cell}
                color={getColor(cell.engagement, cell.confidence)}
                day={dayNames[dayIdx]}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const HeatmapCell = ({ cell, color, day }) => (
  <div
    className={`flex-1 aspect-square ${color} rounded-[2px] cursor-pointer hover:opacity-80 relative group`}
    title={`${day} ${cell.hour}:00\n${cell.engagement} avg engagement\n${cell.count} posts`}
  >
    {/* Tooltip on hover */}
    <div className="hidden group-hover:block absolute z-10 bg-black text-white text-xs p-[8px] rounded-[4px] -top-[60px] left-1/2 -translate-x-1/2 whitespace-nowrap">
      <div>{day} {cell.hour}:00-{cell.hour + 1}:00</div>
      <div>{cell.engagement} avg engagement</div>
      <div>{cell.count} posts</div>
    </div>
  </div>
);

const TopRecommendations = ({ recommendations }) => (
  <div className="mt-[16px]">
    <h4 className="text-sm font-medium mb-[8px]">Top Recommended Times:</h4>
    <div className="space-y-[8px]">
      {recommendations.slice(0, 3).map((rec, index) => (
        <div
          key={index}
          className="p-[12px] bg-forth rounded-[6px] flex items-center gap-[12px]"
        >
          <div className="text-[20px] font-bold text-primary">#{index + 1}</div>
          <div className="flex-1">
            <div className="font-medium">
              {rec.dayName} at {rec.timeRange}
            </div>
            <div className="text-sm text-neutral-400">
              Avg {rec.avgEngagement} engagement ({rec.contentCount} posts)
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-neutral-500">Confidence</div>
            <div className="font-medium">{Math.round(rec.confidenceScore * 100)}%</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const InsufficientDataMessage = ({ minRequired, current }) => (
  <div className="text-center text-neutral-400 py-[48px]">
    <p className="text-lg mb-[8px]">Insufficient Data</p>
    <p className="text-sm">
      Need at least {minRequired} posts. Currently have {current} posts.
    </p>
    <p className="text-xs mt-[8px]">
      Post more content or expand the time range to get recommendations.
    </p>
  </div>
);
```

### UI/UX Design

**Heatmap Layout:**

```
┌────────────────────────────────────────────────────────┐
│ ⏰ Best Time to Post          [7d][14d]  [All][Post][Reel] │
├────────────────────────────────────────────────────────┤
│      0  1  2  3  4  5  6  7  8  9  10 11 12 13 ... 23 │
│ Sun  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Mon  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Tue  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Wed  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Thu  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Fri  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│ Sat  ░░ ░░ ▓▓ ▓▓ ░░ ░░ ▓▓ ▓▓ ██ ██ ██ ░░ ░░ ▓▓ ... ░░ │
│                                                        │
│ Legend: ░░ Low  ▓▓ Medium  ██ High                    │
│                                                        │
│ Top Recommended Times:                                 │
│ #1  Tuesday at 14:00-15:00                            │
│     Avg 120 engagement (8 posts)     Confidence: 100% │
│ #2  Wednesday at 10:00-11:00                          │
│     Avg 95 engagement (6 posts)      Confidence: 100% │
│ #3  Friday at 18:00-19:00                             │
│     Avg 88 engagement (5 posts)      Confidence: 100% │
└────────────────────────────────────────────────────────┘
```

### Performance Considerations

**Query Optimization:**
- Index on (organizationId, publishedAt)
- Include metrics in single query
- Aggregate in application layer
- Cache heatmap for 30 minutes

**Data Requirements:**
- Minimum 10 posts for analysis
- 7-14 days window
- Higher confidence with more data

**Future Enhancements:**
- Timezone conversion based on audience
- Separate analysis for different content types
- Statistical significance indicators
- Trend over time (is best time changing?)

### Edge Cases

**Insufficient Data:**
- < 10 posts total → Show message
- Slots with < 3 posts → Lower confidence score
- Empty slots → Gray color, no recommendation

**Timezone:**
- Use UTC for MVP
- Future: Convert to page's timezone
- Future: Consider audience timezone distribution

**Data Quality:**
- Filter out deleted content
- Handle null publishedAt
- Handle metrics with no engagement data

### References

- [Source: docs/epics.md#Story-4.3]
- FR coverage: FR-012, FR-013
- Story 2.3: Daily metrics
- Story 2.2: Content metadata
- Story 3.1: Groups

### Related Files

- `docs/stories/2-3-ingest-daily-metrics.md` - Metrics source
- `docs/stories/2-2-ingest-content-metadata.md` - publishedAt source
- `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-best-time.service.ts` - New service

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 5-6 hours
- AnalyticsBestTimeService: 3 hours
- Time slot aggregation: 1 hour
- API endpoint: 1 hour
- Testing: 1 hour

**Frontend:** 4-5 hours
- Heatmap grid component: 2 hours
- Color gradient logic: 0.5 hours
- Recommendations display: 1 hour
- Integration: 0.5 hours
- Testing: 1 hour

**Total:** 9-11 hours (1-2 focused sessions)

### Definition of Done

- [ ] AnalyticsBestTimeService implements time slot analysis
- [ ] Day/hour extraction from publishedAt works
- [ ] Engagement aggregation per slot accurate
- [ ] Heatmap 7×24 grid generated correctly
- [ ] Top recommendations ranked by engagement
- [ ] API endpoint returns heatmap data
- [ ] Frontend heatmap displays with color gradient
- [ ] Hover tooltips show slot details
- [ ] Top 3-5 recommendations displayed
- [ ] Insufficient data message shown when needed
- [ ] Format filtering works (post vs reel)
- [ ] Days selector works (7d vs 14d)
- [ ] Confidence scores calculated
- [ ] Edge cases handled
- [ ] Code follows Postiz patterns
- [ ] Story marked as done in sprint-status.yaml

## Success Metrics

**User Metrics:**
- Leaders can identify best posting times in <30 seconds
- Heatmap loads in <2 seconds
- Recommendations actionable

**Technical Metrics:**
- Time slot aggregation accurate
- Heatmap generation <1 second
- Minimum 10 posts for recommendations
- Confidence > 40% for recommendations

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 2.3 (Daily metrics) complete
- [ ] Story 2.2 (Content metadata) complete
- [ ] dayjs library available
- [ ] Sufficient historical data (7-14 days)

### Implementation Notes

**Critical Path:**
1. Service layer (blocking)
2. API endpoint (blocking)
3. Frontend heatmap (can parallelize)

**Risk Areas:**
- Insufficient data scenarios
- Timezone handling
- Color scaling algorithm

**Recommendations:**
- Start with simple UTC time
- Add timezone support iteratively
- Monitor data quality
- Consider confidence thresholds

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met, clear aggregation logic, valuable for Leaders.
