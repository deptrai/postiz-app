import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthController } from '@gitroom/backend/api/routes/auth.controller';
import { AuthService } from '@gitroom/backend/services/auth/auth.service';
import { UsersController } from '@gitroom/backend/api/routes/users.controller';
import { AuthMiddleware } from '@gitroom/backend/services/auth/auth.middleware';
import { StripeController } from '@gitroom/backend/api/routes/stripe.controller';
import { StripeService } from '@gitroom/nestjs-libraries/services/stripe.service';
import { StarsService } from '@gitroom/nestjs-libraries/database/prisma/stars/stars.service';
import { AnalyticsTrackingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tracking.service';
import { AnalyticsGroupService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-group.service';
import { AnalyticsDashboardService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-dashboard.service';
import { AnalyticsTaggingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-tagging.service';
import { AnalyticsTrendingService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-trending.service';
import { AnalyticsBestTimeService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-best-time.service';
import { AnalyticsDailyBriefService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-daily-brief.service';
import { AnalyticsExportService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-export.service';
import { AlertService } from '@gitroom/nestjs-libraries/database/prisma/alerts/alert.service';
import { AnalyticsController } from '@gitroom/backend/api/routes/analytics.controller';
import { PlaybooksController } from '@gitroom/backend/api/routes/playbooks.controller';
import { ExperimentsController } from '@gitroom/backend/api/routes/experiments.controller';
// Themes temporarily disabled - will implement in Story 7.x
// import { ThemesController } from '@gitroom/backend/api/routes/themes.controller';
import { PoliciesGuard } from '@gitroom/backend/services/auth/permissions/permissions.guard';
import { PermissionsService } from '@gitroom/backend/services/auth/permissions/permissions.service';
import { IntegrationsController } from '@gitroom/backend/api/routes/integrations.controller';
import { IntegrationManager } from '@gitroom/nestjs-libraries/integrations/integration.manager';
import { SettingsController } from '@gitroom/backend/api/routes/settings.controller';
import { PostsController } from '@gitroom/backend/api/routes/posts.controller';
import { MediaController } from '@gitroom/backend/api/routes/media.controller';
import { UploadModule } from '@gitroom/nestjs-libraries/upload/upload.module';
import { BillingController } from '@gitroom/backend/api/routes/billing.controller';
import { NotificationsController } from '@gitroom/backend/api/routes/notifications.controller';
import { MarketplaceController } from '@gitroom/backend/api/routes/marketplace.controller';
import { MessagesController } from '@gitroom/backend/api/routes/messages.controller';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { ExtractContentService } from '@gitroom/nestjs-libraries/openai/extract.content.service';
import { CodesService } from '@gitroom/nestjs-libraries/services/codes.service';
import { CopilotController } from '@gitroom/backend/api/routes/copilot.controller';
import { AgenciesController } from '@gitroom/backend/api/routes/agencies.controller';
import { PublicController } from '@gitroom/backend/api/routes/public.controller';
import { RootController } from '@gitroom/backend/api/routes/root.controller';
import { TrackService } from '@gitroom/nestjs-libraries/track/track.service';
import { ShortLinkService } from '@gitroom/nestjs-libraries/short-linking/short.link.service';
import { Nowpayments } from '@gitroom/nestjs-libraries/crypto/nowpayments';
import { WebhookController } from '@gitroom/backend/api/routes/webhooks.controller';
import { SignatureController } from '@gitroom/backend/api/routes/signature.controller';
import { AutopostController } from '@gitroom/backend/api/routes/autopost.controller';
import { SetsController } from '@gitroom/backend/api/routes/sets.controller';
import { ThirdPartyController } from '@gitroom/backend/api/routes/third-party.controller';
import { MonitorController } from '@gitroom/backend/api/routes/monitor.controller';
import { AlertsController } from '@gitroom/backend/api/routes/alerts.controller';
import { AlertNotificationService } from '@gitroom/nestjs-libraries/database/prisma/notifications/alert-notification.service';
import { AIController } from '@gitroom/backend/api/routes/ai.controller';
import { AIAssistantService } from '@gitroom/nestjs-libraries/database/prisma/ai/ai-assistant.service';

const authenticatedController = [
  UsersController,
  AnalyticsController,
  PlaybooksController,
  ExperimentsController,
  IntegrationsController,
  SettingsController,
  PostsController,
  MediaController,
  BillingController,
  NotificationsController,
  MarketplaceController,
  MessagesController,
  CopilotController,
  AgenciesController,
  WebhookController,
  SignatureController,
  AutopostController,
  SetsController,
  ThirdPartyController,
  AlertsController,
  AIController,
];
@Module({
  imports: [UploadModule],
  controllers: [
    RootController,
    StripeController,
    AuthController,
    PublicController,
    MonitorController,
    ...authenticatedController,
  ],
  providers: [
    AuthService,
    StripeService,
    StarsService,
    AnalyticsTrackingService,
    AnalyticsGroupService,
    AnalyticsDashboardService,
    AnalyticsTaggingService,
    AnalyticsTrendingService,
    AnalyticsBestTimeService,
    AnalyticsDailyBriefService,
    AnalyticsExportService,
    // Epic 4 services temporarily disabled
    // PlaybookService,
    // ExperimentService,
    // ThemeService,
    OpenaiService,
    ExtractContentService,
    AuthMiddleware,
    PoliciesGuard,
    PermissionsService,
    CodesService,
    IntegrationManager,
    TrackService,
    ShortLinkService,
    Nowpayments,
    AlertService,
    AlertNotificationService,
    AIAssistantService,
  ],
  get exports() {
    return [...this.imports, ...this.providers];
  },
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(...authenticatedController);
  }
}
