import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '../EmptyState';
import { Inbox, FileText, Users } from 'lucide-react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Inbox: () => <div data-testid="inbox-icon">Inbox</div>,
  FileText: () => <div data-testid="file-icon">File</div>,
  Users: () => <div data-testid="users-icon">Users</div>,
}));

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('renders with title only', () => {
      render(<EmptyState title="No results found" />);

      expect(screen.getByText('No results found')).toBeInTheDocument();
    });

    it('renders with title and description', () => {
      render(
        <EmptyState
          title="No applications yet"
          description="Start by applying to your first job."
        />
      );

      expect(screen.getByText('No applications yet')).toBeInTheDocument();
      expect(screen.getByText('Start by applying to your first job.')).toBeInTheDocument();
    });

    it('renders with icon', () => {
      render(
        <EmptyState
          icon={Inbox}
          title="No messages"
        />
      );

      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();
      expect(screen.getByText('No messages')).toBeInTheDocument();
    });

    it('renders without icon when not provided', () => {
      const { container } = render(<EmptyState title="No data" />);

      const iconContainer = container.querySelector('.rounded-full.bg-gray-100');
      expect(iconContainer).not.toBeInTheDocument();
    });

    it('renders with all props', () => {
      const handleClick = jest.fn();

      render(
        <EmptyState
          icon={FileText}
          title="No documents"
          description="You haven't uploaded any documents yet."
          action={{
            label: 'Upload Document',
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
      expect(screen.getByText('No documents')).toBeInTheDocument();
      expect(screen.getByText(/haven't uploaded any documents/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload document/i })).toBeInTheDocument();
    });
  });

  describe('Action Button', () => {
    it('renders action button when action is provided', () => {
      const handleClick = jest.fn();

      render(
        <EmptyState
          title="No items"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      expect(screen.getByRole('button', { name: /add item/i })).toBeInTheDocument();
    });

    it('does not render action button when action is not provided', () => {
      render(<EmptyState title="No items" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('calls action onClick when button is clicked', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <EmptyState
          title="No items"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: /add item/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('calls action onClick multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const handleClick = jest.fn();

      render(
        <EmptyState
          title="No items"
          action={{
            label: 'Add Item',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: /add item/i });
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Visual Elements', () => {
    it('has proper structure and styling classes', () => {
      const { container } = render(<EmptyState title="Empty" />);

      const wrapper = container.querySelector('.flex.flex-col.items-center');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('justify-center', 'py-12', 'text-center');
    });

    it('icon container has proper styling', () => {
      const { container } = render(
        <EmptyState icon={Inbox} title="Empty" />
      );

      const iconContainer = container.querySelector('.w-16.h-16.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('bg-gray-100', 'flex', 'items-center', 'justify-center');
    });

    it('title has proper styling', () => {
      render(<EmptyState title="Empty State Title" />);

      const title = screen.getByText('Empty State Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('description has proper styling', () => {
      render(
        <EmptyState
          title="Title"
          description="Description text"
        />
      );

      const description = screen.getByText('Description text');
      expect(description.tagName).toBe('P');
      expect(description).toHaveClass('max-w-md');
    });
  });

  describe('Common Use Cases', () => {
    it('empty inbox scenario', () => {
      const handleCompose = jest.fn();

      render(
        <EmptyState
          icon={Inbox}
          title="No messages"
          description="Your inbox is empty. Start a conversation!"
          action={{
            label: 'Compose Message',
            onClick: handleCompose,
          }}
        />
      );

      expect(screen.getByTestId('inbox-icon')).toBeInTheDocument();
      expect(screen.getByText('No messages')).toBeInTheDocument();
      expect(screen.getByText(/Your inbox is empty/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /compose message/i })).toBeInTheDocument();
    });

    it('empty list scenario', () => {
      const handleCreate = jest.fn();

      render(
        <EmptyState
          icon={FileText}
          title="No resumes yet"
          description="Create your first resume to get started with job applications."
          action={{
            label: 'Create Resume',
            onClick: handleCreate,
          }}
        />
      );

      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
      expect(screen.getByText('No resumes yet')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create resume/i })).toBeInTheDocument();
    });

    it('search no results scenario', () => {
      render(
        <EmptyState
          title="No results found"
          description="Try adjusting your search criteria or filters."
        />
      );

      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByText(/Try adjusting your search/)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('empty team members scenario', () => {
      const handleInvite = jest.fn();

      render(
        <EmptyState
          icon={Users}
          title="No team members"
          description="Invite people to join your team."
          action={{
            label: 'Invite Members',
            onClick: handleInvite,
          }}
        />
      );

      expect(screen.getByTestId('users-icon')).toBeInTheDocument();
      expect(screen.getByText('No team members')).toBeInTheDocument();
    });
  });

  describe('Optional Description', () => {
    it('renders without description', () => {
      render(<EmptyState title="Empty" />);

      expect(screen.getByText('Empty')).toBeInTheDocument();
      const paragraphs = screen.queryAllByRole('paragraph');
      expect(paragraphs.length).toBe(0);
    });

    it('shows description when provided', () => {
      render(
        <EmptyState
          title="Empty"
          description="This is a description"
        />
      );

      expect(screen.getByText('This is a description')).toBeInTheDocument();
    });

    it('does not show description element when description is empty string', () => {
      const { container } = render(
        <EmptyState
          title="Empty"
          description=""
        />
      );

      const description = container.querySelector('p');
      expect(description).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<EmptyState title="Empty State" />);

      const heading = screen.getByText('Empty State');
      expect(heading.tagName).toBe('H3');
    });

    it('action button is accessible', async () => {
      const handleClick = jest.fn();

      render(
        <EmptyState
          title="Empty"
          action={{
            label: 'Take Action',
            onClick: handleClick,
          }}
        />
      );

      const button = screen.getByRole('button', { name: /take action/i });
      expect(button).toBeInTheDocument();

      // Button should be keyboard accessible
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has centered layout for better visual accessibility', () => {
      const { container } = render(<EmptyState title="Empty" />);

      const wrapper = container.querySelector('.flex.flex-col.items-center');
      expect(wrapper).toHaveClass('justify-center', 'text-center');
    });

    it('description has max width for readability', () => {
      render(
        <EmptyState
          title="Title"
          description="Long description"
        />
      );

      const description = screen.getByText('Long description');
      expect(description).toHaveClass('max-w-md');
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty title', () => {
      render(<EmptyState title="" description="Description" />);

      expect(screen.getByText('Description')).toBeInTheDocument();
    });

    it('renders with very long title', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines in the user interface';

      render(<EmptyState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders with very long description', () => {
      const longDescription = 'This is a very long description that provides detailed information about the empty state and what the user should do next. It might span multiple lines.';

      render(
        <EmptyState
          title="Title"
          description={longDescription}
        />
      );

      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('handles undefined action gracefully', () => {
      render(<EmptyState title="Title" action={undefined} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('handles different icon components', () => {
      render(<EmptyState icon={FileText} title="With Icon" />);

      expect(screen.getByTestId('file-icon')).toBeInTheDocument();
    });
  });
});
