import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagement } from '../UserManagement';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-query
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  QueryClient: jest.fn().mockImplementation(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('UserManagement', () => {
  const mockUsers = [
    {
      id: '1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      isActive: true,
      createdAt: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: '2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'MODERATOR',
      isActive: true,
      createdAt: new Date('2024-01-02T10:00:00Z'),
    },
    {
      id: '3',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      createdAt: new Date('2024-01-03T10:00:00Z'),
    },
  ];

  const mockUsersResponse = {
    data: mockUsers,
    total: 3,
    page: 1,
    limit: 10,
    totalPages: 1,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const { useQuery, useMutation, useQueryClient } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockUsersResponse,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    useMutation.mockReturnValue({
      mutate: jest.fn(),
      mutateAsync: jest.fn(),
      isLoading: false,
    });

    useQueryClient.mockReturnValue({
      invalidateQueries: jest.fn(),
      setQueryData: jest.fn(),
      getQueryData: jest.fn(),
    });
  });

  describe('Rendering', () => {
    it('should render the user management heading', () => {
      render(<UserManagement />);

      expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
    });

    it('should display loading state while fetching users', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
      });

      render(<UserManagement />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should display error state when fetch fails', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch users'),
      });

      render(<UserManagement />);

      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    it('should display empty state when no users exist', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
        isLoading: false,
        isError: false,
      });

      render(<UserManagement />);

      expect(screen.getByText(/no users found/i)).toBeInTheDocument();
    });
  });

  describe('User List Display', () => {
    it('should render a table with user data', () => {
      render(<UserManagement />);

      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('should display table headers', () => {
      render(<UserManagement />);

      expect(screen.getByText(/name/i)).toBeInTheDocument();
      expect(screen.getByText(/email/i)).toBeInTheDocument();
      expect(screen.getByText(/role/i)).toBeInTheDocument();
      expect(screen.getByText(/status/i)).toBeInTheDocument();
      expect(screen.getByText(/created/i)).toBeInTheDocument();
      expect(screen.getByText(/actions/i)).toBeInTheDocument();
    });

    it('should display all users in the table', () => {
      render(<UserManagement />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    it('should display user roles correctly', () => {
      render(<UserManagement />);

      expect(screen.getByText('USER')).toBeInTheDocument();
      expect(screen.getByText('MODERATOR')).toBeInTheDocument();
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
    });

    it('should display user status badges', () => {
      render(<UserManagement />);

      const activeBadges = screen.getAllByText(/active/i);
      expect(activeBadges.length).toBeGreaterThan(0);
    });

    it('should format created dates properly', () => {
      render(<UserManagement />);

      // Check that dates are displayed in some format
      const table = screen.getByRole('table');
      expect(table).toHaveTextContent(/2024/);
    });
  });

  describe('Search and Filter', () => {
    it('should have a search input field', () => {
      render(<UserManagement />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search query on input', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'john@example.com');

      expect(searchInput).toHaveValue('john@example.com');
    });

    it('should have role filter dropdown', () => {
      render(<UserManagement />);

      const roleFilter = screen.getByRole('combobox', { name: /filter by role/i });
      expect(roleFilter).toBeInTheDocument();
    });

    it('should filter users by role selection', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const roleFilter = screen.getByRole('combobox', { name: /filter by role/i });
      await user.selectOptions(roleFilter, 'ADMIN');

      expect(roleFilter).toHaveValue('ADMIN');
    });

    it('should have status filter dropdown', () => {
      render(<UserManagement />);

      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i });
      expect(statusFilter).toBeInTheDocument();
    });

    it('should clear filters when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const searchInput = screen.getByPlaceholderText(/search users/i);
      await user.type(searchInput, 'test');

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      expect(searchInput).toHaveValue('');
    });
  });

  describe('Pagination', () => {
    it('should display pagination controls', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockUsersResponse,
          total: 50,
          totalPages: 5,
        },
        isLoading: false,
        isError: false,
      });

      render(<UserManagement />);

      expect(screen.getByText(/page 1 of 5/i)).toBeInTheDocument();
    });

    it('should have next page button', () => {
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockUsersResponse,
          total: 50,
          totalPages: 5,
        },
        isLoading: false,
        isError: false,
      });

      render(<UserManagement />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
    });

    it('should have previous page button', () => {
      render(<UserManagement />);

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeInTheDocument();
      expect(prevButton).toBeDisabled(); // Should be disabled on first page
    });

    it('should change page when pagination buttons are clicked', async () => {
      const user = userEvent.setup();
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: {
          ...mockUsersResponse,
          total: 50,
          page: 1,
          totalPages: 5,
        },
        isLoading: false,
        isError: false,
      });

      render(<UserManagement />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // The component should trigger a refetch or update
      expect(nextButton).toBeInTheDocument();
    });

    it('should allow changing page size', () => {
      render(<UserManagement />);

      const pageSizeSelect = screen.getByRole('combobox', { name: /items per page/i });
      expect(pageSizeSelect).toBeInTheDocument();
    });
  });

  describe('User Actions', () => {
    it('should have "Add User" button', () => {
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      expect(addButton).toBeInTheDocument();
    });

    it('should have edit action for each user', () => {
      render(<UserManagement />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBe(mockUsers.length);
    });

    it('should have delete action for each user', () => {
      render(<UserManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      expect(deleteButtons.length).toBe(mockUsers.length);
    });

    it('should have view action for each user', () => {
      render(<UserManagement />);

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      expect(viewButtons.length).toBe(mockUsers.length);
    });

    it('should show action menu on action button click', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      await user.click(actionButtons[0]);

      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      expect(screen.getByText(/deactivate/i)).toBeInTheDocument();
      expect(screen.getByText(/delete/i)).toBeInTheDocument();
    });
  });

  describe('Create User', () => {
    it('should open create user modal when Add User button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /create new user/i })).toBeInTheDocument();
    });

    it('should display create user form fields', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should validate required fields on submit', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    });

    it('should close modal on cancel', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Edit User', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument();
    });

    it('should pre-fill form with user data', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
      expect(firstNameInput.value).toBe('John');

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      expect(emailInput.value).toBe('john.doe@example.com');
    });

    it('should allow updating user role', async () => {
      const user = userEvent.setup();
      const mockMutate = jest.fn();
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(<UserManagement />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      const roleSelect = screen.getByLabelText(/role/i);
      await user.selectOptions(roleSelect, 'MODERATOR');

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should show success message after successful update', async () => {
      const user = userEvent.setup();
      const mockMutate = jest.fn((data, { onSuccess }) => {
        onSuccess();
      });
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(<UserManagement />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      const saveButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText(/user updated successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Delete User', () => {
    it('should show confirmation dialog when delete is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure you want to delete this user/i)).toBeInTheDocument();
    });

    it('should cancel deletion on cancel button', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });

    it('should delete user on confirm', async () => {
      const user = userEvent.setup();
      const mockMutate = jest.fn();
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(<UserManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalled();
      });
    });

    it('should show success message after successful deletion', async () => {
      const user = userEvent.setup();
      const mockMutate = jest.fn((data, { onSuccess }) => {
        onSuccess();
      });
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(<UserManagement />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/user deleted successfully/i)).toBeInTheDocument();
      });
    });
  });

  describe('Bulk Actions', () => {
    it('should have checkboxes for selecting users', () => {
      render(<UserManagement />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should select all users when header checkbox is clicked', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const headerCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await user.click(headerCheckbox);

      const checkboxes = screen.getAllByRole('checkbox', { checked: true });
      expect(checkboxes.length).toBe(mockUsers.length + 1); // +1 for header checkbox
    });

    it('should show bulk actions menu when users are selected', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Click first user checkbox

      expect(screen.getByText(/1 user selected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bulk actions/i })).toBeInTheDocument();
    });

    it('should have bulk deactivate option', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(bulkActionsButton);

      expect(screen.getByText(/deactivate selected/i)).toBeInTheDocument();
    });

    it('should have bulk delete option', async () => {
      const user = userEvent.setup();
      render(<UserManagement />);

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);

      const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
      await user.click(bulkActionsButton);

      expect(screen.getByText(/delete selected/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for buttons', () => {
      render(<UserManagement />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have proper table structure', () => {
      render(<UserManagement />);

      const table = screen.getByRole('table');
      expect(table).toHaveAccessibleName();
    });

    it('should be keyboard navigable', () => {
      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      addButton.focus();

      expect(document.activeElement).toBe(addButton);
    });
  });

  describe('Error Handling', () => {
    it('should display error message on failed user creation', async () => {
      const user = userEvent.setup();
      const mockMutate = jest.fn((data, { onError }) => {
        onError(new Error('Email already exists'));
      });
      const { useMutation } = require('@tanstack/react-query');
      useMutation.mockReturnValue({
        mutate: mockMutate,
        isLoading: false,
      });

      render(<UserManagement />);

      const addButton = screen.getByRole('button', { name: /add user/i });
      await user.click(addButton);

      const submitButton = screen.getByRole('button', { name: /create user/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on fetch error', () => {
      const mockRefetch = jest.fn();
      const { useQuery } = require('@tanstack/react-query');
      useQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Network error'),
        refetch: mockRefetch,
      });

      render(<UserManagement />);

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });
});
