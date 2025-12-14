# Story 5.1: Export CSV Report by Date Range (Page/Group/Niche)

Status: ready-for-dev

## Story

As a **Leader**,
I want **to export CSV reports**,
So that **I can save and analyze further or share with my team**.

## Acceptance Criteria

1. **Given** dashboard/insights data,
   **When** user selects date range + scope,
   **Then** system returns downloadable CSV file.

2. **And** CSV includes minimum KPI columns as per PRD.

3. **And** export supports filtering by:
   - Date range (start/end dates)
   - Group/niche
   - Content format (post/reel/all)

4. **And** CSV file is properly formatted with headers.

5. **And** Large exports (>1000 rows) handled gracefully.

## Tasks / Subtasks

### Backend Implementation

- [ ] Create AnalyticsExportService
  - [ ] generateCSV() - Create CSV from data
  - [ ] formatData() - Format data for CSV
  - [ ] buildHeaders() - Generate column headers
  - [ ] Handle large datasets (streaming if needed)

- [ ] CSV Generation
  - [ ] Content-level export (detailed rows)
  - [ ] Aggregated export (summary statistics)
  - [ ] Support both export types
  - [ ] Format numbers, dates consistently

- [ ] API Endpoints
  - [ ] GET /api/analytics/export/csv - Generate and download CSV
  - [ ] Query params: groupId, startDate, endDate, format, type
  - [ ] Response: CSV file download
  - [ ] Add Swagger documentation

### Frontend Implementation

- [ ] Export UI Components
  - [ ] Export button on dashboard
  - [ ] Export modal with options
  - [ ] Date range picker
  - [ ] Format selector
  - [ ] Export type selector (detailed/summary)
  - [ ] Loading indicator during generation

- [ ] File Download Handling
  - [ ] Trigger file download
  - [ ] Handle download errors
  - [ ] Show success message

### Testing

- [ ] Backend tests
  - [ ] Unit test: CSV generation
  - [ ] Unit test: Data formatting
  - [ ] Test large datasets
  - [ ] Integration test: API endpoint

- [ ] Frontend tests
  - [ ] Component test: Export modal
  - [ ] Test file download trigger
  - [ ] Test error handling

## Dev Notes

**Prerequisites:**
- Story 3.2 (Dashboard - KPIs and content data)
- Story 4.2 (Trending topics - for tags)
- Story 2.3 (Daily metrics - for engagement data)

**Technical Stack:**
- Backend: NestJS, csv-stringify or papaparse
- Frontend: React, file download via blob
- Format: Standard CSV (RFC 4180)

### CSV Export Types

**1. Detailed Content Export:**
- One row per content item
- Includes all metrics
- Useful for deep analysis

**2. Summary/Aggregated Export:**
- One row per time period or group
- Aggregated KPIs
- Useful for high-level reporting

**[ASSUMPTION]:** Start with detailed export for MVP. Aggregated export can be added later.

**[ASSUMPTION]:** Server-side generation. For very large exports (>10K rows), consider background job + email link (future enhancement).

### CSV Structure (Detailed Export)

**Column Headers:**
```csv
Content ID,Integration Name,Content Type,Published Date,Caption,Hashtags,
Total Reach,Total Impressions,Total Reactions,Total Comments,Total Shares,
Total Video Views,Total Engagement,Engagement Rate (%),Tags
```

**Sample Row:**
```csv
"abc123","TechPage","post","2025-01-10 14:30:00","Amazing product launch...","#tech,#startup",
50000,75000,1800,500,200,0,2500,5.0,"ai,startup,product"
```

### Service Implementation

**AnalyticsExportService:**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { stringify } from 'csv-stringify/sync';
import dayjs from 'dayjs';

@Injectable()
export class AnalyticsExportService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Generate CSV export of analytics data
   */
  async generateCSV(
    organizationId: string,
    options: {
      groupId?: string;
      integrationIds?: string[];
      startDate: string;
      endDate: string;
      format?: 'post' | 'reel' | 'all';
      exportType: 'detailed' | 'summary';
    }
  ): Promise<string> {
    // Get data based on export type
    if (options.exportType === 'detailed') {
      return this.generateDetailedCSV(organizationId, options);
    } else {
      return this.generateSummaryCSV(organizationId, options);
    }
  }

  private async generateDetailedCSV(
    organizationId: string,
    options: any
  ): Promise<string> {
    const startDate = dayjs(options.startDate).toDate();
    const endDate = dayjs(options.endDate).toDate();

    // Get integration IDs if groupId provided
    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // Query content with metrics and tags
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
        integration: {
          select: {
            name: true
          }
        },
        metrics: {
          where: {
            date: { gte: startDate, lte: endDate }
          }
        },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    });

    // Format data for CSV
    const rows = content.map(item => {
      // Aggregate metrics
      const totalReach = item.metrics.reduce((sum, m) => sum + (m.reach || 0), 0);
      const totalImpressions = item.metrics.reduce((sum, m) => sum + (m.impressions || 0), 0);
      const totalReactions = item.metrics.reduce((sum, m) => sum + (m.reactions || 0), 0);
      const totalComments = item.metrics.reduce((sum, m) => sum + (m.comments || 0), 0);
      const totalShares = item.metrics.reduce((sum, m) => sum + (m.shares || 0), 0);
      const totalVideoViews = item.metrics.reduce((sum, m) => sum + (m.videoViews || 0), 0);
      const totalEngagement = totalReactions + totalComments + totalShares;
      const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

      // Format tags
      const tags = item.tags.map(t => t.tag.name).join(',');

      // Parse hashtags
      let hashtags = '';
      try {
        const hashtagsArray = JSON.parse(item.hashtags || '[]');
        hashtags = Array.isArray(hashtagsArray) ? hashtagsArray.join(',') : '';
      } catch (e) {
        hashtags = '';
      }

      return {
        'Content ID': item.id,
        'Integration Name': item.integration.name,
        'Content Type': item.contentType,
        'Published Date': dayjs(item.publishedAt).format('YYYY-MM-DD HH:mm:ss'),
        'Caption': item.caption || '',
        'Hashtags': hashtags,
        'Total Reach': totalReach,
        'Total Impressions': totalImpressions,
        'Total Reactions': totalReactions,
        'Total Comments': totalComments,
        'Total Shares': totalShares,
        'Total Video Views': totalVideoViews,
        'Total Engagement': totalEngagement,
        'Engagement Rate (%)': engagementRate.toFixed(2),
        'Tags': tags
      };
    });

    // Generate CSV
    const csv = stringify(rows, {
      header: true,
      quoted: true
    });

    return csv;
  }

  private async generateSummaryCSV(
    organizationId: string,
    options: any
  ): Promise<string> {
    // Group by date and calculate daily aggregates
    const startDate = dayjs(options.startDate).toDate();
    const endDate = dayjs(options.endDate).toDate();

    const integrationIds = options.groupId
      ? await this.getIntegrationIdsFromGroup(organizationId, options.groupId)
      : options.integrationIds || [];

    // Query metrics grouped by date
    const metrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: {
        organizationId,
        date: { gte: startDate, lte: endDate },
        ...(integrationIds.length > 0 && {
          integrationId: { in: integrationIds }
        })
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Group by date
    const dailyMap = new Map<string, any>();
    metrics.forEach(metric => {
      const dateKey = dayjs(metric.date).format('YYYY-MM-DD');
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          contentCount: 0,
          reach: 0,
          impressions: 0,
          reactions: 0,
          comments: 0,
          shares: 0,
          videoViews: 0
        });
      }
      const daily = dailyMap.get(dateKey)!;
      daily.contentCount++;
      daily.reach += metric.reach || 0;
      daily.impressions += metric.impressions || 0;
      daily.reactions += metric.reactions || 0;
      daily.comments += metric.comments || 0;
      daily.shares += metric.shares || 0;
      daily.videoViews += metric.videoViews || 0;
    });

    // Format for CSV
    const rows = Array.from(dailyMap.values()).map(daily => {
      const totalEngagement = daily.reactions + daily.comments + daily.shares;
      const engagementRate = daily.reach > 0 ? (totalEngagement / daily.reach) * 100 : 0;

      return {
        'Date': daily.date,
        'Content Count': daily.contentCount,
        'Total Reach': daily.reach,
        'Total Impressions': daily.impressions,
        'Total Reactions': daily.reactions,
        'Total Comments': daily.comments,
        'Total Shares': daily.shares,
        'Total Video Views': daily.videoViews,
        'Total Engagement': totalEngagement,
        'Engagement Rate (%)': engagementRate.toFixed(2)
      };
    });

    const csv = stringify(rows, {
      header: true,
      quoted: true
    });

    return csv;
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

**GET /api/analytics/export/csv**

Query Parameters:
```typescript
{
  groupId?: string;
  integrationIds?: string[];
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  format?: 'post' | 'reel' | 'all';
  exportType: 'detailed' | 'summary';  // Default: detailed
}
```

Response:
```
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics-export-2025-01-14.csv"

[CSV content]
```

### Controller Implementation

```typescript
@Get('/export/csv')
@ApiOperation({ summary: 'Export analytics data as CSV' })
@ApiQuery({ name: 'groupId', required: false })
@ApiQuery({ name: 'integrationIds', required: false, type: [String] })
@ApiQuery({ name: 'startDate', required: true, description: 'YYYY-MM-DD' })
@ApiQuery({ name: 'endDate', required: true, description: 'YYYY-MM-DD' })
@ApiQuery({ name: 'format', required: false, enum: ['post', 'reel', 'all'] })
@ApiQuery({ name: 'exportType', required: false, enum: ['detailed', 'summary'] })
@ApiResponse({ status: 200, description: 'CSV file download' })
@ApiResponse({ status: 400, description: 'Invalid parameters' })
async exportCSV(
  @GetOrgFromRequest() org: Organization,
  @Query('groupId') groupId?: string,
  @Query('integrationIds') integrationIds?: string,
  @Query('startDate') startDate?: string,
  @Query('endDate') endDate?: string,
  @Query('format') format: 'post' | 'reel' | 'all' = 'all',
  @Query('exportType') exportType: 'detailed' | 'summary' = 'detailed',
  @Res() res?: Response
) {
  try {
    // Validate dates
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    if (!dayjs(startDate, 'YYYY-MM-DD', true).isValid() ||
        !dayjs(endDate, 'YYYY-MM-DD', true).isValid()) {
      throw new BadRequestException('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate date range (max 90 days)
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    if (end.diff(start, 'days') > 90) {
      throw new BadRequestException('Date range cannot exceed 90 days');
    }

    // Generate CSV
    const csv = await this._exportService.generateCSV(org.id, {
      groupId,
      integrationIds: integrationIds?.split(',').filter(Boolean),
      startDate,
      endDate,
      format,
      exportType
    });

    // Set response headers for file download
    const filename = `analytics-export-${startDate}-to-${endDate}.csv`;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    return res.send(csv);
  } catch (error: any) {
    if (error instanceof BadRequestException) {
      throw error;
    }
    throw error;
  }
}
```

### Frontend Implementation

**ExportModal Component:**

```typescript
'use client';
import { useState } from 'react';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';
import dayjs from 'dayjs';

export const ExportModal = ({ groupId, onClose }) => {
  const fetch = useFetch();
  const [startDate, setStartDate] = useState(
    dayjs().subtract(7, 'days').format('YYYY-MM-DD')
  );
  const [endDate, setEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [format, setFormat] = useState<'all' | 'post' | 'reel'>('all');
  const [exportType, setExportType] = useState<'detailed' | 'summary'>('detailed');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const queryString = new URLSearchParams({
        startDate,
        endDate,
        format,
        exportType,
        ...(groupId && { groupId })
      }).toString();

      const response = await fetch(`/analytics/export/csv?${queryString}`);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export CSV. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-third p-[24px] rounded-[8px] w-[500px]">
        <h2 className="text-[20px] font-bold mb-[16px]">Export Analytics Data</h2>

        {/* Date Range */}
        <div className="mb-[16px]">
          <label className="block text-sm mb-[8px]">Date Range</label>
          <div className="flex gap-[8px]">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-[12px] py-[8px] bg-forth rounded-[4px]"
            />
            <span className="text-neutral-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-[12px] py-[8px] bg-forth rounded-[4px]"
            />
          </div>
          <p className="text-xs text-neutral-400 mt-[4px]">
            Maximum 90 days
          </p>
        </div>

        {/* Format */}
        <div className="mb-[16px]">
          <label className="block text-sm mb-[8px]">Content Format</label>
          <div className="flex gap-[8px]">
            {['all', 'post', 'reel'].map(f => (
              <button
                key={f}
                onClick={() => setFormat(f as any)}
                className={`flex-1 px-[12px] py-[8px] rounded-[4px] text-sm ${
                  format === f
                    ? 'bg-primary text-white'
                    : 'bg-forth text-neutral-400'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Export Type */}
        <div className="mb-[24px]">
          <label className="block text-sm mb-[8px]">Export Type</label>
          <div className="flex gap-[8px]">
            <button
              onClick={() => setExportType('detailed')}
              className={`flex-1 px-[12px] py-[8px] rounded-[4px] text-sm ${
                exportType === 'detailed'
                  ? 'bg-primary text-white'
                  : 'bg-forth text-neutral-400'
              }`}
            >
              Detailed (per content)
            </button>
            <button
              onClick={() => setExportType('summary')}
              className={`flex-1 px-[12px] py-[8px] rounded-[4px] text-sm ${
                exportType === 'summary'
                  ? 'bg-primary text-white'
                  : 'bg-forth text-neutral-400'
              }`}
            >
              Summary (per day)
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-[8px] justify-end">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-[16px] py-[8px] bg-forth rounded-[4px] text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-[16px] py-[8px] bg-primary text-white rounded-[4px] text-sm disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};
```

### Performance Considerations

**Large Datasets:**
- Limit export to 90 days max
- For >10K rows, consider streaming
- Add pagination for very large exports
- Future: Background job + email link

**Memory:**
- Use streaming for large CSV generation
- Don't load all data into memory at once

**Rate Limiting:**
- Limit exports to 5 per hour per user
- Prevent abuse

### Edge Cases

**Empty Data:**
- Return CSV with headers only
- Show message in UI

**Invalid Date Range:**
- Validate start < end
- Max 90 days
- Return 400 error

**Large Export:**
- Show warning for >1000 rows
- Consider pagination or chunking

**Special Characters:**
- Properly escape quotes in CSV
- Handle unicode characters
- Use RFC 4180 compliant format

### References

- [Source: docs/epics.md#Story-5.1]
- FR coverage: FR-016
- Story 3.2: Dashboard data source
- Story 4.2: Trending topics (tags)

### Related Files

- `docs/stories/3-2-dashboard-filters-kpis-top-content.md` - Data source
- `libraries/nestjs-libraries/src/database/prisma/analytics/analytics-export.service.ts` - New service

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 4-5 hours
- AnalyticsExportService: 2.5 hours
- CSV generation: 1 hour
- API endpoint: 0.5 hours
- Testing: 1 hour

**Frontend:** 3-4 hours
- ExportModal component: 2 hours
- File download handling: 0.5 hours
- Integration: 0.5 hours
- Testing: 1 hour

**Total:** 7-9 hours (1 focused session)

### Definition of Done

- [ ] AnalyticsExportService generates CSV
- [ ] Detailed export (per content) working
- [ ] Summary export (per day) working
- [ ] API endpoint returns CSV file download
- [ ] Date range validation (max 90 days)
- [ ] Format filtering works (post/reel/all)
- [ ] Group filtering works
- [ ] Frontend ExportModal complete
- [ ] File download triggers correctly
- [ ] Special characters handled (CSV escaping)
- [ ] Large datasets handled gracefully
- [ ] Error handling complete
- [ ] Code follows Postiz patterns
- [ ] Story marked as done in sprint-status.yaml

## Success Metrics

**User Metrics:**
- Leaders can export in <10 seconds
- CSV opens correctly in Excel/Sheets
- All data accurate

**Technical Metrics:**
- CSV generation <5 seconds for 1000 rows
- Proper CSV formatting (RFC 4180)
- No data loss or corruption

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 3.2 (Dashboard data) available
- [ ] csv-stringify or similar library available
- [ ] File download mechanism tested

### Implementation Notes

**Critical Path:**
1. Service layer (blocking)
2. API endpoint (blocking)
3. Frontend modal (can parallelize)

**Risk Areas:**
- Large dataset performance
- CSV formatting edge cases
- Special character handling

**Recommendations:**
- Start with detailed export
- Add streaming for large exports if needed
- Test with real data
- Validate CSV in Excel/Sheets

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met, clear CSV structure, standard format.
