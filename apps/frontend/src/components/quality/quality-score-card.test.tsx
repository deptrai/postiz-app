import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QualityScoreCard } from './quality-score-card';

jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('QualityScoreCard', () => {
  const defaultProps = {
    overallScore: 75,
    breakdown: {
      engagementScore: 80,
      watchTimeScore: 70,
      complianceScore: 85,
      consistencyScore: 60,
    },
    interpretation: 'Good quality',
    improvements: [],
  };

  it('renders overall score correctly', () => {
    render(<QualityScoreCard {...defaultProps} />);
    
    expect(screen.getByText('75')).toBeInTheDocument();
    expect(screen.getByText('/100')).toBeInTheDocument();
  });

  it('renders interpretation badge', () => {
    render(<QualityScoreCard {...defaultProps} />);
    
    expect(screen.getByText('Good quality')).toBeInTheDocument();
  });

  it('renders all factor scores', () => {
    render(<QualityScoreCard {...defaultProps} />);
    
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('renders factor labels', () => {
    render(<QualityScoreCard {...defaultProps} />);
    
    expect(screen.getByText('Engagement')).toBeInTheDocument();
    expect(screen.getByText('Watch Time')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
    expect(screen.getByText('Consistency')).toBeInTheDocument();
  });

  it('renders weight percentages', () => {
    render(<QualityScoreCard {...defaultProps} />);
    
    expect(screen.getByText('(35%)')).toBeInTheDocument();
    expect(screen.getByText('(25%)')).toBeInTheDocument();
    expect(screen.getByText('(15%)')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<QualityScoreCard {...defaultProps} isLoading={true} />);
    
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('renders improvement suggestions when provided', () => {
    const propsWithImprovements = {
      ...defaultProps,
      improvements: [
        {
          factor: 'engagement' as const,
          currentScore: 40,
          priority: 'high' as const,
          suggestion: 'Improve engagement by asking questions',
        },
      ],
    };

    render(<QualityScoreCard {...propsWithImprovements} />);
    
    expect(screen.getByText('Areas to Improve')).toBeInTheDocument();
    expect(screen.getByText('Improve engagement by asking questions')).toBeInTheDocument();
  });

  it('applies correct color for excellent score (>=80)', () => {
    render(<QualityScoreCard {...defaultProps} overallScore={85} />);
    
    const scoreElement = screen.getByText('85');
    expect(scoreElement).toHaveClass('text-green-400');
  });

  it('applies correct color for good score (60-79)', () => {
    render(<QualityScoreCard {...defaultProps} overallScore={65} />);
    
    const scoreElement = screen.getByText('65');
    expect(scoreElement).toHaveClass('text-yellow-400');
  });

  it('applies correct color for average score (40-59)', () => {
    render(<QualityScoreCard {...defaultProps} overallScore={45} />);
    
    const scoreElement = screen.getByText('45');
    expect(scoreElement).toHaveClass('text-orange-400');
  });

  it('applies correct color for poor score (<40)', () => {
    render(<QualityScoreCard {...defaultProps} overallScore={30} />);
    
    const scoreElement = screen.getByText('30');
    expect(scoreElement).toHaveClass('text-red-400');
  });
});
