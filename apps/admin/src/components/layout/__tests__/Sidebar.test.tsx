import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '../Sidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  LayoutDashboard: () => <span data-testid="layout-dashboard-icon">LayoutDashboard</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Activity: () => <span data-testid="activity-icon">Activity</span>,
  BarChart3: () => <span data-testid="bar-chart-icon">BarChart3</span>,
  Flag: () => <span data-testid="flag-icon">Flag</span>,
  Settings: () => <span data-testid="settings-icon">Settings</span>,
  ChevronLeft: () => <span data-testid="chevron-left-icon">ChevronLeft</span>,
  ChevronRight: () => <span data-testid="chevron-right-icon">ChevronRight</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  Database: () => <span data-testid="database-icon">Database</span>,
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
}));

describe('Sidebar', () => {
  it('renders the sidebar', () => {
    render(<Sidebar />);

    // Check that main navigation items are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('renders the logo', () => {
    render(<Sidebar />);

    expect(screen.getByText('JobPilot Admin')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<Sidebar />);

    const expectedItems = [
      'Dashboard',
      'Users',
      'Services',
      'Analytics',
      'Feature Flags',
      'Audit Logs',
      'Notifications',
      'Database',
      'Security',
      'Settings',
    ];

    expectedItems.forEach(item => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it('has correct navigation links', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');

    const usersLink = screen.getByRole('link', { name: /Users/i });
    expect(usersLink).toHaveAttribute('href', '/users');

    const settingsLink = screen.getByRole('link', { name: /Settings/i });
    expect(settingsLink).toHaveAttribute('href', '/settings');
  });

  it('renders collapse toggle button', () => {
    render(<Sidebar />);

    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    expect(collapseButton).toBeInTheDocument();
  });

  it('toggles collapse state when button is clicked', () => {
    render(<Sidebar />);

    // Initially expanded - should show logo text
    expect(screen.getByText('JobPilot Admin')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByRole('button', { name: /collapse sidebar/i });
    fireEvent.click(collapseButton);

    // After collapse, logo text should not be visible
    expect(screen.queryByText('JobPilot Admin')).not.toBeInTheDocument();

    // Expand button should now be visible
    const expandButton = screen.getByRole('button', { name: /expand sidebar/i });
    expect(expandButton).toBeInTheDocument();
  });

  it('renders icons for each navigation item', () => {
    render(<Sidebar />);

    expect(screen.getByTestId('layout-dashboard-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    expect(screen.getByTestId('settings-icon')).toBeInTheDocument();
  });

  it('highlights the current route', () => {
    render(<Sidebar />);

    // Dashboard should be active (current path is '/')
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(dashboardLink).toHaveClass('bg-gray-800', 'text-white');
  });
});
