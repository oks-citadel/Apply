'use client';

import React, { useState } from 'react';

interface CheckoutFormProps {
  planId: string;
  planName: string;
  price: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CheckoutForm({
  planId,
  planName,
  price,
  onSuccess,
  onCancel,
}: CheckoutFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        body: JSON.stringify({ planId }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="checkout-form">
      <h2>Checkout</h2>

      <div>
        <p>Plan: {planName}</p>
        <p>Price: ${price}/month</p>
      </div>

      {error && <div role="alert">{error}</div>}

      <div>
        <label htmlFor="card">Card Information</label>
        <input
          id="card"
          type="text"
          placeholder="Card number"
          required
        />
      </div>

      <div>
        <button type="submit" disabled={isProcessing}>
          {isProcessing ? 'Processing...' : `Pay $${price}`}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default CheckoutForm;
