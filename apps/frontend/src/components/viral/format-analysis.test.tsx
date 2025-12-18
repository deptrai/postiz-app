import React from 'react';
import { render, screen } from '@testing-library/react';
import { FormatAnalysis } from './format-analysis';
import { FormatAnalysis as FormatAnalysisType } from './content-elements-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('FormatAnalysis', () => {
  const mockReelAnalysis: FormatAnalysisType = {
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
      recommendation: 'Reels have the highest organic reach. Focus on hook and quick value.',
    },
    suggestions: [
      'Use trending audio',
      'Add captions/text overlay',
    ],
  };

  it('renders format analysis heading', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('Format Analysis')).toBeInTheDocument();
  });

  it('displays format type', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('reel')).toBeInTheDocument();
  });

  it('shows format score', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('displays video length', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('25s')).toBeInTheDocument();
  });

  it('shows optimal length status', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('Optimal')).toBeInTheDocument();
  });

  it('displays video length recommendation', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('Perfect length for maximum engagement!')).toBeInTheDocument();
  });

  it('shows reach potential', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText(/Reach:/)).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('shows engagement potential', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText(/Engagement:/)).toBeInTheDocument();
  });

  it('displays performance recommendation', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText(/Reels have the highest organic reach/)).toBeInTheDocument();
  });

  it('renders suggestions', () => {
    render(<FormatAnalysis analysis={mockReelAnalysis} />);

    expect(screen.getByText('Use trending audio')).toBeInTheDocument();
    expect(screen.getByText('Add captions/text overlay')).toBeInTheDocument();
  });

  it('handles video format', () => {
    const videoAnalysis: FormatAnalysisType = {
      format: 'video',
      formatScore: 75,
      videoLength: {
        seconds: 300,
        optimal: true,
        recommendation: 'Good length for in-depth content!',
      },
      performanceInsights: {
        reachPotential: 'medium',
        engagementPotential: 'high',
        recommendation: 'Videos build deeper connections.',
      },
      suggestions: [],
    };

    render(<FormatAnalysis analysis={videoAnalysis} />);

    expect(screen.getByText('video')).toBeInTheDocument();
    expect(screen.getByText('300s')).toBeInTheDocument();
  });

  it('handles post format without video length', () => {
    const postAnalysis: FormatAnalysisType = {
      format: 'post',
      formatScore: 70,
      performanceInsights: {
        reachPotential: 'medium',
        engagementPotential: 'medium',
        recommendation: 'Carousels outperform single images.',
      },
      suggestions: ['Create a carousel'],
    };

    render(<FormatAnalysis analysis={postAnalysis} />);

    expect(screen.getByText('post')).toBeInTheDocument();
    expect(screen.queryByText(/\ds/)).not.toBeInTheDocument();
  });

  it('shows non-optimal video length', () => {
    const nonOptimalAnalysis: FormatAnalysisType = {
      ...mockReelAnalysis,
      videoLength: {
        seconds: 90,
        optimal: false,
        recommendation: 'Shorter reels (15-30s) tend to have higher completion rates',
      },
    };

    render(<FormatAnalysis analysis={nonOptimalAnalysis} />);

    expect(screen.queryByText('Optimal')).not.toBeInTheDocument();
    expect(screen.getByText(/higher completion rates/)).toBeInTheDocument();
  });

  it('displays medium reach potential in yellow', () => {
    const mediumReachAnalysis: FormatAnalysisType = {
      ...mockReelAnalysis,
      performanceInsights: {
        reachPotential: 'medium',
        engagementPotential: 'medium',
        recommendation: 'Test recommendation',
      },
    };

    const { container } = render(<FormatAnalysis analysis={mediumReachAnalysis} />);

    const mediumElements = container.querySelectorAll('.text-yellow-400');
    expect(mediumElements.length).toBeGreaterThan(0);
  });

  it('handles story format', () => {
    const storyAnalysis: FormatAnalysisType = {
      format: 'story',
      formatScore: 65,
      performanceInsights: {
        reachPotential: 'low',
        engagementPotential: 'medium',
        recommendation: 'Stories are great for engagement.',
      },
      suggestions: ['Use polls and questions'],
    };

    render(<FormatAnalysis analysis={storyAnalysis} />);

    expect(screen.getByText('story')).toBeInTheDocument();
    expect(screen.getByText('low')).toBeInTheDocument();
  });

  it('shows high score in green', () => {
    const { container } = render(<FormatAnalysis analysis={mockReelAnalysis} />);

    const scoreElement = screen.getByText('90');
    expect(scoreElement).toHaveClass('text-green-400');
  });
});
