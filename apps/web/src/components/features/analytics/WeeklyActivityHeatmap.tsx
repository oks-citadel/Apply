'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface ActivityData {
  day: string;
  hour: number;
  value: number;
}

interface WeeklyActivityHeatmapProps {
  data: ActivityData[];
  isLoading?: boolean;
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = Array.from({ length: 24 }, (_, i) => i);

function getIntensityClass(value: number, maxValue: number): string {
  if (value === 0) return 'bg-gray-100';
  const intensity = value / maxValue;
  if (intensity < 0.25) return 'bg-primary-100';
  if (intensity < 0.5) return 'bg-primary-300';
  if (intensity < 0.75) return 'bg-primary-500';
  return 'bg-primary-700';
}

export function WeeklyActivityHeatmap({ data, isLoading = false }: WeeklyActivityHeatmapProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const getValueForCell = (day: string, hour: number): number => {
    const cell = data.find((d) => d.day === day && d.hour === hour);
    return cell?.value || 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-1 mb-2">
              <div className="w-10" />
              {hours.filter((h) => h % 3 === 0).map((hour) => (
                <div
                  key={hour}
                  className="flex-1 text-xs text-gray-500 text-center"
                >
                  {hour.toString().padStart(2, '0')}
                </div>
              ))}
            </div>
            {days.map((day) => (
              <div key={day} className="flex gap-1 mb-1">
                <div className="w-10 text-xs text-gray-600 flex items-center">
                  {day}
                </div>
                <div className="flex-1 flex gap-0.5">
                  {hours.map((hour) => {
                    const value = getValueForCell(day, hour);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className={`flex-1 h-6 rounded-sm ${getIntensityClass(value, maxValue)} transition-colors hover:ring-2 hover:ring-primary-400`}
                        title={`${day} ${hour}:00 - ${value} activities`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex items-center justify-end gap-2 mt-4">
              <span className="text-xs text-gray-500">Less</span>
              <div className="flex gap-1">
                <div className="w-4 h-4 rounded-sm bg-gray-100" />
                <div className="w-4 h-4 rounded-sm bg-primary-100" />
                <div className="w-4 h-4 rounded-sm bg-primary-300" />
                <div className="w-4 h-4 rounded-sm bg-primary-500" />
                <div className="w-4 h-4 rounded-sm bg-primary-700" />
              </div>
              <span className="text-xs text-gray-500">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
