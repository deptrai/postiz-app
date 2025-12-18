import React from 'react';
import { render, screen } from '@testing-library/react';
import { CTAAnalysis } from './cta-analysis';
import { CTAAnalysis as CTAAnalysisType } from './content-elements-card';

// Mock the translation hook
jest.mock('@gitroom/react/translation/get.transation.service.client', () => ({
  useT: () => (key: string, fallback: string) => fallback,
}));

describe('CTAAnalysis', () => {
  const mockAnalysis: CTAAnalysisType = {
    detected: true,
    types: [
      {
        type: 'engagement',
        text: 'Comment below with your thoughts!',
        effectiveness: 85,
        position: 'end',
      },
      {
        type: 'save',
        text: 'Save this for later!',
        effectiveness: 78,
        position: 'end',
      },
    ],
    overallEffectiveness: 82,
    suggestions: [
      'Strong call-to-action detected',
      'Consider adding a share CTA',
    ],
  };

  it('renders CTA analysis heading', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Call-to-Action Analysis')).toBeInTheDocument();
  });

  it('displays overall effectiveness score', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('82')).toBeInTheDocument();
  });

  it('shows CTA detected status', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText(/2 CTAs detected/)).toBeInTheDocument();
  });

  it('renders all CTA types', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('engagement')).toBeInTheDocument();
    expect(screen.getByText('save')).toBeInTheDocument();
  });

  it('displays CTA text', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Comment below with your thoughts!')).toBeInTheDocument();
    expect(screen.getByText('Save this for later!')).toBeInTheDocument();
  });

  it('shows CTA effectiveness scores', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('78%')).toBeInTheDocument();
  });

  it('displays CTA positions', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    const endPositions = screen.getAllByText('end');
    expect(endPositions.length).toBeGreaterThanOrEqual(2);
  });

  it('renders suggestions', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('Strong call-to-action detected')).toBeInTheDocument();
    expect(screen.getByText('Consider adding a share CTA')).toBeInTheDocument();
  });

  it('shows engagement CTA icon', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('💬')).toBeInTheDocument();
  });

  it('shows save CTA icon', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(screen.getByText('📌')).toBeInTheDocument();
  });

  it('handles no CTA detected', () => {
    const noCTAAnalysis: CTAAnalysisType = {
      detected: false,
      types: [],
      overallEffectiveness: 0,
      suggestions: ['Add a clear call-to-action'],
    };

    render(<CTAAnalysis analysis={noCTAAnalysis} />);

    expect(screen.getByText(/No CTA detected/)).toBeInTheDocument();
  });

  it('displays action CTA type', () => {
    const actionCTAAnalysis: CTAAnalysisType = {
      detected: true,
      types: [
        {
          type: 'action',
          text: 'Click the link in bio!',
          effectiveness: 65,
          position: 'end',
        },
      ],
      overallEffectiveness: 65,
      suggestions: [],
    };

    render(<CTAAnalysis analysis={actionCTAAnalysis} />);

    expect(screen.getByText('action')).toBeInTheDocument();
    expect(screen.getByText('👆')).toBeInTheDocument();
  });

  it('displays share CTA type', () => {
    const shareCTAAnalysis: CTAAnalysisType = {
      detected: true,
      types: [
        {
          type: 'share',
          text: 'Tag a friend!',
          effectiveness: 72,
          position: 'middle',
        },
      ],
      overallEffectiveness: 72,
      suggestions: [],
    };

    render(<CTAAnalysis analysis={shareCTAAnalysis} />);

    expect(screen.getByText('share')).toBeInTheDocument();
    expect(screen.getByText('📤')).toBeInTheDocument();
  });

  it('shows high effectiveness in green', () => {
    const { container } = render(<CTAAnalysis analysis={mockAnalysis} />);

    const scoreElement = screen.getByText('82');
    expect(scoreElement).toHaveClass('text-green-400');
  });

  it('handles multiple CTA types', () => {
    render(<CTAAnalysis analysis={mockAnalysis} />);

    expect(mockAnalysis.types.length).toBe(2);
    expect(screen.getAllByText(/effectiveness/).length).toBeGreaterThan(0);
  });

  it('displays CTA position start', () => {
    const startCTAAnalysis: CTAAnalysisType = {
      detected: true,
      types: [
        {
          type: 'engagement',
          text: 'Hey! Comment below',
          effectiveness: 80,
          position: 'start',
        },
      ],
      overallEffectiveness: 80,
      suggestions: [],
    };

    render(<CTAAnalysis analysis={startCTAAnalysis} />);

    expect(screen.getByText('start')).toBeInTheDocument();
  });
});
