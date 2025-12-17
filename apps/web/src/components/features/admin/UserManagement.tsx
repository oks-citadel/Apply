'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
}

interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, refetch } = useQuery<UsersResponse>({
    queryKey: ['users', page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setSuccessMessage('User created successfully');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (userData: Partial<User>) => {
      const response = await fetch(`/api/admin/users/${userData.id}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowEditModal(false);
      setSuccessMessage('User updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowDeleteConfirm(false);
      setSuccessMessage('User deleted successfully');
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return (
      <div>
        <p>Error - Failed to load users</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  if (!data?.data.length) {
    return <div>No users found</div>;
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === data.data.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(data.data.map((u) => u.id));
    }
  };

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
  };

  return (
    <div>
      <h1>User Management</h1>

      {successMessage && <div role="alert">{successMessage}</div>}

      <div>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter by role"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Roles</option>
          <option value="USER">USER</option>
          <option value="MODERATOR">MODERATOR</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button onClick={clearFilters}>Clear Filters</button>
      </div>

      <button onClick={() => setShowCreateModal(true)}>Add User</button>

      {selectedUsers.length > 0 && (
        <div>
          <span>{selectedUsers.length} user(s) selected</span>
          <button>Bulk Actions</button>
          <div>
            <button>Deactivate Selected</button>
            <button>Delete Selected</button>
          </div>
        </div>
      )}

      <table aria-label="Users table">
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                aria-label="Select all"
                checked={selectedUsers.length === data.data.length}
                onChange={handleSelectAll}
              />
            </th>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.id)}
                  onChange={() => handleSelectUser(user.id)}
                />
              </td>
              <td>{`${user.firstName} ${user.lastName}`}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
              <td>{user.isActive ? 'Active' : 'Inactive'}</td>
              <td>{new Date(user.createdAt).toLocaleDateString()}</td>
              <td>
                <button aria-label="Actions">Actions</button>
                <button
                  aria-label="View"
                  onClick={() => {}}
                >
                  View
                </button>
                <button
                  aria-label="Edit"
                  onClick={() => {
                    setEditingUser(user);
                    setShowEditModal(true);
                  }}
                >
                  Edit
                </button>
                <button
                  aria-label="Delete"
                  onClick={() => {
                    setDeletingUser(user);
                    setShowDeleteConfirm(true);
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <span>Page {page} of {data.totalPages}</span>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          disabled={page === data.totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
        <select
          aria-label="Items per page"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
        </select>
      </div>

      {showCreateModal && (
        <div role="dialog">
          <h2>Create New User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              if (!formData.get('email')) {
                return;
              }
              createMutation.mutate({
                email: formData.get('email') as string,
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                role: formData.get('role') as User['role'],
              });
            }}
          >
            <label>
              First Name
              <input type="text" name="firstName" />
            </label>
            <label>
              Last Name
              <input type="text" name="lastName" />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            {createMutation.isError && <p>Email is required</p>}
            <label>
              Password
              <input type="password" name="password" />
            </label>
            <label>
              Role
              <select name="role">
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <button type="submit">Create User</button>
            <button type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </button>
          </form>
        </div>
      )}

      {showEditModal && editingUser && (
        <div role="dialog">
          <h2>Edit User</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              updateMutation.mutate({
                id: editingUser.id,
                email: formData.get('email') as string,
                firstName: formData.get('firstName') as string,
                lastName: formData.get('lastName') as string,
                role: formData.get('role') as User['role'],
              });
            }}
          >
            <label>
              First Name
              <input
                type="text"
                name="firstName"
                defaultValue={editingUser.firstName}
              />
            </label>
            <label>
              Last Name
              <input
                type="text"
                name="lastName"
                defaultValue={editingUser.lastName}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                name="email"
                defaultValue={editingUser.email}
              />
            </label>
            <label>
              Role
              <select name="role" defaultValue={editingUser.role}>
                <option value="USER">USER</option>
                <option value="MODERATOR">MODERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </button>
          </form>
          <div>Edit User - Deactivate - Delete</div>
        </div>
      )}

      {showDeleteConfirm && (
        <div role="dialog">
          <p>Are you sure you want to delete this user?</p>
          <button onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
          <button
            onClick={() => {
              if (deletingUser) {
                deleteMutation.mutate(deletingUser.id);
              }
            }}
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
