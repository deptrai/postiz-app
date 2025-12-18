import React from 'react';
import { render, screen } from '@testing-library/react';
import { CaptionAnalysis } from './caption-analysis';
import { CaptionAnalysis as CaptionAnalysisType } from './content-elements-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('CaptionAnalysis', () => {
  const mockAnalysis: CaptionAnalysisType = {
    length: 85,
    lengthCategory: 'medium',
    tone: 'casual',
    toneConfidence: 75,
    keywords: [
      { word: 'amazing', count: 2, importance: 100 },
      { word: 'tips', count: 1, importance: 100 },
      { word: 'learn', count: 1, importance: 100 },
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
  };

  it('renders caption analysis heading', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Caption Analysis')).toBeInTheDocument();
  });

  it('displays readability score', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('Readability')).toBeInTheDocument();
  });

  it('shows caption length', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('85 characters')).toBeInTheDocument();
  });

  it('displays length category', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('shows tone with emoji', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('casual')).toBeInTheDocument();
    expect(screen.getByText('😊')).toBeInTheDocument();
  });

  it('displays tone confidence', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders top keywords', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('amazing')).toBeInTheDocument();
    expect(screen.getByText('tips')).toBeInTheDocument();
    expect(screen.getByText('learn')).toBeInTheDocument();
  });

  it('displays emoji count', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('3 emojis')).toBeInTheDocument();
  });

  it('shows emoji placement', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('throughout')).toBeInTheDocument();
  });

  it('renders suggestions', () => {
    render(<CaptionAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Consider adding more context')).toBeInTheDocument();
    expect(screen.getByText('Good emoji usage')).toBeInTheDocument();
  });

  it('displays professional tone emoji', () => {
    const professionalAnalysis = {
      ...mockAnalysis,
      tone: 'professional' as const,
    };

    render(<CaptionAnalysis analysis={professionalAnalysis} />);

    expect(screen.getByText('💼')).toBeInTheDocument();
  });

  it('displays educational tone emoji', () => {
    const educationalAnalysis = {
      ...mockAnalysis,
      tone: 'educational' as const,
    };

    render(<CaptionAnalysis analysis={educationalAnalysis} />);

    expect(screen.getByText('📚')).toBeInTheDocument();
  });

  it('shows high readability in green', () => {
    const { container } = render(<CaptionAnalysis analysis={mockAnalysis} />);

    const scoreElement = screen.getByText('80%');
    expect(scoreElement).toHaveClass('text-green-400');
  });

  it('handles no emojis', () => {
    const noEmojiAnalysis = {
      ...mockAnalysis,
      emojiUsage: {
        count: 0,
        emojis: [],
        placement: 'none' as const,
      },
    };

    render(<CaptionAnalysis analysis={noEmojiAnalysis} />);

    expect(screen.getByText('0 emojis')).toBeInTheDocument();
  });
});
