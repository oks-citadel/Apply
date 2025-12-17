'use client';

import React from 'react';

interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  locale?: string;
  showSymbol?: boolean;
}

export function CurrencyDisplay({
  amount,
  currency = 'USD',
  locale = 'en-US',
  showSymbol = true,
}: CurrencyDisplayProps) {
  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return <span data-testid="currency-display">{formatted}</span>;
}

export default CurrencyDisplay;
