import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  describe('Rendering', () => {
    it('renders select element', () => {
      render(
        <Select>
          <option value="">Select an option</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders with label', () => {
      render(
        <Select label="Country">
          <option value="us">United States</option>
          <option value="uk">United Kingdom</option>
        </Select>
      );

      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByText('Country')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <Select className="custom-class">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('custom-class');
    });

    it('renders with helper text', () => {
      render(
        <Select label="Selection" helperText="Choose an option">
          <option>Option</option>
        </Select>
      );

      expect(screen.getByText('Choose an option')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders with error message', () => {
      render(
        <Select label="Selection" error="This field is required">
          <option>Option</option>
        </Select>
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('applies error styles when error is present', () => {
      render(
        <Select error="Error message">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    it('shows error instead of helper text when both are provided', () => {
      render(
        <Select helperText="Helper text" error="Error message">
          <option>Option</option>
        </Select>
      );

      expect(screen.getByText('Error message')).toBeInTheDocument();
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
    });

    it('has correct aria-describedby when error is present', () => {
      render(
        <Select label="Test Select" error="Error message">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'test-select-error');
    });
  });

  describe('User Interactions', () => {
    it('allows selecting options', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Select onChange={handleChange}>
          <option value="">Select</option>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, '1');

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(select).toHaveValue('1');
    });

    it('shows selected value', async () => {
      const user = userEvent.setup();

      render(
        <Select>
          <option value="">Select</option>
          <option value="option1">Option 1</option>
          <option value="option2">Option 2</option>
        </Select>
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      await user.selectOptions(select, 'option2');

      expect(select.value).toBe('option2');
    });

    it('handles disabled state', async () => {
      const user = userEvent.setup();
      const handleChange = jest.fn();

      render(
        <Select disabled onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeDisabled();
      expect(select).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');

      // Try to select (should not work)
      await user.selectOptions(select, '2');
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Controlled Component', () => {
    it('works as controlled component', () => {
      const { rerender } = render(
        <Select value="1">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('1');

      rerender(
        <Select value="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </Select>
      );

      expect(select.value).toBe('2');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria attributes', () => {
      render(
        <Select label="Accessible Select" helperText="Helper">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-describedby', 'accessible-select-helper');
      expect(select).toHaveAttribute('aria-invalid', 'false');
    });

    it('associates label with select using htmlFor', () => {
      render(
        <Select label="Test Label" id="test-select">
          <option>Option</option>
        </Select>
      );

      const label = screen.getByText('Test Label');
      expect(label).toHaveAttribute('for', 'test-select');
    });

    it('generates id from label when id is not provided', () => {
      render(
        <Select label="My Select">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'my-select');
    });

    it('uses custom id when provided', () => {
      render(
        <Select label="Label" id="custom-id">
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'custom-id');
    });

    it('has proper focus styles', () => {
      render(
        <Select>
          <option>Option</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });
  });

  describe('Ref Forwarding', () => {
    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLSelectElement>();

      render(
        <Select ref={ref}>
          <option>Option</option>
        </Select>
      );

      expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    });
  });

  describe('Multiple Options', () => {
    it('renders multiple options', () => {
      render(
        <Select>
          <option value="">Select...</option>
          <option value="1">First</option>
          <option value="2">Second</option>
          <option value="3">Third</option>
        </Select>
      );

      const options = screen.getAllByRole('option');
      expect(options).toHaveLength(4);
    });

    it('renders option groups', () => {
      render(
        <Select label="Grouped Select">
          <optgroup label="Group 1">
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
          </optgroup>
          <optgroup label="Group 2">
            <option value="3">Option 3</option>
            <option value="4">Option 4</option>
          </optgroup>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();

      // Check that optgroups are present
      const groups = screen.getAllByRole('group');
      expect(groups).toHaveLength(2);
    });
  });

  describe('Required Field', () => {
    it('marks select as required', () => {
      render(
        <Select label="Required Select" required>
          <option value="">Select</option>
          <option value="1">Option 1</option>
        </Select>
      );

      const select = screen.getByRole('combobox');
      expect(select).toBeRequired();
    });
  });

  describe('Default Value', () => {
    it('sets default value', () => {
      render(
        <Select defaultValue="2">
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
          <option value="3">Option 3</option>
        </Select>
      );

      const select = screen.getByRole('combobox') as HTMLSelectElement;
      expect(select.value).toBe('2');
    });
  });

  describe('Form Integration', () => {
    it('includes select in form submission', () => {
      const handleSubmit = jest.fn((e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        return Object.fromEntries(formData);
      });

      render(
        <form onSubmit={handleSubmit}>
          <Select name="country" defaultValue="us">
            <option value="us">United States</option>
            <option value="uk">United Kingdom</option>
          </Select>
          <button type="submit">Submit</button>
        </form>
      );

      const form = screen.getByRole('combobox').closest('form')!;
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
