import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormatTimingTabs, ContentFormat } from './format-timing-tabs';
import { TimingWindow } from './viral-timing-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('FormatTimingTabs', () => {
  const mockWindows: TimingWindow[] = [
    {
      startHour: 19,
      endHour: 22,
      dayOfWeek: -1,
      label: 'Prime Time',
      score: 90,
      confidence: 'high',
      successRate: 0.78,
      dataPoints: 200,
    },
    {
      startHour: 7,
      endHour: 9,
      dayOfWeek: -1,
      label: 'Early Morning',
      score: 85,
      confidence: 'high',
      successRate: 0.72,
      dataPoints: 150,
    },
    {
      startHour: 12,
      endHour: 14,
      dayOfWeek: -1,
      label: 'Lunch Break',
      score: 82,
      confidence: 'high',
      successRate: 0.68,
      dataPoints: 140,
    },
  ];

  const mockFormatWindows = {
    format: 'reel' as ContentFormat,
    windows: mockWindows,
  };

  const mockOnFormatChange = jest.fn();

  beforeEach(() => {
    mockOnFormatChange.mockClear();
  });

  it('renders all format tabs', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    expect(screen.getByText('Reels')).toBeInTheDocument();
    expect(screen.getByText('Videos')).toBeInTheDocument();
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Stories')).toBeInTheDocument();
  });

  it('displays active format description', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    expect(screen.getByText('Short-form vertical videos')).toBeInTheDocument();
  });

  it('calls onFormatChange when clicking different tab', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    const videoTab = screen.getByText('Videos');
    fireEvent.click(videoTab);

    expect(mockOnFormatChange).toHaveBeenCalledWith('video');
  });

  it('displays format-specific timing windows', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    expect(screen.getByText('Prime Time')).toBeInTheDocument();
    expect(screen.getByText('7 PM - 10 PM')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
  });

  it('displays window confidence levels', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    const highConfidenceBadges = screen.getAllByText('high');
    expect(highConfidenceBadges.length).toBeGreaterThan(0);
  });

  it('displays data points for each window', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    expect(screen.getByText('200 data points')).toBeInTheDocument();
    expect(screen.getByText('150 data points')).toBeInTheDocument();
    expect(screen.getByText('140 data points')).toBeInTheDocument();
  });

  it('highlights active format tab', () => {
    const { container } = render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    // Check if active tab has correct styling
    const reelTab = screen.getByText('Reels').closest('button');
    expect(reelTab).toHaveClass('border-b-2');
  });

  it('renders loading state when isLoading is true', () => {
    const { container } = render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        isLoading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows message when no windows available', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={undefined}
      />
    );

    expect(screen.getByText('Select a format to see timing recommendations')).toBeInTheDocument();
  });

  it('displays all timing windows in sorted order', () => {
    render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    const scores = screen.getAllByText(/^\d{2}$/);
    expect(scores[0]).toHaveTextContent('90');
    expect(scores[1]).toHaveTextContent('85');
    expect(scores[2]).toHaveTextContent('82');
  });

  it('changes description when switching formats', () => {
    const { rerender } = render(
      <FormatTimingTabs
        activeFormat="reel"
        onFormatChange={mockOnFormatChange}
        formatWindows={mockFormatWindows}
      />
    );

    expect(screen.getByText('Short-form vertical videos')).toBeInTheDocument();

    rerender(
      <FormatTimingTabs
        activeFormat="video"
        onFormatChange={mockOnFormatChange}
        formatWindows={{ format: 'video', windows: mockWindows }}
      />
    );

    expect(screen.getByText('Long-form video content')).toBeInTheDocument();
  });
});
