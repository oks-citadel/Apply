import React from 'react';
import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders badge with text', () => {
      render(<Badge>Test Badge</Badge>);
      expect(screen.getByText('Test Badge')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      const { container } = render(<Badge className="custom-class">Badge</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      const { container } = render(<Badge variant="default">Default</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-primary-100', 'text-primary-800');
    });

    it('renders secondary variant', () => {
      const { container } = render(<Badge variant="secondary">Secondary</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
    });

    it('renders destructive variant', () => {
      const { container } = render(<Badge variant="destructive">Destructive</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-red-100', 'text-red-800');
    });

    it('renders outline variant', () => {
      const { container } = render(<Badge variant="outline">Outline</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('border', 'border-gray-300');
    });

    it('renders success variant', () => {
      const { container } = render(<Badge variant="success">Success</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-100', 'text-green-800');
    });

    it('renders warning variant', () => {
      const { container } = render(<Badge variant="warning">Warning</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
    });
  });

  describe('Sizes', () => {
    it('renders small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders medium size (default)', () => {
      const { container } = render(<Badge>Medium</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm');
    });

    it('renders large size', () => {
      const { container } = render(<Badge size="lg">Large</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('px-3', 'py-1', 'text-base');
    });
  });

  describe('Combinations', () => {
    it('renders with variant and size combination', () => {
      const { container } = render(
        <Badge variant="success" size="lg">
          Large Success
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-green-100', 'px-3', 'py-1');
    });

    it('renders with all props', () => {
      const { container } = render(
        <Badge variant="warning" size="sm" className="custom" data-testid="test-badge">
          Complete Badge
        </Badge>
      );
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('bg-yellow-100', 'px-2', 'custom');
      expect(badge).toHaveAttribute('data-testid', 'test-badge');
    });
  });

  describe('Common Use Cases', () => {
    it('renders status badges', () => {
      const { container } = render(
        <>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="destructive">Rejected</Badge>
        </>
      );

      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
    });

    it('renders count badge', () => {
      render(<Badge size="sm">99+</Badge>);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('renders with icons or emojis', () => {
      render(
        <Badge variant="success">
          ✓ Verified
        </Badge>
      );
      expect(screen.getByText(/Verified/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      const { container } = render(<Badge>Focusable</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('supports aria attributes', () => {
      render(<Badge aria-label="Status badge">Status</Badge>);
      expect(screen.getByLabelText('Status badge')).toBeInTheDocument();
    });

    it('supports data attributes', () => {
      const { container } = render(<Badge data-status="active">Active</Badge>);
      const badge = container.firstChild as HTMLElement;
      expect(badge).toHaveAttribute('data-status', 'active');
    });
  });

  describe('Edge Cases', () => {
    it('renders empty badge', () => {
      const { container } = render(<Badge />);
      expect(container.firstChild).toBeInTheDocument();
    });

    it('renders badge with long text', () => {
      render(<Badge>This is a very long badge text that might wrap</Badge>);
      expect(screen.getByText(/This is a very long badge text/)).toBeInTheDocument();
    });

    it('renders badge with special characters', () => {
      render(<Badge>Special &amp; Characters!</Badge>);
      expect(screen.getByText('Special & Characters!')).toBeInTheDocument();
    });
  });
});
