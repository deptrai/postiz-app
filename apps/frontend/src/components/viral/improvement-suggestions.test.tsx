import React from 'react';
import { render, screen } from '@testing-library/react';
import { ImprovementSuggestions, ImprovementSuggestion } from './improvement-suggestions';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('ImprovementSuggestions', () => {
  const mockSuggestions: ImprovementSuggestion[] = [
    {
      factor: 'hook',
      currentScore: 45,
      suggestion: 'Start with a question to grab attention',
      impact: 'high',
      potentialGain: 25,
    },
    {
      factor: 'hashtags',
      currentScore: 50,
      suggestion: 'Use 5-10 relevant hashtags',
      impact: 'medium',
      potentialGain: 15,
    },
  ];

  it('renders suggestions list', () => {
    render(<ImprovementSuggestions suggestions={mockSuggestions} />);

    expect(screen.getByText('Start with a question to grab attention')).toBeInTheDocument();
    expect(screen.getByText('Use 5-10 relevant hashtags')).toBeInTheDocument();
  });

  it('displays impact badges', () => {
    render(<ImprovementSuggestions suggestions={mockSuggestions} />);

    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
  });

  it('shows potential gain for each suggestion', () => {
    render(<ImprovementSuggestions suggestions={mockSuggestions} />);

    expect(screen.getByText(/\+25/)).toBeInTheDocument();
    expect(screen.getByText(/\+15/)).toBeInTheDocument();
  });

  it('renders empty state when no suggestions', () => {
    render(<ImprovementSuggestions suggestions={[]} />);

    expect(screen.getByText('Great job! Your content is well optimized.')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <ImprovementSuggestions suggestions={[]} isLoading={true} />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays suggestion count', () => {
    render(<ImprovementSuggestions suggestions={mockSuggestions} />);

    expect(screen.getByText('(2 actionable)')).toBeInTheDocument();
  });
});
