import React from 'react';
import { render, screen } from '@testing-library/react';
import { JobCard } from '../JobCard';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock lucide-react
jest.mock('lucide-react', () => ({
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
  Briefcase: () => <span data-testid="briefcase-icon">Briefcase</span>,
  Users: () => <span data-testid="users-icon">Users</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  MoreVertical: () => <span data-testid="more-vertical-icon">MoreVertical</span>,
}));

// Mock utils
jest.mock('@/lib/utils', () => ({
  formatDate: (date: string) => 'Jun 15, 2024',
}));

const mockJob = {
  id: '1',
  title: 'Senior Frontend Developer',
  department: 'Engineering',
  location: 'San Francisco, CA',
  type: 'Full-time',
  salary: '$150,000 - $180,000',
  applications: 45,
  views: 234,
  status: 'active' as const,
  postedDate: '2024-06-15',
  description: 'We are looking for an experienced frontend developer to join our team.',
};

describe('JobCard', () => {
  it('renders job title', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
  });

  it('renders job department', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Engineering')).toBeInTheDocument();
  });

  it('renders job location', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('renders job type', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Full-time')).toBeInTheDocument();
  });

  it('renders salary when provided', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('$150,000 - $180,000')).toBeInTheDocument();
  });

  it('renders applications count', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('applications')).toBeInTheDocument();
  });

  it('renders views count', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('234')).toBeInTheDocument();
    expect(screen.getByText('views')).toBeInTheDocument();
  });

  it('renders status badge for active job', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders status badge for draft job', () => {
    const draftJob = { ...mockJob, status: 'draft' as const };
    render(<JobCard job={draftJob} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders status badge for closed job', () => {
    const closedJob = { ...mockJob, status: 'closed' as const };
    render(<JobCard job={closedJob} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(/We are looking for an experienced frontend developer/)).toBeInTheDocument();
  });

  it('renders job without description', () => {
    const jobWithoutDescription = { ...mockJob, description: undefined };
    render(<JobCard job={jobWithoutDescription} />);

    expect(screen.queryByText(/We are looking for an experienced frontend developer/)).not.toBeInTheDocument();
  });

  it('renders without salary when not provided', () => {
    const jobWithoutSalary = { ...mockJob, salary: undefined };
    render(<JobCard job={jobWithoutSalary} />);

    expect(screen.queryByText('$150,000 - $180,000')).not.toBeInTheDocument();
  });

  it('renders View Applications link', () => {
    render(<JobCard job={mockJob} />);

    const viewApplicationsLink = screen.getByRole('link', { name: /View Applications/i });
    expect(viewApplicationsLink).toHaveAttribute('href', '/jobs/1/applications');
  });

  it('renders Manage Job link', () => {
    render(<JobCard job={mockJob} />);

    const manageJobLink = screen.getByRole('link', { name: /Manage Job/i });
    expect(manageJobLink).toHaveAttribute('href', '/jobs/1');
  });

  it('renders job title as a link', () => {
    render(<JobCard job={mockJob} />);

    const titleLink = screen.getByRole('link', { name: /Senior Frontend Developer/i });
    expect(titleLink).toHaveAttribute('href', '/jobs/1');
  });

  it('renders posted date', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByText(/Posted Jun 15, 2024/)).toBeInTheDocument();
  });

  it('renders icons for location, department, users, and eye', () => {
    render(<JobCard job={mockJob} />);

    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument();
    expect(screen.getByTestId('briefcase-icon')).toBeInTheDocument();
    expect(screen.getByTestId('users-icon')).toBeInTheDocument();
    expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
  });

  it('renders more options button', () => {
    render(<JobCard job={mockJob} />);

    const moreButton = screen.getByRole('button');
    expect(moreButton).toBeInTheDocument();
    expect(screen.getByTestId('more-vertical-icon')).toBeInTheDocument();
  });
});
