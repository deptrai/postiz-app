import { Injectable } from '@nestjs/common';
import { MetricGap } from './monetization.service';

export interface Recommendation {
  id: string;
  type: 'content' | 'frequency' | 'engagement' | 'timing';
  title: string;
  description: string;
  targetMetric: string;
  expectedImpact: {
    metric: string;
    estimatedIncrease: string;
    timeframe: string;
  };
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export interface RecommendationResponse {
  recommendations: Recommendation[];
  totalRecommendations: number;
  actionableCount: number;
}

@Injectable()
export class RecommendationEngine {
  async generateRecommendations(
    gaps: MetricGap[],
    currentGrowthRate: number
  ): Promise<RecommendationResponse> {
    const recommendations: Recommendation[] = [];

    // Group gaps by metric type
    const followerGaps = gaps.filter(g => g.metric === 'followers');
    const watchTimeGaps = gaps.filter(g => 
      g.metric === 'viewedMinutes' || g.metric === 'watchedMinutes' || g.metric === 'oneMinuteViews'
    );
    const engagementGaps = gaps.filter(g => g.metric === 'engagements');
    const videoGaps = gaps.filter(g => g.metric === 'videosCount');

    // Generate content type recommendations
    if (watchTimeGaps.length > 0) {
      recommendations.push(this.generateReelsRecommendation(watchTimeGaps));
      recommendations.push(this.generateLongFormVideoRecommendation(watchTimeGaps));
    }

    // Generate frequency recommendations
    if (followerGaps.length > 0) {
      recommendations.push(this.generatePostingFrequencyRecommendation(followerGaps, currentGrowthRate));
    }

    // Generate engagement recommendations
    if (engagementGaps.length > 0) {
      recommendations.push(this.generateEngagementRecommendation(engagementGaps));
      recommendations.push(this.generateCTARecommendation(engagementGaps));
    }

    // Generate video count recommendations
    if (videoGaps.length > 0) {
      recommendations.push(this.generateVideoCountRecommendation(videoGaps));
    }

    // Generate timing recommendations (always beneficial)
    if (gaps.length > 0) {
      recommendations.push(this.generateTimingRecommendation());
    }

    // Sort by priority and expected impact
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const actionableCount = recommendations.filter(r => r.actionable).length;

    return {
      recommendations,
      totalRecommendations: recommendations.length,
      actionableCount,
    };
  }

  private generateReelsRecommendation(gaps: MetricGap[]): Recommendation {
    const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
    const estimatedIncrease = Math.round(avgGap * 0.2); // 20% improvement expected

    return {
      id: 'rec-reels-content',
      type: 'content',
      title: 'Post More Reels',
      description: 'Reels generate significantly higher watch time. Aim for 3-5 Reels per week to boost your viewed minutes.',
      targetMetric: 'viewedMinutes',
      expectedImpact: {
        metric: 'Viewed Minutes',
        estimatedIncrease: `+${this.formatNumber(estimatedIncrease)} minutes/month`,
        timeframe: '30 days',
      },
      actionable: true,
      priority: gaps[0]?.priority || 'medium',
    };
  }

  private generateLongFormVideoRecommendation(gaps: MetricGap[]): Recommendation {
    const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
    const estimatedIncrease = Math.round(avgGap * 0.15);

    return {
      id: 'rec-longform-content',
      type: 'content',
      title: 'Create Longer Videos',
      description: 'Videos over 3 minutes duration count toward watch time requirements. Focus on engaging content that keeps viewers watching.',
      targetMetric: 'watchedMinutes',
      expectedImpact: {
        metric: 'Watch Time',
        estimatedIncrease: `+${this.formatNumber(estimatedIncrease)} minutes/month`,
        timeframe: '30 days',
      },
      actionable: true,
      priority: 'medium',
    };
  }

  private generatePostingFrequencyRecommendation(
    gaps: MetricGap[],
    currentGrowthRate: number
  ): Recommendation {
    const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
    const estimatedIncrease = Math.round(avgGap * 0.3); // 30% improvement with 2x frequency

    return {
      id: 'rec-posting-frequency',
      type: 'frequency',
      title: 'Increase Posting Frequency',
      description: 'Post consistently 5-7 times per week to accelerate follower growth. Consistency is key for algorithm visibility.',
      targetMetric: 'followers',
      expectedImpact: {
        metric: 'Followers',
        estimatedIncrease: `+${this.formatNumber(estimatedIncrease)} followers/month`,
        timeframe: '30 days',
      },
      actionable: true,
      priority: gaps[0]?.priority || 'high',
    };
  }

  private generateEngagementRecommendation(gaps: MetricGap[]): Recommendation {
    const avgGap = gaps.reduce((sum, g) => sum + g.gap, 0) / gaps.length;
    const estimatedIncrease = Math.round(avgGap * 0.15);

    return {
      id: 'rec-engagement-tactics',
      type: 'engagement',
      title: 'Boost Engagement with Interactive Content',
      description: 'Use polls, questions, and trending sounds in your content. Respond to comments within the first hour to increase engagement.',
      targetMetric: 'engagements',
      expectedImpact: {
        metric: 'Engagement',
        estimatedIncrease: `+${this.formatNumber(estimatedIncrease)} interactions/month`,
        timeframe: '30 days',
      },
      actionable: true,
      priority: 'medium',
    };
  }

  private generateCTARecommendation(gaps: MetricGap[]): Recommendation {
    return {
      id: 'rec-cta-usage',
      type: 'engagement',
      title: 'Add Clear Calls-to-Action',
      description: 'Include CTAs like "Follow for more", "Comment your thoughts", or "Share with friends" to drive engagement.',
      targetMetric: 'engagements',
      expectedImpact: {
        metric: 'Engagement Rate',
        estimatedIncrease: '+10-15%',
        timeframe: '14 days',
      },
      actionable: true,
      priority: 'medium',
    };
  }

  private generateVideoCountRecommendation(gaps: MetricGap[]): Recommendation {
    const gap = gaps[0];
    
    return {
      id: 'rec-video-count',
      type: 'content',
      title: 'Increase Video Output',
      description: `You need ${gap.gap} more videos to meet the minimum requirement. Focus on creating quality video content consistently.`,
      targetMetric: 'videosCount',
      expectedImpact: {
        metric: 'Videos',
        estimatedIncrease: `${gap.gap} videos needed`,
        timeframe: '30 days',
      },
      actionable: true,
      priority: gap.priority,
    };
  }

  private generateTimingRecommendation(): Recommendation {
    return {
      id: 'rec-optimal-timing',
      type: 'timing',
      title: 'Post During Peak Hours',
      description: 'Post when your audience is most active (typically 6-9 PM on weekdays). Check your analytics for your specific peak times.',
      targetMetric: 'reach',
      expectedImpact: {
        metric: 'Reach',
        estimatedIncrease: '+25-40%',
        timeframe: 'Immediate',
      },
      actionable: true,
      priority: 'low',
    };
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }
}
