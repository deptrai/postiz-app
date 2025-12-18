import { VideoLengthAnalyticsService } from './video-length-analytics.service';

describe('VideoLengthAnalyticsService', () => {
  let service: VideoLengthAnalyticsService;

  beforeEach(() => {
    service = new VideoLengthAnalyticsService();
  });

  describe('getPerformanceByLength', () => {
    it('should return performance data for all length ranges', async () => {
      const result = await service.getPerformanceByLength('org-123');

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.performances).toHaveLength(5);
      expect(result.totalVideos).toBeGreaterThan(0);
      expect(result.bestPerformingRange).toBeDefined();
    });

    it('should include all 5 length ranges', async () => {
      const result = await service.getPerformanceByLength('org-123');

      const ranges = result.performances.map((p) => p.range);
      expect(ranges).toContain('0-15');
      expect(ranges).toContain('15-30');
      expect(ranges).toContain('30-60');
      expect(ranges).toContain('60-180');
      expect(ranges).toContain('180+');
    });

    it('should filter by format when provided', async () => {
      const result = await service.getPerformanceByLength('org-123', { format: 'reel' });

      expect(result.format).toBe('reel');
      expect(result.performances).toBeDefined();
    });

    it('should include range labels', async () => {
      const result = await service.getPerformanceByLength('org-123');

      result.performances.forEach((perf) => {
        expect(perf.rangeLabel).toBeDefined();
        expect(perf.rangeLabel.length).toBeGreaterThan(0);
      });
    });

    it('should include range seconds', async () => {
      const result = await service.getPerformanceByLength('org-123');

      result.performances.forEach((perf) => {
        expect(perf.rangeSeconds).toBeDefined();
        expect(perf.rangeSeconds.min).toBeDefined();
        expect(perf.rangeSeconds.max).toBeDefined();
      });
    });

    it('should calculate average metrics correctly', async () => {
      const result = await service.getPerformanceByLength('org-123');

      result.performances.forEach((perf) => {
        if (perf.videoCount > 0) {
          expect(perf.avgViews).toBeGreaterThanOrEqual(0);
          expect(perf.avgEngagementRate).toBeGreaterThanOrEqual(0);
          expect(perf.avgCompletionRate).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should identify top performer in each range', async () => {
      const result = await service.getPerformanceByLength('org-123');

      result.performances.forEach((perf) => {
        if (perf.videoCount > 0) {
          expect(perf.topPerformer).toBeDefined();
          expect(perf.topPerformer?.videoId).toBeDefined();
          expect(perf.topPerformer?.title).toBeDefined();
        }
      });
    });
  });

  describe('getOptimalLength', () => {
    it('should return optimal length recommendation for reel format', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result).toBeDefined();
      expect(result.format).toBe('reel');
      expect(result.optimalRange).toBeDefined();
      expect(result.optimalRangeLabel).toBeDefined();
    });

    it('should return optimal length recommendation for video format', async () => {
      const result = await service.getOptimalLength('org-123', 'video');

      expect(result).toBeDefined();
      expect(result.format).toBe('video');
    });

    it('should return optimal length recommendation for story format', async () => {
      const result = await service.getOptimalLength('org-123', 'story');

      expect(result).toBeDefined();
      expect(result.format).toBe('story');
    });

    it('should include sweet spot seconds', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result.sweetSpotSeconds).toBeDefined();
      expect(result.sweetSpotSeconds.min).toBeGreaterThanOrEqual(0);
      expect(result.sweetSpotSeconds.max).toBeGreaterThan(result.sweetSpotSeconds.min);
    });

    it('should include confidence score between 0 and 100', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(result.confidenceScore).toBeLessThanOrEqual(100);
    });

    it('should include reasoning', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result.reasoning).toBeDefined();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });

    it('should include user average length', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result.userAvgLength).toBeDefined();
      expect(result.userAvgLength).toBeGreaterThan(0);
    });

    it('should include recommended adjustment', async () => {
      const result = await service.getOptimalLength('org-123', 'reel');

      expect(result.recommendedAdjustment).toBeDefined();
      expect(['shorter', 'longer', 'optimal']).toContain(result.recommendedAdjustment);
    });
  });

  describe('getNicheLengthBenchmarks', () => {
    it('should return benchmark comparison for fitness niche', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result).toBeDefined();
      expect(result.niche).toBe('fitness');
      expect(result.format).toBe('reel');
    });

    it('should return benchmark comparison for educational niche', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'educational', 'video');

      expect(result).toBeDefined();
      expect(result.niche).toBe('educational');
    });

    it('should include industry optimal range', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result.industryOptimal).toBeDefined();
      expect(result.industryOptimal.min).toBeGreaterThanOrEqual(0);
      expect(result.industryOptimal.max).toBeGreaterThan(result.industryOptimal.min);
      expect(result.industryOptimalLabel).toBeDefined();
    });

    it('should include user optimal range', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result.userOptimal).toBeDefined();
      expect(result.userOptimal.min).toBeGreaterThanOrEqual(0);
      expect(result.userOptimalLabel).toBeDefined();
    });

    it('should calculate deviation percentage', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result.deviation).toBeDefined();
      expect(typeof result.deviation).toBe('number');
    });

    it('should determine performance status', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result.performance).toBeDefined();
      expect(['above', 'at', 'below']).toContain(result.performance);
    });

    it('should include insights', async () => {
      const result = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');

      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should apply niche adjustments to industry benchmarks', async () => {
      const fitnessResult = await service.getNicheLengthBenchmarks('org-123', 'fitness', 'reel');
      const entertainmentResult = await service.getNicheLengthBenchmarks('org-123', 'entertainment', 'reel');

      // Fitness has +10% adjustment, entertainment has -10%
      // So fitness industry optimal should be higher
      expect(fitnessResult.industryOptimal.max).toBeGreaterThanOrEqual(entertainmentResult.industryOptimal.max);
    });
  });

  describe('getLengthOptimizationTips', () => {
    it('should return optimization tips', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'reel');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include tips with required properties', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'reel');

      result.forEach((tip) => {
        expect(tip.priority).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(tip.priority);
        expect(tip.category).toBeDefined();
        expect(['hook', 'pacing', 'content', 'format', 'general']).toContain(tip.category);
        expect(tip.issue).toBeDefined();
        expect(tip.tip).toBeDefined();
        expect(tip.expectedImprovement).toBeDefined();
      });
    });

    it('should sort tips by priority', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'reel');

      const priorityOrder = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < result.length; i++) {
        expect(priorityOrder[result[i].priority]).toBeGreaterThanOrEqual(
          priorityOrder[result[i - 1].priority]
        );
      }
    });

    it('should return tips for video format', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'video');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return tips for story format', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'story');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include general tip', async () => {
      const result = await service.getLengthOptimizationTips('org-123', 'reel');

      const generalTip = result.find((t) => t.category === 'general');
      expect(generalTip).toBeDefined();
    });
  });

  describe('Length range classification', () => {
    it('should correctly classify 0-15 second videos', async () => {
      const result = await service.getPerformanceByLength('org-123');
      const shortRange = result.performances.find((p) => p.range === '0-15');

      expect(shortRange).toBeDefined();
      expect(shortRange?.rangeSeconds.min).toBe(0);
      expect(shortRange?.rangeSeconds.max).toBe(15);
    });

    it('should correctly classify 15-30 second videos', async () => {
      const result = await service.getPerformanceByLength('org-123');
      const mediumShortRange = result.performances.find((p) => p.range === '15-30');

      expect(mediumShortRange).toBeDefined();
      expect(mediumShortRange?.rangeSeconds.min).toBe(15);
      expect(mediumShortRange?.rangeSeconds.max).toBe(30);
    });

    it('should correctly classify 30-60 second videos', async () => {
      const result = await service.getPerformanceByLength('org-123');
      const mediumRange = result.performances.find((p) => p.range === '30-60');

      expect(mediumRange).toBeDefined();
      expect(mediumRange?.rangeSeconds.min).toBe(30);
      expect(mediumRange?.rangeSeconds.max).toBe(60);
    });

    it('should correctly classify 60-180 second videos', async () => {
      const result = await service.getPerformanceByLength('org-123');
      const longRange = result.performances.find((p) => p.range === '60-180');

      expect(longRange).toBeDefined();
      expect(longRange?.rangeSeconds.min).toBe(60);
      expect(longRange?.rangeSeconds.max).toBe(180);
    });

    it('should correctly classify 180+ second videos', async () => {
      const result = await service.getPerformanceByLength('org-123');
      const extendedRange = result.performances.find((p) => p.range === '180+');

      expect(extendedRange).toBeDefined();
      expect(extendedRange?.rangeSeconds.min).toBe(180);
    });
  });
});
