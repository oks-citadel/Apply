import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../Card';

describe('Card', () => {
  describe('Card Component', () => {
    it('renders card with children', () => {
      render(
        <Card>
          <div>Card Content</div>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(<Card data-testid="card">Content</Card>);
      const card = screen.getByTestId('card');
      expect(card).toHaveClass(
        'rounded-lg',
        'border',
        'border-gray-200',
        'bg-white',
        'shadow-sm'
      );
    });

    it('applies custom className', () => {
      render(
        <Card className="custom-class" data-testid="card">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveClass('custom-class');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(<Card ref={ref}>Content</Card>);
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });

    it('accepts HTML div attributes', () => {
      render(
        <Card data-testid="card" role="article">
          Content
        </Card>
      );
      const card = screen.getByTestId('card');
      expect(card).toHaveAttribute('role', 'article');
    });
  });

  describe('CardHeader Component', () => {
    it('renders header with children', () => {
      render(
        <Card>
          <CardHeader>
            <h2>Header Content</h2>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader data-testid="header">Header</CardHeader>
        </Card>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader className="custom-header" data-testid="header">
            Header
          </CardHeader>
        </Card>
      );
      const header = screen.getByTestId('header');
      expect(header).toHaveClass('custom-header');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardHeader ref={ref}>Header</CardHeader>
        </Card>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardTitle Component', () => {
    it('renders title', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card Title')).toBeInTheDocument();
    });

    it('renders as h3 element', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title.tagName).toBe('H3');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle className="custom-title">Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const title = screen.getByText('Title');
      expect(title).toHaveClass('custom-title');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Card>
          <CardHeader>
            <CardTitle ref={ref}>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      expect(ref.current).toBeInstanceOf(HTMLHeadingElement);
    });
  });

  describe('CardDescription Component', () => {
    it('renders description', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Card description text</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Card description text')).toBeInTheDocument();
    });

    it('renders as p element', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Description');
      expect(description.tagName).toBe('P');
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('text-sm', 'text-gray-600');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardHeader>
            <CardDescription className="custom-desc">Description</CardDescription>
          </CardHeader>
        </Card>
      );
      const description = screen.getByText('Description');
      expect(description).toHaveClass('custom-desc');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLParagraphElement>();
      render(
        <Card>
          <CardHeader>
            <CardDescription ref={ref}>Description</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(ref.current).toBeInstanceOf(HTMLParagraphElement);
    });
  });

  describe('CardContent Component', () => {
    it('renders content', () => {
      render(
        <Card>
          <CardContent>Main content here</CardContent>
        </Card>
      );
      expect(screen.getByText('Main content here')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardContent data-testid="content">Content</CardContent>
        </Card>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('p-6', 'pt-0');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardContent className="custom-content" data-testid="content">
            Content
          </CardContent>
        </Card>
      );
      const content = screen.getByTestId('content');
      expect(content).toHaveClass('custom-content');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardContent ref={ref}>Content</CardContent>
        </Card>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('CardFooter Component', () => {
    it('renders footer', () => {
      render(
        <Card>
          <CardFooter>Footer content</CardFooter>
        </Card>
      );
      expect(screen.getByText('Footer content')).toBeInTheDocument();
    });

    it('applies default styles', () => {
      render(
        <Card>
          <CardFooter data-testid="footer">Footer</CardFooter>
        </Card>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
    });

    it('applies custom className', () => {
      render(
        <Card>
          <CardFooter className="custom-footer" data-testid="footer">
            Footer
          </CardFooter>
        </Card>
      );
      const footer = screen.getByTestId('footer');
      expect(footer).toHaveClass('custom-footer');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLDivElement>();
      render(
        <Card>
          <CardFooter ref={ref}>Footer</CardFooter>
        </Card>
      );
      expect(ref.current).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Complete Card Structure', () => {
    it('renders complete card with all components', () => {
      render(
        <Card data-testid="card">
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Welcome to your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is the main content area</p>
          </CardContent>
          <CardFooter>
            <button>Action</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Welcome to your dashboard')).toBeInTheDocument();
      expect(screen.getByText('This is the main content area')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
    });

    it('works with partial structure', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Simple Card</CardTitle>
          </CardHeader>
          <CardContent>Just content, no footer</CardContent>
        </Card>
      );

      expect(screen.getByText('Simple Card')).toBeInTheDocument();
      expect(screen.getByText('Just content, no footer')).toBeInTheDocument();
    });

    it('works with minimal structure', () => {
      render(
        <Card>
          <CardContent>Minimal card with just content</CardContent>
        </Card>
      );

      expect(screen.getByText('Minimal card with just content')).toBeInTheDocument();
    });
  });

  describe('Nested Content', () => {
    it('handles complex nested content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>View and edit your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <label>Name:</label>
              <input type="text" placeholder="Enter name" />
            </div>
            <div>
              <label>Email:</label>
              <input type="email" placeholder="Enter email" />
            </div>
          </CardContent>
          <CardFooter>
            <button>Cancel</button>
            <button>Save</button>
          </CardFooter>
        </Card>
      );

      expect(screen.getByText('User Profile')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    });
  });
});
