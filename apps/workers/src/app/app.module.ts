import { Module } from '@nestjs/common';

import { DatabaseModule } from '@gitroom/nestjs-libraries/database/prisma/database.module';
import { PostsController } from '@gitroom/workers/app/posts.controller';
import { BullMqModule } from '@gitroom/nestjs-libraries/bull-mq-transport-new/bull.mq.module';
import { PlugsController } from '@gitroom/workers/app/plugs.controller';
import { AnalyticsController } from '@gitroom/workers/app/analytics.controller';
import { AnalyticsContentService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-content.service';
import { SentryModule } from '@sentry/nestjs/setup';
import { FILTER } from '@gitroom/nestjs-libraries/sentry/sentry.exception';

@Module({
  imports: [BullMqModule, DatabaseModule, SentryModule.forRoot()],
  controllers: [PostsController, AnalyticsController],
  providers: [FILTER, AnalyticsContentService],
})
export class AppModule {}
