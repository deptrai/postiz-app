import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BenchmarkOverlay } from './benchmark-overlay';

describe('BenchmarkOverlay', () => {
  const mockComparison = {
    videoRetention: {
      averageRetention: 65.5,
      completionRate: 45.0,
    },
    benchmark: {
      niche: 'fitness',
      format: 'reel' as const,
      averageRetention: 58.0,
    },
    deviation: 7.5,
    performance: 'above' as const,
  };

  it('renders benchmark heading', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText('Benchmark Comparison')).toBeInTheDocument();
  });

  it('displays niche and format', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText(/fitness · reel/)).toBeInTheDocument();
  });

  it('shows performance status', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText(/Performance: Above Benchmark/)).toBeInTheDocument();
  });

  it('displays video average retention', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText('65.5%')).toBeInTheDocument();
  });

  it('displays benchmark average', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText('58.0%')).toBeInTheDocument();
  });

  it('shows deviation percentage', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText('+7.5%')).toBeInTheDocument();
  });

  it('toggles details visibility', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    const toggleButton = screen.getByRole('button');
    
    // Initially expanded
    expect(screen.getByText('Average Retention')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(toggleButton);
    expect(screen.queryByText('Deviation Breakdown')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<BenchmarkOverlay comparison={mockComparison} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays performance below benchmark', () => {
    const belowComparison = {
      ...mockComparison,
      deviation: -8.5,
      performance: 'below' as const,
    };
    render(<BenchmarkOverlay comparison={belowComparison} />);
    expect(screen.getByText('-8.5%')).toBeInTheDocument();
  });

  it('shows insights for above performance', () => {
    render(<BenchmarkOverlay comparison={mockComparison} />);
    expect(screen.getByText(/Your content resonates well/)).toBeInTheDocument();
  });
});
