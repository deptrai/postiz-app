import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { StarsService } from '@gitroom/nestjs-libraries/database/prisma/stars/stars.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { Organization } from '@prisma/client';

import { AnalyticsTrackingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tracking.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let starsService: StarsService;
  let integrationService: IntegrationService;
  let analyticsTrackingService: AnalyticsTrackingService;

  const mockOrganization: Organization = {
    id: 'test-org-id',
    name: 'Test Organization',
    createdAt: new Date(),
    updatedAt: new Date(),
    tier: 'FREE',
    companyId: null,
    apiKey: null,
    renewalDate: null,
    externalId: null,
    paymentMethod: null,
    subscriptionId: null,
    paymentCheckoutId: null,
    canceledAt: null,
    totalSpent: 0,
    providerId: null,
    paymentTransactionId: null,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    starsService = module.get<StarsService>(StarsService);
    integrationService = module.get<IntegrationService>(IntegrationService);
    analyticsTrackingService = module.get<AnalyticsTrackingService>(AnalyticsTrackingService);
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
});
