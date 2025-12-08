'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { ResponseTrend } from '@/lib/api/analytics';

interface ResponseRateChartProps {
  data: ResponseTrend[];
  isLoading?: boolean;
}

export function ResponseRateChart({ data, isLoading = false }: ResponseRateChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse bg-gray-200 rounded w-full h-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Response Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium">No response data available</p>
            <p className="text-sm mt-2">Response trends will appear once you start receiving responses</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = data.map((item) => ({
    period: item.period,
    'Response Rate (%)': item.responseRate,
    'Avg Response Time (days)': item.avgResponseTime,
    'Total Responses': item.totalResponses,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Rate Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Response Rate (%)') {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  if (name === 'Avg Response Time (days)') {
                    return [`${value.toFixed(1)} days`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                dataKey="Response Rate (%)"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
              <Bar
                dataKey="Avg Response Time (days)"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {(data.reduce((sum, item) => sum + item.responseRate, 0) / data.length).toFixed(1)}%
            </p>
            <p className="text-xs text-gray-600">Avg Response Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {(data.reduce((sum, item) => sum + item.avgResponseTime, 0) / data.length).toFixed(1)}
            </p>
            <p className="text-xs text-gray-600">Avg Response Time (days)</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {data.reduce((sum, item) => sum + item.totalResponses, 0)}
            </p>
            <p className="text-xs text-gray-600">Total Responses</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
