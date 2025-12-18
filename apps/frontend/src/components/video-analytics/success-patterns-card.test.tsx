import React from 'react';
import { render, screen } from '@testing-library/react';
import { SuccessPatternsCard, SuccessPattern, ThumbnailPerformance } from './success-patterns-card';

const mockPatterns: SuccessPattern[] = [
  {
    element: 'human-face',
    elementLabel: 'Human Face',
    frequency: 80,
    avgCtrImpact: 3.5,
    description: 'Prominent human face with expression',
    examples: [
      { videoId: 'video-1', videoTitle: 'Best Video', ctr: 12 },
      { videoId: 'video-2', videoTitle: 'Great Video', ctr: 10 },
    ],
  },
  {
    element: 'bright-colors',
    elementLabel: 'Bright Colors',
    frequency: 65,
    avgCtrImpact: 2.1,
    description: 'Vibrant, eye-catching color palette',
    examples: [
      { videoId: 'video-1', videoTitle: 'Best Video', ctr: 12 },
    ],
  },
  {
    element: 'large-text',
    elementLabel: 'Large Text',
    frequency: 50,
    avgCtrImpact: 1.5,
    description: 'Bold, readable text overlay',
    examples: [],
  },
];

const mockTopPerformers: ThumbnailPerformance[] = [
  {
    videoId: 'video-1',
    videoTitle: 'Best Video Ever',
    style: 'face',
    impressions: 50000,
    clicks: 6000,
    ctr: 12,
    publishedAt: new Date('2024-01-15'),
  },
  {
    videoId: 'video-2',
    videoTitle: 'Another Great Video',
    style: 'text-heavy',
    impressions: 40000,
    clicks: 4000,
    ctr: 10,
    publishedAt: new Date('2024-01-10'),
  },
];

const mockInsights = [
  'Human Face appears in 80% of your top-performing thumbnails.',
  'Bright Colors have the highest CTR impact.',
];

describe('SuccessPatternsCard', () => {
  it('renders the heading', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Success Patterns')).toBeInTheDocument();
  });

  it('displays pattern labels', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Human Face')).toBeInTheDocument();
    expect(screen.getByText('Bright Colors')).toBeInTheDocument();
    expect(screen.getByText('Large Text')).toBeInTheDocument();
  });

  it('displays pattern descriptions', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Prominent human face with expression')).toBeInTheDocument();
  });

  it('displays CTR impact', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('+3.5% CTR')).toBeInTheDocument();
    expect(screen.getByText('+2.1% CTR')).toBeInTheDocument();
  });

  it('displays frequency percentages', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('65%')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('displays top performers section', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Top Performers')).toBeInTheDocument();
    expect(screen.getByText('Best Video Ever')).toBeInTheDocument();
    expect(screen.getByText('Another Great Video')).toBeInTheDocument();
  });

  it('displays insights', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText(/Human Face appears in 80%/)).toBeInTheDocument();
    expect(screen.getByText(/Bright Colors have the highest/)).toBeInTheDocument();
  });

  it('displays pattern icons', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('👤')).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
    expect(screen.getByText('📝')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <SuccessPatternsCard
        patterns={[]}
        topPerformers={[]}
        insights={[]}
        isLoading={true}
      />
    );
    expect(screen.queryByText('Success Patterns')).not.toBeInTheDocument();
  });

  it('displays search icon', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('🔍')).toBeInTheDocument();
  });

  it('displays impact legend', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('Pattern Analysis')).toBeInTheDocument();
    expect(screen.getByText(/High Impact/)).toBeInTheDocument();
  });

  it('displays performer rankings', () => {
    render(
      <SuccessPatternsCard
        patterns={mockPatterns}
        topPerformers={mockTopPerformers}
        insights={mockInsights}
      />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
