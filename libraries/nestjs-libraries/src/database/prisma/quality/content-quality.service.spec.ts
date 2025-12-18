import { Test, TestingModule } from '@nestjs/testing';
import { ContentQualityService } from './content-quality.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

describe('ContentQualityService', () => {
  let service: ContentQualityService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    analyticsContent: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    analyticsDailyMetric: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        ContentQualityService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = testModule.get<ContentQualityService>(ContentQualityService);
    prismaService = testModule.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('calculateQualityScore', () => {
    it('should return null if content not found', async () => {
      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(null);

      const result = await service.calculateQualityScore('org-1', 'content-1');

      expect(result).toBeNull();
    });

    it('should calculate quality score with all factors', async () => {
      const mockContent = {
        id: 'content-1',
        externalContentId: 'ext-1',
        organizationId: 'org-1',
        integrationId: 'int-1',
        contentType: 'post',
        caption: 'Test post caption',
        publishedAt: new Date('2025-12-01'),
        deletedAt: null,
      };

      const mockMetrics = [
        {
          reach: 1000,
          reactions: 50,
          comments: 20,
          shares: 10,
          videoViews: 0,
        },
      ];

      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContent);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue(mockMetrics);
      mockPrismaService.analyticsContent.count.mockResolvedValue(7);

      const result = await service.calculateQualityScore('org-1', 'content-1');

      expect(result).not.toBeNull();
      expect(result?.contentId).toBe('content-1');
      expect(result?.overallScore).toBeGreaterThanOrEqual(0);
      expect(result?.overallScore).toBeLessThanOrEqual(100);
      expect(result?.engagementScore).toBeDefined();
      expect(result?.watchTimeScore).toBeDefined();
      expect(result?.complianceScore).toBeDefined();
      expect(result?.consistencyScore).toBeDefined();
      expect(result?.interpretation).toBeDefined();
    });

    it('should detect clickbait patterns and reduce compliance score', async () => {
      const mockContent = {
        id: 'content-1',
        externalContentId: 'ext-1',
        organizationId: 'org-1',
        integrationId: 'int-1',
        contentType: 'post',
        caption: 'You won\'t believe what happened! SHOCKING news!',
        publishedAt: new Date('2025-12-01'),
        deletedAt: null,
      };

      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContent);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(7);

      const result = await service.calculateQualityScore('org-1', 'content-1');

      expect(result?.complianceScore).toBeLessThan(100);
    });

    it('should return improvement suggestions for low scores', async () => {
      const mockContent = {
        id: 'content-1',
        externalContentId: 'ext-1',
        organizationId: 'org-1',
        integrationId: 'int-1',
        contentType: 'reel',
        caption: 'Test',
        publishedAt: new Date('2025-12-01'),
        deletedAt: null,
      };

      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContent);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([
        { reach: 100, reactions: 1, comments: 0, shares: 0, videoViews: 10 },
      ]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(1);

      const result = await service.calculateQualityScore('org-1', 'content-1');

      expect(result?.improvements).toBeDefined();
      expect(Array.isArray(result?.improvements)).toBe(true);
    });
  });

  describe('getContentByQuality', () => {
    it('should return sorted content list', async () => {
      const mockContentList = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          contentType: 'post',
          caption: 'Post 1',
          publishedAt: new Date('2025-12-01'),
          integrationId: 'int-1',
          organizationId: 'org-1',
          deletedAt: null,
        },
        {
          id: 'content-2',
          externalContentId: 'ext-2',
          contentType: 'reel',
          caption: 'Reel 1',
          publishedAt: new Date('2025-12-02'),
          integrationId: 'int-1',
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContentList);
      mockPrismaService.analyticsContent.findFirst.mockImplementation(async ({ where }) => {
        return mockContentList.find((c) => c.id === where.id) || null;
      });
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(5);

      const result = await service.getContentByQuality('org-1', { limit: 10 });

      expect(result.items).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should filter by score range', async () => {
      const mockContentList = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          contentType: 'post',
          caption: 'Post 1',
          publishedAt: new Date('2025-12-01'),
          integrationId: 'int-1',
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContentList);
      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContentList[0]);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(5);

      const result = await service.getContentByQuality('org-1', {
        minScore: 80,
        maxScore: 100,
      });

      expect(result).toBeDefined();
    });
  });

  describe('getQualityTrends', () => {
    it('should return trend data for specified period', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getQualityTrends('org-1', 7);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
    });

    it('should calculate averages for each day', async () => {
      const mockContent = {
        id: 'content-1',
        externalContentId: 'ext-1',
        contentType: 'post',
        caption: 'Test',
        publishedAt: new Date(),
        integrationId: 'int-1',
        organizationId: 'org-1',
        deletedAt: null,
      };

      mockPrismaService.analyticsContent.findMany.mockResolvedValue([mockContent]);
      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContent);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(5);

      const result = await service.getQualityTrends('org-1', 7);

      expect(result).toBeDefined();
      result.forEach((point) => {
        expect(point.date).toBeDefined();
        expect(typeof point.averageScore).toBe('number');
        expect(typeof point.contentCount).toBe('number');
      });
    });
  });

  describe('score interpretation', () => {
    it('should return correct interpretation for excellent score', async () => {
      const mockContent = {
        id: 'content-1',
        externalContentId: 'ext-1',
        organizationId: 'org-1',
        integrationId: 'int-1',
        contentType: 'post',
        caption: 'Great content',
        publishedAt: new Date('2025-12-01'),
        deletedAt: null,
      };

      mockPrismaService.analyticsContent.findFirst.mockResolvedValue(mockContent);
      mockPrismaService.analyticsDailyMetric.findMany.mockResolvedValue([
        { reach: 100, reactions: 50, comments: 30, shares: 20, videoViews: 0 },
      ]);
      mockPrismaService.analyticsContent.count.mockResolvedValue(10);

      const result = await service.calculateQualityScore('org-1', 'content-1');

      expect(result?.interpretation).toBeDefined();
      expect(['Excellent quality', 'Good quality', 'Average, needs improvement', 'Poor quality, action required']).toContain(result?.interpretation);
    });
  });
});
