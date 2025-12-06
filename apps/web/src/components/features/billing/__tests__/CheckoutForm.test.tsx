import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Mock Stripe
jest.mock('@stripe/stripe-js');
jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  useStripe: () => mockStripe,
  useElements: () => mockElements,
  CardElement: ({ onChange }: any) => (
    <div data-testid="card-element" onClick={() => onChange?.({ complete: true })}>
      Mock Card Element
    </div>
  ),
}));

let mockStripe: any;
let mockElements: any;

/**
 * Mock CheckoutForm Component
 * Represents a Stripe checkout form with card elements
 */
const CheckoutForm = ({
  planId,
  amount,
  onSuccess,
  onError,
}: {
  planId: string;
  amount: number;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
}) => {
  const [processing, setProcessing] = React.useState(false);
  const [cardComplete, setCardComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // Simulate Stripe payment intent creation
      const response = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const result = await response.json();
      onSuccess?.(result);
    } catch (err: any) {
      setError(err.message);
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form data-testid="checkout-form" onSubmit={handleSubmit}>
      <h2>Complete Your Purchase</h2>
      <div className="plan-summary">
        <div data-testid="plan-id">Plan: {planId}</div>
        <div data-testid="amount">Amount: ${amount.toFixed(2)}</div>
      </div>

      <div className="card-element-container">
        <label htmlFor="card-element">Card Details</label>
        <div data-testid="card-element" onClick={() => setCardComplete(true)}>
          Mock Card Element
        </div>
      </div>

      {error && (
        <div data-testid="error-message" className="error">
          {error}
        </div>
      )}

      <button
        type="submit"
        data-testid="submit-button"
        disabled={processing || !cardComplete}
      >
        {processing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

describe('CheckoutForm Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockStripe = {
      confirmCardPayment: jest.fn(),
      createPaymentMethod: jest.fn(),
    };

    mockElements = {
      getElement: jest.fn().mockReturnValue({}),
    };

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  describe('Form Rendering', () => {
    it('should render checkout form', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      expect(screen.getByTestId('checkout-form')).toBeInTheDocument();
      expect(screen.getByText('Complete Your Purchase')).toBeInTheDocument();
    });

    it('should display plan information', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      expect(screen.getByTestId('plan-id')).toHaveTextContent('Plan: pro');
      expect(screen.getByTestId('amount')).toHaveTextContent('Amount: $29.99');
    });

    it('should render Stripe card element', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      expect(screen.getByTestId('card-element')).toBeInTheDocument();
    });

    it('should display submit button', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Pay $29.99');
    });

    it('should render for Basic plan', () => {
      renderWithProviders(<CheckoutForm planId="basic" amount={9.99} />);

      expect(screen.getByTestId('plan-id')).toHaveTextContent('Plan: basic');
      expect(screen.getByTestId('amount')).toHaveTextContent('Amount: $9.99');
    });

    it('should render for Enterprise plan', () => {
      renderWithProviders(<CheckoutForm planId="enterprise" amount={99.99} />);

      expect(screen.getByTestId('plan-id')).toHaveTextContent('Plan: enterprise');
      expect(screen.getByTestId('amount')).toHaveTextContent('Amount: $99.99');
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button initially', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when card is complete', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).not.toBeDisabled();
    });

    it('should disable submit button during processing', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Processing...');
    });
  });

  describe('Payment Processing', () => {
    it('should submit payment successfully', async () => {
      const handleSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, subscriptionId: 'sub_123' }),
      });

      renderWithProviders(
        <CheckoutForm planId="pro" amount={29.99} onSuccess={handleSuccess} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleSuccess).toHaveBeenCalledWith({
          success: true,
          subscriptionId: 'sub_123',
        });
      });
    });

    it('should send correct payment data', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/v1/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId: 'pro' }),
        });
      });
    });

    it('should handle payment failure', async () => {
      const handleError = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Payment declined' }),
      });

      renderWithProviders(
        <CheckoutForm planId="pro" amount={29.99} onError={handleError} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled();
      });
    });

    it('should display error message on failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
      });

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Payment failed');
      });
    });

    it('should clear previous errors on new submission', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');

      // First submission - fails
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      // Second submission - succeeds
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Different Plans', () => {
    it('should handle Basic plan checkout', async () => {
      const handleSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(
        <CheckoutForm planId="basic" amount={9.99} onSuccess={handleSuccess} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/subscriptions',
          expect.objectContaining({
            body: JSON.stringify({ planId: 'basic' }),
          })
        );
      });
    });

    it('should handle Enterprise plan checkout', async () => {
      const handleSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(
        <CheckoutForm planId="enterprise" amount={99.99} onSuccess={handleSuccess} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/subscriptions',
          expect.objectContaining({
            body: JSON.stringify({ planId: 'enterprise' }),
          })
        );
      });
    });
  });

  describe('Loading States', () => {
    it('should show processing state during submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      expect(submitButton).toHaveTextContent('Processing...');

      await waitFor(
        () => {
          expect(submitButton).toHaveTextContent('Pay $29.99');
        },
        { timeout: 200 }
      );
    });

    it('should re-enable button after processing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors', async () => {
      const handleError = jest.fn();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      renderWithProviders(
        <CheckoutForm planId="pro" amount={29.99} onError={handleError} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(handleError).toHaveBeenCalled();
      });
    });

    it('should handle missing callbacks gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');

      expect(() => fireEvent.click(submitButton)).not.toThrow();
    });

    it('should prevent double submission', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ success: true }),
                }),
              100
            )
          )
      );

      renderWithProviders(<CheckoutForm planId="pro" amount={29.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Form Submission', () => {
    it('should prevent default form submission', async () => {
      const handleSuccess = jest.fn();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      renderWithProviders(
        <CheckoutForm planId="pro" amount={29.99} onSuccess={handleSuccess} />
      );

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const form = screen.getByTestId('checkout-form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(submitEvent, 'preventDefault');

      fireEvent(form, submitEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe('Amount Display', () => {
    it('should format amount with two decimal places', () => {
      renderWithProviders(<CheckoutForm planId="pro" amount={29.9} />);

      expect(screen.getByTestId('amount')).toHaveTextContent('Amount: $29.90');
    });

    it('should handle whole number amounts', () => {
      renderWithProviders(<CheckoutForm planId="basic" amount={10} />);

      expect(screen.getByTestId('amount')).toHaveTextContent('Amount: $10.00');
    });

    it('should display correct amount in button', () => {
      renderWithProviders(<CheckoutForm planId="enterprise" amount={99.99} />);

      const cardElement = screen.getByTestId('card-element');
      fireEvent.click(cardElement);

      const submitButton = screen.getByTestId('submit-button');
      expect(submitButton).toHaveTextContent('Pay $99.99');
    });
  });
});
