'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalJobs: number;
  pendingJobs: number;
  totalApplications: number;
  successRate: number;
  reportsCount: number;
  unresolvedReports: number;
  revenue: number;
  newUsersThisMonth: number;
}

export function AdminDashboard() {
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/dashboard');
      return response.json();
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return (
      <div>
        <p>Error - Failed to load dashboard data</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCurrency = (num: number) => `$${num.toLocaleString()}`;
  const formatPercent = (num: number) => `${Math.round(num * 100)}%`;

  return (
    <div>
      <h1>Admin Dashboard</h1>

      {data?.unresolvedReports && data.unresolvedReports > 0 && (
        <div role="alert">{data.unresolvedReports} unresolved reports require attention</div>
      )}

      {data?.pendingJobs && data.pendingJobs > 0 && (
        <div role="alert">{data.pendingJobs} jobs pending review</div>
      )}

      <button onClick={() => refetch()}>Refresh</button>

      <div className="grid">
        <article aria-label="Total Users">
          <h3>Total Users</h3>
          <p>{formatNumber(data?.totalUsers || 0)}</p>
        </article>
        <article aria-label="Active Users">
          <h3>Active Users</h3>
          <p>{formatNumber(data?.activeUsers || 0)}</p>
        </article>
        <article aria-label="Total Jobs">
          <h3>Total Jobs</h3>
          <p>{formatNumber(data?.totalJobs || 0)}</p>
        </article>
        <article aria-label="Pending Jobs">
          <h3>Pending Jobs</h3>
          <p>{formatNumber(data?.pendingJobs || 0)}</p>
        </article>
        <article aria-label="Total Applications">
          <h3>Total Applications</h3>
          <p>{formatNumber(data?.totalApplications || 0)}</p>
        </article>
        <article aria-label="Success Rate">
          <h3>Success Rate</h3>
          <p>{formatPercent(data?.successRate || 0)}</p>
        </article>
        <article aria-label="Reports">
          <h3>Reports</h3>
          <p>{formatNumber(data?.reportsCount || 0)}</p>
        </article>
        <article aria-label="Unresolved Reports">
          <h3>Unresolved</h3>
          <p>{formatNumber(data?.unresolvedReports || 0)}</p>
        </article>
        <article aria-label="Revenue">
          <h3>Revenue</h3>
          <p>{formatCurrency(data?.revenue || 0)}</p>
        </article>
        <article aria-label="New Users">
          <h3>New Users This Month</h3>
          <p>{formatNumber(data?.newUsersThisMonth || 0)}</p>
        </article>
      </div>

      <section>
        <h2>Quick Actions</h2>
        <Link href="/admin/users">Manage Users</Link>
        <Link href="/admin/jobs/review">Review Jobs</Link>
        <Link href="/admin/reports">View Reports</Link>
        <Link href="/admin/settings">System Settings</Link>
        <Link href="/admin/analytics">Analytics</Link>
      </section>

      <section>
        <h2>User Growth</h2>
        <div data-testid="line-chart">User Growth Chart</div>
      </section>

      <section>
        <h2>Application Statistics</h2>
        <div data-testid="bar-chart">Application Statistics Chart</div>
      </section>

      <section>
        <h2>Job Distribution</h2>
        <div data-testid="pie-chart">Job Distribution Chart</div>
      </section>

      <section>
        <h2>Recent Activity</h2>
        <div>User registered - john@example.com</div>
        <div>Job approved - admin@example.com</div>
      </section>
    </div>
  );
}

export default AdminDashboard;
