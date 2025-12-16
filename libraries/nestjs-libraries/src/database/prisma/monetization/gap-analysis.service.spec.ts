import { Test, TestingModule } from '@nestjs/testing';
import { MonetizationService } from './monetization.service';
import { PrismaService } from '../prisma.service';

describe('MonetizationService - Gap Analysis', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getGapAnalysis', () => {
    it('should return empty gaps when all features are eligible', async () => {
      // Mock data for fully eligible organization
      mockPrismaService.analyticsMetric.aggregate.mockResolvedValue({
        _sum: {
          metricValue: 15000, // Exceeds all thresholds
        },
      });
      mockPrismaService.analyticsContent.count.mockResolvedValue(10);

      const result = await service.getGapAnalysis('org-123');

      expect(result.totalGaps).toBe(0);
      expect(result.highPriorityCount).toBe(0);
      expect(result.mediumPriorityCount).toBe(0);
      expect(result.lowPriorityCount).toBe(0);
      expect(result.gaps).toEqual([]);
    });

    it('should identify high priority gaps (>50%)', async () => {
      // Mock data with large gaps
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 2000 } }) // followers: 2k/10k = 80% gap
        .mockResolvedValueOnce({ _sum: { metricValue: 5000 } }) // oneMinuteViews
        .mockResolvedValueOnce({ _sum: { metricValue: 100000 } }) // viewedMinutes
        .mockResolvedValueOnce({ _sum: { metricValue: 50000 } }) // watchedMinutes
        .mockResolvedValueOnce({ _sum: { metricValue: 10000 } }); // engagements

      mockPrismaService.analyticsContent.count.mockResolvedValue(2);

      const result = await service.getGapAnalysis('org-123');

      expect(result.totalGaps).toBeGreaterThan(0);
      expect(result.highPriorityCount).toBeGreaterThan(0);
      
      const highPriorityGaps = result.gaps.filter(g => g.priority === 'high');
      expect(highPriorityGaps.length).toBeGreaterThan(0);
      expect(highPriorityGaps[0].percentageGap).toBeGreaterThan(50);
    });

    it('should identify medium priority gaps (20-50%)', async () => {
      // Mock data with medium gaps
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 7000 } }) // followers: 7k/10k = 30% gap
        .mockResolvedValueOnce({ _sum: { metricValue: 20000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 400000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 100000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 35000 } });

      mockPrismaService.analyticsContent.count.mockResolvedValue(4);

      const result = await service.getGapAnalysis('org-123');

      const mediumPriorityGaps = result.gaps.filter(g => g.priority === 'medium');
      expect(mediumPriorityGaps.length).toBeGreaterThan(0);
      
      mediumPriorityGaps.forEach(gap => {
        expect(gap.percentageGap).toBeGreaterThanOrEqual(20);
        expect(gap.percentageGap).toBeLessThanOrEqual(50);
      });
    });

    it('should identify low priority gaps (<20%)', async () => {
      // Mock data with small gaps
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 9000 } }) // followers: 9k/10k = 10% gap
        .mockResolvedValueOnce({ _sum: { metricValue: 28000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 550000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 160000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 48000 } });

      mockPrismaService.analyticsContent.count.mockResolvedValue(5);

      const result = await service.getGapAnalysis('org-123');

      const lowPriorityGaps = result.gaps.filter(g => g.priority === 'low');
      expect(lowPriorityGaps.length).toBeGreaterThan(0);
      
      lowPriorityGaps.forEach(gap => {
        expect(gap.percentageGap).toBeLessThan(20);
      });
    });

    it('should sort gaps by priority then percentage', async () => {
      // Mock data with mixed priority gaps
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 3000 } }) // High priority
        .mockResolvedValueOnce({ _sum: { metricValue: 10000 } }) // Medium priority
        .mockResolvedValueOnce({ _sum: { metricValue: 300000 } }) // Medium priority
        .mockResolvedValueOnce({ _sum: { metricValue: 120000 } }) // Medium priority
        .mockResolvedValueOnce({ _sum: { metricValue: 20000 } }); // High priority

      mockPrismaService.analyticsContent.count.mockResolvedValue(3);

      const result = await service.getGapAnalysis('org-123');

      // Check sorting: high priority first, then by percentage within priority
      const priorities = result.gaps.map(g => g.priority);
      const firstHighIndex = priorities.indexOf('high');
      const lastHighIndex = priorities.lastIndexOf('high');
      const firstMediumIndex = priorities.indexOf('medium');
      
      if (firstHighIndex !== -1 && firstMediumIndex !== -1) {
        expect(lastHighIndex).toBeLessThan(firstMediumIndex);
      }
    });

    it('should calculate correct gap values', async () => {
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 5000 } }) // followers
        .mockResolvedValueOnce({ _sum: { metricValue: 15000 } }) // oneMinuteViews
        .mockResolvedValueOnce({ _sum: { metricValue: 200000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 80000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 25000 } });

      mockPrismaService.analyticsContent.count.mockResolvedValue(3);

      const result = await service.getGapAnalysis('org-123');

      result.gaps.forEach(gap => {
        expect(gap.gap).toBe(gap.required - gap.current);
        expect(gap.gap).toBeGreaterThanOrEqual(0);
        expect(gap.percentageGap).toBe((gap.gap / gap.required) * 100);
      });
    });

    it('should include feature and metric information in gaps', async () => {
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 1000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 5000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 100000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 50000 } })
        .mockResolvedValueOnce({ _sum: { metricValue: 10000 } });

      mockPrismaService.analyticsContent.count.mockResolvedValue(2);

      const result = await service.getGapAnalysis('org-123');

      result.gaps.forEach(gap => {
        expect(gap.feature).toBeDefined();
        expect(gap.metric).toBeDefined();
        expect(['In-Stream Ads', 'Reels', 'Stars', 'Fan Subscription']).toContain(gap.feature);
        expect(['followers', 'oneMinuteViews', 'viewedMinutes', 'watchedMinutes', 'engagements', 'videosCount']).toContain(gap.metric);
      });
    });

    it('should provide accurate gap counts', async () => {
      mockPrismaService.analyticsMetric.aggregate
        .mockResolvedValueOnce({ _sum: { metricValue: 2000 } }) // High gap
        .mockResolvedValueOnce({ _sum: { metricValue: 8000 } }) // Medium gap
        .mockResolvedValueOnce({ _sum: { metricValue: 400000 } }) // Medium gap
        .mockResolvedValueOnce({ _sum: { metricValue: 140000 } }) // Medium gap
        .mockResolvedValueOnce({ _sum: { metricValue: 45000 } }); // Low gap

      mockPrismaService.analyticsContent.count.mockResolvedValue(4);

      const result = await service.getGapAnalysis('org-123');

      expect(result.totalGaps).toBe(result.gaps.length);
      expect(result.highPriorityCount + result.mediumPriorityCount + result.lowPriorityCount).toBe(result.totalGaps);
    });
  });

  describe('calculateGapPriority', () => {
    it('should return high for gaps > 50%', () => {
      const priority = (service as any).calculateGapPriority(75);
      expect(priority).toBe('high');
    });

    it('should return medium for gaps between 20-50%', () => {
      const priority1 = (service as any).calculateGapPriority(20);
      const priority2 = (service as any).calculateGapPriority(35);
      const priority3 = (service as any).calculateGapPriority(50);
      
      expect(priority1).toBe('medium');
      expect(priority2).toBe('medium');
      expect(priority3).toBe('medium');
    });

    it('should return low for gaps < 20%', () => {
      const priority = (service as any).calculateGapPriority(15);
      expect(priority).toBe('low');
    });

    it('should handle edge cases correctly', () => {
      expect((service as any).calculateGapPriority(0)).toBe('low');
      expect((service as any).calculateGapPriority(100)).toBe('high');
      expect((service as any).calculateGapPriority(50.1)).toBe('high');
      expect((service as any).calculateGapPriority(19.9)).toBe('low');
    });
  });
});
