'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import type { CompanyData } from '@/lib/api/analytics';

interface TopCompaniesChartProps {
  data: CompanyData[];
  isLoading?: boolean;
  limit?: number;
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6'];

export function TopCompaniesChart({ data, isLoading = false, limit = 10 }: TopCompaniesChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Companies Applied To</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center">
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
          <CardTitle>Top Companies Applied To</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-500">
            <p className="text-lg font-medium">No company data available</p>
            <p className="text-sm mt-2">Start applying to jobs to see your top companies</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by applications and limit results
  const topCompanies = [...data]
    .sort((a, b) => b.applications - a.applications)
    .slice(0, limit);

  // Transform data for horizontal bar chart
  const chartData = topCompanies.map((company) => ({
    company: company.company.length > 20 ? company.company.substring(0, 20) + '...' : company.company,
    fullName: company.company,
    Applications: company.applications,
    Responses: company.responses,
    Interviews: company.interviews,
    Offers: company.offers,
    'Response Rate': company.responseRate,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Companies Applied To</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
              />
              <YAxis
                type="category"
                dataKey="company"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                width={90}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(value: number, name: string) => {
                  if (name === 'Response Rate') {
                    return [`${value.toFixed(1)}%`, name];
                  }
                  return [value, name];
                }}
                labelFormatter={(label: string) => {
                  const item = chartData.find((d) => d.company === label);
                  return item?.fullName || label;
                }}
              />
              <Bar dataKey="Applications" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-700">Company</th>
                <th className="text-right py-2 px-2 font-medium text-gray-700">Applications</th>
                <th className="text-right py-2 px-2 font-medium text-gray-700">Responses</th>
                <th className="text-right py-2 px-2 font-medium text-gray-700">Response Rate</th>
              </tr>
            </thead>
            <tbody>
              {topCompanies.slice(0, 5).map((company, index) => (
                <tr key={company.company} className="border-b border-gray-100">
                  <td className="py-2 px-2 flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-900">{company.company}</span>
                  </td>
                  <td className="text-right py-2 px-2 text-gray-600">{company.applications}</td>
                  <td className="text-right py-2 px-2 text-gray-600">{company.responses}</td>
                  <td className="text-right py-2 px-2">
                    <span className="font-medium text-gray-900">{company.responseRate.toFixed(1)}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
