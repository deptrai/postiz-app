import { ViralTimingService, ContentFormat, ConfidenceLevel } from './viral-timing.service';

describe('ViralTimingService', () => {
  let service: ViralTimingService;

  beforeEach(() => {
    service = new ViralTimingService();
  });

  describe('getOptimalViralTiming', () => {
    it('should return optimal timing for default format (reel)', async () => {
      const result = await service.getOptimalViralTiming('org-123');

      expect(result).toBeDefined();
      expect(result.recommendedWindows).toBeDefined();
      expect(result.recommendedWindows.length).toBeGreaterThan(0);
      expect(result.bestOverallTime).toBeDefined();
      expect(result.formatSpecific).toBeDefined();
      expect(result.formatSpecific.format).toBe('reel');
      expect(result.insights).toBeDefined();
      expect(result.insights.length).toBeGreaterThan(0);
    });

    it('should return timing for video format', async () => {
      const result = await service.getOptimalViralTiming('org-123', { contentType: 'video' });

      expect(result.formatSpecific.format).toBe('video');
      expect(result.recommendedWindows.length).toBeGreaterThan(0);
    });

    it('should return timing for post format', async () => {
      const result = await service.getOptimalViralTiming('org-123', { contentType: 'post' });

      expect(result.formatSpecific.format).toBe('post');
      expect(result.recommendedWindows.length).toBeGreaterThan(0);
    });

    it('should return timing for story format', async () => {
      const result = await service.getOptimalViralTiming('org-123', { contentType: 'story' });

      expect(result.formatSpecific.format).toBe('story');
      expect(result.recommendedWindows.length).toBeGreaterThan(0);
    });

    it('should apply niche adjustments when niche is provided', async () => {
      const resultWithNiche = await service.getOptimalViralTiming('org-123', { 
        contentType: 'reel',
        niche: 'fitness' 
      });

      expect(resultWithNiche.nicheSpecific).toBeDefined();
      expect(resultWithNiche.nicheSpecific?.niche).toBe('fitness');
      expect(resultWithNiche.nicheSpecific?.windows).toBeDefined();
    });

    it('should not include nicheSpecific when niche is not provided', async () => {
      const result = await service.getOptimalViralTiming('org-123', { contentType: 'reel' });

      expect(result.nicheSpecific).toBeUndefined();
    });

    it('should return windows sorted by score (descending)', async () => {
      const result = await service.getOptimalViralTiming('org-123');

      const scores = result.recommendedWindows.map(w => w.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should return valid confidence levels', async () => {
      const result = await service.getOptimalViralTiming('org-123');
      const validConfidences: ConfidenceLevel[] = ['high', 'medium', 'low'];

      result.recommendedWindows.forEach(window => {
        expect(validConfidences).toContain(window.confidence);
      });
      expect(validConfidences).toContain(result.bestOverallTime.confidence);
    });

    it('should return success rates between 0 and 1', async () => {
      const result = await service.getOptimalViralTiming('org-123');

      result.recommendedWindows.forEach(window => {
        expect(window.successRate).toBeGreaterThanOrEqual(0);
        expect(window.successRate).toBeLessThanOrEqual(1);
      });
      expect(result.bestOverallTime.successRate).toBeGreaterThanOrEqual(0);
      expect(result.bestOverallTime.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('getTimingHeatmap', () => {
    it('should return a 7x24 heatmap grid', async () => {
      const result = await service.getTimingHeatmap('org-123');

      expect(result.heatmap).toBeDefined();
      expect(result.heatmap.length).toBe(7); // 7 days
      result.heatmap.forEach(row => {
        expect(row.length).toBe(24); // 24 hours
      });
    });

    it('should return valid heatmap cell values (0-100)', async () => {
      const result = await service.getTimingHeatmap('org-123');

      result.heatmap.forEach(row => {
        row.forEach(cell => {
          expect(cell.value).toBeGreaterThanOrEqual(0);
          expect(cell.value).toBeLessThanOrEqual(100);
        });
      });
    });

    it('should return peak times sorted by score (descending)', async () => {
      const result = await service.getTimingHeatmap('org-123');

      expect(result.peakTimes).toBeDefined();
      const scores = result.peakTimes.map(t => t.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
      }
    });

    it('should return low times sorted by score (ascending)', async () => {
      const result = await service.getTimingHeatmap('org-123');

      expect(result.lowTimes).toBeDefined();
      const scores = result.lowTimes.map(t => t.score);
      for (let i = 0; i < scores.length - 1; i++) {
        expect(scores[i]).toBeLessThanOrEqual(scores[i + 1]);
      }
    });

    it('should return average engagement', async () => {
      const result = await service.getTimingHeatmap('org-123');

      expect(result.averageEngagement).toBeDefined();
      expect(typeof result.averageEngagement).toBe('number');
      expect(result.averageEngagement).toBeGreaterThan(0);
    });

    it('should apply content type adjustments', async () => {
      const reelResult = await service.getTimingHeatmap('org-123', { contentType: 'reel' });
      const postResult = await service.getTimingHeatmap('org-123', { contentType: 'post' });

      // Results should be different due to format adjustments
      expect(reelResult.averageEngagement).not.toBe(postResult.averageEngagement);
    });

    it('should apply niche adjustments when provided', async () => {
      const baseResult = await service.getTimingHeatmap('org-123', { contentType: 'reel' });
      const nicheResult = await service.getTimingHeatmap('org-123', { 
        contentType: 'reel',
        niche: 'fitness' 
      });

      // Peak times might differ due to niche adjustments
      expect(baseResult.peakTimes.length).toBeGreaterThan(0);
      expect(nicheResult.peakTimes.length).toBeGreaterThan(0);
    });

    it('should have valid day of week values (0-6)', async () => {
      const result = await service.getTimingHeatmap('org-123');

      result.heatmap.forEach((row, dayIndex) => {
        row.forEach(cell => {
          expect(cell.dayOfWeek).toBe(dayIndex);
        });
      });

      result.peakTimes.forEach(slot => {
        expect(slot.dayOfWeek).toBeGreaterThanOrEqual(0);
        expect(slot.dayOfWeek).toBeLessThanOrEqual(6);
      });
    });

    it('should have valid hour values (0-23)', async () => {
      const result = await service.getTimingHeatmap('org-123');

      result.heatmap.forEach(row => {
        row.forEach((cell, hourIndex) => {
          expect(cell.hour).toBe(hourIndex);
        });
      });

      result.peakTimes.forEach(slot => {
        expect(slot.hour).toBeGreaterThanOrEqual(0);
        expect(slot.hour).toBeLessThanOrEqual(23);
      });
    });
  });

  describe('Niche adjustments', () => {
    const niches = ['fitness', 'food', 'beauty', 'tech', 'gaming', 'lifestyle', 'business', 'education'];

    niches.forEach(niche => {
      it(`should handle ${niche} niche correctly`, async () => {
        const result = await service.getOptimalViralTiming('org-123', { 
          contentType: 'reel',
          niche 
        });

        expect(result.nicheSpecific).toBeDefined();
        expect(result.nicheSpecific?.niche).toBe(niche);
      });
    });

    it('should ignore unknown niche', async () => {
      const result = await service.getOptimalViralTiming('org-123', { 
        contentType: 'reel',
        niche: 'unknown-niche' 
      });

      expect(result.nicheSpecific).toBeUndefined();
    });
  });

  describe('Format-specific timing', () => {
    const formats: ContentFormat[] = ['reel', 'video', 'post', 'story'];

    formats.forEach(format => {
      it(`should return valid timing for ${format} format`, async () => {
        const result = await service.getOptimalViralTiming('org-123', { contentType: format });

        expect(result.formatSpecific.format).toBe(format);
        expect(result.formatSpecific.windows.length).toBeGreaterThan(0);
        
        result.formatSpecific.windows.forEach(window => {
          expect(window.startHour).toBeGreaterThanOrEqual(0);
          expect(window.startHour).toBeLessThan(24);
          expect(window.endHour).toBeGreaterThan(window.startHour);
          expect(window.endHour).toBeLessThanOrEqual(24);
        });
      });
    });
  });
});
