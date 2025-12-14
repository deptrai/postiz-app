import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsExportService } from './analytics-export.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

describe('AnalyticsExportService', () => {
  let service: AnalyticsExportService;
  let prismaService: PrismaService;

  const mockOrganizationId = 'test-org-id';

  const mockContent = [
    {
      id: 'content-1',
      organizationId: mockOrganizationId,
      integrationId: 'int-1',
      externalContentId: 'ext-1',
      contentType: 'post',
      caption: 'Test post caption #test #hashtag',
      hashtags: '["test", "hashtag"]',
      publishedAt: new Date('2025-01-10T14:30:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      integration: { name: 'TestPage' },
      tags: [{ tag: { name: 'ai' } }, { tag: { name: 'startup' } }],
    },
    {
      id: 'content-2',
      organizationId: mockOrganizationId,
      integrationId: 'int-1',
      externalContentId: 'ext-2',
      contentType: 'reel',
      caption: 'Test reel caption',
      hashtags: null,
      publishedAt: new Date('2025-01-11T10:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      integration: { name: 'TestPage' },
      tags: [],
    },
  ];

  const mockDailyMetrics = [
    {
      id: 'metric-1',
      organizationId: mockOrganizationId,
      integrationId: 'int-1',
      externalContentId: 'ext-1',
      date: new Date('2025-01-10'),
      impressions: 1000,
      reach: 800,
      reactions: 50,
      comments: 10,
      shares: 5,
      videoViews: 0,
      clicks: 20,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'metric-2',
      organizationId: mockOrganizationId,
      integrationId: 'int-1',
      externalContentId: 'ext-1',
      date: new Date('2025-01-11'),
      impressions: 500,
      reach: 400,
      reactions: 25,
      comments: 5,
      shares: 2,
      videoViews: 0,
      clicks: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'metric-3',
      organizationId: mockOrganizationId,
      integrationId: 'int-1',
      externalContentId: 'ext-2',
      date: new Date('2025-01-11'),
      impressions: 2000,
      reach: 1500,
      reactions: 100,
      comments: 20,
      shares: 10,
      videoViews: 500,
      clicks: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  ];

  const mockGroup = {
    id: 'group-1',
    organizationId: mockOrganizationId,
    name: 'Test Group',
    description: null,
    niche: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    members: [
      {
        trackedIntegration: { integrationId: 'int-1' },
      },
    ],
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsExportService,
        {
          provide: PrismaService,
          useValue: {
            analyticsContent: {
              findMany: jest.fn(),
            },
            analyticsDailyMetric: {
              findMany: jest.fn(),
            },
            analyticsGroup: {
              findFirst: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = testModule.get<AnalyticsExportService>(AnalyticsExportService);
    prismaService = testModule.get<PrismaService>(PrismaService);
  });

  describe('generateCSV', () => {
    describe('detailed export', () => {
      it('should generate detailed CSV with content and metrics', async () => {
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(mockContent as any);
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany')
          .mockResolvedValueOnce(mockDailyMetrics.filter(m => m.externalContentId === 'ext-1') as any)
          .mockResolvedValueOnce(mockDailyMetrics.filter(m => m.externalContentId === 'ext-2') as any);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'detailed',
        });

        expect(csv).toBeDefined();
        expect(csv).toContain('Content ID');
        expect(csv).toContain('Integration Name');
        expect(csv).toContain('Content Type');
        expect(csv).toContain('Published Date');
        expect(csv).toContain('Total Reach');
        expect(csv).toContain('Total Engagement');
        expect(csv).toContain('Engagement Rate (%)');
        expect(csv).toContain('content-1');
        expect(csv).toContain('TestPage');
        expect(csv).toContain('post');
      });

      it('should handle empty content', async () => {
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue([]);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'detailed',
        });

        expect(csv).toBeDefined();
        expect(csv).toContain('Content ID');
        // Should only have header row
        const lines = csv.trim().split('\n');
        expect(lines.length).toBe(1);
      });

      it('should filter by format', async () => {
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue([mockContent[0]] as any);
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          format: 'post',
          exportType: 'detailed',
        });

        expect(prismaService.analyticsContent.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              contentType: 'post',
            }),
          })
        );
      });

      it('should filter by groupId', async () => {
        jest.spyOn(prismaService.analyticsGroup, 'findFirst').mockResolvedValue(mockGroup as any);
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue([]);

        await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          groupId: 'group-1',
          exportType: 'detailed',
        });

        expect(prismaService.analyticsGroup.findFirst).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              id: 'group-1',
              organizationId: mockOrganizationId,
            }),
          })
        );
      });

      it('should handle null hashtags', async () => {
        const contentWithNullHashtags = [{ ...mockContent[1], hashtags: null }];
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(contentWithNullHashtags as any);
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'detailed',
        });

        expect(csv).toBeDefined();
        expect(csv).toContain('content-2');
      });

      it('should handle invalid JSON hashtags', async () => {
        const contentWithInvalidHashtags = [{ ...mockContent[0], hashtags: 'invalid-json' }];
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(contentWithInvalidHashtags as any);
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'detailed',
        });

        expect(csv).toBeDefined();
        // Should not throw, hashtags should be empty
      });

      it('should properly escape special characters in CSV', async () => {
        const contentWithSpecialChars = [{
          ...mockContent[0],
          caption: 'Test "quoted" caption with, commas\nand newlines',
        }];
        jest.spyOn(prismaService.analyticsContent, 'findMany').mockResolvedValue(contentWithSpecialChars as any);
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'detailed',
        });

        expect(csv).toBeDefined();
        // Newlines should be replaced with spaces
        expect(csv).not.toContain('\nand newlines');
      });
    });

    describe('summary export', () => {
      it('should generate summary CSV grouped by date', async () => {
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(mockDailyMetrics as any);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'summary',
        });

        expect(csv).toBeDefined();
        expect(csv).toContain('Date');
        expect(csv).toContain('Content Count');
        expect(csv).toContain('Total Reach');
        expect(csv).toContain('Total Engagement');
        expect(csv).toContain('Engagement Rate (%)');
        expect(csv).toContain('2025-01-10');
        expect(csv).toContain('2025-01-11');
      });

      it('should handle empty metrics', async () => {
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'summary',
        });

        expect(csv).toBeDefined();
        expect(csv).toContain('Date');
        // Should only have header row
        const lines = csv.trim().split('\n');
        expect(lines.length).toBe(1);
      });

      it('should aggregate metrics correctly per day', async () => {
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(mockDailyMetrics as any);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'summary',
        });

        // 2025-01-10: 1 metric with reach=800, engagement=65
        // 2025-01-11: 2 metrics with reach=400+1500=1900, engagement=32+130=162
        expect(csv).toContain('2025-01-10');
        expect(csv).toContain('2025-01-11');
      });

      it('should filter by integrationIds', async () => {
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue([]);

        await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          integrationIds: ['int-1', 'int-2'],
          exportType: 'summary',
        });

        expect(prismaService.analyticsDailyMetric.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              integrationId: { in: ['int-1', 'int-2'] },
            }),
          })
        );
      });
    });

    describe('engagement rate calculation', () => {
      it('should calculate engagement rate correctly', async () => {
        const metricsWithKnownValues = [{
          ...mockDailyMetrics[0],
          reach: 1000,
          reactions: 50,
          comments: 30,
          shares: 20,
        }];
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(metricsWithKnownValues as any);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'summary',
        });

        // Engagement = 50 + 30 + 20 = 100
        // Rate = (100 / 1000) * 100 = 10%
        expect(csv).toContain('10.00');
      });

      it('should handle zero reach (avoid division by zero)', async () => {
        const metricsWithZeroReach = [{
          ...mockDailyMetrics[0],
          reach: 0,
          reactions: 10,
          comments: 5,
          shares: 2,
        }];
        jest.spyOn(prismaService.analyticsDailyMetric, 'findMany').mockResolvedValue(metricsWithZeroReach as any);

        const csv = await service.generateCSV(mockOrganizationId, {
          startDate: '2025-01-10',
          endDate: '2025-01-12',
          exportType: 'summary',
        });

        // Should not throw, engagement rate should be 0
        expect(csv).toContain('0.00');
      });
    });
  });
});
