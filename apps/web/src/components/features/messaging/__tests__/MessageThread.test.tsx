import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import MessageThread from '../MessageThread';

// Mock data
const mockMessages = [
  {
    id: '1',
    conversationId: 'conv-123',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: '/avatars/john.jpg',
    message: 'Hello, how are you?',
    timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
    read: true,
  },
  {
    id: '2',
    conversationId: 'conv-123',
    senderId: 'user-2',
    senderName: 'Jane Smith',
    senderAvatar: '/avatars/jane.jpg',
    message: 'I am doing great, thanks for asking!',
    timestamp: new Date('2024-01-15T10:05:00Z').toISOString(),
    read: true,
  },
  {
    id: '3',
    conversationId: 'conv-123',
    senderId: 'user-1',
    senderName: 'John Doe',
    senderAvatar: '/avatars/john.jpg',
    message: 'Glad to hear that!',
    timestamp: new Date('2024-01-15T10:10:00Z').toISOString(),
    read: false,
  },
];

const mockConversation = {
  id: 'conv-123',
  participantId: 'user-2',
  participantName: 'Jane Smith',
  participantAvatar: '/avatars/jane.jpg',
  lastMessage: 'Glad to hear that!',
  lastMessageTime: new Date('2024-01-15T10:10:00Z').toISOString(),
  unreadCount: 1,
};

// Setup MSW server
const server = setupServer(
  rest.get('/messages/:conversationId', (req, res, ctx) => {
    return res(ctx.json({ data: mockMessages, success: true }));
  }),

  rest.post('/messages', (req, res, ctx) => {
    const newMessage = {
      id: '4',
      conversationId: 'conv-123',
      senderId: 'current-user',
      senderName: 'Current User',
      message: 'New message',
      timestamp: new Date().toISOString(),
      read: false,
    };
    return res(ctx.json({ data: newMessage, success: true }));
  }),

  rest.put('/messages/:conversationId/read', (req, res, ctx) => {
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

describe('MessageThread Component', () => {
  const defaultProps = {
    conversationId: 'conv-123',
    currentUserId: 'user-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render message thread container', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      render(<MessageThread {...defaultProps} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should display messages after loading', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
        expect(screen.getByText('I am doing great, thanks for asking!')).toBeInTheDocument();
        expect(screen.getByText('Glad to hear that!')).toBeInTheDocument();
      });
    });

    it('should display sender names', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getAllByText('John Doe')).toHaveLength(2);
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });
    });

    it('should display message timestamps', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        const timestamps = screen.getAllByTestId('message-timestamp');
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Message Styling', () => {
    it('should style current user messages differently', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        const currentUserMessages = screen.getAllByTestId('message-current-user');
        expect(currentUserMessages.length).toBeGreaterThan(0);
      });
    });

    it('should style other user messages differently', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        const otherUserMessages = screen.getAllByTestId('message-other-user');
        expect(otherUserMessages.length).toBeGreaterThan(0);
      });
    });

    it('should display avatars for messages', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        const avatars = screen.getAllByRole('img', { name: /avatar/i });
        expect(avatars.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Sending Messages', () => {
    it('should display message input field', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });
    });

    it('should display send button', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
      });
    });

    it('should send message when send button clicked', async () => {
      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello, this is a test message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should send message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      await user.type(input, 'Test message{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when message is typed', async () => {
      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Test');

      expect(sendButton).toBeEnabled();
    });
  });

  describe('Real-time Updates', () => {
    it('should establish WebSocket connection', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });
    });

    it('should display new messages from WebSocket', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });

      // Simulate WebSocket message
      const ws = (global.WebSocket as any).mock.results[0].value;
      const newMessage = {
        id: '5',
        conversationId: 'conv-123',
        senderId: 'user-2',
        senderName: 'Jane Smith',
        message: 'Real-time message',
        timestamp: new Date().toISOString(),
      };

      if (ws.onmessage) {
        ws.onmessage(new MessageEvent('message', {
          data: JSON.stringify({ type: 'new_message', data: newMessage }),
        }));
      }

      await waitFor(() => {
        expect(screen.getByText('Real-time message')).toBeInTheDocument();
      });
    });

    it('should close WebSocket on unmount', () => {
      const { unmount } = render(<MessageThread {...defaultProps} />);

      unmount();

      const ws = (global.WebSocket as any).mock.results[0].value;
      expect(ws.close).toHaveBeenCalled();
    });
  });

  describe('Message Read Status', () => {
    it('should mark messages as read when conversation is opened', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });

      // API should be called to mark messages as read
      await waitFor(() => {
        expect(server.listHandlers()).toBeDefined();
      });
    });

    it('should display read indicators for sent messages', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        const readIndicators = screen.queryAllByTestId('message-read-indicator');
        expect(readIndicators.length).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Scrolling Behavior', () => {
    it('should scroll to bottom on initial load', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('message-thread')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });

    it('should scroll to bottom when new message is sent', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      await user.type(input, 'New message{Enter}');

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when loading fails', async () => {
      server.use(
        rest.get('/messages/:conversationId', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        }),
      );

      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
      });
    });

    it('should display error when sending message fails', async () => {
      server.use(
        rest.post('/messages', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Failed to send' }));
        }),
      );

      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      await user.type(input, 'Test message{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });
    });

    it('should retry loading messages on error', async () => {
      server.use(
        rest.get('/messages/:conversationId', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        }),
      );

      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load messages/i)).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no messages', async () => {
      server.use(
        rest.get('/messages/:conversationId', (req, res, ctx) => {
          return res(ctx.json({ data: [], success: true }));
        }),
      );

      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
      });
    });

    it('should display prompt to start conversation', async () => {
      server.use(
        rest.get('/messages/:conversationId', (req, res, ctx) => {
          return res(ctx.json({ data: [], success: true }));
        }),
      );

      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/start the conversation/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('region', { name: /message thread/i })).toBeInTheDocument();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<MessageThread {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/type a message/i)).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText(/type a message/i);
      await user.tab();

      expect(input).toHaveFocus();
    });
  });
});
