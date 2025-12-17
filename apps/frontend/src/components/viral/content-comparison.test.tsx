import React from 'react';
import { render, screen } from '@testing-library/react';
import { ContentComparison, RankedContent } from './content-comparison';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('ContentComparison', () => {
  const mockRankings: RankedContent[] = [
    {
      contentId: 'draft-1',
      score: 85,
      rank: 1,
      breakdown: { hook: 90, caption: 80, hashtags: 75, timing: 90, format: 90 },
      label: 'Best Draft',
    },
    {
      contentId: 'draft-2',
      score: 65,
      rank: 2,
      breakdown: { hook: 60, caption: 70, hashtags: 55, timing: 70, format: 70 },
    },
  ];

  it('renders ranked content cards', () => {
    render(<ContentComparison rankings={mockRankings} />);

    expect(screen.getByText('Best Draft')).toBeInTheDocument();
    expect(screen.getByText('Draft 2')).toBeInTheDocument();
  });

  it('displays scores for each draft', () => {
    render(<ContentComparison rankings={mockRankings} />);

    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('shows recommended badge for rank 1', () => {
    render(<ContentComparison rankings={mockRankings} />);

    expect(screen.getByText(/Recommended/)).toBeInTheDocument();
  });

  it('renders empty state when no rankings', () => {
    render(<ContentComparison rankings={[]} />);

    expect(screen.getByText('Add multiple drafts to compare their viral potential')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(
      <ContentComparison rankings={[]} isLoading={true} />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays draft count', () => {
    render(<ContentComparison rankings={mockRankings} />);

    expect(screen.getByText('(2 drafts)')).toBeInTheDocument();
  });
});
