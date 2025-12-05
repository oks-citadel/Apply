import { Message, MessageResponse, MessageType } from './types';

/**
 * Chrome Extension Messaging Utilities
 * Handles communication between popup, content scripts, and background script
 */

/**
 * Send message to background script
 */
export async function sendToBackground<T = any, R = any>(
  type: MessageType,
  payload?: T
): Promise<R> {
  const message: Message<T> = {
    type,
    payload,
    requestId: generateRequestId(),
  };

  try {
    const response: MessageResponse<R> = await chrome.runtime.sendMessage(message);

    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    return response.data as R;
  } catch (error) {
    console.error('Error sending message to background:', error);
    throw error;
  }
}

/**
 * Send message to content script in active tab
 */
export async function sendToContentScript<T = any, R = any>(
  type: MessageType,
  payload?: T
): Promise<R> {
  const message: Message<T> = {
    type,
    payload,
    requestId: generateRequestId(),
  };

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error('No active tab found');
    }

    const response: MessageResponse<R> = await chrome.tabs.sendMessage(
      tab.id,
      message
    );

    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    return response.data as R;
  } catch (error) {
    console.error('Error sending message to content script:', error);
    throw error;
  }
}

/**
 * Send message to specific tab
 */
export async function sendToTab<T = any, R = any>(
  tabId: number,
  type: MessageType,
  payload?: T
): Promise<R> {
  const message: Message<T> = {
    type,
    payload,
    requestId: generateRequestId(),
  };

  try {
    const response: MessageResponse<R> = await chrome.tabs.sendMessage(
      tabId,
      message
    );

    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }

    return response.data as R;
  } catch (error) {
    console.error(`Error sending message to tab ${tabId}:`, error);
    throw error;
  }
}

/**
 * Listen for messages
 */
export function onMessage<T = any, R = any>(
  handler: (
    message: Message<T>,
    sender: chrome.runtime.MessageSender
  ) => Promise<R> | R
): void {
  chrome.runtime.onMessage.addListener(
    (
      message: Message<T>,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: MessageResponse<R>) => void
    ) => {
      // Validate message format
      if (!message || typeof message.type !== 'string') {
        sendResponse({
          success: false,
          error: 'Invalid message format',
        });
        return false;
      }

      // Handle the message
      Promise.resolve(handler(message, sender))
        .then((data) => {
          sendResponse({
            success: true,
            data,
            requestId: message.requestId,
          });
        })
        .catch((error) => {
          console.error('Error handling message:', error);
          sendResponse({
            success: false,
            error: error.message || 'Unknown error',
            requestId: message.requestId,
          });
        });

      // Return true to indicate async response
      return true;
    }
  );
}

/**
 * Broadcast message to all tabs
 */
export async function broadcastToAllTabs<T = any>(
  type: MessageType,
  payload?: T
): Promise<void> {
  const message: Message<T> = {
    type,
    payload,
    requestId: generateRequestId(),
  };

  try {
    const tabs = await chrome.tabs.query({});

    await Promise.allSettled(
      tabs.map((tab) => {
        if (tab.id) {
          return chrome.tabs.sendMessage(tab.id, message);
        }
        return Promise.resolve();
      })
    );
  } catch (error) {
    console.error('Error broadcasting to tabs:', error);
  }
}

/**
 * Send message to popup
 */
export async function sendToPopup<T = any>(
  type: MessageType,
  payload?: T
): Promise<void> {
  const message: Message<T> = {
    type,
    payload,
    requestId: generateRequestId(),
  };

  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    // Popup might be closed, ignore error
    console.debug('Could not send message to popup:', error);
  }
}

/**
 * Create a message handler with type safety
 */
export function createMessageHandler<T = any, R = any>(
  type: MessageType,
  handler: (
    payload: T,
    sender: chrome.runtime.MessageSender
  ) => Promise<R> | R
): (message: Message<T>, sender: chrome.runtime.MessageSender) => Promise<R | void> {
  return async (message: Message<T>, sender: chrome.runtime.MessageSender) => {
    if (message.type === type) {
      return await handler(message.payload as T, sender);
    }
  };
}

/**
 * Combine multiple message handlers
 */
export function combineMessageHandlers(
  ...handlers: Array<
    (
      message: Message,
      sender: chrome.runtime.MessageSender
    ) => Promise<any> | any
  >
): (message: Message, sender: chrome.runtime.MessageSender) => Promise<any> {
  return async (message: Message, sender: chrome.runtime.MessageSender) => {
    for (const handler of handlers) {
      try {
        const result = await handler(message, sender);
        if (result !== undefined) {
          return result;
        }
      } catch (error) {
        console.error('Error in message handler:', error);
        throw error;
      }
    }
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Wait for extension context to be ready
 */
export async function waitForExtensionContext(): Promise<void> {
  return new Promise((resolve) => {
    if (chrome?.runtime?.id) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (chrome?.runtime?.id) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

/**
 * Check if extension context is valid
 */
export function isExtensionContextValid(): boolean {
  try {
    return !!chrome?.runtime?.id;
  } catch {
    return false;
  }
}
