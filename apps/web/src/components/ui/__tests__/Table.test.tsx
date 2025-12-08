import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../Table';

describe('Table Components', () => {
  describe('Table', () => {
    it('renders table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm');
    });

    it('renders with custom className', () => {
      render(
        <Table className="custom-table">
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      expect(screen.getByRole('table')).toHaveClass('custom-table');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLTableElement>();
      render(
        <Table ref={ref}>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );

      expect(ref.current).toBeInstanceOf(HTMLTableElement);
    });
  });

  describe('TableHeader', () => {
    it('renders thead element', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const thead = container.querySelector('thead');
      expect(thead).toBeInTheDocument();
      expect(thead).toHaveClass('border-b', 'border-gray-200');
    });

    it('renders with custom className', () => {
      const { container } = render(
        <Table>
          <TableHeader className="custom-header">
            <tr>
              <th>Header</th>
            </tr>
          </TableHeader>
        </Table>
      );

      const thead = container.querySelector('thead');
      expect(thead).toHaveClass('custom-header');
    });
  });

  describe('TableBody', () => {
    it('renders tbody element', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Body Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const tbody = container.querySelector('tbody');
      expect(tbody).toBeInTheDocument();
    });

    it('renders multiple rows', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row 1</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Row 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('Row 1')).toBeInTheDocument();
      expect(screen.getByText('Row 2')).toBeInTheDocument();
      expect(screen.getByText('Row 3')).toBeInTheDocument();
    });
  });

  describe('TableFooter', () => {
    it('renders tfoot element', () => {
      const { container } = render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      const tfoot = container.querySelector('tfoot');
      expect(tfoot).toBeInTheDocument();
      expect(tfoot).toHaveClass('border-t', 'bg-gray-50', 'font-medium');
    });
  });

  describe('TableRow', () => {
    it('renders tr element', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = container.querySelector('tr');
      expect(row).toBeInTheDocument();
      expect(row).toHaveClass('border-b', 'transition-colors');
    });

    it('applies hover styles', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveClass('hover:bg-gray-50');
    });

    it('supports data-state attribute', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const row = container.querySelector('tr');
      expect(row).toHaveAttribute('data-state', 'selected');
    });
  });

  describe('TableHead', () => {
    it('renders th element', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const th = screen.getByText('Column Header');
      expect(th.tagName).toBe('TH');
      expect(th).toHaveClass('h-12', 'px-4', 'text-left', 'font-medium');
    });

    it('renders multiple column headers', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });

  describe('TableCell', () => {
    it('renders td element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const td = screen.getByText('Cell Content');
      expect(td.tagName).toBe('TD');
      expect(td).toHaveClass('p-4', 'align-middle');
    });

    it('renders multiple cells in a row', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>John Doe</TableCell>
              <TableCell>john@example.com</TableCell>
              <TableCell>Admin</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });
  });

  describe('TableCaption', () => {
    it('renders caption element', () => {
      const { container } = render(
        <Table>
          <TableCaption>User List</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const caption = container.querySelector('caption');
      expect(caption).toBeInTheDocument();
      expect(caption).toHaveTextContent('User List');
      expect(caption).toHaveClass('mt-4', 'text-sm');
    });
  });

  describe('Complete Table Example', () => {
    it('renders a complete table with all components', () => {
      render(
        <Table>
          <TableCaption>A list of users</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Alice Johnson</TableCell>
              <TableCell>alice@example.com</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Bob Smith</TableCell>
              <TableCell>bob@example.com</TableCell>
              <TableCell>Inactive</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total: 2 users</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      );

      expect(screen.getByText('A list of users')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Total: 2 users')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('supports colSpan', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={3}>Merged Cell</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = container.querySelector('td');
      expect(cell).toHaveAttribute('colSpan', '3');
    });

    it('supports rowSpan', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell rowSpan={2}>Merged Cell</TableCell>
              <TableCell>Cell 2</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Cell 3</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const cell = container.querySelector('td');
      expect(cell).toHaveAttribute('rowSpan', '2');
    });

    it('supports scope attribute on headers', () => {
      const { container } = render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Column 1</TableHead>
              <TableHead scope="col">Column 2</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );

      const headers = container.querySelectorAll('th');
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });
  });

  describe('Responsive Behavior', () => {
    it('has overflow container for responsive scrolling', () => {
      const { container } = render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass('overflow-auto', 'w-full');
    });
  });
});
