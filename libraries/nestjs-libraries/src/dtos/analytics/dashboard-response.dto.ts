import { ApiProperty } from '@nestjs/swagger';

export class KPISummaryDto {
  @ApiProperty({ description: 'Total number of posts in the period' })
  totalPosts: number;

  @ApiProperty({ description: 'Total unique reach' })
  totalReach: number;

  @ApiProperty({ description: 'Total impressions (may include duplicates)' })
  totalImpressions: number;

  @ApiProperty({ description: 'Total engagement (reactions + comments + shares)' })
  totalEngagement: number;

  @ApiProperty({ description: 'Engagement rate as percentage' })
  engagementRate: number;

  @ApiProperty({ description: 'Total video views' })
  totalVideoViews: number;

  @ApiProperty({ description: 'Average engagement per post' })
  averageEngagementPerPost: number;
}

export class TopContentItemDto {
  @ApiProperty({ description: 'Content ID' })
  id: string;

  @ApiProperty({ description: 'External content ID (Facebook post/reel ID)' })
  externalContentId: string;

  @ApiProperty({ description: 'Content type (post, reel)' })
  contentType: string;

  @ApiProperty({ description: 'Content caption/text', nullable: true })
  caption: string | null;

  @ApiProperty({ description: 'Published date' })
  publishedAt: Date;

  @ApiProperty({ description: 'Integration ID' })
  integrationId: string;

  @ApiProperty({ description: 'Total reach' })
  totalReach: number;

  @ApiProperty({ description: 'Total engagement' })
  totalEngagement: number;

  @ApiProperty({ description: 'Engagement rate as percentage' })
  engagementRate: number;

  @ApiProperty({ description: 'Total reactions' })
  reactions: number;

  @ApiProperty({ description: 'Total comments' })
  comments: number;

  @ApiProperty({ description: 'Total shares' })
  shares: number;

  @ApiProperty({ description: 'Total video views' })
  videoViews: number;
}

export class DashboardKPIsResponseDto {
  @ApiProperty({ type: KPISummaryDto })
  kpis: KPISummaryDto;

  @ApiProperty({ description: 'Filters applied' })
  filters: {
    startDate: string;
    endDate: string;
    groupId?: string;
    integrationIds?: string[];
    format?: string;
  };
}

export class DashboardTopContentResponseDto {
  @ApiProperty({ type: [TopContentItemDto] })
  topContent: TopContentItemDto[];

  @ApiProperty({ description: 'Number of items returned' })
  count: number;

  @ApiProperty({ description: 'Filters applied' })
  filters: {
    startDate: string;
    endDate: string;
    groupId?: string;
    integrationIds?: string[];
    format?: string;
    limit: number;
  };
}
