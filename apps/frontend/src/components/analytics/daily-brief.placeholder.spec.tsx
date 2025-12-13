import { render, screen } from '@testing-library/react';
import { DailyBriefPlaceholder } from './daily-brief.placeholder';

// Mock useSWR
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: {
      date: '2025-12-13',
      organizationId: 'test-org-id',
      summary: {
        totalPosts: 0,
        totalEngagement: 0,
        topPerformer: null,
      },
      recommendations: [],
      trends: [],
      format: 'json',
    },
    isLoading: false,
  })),
}));

// Mock useFetch
jest.mock('@gitroom/helpers/utils/custom.fetch', () => ({
  useFetch: jest.fn(() => jest.fn()),
}));

describe('DailyBriefPlaceholder', () => {
  it('should render without crashing', () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText('Daily Brief')).toBeInTheDocument();
  });

  it('should display placeholder message', () => {
    render(<DailyBriefPlaceholder />);
    expect(
      screen.getByText(
        /Your analytics intelligence dashboard is being set up/i
      )
    ).toBeInTheDocument();
  });

  it('should display summary metrics', () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText('Total Posts')).toBeInTheDocument();
    expect(screen.getByText('Total Engagement')).toBeInTheDocument();
    expect(screen.getByText('Top Performer')).toBeInTheDocument();
  });

  it('should display date and organization info', () => {
    render(<DailyBriefPlaceholder />);
    expect(screen.getByText(/Date: 2025-12-13/i)).toBeInTheDocument();
    expect(screen.getByText(/Organization: test-org-id/i)).toBeInTheDocument();
  });
});
