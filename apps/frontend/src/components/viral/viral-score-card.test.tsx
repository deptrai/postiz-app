import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViralScoreCard, ScoreBreakdown } from './viral-score-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('ViralScoreCard', () => {
  const mockBreakdown: ScoreBreakdown = {
    hook: 80,
    caption: 70,
    hashtags: 65,
    timing: 85,
    format: 90,
  };

  it('renders overall score correctly', () => {
    render(
      <ViralScoreCard
        overallScore={75}
        breakdown={mockBreakdown}
        interpretation="Good potential"
      />
    );

    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('renders interpretation text', () => {
    render(
      <ViralScoreCard
        overallScore={85}
        breakdown={mockBreakdown}
        interpretation="High viral potential"
      />
    );

    expect(screen.getByText('High viral potential')).toBeInTheDocument();
  });

  it('renders all factor scores in breakdown', () => {
    render(
      <ViralScoreCard
        overallScore={75}
        breakdown={mockBreakdown}
        interpretation="Good potential"
      />
    );

    expect(screen.getByText('Hook')).toBeInTheDocument();
    expect(screen.getByText('Caption')).toBeInTheDocument();
    expect(screen.getByText('Hashtags')).toBeInTheDocument();
    expect(screen.getByText('Timing')).toBeInTheDocument();
    expect(screen.getByText('Format')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    const { container } = render(
      <ViralScoreCard
        overallScore={0}
        breakdown={{ hook: 0, caption: 0, hashtags: 0, timing: 0, format: 0 }}
        interpretation=""
        isLoading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays weight percentages for each factor', () => {
    render(
      <ViralScoreCard
        overallScore={75}
        breakdown={mockBreakdown}
        interpretation="Good potential"
      />
    );

    expect(screen.getByText('(25%)')).toBeInTheDocument(); // Hook
    expect(screen.getByText('(20%)')).toBeInTheDocument(); // Caption, Timing, Format
    expect(screen.getByText('(15%)')).toBeInTheDocument(); // Hashtags
  });
});
