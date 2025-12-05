import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoginForm } from '../LoginForm';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

describe('LoginForm', () => {
  describe('Rendering', () => {
    it('renders all form fields', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders forgot password link', () => {
      render(<LoginForm />);
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('renders sign up link', () => {
      render(<LoginForm />);
      const signUpLink = screen.getByRole('link', { name: /sign up/i });
      expect(signUpLink).toBeInTheDocument();
      expect(signUpLink).toHaveAttribute('href', '/register');
    });

    it('has email input with proper type', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has password input with proper type', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Accessibility', () => {
    it('has proper labels for all inputs', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/remember me/i)).toBeInTheDocument();
    });

    it('email input has autocomplete attribute', () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('password input has autocomplete attribute', () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
    });

    it('email field is marked as required', () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/email address/i)).toBeRequired();
    });

    it('password field is marked as required', () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/^password$/i)).toBeRequired();
    });

    it('submit button has accessible name', () => {
      render(<LoginForm />);
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('Form Structure', () => {
    it('renders as a form element', () => {
      const { container } = render(<LoginForm />);
      expect(container.querySelector('form')).toBeInTheDocument();
    });

    it('has a remember me checkbox', () => {
      render(<LoginForm />);
      const checkbox = screen.getByLabelText(/remember me/i);
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('renders links to related pages', () => {
      render(<LoginForm />);

      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
    });
  });
});
