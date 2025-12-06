'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface StatusData {
  name: string;
  value: number;
  color: string;
}

interface ApplicationsPieChartProps {
  data?: StatusData[];
  isLoading?: boolean;
}

const DEFAULT_COLORS = {
  pending: '#f59e0b',
  reviewed: '#3b82f6',
  interview: '#10b981',
  offer: '#8b5cf6',
  rejected: '#ef4444',
};

const defaultData: StatusData[] = [
  { name: 'Pending', value: 0, color: DEFAULT_COLORS.pending },
  { name: 'Reviewed', value: 0, color: DEFAULT_COLORS.reviewed },
  { name: 'Interview', value: 0, color: DEFAULT_COLORS.interview },
  { name: 'Offer', value: 0, color: DEFAULT_COLORS.offer },
  { name: 'Rejected', value: 0, color: DEFAULT_COLORS.rejected },
];

export function ApplicationsPieChart({ data = defaultData, isLoading = false }: ApplicationsPieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 rounded-full w-48 h-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No application data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data as any}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [`${value} applications`, '']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span className="text-sm text-gray-600">
                    {value} ({entry.payload.value})
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="text-center mt-4">
          <p className="text-2xl font-bold text-gray-900">{total}</p>
          <p className="text-sm text-gray-500">Total Applications</p>
        </div>
      </CardContent>
    </Card>
  );
}
