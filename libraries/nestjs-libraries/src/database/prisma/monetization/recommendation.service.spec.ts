import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationEngine } from './recommendation.service';
import type { MetricGap } from './monetization.service';

describe('RecommendationEngine', () => {
  let service: RecommendationEngine;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RecommendationEngine],
    }).compile();

    service = module.get<RecommendationEngine>(RecommendationEngine);
  });

  describe('generateRecommendations', () => {
    it('should generate recommendations for watch time gaps', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'Reels',
          metric: 'viewedMinutes',
          current: 200000,
          required: 600000,
          gap: 400000,
          percentageGap: 66.67,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      expect(result.totalRecommendations).toBeGreaterThan(0);
      const contentRecs = result.recommendations.filter(r => r.type === 'content');
      expect(contentRecs.length).toBeGreaterThan(0);
    });

    it('should generate frequency recommendations for follower gaps', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'In-Stream Ads',
          metric: 'followers',
          current: 3000,
          required: 10000,
          gap: 7000,
          percentageGap: 70,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      const frequencyRecs = result.recommendations.filter(r => r.type === 'frequency');
      expect(frequencyRecs.length).toBeGreaterThan(0);
      expect(frequencyRecs[0].title).toContain('Posting Frequency');
    });

    it('should generate engagement recommendations for engagement gaps', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'Fan Subscription',
          metric: 'engagements',
          current: 10000,
          required: 50000,
          gap: 40000,
          percentageGap: 80,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      const engagementRecs = result.recommendations.filter(r => r.type === 'engagement');
      expect(engagementRecs.length).toBeGreaterThan(0);
    });

    it('should generate video count recommendations for video gaps', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'Reels',
          metric: 'videosCount',
          current: 2,
          required: 5,
          gap: 3,
          percentageGap: 60,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      const videoRecs = result.recommendations.filter(r => r.id === 'rec-video-count');
      expect(videoRecs.length).toBe(1);
      expect(videoRecs[0].description).toContain('3 more videos');
    });

    it('should always generate timing recommendation when gaps exist', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'Stars',
          metric: 'followers',
          current: 100,
          required: 500,
          gap: 400,
          percentageGap: 80,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      const timingRecs = result.recommendations.filter(r => r.type === 'timing');
      expect(timingRecs.length).toBeGreaterThan(0);
    });

    it('should sort recommendations by priority', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'In-Stream Ads',
          metric: 'followers',
          current: 5000,
          required: 10000,
          gap: 5000,
          percentageGap: 50,
          priority: 'medium',
        },
        {
          feature: 'Reels',
          metric: 'viewedMinutes',
          current: 100000,
          required: 600000,
          gap: 500000,
          percentageGap: 83.33,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      // High priority recommendations should come first
      const priorities = result.recommendations.map(r => r.priority);
      const firstHighIndex = priorities.indexOf('high');
      const firstMediumIndex = priorities.indexOf('medium');
      
      if (firstHighIndex !== -1 && firstMediumIndex !== -1) {
        expect(firstHighIndex).toBeLessThan(firstMediumIndex);
      }
    });

    it('should calculate actionable count correctly', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'In-Stream Ads',
          metric: 'followers',
          current: 2000,
          required: 10000,
          gap: 8000,
          percentageGap: 80,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      expect(result.actionableCount).toBe(result.recommendations.filter(r => r.actionable).length);
      expect(result.actionableCount).toBeGreaterThan(0);
    });

    it('should include expected impact in all recommendations', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'Fan Subscription',
          metric: 'watchedMinutes',
          current: 50000,
          required: 180000,
          gap: 130000,
          percentageGap: 72.22,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      result.recommendations.forEach(rec => {
        expect(rec.expectedImpact).toBeDefined();
        expect(rec.expectedImpact.metric).toBeDefined();
        expect(rec.expectedImpact.estimatedIncrease).toBeDefined();
        expect(rec.expectedImpact.timeframe).toBeDefined();
      });
    });

    it('should generate multiple recommendation types for mixed gaps', async () => {
      const gaps: MetricGap[] = [
        {
          feature: 'In-Stream Ads',
          metric: 'followers',
          current: 3000,
          required: 10000,
          gap: 7000,
          percentageGap: 70,
          priority: 'high',
        },
        {
          feature: 'Reels',
          metric: 'viewedMinutes',
          current: 200000,
          required: 600000,
          gap: 400000,
          percentageGap: 66.67,
          priority: 'high',
        },
        {
          feature: 'Fan Subscription',
          metric: 'engagements',
          current: 15000,
          required: 50000,
          gap: 35000,
          percentageGap: 70,
          priority: 'high',
        },
      ];

      const result = await service.generateRecommendations(gaps, 0.01);

      const types = new Set(result.recommendations.map(r => r.type));
      expect(types.size).toBeGreaterThan(2); // Multiple types
      expect(types.has('content')).toBe(true);
      expect(types.has('frequency')).toBe(true);
      expect(types.has('engagement')).toBe(true);
    });

    it('should handle empty gaps array', async () => {
      const result = await service.generateRecommendations([], 0);

      expect(result.totalRecommendations).toBe(0);
      expect(result.recommendations).toEqual([]);
      expect(result.actionableCount).toBe(0);
    });

    it('should set correct priority based on gap priority', async () => {
      const highGap: MetricGap = {
        feature: 'In-Stream Ads',
        metric: 'followers',
        current: 1000,
        required: 10000,
        gap: 9000,
        percentageGap: 90,
        priority: 'high',
      };

      const result = await service.generateRecommendations([highGap], 0.01);

      const frequencyRec = result.recommendations.find(r => r.type === 'frequency');
      expect(frequencyRec?.priority).toBe('high');
    });
  });

  describe('formatNumber', () => {
    it('should format millions correctly', () => {
      const formatted = (service as any).formatNumber(2500000);
      expect(formatted).toBe('2.5M');
    });

    it('should format thousands correctly', () => {
      const formatted = (service as any).formatNumber(5500);
      expect(formatted).toBe('5.5K');
    });

    it('should return number as string for values < 1000', () => {
      const formatted = (service as any).formatNumber(500);
      expect(formatted).toBe('500');
    });

    it('should handle zero', () => {
      const formatted = (service as any).formatNumber(0);
      expect(formatted).toBe('0');
    });

    it('should round to 1 decimal place', () => {
      const formatted1 = (service as any).formatNumber(1234567);
      const formatted2 = (service as any).formatNumber(5678);
      
      expect(formatted1).toBe('1.2M');
      expect(formatted2).toBe('5.7K');
    });
  });

  describe('individual recommendation generators', () => {
    it('should generate Reels recommendation with correct structure', () => {
      const gaps: MetricGap[] = [{
        feature: 'Reels',
        metric: 'viewedMinutes',
        current: 200000,
        required: 600000,
        gap: 400000,
        percentageGap: 66.67,
        priority: 'high',
      }];

      const rec = (service as any).generateReelsRecommendation(gaps);

      expect(rec.id).toBe('rec-reels-content');
      expect(rec.type).toBe('content');
      expect(rec.title).toContain('Reels');
      expect(rec.actionable).toBe(true);
      expect(rec.priority).toBe('high');
    });

    it('should generate posting frequency recommendation', () => {
      const gaps: MetricGap[] = [{
        feature: 'Stars',
        metric: 'followers',
        current: 100,
        required: 500,
        gap: 400,
        percentageGap: 80,
        priority: 'high',
      }];

      const rec = (service as any).generatePostingFrequencyRecommendation(gaps, 0.01);

      expect(rec.id).toBe('rec-posting-frequency');
      expect(rec.type).toBe('frequency');
      expect(rec.actionable).toBe(true);
    });

    it('should generate engagement recommendation', () => {
      const gaps: MetricGap[] = [{
        feature: 'Fan Subscription',
        metric: 'engagements',
        current: 10000,
        required: 50000,
        gap: 40000,
        percentageGap: 80,
        priority: 'high',
      }];

      const rec = (service as any).generateEngagementRecommendation(gaps);

      expect(rec.id).toBe('rec-engagement-tactics');
      expect(rec.type).toBe('engagement');
      expect(rec.description).toContain('polls');
    });

    it('should generate CTA recommendation', () => {
      const gaps: MetricGap[] = [{
        feature: 'Fan Subscription',
        metric: 'engagements',
        current: 20000,
        required: 50000,
        gap: 30000,
        percentageGap: 60,
        priority: 'high',
      }];

      const rec = (service as any).generateCTARecommendation(gaps);

      expect(rec.id).toBe('rec-cta-usage');
      expect(rec.type).toBe('engagement');
      expect(rec.description).toContain('CTA');
    });

    it('should generate timing recommendation', () => {
      const rec = (service as any).generateTimingRecommendation();

      expect(rec.id).toBe('rec-optimal-timing');
      expect(rec.type).toBe('timing');
      expect(rec.priority).toBe('low');
      expect(rec.actionable).toBe(true);
    });
  });
});
