'use client';

import React, { useState } from 'react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface MessageThreadProps {
  threadId: string;
  messages?: Message[];
  onSendMessage?: (content: string) => void;
  currentUserId?: string;
}

export function MessageThread({
  threadId,
  messages = [],
  onSendMessage,
  currentUserId,
}: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      if (onSendMessage) {
        onSendMessage(newMessage);
      }
      setNewMessage('');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div data-testid="message-thread">
      <div className="messages">
        {messages.length === 0 ? (
          <p>No messages yet</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.senderId === currentUserId ? 'sent' : 'received'
              }
            >
              <p className="sender">{message.senderName}</p>
              <p className="content">{message.content}</p>
              <p className="timestamp">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="compose">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          aria-label="Message input"
        />
        <button onClick={handleSend} disabled={isSending || !newMessage.trim()}>
          {isSending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default MessageThread;
