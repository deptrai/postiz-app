import React from 'react';
import { render, screen } from '@testing-library/react';
import { LengthBenchmarkComparison, LengthBenchmark } from './length-benchmark-comparison';

const mockBenchmark: LengthBenchmark = {
  niche: 'fitness',
  format: 'reel',
  industryOptimal: { min: 17, max: 33 },
  industryOptimalLabel: '17-33 seconds',
  userOptimal: { min: 15, max: 30 },
  userOptimalLabel: '15-30 seconds',
  deviation: -5,
  performance: 'at',
  insights: [
    'Your optimal length aligns with industry standards for fitness reels.',
    'You\'re hitting the sweet spot for your niche.',
    'Industry recommends 17-33s for fitness reels.',
  ],
};

describe('LengthBenchmarkComparison', () => {
  it('renders the heading', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('Industry Benchmark')).toBeInTheDocument();
  });

  it('displays niche and format', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('fitness')).toBeInTheDocument();
    expect(screen.getByText('reel')).toBeInTheDocument();
  });

  it('displays performance status for at industry', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('At Industry Standard')).toBeInTheDocument();
  });

  it('displays performance status for above industry', () => {
    const aboveBenchmark = { ...mockBenchmark, performance: 'above' as const };
    render(<LengthBenchmarkComparison benchmark={aboveBenchmark} />);
    expect(screen.getByText('Above Industry')).toBeInTheDocument();
  });

  it('displays performance status for below industry', () => {
    const belowBenchmark = { ...mockBenchmark, performance: 'below' as const };
    render(<LengthBenchmarkComparison benchmark={belowBenchmark} />);
    expect(screen.getByText('Below Industry')).toBeInTheDocument();
  });

  it('displays deviation percentage', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText(/-5% from benchmark/)).toBeInTheDocument();
  });

  it('displays industry optimal range', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('Industry Optimal')).toBeInTheDocument();
    expect(screen.getByText(/17s - 33s/)).toBeInTheDocument();
  });

  it('displays user optimal range', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('Your Optimal')).toBeInTheDocument();
    expect(screen.getByText(/15s - 30s/)).toBeInTheDocument();
  });

  it('displays insights', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText(/aligns with industry standards/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} isLoading={true} />);
    expect(screen.queryByText('Industry Benchmark')).not.toBeInTheDocument();
  });

  it('displays industry and user labels in legend', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('Industry')).toBeInTheDocument();
    expect(screen.getByText('Your Optimal')).toBeInTheDocument();
  });

  it('displays performance icons', () => {
    render(<LengthBenchmarkComparison benchmark={mockBenchmark} />);
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('displays above performance icon', () => {
    const aboveBenchmark = { ...mockBenchmark, performance: 'above' as const };
    render(<LengthBenchmarkComparison benchmark={aboveBenchmark} />);
    expect(screen.getByText('📈')).toBeInTheDocument();
  });

  it('displays below performance icon', () => {
    const belowBenchmark = { ...mockBenchmark, performance: 'below' as const };
    render(<LengthBenchmarkComparison benchmark={belowBenchmark} />);
    expect(screen.getByText('📉')).toBeInTheDocument();
  });
});
