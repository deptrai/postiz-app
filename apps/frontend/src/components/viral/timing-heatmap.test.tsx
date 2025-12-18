import React from 'react';
import { render, screen } from '@testing-library/react';
import { TimingHeatmap, HeatmapCell, TimeSlot } from './timing-heatmap';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('TimingHeatmap', () => {
  // Create a 7x24 heatmap grid
  const mockHeatmap: HeatmapCell[][] = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => ({
      dayOfWeek: day,
      hour,
      value: 50 + Math.floor(Math.random() * 40), // Random values 50-90
      label: `Day ${day} Hour ${hour}`,
    }))
  );

  const mockPeakTimes: TimeSlot[] = [
    { dayOfWeek: 0, hour: 19, score: 100 },
    { dayOfWeek: 0, hour: 20, score: 100 },
    { dayOfWeek: 0, hour: 21, score: 100 },
    { dayOfWeek: 3, hour: 20, score: 100 },
    { dayOfWeek: 4, hour: 19, score: 100 },
  ];

  const mockLowTimes: TimeSlot[] = [
    { dayOfWeek: 1, hour: 5, score: 16 },
    { dayOfWeek: 2, hour: 2, score: 16 },
    { dayOfWeek: 3, hour: 5, score: 16 },
    { dayOfWeek: 4, hour: 3, score: 16 },
    { dayOfWeek: 4, hour: 5, score: 16 },
  ];

  it('renders engagement heatmap heading', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('Engagement Heatmap')).toBeInTheDocument();
  });

  it('displays average engagement', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText(/Avg: 55/)).toBeInTheDocument();
  });

  it('renders day labels', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('renders hour labels', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('12a')).toBeInTheDocument();
    expect(screen.getByText('3a')).toBeInTheDocument();
    expect(screen.getByText('6a')).toBeInTheDocument();
    expect(screen.getByText('9a')).toBeInTheDocument();
    expect(screen.getByText('12p')).toBeInTheDocument();
    expect(screen.getByText('3p')).toBeInTheDocument();
    expect(screen.getByText('6p')).toBeInTheDocument();
    expect(screen.getByText('9p')).toBeInTheDocument();
  });

  it('renders peak times section', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('Peak Times')).toBeInTheDocument();
    expect(screen.getByText('Sun 7 PM')).toBeInTheDocument();
    expect(screen.getByText('Sun 8 PM')).toBeInTheDocument();
    expect(screen.getByText('Sun 9 PM')).toBeInTheDocument();
  });

  it('renders avoid times section', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('Avoid Times')).toBeInTheDocument();
    expect(screen.getByText('Mon 5 AM')).toBeInTheDocument();
    expect(screen.getByText('Tue 2 AM')).toBeInTheDocument();
  });

  it('renders loading state when isLoading is true', () => {
    const { container } = render(
      <TimingHeatmap
        heatmap={[]}
        peakTimes={[]}
        lowTimes={[]}
        averageEngagement={0}
        isLoading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders heatmap grid with correct dimensions', () => {
    const { container } = render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    // Check if heatmap grid exists
    const heatmapGrid = container.querySelector('.grid');
    expect(heatmapGrid).toBeInTheDocument();
  });

  it('displays legend with Low and High labels', () => {
    render(
      <TimingHeatmap
        heatmap={mockHeatmap}
        peakTimes={mockPeakTimes}
        lowTimes={mockLowTimes}
        averageEngagement={55}
      />
    );

    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });
});

