import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsController } from './analytics.controller';
import { StarsService } from '@gitroom/nestjs-libraries/database/prisma/stars/stars.service';
import { IntegrationService } from '@gitroom/nestjs-libraries/database/prisma/integrations/integration.service';
import { Organization } from '@prisma/client';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
  let starsService: StarsService;
  let integrationService: IntegrationService;

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
      ],
    }).compile();

    controller = module.get<AnalyticsController>(AnalyticsController);
    starsService = module.get<StarsService>(StarsService);
    integrationService = module.get<IntegrationService>(IntegrationService);
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
});
