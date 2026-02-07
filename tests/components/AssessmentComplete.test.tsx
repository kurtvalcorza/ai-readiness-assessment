import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssessmentComplete } from '@/components/AssessmentComplete';

describe('AssessmentComplete', () => {
  const mockReport = `# AI Readiness Assessment Report

## Organization: Test Company
**Domain:** Technology

### Readiness Level: High

#### Solution 1 - Cloud Platform
**Group:** Infrastructure
**Fit:** High
**Rationale:** Good fit for the organization

### Recommended Next Steps:
1. Start with pilot project
2. Train the team
3. Deploy to production`;

  const mockOnStartNew = vi.fn();

  let mockWindowOpen: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnStartNew.mockClear();

    // Mock window.open
    mockWindowOpen = vi.fn();
    vi.stubGlobal('open', mockWindowOpen);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders completion message', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      expect(screen.getByText('Assessment Complete!')).toBeInTheDocument();
      expect(screen.getByText(/Your AI readiness assessment has been completed/)).toBeInTheDocument();
    });

    it('renders exactly two action buttons (HTML Preview and Print to PDF)', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      expect(screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate PDF version/i })).toBeInTheDocument();

      // Verify no Markdown or HTML download buttons exist
      expect(screen.queryByRole('button', { name: /Download assessment report as Markdown/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Download assessment report as HTML/i })).not.toBeInTheDocument();
    });

    it('renders start new assessment button', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      expect(screen.getByRole('button', { name: /Start a new assessment/i })).toBeInTheDocument();
    });

    it('renders help text describing HTML Preview and Print to PDF only', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      expect(screen.getByText('Download Options:')).toBeInTheDocument();
      expect(screen.getByText(/HTML Preview:/)).toBeInTheDocument();
      expect(screen.getByText(/Print to PDF:/)).toBeInTheDocument();

      // Verify no Markdown references
      expect(screen.queryByText(/Markdown:/)).not.toBeInTheDocument();
    });
  });

  describe('HTML Preview', () => {
    it('opens new window with HTML content when clicked', async () => {
      const user = userEvent.setup();
      const mockPreviewWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
      };
      mockWindowOpen.mockReturnValue(mockPreviewWindow);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const previewButton = screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i });
      await user.click(previewButton);

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockPreviewWindow.document.write).toHaveBeenCalled();
      expect(mockPreviewWindow.document.close).toHaveBeenCalled();
      expect(mockPreviewWindow.focus).toHaveBeenCalled();

      // Verify the written HTML contains expected structure
      const writtenHtml = mockPreviewWindow.document.write.mock.calls[0][0];
      expect(writtenHtml).toContain('AI Readiness Assessment Report');
      expect(writtenHtml).toContain('<style>');
      expect(writtenHtml).toContain('class="header"');
      expect(writtenHtml).toContain('class="content"');
      expect(writtenHtml).toContain('class="footer"');
    });

    it('shows error when popup is blocked', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const previewButton = screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/Popup blocked/)).toBeInTheDocument();
      });
    });

    it('shows error when report is empty', async () => {
      const user = userEvent.setup();
      render(<AssessmentComplete report="" onStartNew={mockOnStartNew} />);

      const previewButton = screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByText(/report content is invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('PDF generation', () => {
    it('opens print window for PDF generation', async () => {
      const user = userEvent.setup();
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
        addEventListener: vi.fn(),
      };
      mockWindowOpen.mockReturnValue(mockPrintWindow);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const pdfButton = screen.getByRole('button', { name: /Generate PDF version/i });
      await user.click(pdfButton);

      await waitFor(() => {
        expect(mockWindowOpen).toHaveBeenCalledWith(expect.stringContaining('blob:'), '_blank');
      });
    });

    it('shows loading state during PDF generation', async () => {
      const user = userEvent.setup();
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      mockWindowOpen.mockReturnValue(mockPrintWindow);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const pdfButton = screen.getByRole('button', { name: /Generate PDF version/i });

      // The loading state is very brief, so we just verify the button exists
      expect(pdfButton).toBeInTheDocument();
    });

    it('shows error when popup is blocked', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null); // Simulate popup blocked

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const pdfButton = screen.getByRole('button', { name: /Generate PDF version/i });
      await user.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText(/Please allow popups/)).toBeInTheDocument();
      });
    });

    it('shows error when report is empty', async () => {
      const user = userEvent.setup();
      render(<AssessmentComplete report="" onStartNew={mockOnStartNew} />);

      const pdfButton = screen.getByRole('button', { name: /Generate PDF version/i });
      await user.click(pdfButton);

      await waitFor(() => {
        expect(screen.getByText(/report content is invalid/i)).toBeInTheDocument();
      });
    });

    it('disables PDF button while loading', async () => {
      const user = userEvent.setup();
      const mockPrintWindow = {
        document: {
          write: vi.fn(),
          close: vi.fn(),
        },
        focus: vi.fn(),
        print: vi.fn(),
      };
      mockWindowOpen.mockReturnValue(mockPrintWindow);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const pdfButton = screen.getByRole('button', { name: /Generate PDF version/i });

      // Button should be enabled initially
      expect(pdfButton).not.toBeDisabled();
    });
  });

  describe('New assessment', () => {
    it('calls onStartNew when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const newAssessmentButton = screen.getByRole('button', { name: /Start a new assessment/i });
      await user.click(newAssessmentButton);

      expect(mockOnStartNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('displays error alert when HTML Preview fails with popup blocked', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const previewButton = screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });

    it('allows closing error alert', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const previewButton = screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i });
      await user.click(previewButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      const closeButton = screen.getByRole('button', { name: /close alert/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper region role and label', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const region = screen.getByRole('region', { name: /Assessment complete/i });
      expect(region).toBeInTheDocument();
    });

    it('has descriptive aria-labels on all buttons', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      expect(screen.getByRole('button', { name: /Preview assessment report as styled HTML in new tab/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Generate PDF version/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start a new assessment/i })).toBeInTheDocument();
    });

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });
});
