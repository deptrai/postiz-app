import { Test, TestingModule } from '@nestjs/testing';
import { PlaybookVariantService } from './playbook-variant.service';
import { PrismaService } from '../prisma.service';

describe('PlaybookVariantService', () => {
  let service: PlaybookVariantService;
  let prismaService: PrismaService;

  const mockPlaybook = {
    id: 'playbook-1',
    organizationId: 'org-1',
    name: 'Test Playbook',
    format: 'post',
    recipe: {
      format: 'post',
      captionBucket: {
        hooks: [
          'How to grow your business?',
          'Top 10 tips for success',
          'Why you need this product',
        ],
        ctaPatterns: ['Learn more', 'Click link', 'Comment below'],
      },
      hashtagBucket: [
        '#business',
        '#growth',
        '#tips',
        '#success',
        '#marketing',
        '#sales',
      ],
      timeBucket: {
        bestHours: [10, 14, 18],
        bestDays: [1, 3, 5],
      },
    },
    consistencyScore: 85,
    deletedAt: null,
  };

  const mockVariants = [
    {
      id: 'variant-1',
      playbookId: 'playbook-1',
      name: 'Hook Variation A',
      type: 'hook',
      recipe: mockPlaybook.recipe,
      description: 'Hook variation description',
      createdAt: new Date(),
      deletedAt: null,
    },
    {
      id: 'variant-2',
      playbookId: 'playbook-1',
      name: 'Time Variation A',
      type: 'time',
      recipe: mockPlaybook.recipe,
      description: 'Time variation description',
      createdAt: new Date(),
      deletedAt: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaybookVariantService,
        {
          provide: PrismaService,
          useValue: {
            playbook: {
              findFirst: jest.fn(),
            },
            playbookVariant: {
              findMany: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<PlaybookVariantService>(PlaybookVariantService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getVariants', () => {
    it('should return all variants for a playbook', async () => {
      jest.spyOn(prismaService.playbookVariant, 'findMany').mockResolvedValue(mockVariants as any);

      const result = await service.getVariants('playbook-1', 'org-1');

      expect(result).toEqual(mockVariants);
      expect(prismaService.playbookVariant.findMany).toHaveBeenCalledWith({
        where: {
          playbookId: 'playbook-1',
          playbook: {
            organizationId: 'org-1',
          },
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
    });
  });

  describe('getVariantById', () => {
    it('should return a variant by ID', async () => {
      const variant = { ...mockVariants[0], playbook: mockPlaybook };
      jest.spyOn(prismaService.playbookVariant, 'findFirst').mockResolvedValue(variant as any);

      const result = await service.getVariantById('variant-1', 'org-1');

      expect(result).toEqual(variant);
      expect(prismaService.playbookVariant.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'variant-1',
          playbook: {
            organizationId: 'org-1',
          },
          deletedAt: null,
        },
        include: {
          playbook: true,
        },
      });
    });
  });

  describe('generateVariants', () => {
    it('should throw error if playbook not found', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(null);

      await expect(
        service.generateVariants('playbook-1', 'org-1')
      ).rejects.toThrow('Playbook not found');
    });

    it('should generate 5 variants for a playbook', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) =>
        Promise.resolve({
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        } as any)
      );

      const result = await service.generateVariants('playbook-1', 'org-1');

      expect(result).toHaveLength(5);
      expect(prismaService.playbookVariant.updateMany).toHaveBeenCalledWith({
        where: {
          playbookId: 'playbook-1',
          deletedAt: null,
        },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(prismaService.playbookVariant.create).toHaveBeenCalledTimes(5);
    });

    it('should generate variants with different types', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const types = createdVariants.map(v => v.type);
      expect(types).toContain('hook');
      expect(types).toContain('time');
      expect(types).toContain('hashtag');
      expect(types.filter(t => t === 'hook').length).toBe(2); // 2 hook variants
      expect(types.filter(t => t === 'time').length).toBe(2); // 2 time variants
      expect(types.filter(t => t === 'hashtag').length).toBe(1); // 1 hashtag variant
    });

    it('should generate hook variation with direct statements', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const directHookVariant = createdVariants.find(v => v.name === 'Hook Variation A');
      expect(directHookVariant).toBeDefined();
      expect(directHookVariant.type).toBe('hook');
      expect(directHookVariant.description).toContain('direct statements');
    });

    it('should generate hook variation with questions', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const questionHookVariant = createdVariants.find(v => v.name === 'Hook Variation B');
      expect(questionHookVariant).toBeDefined();
      expect(questionHookVariant.type).toBe('hook');
      expect(questionHookVariant.description).toContain('question-based');
    });

    it('should generate time variation for morning slot', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const morningVariant = createdVariants.find(v => v.name === 'Time Variation A');
      expect(morningVariant).toBeDefined();
      expect(morningVariant.type).toBe('time');
      expect(morningVariant.description).toContain('morning');
      expect(morningVariant.recipe.timeBucket.bestHours).toEqual([6, 7, 8]);
    });

    it('should generate time variation for evening slot', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const eveningVariant = createdVariants.find(v => v.name === 'Time Variation B');
      expect(eveningVariant).toBeDefined();
      expect(eveningVariant.type).toBe('time');
      expect(eveningVariant.description).toContain('evening');
      expect(eveningVariant.recipe.timeBucket.bestHours).toEqual([18, 19, 20]);
    });

    it('should generate hashtag variation', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook as any);
      jest.spyOn(prismaService.playbookVariant, 'updateMany').mockResolvedValue({ count: 0 } as any);
      
      const createdVariants: any[] = [];
      jest.spyOn(prismaService.playbookVariant, 'create').mockImplementation((data) => {
        const variant = {
          id: `variant-${Math.random()}`,
          ...data.data,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
        };
        createdVariants.push(variant);
        return Promise.resolve(variant as any);
      });

      await service.generateVariants('playbook-1', 'org-1');

      const hashtagVariant = createdVariants.find(v => v.type === 'hashtag');
      expect(hashtagVariant).toBeDefined();
      expect(hashtagVariant.description).toContain('high-reach');
      expect(hashtagVariant.recipe.hashtagBucket.length).toBeLessThanOrEqual(8);
    });
  });

  describe('deleteVariant', () => {
    it('should throw error if variant not found', async () => {
      jest.spyOn(prismaService.playbookVariant, 'findFirst').mockResolvedValue(null);

      await expect(
        service.deleteVariant('variant-1', 'org-1')
      ).rejects.toThrow('Variant not found');
    });

    it('should soft delete a variant', async () => {
      const variant = { ...mockVariants[0], playbook: mockPlaybook };
      jest.spyOn(prismaService.playbookVariant, 'findFirst').mockResolvedValue(variant as any);
      jest.spyOn(prismaService.playbookVariant, 'update').mockResolvedValue(variant as any);

      const result = await service.deleteVariant('variant-1', 'org-1');

      expect(result).toEqual({ success: true });
      expect(prismaService.playbookVariant.update).toHaveBeenCalledWith({
        where: { id: 'variant-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
