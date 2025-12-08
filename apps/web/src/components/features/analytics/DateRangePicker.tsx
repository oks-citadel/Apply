'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const presets = [
  { label: 'Last 7 days', getValue: () => ({ startDate: subDays(new Date(), 7), endDate: new Date() }) },
  { label: 'Last 30 days', getValue: () => ({ startDate: subDays(new Date(), 30), endDate: new Date() }) },
  { label: 'Last 90 days', getValue: () => ({ startDate: subDays(new Date(), 90), endDate: new Date() }) },
  { label: 'This week', getValue: () => ({ startDate: startOfWeek(new Date()), endDate: endOfWeek(new Date()) }) },
  { label: 'This month', getValue: () => ({ startDate: startOfMonth(new Date()), endDate: endOfMonth(new Date()) }) },
  { label: 'This year', getValue: () => ({ startDate: startOfYear(new Date()), endDate: endOfYear(new Date()) }) },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(format(value.startDate, 'yyyy-MM-dd'));
  const [tempEndDate, setTempEndDate] = useState(format(value.endDate, 'yyyy-MM-dd'));

  const handleApply = () => {
    onChange({
      startDate: new Date(tempStartDate),
      endDate: new Date(tempEndDate),
    });
    setIsOpen(false);
  };

  const handlePreset = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    onChange(range);
    setTempStartDate(format(range.startDate, 'yyyy-MM-dd'));
    setTempEndDate(format(range.endDate, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        <span className="text-sm">
          {format(value.startDate, 'MMM d, yyyy')} - {format(value.endDate, 'MMM d, yyyy')}
        </span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-lg w-[400px] p-4">
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Quick Select
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      onClick={() => handlePreset(preset)}
                      className="px-3 py-2 text-sm text-left bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Custom Range
                </label>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={tempStartDate}
                      onChange={(e) => setTempStartDate(e.target.value)}
                      max={tempEndDate}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={tempEndDate}
                      onChange={(e) => setTempEndDate(e.target.value)}
                      min={tempStartDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end border-t pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApply}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
