import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma.service';
import { MonetizationAlertService } from './monetization-alert.service';

@Injectable()
export class MonetizationAlertJobService {
  private readonly logger = new Logger(MonetizationAlertJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly monetizationAlertService: MonetizationAlertService,
  ) {}

  /**
   * Run daily at 9 AM to check monetization milestones for all organizations
   */
  @Cron('0 9 * * *', {
    name: 'monetization-milestone-check',
    timeZone: 'UTC',
  })
  async checkMonetizationMilestones() {
    this.logger.log('Starting daily monetization milestone check');

    try {
      // Get all active organizations
      const organizations = await this.prisma.organization.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      this.logger.log(`Checking ${organizations.length} organizations`);

      let processedCount = 0;
      let errorCount = 0;

      for (const org of organizations) {
        try {
          await this.monetizationAlertService.checkMonetizationMilestones(org.id);
          processedCount++;
        } catch (error) {
          errorCount++;
          this.logger.error(`Failed to check milestones for org ${org.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      this.logger.log(`Milestone check complete: ${processedCount} successful, ${errorCount} errors`);
    } catch (error) {
      this.logger.error(`Failed to run monetization milestone check: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Manual trigger for testing or immediate checks
   */
  async triggerManualCheck(organizationId?: string) {
    this.logger.log(`Manual trigger for monetization check${organizationId ? ` for org: ${organizationId}` : ''}`);

    if (organizationId) {
      await this.monetizationAlertService.checkMonetizationMilestones(organizationId);
    } else {
      await this.checkMonetizationMilestones();
    }
  }
}
