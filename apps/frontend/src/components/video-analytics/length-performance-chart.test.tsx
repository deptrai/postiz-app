import React from 'react';
import { render, screen } from '@testing-library/react';
import { LengthPerformanceChart, LengthPerformance } from './length-performance-chart';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

const mockPerformances: LengthPerformance[] = [
  {
    range: '0-15',
    rangeLabel: '0-15 seconds (Short)',
    rangeSeconds: { min: 0, max: 15 },
    videoCount: 10,
    avgViews: 5000,
    avgEngagementRate: 6.5,
    avgCompletionRate: 75,
    topPerformer: { videoId: 'v1', title: 'Top Short', views: 10000, engagementRate: 8.0 },
  },
  {
    range: '15-30',
    rangeLabel: '15-30 seconds (Medium-Short)',
    rangeSeconds: { min: 15, max: 30 },
    videoCount: 25,
    avgViews: 15000,
    avgEngagementRate: 8.5,
    avgCompletionRate: 65,
    topPerformer: { videoId: 'v2', title: 'Top Medium', views: 25000, engagementRate: 10.0 },
  },
  {
    range: '30-60',
    rangeLabel: '30-60 seconds (Medium)',
    rangeSeconds: { min: 30, max: 60 },
    videoCount: 15,
    avgViews: 10000,
    avgEngagementRate: 5.0,
    avgCompletionRate: 50,
  },
  {
    range: '60-180',
    rangeLabel: '1-3 minutes (Long)',
    rangeSeconds: { min: 60, max: 180 },
    videoCount: 8,
    avgViews: 8000,
    avgEngagementRate: 4.0,
    avgCompletionRate: 40,
  },
  {
    range: '180+',
    rangeLabel: '3+ minutes (Extended)',
    rangeSeconds: { min: 180, max: 999 },
    videoCount: 2,
    avgViews: 3000,
    avgEngagementRate: 3.0,
    avgCompletionRate: 30,
  },
];

describe('LengthPerformanceChart', () => {
  it('renders the heading', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText('Performance by Video Length')).toBeInTheDocument();
  });

  it('displays total videos count', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText(/60 videos analyzed/)).toBeInTheDocument();
  });

  it('displays best performing range', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText(/Best: 15-30s/)).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <LengthPerformanceChart
        performances={[]}
        bestPerformingRange="15-30"
        totalVideos={0}
        isLoading={true}
      />
    );

    expect(screen.queryByText('Performance by Video Length')).not.toBeInTheDocument();
  });

  it('renders the chart', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays video count for each range', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays range labels', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText('0-15s')).toBeInTheDocument();
    expect(screen.getByText('15-30s')).toBeInTheDocument();
    expect(screen.getByText('30-60s')).toBeInTheDocument();
  });

  it('displays legend items', () => {
    render(
      <LengthPerformanceChart
        performances={mockPerformances}
        bestPerformingRange="15-30"
        totalVideos={60}
      />
    );

    expect(screen.getByText('Best Range')).toBeInTheDocument();
    expect(screen.getByText('Other Ranges')).toBeInTheDocument();
  });
});
