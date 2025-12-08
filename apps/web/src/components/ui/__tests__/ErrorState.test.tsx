import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorState } from '../ErrorState';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  RefreshCcw: () => <div data-testid="refresh-icon">Refresh</div>,
}));

describe('ErrorState', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<ErrorState />);

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An error occurred while loading the data/)).toBeInTheDocument();
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('renders with custom title', () => {
      render(<ErrorState title="Custom Error Title" />);

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('renders with custom message', () => {
      render(<ErrorState message="Custom error message description." />);

      expect(screen.getByText('Custom error message description.')).toBeInTheDocument();
      expect(screen.queryByText(/An error occurred while loading the data/)).not.toBeInTheDocument();
    });

    it('renders with both custom title and message', () => {
      render(
        <ErrorState
          title="Failed to Load"
          message="Could not fetch data from server."
        />
      );

      expect(screen.getByText('Failed to Load')).toBeInTheDocument();
      expect(screen.getByText('Could not fetch data from server.')).toBeInTheDocument();
    });
  });

  describe('Retry Button', () => {
    it('renders retry button when onRetry is provided', () => {
      const handleRetry = jest.fn();
      render(<ErrorState onRetry={handleRetry} />);

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });

    it('does not render retry button when onRetry is not provided', () => {
      render(<ErrorState />);

      expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup();
      const handleRetry = jest.fn();

      render(<ErrorState onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);

      expect(handleRetry).toHaveBeenCalledTimes(1);
    });

    it('calls onRetry multiple times when clicked multiple times', async () => {
      const user = userEvent.setup();
      const handleRetry = jest.fn();

      render(<ErrorState onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /try again/i });
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleRetry).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Elements', () => {
    it('renders error icon', () => {
      render(<ErrorState />);

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('has proper structure and styling classes', () => {
      const { container } = render(<ErrorState />);

      const wrapper = container.querySelector('.flex.flex-col.items-center');
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass('justify-center', 'py-12', 'text-center');
    });

    it('icon container has proper styling', () => {
      const { container } = render(<ErrorState />);

      const iconContainer = container.querySelector('.w-16.h-16.rounded-full');
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('bg-red-100', 'flex', 'items-center', 'justify-center');
    });

    it('title has proper styling', () => {
      const { container } = render(<ErrorState title="Error Title" />);

      const title = screen.getByText('Error Title');
      expect(title.tagName).toBe('H3');
      expect(title).toHaveClass('text-lg', 'font-semibold');
    });

    it('message has proper styling', () => {
      const { container } = render(<ErrorState message="Error message" />);

      const message = screen.getByText('Error message');
      expect(message.tagName).toBe('P');
      expect(message).toHaveClass('max-w-md');
    });
  });

  describe('Common Use Cases', () => {
    it('network error scenario', () => {
      const handleRetry = jest.fn();

      render(
        <ErrorState
          title="Network Error"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Network Error')).toBeInTheDocument();
      expect(screen.getByText(/Unable to connect to the server/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    it('not found error scenario', () => {
      render(
        <ErrorState
          title="Not Found"
          message="The resource you're looking for doesn't exist."
        />
      );

      expect(screen.getByText('Not Found')).toBeInTheDocument();
      expect(screen.getByText(/doesn't exist/)).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('permission denied scenario', () => {
      render(
        <ErrorState
          title="Access Denied"
          message="You don't have permission to view this content."
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText(/don't have permission/)).toBeInTheDocument();
    });

    it('server error scenario', () => {
      const handleRetry = jest.fn();

      render(
        <ErrorState
          title="Server Error"
          message="An unexpected error occurred on our end. Please try again later."
          onRetry={handleRetry}
        />
      );

      expect(screen.getByText('Server Error')).toBeInTheDocument();
      expect(screen.getByText(/unexpected error occurred/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<ErrorState title="Error" />);

      const heading = screen.getByText('Error');
      expect(heading.tagName).toBe('H3');
    });

    it('button is accessible', async () => {
      const handleRetry = jest.fn();
      render(<ErrorState onRetry={handleRetry} />);

      const button = screen.getByRole('button', { name: /try again/i });
      expect(button).toBeInTheDocument();

      // Button should be keyboard accessible
      button.focus();
      expect(button).toHaveFocus();
    });

    it('has centered layout for better visual accessibility', () => {
      const { container } = render(<ErrorState />);

      const wrapper = container.querySelector('.flex.flex-col.items-center');
      expect(wrapper).toHaveClass('justify-center', 'text-center');
    });
  });

  describe('Edge Cases', () => {
    it('renders with empty title', () => {
      render(<ErrorState title="" message="Error message" />);

      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('renders with empty message', () => {
      render(<ErrorState title="Error" message="" />);

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('renders with very long title', () => {
      const longTitle = 'This is a very long error title that might wrap to multiple lines in the UI';

      render(<ErrorState title={longTitle} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('renders with very long message', () => {
      const longMessage = 'This is a very long error message that provides detailed information about what went wrong and what the user should do to resolve the issue. It might span multiple lines.';

      render(<ErrorState message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('handles undefined onRetry gracefully', () => {
      render(<ErrorState onRetry={undefined} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });
});
