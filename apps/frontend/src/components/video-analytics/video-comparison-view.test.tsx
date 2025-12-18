import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VideoComparisonView } from './video-comparison-view';

// Mock recharts
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('VideoComparisonView', () => {
  const mockComparison = {
    videos: [
      {
        videoId: 'video-1',
        videoTitle: 'Video A',
        curve: {
          videoId: 'video-1',
          videoTitle: 'Video A',
          videoDuration: 60,
          totalViewers: 1000,
          points: [
            { percentage: 0, retention: 100, viewersCount: 1000 },
            { percentage: 10, retention: 90, viewersCount: 900 },
            { percentage: 50, retention: 70, viewersCount: 700 },
            { percentage: 100, retention: 45, viewersCount: 450 },
          ],
          dropOffPoints: [],
          averageRetention: 76.25,
          completionRate: 45,
        },
      },
      {
        videoId: 'video-2',
        videoTitle: 'Video B',
        curve: {
          videoId: 'video-2',
          videoTitle: 'Video B',
          videoDuration: 45,
          totalViewers: 800,
          points: [
            { percentage: 0, retention: 100, viewersCount: 800 },
            { percentage: 10, retention: 80, viewersCount: 640 },
            { percentage: 50, retention: 50, viewersCount: 400 },
            { percentage: 100, retention: 25, viewersCount: 200 },
          ],
          dropOffPoints: [],
          averageRetention: 63.75,
          completionRate: 25,
        },
      },
    ],
    insights: [
      '"Video A" has the highest average retention at 76.3%',
      '"Video A" has the best completion rate at 45.0%',
      '"Video A" has the strongest hook with 90.0% retention at 10%',
    ],
  };

  it('renders comparison heading', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Video Comparison')).toBeInTheDocument();
  });

  it('shows number of videos being compared', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Comparing 2 videos')).toBeInTheDocument();
  });

  it('displays video selector toggles', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Video A')).toBeInTheDocument();
    expect(screen.getByText('Video B')).toBeInTheDocument();
  });

  it('shows video stats in toggles', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText(/Avg: 76.3%/)).toBeInTheDocument();
    expect(screen.getByText(/Completion: 45.0%/)).toBeInTheDocument();
  });

  it('renders chart component', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('displays comparison table', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Avg Retention')).toBeInTheDocument();
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    expect(screen.getByText('Hook Retention (10%)')).toBeInTheDocument();
  });

  it('shows insights section', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Key Insights')).toBeInTheDocument();
    expect(screen.getByText('"Video A" has the highest average retention at 76.3%')).toBeInTheDocument();
  });

  it('displays winner badge', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('Best Performer')).toBeInTheDocument();
    expect(screen.getByText('Video A')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(<VideoComparisonView comparison={mockComparison} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('toggles video visibility', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    
    const videoToggle = screen.getAllByRole('button')[0];
    fireEvent.click(videoToggle);
    
    // Video should still be visible since at least 1 must remain
    expect(screen.getByText('Video A')).toBeInTheDocument();
  });

  it('displays total viewers for each video', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
  });

  it('shows video duration', () => {
    render(<VideoComparisonView comparison={mockComparison} />);
    expect(screen.getByText('60s')).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
  });
});
