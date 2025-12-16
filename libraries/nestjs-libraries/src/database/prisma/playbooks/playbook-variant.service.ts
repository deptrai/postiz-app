import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

interface PlaybookRecipe {
  format: string;
  captionBucket: {
    hooks: string[];
    ctaPatterns: string[];
  };
  hashtagBucket: string[];
  timeBucket: {
    bestHours: number[];
    bestDays: number[];
  };
}

/**
 * Service for managing Playbook Variants
 * Generates 3-5 variants per playbook with different hooks, times, and hashtags
 */
@Injectable()
export class PlaybookVariantService {
  constructor(private readonly _prismaService: PrismaService) {}

  /**
   * Get all variants for a playbook
   */
  async getVariants(playbookId: string, organizationId: string) {
    return this._prismaService.playbookVariant.findMany({
      where: {
        playbookId,
        playbook: {
          organizationId,
        },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get a single variant by ID
   */
  async getVariantById(variantId: string, organizationId: string) {
    return this._prismaService.playbookVariant.findFirst({
      where: {
        id: variantId,
        playbook: {
          organizationId,
        },
        deletedAt: null,
      },
      include: {
        playbook: true,
      },
    });
  }

  /**
   * Generate 3-5 variants for a playbook
   * Variants cover different dimensions: hooks, times, hashtags
   */
  async generateVariants(playbookId: string, organizationId: string) {
    // Get base playbook
    const playbook = await this._prismaService.playbook.findFirst({
      where: {
        id: playbookId,
        organizationId,
        deletedAt: null,
      },
    });

    if (!playbook) {
      throw new Error('Playbook not found');
    }

    const baseRecipe = playbook.recipe as any as PlaybookRecipe;

    // Delete existing variants before regenerating
    await this._prismaService.playbookVariant.updateMany({
      where: {
        playbookId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // Generate variants
    const variants: any[] = [];

    // 1. Hook Variation - Direct statement style
    const hookVariant1 = this.generateHookVariant(
      baseRecipe,
      'direct',
      'Hook Variation A - Direct Statements'
    );
    variants.push({
      playbookId,
      name: 'Hook Variation A',
      type: 'hook',
      recipe: hookVariant1.recipe,
      description: hookVariant1.description,
    });

    // 2. Hook Variation - Question-based style
    const hookVariant2 = this.generateHookVariant(
      baseRecipe,
      'question',
      'Hook Variation B - Question-Based'
    );
    variants.push({
      playbookId,
      name: 'Hook Variation B',
      type: 'hook',
      recipe: hookVariant2.recipe,
      description: hookVariant2.description,
    });

    // 3. Time Variation - Morning slot
    const timeVariant1 = this.generateTimeVariant(
      baseRecipe,
      'morning',
      'Time Variation A - Morning Slot'
    );
    variants.push({
      playbookId,
      name: 'Time Variation A',
      type: 'time',
      recipe: timeVariant1.recipe,
      description: timeVariant1.description,
    });

    // 4. Time Variation - Evening slot
    const timeVariant2 = this.generateTimeVariant(
      baseRecipe,
      'evening',
      'Time Variation B - Evening Slot'
    );
    variants.push({
      playbookId,
      name: 'Time Variation B',
      type: 'time',
      recipe: timeVariant2.recipe,
      description: timeVariant2.description,
    });

    // 5. Hashtag Variation - High-volume focused
    const hashtagVariant = this.generateHashtagVariant(
      baseRecipe,
      'high-volume',
      'Hashtag Variation - High Volume'
    );
    variants.push({
      playbookId,
      name: 'Hashtag Variation',
      type: 'hashtag',
      recipe: hashtagVariant.recipe,
      description: hashtagVariant.description,
    });

    // Create variants in database (limit to 5)
    const createdVariants = await Promise.all(
      variants.slice(0, 5).map((variant) =>
        this._prismaService.playbookVariant.create({
          data: variant,
        })
      )
    );

    return createdVariants;
  }

  /**
   * Generate hook variation
   */
  private generateHookVariant(
    baseRecipe: PlaybookRecipe,
    style: 'direct' | 'question',
    description: string
  ) {
    const hooks = [...baseRecipe.captionBucket.hooks];
    
    // Transform hooks based on style
    const transformedHooks = hooks.map((hook) => {
      if (style === 'direct') {
        // Convert to direct statement
        return hook
          .replace(/\?/g, '.')
          .replace(/^(How|What|Why|When|Where|Who) /i, '')
          .replace(/^Do you /i, 'You ')
          .replace(/^Are you /i, 'You are ');
      } else {
        // Convert to question
        if (!hook.includes('?')) {
          return `How can ${hook.toLowerCase()}?`;
        }
        return hook;
      }
    });

    return {
      recipe: {
        ...baseRecipe,
        captionBucket: {
          ...baseRecipe.captionBucket,
          hooks: transformedHooks,
        },
      },
      description: `${description}. Uses ${style === 'direct' ? 'direct statements' : 'question-based'} hooks to engage audience differently.`,
    };
  }

  /**
   * Generate time variation
   */
  private generateTimeVariant(
    baseRecipe: PlaybookRecipe,
    slot: 'morning' | 'evening',
    description: string
  ) {
    const bestHours = slot === 'morning' 
      ? [6, 7, 8, 9, 10]  // Morning: 6am-10am
      : [18, 19, 20, 21, 22]; // Evening: 6pm-10pm

    return {
      recipe: {
        ...baseRecipe,
        timeBucket: {
          ...baseRecipe.timeBucket,
          bestHours: bestHours.slice(0, 3), // Top 3 hours
        },
      },
      description: `${description}. Optimized for ${slot} engagement when audience is most active during ${slot === 'morning' ? '6am-10am' : '6pm-10pm'}.`,
    };
  }

  /**
   * Generate hashtag variation
   */
  private generateHashtagVariant(
    baseRecipe: PlaybookRecipe,
    strategy: 'high-volume' | 'niche',
    description: string
  ) {
    const hashtags = [...baseRecipe.hashtagBucket];
    
    // For high-volume: prioritize first half (assuming sorted by reach)
    // For niche: prioritize second half (more specific tags)
    const selectedHashtags = strategy === 'high-volume'
      ? hashtags.slice(0, Math.ceil(hashtags.length / 2))
      : hashtags.slice(Math.floor(hashtags.length / 2));

    return {
      recipe: {
        ...baseRecipe,
        hashtagBucket: selectedHashtags.slice(0, 8), // Limit to 8 hashtags
      },
      description: `${description}. Uses ${strategy === 'high-volume' ? 'popular, high-reach' : 'niche, targeted'} hashtags to reach ${strategy === 'high-volume' ? 'broader' : 'specific'} audience.`,
    };
  }

  /**
   * Delete a variant
   */
  async deleteVariant(variantId: string, organizationId: string) {
    const variant = await this.getVariantById(variantId, organizationId);
    
    if (!variant) {
      throw new Error('Variant not found');
    }

    await this._prismaService.playbookVariant.update({
      where: { id: variantId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
