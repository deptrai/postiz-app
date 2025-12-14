# Story 4.1: Auto Keyword/Topic Tagging + Manual Campaign Tags

Status: ready-for-dev

## Story

As a **Leader**,
I want **auto tagging based on keywords/topics and manual campaign tags**,
So that **I can analyze content by pillars/campaigns and track what topics are working**.

## Acceptance Criteria

1. **Given** content has caption and hashtags (Story 2.2),
   **When** auto-tagging job runs,
   **Then** system extracts keywords and creates AUTO tags and assigns them to content.

2. **And** user can create manual CAMPAIGN tags via UI.

3. **And** user can assign manual tags to content.

4. **And** tags are visible on content items in the dashboard.

5. **And** tags can be used to filter analytics (preparation for future stories).

## Tasks / Subtasks

### Backend Implementation

- [ ] Auto Tagging System
  - [ ] Create AnalyticsTaggingService
  - [ ] Implement keyword extraction from caption
  - [ ] Implement hashtag parsing
  - [ ] Tag deduplication and normalization
  - [ ] Auto-assign extracted tags to content
  - [ ] Make idempotent (re-running doesn't duplicate)

- [ ] Manual Tag Management
  - [ ] CRUD API for campaign tags
  - [ ] Tag assignment/unassignment to content
  - [ ] Validation (unique tag names per org)
  - [ ] Tag type enforcement (AUTO vs MANUAL)

- [ ] Job/Worker Integration
  - [ ] Add tagging step to analytics worker
  - [ ] Process content after metadata ingestion
  - [ ] Batch process existing content
  - [ ] Error handling and logging

- [ ] API Endpoints
  - [ ] POST /api/analytics/tags - Create manual tag
  - [ ] GET /api/analytics/tags - List all tags
  - [ ] PUT /api/analytics/tags/:id - Update tag
  - [ ] DELETE /api/analytics/tags/:id - Delete tag
  - [ ] POST /api/analytics/content/:id/tags - Assign tag to content
  - [ ] DELETE /api/analytics/content/:id/tags/:tagId - Remove tag
  - [ ] POST /api/analytics/tags/auto-tag - Trigger auto-tagging job

### Frontend Implementation

- [ ] Tag Management UI
  - [ ] Tags list page
  - [ ] Create/edit tag modal
  - [ ] Tag type indicator (AUTO/MANUAL)
  - [ ] Tag usage count
  - [ ] Delete confirmation

- [ ] Content Tagging UI
  - [ ] Tag badges on content items
  - [ ] Tag assignment dropdown
  - [ ] Tag filter in dashboard
  - [ ] Visual distinction (AUTO vs MANUAL tags)

### Testing

- [ ] Backend tests
  - [ ] Unit test: Keyword extraction algorithm
  - [ ] Unit test: Hashtag parsing
  - [ ] Unit test: Tag normalization
  - [ ] Integration test: Auto-tagging job
  - [ ] Test CRUD operations
  - [ ] Test idempotency

- [ ] Frontend tests
  - [ ] Component test: Tag creation
  - [ ] Component test: Tag assignment
  - [ ] Test tag filtering

## Dev Notes

**Prerequisites:**
- Story 2.2 (AnalyticsContent with caption/hashtags)
- Story 1.2 (AnalyticsTag and AnalyticsContentTag schema)

**Technical Stack:**
- Backend: NestJS, Prisma
- Job processing: BullMQ (existing worker)
- Frontend: React, existing UI components

### Auto-Tagging Strategy (MVP)

**Rule-Based Keyword Extraction:**

For MVP, use simple rule-based extraction:
1. Extract hashtags from hashtags field (already parsed from Facebook)
2. Extract keywords from caption using common patterns
3. Normalize and deduplicate tags
4. Store as AUTO tags

**No ML/NLP required for MVP** - can enhance later

### Keyword Extraction Algorithm

```typescript
function extractKeywords(caption: string): string[] {
  if (!caption) return [];

  // Convert to lowercase
  const text = caption.toLowerCase();

  // Remove URLs
  const withoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');

  // Remove special characters except spaces and hyphens
  const cleaned = withoutUrls.replace(/[^a-z0-9\s-]/g, ' ');

  // Split into words
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  // Filter stopwords (common words like "the", "is", "and", etc.)
  const stopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that',
    'it', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
    'might', 'can', 'i', 'you', 'he', 'she', 'we', 'they', 'my', 'your'
  ]);

  const keywords = words
    .filter(word => word.length >= 3) // Min 3 characters
    .filter(word => !stopwords.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers

  // Deduplicate
  return Array.from(new Set(keywords));
}
```

### Hashtag Parsing

```typescript
function parseHashtags(hashtagsJson: string): string[] {
  if (!hashtagsJson) return [];

  try {
    const hashtags = JSON.parse(hashtagsJson);
    if (!Array.isArray(hashtags)) return [];

    return hashtags
      .map(tag => tag.toLowerCase().replace(/^#/, '').trim())
      .filter(tag => tag.length > 0);
  } catch (error) {
    return [];
  }
}
```

### Tag Normalization

```typescript
function normalizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => tag.length >= 2 && tag.length <= 50)
    .slice(0, 20); // Limit to 20 tags per content
}
```

### Service Implementation

**AnalyticsTaggingService:**

```typescript
@Injectable()
export class AnalyticsTaggingService {
  constructor(private _prismaService: PrismaService) {}

  /**
   * Auto-tag content based on caption and hashtags
   * Idempotent - can be re-run without creating duplicates
   */
  async autoTagContent(contentId: string): Promise<void> {
    // Get content
    const content = await this._prismaService.analyticsContent.findUnique({
      where: { id: contentId },
      include: { tags: { include: { tag: true } } }
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Extract keywords from caption
    const keywords = this.extractKeywords(content.caption || '');

    // Parse hashtags
    const hashtags = this.parseHashtags(content.hashtags || '');

    // Combine and normalize
    const allTags = this.normalizeTags([...keywords, ...hashtags]);

    // Get existing AUTO tags for this content
    const existingAutoTags = content.tags
      .filter(ct => ct.tag.type === 'AUTO')
      .map(ct => ct.tag.name);

    // Find new tags to add
    const newTags = allTags.filter(tag => !existingAutoTags.includes(tag));

    if (newTags.length === 0) {
      return; // No new tags to add
    }

    // Create or get AUTO tags
    for (const tagName of newTags) {
      // Upsert tag
      const tag = await this._prismaService.analyticsTag.upsert({
        where: {
          organizationId_name_type_deletedAt: {
            organizationId: content.organizationId,
            name: tagName,
            type: 'AUTO',
            deletedAt: null
          }
        },
        update: {},
        create: {
          organizationId: content.organizationId,
          name: tagName,
          type: 'AUTO'
        }
      });

      // Create content-tag association
      await this._prismaService.analyticsContentTag.upsert({
        where: {
          contentId_tagId: {
            contentId: content.id,
            tagId: tag.id
          }
        },
        update: {},
        create: {
          contentId: content.id,
          tagId: tag.id
        }
      });
    }
  }

  /**
   * Auto-tag multiple content items in batch
   */
  async autoTagBatch(contentIds: string[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ contentId: string; error: string }>;
  }> {
    const errors: Array<{ contentId: string; error: string }> = [];
    let success = 0;

    for (const contentId of contentIds) {
      try {
        await this.autoTagContent(contentId);
        success++;
      } catch (error: any) {
        errors.push({
          contentId,
          error: error.message
        });
      }
    }

    return {
      success,
      failed: errors.length,
      errors
    };
  }

  /**
   * Create manual campaign tag
   */
  async createManualTag(
    organizationId: string,
    name: string,
    description?: string
  ) {
    return this._prismaService.analyticsTag.create({
      data: {
        organizationId,
        name: name.toLowerCase().trim(),
        type: 'MANUAL',
        // Note: Prisma schema doesn't have description field
        // Add if needed: description
      }
    });
  }

  /**
   * Get all tags for organization
   */
  async getTags(organizationId: string, type?: 'AUTO' | 'MANUAL') {
    return this._prismaService.analyticsTag.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(type && { type })
      },
      include: {
        _count: {
          select: { content: true }
        }
      },
      orderBy: [
        { type: 'asc' }, // MANUAL first, then AUTO
        { name: 'asc' }
      ]
    });
  }

  /**
   * Assign manual tag to content
   */
  async assignTagToContent(
    organizationId: string,
    contentId: string,
    tagId: string
  ) {
    // Verify tag belongs to organization
    const tag = await this._prismaService.analyticsTag.findFirst({
      where: {
        id: tagId,
        organizationId,
        type: 'MANUAL', // Only manual tags can be manually assigned
        deletedAt: null
      }
    });

    if (!tag) {
      throw new Error('Tag not found or not manual');
    }

    // Verify content belongs to organization
    const content = await this._prismaService.analyticsContent.findFirst({
      where: {
        id: contentId,
        organizationId
      }
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // Create association
    return this._prismaService.analyticsContentTag.upsert({
      where: {
        contentId_tagId: {
          contentId,
          tagId
        }
      },
      update: {},
      create: {
        contentId,
        tagId
      }
    });
  }

  private extractKeywords(caption: string): string[] {
    // Implementation from algorithm above
    if (!caption) return [];
    
    const text = caption.toLowerCase();
    const withoutUrls = text.replace(/https?:\/\/[^\s]+/g, '');
    const cleaned = withoutUrls.replace(/[^a-z0-9\s-]/g, ' ');
    const words = cleaned.split(/\s+/).filter(w => w.length > 0);
    
    const stopwords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
      'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that'
    ]);
    
    const keywords = words
      .filter(word => word.length >= 3)
      .filter(word => !stopwords.has(word))
      .filter(word => !/^\d+$/.test(word));
    
    return Array.from(new Set(keywords));
  }

  private parseHashtags(hashtagsJson: string): string[] {
    if (!hashtagsJson) return [];
    
    try {
      const hashtags = JSON.parse(hashtagsJson);
      if (!Array.isArray(hashtags)) return [];
      
      return hashtags
        .map(tag => tag.toLowerCase().replace(/^#/, '').trim())
        .filter(tag => tag.length > 0);
    } catch (error) {
      return [];
    }
  }

  private normalizeTags(tags: string[]): string[] {
    return tags
      .map(tag => tag.toLowerCase().trim())
      .filter(tag => tag.length >= 2 && tag.length <= 50)
      .slice(0, 20);
  }
}
```

### Worker Integration

**Add to analytics.controller.ts (workers):**

```typescript
@EventPattern('analytics-tag-content', Transport.REDIS)
async processContentTagging(data: { contentIds: string[] }) {
  try {
    const result = await this._taggingService.autoTagBatch(data.contentIds);
    
    this._logger.log(
      `Auto-tagged ${result.success} content items, ${result.failed} failed`
    );
    
    if (result.failed > 0) {
      this._logger.warn(`Tagging errors: ${JSON.stringify(result.errors)}`);
    }
    
    return result;
  } catch (error: any) {
    this._logger.error(`Content tagging failed: ${error.message}`);
    throw error;
  }
}
```

**Add to analytics.ingestion.task.ts (cron):**

```typescript
// After content ingestion, emit tagging job
const contentIds = /* IDs from ingestion */;

if (contentIds.length > 0) {
  await this._workerServiceProducer.emit('analytics-tag-content', {
    contentIds
  }, {
    delay: 60000 // 1 minute after ingestion
  });
}
```

### API Design

**Tag Management Endpoints:**

```typescript
@Controller('/analytics/tags')
export class AnalyticsTagsController {
  constructor(private _taggingService: AnalyticsTaggingService) {}

  @Post('/')
  @ApiOperation({ summary: 'Create manual campaign tag' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 50 },
        description: { type: 'string' }
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'Tag created' })
  async createTag(
    @GetOrgFromRequest() org: Organization,
    @Body() body: { name: string; description?: string }
  ) {
    try {
      return await this._taggingService.createManualTag(
        org.id,
        body.name,
        body.description
      );
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Tag name already exists');
      }
      throw error;
    }
  }

  @Get('/')
  @ApiOperation({ summary: 'Get all tags' })
  @ApiQuery({ name: 'type', required: false, enum: ['AUTO', 'MANUAL'] })
  @ApiResponse({ status: 200, description: 'Tags list returned' })
  async getTags(
    @GetOrgFromRequest() org: Organization,
    @Query('type') type?: 'AUTO' | 'MANUAL'
  ) {
    return this._taggingService.getTags(org.id, type);
  }

  @Post('/:contentId/assign')
  @ApiOperation({ summary: 'Assign manual tag to content' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        tagId: { type: 'string' }
      },
      required: ['tagId']
    }
  })
  @ApiResponse({ status: 200, description: 'Tag assigned' })
  async assignTag(
    @GetOrgFromRequest() org: Organization,
    @Param('contentId') contentId: string,
    @Body() body: { tagId: string }
  ) {
    try {
      return await this._taggingService.assignTagToContent(
        org.id,
        contentId,
        body.tagId
      );
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Post('/auto-tag')
  @ApiOperation({ summary: 'Trigger auto-tagging for all content' })
  @ApiResponse({ status: 200, description: 'Auto-tagging job started' })
  async triggerAutoTagging(@GetOrgFromRequest() org: Organization) {
    // Get all content IDs for organization
    const content = await this._prismaService.analyticsContent.findMany({
      where: { organizationId: org.id },
      select: { id: true }
    });

    const contentIds = content.map(c => c.id);

    await this._workerServiceProducer.emit('analytics-tag-content', {
      contentIds
    });

    return {
      message: 'Auto-tagging job started',
      contentCount: contentIds.length
    };
  }
}
```

### Frontend Implementation

**Tags Management Page:**

```typescript
'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { useFetch } from '@gitroom/helpers/utils/custom.fetch';

export const TagsManagementPage = () => {
  const fetch = useFetch();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: tags, mutate } = useSWR(
    '/analytics/tags',
    async (url) => (await fetch(url)).json()
  );

  const createTag = async (name: string, description?: string) => {
    await fetch('/analytics/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    mutate();
  };

  return (
    <div className="p-[24px]">
      <div className="flex justify-between items-center mb-[24px]">
        <h1 className="text-[24px]">Content Tags</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-[16px] py-[8px] bg-primary text-white rounded-[4px]"
        >
          Create Campaign Tag
        </button>
      </div>

      <div className="grid grid-cols-2 gap-[16px]">
        {/* Manual Tags */}
        <TagsSection
          title="Campaign Tags (Manual)"
          tags={tags?.filter(t => t.type === 'MANUAL') || []}
        />

        {/* Auto Tags */}
        <TagsSection
          title="Auto-Generated Tags"
          tags={tags?.filter(t => t.type === 'AUTO') || []}
        />
      </div>

      {showCreateModal && (
        <CreateTagModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createTag}
        />
      )}
    </div>
  );
};

const TagsSection = ({ title, tags }) => (
  <div className="bg-third p-[16px] rounded-[8px]">
    <h2 className="text-[18px] mb-[12px]">{title}</h2>
    <div className="space-y-[8px]">
      {tags.map(tag => (
        <TagItem key={tag.id} tag={tag} />
      ))}
      {tags.length === 0 && (
        <p className="text-neutral-400 text-sm">No tags yet</p>
      )}
    </div>
  </div>
);

const TagItem = ({ tag }) => (
  <div className="flex justify-between items-center p-[12px] bg-forth rounded-[4px]">
    <div>
      <span className="font-medium">{tag.name}</span>
      <span className="text-sm text-neutral-400 ml-[8px]">
        ({tag._count.content} content items)
      </span>
    </div>
    {tag.type === 'MANUAL' && (
      <button className="text-red-500 text-sm">Delete</button>
    )}
  </div>
);
```

**Tag Badges on Content:**

```typescript
const ContentTagBadges = ({ tags }) => (
  <div className="flex flex-wrap gap-[4px] mt-[8px]">
    {tags.map(({ tag }) => (
      <span
        key={tag.id}
        className={`px-[8px] py-[4px] rounded-full text-xs ${
          tag.type === 'MANUAL'
            ? 'bg-blue-500/20 text-blue-300 border border-blue-500'
            : 'bg-neutral-500/20 text-neutral-300'
        }`}
      >
        {tag.type === 'MANUAL' && '📌 '}
        {tag.name}
      </span>
    ))}
  </div>
);
```

### Performance Considerations

**Auto-Tagging:**
- Process in batches (max 100 content items per job)
- Run as background job (don't block ingestion)
- Use upsert to make idempotent
- Limit to 20 tags per content item

**Tag Storage:**
- Index on (organizationId, name, type) for fast lookups
- Soft delete (deletedAt) to preserve history
- Cache tag lists for 5 minutes

### Edge Cases

**Empty Caption/Hashtags:**
- No keywords extracted → No AUTO tags created
- Content can have only MANUAL tags

**Duplicate Tags:**
- Normalize to lowercase
- Upsert prevents duplicates
- contentId + tagId unique constraint

**Tag Deletion:**
- Soft delete (set deletedAt)
- Keep tag associations for history
- Show "(deleted)" in UI

**Large Captions:**
- Limit to 20 keywords per content
- Skip very common words (stopwords)
- Prioritize hashtags over caption keywords

### References

- [Source: docs/epics.md#Story-4.1]
- FR coverage: FR-006, FR-007
- Story 2.2: AnalyticsContent with caption/hashtags
- Story 1.2: AnalyticsTag and AnalyticsContentTag schema

### Related Files

- `docs/stories/2-2-ingest-content-metadata.md` - Content metadata source
- `libraries/nestjs-libraries/src/database/prisma/schema.prisma` - Tag models
- `apps/workers/src/app/analytics.controller.ts` - Add tagging worker
- `apps/cron/src/tasks/analytics.ingestion.task.ts` - Emit tagging jobs

### Agent Model Used

Cascade (with SM persona)

### Estimated Effort

**Backend:** 6-8 hours
- AnalyticsTaggingService: 3 hours
- Keyword extraction algorithm: 1 hour
- API endpoints: 1 hour
- Worker integration: 1 hour
- Testing: 1-2 hours

**Frontend:** 4-5 hours
- Tags management page: 2 hours
- Tag badges component: 1 hour
- Tag assignment UI: 1 hour
- Testing: 1 hour

**Total:** 10-13 hours (1-2 focused sessions)

### Definition of Done

- [ ] AnalyticsTaggingService implements keyword extraction
- [ ] Auto-tagging job processes content after ingestion
- [ ] Manual tag CRUD API working
- [ ] Tags can be assigned to content
- [ ] Frontend displays tags on content
- [ ] Tags management UI complete
- [ ] AUTO vs MANUAL tags visually distinct
- [ ] Keyword extraction tested and accurate
- [ ] Idempotency verified (re-run doesn't duplicate)
- [ ] Edge cases handled (empty caption, duplicates)
- [ ] Code follows Postiz patterns
- [ ] Story marked as done in sprint-status.yaml

## Success Metrics

**User Metrics:**
- Leaders can create campaign tags in <30 seconds
- Auto-tags appear on content within 5 minutes of ingestion
- Tag management UI intuitive

**Technical Metrics:**
- Keyword extraction accuracy >70% (relevant keywords)
- Auto-tagging job processes 100 items in <10 seconds
- Zero duplicate tags created
- Tag assignment API <200ms response time

## Senior Developer Review (AI)

### Pre-Implementation Checklist

- [ ] Story 2.2 (Content metadata) complete
- [ ] AnalyticsTag schema exists
- [ ] BullMQ worker infrastructure ready
- [ ] Stopwords list validated

### Implementation Notes

**Critical Path:**
1. Service layer (blocking)
2. Worker integration (blocking)
3. API endpoints (can parallelize with frontend)

**Risk Areas:**
- Keyword extraction accuracy
- Performance with large captions
- Tag explosion (too many AUTO tags)

**Recommendations:**
- Start with hashtag parsing (simpler)
- Add keyword extraction iteratively
- Monitor tag count per content
- Consider tag merging/cleanup job

### Verdict

✅ **READY FOR DEVELOPMENT** - Prerequisites met, algorithm defined, clear scope for MVP.
