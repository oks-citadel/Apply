import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  CardSkeleton,
  TableSkeleton,
  ResumeCardSkeleton,
  JobCardSkeleton,
} from '../Skeleton';

describe('Skeleton Components', () => {
  describe('Skeleton', () => {
    it('renders skeleton element', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('animate-pulse', 'rounded-md', 'bg-gray-200');
    });

    it('renders with custom className', () => {
      const { container } = render(<Skeleton className="h-10 w-full" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('h-10', 'w-full');
    });

    it('accepts HTML div attributes', () => {
      const { container } = render(<Skeleton data-testid="custom-skeleton" />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveAttribute('data-testid', 'custom-skeleton');
    });

    it('applies dark mode styles', () => {
      const { container } = render(<Skeleton />);
      const skeleton = container.firstChild as HTMLElement;

      expect(skeleton).toHaveClass('dark:bg-gray-700');
    });
  });

  describe('CardSkeleton', () => {
    it('renders card skeleton structure', () => {
      const { container } = render(<CardSkeleton />);

      // Check for border and rounded container
      const card = container.querySelector('.border.rounded-lg');
      expect(card).toBeInTheDocument();
    });

    it('renders multiple skeleton elements', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      // Should have at least 4 skeleton elements (title, subtitle, 2 content lines)
      expect(skeletons.length).toBeGreaterThanOrEqual(4);
    });

    it('has proper spacing', () => {
      const { container } = render(<CardSkeleton />);
      const card = container.querySelector('.space-y-4');

      expect(card).toBeInTheDocument();
    });

    it('renders different width skeletons', () => {
      const { container } = render(<CardSkeleton />);
      const skeletons = container.querySelectorAll('.animate-pulse');

      // Check that skeletons have different widths
      const widths = Array.from(skeletons).map(s => s.className);
      expect(widths.some(w => w.includes('w-3/4'))).toBe(true);
      expect(widths.some(w => w.includes('w-1/2'))).toBe(true);
    });
  });

  describe('TableSkeleton', () => {
    it('renders default number of rows', () => {
      const { container } = render(<TableSkeleton />);
      const rows = container.querySelectorAll('.flex.items-center');

      // Default is 5 rows
      expect(rows.length).toBe(5);
    });

    it('renders custom number of rows', () => {
      const { container } = render(<TableSkeleton rows={3} />);
      const rows = container.querySelectorAll('.flex.items-center');

      expect(rows.length).toBe(3);
    });

    it('renders 10 rows when specified', () => {
      const { container } = render(<TableSkeleton rows={10} />);
      const rows = container.querySelectorAll('.flex.items-center');

      expect(rows.length).toBe(10);
    });

    it('each row has circular avatar skeleton', () => {
      const { container } = render(<TableSkeleton rows={2} />);
      const avatars = container.querySelectorAll('.rounded-full.h-12.w-12');

      expect(avatars.length).toBe(2);
    });

    it('each row has action button skeleton', () => {
      const { container } = render(<TableSkeleton rows={2} />);
      const buttons = container.querySelectorAll('.h-8.w-20');

      expect(buttons.length).toBe(2);
    });

    it('has proper spacing between rows', () => {
      const { container } = render(<TableSkeleton />);
      const wrapper = container.querySelector('.space-y-4');

      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('ResumeCardSkeleton', () => {
    it('renders resume card skeleton structure', () => {
      const { container } = render(<ResumeCardSkeleton />);
      const card = container.querySelector('.border.rounded-lg');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-6');
    });

    it('renders icon and badge skeleton', () => {
      const { container } = render(<ResumeCardSkeleton />);

      // Icon skeleton
      const icon = container.querySelector('.h-10.w-10.rounded');
      expect(icon).toBeInTheDocument();

      // Badge skeleton
      const badge = container.querySelector('.h-6.w-16.rounded-full');
      expect(badge).toBeInTheDocument();
    });

    it('renders title and metadata skeletons', () => {
      const { container } = render(<ResumeCardSkeleton />);

      const title = container.querySelector('.h-6.w-3/4');
      const metadata = container.querySelector('.h-4.w-1/2');

      expect(title).toBeInTheDocument();
      expect(metadata).toBeInTheDocument();
    });

    it('renders action button skeletons', () => {
      const { container } = render(<ResumeCardSkeleton />);
      const buttons = container.querySelectorAll('.h-10.w-full');

      // Should have 2 full-width buttons
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });

    it('has proper spacing between elements', () => {
      const { container } = render(<ResumeCardSkeleton />);
      const buttonGroup = container.querySelector('.space-y-2');

      expect(buttonGroup).toBeInTheDocument();
    });
  });

  describe('JobCardSkeleton', () => {
    it('renders job card skeleton structure', () => {
      const { container } = render(<JobCardSkeleton />);
      const card = container.querySelector('.border.rounded-lg');

      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('p-6');
    });

    it('renders title and company skeletons', () => {
      const { container } = render(<JobCardSkeleton />);

      const title = container.querySelector('.h-6.w-3/4');
      const company = container.querySelector('.h-4.w-1/2');

      expect(title).toBeInTheDocument();
      expect(company).toBeInTheDocument();
    });

    it('renders badge skeletons', () => {
      const { container } = render(<JobCardSkeleton />);
      const badges = container.querySelectorAll('.rounded-full');

      // Should have at least 2 badge skeletons
      expect(badges.length).toBeGreaterThanOrEqual(2);
    });

    it('renders icon skeleton', () => {
      const { container } = render(<JobCardSkeleton />);
      const icon = container.querySelector('.h-10.w-10.rounded');

      expect(icon).toBeInTheDocument();
    });

    it('renders description skeletons', () => {
      const { container } = render(<JobCardSkeleton />);

      const fullLine = container.querySelector('.h-4.w-full');
      const partialLine = container.querySelector('.h-4.w-5/6');

      expect(fullLine).toBeInTheDocument();
      expect(partialLine).toBeInTheDocument();
    });

    it('has proper layout structure', () => {
      const { container } = render(<JobCardSkeleton />);
      const flexContainer = container.querySelector('.flex.items-start.justify-between');

      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('Common Behavior', () => {
    it('all skeletons have pulse animation', () => {
      const { container: card } = render(<CardSkeleton />);
      const { container: table } = render(<TableSkeleton rows={1} />);
      const { container: resume } = render(<ResumeCardSkeleton />);
      const { container: job } = render(<JobCardSkeleton />);

      [card, table, resume, job].forEach(container => {
        const pulsing = container.querySelectorAll('.animate-pulse');
        expect(pulsing.length).toBeGreaterThan(0);
      });
    });

    it('all skeletons have rounded corners', () => {
      const { container: card } = render(<CardSkeleton />);
      const { container: resume } = render(<ResumeCardSkeleton />);
      const { container: job } = render(<JobCardSkeleton />);

      [card, resume, job].forEach(container => {
        const rounded = container.querySelectorAll('.rounded-lg');
        expect(rounded.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Use Cases', () => {
    it('can be used as loading placeholder for list', () => {
      const { container } = render(
        <div>
          <TableSkeleton rows={3} />
        </div>
      );

      const rows = container.querySelectorAll('.flex.items-center');
      expect(rows.length).toBe(3);
    });

    it('can be used as loading placeholder for cards', () => {
      const { container } = render(
        <div className="grid grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      );

      const cards = container.querySelectorAll('.border.rounded-lg');
      expect(cards.length).toBe(3);
    });

    it('can be combined with other components', () => {
      const { container } = render(
        <div>
          <h2>Loading Jobs...</h2>
          <JobCardSkeleton />
          <JobCardSkeleton />
        </div>
      );

      expect(screen.getByText('Loading Jobs...')).toBeInTheDocument();
      const cards = container.querySelectorAll('.border.rounded-lg');
      expect(cards.length).toBe(2);
    });
  });
});
