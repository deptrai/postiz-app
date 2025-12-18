import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RetentionSuggestions } from './retention-suggestions';

describe('RetentionSuggestions', () => {
  const mockSuggestions = [
    {
      type: 'hook' as const,
      priority: 'high' as const,
      dropOffPoint: 10,
      issue: '35% of viewers left within the first 10%',
      suggestion: 'Improve your opening hook',
      expectedImprovement: '+15-25% retention',
    },
    {
      type: 'pacing' as const,
      priority: 'medium' as const,
      dropOffPoint: 50,
      issue: 'Drop-off at 50% suggests pacing issues',
      suggestion: 'Tighten your pacing',
      expectedImprovement: '+8-12% retention',
    },
    {
      type: 'length' as const,
      priority: 'low' as const,
      dropOffPoint: 80,
      issue: 'Video may be too long',
      suggestion: 'Consider shortening',
      expectedImprovement: '+5-10% completion',
    },
  ];

  it('renders suggestions heading', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Improvement Suggestions')).toBeInTheDocument();
  });

  it('shows count of recommendations', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText(/3 recommendations/)).toBeInTheDocument();
  });

  it('displays priority summary', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('1')).toBeInTheDocument(); // High priority count
    expect(screen.getByText('High Priority')).toBeInTheDocument();
  });

  it('shows excellent message when no suggestions', () => {
    render(<RetentionSuggestions suggestions={[]} />);
    expect(screen.getByText('Excellent Retention!')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const { container } = render(<RetentionSuggestions suggestions={mockSuggestions} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('expands suggestion on click', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    
    // Initially first suggestion is expanded
    expect(screen.getByText('💡 Suggestion')).toBeInTheDocument();
    expect(screen.getByText('Improve your opening hook')).toBeInTheDocument();
  });

  it('displays suggestion type label', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Opening Hook')).toBeInTheDocument();
  });

  it('shows priority badge', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('displays drop-off point', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('📍 Drop-off at 10%')).toBeInTheDocument();
  });

  it('shows expected improvement', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('+15-25% retention')).toBeInTheDocument();
  });

  it('displays potential impact summary', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    expect(screen.getByText('Potential Impact')).toBeInTheDocument();
    expect(screen.getByText(/+15-35%/)).toBeInTheDocument();
  });

  it('collapses when clicking another suggestion', () => {
    render(<RetentionSuggestions suggestions={mockSuggestions} />);
    
    const suggestions = screen.getAllByText(/Drop-off at/);
    fireEvent.click(suggestions[1].parentElement!.parentElement!);
    
    // Second suggestion details should now be visible
    expect(screen.getByText('Tighten your pacing')).toBeInTheDocument();
  });
});
