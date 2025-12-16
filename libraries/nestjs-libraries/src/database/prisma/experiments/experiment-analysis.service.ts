import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExperimentAnalysisService {
  constructor(private readonly _prismaService: PrismaService) {}

  /**
   * Get experiment results with win rates
   * AC4: Show win rate, statistical comparison, winner
   */
  async getExperimentResults(experimentId: string, organizationId: string) {
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

    // Calculate win rates for each variant
    const variantsWithWinRates = await this.calculateWinRates(experiment);

    // Check statistical significance
    const significance = this.checkStatisticalSignificance(variantsWithWinRates);

    // Determine winner
    const winner = this.determineWinner(variantsWithWinRates, significance);

    return {
      experiment,
      variants: variantsWithWinRates,
      significance,
      winner,
    };
  }

  /**
   * Calculate win rates for all variants in an experiment
   */
  private async calculateWinRates(experiment: any) {
    const variants = experiment.variants;
    const successMetric = experiment.successMetric;

    // Calculate total metric value across all variants
    let totalMetricValue = 0;

    for (const variant of variants) {
      let metricValue = 0;

      if (successMetric === 'reach') {
        metricValue = variant.totalReach;
      } else if (successMetric === 'engagement') {
        metricValue = variant.avgEngagementRate;
      } else if (successMetric === 'combined') {
        // Combined: normalize and average both metrics
        metricValue = (variant.totalReach / 1000) + (variant.avgEngagementRate * 10);
      }

      totalMetricValue += metricValue;
    }

    // Calculate win rate for each variant
    const variantsWithWinRates = variants.map((variant: any) => {
      let metricValue = 0;

      if (successMetric === 'reach') {
        metricValue = variant.totalReach;
      } else if (successMetric === 'engagement') {
        metricValue = variant.avgEngagementRate;
      } else if (successMetric === 'combined') {
        metricValue = (variant.totalReach / 1000) + (variant.avgEngagementRate * 10);
      }

      const winRate = totalMetricValue > 0 ? (metricValue / totalMetricValue) * 100 : 0;

      return {
        ...variant,
        metricValue,
        winRate,
      };
    });

    // Update win rates in database
    for (const variant of variantsWithWinRates) {
      await this._prismaService.experimentVariant.update({
        where: { id: variant.id },
        data: { winRate: variant.winRate },
      });
    }

    return variantsWithWinRates;
  }

  /**
   * Check statistical significance
   * AC4: Statistical comparison
   * Simple implementation: min 5 content items per variant, >10% difference = significant
   */
  private checkStatisticalSignificance(variants: any[]) {
    // Check minimum content count requirement
    const minContentCount = 5;
    const allVariantsHaveEnoughData = variants.every(v => v.contentCount >= minContentCount);

    if (!allVariantsHaveEnoughData) {
      return {
        isSignificant: false,
        reason: 'Insufficient data: each variant needs at least 5 content items',
        minContentCount,
      };
    }

    // Calculate max difference in win rates
    const winRates = variants.map(v => v.winRate);
    const maxWinRate = Math.max(...winRates);
    const minWinRate = Math.min(...winRates);
    const difference = maxWinRate - minWinRate;

    // Threshold: 10% difference is considered significant
    const significanceThreshold = 10;
    const isSignificant = difference >= significanceThreshold;

    return {
      isSignificant,
      difference,
      significanceThreshold,
      reason: isSignificant 
        ? `Difference of ${difference.toFixed(2)}% is statistically significant`
        : `Difference of ${difference.toFixed(2)}% is not statistically significant (threshold: ${significanceThreshold}%)`,
    };
  }

  /**
   * Determine experiment winner
   * AC4: Clear winner declaration
   */
  private determineWinner(variants: any[], significance: any) {
    if (!significance.isSignificant) {
      return null;
    }

    // Find variant with highest win rate
    const winner = variants.reduce((max, variant) => 
      variant.winRate > max.winRate ? variant : max
    , variants[0]);

    return {
      variantId: winner.variantId,
      variantName: winner.variant.name,
      winRate: winner.winRate,
      metricValue: winner.metricValue,
    };
  }

  /**
   * Update playbook with winning variant formula
   * AC5: Update playbook score when winner confirmed
   */
  async updatePlaybookWithWinner(experimentId: string, organizationId: string) {
    const results = await this.getExperimentResults(experimentId, organizationId);

    if (!results.winner) {
      throw new BadRequestException('No clear winner: results are not statistically significant');
    }

    const experiment = results.experiment;
    const winner = results.winner;

    // Get winning variant
    const winningVariant = await this._prismaService.playbookVariant.findUnique({
      where: { id: winner.variantId },
    });

    if (!winningVariant) {
      throw new NotFoundException('Winning variant not found');
    }

    // Update playbook with winning variant's recipe
    // Increase consistency score by 5% to reflect proven formula
    const currentConsistency = experiment.playbook.consistencyScore || 0;
    const newConsistency = Math.min(100, currentConsistency + 5);

    await this._prismaService.playbook.update({
      where: { id: experiment.playbookId },
      data: {
        recipe: winningVariant.recipe,
        consistencyScore: newConsistency,
      },
    });

    // Update experiment with winner
    await this._prismaService.experiment.update({
      where: { id: experimentId },
      data: {
        winnerId: winner.variantId,
      },
    });

    return {
      success: true,
      message: 'Playbook updated with winning variant',
      winner,
      newConsistencyScore: newConsistency,
    };
  }

  /**
   * Get experiment comparison data for visualization
   */
  async getExperimentComparison(experimentId: string, organizationId: string) {
    const results = await this.getExperimentResults(experimentId, organizationId);

    return {
      experimentName: results.experiment.name,
      successMetric: results.experiment.successMetric,
      variants: results.variants.map((v: any) => ({
        name: v.variant.name,
        type: v.variant.type,
        contentCount: v.contentCount,
        totalReach: v.totalReach,
        avgEngagementRate: v.avgEngagementRate,
        winRate: v.winRate,
      })),
      winner: results.winner,
      significance: results.significance,
    };
  }
}
