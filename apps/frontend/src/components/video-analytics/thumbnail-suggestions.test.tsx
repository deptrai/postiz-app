import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThumbnailSuggestions, ThumbnailSuggestion } from './thumbnail-suggestions';

const mockSuggestions: ThumbnailSuggestion[] = [
  {
    type: 'ab-test',
    priority: 'high',
    title: 'Test Face Thumbnails',
    description: 'Your face thumbnails perform 50% better than others.',
    expectedImprovement: '+3% CTR',
    actionItems: ['Select 5 videos', 'Create new thumbnails', 'Run A/B test'],
  },
  {
    type: 'best-practice',
    priority: 'medium',
    title: 'Add Human Faces',
    description: 'Thumbnails with faces get higher CTR.',
    expectedImprovement: '+2% CTR',
    actionItems: ['Include faces in thumbnails', 'Use emotional expressions'],
  },
  {
    type: 'ab-test',
    priority: 'low',
    title: 'Test Curiosity Gap',
    description: 'Try blurring elements to create curiosity.',
    expectedImprovement: '+1% CTR',
    actionItems: ['Identify suitable videos', 'Create test thumbnails'],
  },
];

describe('ThumbnailSuggestions', () => {
  it('renders the heading', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Thumbnail Suggestions')).toBeInTheDocument();
  });

  it('displays suggestion count', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText(/3 suggestions/)).toBeInTheDocument();
  });

  it('displays high priority count', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText(/1 high priority/)).toBeInTheDocument();
  });

  it('displays suggestion titles', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Test Face Thumbnails')).toBeInTheDocument();
    expect(screen.getByText('Add Human Faces')).toBeInTheDocument();
    expect(screen.getByText('Test Curiosity Gap')).toBeInTheDocument();
  });

  it('displays suggestion descriptions', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText(/face thumbnails perform 50% better/)).toBeInTheDocument();
  });

  it('displays expected improvements', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('+3% CTR')).toBeInTheDocument();
    expect(screen.getByText('+2% CTR')).toBeInTheDocument();
    expect(screen.getByText('+1% CTR')).toBeInTheDocument();
  });

  it('displays type icons', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getAllByText('🧪').length).toBeGreaterThan(0);
    expect(screen.getAllByText('✨').length).toBeGreaterThan(0);
  });

  it('displays priority badges', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('expands suggestion on click to show action items', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    
    const firstSuggestion = screen.getByText('Test Face Thumbnails').closest('div[class*="rounded-lg"]');
    fireEvent.click(firstSuggestion!);
    
    expect(screen.getByText('Action Items')).toBeInTheDocument();
    expect(screen.getByText('Select 5 videos')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<ThumbnailSuggestions suggestions={[]} isLoading={true} />);
    expect(screen.queryByText('Thumbnail Suggestions')).not.toBeInTheDocument();
  });

  it('displays filter buttons', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText(/All \(3\)/)).toBeInTheDocument();
    expect(screen.getByText(/A\/B Tests \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Best Practices \(1\)/)).toBeInTheDocument();
  });

  it('filters by type when clicking filter button', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    
    const bestPracticeButton = screen.getByText(/Best Practices \(1\)/);
    fireEvent.click(bestPracticeButton);
    
    expect(screen.getByText('Add Human Faces')).toBeInTheDocument();
  });

  it('displays priority summary', () => {
    render(<ThumbnailSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Priority Summary')).toBeInTheDocument();
    expect(screen.getByText('1 High')).toBeInTheDocument();
    expect(screen.getByText('1 Medium')).toBeInTheDocument();
    expect(screen.getByText('1 Low')).toBeInTheDocument();
  });

  it('displays empty state when no suggestions', () => {
    render(<ThumbnailSuggestions suggestions={[]} />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
  });
});
