import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationService } from './monetization.service';
import { PrismaService } from '../prisma.service';

describe('MonetizationService', () => {
  let service: MonetizationService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    analyticsMetric: {
      aggregate: jest.fn(),
    },
    analyticsContent: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonetizationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MonetizationService>(MonetizationService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMonetizationStatus', () => {
    it('should return monetization status for all features', async () => {
      // Mock follower data
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 },
        })
        // Mock view metrics
        .mockResolvedValueOnce({
          _sum: { metricValue: 15000 },
        })
        // Mock watch time metrics
        .mockResolvedValueOnce({
          _sum: { metricValue: 300000 * 60 }, // 300k minutes in seconds
        })
        // Mock engagement metrics
        .mockResolvedValueOnce({
          _sum: { metricValue: 25000 },
        })
        // Mock growth rate - recent
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 },
        })
        // Mock growth rate - previous
        .mockResolvedValueOnce({
          _max: { metricValue: 4000 },
        });

      // Mock video count
      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      expect(result).toBeDefined();
      expect(result.inStreamAds).toBeDefined();
      expect(result.reels).toBeDefined();
      expect(result.stars).toBeDefined();
      expect(result.fanSubscription).toBeDefined();
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });

    it('should calculate progress correctly for In-Stream Ads', async () => {
      // Mock data for In-Stream Ads: 5k followers (need 10k) and 15k views (need 30k)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 15000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 300000 * 60 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 25000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 4000 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      // Progress should be average of (5k/10k=50%) and (15k/30k=50%) = 50%
      expect(result.inStreamAds.progress).toBe(50);
      expect(result.inStreamAds.status).toBe('not_eligible');
      expect(result.inStreamAds.gap.followers).toBe(5000);
      expect(result.inStreamAds.gap.oneMinuteViews).toBe(15000);
    });

    it('should mark feature as eligible when thresholds are met', async () => {
      // Mock data exceeding all thresholds
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 15000 }, // Exceeds 10k followers
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 35000 }, // Exceeds 30k views
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 700000 * 60 }, // Exceeds 600k minutes
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 60000 }, // Exceeds 50k engagements
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 15000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 14000 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.inStreamAds.status).toBe('eligible');
      expect(result.inStreamAds.progress).toBeGreaterThanOrEqual(100);
    });

    it('should mark feature as close when progress >= 80%', async () => {
      // Mock data at 90% threshold
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 9000 }, // 90% of 10k
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 27000 }, // 90% of 30k
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 540000 * 60 }, // 90% of 600k minutes
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 45000 }, // 90% of 50k
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 9000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 8000 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.inStreamAds.status).toBe('close');
    });

    it('should calculate estimated days to eligibility', async () => {
      // Mock data with growth rate
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 }, // Current followers
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 15000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 300000 * 60 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 25000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 5000 }, // Recent followers
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 4000 }, // Previous followers (growth of 1000 in 30 days = 33.3/day)
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      // Gap is 15000 views (larger gap), growth rate ~33.3/day
      // Estimated days = 15000 / 33.3 = ~450 days
      expect(result.inStreamAds.estimatedDays).toBeDefined();
      expect(result.inStreamAds.estimatedDays).toBeGreaterThan(0);
    });

    it('should handle zero metrics gracefully', async () => {
      // Mock all zeros
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 0 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 0 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 0 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 0 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 0 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 0 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(0);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.inStreamAds.progress).toBe(0);
      expect(result.inStreamAds.status).toBe('not_eligible');
      expect(result.stars.progress).toBe(0);
      expect(result.stars.status).toBe('not_eligible');
    });

    it('should handle null metrics from database', async () => {
      // Mock null values
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: null },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: null },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: null },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: null },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: null },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: null },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(0);

      const result = await service.getMonetizationStatus('org-123');

      expect(result).toBeDefined();
      expect(result.inStreamAds.currentMetrics.followers).toBe(0);
      expect(result.reels.currentMetrics.viewedMinutes).toBe(0);
    });

    it('should calculate Stars eligibility correctly', async () => {
      // Mock 600 followers (exceeds 500 threshold)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 600 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 1000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 10000 * 60 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 5000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 600 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 500 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(10);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.stars.status).toBe('eligible');
      expect(result.stars.progress).toBeGreaterThanOrEqual(100);
      expect(result.stars.currentMetrics.followers).toBe(600);
    });

    it('should calculate Reels eligibility based on viewed minutes', async () => {
      // Mock 700k viewed minutes (exceeds 600k threshold)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 1000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 5000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 700000 * 60 }, // 700k minutes in seconds
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 10000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 1000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 900 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(6);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.reels.status).toBe('eligible');
      expect(result.reels.currentMetrics.viewedMinutes).toBe(700000);
      expect(result.reels.currentMetrics.videosCount).toBe(6);
    });

    it('should calculate Fan Subscription with multiple thresholds', async () => {
      // Mock 12k followers, 200k watched minutes, 60k engagements (all exceed thresholds)
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({
          _max: { metricValue: 12000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 10000 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 200000 * 60 },
        })
        .mockResolvedValueOnce({
          _sum: { metricValue: 60000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 12000 },
        })
        .mockResolvedValueOnce({
          _max: { metricValue: 11000 },
        });

      mockPrismaService.analyticsContent.count.mockResolvedValueOnce(15);

      const result = await service.getMonetizationStatus('org-123');

      expect(result.fanSubscription.status).toBe('eligible');
      expect(result.fanSubscription.currentMetrics.followers).toBe(12000);
      expect(result.fanSubscription.currentMetrics.watchedMinutes).toBe(200000);
      expect(result.fanSubscription.currentMetrics.engagements).toBe(60000);
    });
  });
});
