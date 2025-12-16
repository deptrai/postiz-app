import { Test, TestingModule } from '@nestjs/testing';
import { ThemeTrendingService } from './theme-trending.service';
import { PrismaService } from '../prisma.service';

describe('ThemeTrendingService', () => {
  let service: ThemeTrendingService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    const mockPrismaService = {
      theme: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeTrendingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThemeTrendingService>(ThemeTrendingService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getThemeTrends', () => {
    it('should calculate velocity correctly with increasing engagement', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Test Theme',
          keywords: ['test', 'keywords'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12h ago (current period)
                totalReach: 100,
                totalEngagement: 50,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000), // Previous period
                totalReach: 100,
                totalEngagement: 20, // Lower engagement
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId, {
        limit: 10,
        currentPeriodHours: 24,
        previousPeriodHours: 24,
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('theme-1');
      expect(result[0].velocity).toBeCloseTo(150, 0); // (50 - 20) / 20 * 100 = 150%
      expect(result[0].direction).toBe('rising');
    });

    it('should mark theme as rising when velocity > 10%', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Rising Theme',
          keywords: ['test'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 80,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId);

      expect(result[0].direction).toBe('rising');
      expect(result[0].velocity).toBeCloseTo(25, 0); // (100 - 80) / 80 * 100
    });

    it('should mark theme as stable when velocity between -10% and 10%', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Stable Theme',
          keywords: ['test'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 105,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId);

      expect(result[0].direction).toBe('stable');
      expect(result[0].velocity).toBeCloseTo(5, 0);
    });

    it('should mark theme as falling when velocity < -10%', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Falling Theme',
          keywords: ['test'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 50,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId);

      expect(result[0].direction).toBe('falling');
      expect(result[0].velocity).toBeCloseTo(-50, 0); // (50 - 100) / 100 * 100
    });

    it('should handle new themes with no previous period data', async () => {
      const now = new Date();

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'New Theme',
          keywords: ['test'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 50,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId);

      expect(result[0].velocity).toBe(100); // New theme with engagement
      expect(result[0].direction).toBe('rising');
    });

    it('should sort by absolute velocity (highest change first)', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Small Change',
          keywords: ['test'],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 110,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
        {
          id: 'theme-2',
          name: 'Big Drop',
          keywords: ['test'],
          content: [
            {
              id: 'tc-3',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 20,
              },
            },
            {
              id: 'tc-4',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getThemeTrends(mockOrgId);

      // Big drop (-80%) should come first despite being negative
      expect(result[0].id).toBe('theme-2');
      expect(result[0].velocity).toBeCloseTo(-80, 0);
      expect(result[1].id).toBe('theme-1');
      expect(result[1].velocity).toBeCloseTo(10, 0);
    });
  });

  describe('getTrendingSummary', () => {
    it('should return counts for each direction', async () => {
      const now = new Date();
      const currentPeriodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const previousPeriodStart = new Date(currentPeriodStart.getTime() - 24 * 60 * 60 * 1000);

      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Rising',
          keywords: [],
          content: [
            {
              id: 'tc-1',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 150,
              },
            },
            {
              id: 'tc-2',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
        {
          id: 'theme-2',
          name: 'Falling',
          keywords: [],
          content: [
            {
              id: 'tc-3',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 50,
              },
            },
            {
              id: 'tc-4',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
        {
          id: 'theme-3',
          name: 'Stable',
          keywords: [],
          content: [
            {
              id: 'tc-5',
              content: {
                createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
                totalReach: 100,
                totalEngagement: 105,
              },
            },
            {
              id: 'tc-6',
              content: {
                createdAt: new Date(previousPeriodStart.getTime() + 1000),
                totalReach: 100,
                totalEngagement: 100,
              },
            },
          ],
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);

      const result = await service.getTrendingSummary(mockOrgId);

      expect(result.summary.total).toBe(3);
      expect(result.summary.rising).toBe(1);
      expect(result.summary.falling).toBe(1);
      expect(result.summary.stable).toBe(1);
      expect(result.risingThemes).toHaveLength(1);
      expect(result.fallingThemes).toHaveLength(1);
    });
  });

  describe('getThemeTopContent', () => {
    it('should return top content sorted by engagement', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Test Theme',
        keywords: ['test'],
        content: [
          {
            id: 'tc-1',
            content: {
              externalContentId: 'ext-1',
              contentType: 'post',
              caption: 'Low engagement',
              url: 'http://test.com/1',
              totalReach: 100,
              totalEngagement: 50,
              engagementRate: 50,
              createdAt: new Date(),
            },
          },
          {
            id: 'tc-2',
            content: {
              externalContentId: 'ext-2',
              contentType: 'post',
              caption: 'High engagement',
              url: 'http://test.com/2',
              totalReach: 100,
              totalEngagement: 200,
              engagementRate: 200,
              createdAt: new Date(),
            },
          },
          {
            id: 'tc-3',
            content: {
              externalContentId: 'ext-3',
              contentType: 'post',
              caption: 'Medium engagement',
              url: 'http://test.com/3',
              totalReach: 100,
              totalEngagement: 100,
              engagementRate: 100,
              createdAt: new Date(),
            },
          },
        ],
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);

      const result = await service.getThemeTopContent('theme-1', mockOrgId, 10);

      expect(result).toHaveLength(3);
      expect(result[0].caption).toBe('High engagement');
      expect(result[0].totalEngagement).toBe(200);
      expect(result[1].caption).toBe('Medium engagement');
      expect(result[1].totalEngagement).toBe(100);
      expect(result[2].caption).toBe('Low engagement');
      expect(result[2].totalEngagement).toBe(50);
    });

    it('should respect limit parameter', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Test Theme',
        keywords: ['test'],
        content: [
          {
            id: 'tc-1',
            content: {
              externalContentId: 'ext-1',
              contentType: 'post',
              caption: 'Content 1',
              totalReach: 100,
              totalEngagement: 100,
              engagementRate: 100,
              createdAt: new Date(),
            },
          },
          {
            id: 'tc-2',
            content: {
              externalContentId: 'ext-2',
              contentType: 'post',
              caption: 'Content 2',
              totalReach: 100,
              totalEngagement: 90,
              engagementRate: 90,
              createdAt: new Date(),
            },
          },
          {
            id: 'tc-3',
            content: {
              externalContentId: 'ext-3',
              contentType: 'post',
              caption: 'Content 3',
              totalReach: 100,
              totalEngagement: 80,
              engagementRate: 80,
              createdAt: new Date(),
            },
          },
        ],
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);

      const result = await service.getThemeTopContent('theme-1', mockOrgId, 2);

      expect(result).toHaveLength(2);
      expect(result[0].totalEngagement).toBe(100);
      expect(result[1].totalEngagement).toBe(90);
    });

    it('should throw error if theme not found', async () => {
      prismaService.theme.findFirst.mockResolvedValue(null);

      await expect(
        service.getThemeTopContent('invalid-id', mockOrgId, 10)
      ).rejects.toThrow('Theme not found');
    });
  });
});
