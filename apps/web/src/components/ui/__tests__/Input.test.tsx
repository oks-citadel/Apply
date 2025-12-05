import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders input field', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('renders different input types', () => {
      const { rerender } = render(<Input type="email" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

      rerender(<Input type="number" data-testid="input" />);
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
    });
  });

  describe('Label', () => {
    it('renders with label', () => {
      render(<Input label="Email Address" />);
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    });

    it('associates label with input using htmlFor', () => {
      render(<Input label="Username" id="username-input" />);
      const label = screen.getByText('Username');
      const input = screen.getByLabelText('Username');

      expect(label).toHaveAttribute('for', 'username-input');
      expect(input).toHaveAttribute('id', 'username-input');
    });

    it('generates id from label when id is not provided', () => {
      render(<Input label="Email Address" />);
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'email-address');
    });

    it('renders without label', () => {
      render(<Input placeholder="No label" />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('displays error message', () => {
      render(<Input label="Email" error="Invalid email address" />);
      expect(screen.getByText('Invalid email address')).toBeInTheDocument();
    });

    it('applies error styles when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-500');
    });

    it('sets aria-invalid when error is present', () => {
      render(<Input error="Error message" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('links error message with aria-describedby', () => {
      render(<Input label="Email" error="Invalid email" />);
      const input = screen.getByLabelText('Email');
      const errorId = input.getAttribute('aria-describedby');

      expect(errorId).toBe('email-error');
      expect(screen.getByRole('alert')).toHaveAttribute('id', 'email-error');
    });

    it('error message has role alert', () => {
      render(<Input error="Error message" />);
      expect(screen.getByRole('alert')).toHaveTextContent('Error message');
    });
  });

  describe('Helper Text', () => {
    it('displays helper text', () => {
      render(<Input helperText="Enter your email address" />);
      expect(screen.getByText('Enter your email address')).toBeInTheDocument();
    });

    it('links helper text with aria-describedby', () => {
      render(<Input label="Email" helperText="Help text" />);
      const input = screen.getByLabelText('Email');
      const helperId = input.getAttribute('aria-describedby');

      expect(helperId).toBe('email-helper');
    });

    it('does not display helper text when error is present', () => {
      render(
        <Input
          helperText="Helper text"
          error="Error message"
        />
      );
      expect(screen.queryByText('Helper text')).not.toBeInTheDocument();
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<Input disabled />);
      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('applies disabled styles', () => {
      render(<Input disabled />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
    });
  });

  describe('User Interaction', () => {
    it('allows user to type', async () => {
      const user = userEvent.setup();
      render(<Input placeholder="Type here" />);

      const input = screen.getByPlaceholderText('Type here') as HTMLInputElement;
      await user.type(input, 'Hello World');

      expect(input.value).toBe('Hello World');
    });

    it('calls onChange handler', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();

      render(<Input onChange={handleChange} />);
      const input = screen.getByRole('textbox');

      await user.type(input, 'test');

      expect(handleChange).toHaveBeenCalled();
    });

    it('does not allow typing when disabled', async () => {
      const user = userEvent.setup();
      render(<Input disabled placeholder="Disabled" />);

      const input = screen.getByPlaceholderText('Disabled') as HTMLInputElement;
      await user.type(input, 'test');

      expect(input.value).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('has proper focus styles', () => {
      render(<Input />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it('supports required attribute', () => {
      render(<Input required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('supports autoComplete attribute', () => {
      render(<Input autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });

    it('supports custom aria attributes', () => {
      render(<Input aria-label="Custom label" />);
      expect(screen.getByLabelText('Custom label')).toBeInTheDocument();
    });
  });

  describe('Value Control', () => {
    it('works as controlled component', async () => {
      const user = userEvent.setup();
      const ControlledInput = () => {
        const [value, setValue] = React.useState('');
        return (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled"
          />
        );
      };

      render(<ControlledInput />);
      const input = screen.getByPlaceholderText('Controlled') as HTMLInputElement;

      await user.type(input, 'test');
      expect(input.value).toBe('test');
    });

    it('works as uncontrolled component', async () => {
      const user = userEvent.setup();
      render(<Input defaultValue="initial" placeholder="Uncontrolled" />);

      const input = screen.getByPlaceholderText('Uncontrolled') as HTMLInputElement;
      expect(input.value).toBe('initial');

      await user.clear(input);
      await user.type(input, 'updated');
      expect(input.value).toBe('updated');
    });
  });
});
