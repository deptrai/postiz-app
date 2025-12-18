import React from 'react';
import { render, screen } from '@testing-library/react';
import { HashtagAnalysis } from './hashtag-analysis';
import { HashtagAnalysis as HashtagAnalysisType } from './content-elements-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('HashtagAnalysis', () => {
  const mockAnalysis: HashtagAnalysisType = {
    count: 7,
    optimal: true,
    hashtags: [
      { tag: 'viral', trending: true, relevanceScore: 90, reach: 'high' },
      { tag: 'trending', trending: true, relevanceScore: 88, reach: 'high' },
      { tag: 'tips', trending: false, relevanceScore: 70, reach: 'medium' },
      { tag: 'growth', trending: false, relevanceScore: 68, reach: 'medium' },
      { tag: 'myniche', trending: false, relevanceScore: 65, reach: 'low' },
    ],
    overallScore: 85,
    suggestions: [
      'Good hashtag strategy',
      'Mix of high and low reach hashtags',
    ],
  };

  it('renders hashtag analysis heading', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Hashtag Analysis')).toBeInTheDocument();
  });

  it('displays overall score', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('shows hashtag count', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('7 hashtags')).toBeInTheDocument();
  });

  it('displays optimal status', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Optimal')).toBeInTheDocument();
  });

  it('shows trending count', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText(/2 trending/)).toBeInTheDocument();
  });

  it('renders all hashtags', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('#viral')).toBeInTheDocument();
    expect(screen.getByText('#trending')).toBeInTheDocument();
    expect(screen.getByText('#tips')).toBeInTheDocument();
    expect(screen.getByText('#growth')).toBeInTheDocument();
    expect(screen.getByText('#myniche')).toBeInTheDocument();
  });

  it('shows trending badges', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    const trendingBadges = screen.getAllByText('Trending');
    expect(trendingBadges.length).toBeGreaterThan(0);
  });

  it('displays reach levels', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('shows relevance scores', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
  });

  it('renders suggestions', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Good hashtag strategy')).toBeInTheDocument();
    expect(screen.getByText('Mix of high and low reach hashtags')).toBeInTheDocument();
  });

  it('marks non-optimal count', () => {
    const nonOptimalAnalysis = {
      ...mockAnalysis,
      count: 2,
      optimal: false,
    };

    render(<HashtagAnalysis analysis={nonOptimalAnalysis} />);

    expect(screen.getByText('2 hashtags')).toBeInTheDocument();
    expect(screen.queryByText('Optimal')).not.toBeInTheDocument();
  });

  it('shows high reach count', () => {
    render(<HashtagAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText(/2 high reach/)).toBeInTheDocument();
  });

  it('handles no hashtags', () => {
    const noHashtagsAnalysis = {
      ...mockAnalysis,
      count: 0,
      hashtags: [],
      optimal: false,
    };

    render(<HashtagAnalysis analysis={noHashtagsAnalysis} />);

    expect(screen.getByText('0 hashtags')).toBeInTheDocument();
  });

  it('handles no trending hashtags', () => {
    const noTrendingAnalysis = {
      ...mockAnalysis,
      hashtags: mockAnalysis.hashtags.map(h => ({ ...h, trending: false })),
    };

    render(<HashtagAnalysis analysis={noTrendingAnalysis} />);

    expect(screen.getByText(/0 trending/)).toBeInTheDocument();
  });
});
