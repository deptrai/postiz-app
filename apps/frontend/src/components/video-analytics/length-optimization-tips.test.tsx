import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { LengthOptimizationTips, LengthOptimizationTip } from './length-optimization-tips';

const mockTips: LengthOptimizationTip[] = [
  {
    priority: 'high',
    category: 'content',
    issue: 'Your videos are longer than optimal',
    tip: 'Trim unnecessary content. Focus on the core message.',
    example: 'Cut long intros, remove repetitive explanations.',
    expectedImprovement: '+15-25% completion rate',
  },
  {
    priority: 'medium',
    category: 'pacing',
    issue: 'Content may feel slow',
    tip: 'Increase pacing with faster cuts and transitions.',
    example: 'Use jump cuts every 3-5 seconds.',
    expectedImprovement: '+10-15% retention',
  },
  {
    priority: 'low',
    category: 'general',
    issue: 'Continuous optimization',
    tip: 'Test different lengths and analyze performance regularly.',
    example: 'Create A/B tests with same content at different lengths.',
    expectedImprovement: 'Ongoing improvement',
  },
];

describe('LengthOptimizationTips', () => {
  it('renders the heading', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('Optimization Tips')).toBeInTheDocument();
  });

  it('displays tip count', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText(/3 recommendations/)).toBeInTheDocument();
  });

  it('displays high priority count', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText(/1 high priority/)).toBeInTheDocument();
  });

  it('displays priority badges', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('1 High')).toBeInTheDocument();
    expect(screen.getByText('1 Medium')).toBeInTheDocument();
  });

  it('displays tip issues', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('Your videos are longer than optimal')).toBeInTheDocument();
    expect(screen.getByText('Content may feel slow')).toBeInTheDocument();
  });

  it('displays tip suggestions', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText(/Trim unnecessary content/)).toBeInTheDocument();
    expect(screen.getByText(/Increase pacing/)).toBeInTheDocument();
  });

  it('displays category icons', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('📝')).toBeInTheDocument(); // content
    expect(screen.getByText('⏱️')).toBeInTheDocument(); // pacing
    expect(screen.getByText('💡')).toBeInTheDocument(); // general
  });

  it('expands tip on click to show example', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    
    const firstTip = screen.getByText('Your videos are longer than optimal').closest('div[class*="rounded-lg"]');
    fireEvent.click(firstTip!);
    
    expect(screen.getByText('Example')).toBeInTheDocument();
    expect(screen.getByText(/Cut long intros/)).toBeInTheDocument();
  });

  it('shows expected improvement when expanded', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    
    const firstTip = screen.getByText('Your videos are longer than optimal').closest('div[class*="rounded-lg"]');
    fireEvent.click(firstTip!);
    
    expect(screen.getByText(/Expected: \+15-25% completion rate/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<LengthOptimizationTips tips={[]} isLoading={true} />);
    expect(screen.queryByText('Optimization Tips')).not.toBeInTheDocument();
  });

  it('displays empty state when no tips', () => {
    render(<LengthOptimizationTips tips={[]} />);
    expect(screen.getByText('Great job!')).toBeInTheDocument();
    expect(screen.getByText(/well optimized/)).toBeInTheDocument();
  });

  it('displays celebration emoji for empty state', () => {
    render(<LengthOptimizationTips tips={[]} />);
    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('displays priority labels', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('Medium Priority')).toBeInTheDocument();
    expect(screen.getByText('Low Priority')).toBeInTheDocument();
  });

  it('displays category labels', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Pacing')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
  });

  it('displays potential impact indicator', () => {
    render(<LengthOptimizationTips tips={mockTips} />);
    expect(screen.getByText('Potential Impact')).toBeInTheDocument();
  });
});
