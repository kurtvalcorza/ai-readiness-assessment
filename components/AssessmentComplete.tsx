/**
 * Assessment completion component with download options
 */

import { Download, FileText, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { ErrorAlert } from './ErrorAlert';

interface AssessmentCompleteProps {
  report: string;
  onStartNew: () => void;
}

export function AssessmentComplete({ report, onStartNew }: AssessmentCompleteProps) {
  const [pdfError, setPdfError] = useState('');

  /**
   * Downloads the report as a Markdown file
   */
  const downloadMarkdown = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Assessment-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  /**
   * Generates and downloads the report as a PDF
   */
  const downloadPDF = async () => {
    try {
      setPdfError('');

      // Dynamically import html2pdf.js (client-side only)
      const html2pdf = (await import('html2pdf.js')).default;
      const { default: ReactMarkdown } = await import('react-markdown');
      const { default: remarkGfm } = await import('remark-gfm');
      const { createRoot } = await import('react-dom/client');

      // Create container for rendering
      const container = document.createElement('div');
      container.style.cssText = `
        padding: 20px;
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.6;
        color: #000;
      `;

      // Create and render React content
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          <div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
          </div>
        );
        // Give React time to render
        setTimeout(() => resolve(), 100);
      });

      // Configure PDF options
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `AI-Assessment-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
      };

      // Generate and download PDF
      await html2pdf().set(options).from(container).save();

      // Cleanup
      root.unmount();
    } catch (error) {
      console.error('Error generating PDF:', error);
      setPdfError(
        'Failed to generate PDF. Please try downloading the Markdown version instead.'
      );
    }
  };

  return (
    <div className="space-y-4" role="region" aria-label="Assessment complete">
      {pdfError && <ErrorAlert message={pdfError} onClose={() => setPdfError('')} />}

      <div className="p-6 bg-green-50 border-2 border-green-300 rounded-xl text-center">
        <h2 className="text-xl font-bold text-green-800 mb-2">Assessment Complete!</h2>
        <p className="text-gray-700 mb-4">
          Your AI readiness assessment has been completed and saved. Download your report below.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={downloadMarkdown}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-sm"
            aria-label="Download assessment report as Markdown file"
          >
            <Download size={20} aria-hidden="true" />
            Download MD
          </button>
          <button
            onClick={downloadPDF}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition flex items-center gap-2 font-medium shadow-sm"
            aria-label="Download assessment report as PDF file"
          >
            <FileText size={20} aria-hidden="true" />
            Download PDF
          </button>
          <button
            onClick={onStartNew}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition flex items-center gap-2 font-medium shadow-sm"
            aria-label="Start a new assessment"
          >
            <RefreshCw size={20} aria-hidden="true" />
            Start New Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
