import { Test, TestingModule } from '@nestjs/testing';
import { WatchTimeAnalyticsService } from './watch-time-analytics.service';
import { PrismaService } from '../prisma.service';

describe('WatchTimeAnalyticsService', () => {
  let service: WatchTimeAnalyticsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    analyticsContent: {
      findMany: jest.fn(),
    },
    analyticsMetric: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchTimeAnalyticsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<WatchTimeAnalyticsService>(WatchTimeAnalyticsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWatchTimeMetrics', () => {
    const orgId = 'test-org-id';

    it('should calculate watch time metrics for reels correctly', async () => {
      // Mock 3 reels with 1000 views each
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
        {
          id: 'content-2',
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
        {
          id: 'content-3',
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
      ]);

      const result = await service.getWatchTimeMetrics(orgId);

      // 3 reels * 1000 views * 30 seconds = 90,000 seconds = 1,500 minutes = 25 hours
      expect(result.totalWatchTimeMinutes).toBe(1500);
      expect(result.totalWatchTimeHours).toBe(25);
      expect(result.totalViews).toBe(3000);
      expect(result.totalVideos).toBe(3);
      expect(result.averageViewDurationSeconds).toBe(30); // 90,000 / 3000
      expect(result.completionRate).toBe(70); // Default estimate
    });

    it('should calculate watch time metrics for videos correctly', async () => {
      // Mock 2 videos with 500 views each
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          contentType: 'video',
          metrics: [{ metricValue: 500 }],
        },
        {
          id: 'content-2',
          contentType: 'video',
          metrics: [{ metricValue: 500 }],
        },
      ]);

      const result = await service.getWatchTimeMetrics(orgId);

      // 2 videos * 500 views * 180 seconds = 180,000 seconds = 3,000 minutes = 50 hours
      expect(result.totalWatchTimeMinutes).toBe(3000);
      expect(result.totalWatchTimeHours).toBe(50);
      expect(result.totalViews).toBe(1000);
      expect(result.totalVideos).toBe(2);
      expect(result.averageViewDurationSeconds).toBe(180); // 180,000 / 1000
    });

    it('should handle mixed content types', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
        {
          id: 'content-2',
          contentType: 'video',
          metrics: [{ metricValue: 500 }],
        },
        {
          id: 'content-3',
          contentType: 'story',
          metrics: [{ metricValue: 2000 }],
        },
      ]);

      const result = await service.getWatchTimeMetrics(orgId);

      // Reel: 1000 * 30 = 30,000s
      // Video: 500 * 180 = 90,000s
      // Story: 2000 * 15 = 30,000s
      // Total: 150,000s = 2,500 minutes
      expect(result.totalWatchTimeMinutes).toBe(2500);
      expect(result.totalViews).toBe(3500);
      expect(result.totalVideos).toBe(3);
    });

    it('should ignore posts with no watch time', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
        {
          id: 'content-2',
          contentType: 'post',
          metrics: [{ metricValue: 5000 }],
        },
      ]);

      const result = await service.getWatchTimeMetrics(orgId);

      // Only reel should count: 1000 * 30 = 30,000s = 500 minutes
      expect(result.totalWatchTimeMinutes).toBe(500);
      expect(result.totalViews).toBe(1000); // Post views not counted
      expect(result.totalVideos).toBe(1); // Only reel counted
    });

    it('should handle no content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getWatchTimeMetrics(orgId);

      expect(result.totalWatchTimeMinutes).toBe(0);
      expect(result.totalWatchTimeHours).toBe(0);
      expect(result.totalViews).toBe(0);
      expect(result.totalVideos).toBe(0);
      expect(result.averageViewDurationSeconds).toBe(0);
      expect(result.completionRate).toBe(0);
    });

    it('should handle content with multiple metrics', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          contentType: 'reel',
          metrics: [
            { metricValue: 500 },
            { metricValue: 300 },
            { metricValue: 200 },
          ],
        },
      ]);

      const result = await service.getWatchTimeMetrics(orgId);

      // Total views: 500 + 300 + 200 = 1000
      // Watch time: 1000 * 30 = 30,000s = 500 minutes
      expect(result.totalWatchTimeMinutes).toBe(500);
      expect(result.totalViews).toBe(1000);
    });
  });

  describe('getWatchTimeTrends', () => {
    const orgId = 'test-org-id';

    it('should calculate daily watch time trends', async () => {
      const mockMetrics = [
        {
          date: new Date('2024-01-01'),
          metricValue: 100,
          content: { contentType: 'reel' },
        },
        {
          date: new Date('2024-01-02'),
          metricValue: 150,
          content: { contentType: 'reel' },
        },
        {
          date: new Date('2024-01-03'),
          metricValue: 200,
          content: { contentType: 'reel' },
        },
      ];

      mockPrismaService.analyticsMetric.findMany.mockResolvedValue(mockMetrics);

      const result = await service.getWatchTimeTrends(orgId, 7);

      expect(result).toHaveLength(3);
      
      // Day 1: 100 views * 30s = 3000s = 50 minutes
      expect(result[0].watchTimeMinutes).toBe(50);
      expect(result[0].views).toBe(100);
      expect(result[0].growthRate).toBe(0); // First day, no growth

      // Day 2: 150 views * 30s = 4500s = 75 minutes, growth = (75-50)/50 * 100 = 50%
      expect(result[1].watchTimeMinutes).toBe(75);
      expect(result[1].views).toBe(150);
      expect(result[1].growthRate).toBe(50);

      // Day 3: 200 views * 30s = 6000s = 100 minutes, growth = (100-75)/75 * 100 = 33.3%
      expect(result[2].watchTimeMinutes).toBe(100);
      expect(result[2].views).toBe(200);
      expect(result[2].growthRate).toBe(33.3);
    });

    it('should handle multiple metrics same day', async () => {
      const mockMetrics = [
        {
          date: new Date('2024-01-01'),
          metricValue: 100,
          content: { contentType: 'reel' },
        },
        {
          date: new Date('2024-01-01'),
          metricValue: 50,
          content: { contentType: 'video' },
        },
      ];

      mockPrismaService.analyticsMetric.findMany.mockResolvedValue(mockMetrics);

      const result = await service.getWatchTimeTrends(orgId, 7);

      expect(result).toHaveLength(1);
      // Reel: 100 * 30 = 3000s
      // Video: 50 * 180 = 9000s
      // Total: 12000s = 200 minutes
      expect(result[0].watchTimeMinutes).toBe(200);
      expect(result[0].views).toBe(150);
    });

    it('should handle empty metrics', async () => {
      mockPrismaService.analyticsMetric.findMany.mockResolvedValue([]);

      const result = await service.getWatchTimeTrends(orgId, 7);

      expect(result).toHaveLength(0);
    });

    it('should calculate negative growth rate', async () => {
      const mockMetrics = [
        {
          date: new Date('2024-01-01'),
          metricValue: 200,
          content: { contentType: 'reel' },
        },
        {
          date: new Date('2024-01-02'),
          metricValue: 100,
          content: { contentType: 'reel' },
        },
      ];

      mockPrismaService.analyticsMetric.findMany.mockResolvedValue(mockMetrics);

      const result = await service.getWatchTimeTrends(orgId, 7);

      expect(result).toHaveLength(2);
      // Day 1: 200 views * 30s = 100 minutes
      expect(result[0].watchTimeMinutes).toBe(100);
      
      // Day 2: 100 views * 30s = 50 minutes, growth = (50-100)/100 * 100 = -50%
      expect(result[1].watchTimeMinutes).toBe(50);
      expect(result[1].growthRate).toBe(-50);
    });
  });

  describe('getTopVideosByWatchTime', () => {
    const orgId = 'test-org-id';

    it('should return top videos sorted by watch time', async () => {
      const mockContent = [
        {
          id: 'vid-1',
          externalContentId: 'ext-1',
          contentType: 'reel',
          caption: 'Reel 1',
          publishedAt: new Date('2024-01-01'),
          metrics: [{ metricValue: 5000 }],
        },
        {
          id: 'vid-2',
          externalContentId: 'ext-2',
          contentType: 'video',
          caption: 'Video 2',
          publishedAt: new Date('2024-01-02'),
          metrics: [{ metricValue: 1000 }],
        },
        {
          id: 'vid-3',
          externalContentId: 'ext-3',
          contentType: 'reel',
          caption: 'Reel 3',
          publishedAt: new Date('2024-01-03'),
          metrics: [{ metricValue: 3000 }],
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getTopVideosByWatchTime(orgId, 10);

      expect(result).toHaveLength(3);
      
      // Sorted by watch time descending
      // vid-1: 5000 * 30 = 150,000s = 2500 minutes
      expect(result[0].contentId).toBe('vid-1');
      expect(result[0].estimatedWatchTimeMinutes).toBe(2500);
      expect(result[0].rank).toBe(1);

      // vid-2: 1000 * 180 = 180,000s = 3000 minutes (videos are longer!)
      expect(result[1].contentId).toBe('vid-2');
      expect(result[1].estimatedWatchTimeMinutes).toBe(3000);
      expect(result[1].rank).toBe(2);

      // vid-3: 3000 * 30 = 90,000s = 1500 minutes
      expect(result[2].contentId).toBe('vid-3');
      expect(result[2].estimatedWatchTimeMinutes).toBe(1500);
      expect(result[2].rank).toBe(3);
    });

    it('should limit results to specified limit', async () => {
      const mockContent = Array.from({ length: 20 }, (_, i) => ({
        id: `vid-${i}`,
        externalContentId: `ext-${i}`,
        contentType: 'reel',
        caption: `Reel ${i}`,
        publishedAt: new Date(),
        metrics: [{ metricValue: 100 * (20 - i) }],
      }));

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getTopVideosByWatchTime(orgId, 5);

      expect(result).toHaveLength(5);
      expect(result[0].rank).toBe(1);
      expect(result[4].rank).toBe(5);
    });

    it('should handle no videos', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getTopVideosByWatchTime(orgId, 10);

      expect(result).toHaveLength(0);
    });

    it('should include video metadata', async () => {
      const mockContent = [
        {
          id: 'vid-1',
          externalContentId: 'fb-post-123',
          contentType: 'video',
          caption: 'My awesome video',
          publishedAt: new Date('2024-01-15T10:30:00Z'),
          metrics: [{ metricValue: 1000 }],
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getTopVideosByWatchTime(orgId, 10);

      expect(result[0].externalContentId).toBe('fb-post-123');
      expect(result[0].caption).toBe('My awesome video');
      expect(result[0].contentType).toBe('video');
      expect(result[0].totalViews).toBe(1000);
    });
  });

  describe('getWatchTimeByContentType', () => {
    const orgId = 'test-org-id';

    it('should breakdown watch time by content type', async () => {
      const mockContent = [
        {
          contentType: 'reel',
          metrics: [{ metricValue: 1000 }],
        },
        {
          contentType: 'reel',
          metrics: [{ metricValue: 500 }],
        },
        {
          contentType: 'video',
          metrics: [{ metricValue: 200 }],
        },
        {
          contentType: 'story',
          metrics: [{ metricValue: 3000 }],
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getWatchTimeByContentType(orgId);

      // Reels: (1000 + 500) * 30s = 45,000s = 750 minutes
      expect(result.reel).toBe(750);

      // Videos: 200 * 180s = 36,000s = 600 minutes
      expect(result.video).toBe(600);

      // Stories: 3000 * 15s = 45,000s = 750 minutes
      expect(result.story).toBe(750);
    });

    it('should handle empty content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getWatchTimeByContentType(orgId);

      expect(result).toEqual({});
    });
  });
});
