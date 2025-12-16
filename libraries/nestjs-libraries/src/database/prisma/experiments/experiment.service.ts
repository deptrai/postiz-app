import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface CreateExperimentDto {
  name: string;
  playbookId: string;
  variantIds: string[];
  successMetric: 'reach' | 'engagement' | 'combined';
  startDate?: Date;
  endDate?: Date;
}

interface ExperimentFilters {
  status?: 'draft' | 'active' | 'completed';
}

@Injectable()
export class ExperimentService {
  constructor(private readonly _prismaService: PrismaService) {}

  /**
   * Create a new experiment with selected variants
   * AC1: User can select 2-3 variants to test
   * AC2: User can configure name, timeframe, success metric
   */
  async createExperiment(
    organizationId: string,
    dto: CreateExperimentDto
  ) {
    // Validate variant count (AC1: 2-3 variants)
    if (dto.variantIds.length < 2 || dto.variantIds.length > 3) {
      throw new BadRequestException('Experiment must have 2-3 variants');
    }

    // Verify playbook exists and belongs to organization
    const playbook = await this._prismaService.playbook.findFirst({
      where: {
        id: dto.playbookId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!playbook) {
      throw new NotFoundException('Playbook not found');
    }

    // Verify all variants exist and belong to playbook
    const variants = await this._prismaService.playbookVariant.findMany({
      where: {
        id: { in: dto.variantIds },
        playbookId: dto.playbookId,
        deletedAt: null,
      },
    });

    if (variants.length !== dto.variantIds.length) {
      throw new BadRequestException('One or more variants not found');
    }

    // Create experiment with variants
    const experiment = await this._prismaService.experiment.create({
      data: {
        name: dto.name,
        playbookId: dto.playbookId,
        organizationId,
        successMetric: dto.successMetric,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: 'draft',
        variants: {
          create: dto.variantIds.map((variantId) => ({
            variantId,
          })),
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

    return experiment;
  }

  /**
   * Get experiments for organization with optional filters
   * AC6: List experiments with status and filters
   */
  async getExperiments(
    organizationId: string,
    filters?: ExperimentFilters
  ) {
    const where: any = {
      organizationId,
      deletedAt: null,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    const experiments = await this._prismaService.experiment.findMany({
      where,
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

    return experiments;
  }

  /**
   * Get experiment by ID with full details
   */
  async getExperimentById(experimentId: string, organizationId: string) {
    const experiment = await this._prismaService.experiment.findFirst({
      where: {
        id: experimentId,
        organizationId,
        deletedAt: null,
      },
      include: {
        playbook: true,
        variants: {
          include: {
            variant: true,
            trackedContent: {
              include: {
                content: true,
              },
            },
          },
        },
      },
    });

    if (!experiment) {
      throw new NotFoundException('Experiment not found');
    }

    return experiment;
  }

  /**
   * Start an experiment (change status to active)
   */
  async startExperiment(experimentId: string, organizationId: string) {
    const experiment = await this.getExperimentById(experimentId, organizationId);

    if (experiment.status !== 'draft') {
      throw new BadRequestException('Only draft experiments can be started');
    }

    const updatedExperiment = await this._prismaService.experiment.update({
      where: { id: experimentId },
      data: {
        status: 'active',
        startDate: experiment.startDate || new Date(),
      },
      include: {
        variants: {
          include: {
            variant: true,
          },
        },
      },
    });

    return updatedExperiment;
  }

  /**
   * Complete an experiment (change status to completed)
   * Used when experiment timeframe ends
   */
  async completeExperiment(experimentId: string, organizationId: string) {
    const experiment = await this.getExperimentById(experimentId, organizationId);

    if (experiment.status !== 'active') {
      throw new BadRequestException('Only active experiments can be completed');
    }

    const updatedExperiment = await this._prismaService.experiment.update({
      where: { id: experimentId },
      data: {
        status: 'completed',
        endDate: experiment.endDate || new Date(),
      },
      include: {
        variants: {
          include: {
            variant: true,
          },
        },
      },
    });

    return updatedExperiment;
  }

  /**
   * Delete an experiment (soft delete)
   */
  async deleteExperiment(experimentId: string, organizationId: string) {
    const experiment = await this.getExperimentById(experimentId, organizationId);

    await this._prismaService.experiment.update({
      where: { id: experimentId },
      data: {
        deletedAt: new Date(),
      },
    });

    return { success: true, message: 'Experiment deleted' };
  }
}
