import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import NotificationCenter from '../NotificationCenter';

// Mock data
const mockNotifications = [
  {
    id: '1',
    userId: 'user-123',
    type: 'in_app',
    title: 'Application Update',
    message: 'Your application for Senior Developer at Tech Corp has been reviewed',
    category: 'application',
    actionUrl: '/applications/123',
    isRead: false,
    priority: 'high',
    createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
  },
  {
    id: '2',
    userId: 'user-123',
    type: 'in_app',
    title: 'New Job Match',
    message: 'We found 5 new jobs matching your preferences',
    category: 'job',
    actionUrl: '/jobs',
    isRead: false,
    priority: 'medium',
    createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
  },
  {
    id: '3',
    userId: 'user-123',
    type: 'in_app',
    title: 'Interview Scheduled',
    message: 'You have an interview scheduled for tomorrow at 2 PM',
    category: 'interview',
    actionUrl: '/interviews/456',
    isRead: true,
    priority: 'urgent',
    createdAt: new Date('2024-01-14T15:00:00Z').toISOString(),
  },
];

const mockNotificationSettings = {
  emailEnabled: true,
  emailApplicationStatus: true,
  emailJobAlerts: true,
  pushEnabled: true,
  pushApplicationStatus: true,
  pushJobAlerts: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

// Setup MSW server
const server = setupServer(
  rest.get('/notifications', (req, res, ctx) => {
    const isRead = req.url.searchParams.get('isRead');
    let filteredNotifications = mockNotifications;

    if (isRead === 'false') {
      filteredNotifications = mockNotifications.filter(n => !n.isRead);
    }

    return res(ctx.json({
      data: filteredNotifications,
      total: filteredNotifications.length,
      success: true,
    }));
  }),

  rest.get('/notifications/settings', (req, res, ctx) => {
    return res(ctx.json({ data: mockNotificationSettings, success: true }));
  }),

  rest.put('/notifications/settings', (req, res, ctx) => {
    return res(ctx.json({ data: mockNotificationSettings, success: true }));
  }),

  rest.put('/notifications/:id/read', (req, res, ctx) => {
    const { id } = req.params;
    const notification = mockNotifications.find(n => n.id === id);
    if (notification) {
      return res(ctx.json({
        data: { ...notification, isRead: true },
        success: true,
      }));
    }
    return res(ctx.status(404));
  }),

  rest.post('/notifications/mark-all-read', (req, res, ctx) => {
    return res(ctx.json({ success: true, updated: 2 }));
  }),

  rest.delete('/notifications/:id', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;

  send = jest.fn();
  close = jest.fn();

  constructor(url: string) {
    setTimeout(() => {
      if (this.onopen) this.onopen();
    }, 0);
  }
}

global.WebSocket = MockWebSocket as any;

describe('NotificationCenter Component', () => {
  const defaultProps = {
    userId: 'user-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render notification center', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });
    });

    it('should display notifications count badge', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveTextContent('2'); // 2 unread notifications
      });
    });

    it('should display loading state initially', () => {
      render(<NotificationCenter {...defaultProps} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display notifications after loading', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
        expect(screen.getByText('New Job Match')).toBeInTheDocument();
        expect(screen.getByText('Interview Scheduled')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Items', () => {
    it('should display notification titles and messages', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
        expect(screen.getByText(/Your application for Senior Developer/)).toBeInTheDocument();
      });
    });

    it('should display notification timestamps', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        const timestamps = screen.getAllByTestId('notification-timestamp');
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should highlight unread notifications', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        const unreadNotifications = screen.getAllByTestId('notification-unread');
        expect(unreadNotifications.length).toBe(2);
      });
    });

    it('should display priority indicators', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-priority-urgent')).toBeInTheDocument();
        expect(screen.getByTestId('notification-priority-high')).toBeInTheDocument();
      });
    });

    it('should display category icons', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('icon-application')).toBeInTheDocument();
        expect(screen.getByTestId('icon-job')).toBeInTheDocument();
        expect(screen.getByTestId('icon-interview')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Actions', () => {
    it('should mark notification as read when clicked', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
      });

      const notification = screen.getByText('Application Update');
      await user.click(notification);

      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toHaveTextContent('1'); // One less unread
      });
    });

    it('should navigate to action URL when notification clicked', async () => {
      const user = userEvent.setup();
      const mockPush = jest.fn();

      // Mock Next.js router
      jest.mock('next/navigation', () => ({
        useRouter: () => ({
          push: mockPush,
        }),
      }));

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
      });

      const notification = screen.getByText('Application Update');
      await user.click(notification);

      // Navigation should be triggered
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled();
      });
    });

    it('should delete notification when delete button clicked', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Application Update')).not.toBeInTheDocument();
      });
    });

    it('should show confirmation dialog before deleting', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  describe('Mark All as Read', () => {
    it('should display mark all as read button', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
      });
    });

    it('should mark all notifications as read when clicked', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument();
      });

      const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
      await user.click(markAllButton);

      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toHaveTextContent('0');
      });
    });

    it('should disable mark all button when no unread notifications', async () => {
      server.use(
        rest.get('/notifications', (req, res, ctx) => {
          const readNotifications = mockNotifications.map(n => ({ ...n, isRead: true }));
          return res(ctx.json({
            data: readNotifications,
            total: readNotifications.length,
            success: true,
          }));
        }),
      );

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        const markAllButton = screen.getByRole('button', { name: /mark all as read/i });
        expect(markAllButton).toBeDisabled();
      });
    });
  });

  describe('Filtering', () => {
    it('should display filter tabs', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /all/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
      });
    });

    it('should filter by unread notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: /unread/i })).toBeInTheDocument();
      });

      const unreadTab = screen.getByRole('tab', { name: /unread/i });
      await user.click(unreadTab);

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
        expect(screen.getByText('New Job Match')).toBeInTheDocument();
        expect(screen.queryByText('Interview Scheduled')).not.toBeInTheDocument();
      });
    });

    it('should filter by category', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      });

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categorySelect, 'application');

      await waitFor(() => {
        expect(screen.getByText('Application Update')).toBeInTheDocument();
        expect(screen.queryByText('New Job Match')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should establish WebSocket connection', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });
    });

    it('should display new notifications from WebSocket', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });

      // Simulate WebSocket message
      const ws = (global.WebSocket as any).mock.results[0].value;
      const newNotification = {
        id: '4',
        type: 'notification',
        data: {
          id: '4',
          title: 'New Message',
          message: 'You have a new message',
          category: 'message',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      };

      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify(newNotification),
        }));
      }

      await waitFor(() => {
        expect(screen.getByText('New Message')).toBeInTheDocument();
      });
    });

    it('should update badge count with new notifications', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toHaveTextContent('2');
      });

      const ws = (global.WebSocket as any).mock.results[0].value;
      const newNotification = {
        id: '5',
        type: 'notification',
        data: {
          id: '5',
          title: 'Another Notification',
          message: 'Test',
          isRead: false,
        },
      };

      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify(newNotification),
        }));
      }

      await waitFor(() => {
        const badge = screen.getByTestId('notification-badge');
        expect(badge).toHaveTextContent('3');
      });
    });

    it('should show toast for urgent notifications', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });

      const ws = (global.WebSocket as any).mock.results[0].value;
      const urgentNotification = {
        id: '6',
        type: 'notification',
        data: {
          id: '6',
          title: 'Urgent: Interview in 1 hour',
          message: 'Your interview starts soon',
          priority: 'urgent',
          isRead: false,
        },
      };

      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify(urgentNotification),
        }));
      }

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('Notification Settings', () => {
    it('should open settings dialog', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      const settingsButton = screen.getByRole('button', { name: /settings/i });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /notification settings/i })).toBeInTheDocument();
      });
    });

    it('should display notification preferences', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/push notifications/i)).toBeInTheDocument();
      });
    });

    it('should toggle email notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /settings/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/email notifications/i)).toBeInTheDocument();
      });

      const emailToggle = screen.getByLabelText(/email notifications/i);
      await user.click(emailToggle);

      await waitFor(() => {
        expect(screen.getByText(/settings updated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no notifications', async () => {
      server.use(
        rest.get('/notifications', (req, res, ctx) => {
          return res(ctx.json({ data: [], total: 0, success: true }));
        }),
      );

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
      });
    });

    it('should display helpful message in empty state', async () => {
      server.use(
        rest.get('/notifications', (req, res, ctx) => {
          return res(ctx.json({ data: [], total: 0, success: true }));
        }),
      );

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      server.use(
        rest.get('/notifications', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        }),
      );

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument();
      });
    });

    it('should display retry button on error', async () => {
      server.use(
        rest.get('/notifications', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        }),
      );

      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    it('should handle WebSocket connection errors', async () => {
      render(<NotificationCenter {...defaultProps} />);

      const ws = (global.WebSocket as any).mock.results[0].value;
      if (ws.onerror) {
        ws.onerror(new Event('error'));
      }

      // Should not crash and should attempt to reconnect
      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });

      // Tab through notifications
      await user.tab();

      const firstNotification = screen.getAllByRole('button')[0];
      expect(firstNotification).toHaveFocus();
    });

    it('should announce new notifications to screen readers', async () => {
      render(<NotificationCenter {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('notification-center')).toBeInTheDocument();
      });

      const ws = (global.WebSocket as any).mock.results[0].value;
      const newNotification = {
        type: 'notification',
        data: {
          id: '7',
          title: 'New Notification',
          message: 'Test',
          isRead: false,
        },
      };

      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify(newNotification),
        }));
      }

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });
  });
});
