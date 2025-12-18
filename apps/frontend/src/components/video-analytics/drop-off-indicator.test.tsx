import React from 'react';
import { render, screen } from '@testing-library/react';
import { DropOffIndicator } from './drop-off-indicator';

describe('DropOffIndicator', () => {
  const mockDropOffPoints = [
    { percentage: 10, dropAmount: 15, severity: 'high' as const, viewerLoss: 150 },
    { percentage: 40, dropAmount: 12, severity: 'medium' as const, viewerLoss: 120 },
    { percentage: 80, dropAmount: 10, severity: 'low' as const, viewerLoss: 100 },
  ];

  it('renders drop-off heading', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText('Drop-off Points Detected')).toBeInTheDocument();
  });

  it('shows count of drop-offs', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText(/3 significant retention drop/)).toBeInTheDocument();
  });

  it('displays no drop-offs message when empty', () => {
    render(<DropOffIndicator dropOffPoints={[]} totalViewers={1000} />);
    expect(screen.getByText('No Significant Drop-offs')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    const { container } = render(
      <DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} isLoading={true} />
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays drop percentage', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText('-15.0%')).toBeInTheDocument();
  });

  it('shows viewer loss count', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('displays impact summary', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText('Impact Summary')).toBeInTheDocument();
    expect(screen.getByText('370')).toBeInTheDocument(); // Total loss
  });

  it('shows average drop size', () => {
    render(<DropOffIndicator dropOffPoints={mockDropOffPoints} totalViewers={1000} />);
    expect(screen.getByText('12.3%')).toBeInTheDocument(); // (15+12+10)/3
  });
});
