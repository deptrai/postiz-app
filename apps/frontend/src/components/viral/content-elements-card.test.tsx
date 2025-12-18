import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentElementsCard, ContentElementsAnalysis } from './content-elements-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('ContentElementsCard', () => {
  const mockAnalysis: ContentElementsAnalysis = {
    caption: {
      length: 85,
      lengthCategory: 'medium',
      tone: 'casual',
      toneConfidence: 75,
      keywords: [
        { word: 'amazing', count: 2, importance: 100 },
        { word: 'tips', count: 1, importance: 100 },
      ],
      emojiUsage: {
        count: 3,
        emojis: ['🔥', '💪', '🚀'],
        placement: 'throughout',
      },
      readability: 80,
      suggestions: [
        'Consider adding more context',
        'Good emoji usage',
      ],
    },
    hashtags: {
      count: 7,
      optimal: true,
      hashtags: [
        { tag: 'viral', trending: true, relevanceScore: 90, reach: 'high' },
        { tag: 'tips', trending: false, relevanceScore: 70, reach: 'medium' },
      ],
      overallScore: 85,
      suggestions: ['Good hashtag strategy'],
    },
    format: {
      format: 'reel',
      formatScore: 90,
      videoLength: {
        seconds: 25,
        optimal: true,
        recommendation: 'Perfect length for maximum engagement!',
      },
      performanceInsights: {
        reachPotential: 'high',
        engagementPotential: 'high',
        recommendation: 'Reels have the highest organic reach',
      },
      suggestions: [],
    },
    cta: {
      detected: true,
      types: [
        {
          type: 'engagement',
          text: 'Comment below',
          effectiveness: 85,
          position: 'end',
        },
        {
          type: 'save',
          text: 'Save this',
          effectiveness: 78,
          position: 'end',
        },
      ],
      overallEffectiveness: 82,
      suggestions: [],
    },
    overallScore: 87,
    topStrengths: [
      'Easy to read caption',
      'Good emoji usage',
      'Optimal number of hashtags',
      'Using trending hashtags',
      'Great format choice (reel)',
    ],
    areasToImprove: [],
  };

  it('renders overall score', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('87')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('displays top strengths', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('Easy to read caption')).toBeInTheDocument();
    expect(screen.getByText('Good emoji usage')).toBeInTheDocument();
    expect(screen.getByText('Optimal number of hashtags')).toBeInTheDocument();
  });

  it('displays caption analysis section', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('Caption Analysis')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
    expect(screen.getByText('casual')).toBeInTheDocument();
  });

  it('displays hashtag analysis section', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('Hashtag Analysis')).toBeInTheDocument();
    expect(screen.getByText('7 hashtags')).toBeInTheDocument();
  });

  it('displays format analysis section', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('Format Analysis')).toBeInTheDocument();
    expect(screen.getByText('reel')).toBeInTheDocument();
  });

  it('displays CTA analysis section', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('Call-to-Action')).toBeInTheDocument();
  });

  it('shows CTA detected status', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/2 CTAs detected/)).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    const { container } = render(
      <ContentElementsCard
        analysis={mockAnalysis}
        isLoading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays areas to improve when present', () => {
    const analysisWithImprovements = {
      ...mockAnalysis,
      areasToImprove: ['Add a clear call-to-action', 'Improve caption readability'],
    };

    render(<ContentElementsCard analysis={analysisWithImprovements} />);

    expect(screen.getByText('Add a clear call-to-action')).toBeInTheDocument();
    expect(screen.getByText('Improve caption readability')).toBeInTheDocument();
  });

  it('shows emoji count', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/3 emojis/)).toBeInTheDocument();
  });

  it('displays readability score', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/Readability: 80/)).toBeInTheDocument();
  });

  it('shows optimal hashtag status', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/Optimal/)).toBeInTheDocument();
  });

  it('displays format score', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('shows performance insights', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/high/)).toBeInTheDocument();
  });

  it('displays CTA effectiveness', () => {
    render(<ContentElementsCard analysis={mockAnalysis} />);

    expect(screen.getByText(/82/)).toBeInTheDocument();
  });
});
