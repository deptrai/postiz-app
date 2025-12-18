import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QualityContentList } from './quality-content-list';

jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('QualityContentList', () => {
  const mockItems = [
    {
      contentId: 'content-1',
      externalContentId: 'ext-1',
      contentType: 'post',
      caption: 'Test post caption',
      publishedAt: '2025-12-01T10:00:00Z',
      integrationId: 'int-1',
      overallScore: 85,
      engagementScore: 80,
      interpretation: 'Excellent quality',
    },
    {
      contentId: 'content-2',
      externalContentId: 'ext-2',
      contentType: 'reel',
      caption: 'Test reel caption',
      publishedAt: '2025-12-02T10:00:00Z',
      integrationId: 'int-1',
      overallScore: 65,
      engagementScore: 70,
      interpretation: 'Good quality',
    },
  ];

  const defaultProps = {
    items: mockItems,
    total: 2,
    isLoading: false,
  };

  it('renders content list with items', () => {
    render(<QualityContentList {...defaultProps} />);
    
    expect(screen.getByText('Content by Quality')).toBeInTheDocument();
    expect(screen.getByText('(2)')).toBeInTheDocument();
  });

  it('renders quality scores for each item', () => {
    render(<QualityContentList {...defaultProps} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('65')).toBeInTheDocument();
  });

  it('renders interpretation badges', () => {
    render(<QualityContentList {...defaultProps} />);
    
    expect(screen.getByText('Excellent quality')).toBeInTheDocument();
    expect(screen.getByText('Good quality')).toBeInTheDocument();
  });

  it('renders content type labels', () => {
    render(<QualityContentList {...defaultProps} />);
    
    expect(screen.getByText('post')).toBeInTheDocument();
    expect(screen.getByText('reel')).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<QualityContentList items={[]} total={0} />);
    
    expect(screen.getByText('No content found')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<QualityContentList {...defaultProps} isLoading={true} />);
    
    const loadingElement = document.querySelector('.animate-pulse');
    expect(loadingElement).toBeInTheDocument();
  });

  it('calls onItemClick when item is clicked', () => {
    const mockOnItemClick = jest.fn();
    render(<QualityContentList {...defaultProps} onItemClick={mockOnItemClick} />);
    
    const firstItem = screen.getByText('Test post caption');
    fireEvent.click(firstItem.closest('div[class*="rounded-lg"]')!);
    
    expect(mockOnItemClick).toHaveBeenCalledWith('content-1');
  });

  it('renders sort buttons', () => {
    render(<QualityContentList {...defaultProps} />);
    
    expect(screen.getByText('Score')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Engagement')).toBeInTheDocument();
  });

  it('calls onSortChange when sort button is clicked', () => {
    const mockOnSortChange = jest.fn();
    render(
      <QualityContentList
        {...defaultProps}
        sortBy="score"
        sortOrder="desc"
        onSortChange={mockOnSortChange}
      />
    );
    
    const dateButton = screen.getByText('Date');
    fireEvent.click(dateButton);
    
    expect(mockOnSortChange).toHaveBeenCalledWith('date', 'desc');
  });

  it('truncates long captions', () => {
    const longCaption = 'A'.repeat(100);
    const itemsWithLongCaption = [
      {
        ...mockItems[0],
        caption: longCaption,
      },
    ];
    
    render(<QualityContentList items={itemsWithLongCaption} total={1} />);
    
    const truncatedText = screen.getByText(/A{60}\.\.\./);
    expect(truncatedText).toBeInTheDocument();
  });

  it('handles null caption gracefully', () => {
    const itemsWithNullCaption = [
      {
        ...mockItems[0],
        caption: null,
      },
    ];
    
    render(<QualityContentList items={itemsWithNullCaption} total={1} />);
    
    expect(screen.getByText('No caption')).toBeInTheDocument();
  });
});
