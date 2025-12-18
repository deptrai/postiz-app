import React from 'react';
import { render, screen } from '@testing-library/react';
import { RetentionCurveChart } from './retention-curve-chart';

// Mock recharts to avoid rendering issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

describe('RetentionCurveChart', () => {
  const mockPoints = [
    { percentage: 0, retention: 100, viewersCount: 1000 },
    { percentage: 10, retention: 85, viewersCount: 850 },
    { percentage: 20, retention: 75, viewersCount: 750 },
    { percentage: 50, retention: 60, viewersCount: 600 },
    { percentage: 100, retention: 35, viewersCount: 350 },
  ];

  const mockDropOffPoints = [
    { percentage: 10, dropAmount: 15, severity: 'medium' as const, viewerLoss: 150 },
    { percentage: 50, dropAmount: 12, severity: 'low' as const, viewerLoss: 120 },
  ];

  it('renders retention curve heading', () => {
    render(<RetentionCurveChart points={mockPoints} />);
    expect(screen.getByText('Retention Curve')).toBeInTheDocument();
  });

  it('displays video title when provided', () => {
    render(<RetentionCurveChart points={mockPoints} videoTitle="Test Video" />);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    const { container } = render(<RetentionCurveChart points={mockPoints} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays start retention stat', () => {
    render(<RetentionCurveChart points={mockPoints} />);
    expect(screen.getByText('Start Retention')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });

  it('displays mid retention stat', () => {
    render(<RetentionCurveChart points={mockPoints} />);
    expect(screen.getByText('Mid Retention (50%)')).toBeInTheDocument();
    expect(screen.getByText('60.0%')).toBeInTheDocument();
  });

  it('displays completion rate stat', () => {
    render(<RetentionCurveChart points={mockPoints} />);
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('35.0%')).toBeInTheDocument();
  });

  it('shows drop-off legend when drop-offs present', () => {
    render(<RetentionCurveChart points={mockPoints} dropOffPoints={mockDropOffPoints} />);
    expect(screen.getByText('Drop-off Points')).toBeInTheDocument();
    expect(screen.getByText('High Severity (>20%)')).toBeInTheDocument();
    expect(screen.getByText('Medium Severity (15-20%)')).toBeInTheDocument();
    expect(screen.getByText('Low Severity (10-15%)')).toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(<RetentionCurveChart points={mockPoints} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('shows benchmark when enabled', () => {
    const benchmarkPoints = mockPoints.map(p => ({ ...p, retention: p.retention - 5 }));
    render(
      <RetentionCurveChart
        points={mockPoints}
        benchmarkPoints={benchmarkPoints}
        showBenchmark={true}
      />
    );
    // Chart renders with benchmark data
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});
