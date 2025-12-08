'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { analyticsApi, type AnalyticsFilters } from '@/lib/api/analytics';
import { useToast } from '@/hooks/useToast';

interface ExportButtonProps {
  filters?: AnalyticsFilters;
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      const blob = await analyticsApi.exportData(format, filters);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export successful',
        description: `Your analytics data has been exported as ${format.toUpperCase()}.`,
        variant: 'success',
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: 'There was an error exporting your data. Please try again.',
        variant: 'error',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>Export</span>
      </Button>

      {isOpen && !isExporting && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-48 overflow-hidden">
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-100"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as CSV</div>
                <div className="text-xs text-gray-500">Download spreadsheet</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Export as PDF</div>
                <div className="text-xs text-gray-500">Download report</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
