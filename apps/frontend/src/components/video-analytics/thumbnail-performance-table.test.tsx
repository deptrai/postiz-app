import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThumbnailPerformanceTable, ThumbnailPerformance } from './thumbnail-performance-table';

const mockThumbnails: ThumbnailPerformance[] = [
  {
    videoId: 'video-1',
    videoTitle: 'Best Video Ever',
    style: 'face',
    impressions: 50000,
    clicks: 5000,
    ctr: 10,
    publishedAt: new Date('2024-01-15'),
  },
  {
    videoId: 'video-2',
    videoTitle: 'Another Great Video',
    style: 'text-heavy',
    impressions: 30000,
    clicks: 1500,
    ctr: 5,
    publishedAt: new Date('2024-01-10'),
  },
  {
    videoId: 'video-3',
    videoTitle: 'Needs Improvement',
    style: 'minimal',
    impressions: 20000,
    clicks: 400,
    ctr: 2,
    publishedAt: new Date('2024-01-05'),
  },
];

describe('ThumbnailPerformanceTable', () => {
  it('renders the heading', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText('Thumbnail Performance')).toBeInTheDocument();
  });

  it('displays total videos and average CTR', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText(/3 videos/)).toBeInTheDocument();
    expect(screen.getByText(/5.67%/)).toBeInTheDocument();
  });

  it('displays best performer', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
        bestPerformer={mockThumbnails[0]}
        worstPerformer={mockThumbnails[2]}
      />
    );
    expect(screen.getByText('🏆 Best Performer')).toBeInTheDocument();
    expect(screen.getByText('Best Video Ever')).toBeInTheDocument();
    expect(screen.getByText('10% CTR')).toBeInTheDocument();
  });

  it('displays worst performer', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
        bestPerformer={mockThumbnails[0]}
        worstPerformer={mockThumbnails[2]}
      />
    );
    expect(screen.getByText('📉 Needs Improvement')).toBeInTheDocument();
    expect(screen.getByText('2% CTR')).toBeInTheDocument();
  });

  it('displays video titles in table', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText('Another Great Video')).toBeInTheDocument();
  });

  it('displays style badges', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText('Face + Emotion')).toBeInTheDocument();
    expect(screen.getByText('Text-Heavy')).toBeInTheDocument();
    expect(screen.getByText('Minimal')).toBeInTheDocument();
  });

  it('displays CTR values', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
    expect(screen.getByText('2%')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={[]}
        totalVideos={0}
        avgCtr={0}
        isLoading={true}
      />
    );
    expect(screen.queryByText('Thumbnail Performance')).not.toBeInTheDocument();
  });

  it('displays style filter dropdown', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('displays table headers', () => {
    render(
      <ThumbnailPerformanceTable
        thumbnails={mockThumbnails}
        totalVideos={3}
        avgCtr={5.67}
      />
    );
    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Style')).toBeInTheDocument();
    expect(screen.getByText(/Impressions/)).toBeInTheDocument();
    expect(screen.getByText(/Clicks/)).toBeInTheDocument();
    expect(screen.getByText(/CTR/)).toBeInTheDocument();
  });
});
