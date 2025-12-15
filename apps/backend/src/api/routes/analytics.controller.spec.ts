import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { StarsService } from '@gitroom/nestjs-libraries/database/prisma/stars/stars.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { Organization } from '@prisma/client';

import { AnalyticsTrackingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tracking.service';
import { AnalyticsGroupService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-group.service';
import { AnalyticsDashboardService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-dashboard.service';
import { AnalyticsTaggingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tagging.service';
import { AnalyticsTrendingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-trending.service';
import { AnalyticsBestTimeService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-best-time.service';
import { AnalyticsDailyBriefService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-daily-brief.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let starsService: StarsService;
  let integrationService: IntegrationService;
  let analyticsTrackingService: AnalyticsTrackingService;
  let taggingService: AnalyticsTaggingService;
  let trendingService: AnalyticsTrendingService;
  let bestTimeService: AnalyticsBestTimeService;

  const mockOrganization = {
    id: 'test-org-id',
    name: 'Test Organization',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Organization;

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      controllers: [AnalyticsController],
      providers: [
        {
          provide: StarsService,
          useValue: {
            getStars: jest.fn(),
            getStarsFilter: jest.fn(),
          },
        },
        {
          provide: IntegrationService,
          useValue: {
            checkAnalytics: jest.fn(),
          },
        },
        {
          provide: AnalyticsTrackingService,
          useValue: {
            getTrackedIntegrations: jest.fn(),
            updateTrackedIntegrations: jest.fn(),
          },
        },
        {
          provide: AnalyticsGroupService,
          useValue: {},
        },
        {
          provide: AnalyticsDashboardService,
          useValue: {},
        },
        {
          provide: AnalyticsTaggingService,
          useValue: {
            getTags: jest.fn(),
            createManualTag: jest.fn(),
            updateTag: jest.fn(),
            deleteTag: jest.fn(),
            assignTagToContent: jest.fn(),
            removeTagFromContent: jest.fn(),
          },
        },
        {
          provide: AnalyticsTrendingService,
          useValue: {
            getTrendingTopics: jest.fn(),
          },
        },
        {
          provide: AnalyticsBestTimeService,
          useValue: {
            getBestTimeSlots: jest.fn(),
          },
        },
        {
          provide: AnalyticsDailyBriefService,
          useValue: {},
        },
      ],
    }).compile();

    controller = testModule.get<AnalyticsController>(AnalyticsController);
    starsService = testModule.get<StarsService>(StarsService);
    integrationService = testModule.get<IntegrationService>(IntegrationService);
    analyticsTrackingService = testModule.get<AnalyticsTrackingService>(AnalyticsTrackingService);
    taggingService = testModule.get<AnalyticsTaggingService>(AnalyticsTaggingService);
    trendingService = testModule.get<AnalyticsTrendingService>(AnalyticsTrendingService);
    bestTimeService = testModule.get<AnalyticsBestTimeService>(AnalyticsBestTimeService);
  });

  describe('getDailyBrief', () => {
    it('should return mock daily brief with default values', async () => {
      const result = await controller.getDailyBrief(mockOrganization, {});

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('test-org-id');
      expect(result.date).toBeDefined();
      expect(result.summary).toEqual({
        totalPosts: 0,
        totalEngagement: 0,
        topPerformer: null,
      });
      expect(result.recommendations).toEqual([]);
      expect(result.trends).toEqual([]);
      expect(result.format).toBe('json');
    });

    it('should return daily brief with custom date', async () => {
      const customDate = '2025-12-13';
      const result = await controller.getDailyBrief(mockOrganization, {
        date: customDate,
      });

      expect(result.date).toBe(customDate);
      expect(result.organizationId).toBe('test-org-id');
    });

    it('should return daily brief with markdown format', async () => {
      const result = await controller.getDailyBrief(mockOrganization, {
        format: 'markdown',
      });

      expect(result.format).toBe('markdown');
    });

    it('should accept optional groupId parameter', async () => {
      const result = await controller.getDailyBrief(mockOrganization, {
        groupId: 'test-group-id',
      });

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('test-org-id');
    });
  });

  describe('getTrackedPages', () => {
    it('should return tracked integration IDs', async () => {
      const mockTrackedIds = ['int-1', 'int-2', 'int-3'];
      jest.spyOn(analyticsTrackingService, 'getTrackedIntegrations').mockResolvedValue(mockTrackedIds);

      const result = await controller.getTrackedPages(mockOrganization);

      expect(result).toEqual(mockTrackedIds);
      expect(analyticsTrackingService.getTrackedIntegrations).toHaveBeenCalledWith('test-org-id');
    });

    it('should return empty array when no pages tracked', async () => {
      jest.spyOn(analyticsTrackingService, 'getTrackedIntegrations').mockResolvedValue([]);

      const result = await controller.getTrackedPages(mockOrganization);

      expect(result).toEqual([]);
    });
  });

  describe('updateTrackedPages', () => {
    it('should update tracked pages successfully', async () => {
      const integrationIds = ['int-1', 'int-2'];
      jest.spyOn(analyticsTrackingService, 'updateTrackedIntegrations').mockResolvedValue();

      const result = await controller.updateTrackedPages(mockOrganization, { integrationIds });

      expect(result).toEqual({
        success: true,
        trackedCount: 2,
      });
      expect(analyticsTrackingService.updateTrackedIntegrations).toHaveBeenCalledWith(
        'test-org-id',
        integrationIds
      );
    });

    it('should throw BadRequestException when more than 20 integrations', async () => {
      const integrationIds = Array(21).fill('int-x');
      jest
        .spyOn(analyticsTrackingService, 'updateTrackedIntegrations')
        .mockRejectedValue(new Error('Cannot track more than 20 integrations'));

      await expect(
        controller.updateTrackedPages(mockOrganization, { integrationIds })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when integrationId does not belong to org', async () => {
      const integrationIds = ['int-1', 'invalid-int'];
      jest
        .spyOn(analyticsTrackingService, 'updateTrackedIntegrations')
        .mockRejectedValue(
          new Error('Integration IDs not found or do not belong to organization: invalid-int')
        );

      await expect(
        controller.updateTrackedPages(mockOrganization, { integrationIds })
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle empty array of integrationIds', async () => {
      jest.spyOn(analyticsTrackingService, 'updateTrackedIntegrations').mockResolvedValue();

      const result = await controller.updateTrackedPages(mockOrganization, {
        integrationIds: [],
      });

      expect(result).toEqual({
        success: true,
        trackedCount: 0,
      });
    });
  });

  describe('Epic 4: Trending Topics (Story 4.2)', () => {
    it('should return trending topics with default parameters', async () => {
      const mockTrendingTopics = [
        {
          tagId: 'tag-1',
          tagName: '#trending',
          tagType: 'hashtag',
          currentPeriodMentions: 50,
          previousPeriodMentions: 20,
          velocityScore: 2.5,
          trendDirection: 'up' as const,
        },
      ];

      jest.spyOn(trendingService, 'getTrendingTopics').mockResolvedValue(mockTrendingTopics);

      const result = await controller.getTrendingTopics(mockOrganization, '24h', undefined, undefined);

      expect(result).toEqual(mockTrendingTopics);
      expect(trendingService.getTrendingTopics).toHaveBeenCalledWith('test-org-id', {
        timeWindow: '24h',
        limit: 10,
      });
    });

    it('should handle custom time windows and limits', async () => {
      jest.spyOn(trendingService, 'getTrendingTopics').mockResolvedValue([]);

      await controller.getTrendingTopics(mockOrganization, {
        timeWindow: '72h',
        limit: 20,
      });

      expect(trendingService.getTrendingTopics).toHaveBeenCalledWith('test-org-id', {
        timeWindow: '72h',
        limit: 20,
      });
    });

    it('should filter by group ID when provided', async () => {
      jest.spyOn(trendingService, 'getTrendingTopics').mockResolvedValue([]);

      await controller.getTrendingTopics(mockOrganization, {
        timeWindow: '24h',
        groupId: 'group-123',
      });

      expect(trendingService.getTrendingTopics).toHaveBeenCalledWith('test-org-id', {
        timeWindow: '24h',
        limit: 10,
        groupId: 'group-123',
      });
    });
  });

  describe('Epic 4: Best Time to Post (Story 4.3)', () => {
    it('should return best time slots with heatmap', async () => {
      const mockBestTime = {
        heatmap: [
          {
            dayOfWeek: 1,
            hour: 10,
            engagementScore: 85.5,
            postCount: 15,
          },
        ],
        recommendations: [
          {
            dayOfWeek: 1,
            hour: 10,
            reason: 'High engagement rate',
            confidence: 0.9,
          },
        ],
      };

      jest.spyOn(bestTimeService, 'getBestTimeSlots').mockResolvedValue(mockBestTime);

      const result = await controller.getBestTimeToPost(mockOrganization, {});

      expect(result).toEqual(mockBestTime);
      expect(bestTimeService.getBestTimeSlots).toHaveBeenCalledWith('test-org-id', {});
    });

    it('should filter by integration IDs', async () => {
      const mockBestTime = {
        heatmap: [],
        recommendations: [],
      };

      jest.spyOn(bestTimeService, 'getBestTimeSlots').mockResolvedValue(mockBestTime);

      await controller.getBestTimeToPost(mockOrganization, {
        integrationIds: ['int-1', 'int-2'],
      });

      expect(bestTimeService.getBestTimeSlots).toHaveBeenCalledWith('test-org-id', {
        integrationIds: ['int-1', 'int-2'],
      });
    });

    it('should filter by group ID', async () => {
      const mockBestTime = {
        heatmap: [],
        recommendations: [],
      };

      jest.spyOn(bestTimeService, 'getBestTimeSlots').mockResolvedValue(mockBestTime);

      await controller.getBestTimeToPost(mockOrganization, {
        groupId: 'group-456',
      });

      expect(bestTimeService.getBestTimeSlots).toHaveBeenCalledWith('test-org-id', {
        groupId: 'group-456',
      });
    });
  });

  describe('Epic 4: Content Tagging (Story 4.1)', () => {
    it('should get all tags for organization', async () => {
      const mockTags = [
        {
          id: 'tag-1',
          name: 'campaign-2025',
          type: 'manual',
          createdAt: new Date(),
        },
      ];

      jest.spyOn(taggingService, 'getTags').mockResolvedValue(mockTags);

      const result = await controller.getTags(mockOrganization);

      expect(result).toEqual(mockTags);
      expect(taggingService.getTags).toHaveBeenCalledWith('test-org-id');
    });

    it('should create a new manual tag', async () => {
      const newTag = {
        id: 'tag-new',
        name: 'new-campaign',
        type: 'manual' as const,
        createdAt: new Date(),
      };

      jest.spyOn(taggingService, 'createManualTag').mockResolvedValue(newTag);

      const result = await controller.createTag(mockOrganization, {
        name: 'new-campaign',
      });

      expect(result).toEqual(newTag);
      expect(taggingService.createManualTag).toHaveBeenCalledWith('test-org-id', 'new-campaign');
    });

    it('should update existing tag', async () => {
      const updatedTag = {
        id: 'tag-1',
        name: 'updated-campaign',
        type: 'manual' as const,
        createdAt: new Date(),
      };

      jest.spyOn(taggingService, 'updateTag').mockResolvedValue(updatedTag);

      const result = await controller.updateTag(mockOrganization, 'tag-1', {
        name: 'updated-campaign',
      });

      expect(result).toEqual(updatedTag);
      expect(taggingService.updateTag).toHaveBeenCalledWith('test-org-id', 'tag-1', 'updated-campaign');
    });

    it('should delete tag', async () => {
      jest.spyOn(taggingService, 'deleteTag').mockResolvedValue();

      const result = await controller.deleteTag(mockOrganization, 'tag-1');

      expect(result).toEqual({ success: true });
      expect(taggingService.deleteTag).toHaveBeenCalledWith('test-org-id', 'tag-1');
    });

    it('should assign tag to content', async () => {
      jest.spyOn(taggingService, 'assignTagToContent').mockResolvedValue();

      const result = await controller.assignTag(mockOrganization, 'content-1', 'tag-1');

      expect(result).toEqual({ success: true });
      expect(taggingService.assignTagToContent).toHaveBeenCalledWith('test-org-id', 'content-1', 'tag-1');
    });

    it('should remove tag from content', async () => {
      jest.spyOn(taggingService, 'removeTagFromContent').mockResolvedValue();

      const result = await controller.removeTag(mockOrganization, 'content-1', 'tag-1');

      expect(result).toEqual({ success: true });
      expect(taggingService.removeTagFromContent).toHaveBeenCalledWith('test-org-id', 'content-1', 'tag-1');
    });
  });
});
