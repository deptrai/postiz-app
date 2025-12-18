import React from 'react';
import { render, screen } from '@testing-library/react';
import { OptimalLengthCard, OptimalLengthRecommendation } from './optimal-length-card';

const mockRecommendation: OptimalLengthRecommendation = {
  format: 'reel',
  optimalRange: '15-30',
  optimalRangeLabel: '15-30 seconds (Medium-Short)',
  sweetSpotSeconds: { min: 15, max: 30 },
  confidenceScore: 85,
  reasoning: 'Your reels perform best in the 15-30 second range, matching industry standards.',
  userAvgLength: 25,
  recommendedAdjustment: 'optimal',
};

describe('OptimalLengthCard', () => {
  it('renders the heading', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Optimal Length')).toBeInTheDocument();
  });

  it('displays the format', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('reel')).toBeInTheDocument();
  });

  it('displays sweet spot range', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Sweet Spot')).toBeInTheDocument();
    expect(screen.getByText(/15s - 30s/)).toBeInTheDocument();
  });

  it('displays user average length', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Your Average')).toBeInTheDocument();
    expect(screen.getByText('25s')).toBeInTheDocument();
  });

  it('displays confidence score', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('displays optimal adjustment message', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('Your length is optimal!')).toBeInTheDocument();
  });

  it('displays shorter adjustment message', () => {
    const shorterRec = { ...mockRecommendation, recommendedAdjustment: 'shorter' as const };
    render(<OptimalLengthCard recommendation={shorterRec} />);
    expect(screen.getByText('Consider making videos shorter')).toBeInTheDocument();
  });

  it('displays longer adjustment message', () => {
    const longerRec = { ...mockRecommendation, recommendedAdjustment: 'longer' as const };
    render(<OptimalLengthCard recommendation={longerRec} />);
    expect(screen.getByText('Consider making videos longer')).toBeInTheDocument();
  });

  it('displays reasoning', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText(/matching industry standards/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} isLoading={true} />);
    expect(screen.queryByText('Optimal Length')).not.toBeInTheDocument();
  });

  it('displays optimal range label', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('15-30 seconds (Medium-Short)')).toBeInTheDocument();
  });

  it('shows in range status when user is within sweet spot', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('In range')).toBeInTheDocument();
  });

  it('shows out of range status when user is outside sweet spot', () => {
    const outOfRangeRec = { ...mockRecommendation, userAvgLength: 60 };
    render(<OptimalLengthCard recommendation={outOfRangeRec} />);
    expect(screen.getByText('Out of range')).toBeInTheDocument();
  });

  it('displays target icon', () => {
    render(<OptimalLengthCard recommendation={mockRecommendation} />);
    expect(screen.getByText('🎯')).toBeInTheDocument();
  });
});
