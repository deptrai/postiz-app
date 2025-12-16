import { Test, TestingModule } from '@nestjs/testing';
import { ExperimentService } from './experiment.service';
import { PrismaService } from '../prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ExperimentService', () => {
  let service: ExperimentService;
  let prismaService: PrismaService;

  const mockOrgId = 'org-123';
  const mockPlaybookId = 'playbook-123';
  const mockVariantIds = ['variant-1', 'variant-2'];

  const mockPlaybook = {
    id: mockPlaybookId,
    organizationId: mockOrgId,
    name: 'Test Playbook',
    deletedAt: null,
  };

  const mockVariants = [
    { id: 'variant-1', playbookId: mockPlaybookId, name: 'Variant 1', deletedAt: null },
    { id: 'variant-2', playbookId: mockPlaybookId, name: 'Variant 2', deletedAt: null },
  ];

  const mockExperiment = {
    id: 'experiment-123',
    name: 'Hook Test',
    playbookId: mockPlaybookId,
    organizationId: mockOrgId,
    status: 'draft',
    successMetric: 'engagement',
    startDate: null,
    endDate: null,
    winnerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    playbook: mockPlaybook,
    variants: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperimentService,
        {
          provide: PrismaService,
          useValue: {
            playbook: {
              findFirst: jest.fn(),
            },
            playbookVariant: {
              findMany: jest.fn(),
            },
            experiment: {
              create: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ExperimentService>(ExperimentService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createExperiment', () => {
    it('should throw error if variant count is less than 2', async () => {
      await expect(
        service.createExperiment(mockOrgId, {
          name: 'Test',
          playbookId: mockPlaybookId,
          variantIds: ['variant-1'],
          successMetric: 'engagement',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if variant count is more than 3', async () => {
      await expect(
        service.createExperiment(mockOrgId, {
          name: 'Test',
          playbookId: mockPlaybookId,
          variantIds: ['v1', 'v2', 'v3', 'v4'],
          successMetric: 'engagement',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error if playbook not found', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(null);

      await expect(
        service.createExperiment(mockOrgId, {
          name: 'Test',
          playbookId: mockPlaybookId,
          variantIds: mockVariantIds,
          successMetric: 'engagement',
        })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw error if variants not found', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook);
      jest.spyOn(prismaService.playbookVariant, 'findMany').mockResolvedValue([mockVariants[0]]);

      await expect(
        service.createExperiment(mockOrgId, {
          name: 'Test',
          playbookId: mockPlaybookId,
          variantIds: mockVariantIds,
          successMetric: 'engagement',
        })
      ).rejects.toThrow(BadRequestException);
    });

    it('should create experiment with 2 variants', async () => {
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook);
      jest.spyOn(prismaService.playbookVariant, 'findMany').mockResolvedValue(mockVariants);
      jest.spyOn(prismaService.experiment, 'create').mockResolvedValue(mockExperiment as any);

      const result = await service.createExperiment(mockOrgId, {
        name: 'Hook Test',
        playbookId: mockPlaybookId,
        variantIds: mockVariantIds,
        successMetric: 'engagement',
      });

      expect(result).toEqual(mockExperiment);
      expect(prismaService.experiment.create).toHaveBeenCalledWith({
        data: {
          name: 'Hook Test',
          playbookId: mockPlaybookId,
          organizationId: mockOrgId,
          successMetric: 'engagement',
          startDate: undefined,
          endDate: undefined,
          status: 'draft',
          variants: {
            create: [
              { variantId: 'variant-1' },
              { variantId: 'variant-2' },
            ],
          },
        },
        include: {
          variants: {
            include: {
              variant: true,
            },
          },
          playbook: true,
        },
      });
    });

    it('should create experiment with 3 variants', async () => {
      const threeVariants = [...mockVariants, { id: 'variant-3', playbookId: mockPlaybookId, name: 'Variant 3', deletedAt: null }];
      jest.spyOn(prismaService.playbook, 'findFirst').mockResolvedValue(mockPlaybook);
      jest.spyOn(prismaService.playbookVariant, 'findMany').mockResolvedValue(threeVariants);
      jest.spyOn(prismaService.experiment, 'create').mockResolvedValue(mockExperiment as any);

      const result = await service.createExperiment(mockOrgId, {
        name: 'ABC Test',
        playbookId: mockPlaybookId,
        variantIds: ['variant-1', 'variant-2', 'variant-3'],
        successMetric: 'combined',
      });

      expect(result).toEqual(mockExperiment);
    });
  });

  describe('getExperiments', () => {
    it('should return all experiments for organization', async () => {
      const mockExperiments = [mockExperiment];
      jest.spyOn(prismaService.experiment, 'findMany').mockResolvedValue(mockExperiments as any);

      const result = await service.getExperiments(mockOrgId);

      expect(result).toEqual(mockExperiments);
      expect(prismaService.experiment.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: mockOrgId,
          deletedAt: null,
        },
        include: {
          playbook: true,
          variants: {
            include: {
              variant: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });

    it('should filter experiments by status', async () => {
      const activeExperiments = [{ ...mockExperiment, status: 'active' }];
      jest.spyOn(prismaService.experiment, 'findMany').mockResolvedValue(activeExperiments as any);

      const result = await service.getExperiments(mockOrgId, { status: 'active' });

      expect(result).toEqual(activeExperiments);
      expect(prismaService.experiment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });
  });

  describe('startExperiment', () => {
    it('should throw error if experiment not draft', async () => {
      const activeExperiment = { ...mockExperiment, status: 'active' };
      jest.spyOn(prismaService.experiment, 'findFirst').mockResolvedValue(activeExperiment as any);

      await expect(
        service.startExperiment('experiment-123', mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should start draft experiment', async () => {
      jest.spyOn(prismaService.experiment, 'findFirst').mockResolvedValue(mockExperiment as any);
      const updatedExperiment = { ...mockExperiment, status: 'active', startDate: new Date() };
      jest.spyOn(prismaService.experiment, 'update').mockResolvedValue(updatedExperiment as any);

      const result = await service.startExperiment('experiment-123', mockOrgId);

      expect(result.status).toBe('active');
      expect(result.startDate).toBeDefined();
    });
  });

  describe('completeExperiment', () => {
    it('should throw error if experiment not active', async () => {
      jest.spyOn(prismaService.experiment, 'findFirst').mockResolvedValue(mockExperiment as any);

      await expect(
        service.completeExperiment('experiment-123', mockOrgId)
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete active experiment', async () => {
      const activeExperiment = { ...mockExperiment, status: 'active' };
      jest.spyOn(prismaService.experiment, 'findFirst').mockResolvedValue(activeExperiment as any);
      const completedExperiment = { ...activeExperiment, status: 'completed', endDate: new Date() };
      jest.spyOn(prismaService.experiment, 'update').mockResolvedValue(completedExperiment as any);

      const result = await service.completeExperiment('experiment-123', mockOrgId);

      expect(result.status).toBe('completed');
      expect(result.endDate).toBeDefined();
    });
  });

  describe('deleteExperiment', () => {
    it('should soft delete experiment', async () => {
      jest.spyOn(prismaService.experiment, 'findFirst').mockResolvedValue(mockExperiment as any);
      jest.spyOn(prismaService.experiment, 'update').mockResolvedValue({ ...mockExperiment, deletedAt: new Date() } as any);

      const result = await service.deleteExperiment('experiment-123', mockOrgId);

      expect(result.success).toBe(true);
      expect(prismaService.experiment.update).toHaveBeenCalledWith({
        where: { id: 'experiment-123' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
