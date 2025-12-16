import { Test, TestingModule } from '@nestjs/testing';
import { ThemeManagerService } from './theme-manager.service';
import { PrismaService } from '../prisma.service';

describe('ThemeManagerService', () => {
  let service: ThemeManagerService;
  let prismaService: jest.Mocked<PrismaService>;

  const mockOrgId = 'test-org-123';

  beforeEach(async () => {
    const mockPrismaService = {
      theme: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        create: jest.fn(),
      },
      themeContent: {
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      themeHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemeManagerService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ThemeManagerService>(ThemeManagerService);
    prismaService = module.get(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renameTheme', () => {
    it('should rename theme and log history', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Old Name',
        organizationId: mockOrgId,
        keywords: ['test', 'keywords'],
        contentCount: 5,
        avgReach: 100,
        avgEngagement: 50,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      const updatedTheme = {
        ...mockTheme,
        name: 'New Name',
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);
      prismaService.theme.update.mockResolvedValue(updatedTheme as any);
      prismaService.themeHistory.create.mockResolvedValue({
        id: 'history-1',
        themeId: 'theme-1',
        action: 'rename',
        previousState: { name: 'Old Name', keywords: ['test', 'keywords'], contentCount: 5 },
        newState: { name: 'New Name', keywords: ['test', 'keywords'], contentCount: 5 },
        relatedThemeIds: [],
        createdAt: new Date(),
      } as any);

      const result = await service.renameTheme('theme-1', 'New Name', mockOrgId);

      expect(result.name).toBe('New Name');
      expect(prismaService.theme.update).toHaveBeenCalledWith({
        where: { id: 'theme-1' },
        data: { name: 'New Name' },
      });
      expect(prismaService.themeHistory.create).toHaveBeenCalledWith({
        data: {
          themeId: 'theme-1',
          action: 'rename',
          previousState: {
            name: 'Old Name',
            keywords: ['test', 'keywords'],
            contentCount: 5,
          },
          newState: {
            name: 'New Name',
            keywords: ['test', 'keywords'],
            contentCount: 5,
          },
          relatedThemeIds: [],
        },
      });
    });

    it('should throw error if theme not found', async () => {
      prismaService.theme.findFirst.mockResolvedValue(null);

      await expect(
        service.renameTheme('invalid-id', 'New Name', mockOrgId)
      ).rejects.toThrow('Theme not found');
    });
  });

  describe('mergeThemes', () => {
    it('should merge multiple themes and log history', async () => {
      const mockThemes = [
        {
          id: 'theme-1',
          name: 'Theme 1',
          organizationId: mockOrgId,
          keywords: ['keyword1', 'keyword2'],
          contentCount: 3,
          content: [{ id: 'tc-1', themeId: 'theme-1', contentId: 'content-1' }],
          avgReach: 100,
          avgEngagement: 50,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
        {
          id: 'theme-2',
          name: 'Theme 2',
          organizationId: mockOrgId,
          keywords: ['keyword2', 'keyword3'],
          contentCount: 2,
          content: [{ id: 'tc-2', themeId: 'theme-2', contentId: 'content-2' }],
          avgReach: 150,
          avgEngagement: 75,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        },
      ];

      prismaService.theme.findMany.mockResolvedValue(mockThemes as any);
      prismaService.themeContent.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaService.themeContent.count.mockResolvedValue(5);
      prismaService.theme.update.mockResolvedValue({
        ...mockThemes[0],
        name: 'Merged Theme',
        keywords: ['keyword1', 'keyword2', 'keyword3'],
        contentCount: 5,
      } as any);
      prismaService.theme.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaService.themeHistory.create.mockResolvedValue({} as any);

      const result = await service.mergeThemes(
        ['theme-1', 'theme-2'],
        'Merged Theme',
        mockOrgId
      );

      expect(result.name).toBe('Merged Theme');
      expect(result.keywords).toContain('keyword1');
      expect(result.keywords).toContain('keyword2');
      expect(result.keywords).toContain('keyword3');
      expect(prismaService.themeContent.updateMany).toHaveBeenCalled();
      expect(prismaService.theme.updateMany).toHaveBeenCalledWith({
        where: { id: { in: ['theme-2'] } },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaService.themeHistory.create).toHaveBeenCalledTimes(2);
    });

    it('should throw error if less than 2 themes provided', async () => {
      await expect(
        service.mergeThemes(['theme-1'], 'Merged Theme', mockOrgId)
      ).rejects.toThrow('At least 2 themes required for merge');
    });

    it('should throw error if themes not found', async () => {
      prismaService.theme.findMany.mockResolvedValue([{ id: 'theme-1' }] as any);

      await expect(
        service.mergeThemes(['theme-1', 'theme-2'], 'Merged Theme', mockOrgId)
      ).rejects.toThrow('One or more themes not found');
    });
  });

  describe('splitTheme', () => {
    it('should split theme in auto mode', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Original Theme',
        organizationId: mockOrgId,
        keywords: ['test'],
        contentCount: 4,
        content: [
          { id: 'tc-1', themeId: 'theme-1', contentId: 'content-1', content: {} },
          { id: 'tc-2', themeId: 'theme-1', contentId: 'content-2', content: {} },
          { id: 'tc-3', themeId: 'theme-1', contentId: 'content-3', content: {} },
          { id: 'tc-4', themeId: 'theme-1', contentId: 'content-4', content: {} },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);
      prismaService.theme.create.mockResolvedValueOnce({
        id: 'theme-2',
        name: 'Original Theme (Split 1)',
        organizationId: mockOrgId,
        keywords: [],
        contentCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);
      prismaService.theme.create.mockResolvedValueOnce({
        id: 'theme-3',
        name: 'Original Theme (Split 2)',
        organizationId: mockOrgId,
        keywords: [],
        contentCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);
      prismaService.themeContent.updateMany.mockResolvedValue({ count: 2 } as any);
      prismaService.theme.update.mockResolvedValue({
        ...mockTheme,
        deletedAt: new Date(),
      } as any);
      prismaService.themeHistory.create.mockResolvedValue({} as any);

      const result = await service.splitTheme(
        'theme-1',
        { mode: 'auto' },
        mockOrgId
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Original Theme (Split 1)');
      expect(result[1].name).toBe('Original Theme (Split 2)');
      expect(prismaService.theme.create).toHaveBeenCalledTimes(2);
      expect(prismaService.theme.update).toHaveBeenCalledWith({
        where: { id: 'theme-1' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(prismaService.themeHistory.create).toHaveBeenCalledTimes(3);
    });

    it('should split theme in manual mode', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Original Theme',
        organizationId: mockOrgId,
        keywords: ['test'],
        contentCount: 3,
        content: [
          { id: 'tc-1', themeId: 'theme-1', contentId: 'content-1', content: {} },
          { id: 'tc-2', themeId: 'theme-1', contentId: 'content-2', content: {} },
          { id: 'tc-3', themeId: 'theme-1', contentId: 'content-3', content: {} },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);
      prismaService.theme.create.mockResolvedValueOnce({
        id: 'theme-2',
        name: 'Group A',
        organizationId: mockOrgId,
        keywords: [],
        contentCount: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);
      prismaService.theme.create.mockResolvedValueOnce({
        id: 'theme-3',
        name: 'Group B',
        organizationId: mockOrgId,
        keywords: [],
        contentCount: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any);
      prismaService.themeContent.updateMany.mockResolvedValue({ count: 1 } as any);
      prismaService.theme.update.mockResolvedValue({
        ...mockTheme,
        deletedAt: new Date(),
      } as any);
      prismaService.themeHistory.create.mockResolvedValue({} as any);

      const result = await service.splitTheme(
        'theme-1',
        {
          mode: 'manual',
          manualSplit: [
            { name: 'Group A', contentIds: ['content-1', 'content-2'] },
            { name: 'Group B', contentIds: ['content-3'] },
          ],
        },
        mockOrgId
      );

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Group A');
      expect(result[1].name).toBe('Group B');
    });

    it('should throw error if theme not found', async () => {
      prismaService.theme.findFirst.mockResolvedValue(null);

      await expect(
        service.splitTheme('invalid-id', { mode: 'auto' }, mockOrgId)
      ).rejects.toThrow('Theme not found');
    });

    it('should throw error if theme has less than 2 content items', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Small Theme',
        organizationId: mockOrgId,
        keywords: [],
        contentCount: 1,
        content: [{ id: 'tc-1', themeId: 'theme-1', contentId: 'content-1' }],
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      };

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);

      await expect(
        service.splitTheme('theme-1', { mode: 'auto' }, mockOrgId)
      ).rejects.toThrow('Theme must have at least 2 content items to split');
    });
  });

  describe('getThemeHistory', () => {
    it('should return theme history ordered by date', async () => {
      const mockTheme = {
        id: 'theme-1',
        name: 'Test Theme',
        organizationId: mockOrgId,
      };

      const mockHistory = [
        {
          id: 'history-2',
          themeId: 'theme-1',
          action: 'merge',
          previousState: {},
          newState: {},
          relatedThemeIds: ['theme-2'],
          createdAt: new Date('2024-12-15'),
        },
        {
          id: 'history-1',
          themeId: 'theme-1',
          action: 'rename',
          previousState: {},
          newState: {},
          relatedThemeIds: [],
          createdAt: new Date('2024-12-14'),
        },
      ];

      prismaService.theme.findFirst.mockResolvedValue(mockTheme as any);
      prismaService.themeHistory.findMany.mockResolvedValue(mockHistory as any);

      const result = await service.getThemeHistory('theme-1', mockOrgId);

      expect(result).toHaveLength(2);
      expect(result[0].action).toBe('merge');
      expect(result[1].action).toBe('rename');
      expect(prismaService.themeHistory.findMany).toHaveBeenCalledWith({
        where: { themeId: 'theme-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw error if theme not found', async () => {
      prismaService.theme.findFirst.mockResolvedValue(null);

      await expect(
        service.getThemeHistory('invalid-id', mockOrgId)
      ).rejects.toThrow('Theme not found');
    });
  });
});
