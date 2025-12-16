import { Test, TestingModule } from '@nestjs/testing';
import { ThemeClusteringService } from './theme-clustering.service';
import { PrismaService } from '../prisma.service';

describe('ThemeClusteringService - Integration Test', () => {
  let service: ThemeClusteringService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    const mockPrismaService = {
      theme: {
        updateMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      themeContent: {
        create: jest.fn(),
      },
      analyticsContent: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeClusteringService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThemeClusteringService>(ThemeClusteringService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runClustering - Full Pipeline', () => {
    it('should archive old themes before creating new ones', async () => {
      const mockContents = [
        {
          id: 'content-1',
          caption: 'Hot sunny day at home',
          hashtags: '#hot #sunny #home',
          contentType: 'post',
          publishedAt: new Date('2024-12-01'),
        },
        {
          id: 'content-2',
          caption: 'Another hot sunny afternoon',
          hashtags: '#hot #sunny #afternoon',
          contentType: 'post',
          publishedAt: new Date('2024-12-02'),
        },
        {
          id: 'content-3',
          caption: 'Perfect weather today',
          hashtags: '#weather #perfect #today',
          contentType: 'post',
          publishedAt: new Date('2024-12-03'),
        },
      ];

      prismaService.analyticsContent.findMany.mockResolvedValue(mockContents as any);
      prismaService.theme.create.mockResolvedValue({
        id: 'theme-1',
        name: 'hot-sunny-home',
        organizationId: mockOrgId,
        keywords: ['hot', 'sunny', 'home'],
        contentCount: 2,
        avgReach: 0,
        avgEngagement: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      await service.runClustering(mockOrgId);

      // Verify old themes were archived
      expect(prismaService.theme.updateMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
        },
      });
    });

    it('should create themes from clustered content', async () => {
      const mockContents = [
        {
          id: 'content-1',
          caption: 'Dán phim cách nhiệt cho nhà nóng nắng',
          hashtags: '#nóng #nắng #nhà #dán #phim',
          contentType: 'post',
          publishedAt: new Date('2024-12-01'),
        },
        {
          id: 'content-2',
          caption: 'Nhà nóng lắm cần dán phim',
          hashtags: '#nóng #nhà #phim',
          contentType: 'post',
          publishedAt: new Date('2024-12-02'),
        },
      ];

      prismaService.analyticsContent.findMany.mockResolvedValue(mockContents as any);
      prismaService.theme.create.mockResolvedValue({
        id: 'theme-1',
        name: 'nóng-nắng-nhà',
        organizationId: mockOrgId,
        keywords: ['nóng', 'nắng', 'nhà', 'dán', 'phim'],
        contentCount: 2,
        avgReach: 0,
        avgEngagement: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      const result = await service.runClustering(mockOrgId);

      // Verify theme was created
      expect(prismaService.theme.create).toHaveBeenCalledWith({
        data: {
          name: expect.any(String),
          organizationId: mockOrgId,
          keywords: expect.any(Array),
          contentCount: 2,
        },
      });

      // Verify content was linked to theme
      expect(prismaService.themeContent.create).toHaveBeenCalledTimes(2);
    });

    it('should skip clustering with insufficient content', async () => {
      prismaService.analyticsContent.findMany.mockResolvedValue([
        {
          id: 'content-1',
          caption: 'Only one item',
          hashtags: '#test',
          contentType: 'post',
          publishedAt: new Date(),
        },
      ] as any);

      const result = await service.runClustering(mockOrgId);

      expect(result.themes).toEqual([]);
      expect(result.contentClustered).toBe(0);
      expect(prismaService.theme.create).not.toHaveBeenCalled();
    });

    it('should skip small clusters below minClusterSize', async () => {
      const mockContents = [
        {
          id: 'content-1',
          caption: 'Unique content A',
          hashtags: '#unique #contentA',
          contentType: 'post',
          publishedAt: new Date('2024-12-01'),
        },
        {
          id: 'content-2',
          caption: 'Different content B',
          hashtags: '#different #contentB',
          contentType: 'post',
          publishedAt: new Date('2024-12-02'),
        },
        {
          id: 'content-3',
          caption: 'Another different C',
          hashtags: '#another #differentC',
          contentType: 'post',
          publishedAt: new Date('2024-12-03'),
        },
      ];

      prismaService.analyticsContent.findMany.mockResolvedValue(mockContents as any);

      const result = await service.runClustering(mockOrgId, { minClusterSize: 2 });

      // Should skip all clusters if they have < 2 items each
      expect(result.themes.length).toBeLessThanOrEqual(1);
    });

    it('should calculate metrics for created themes', async () => {
      const mockContents = [
        {
          id: 'content-1',
          caption: 'Test content with metrics',
          hashtags: '#test #metrics',
          contentType: 'post',
          publishedAt: new Date(),
        },
        {
          id: 'content-2',
          caption: 'Another test with metrics',
          hashtags: '#test #metrics',
          contentType: 'post',
          publishedAt: new Date(),
        },
      ];

      prismaService.analyticsContent.findMany.mockResolvedValue(mockContents as any);
      prismaService.theme.create.mockResolvedValue({
        id: 'theme-1',
        name: 'test-metrics',
        organizationId: mockOrgId,
        keywords: ['test', 'metrics'],
        contentCount: 2,
        avgReach: 0,
        avgEngagement: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);

      await service.runClustering(mockOrgId);

      // Verify theme update was called to set metrics
      expect(prismaService.theme.update).toHaveBeenCalled();
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords from Vietnamese caption', () => {
      const caption = 'Dán phim cách nhiệt cho nhà nóng nắng';
      const keywords = (service as any).extractKeywords(caption, null);

      expect(keywords).toContain('dán');
      expect(keywords).toContain('phim');
      expect(keywords).toContain('nóng');
      expect(keywords).toContain('nắng');
    });

    it('should extract hashtags', () => {
      const keywords = (service as any).extractKeywords(null, '#hot #sunny #home');

      expect(keywords).toContain('hot');
      expect(keywords).toContain('sunny');
      expect(keywords).toContain('home');
    });

    it('should filter out stopwords', () => {
      const caption = 'This is a test with some common words';
      const keywords = (service as any).extractKeywords(caption, null);

      expect(keywords).not.toContain('is');
      expect(keywords).not.toContain('a');
      expect(keywords).not.toContain('with');
    });

    it('should remove emojis and URLs', () => {
      const caption = 'Check this 🔥 https://example.com great content';
      const keywords = (service as any).extractKeywords(caption, null);

      expect(keywords).not.toContain('🔥');
      expect(keywords).not.toContain('https://example.com');
      expect(keywords).toContain('check');
      expect(keywords).toContain('great');
    });
  });

  describe('calculateJaccardSimilarity', () => {
    it('should return 1 for identical keyword sets', () => {
      const keywords1 = ['test', 'keywords', 'same'];
      const keywords2 = ['test', 'keywords', 'same'];

      const similarity = (service as any).calculateJaccardSimilarity(keywords1, keywords2);

      expect(similarity).toBe(1);
    });

    it('should return 0 for completely different keyword sets', () => {
      const keywords1 = ['test', 'keywords'];
      const keywords2 = ['different', 'words'];

      const similarity = (service as any).calculateJaccardSimilarity(keywords1, keywords2);

      expect(similarity).toBe(0);
    });

    it('should calculate correct similarity for partial overlap', () => {
      const keywords1 = ['test', 'keywords', 'same'];
      const keywords2 = ['test', 'different', 'words'];

      const similarity = (service as any).calculateJaccardSimilarity(keywords1, keywords2);

      // Intersection: ['test'] = 1
      // Union: ['test', 'keywords', 'same', 'different', 'words'] = 5
      // Similarity: 1/5 = 0.2
      expect(similarity).toBeCloseTo(0.2, 2);
    });
  });
});
