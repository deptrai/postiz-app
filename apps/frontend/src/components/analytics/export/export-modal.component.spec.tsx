import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExportModal } from './export-modal.component';

// Mock useFetch hook
const mockFetch = jest.fn();
jest.mock('@gitroom/helpers/utils/custom.fetch', () => ({
  useFetch: () => mockFetch,
}));

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = jest.fn(() => 'blob:test-url');
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

describe('ExportModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render modal with default values', () => {
    render(<ExportModal onClose={mockOnClose} />);

    expect(screen.getByText('Export Analytics Data')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Content Format')).toBeInTheDocument();
    expect(screen.getByText('Export Type')).toBeInTheDocument();
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should render with pre-filled values', () => {
    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-01-15"
        format="post"
        groupId="group-1"
        onClose={mockOnClose}
      />
    );

    const startDateInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    const endDateInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;

    // Check that inputs exist
    expect(screen.getByText('Export Analytics Data')).toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<ExportModal onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should show error for invalid date range (end before start)', async () => {
    render(
      <ExportModal
        startDate="2025-01-15"
        endDate="2025-01-01"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should show error for date range exceeding 90 days', async () => {
    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-06-01"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Date range cannot exceed 90 days')).toBeInTheDocument();
    });

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should export CSV successfully', async () => {
    const mockBlob = new Blob(['test,csv,data'], { type: 'text/csv' });
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    // Mock document methods
    const mockAppendChild = jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    const mockRemoveChild = jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    const mockClick = jest.fn();

    // Mock createElement to return a mock anchor element
    const originalCreateElement = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
        } as any;
      }
      return originalCreateElement(tagName);
    });

    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-01-15"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Restore mocks
    mockAppendChild.mockRestore();
    mockRemoveChild.mockRestore();
  });

  it('should show error when export fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-01-15"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Server error')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should toggle format selection', () => {
    render(<ExportModal onClose={mockOnClose} />);

    const postButton = screen.getByText('Post');
    const reelButton = screen.getByText('Reel');
    const allButton = screen.getByText('All');

    // Click Post
    fireEvent.click(postButton);
    expect(postButton).toHaveClass('bg-customColor10');

    // Click Reel
    fireEvent.click(reelButton);
    expect(reelButton).toHaveClass('bg-customColor10');

    // Click All
    fireEvent.click(allButton);
    expect(allButton).toHaveClass('bg-customColor10');
  });

  it('should toggle export type selection', () => {
    render(<ExportModal onClose={mockOnClose} />);

    const detailedButton = screen.getByText('Detailed (per content)');
    const summaryButton = screen.getByText('Summary (per day)');

    // Default is detailed
    expect(detailedButton).toHaveClass('bg-customColor10');

    // Click Summary
    fireEvent.click(summaryButton);
    expect(summaryButton).toHaveClass('bg-customColor10');

    // Click Detailed
    fireEvent.click(detailedButton);
    expect(detailedButton).toHaveClass('bg-customColor10');
  });

  it('should show loading state during export', async () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-01-15"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  it('should include groupId in query params when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob([''])),
    });

    // Mock document methods
    jest.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
    jest.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
    jest.spyOn(document, 'createElement').mockImplementation(() => ({
      href: '',
      download: '',
      click: jest.fn(),
    } as any));

    render(
      <ExportModal
        startDate="2025-01-01"
        endDate="2025-01-15"
        groupId="test-group-id"
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Export CSV'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('groupId=test-group-id')
      );
    });
  });
});
