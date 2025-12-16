import { Injectable } from '@nestjs/common';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { AnalyticsDashboardService } from '@gitroom/nestjs-libraries/database/prisma/analytics/analytics-dashboard.service';

interface AnalyticsContext {
  totalReach: number;
  totalImpressions: number;
  totalReactions: number;
  totalComments: number;
  totalShares: number;
  engagementRate: number;
  topPlatforms: Array<{ platform: string; reach: number }>;
  recentTrends: Array<{ metric: string; change: number; period: string }>;
  timeRange: { start: Date; end: Date };
}

@Injectable()
export class AIAssistantService {
  constructor(
    private _prismaService: PrismaService,
    private _openaiService: OpenaiService,
    private _analyticsDashboardService: AnalyticsDashboardService
  ) {}

  async askQuestion(
    organizationId: string,
    userId: string,
    question: string,
    integrationId?: string
  ): Promise<{ answer: string; context: AnalyticsContext; tokensUsed: number }> {
    const context = await this.buildAnalyticsContext(organizationId, integrationId);
    
    const recentHistory = await this.getRecentConversations(organizationId, userId, 5);
    
    const answer = await this.queryLLM(question, context, recentHistory);
    
    const tokensUsed = this.estimateTokens(question, answer, context);
    
    await this._prismaService.aIConversation.create({
      data: {
        organizationId,
        userId,
        question,
        answer,
        context: context as any,
        tokensUsed,
      },
    });

    return { answer, context, tokensUsed };
  }

  async buildAnalyticsContext(
    organizationId: string,
    integrationId?: string
  ): Promise<AnalyticsContext> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      organizationId,
      date: {
        gte: thirtyDaysAgo,
        lte: now,
      },
      deletedAt: null,
    };

    if (integrationId) {
      whereClause.integrationId = integrationId;
    }

    const currentMetrics = await this._prismaService.analyticsDailyMetric.aggregate({
      where: whereClause,
      _sum: {
        reach: true,
        impressions: true,
        reactions: true,
        comments: true,
        shares: true,
        videoViews: true,
      },
    });

    const previousMetrics = await this._prismaService.analyticsDailyMetric.aggregate({
      where: {
        ...whereClause,
        date: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _sum: {
        reach: true,
        impressions: true,
        reactions: true,
        comments: true,
        shares: true,
      },
    });

    const platformMetrics = await this._prismaService.analyticsDailyMetric.findMany({
      where: whereClause,
      select: {
        reach: true,
        integration: {
          select: {
            providerIdentifier: true,
          },
        },
      },
    });

    const platformMap = new Map<string, number>();
    platformMetrics.forEach((metric) => {
      const platform = metric.integration.providerIdentifier || 'unknown';
      const current = platformMap.get(platform) || 0;
      platformMap.set(platform, current + (metric.reach || 0));
    });

    const topPlatforms = Array.from(platformMap.entries())
      .map(([platform, reach]) => ({ platform, reach }))
      .sort((a, b) => b.reach - a.reach)
      .slice(0, 5);

    const totalReach = currentMetrics._sum.reach || 0;
    const totalImpressions = currentMetrics._sum.impressions || 0;
    const totalReactions = currentMetrics._sum.reactions || 0;
    const totalComments = currentMetrics._sum.comments || 0;
    const totalShares = currentMetrics._sum.shares || 0;

    const engagementRate = totalImpressions > 0
      ? ((totalReactions + totalComments + totalShares) / totalImpressions) * 100
      : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const recentTrends = [
      {
        metric: 'reach',
        change: calculateChange(
          currentMetrics._sum.reach || 0,
          previousMetrics._sum.reach || 0
        ),
        period: 'last 30 days vs previous 30 days',
      },
      {
        metric: 'impressions',
        change: calculateChange(
          currentMetrics._sum.impressions || 0,
          previousMetrics._sum.impressions || 0
        ),
        period: 'last 30 days vs previous 30 days',
      },
      {
        metric: 'engagement',
        change: calculateChange(
          (currentMetrics._sum.reactions || 0) +
            (currentMetrics._sum.comments || 0) +
            (currentMetrics._sum.shares || 0),
          (previousMetrics._sum.reactions || 0) +
            (previousMetrics._sum.comments || 0) +
            (previousMetrics._sum.shares || 0)
        ),
        period: 'last 30 days vs previous 30 days',
      },
    ];

    return {
      totalReach,
      totalImpressions,
      totalReactions,
      totalComments,
      totalShares,
      engagementRate,
      topPlatforms,
      recentTrends,
      timeRange: { start: thirtyDaysAgo, end: now },
    };
  }

  private async queryLLM(
    question: string,
    context: AnalyticsContext,
    recentHistory: Array<{ question: string; answer: string }>
  ): Promise<string> {
    const systemPrompt = `You are an AI analytics assistant for a social media management platform. 
Your role is to help users understand their analytics data and provide actionable insights.

Current Analytics Context (Last 30 days):
- Total Reach: ${context.totalReach.toLocaleString()}
- Total Impressions: ${context.totalImpressions.toLocaleString()}
- Total Reactions: ${context.totalReactions.toLocaleString()}
- Total Comments: ${context.totalComments.toLocaleString()}
- Total Shares: ${context.totalShares.toLocaleString()}
- Engagement Rate: ${context.engagementRate.toFixed(2)}%

Top Platforms:
${context.topPlatforms.map((p) => `- ${p.platform}: ${p.reach.toLocaleString()} reach`).join('\n')}

Recent Trends:
${context.recentTrends.map((t) => `- ${t.metric}: ${t.change > 0 ? '+' : ''}${t.change.toFixed(1)}% (${t.period})`).join('\n')}

Instructions:
1. Answer questions based on the analytics data provided
2. Provide specific numbers and percentages
3. Explain possible causes for changes in metrics
4. Suggest actionable recommendations
5. Be concise but thorough
6. If the data doesn't support a conclusion, say so`;

    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    if (recentHistory.length > 0) {
      recentHistory.forEach((conv) => {
        messages.push(
          { role: 'user', content: conv.question },
          { role: 'assistant', content: conv.answer }
        );
      });
    }

    messages.push({
      role: 'user',
      content: question,
    });

    const openai = await import('openai');
    const client = new openai.default({
      apiKey: process.env.OPENAI_API_KEY || 'sk-proj-',
      ...(process.env.OPENAI_BASE_URL && { baseURL: process.env.OPENAI_BASE_URL }),
    });

    const completion = await client.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return completion.choices[0].message.content || 'I apologize, but I was unable to generate a response.';
  }

  private async getRecentConversations(
    organizationId: string,
    userId: string,
    limit: number = 5
  ) {
    const conversations = await this._prismaService.aIConversation.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        question: true,
        answer: true,
      },
    });

    return conversations.reverse();
  }

  async getConversationHistory(
    organizationId: string,
    userId: string,
    limit: number = 20
  ) {
    return this._prismaService.aIConversation.findMany({
      where: {
        organizationId,
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      select: {
        id: true,
        question: true,
        answer: true,
        tokensUsed: true,
        createdAt: true,
      },
    });
  }

  private estimateTokens(question: string, answer: string, context: AnalyticsContext): number {
    const questionTokens = Math.ceil(question.length / 4);
    const answerTokens = Math.ceil(answer.length / 4);
    const contextTokens = Math.ceil(JSON.stringify(context).length / 4);
    return questionTokens + answerTokens + contextTokens;
  }

  getSuggestedQuestions(context: AnalyticsContext): string[] {
    const suggestions: string[] = [
      'Why did my engagement rate change?',
      'Which platform is performing best?',
      'What caused the recent drop in reach?',
    ];

    if (context.recentTrends[0].change < -10) {
      suggestions.push('Why is my reach declining?');
    }

    if (context.recentTrends[2].change > 20) {
      suggestions.push('What\'s driving the increase in engagement?');
    }

    if (context.engagementRate < 2) {
      suggestions.push('How can I improve my engagement rate?');
    }

    return suggestions.slice(0, 5);
  }
}
