import React from 'react';
import { render, screen } from '@testing-library/react';
import { ViralTimingCard, TimingWindow, BestOverallTime } from './viral-timing-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('ViralTimingCard', () => {
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

  const mockBestTime: BestOverallTime = {
    dayOfWeek: -1,
    hour: 19,
    dayName: 'Any Day',
    timeLabel: '7 PM - 10 PM',
    confidence: 'high',
    successRate: 0.78,
  };

  const mockInsights = [
    'Reels typically see highest engagement during evening hours (7-10 PM) when users are relaxing.',
    'Your best posting window is Prime Time (7 PM - 10 PM) with 78% success rate.',
    'This recommendation is based on strong historical data with high confidence.',
  ];

  it('renders best time to post section', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('Best Time to Post')).toBeInTheDocument();
    expect(screen.getByText('Any Day')).toBeInTheDocument();
    expect(screen.getByText('7 PM - 10 PM')).toBeInTheDocument();
  });

  it('displays confidence level correctly', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('high confidence')).toBeInTheDocument();
  });

  it('displays success rate percentage', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('78% historical success rate')).toBeInTheDocument();
  });

  it('renders all recommended windows', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('Prime Time')).toBeInTheDocument();
    expect(screen.getByText('Early Morning')).toBeInTheDocument();
    expect(screen.getByText('Lunch Break')).toBeInTheDocument();
  });

  it('displays window scores', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('renders insights section', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('Insights')).toBeInTheDocument();
    mockInsights.forEach((insight) => {
      expect(screen.getByText(insight)).toBeInTheDocument();
    });
  });

  it('renders loading state when isLoading is true', () => {
    const { container } = render(
      <ViralTimingCard
        recommendedWindows={[]}
        bestOverallTime={{
          dayOfWeek: 0,
          hour: 0,
          dayName: '',
          timeLabel: '',
          confidence: 'low',
          successRate: 0,
        }}
        insights={[]}
        isLoading={true}
      />
    );

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays high confidence in green', () => {
    const { container } = render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    const confidenceBadge = container.querySelector('.text-green-400');
    expect(confidenceBadge).toBeInTheDocument();
  });

  it('renders window success rates', () => {
    render(
      <ViralTimingCard
        recommendedWindows={mockWindows}
        bestOverallTime={mockBestTime}
        insights={mockInsights}
      />
    );

    expect(screen.getByText('78% success')).toBeInTheDocument();
    expect(screen.getByText('72% success')).toBeInTheDocument();
    expect(screen.getByText('68% success')).toBeInTheDocument();
  });
});
