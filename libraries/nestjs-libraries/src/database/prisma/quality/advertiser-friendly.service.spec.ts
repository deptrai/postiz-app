import { Test, TestingModule } from '@nestjs/testing';
import { AdvertiserFriendlyService } from './advertiser-friendly.service';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';

describe('AdvertiserFriendlyService', () => {
  let service: AdvertiserFriendlyService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    analyticsContent: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const testModule: TestingModule = await Test.createTestingModule({
      providers: [
        AdvertiserFriendlyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = testModule.get<AdvertiserFriendlyService>(AdvertiserFriendlyService);
    prismaService = testModule.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('scoreAdFriendliness', () => {
    it('should return 100 for empty content', () => {
      const result = service.scoreAdFriendliness('');

      expect(result.overallScore).toBe(100);
      expect(result.isAdFriendly).toBe(true);
      expect(result.sensitiveTopics).toHaveLength(0);
    });

    it('should return 100 for clean content', () => {
      const result = service.scoreAdFriendliness('Check out our new product launch!');

      expect(result.overallScore).toBe(100);
      expect(result.isAdFriendly).toBe(true);
    });

    it('should detect violence keywords', () => {
      const result = service.scoreAdFriendliness('The fight was brutal with blood everywhere');

      expect(result.isAdFriendly).toBe(false);
      expect(result.sensitiveTopics.some((t) => t.category === 'violence')).toBe(true);
    });

    it('should detect adult content keywords', () => {
      const result = service.scoreAdFriendliness('This is explicit adult content 18+');

      expect(result.sensitiveTopics.some((t) => t.category === 'adult')).toBe(true);
      expect(result.sensitiveTopics.find((t) => t.category === 'adult')?.impact).toBe('no_ads');
    });

    it('should detect controversial topics', () => {
      const result = service.scoreAdFriendliness('The political debate about immigration');

      expect(result.sensitiveTopics.some((t) => t.category === 'controversial')).toBe(true);
    });

    it('should detect drugs and alcohol', () => {
      const result = service.scoreAdFriendliness('Got so drunk at the party, smoking weed');

      expect(result.sensitiveTopics.some((t) => t.category === 'drugs_alcohol')).toBe(true);
    });

    it('should detect profanity', () => {
      const result = service.scoreAdFriendliness('This is fucking amazing!');

      expect(result.sensitiveTopics.some((t) => t.category === 'profanity')).toBe(true);
    });

    it('should detect misinformation', () => {
      const result = service.scoreAdFriendliness('The conspiracy theory about deep state');

      expect(result.sensitiveTopics.some((t) => t.category === 'misinformation')).toBe(true);
      expect(result.sensitiveTopics.find((t) => t.category === 'misinformation')?.impact).toBe('no_ads');
    });

    it('should return correct interpretation for different scores', () => {
      // High score
      const cleanResult = service.scoreAdFriendliness('Great product!');
      expect(cleanResult.interpretation).toContain('Fully ad-friendly');

      // Low score
      const badResult = service.scoreAdFriendliness('Fuck this conspiracy theory about the deep state');
      expect(badResult.overallScore).toBeLessThan(50);
    });

    it('should provide category breakdown', () => {
      const result = service.scoreAdFriendliness('Some content');

      expect(result.categoryBreakdown.length).toBe(7);
      expect(result.categoryBreakdown.every((c) => c.score >= 0 && c.score <= 100)).toBe(true);
    });

    it('should provide suggestions for flagged content', () => {
      const result = service.scoreAdFriendliness('The violent fight');

      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should track matched keywords', () => {
      const result = service.scoreAdFriendliness('kill and murder');

      expect(result.sensitiveTopics[0].matchedKeywords).toContain('kill');
      expect(result.sensitiveTopics[0].matchedKeywords).toContain('murder');
    });
  });

  describe('getAdFriendlyReport', () => {
    it('should return report with trends and flagged content', async () => {
      const mockContent = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          caption: 'Clean content here',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
        {
          id: 'content-2',
          externalContentId: 'ext-2',
          caption: 'Some violent fight content',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getAdFriendlyReport('org-1', 7);

      expect(result.trends).toBeDefined();
      expect(result.trends.length).toBe(7);
      expect(result.totalContent).toBe(2);
      expect(result.flaggedContent).toBeDefined();
    });

    it('should return empty report for no content', async () => {
      mockPrismaService.analyticsContent.findMany.mockResolvedValue([]);

      const result = await service.getAdFriendlyReport('org-1', 7);

      expect(result.totalContent).toBe(0);
      expect(result.adFriendlyCount).toBe(0);
      expect(result.adFriendlyPercentage).toBe(100);
    });

    it('should calculate category stats', async () => {
      const mockContent = [
        {
          id: 'content-1',
          externalContentId: 'ext-1',
          caption: 'Violent fight with blood',
          publishedAt: new Date(),
          organizationId: 'org-1',
          deletedAt: null,
        },
      ];

      mockPrismaService.analyticsContent.findMany.mockResolvedValue(mockContent);

      const result = await service.getAdFriendlyReport('org-1', 7);

      expect(result.categoryStats.violence).toBeGreaterThan(0);
    });
  });

  describe('getCategoryLabels', () => {
    it('should return labels for all categories', () => {
      const labels = service.getCategoryLabels();

      expect(labels.violence).toBeDefined();
      expect(labels.adult).toBeDefined();
      expect(labels.controversial).toBeDefined();
      expect(labels.drugs_alcohol).toBeDefined();
      expect(labels.profanity).toBeDefined();
      expect(labels.tragedy).toBeDefined();
      expect(labels.misinformation).toBeDefined();
    });
  });
});
