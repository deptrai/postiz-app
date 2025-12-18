import React from 'react';
import { render, screen } from '@testing-library/react';
import { StylePerformanceChart, StylePerformance } from './style-performance-chart';

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ReferenceLine: () => <div data-testid="reference-line" />,
  Cell: () => <div data-testid="cell" />,
}));

const mockStyles: StylePerformance[] = [
  {
    style: 'face',
    styleLabel: 'Face + Emotion',
    avgCtr: 12,
    videoCount: 10,
    totalImpressions: 100000,
    totalClicks: 12000,
    confidenceScore: 100,
    rank: 1,
    benchmark: 10,
    vsIndustry: 'above',
  },
  {
    style: 'text-heavy',
    styleLabel: 'Text-Heavy',
    avgCtr: 7,
    videoCount: 8,
    totalImpressions: 80000,
    totalClicks: 5600,
    confidenceScore: 80,
    rank: 2,
    benchmark: 7,
    vsIndustry: 'at',
  },
  {
    style: 'minimal',
    styleLabel: 'Minimal',
    avgCtr: 3,
    videoCount: 5,
    totalImpressions: 50000,
    totalClicks: 1500,
    confidenceScore: 50,
    rank: 3,
    benchmark: 5,
    vsIndustry: 'below',
  },
];

describe('StylePerformanceChart', () => {
  it('renders the heading', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByText('Style Performance')).toBeInTheDocument();
  });

  it('displays best style', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByText('🏆 Best Style')).toBeInTheDocument();
    expect(screen.getByText('12% CTR')).toBeInTheDocument();
  });

  it('displays worst style', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByText('📉 Lowest Style')).toBeInTheDocument();
    expect(screen.getByText('3% CTR')).toBeInTheDocument();
  });

  it('displays recommendations', () => {
    const recommendations = ['Use more face thumbnails', 'Test different styles'];
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={recommendations}
      />
    );
    expect(screen.getByText('Recommendations')).toBeInTheDocument();
    expect(screen.getByText('Use more face thumbnails')).toBeInTheDocument();
    expect(screen.getByText('Test different styles')).toBeInTheDocument();
  });

  it('displays style breakdown', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByText('Style Breakdown')).toBeInTheDocument();
    expect(screen.getByText('10 videos')).toBeInTheDocument();
    expect(screen.getByText('8 videos')).toBeInTheDocument();
    expect(screen.getByText('5 videos')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <StylePerformanceChart
        styles={[]}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
        isLoading={true}
      />
    );
    expect(screen.queryByText('Style Performance')).not.toBeInTheDocument();
  });

  it('renders chart components', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('displays legend', () => {
    render(
      <StylePerformanceChart
        styles={mockStyles}
        bestStyle="face"
        worstStyle="minimal"
        recommendations={[]}
      />
    );
    expect(screen.getByText('Your CTR')).toBeInTheDocument();
    expect(screen.getByText('Industry Avg')).toBeInTheDocument();
  });
});
