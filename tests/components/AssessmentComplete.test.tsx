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

    it('renders View Report button', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      expect(screen.getByRole('button', { name: /View assessment report/i })).toBeInTheDocument();
    });

    it('renders start new assessment button', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      expect(screen.getByRole('button', { name: /Start a new assessment/i })).toBeInTheDocument();
    });

    it('renders help text about Print to PDF', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      expect(screen.getByText(/Opens your report in a new tab/)).toBeInTheDocument();
    });
  });

  describe('View Report', () => {
    it('opens new window with HTML content including print button', async () => {
      const user = userEvent.setup();
      const mockPreviewWindow = {
        document: { write: vi.fn(), close: vi.fn() },
        focus: vi.fn(),
      };
      mockWindowOpen.mockReturnValue(mockPreviewWindow);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      const viewButton = screen.getByRole('button', { name: /View assessment report/i });
      await user.click(viewButton);

      expect(mockWindowOpen).toHaveBeenCalledWith('', '_blank');
      expect(mockPreviewWindow.document.write).toHaveBeenCalled();
      expect(mockPreviewWindow.document.close).toHaveBeenCalled();
      expect(mockPreviewWindow.focus).toHaveBeenCalled();

      const writtenHtml = mockPreviewWindow.document.write.mock.calls[0][0];
      expect(writtenHtml).toContain('AI Readiness Assessment Report');
      expect(writtenHtml).toContain('window.print()');
      expect(writtenHtml).toContain('Print to PDF');
      expect(writtenHtml).toContain('class="header"');
      expect(writtenHtml).toContain('class="content"');
      expect(writtenHtml).toContain('class="footer"');
    });

    it('shows error when popup is blocked', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      const viewButton = screen.getByRole('button', { name: /View assessment report/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/Popup blocked/)).toBeInTheDocument();
      });
    });

    it('shows error when report is empty', async () => {
      const user = userEvent.setup();
      render(<AssessmentComplete report="" onStartNew={mockOnStartNew} />);

      const viewButton = screen.getByRole('button', { name: /View assessment report/i });
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(/report content is invalid/i)).toBeInTheDocument();
      });
    });
  });

  describe('New assessment', () => {
    it('calls onStartNew when button is clicked', async () => {
      const user = userEvent.setup();
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);

      const newButton = screen.getByRole('button', { name: /Start a new assessment/i });
      await user.click(newButton);

      expect(mockOnStartNew).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error handling', () => {
    it('displays error alert and allows closing it', async () => {
      const user = userEvent.setup();
      mockWindowOpen.mockReturnValue(null);

      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      const viewButton = screen.getByRole('button', { name: /View assessment report/i });
      await user.click(viewButton);

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
      expect(screen.getByRole('region', { name: /Assessment complete/i })).toBeInTheDocument();
    });

    it('has descriptive aria-labels on all buttons', () => {
      render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      expect(screen.getByRole('button', { name: /View assessment report/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start a new assessment/i })).toBeInTheDocument();
    });

    it('hides decorative icons from screen readers', () => {
      const { container } = render(<AssessmentComplete report={mockReport} onStartNew={mockOnStartNew} />);
      const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenIcons.length).toBeGreaterThan(0);
    });
  });
});
