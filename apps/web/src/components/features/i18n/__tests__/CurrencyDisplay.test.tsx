import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CurrencyDisplay } from '../CurrencyDisplay';
import * as i18nHooks from '@/hooks/useI18n';

// Mock i18n hook
const mockUseI18n = {
  locale: 'en',
  currency: 'USD',
  formatCurrency: (amount: number, currency?: string) => {
    const curr = currency || 'USD';
    const symbol = curr === 'USD' ? '$' : curr === 'EUR' ? '€' : '£';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  },
  convertCurrency: jest.fn(),
};

jest.spyOn(i18nHooks, 'useI18n').mockReturnValue(mockUseI18n as any);

describe('CurrencyDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render currency amount', () => {
      render(<CurrencyDisplay amount={1234.56} />);

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should render with custom currency', () => {
      render(<CurrencyDisplay amount={1234.56} currency="EUR" />);

      expect(screen.getByText('€1,234.56')).toBeInTheDocument();
    });

    it('should render zero amount', () => {
      render(<CurrencyDisplay amount={0} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should render negative amounts', () => {
      render(<CurrencyDisplay amount={-500} />);

      expect(screen.getByText(/-.*500/)).toBeInTheDocument();
    });

    it('should render large amounts correctly', () => {
      render(<CurrencyDisplay amount={1000000} />);

      expect(screen.getByText(/1,000,000/)).toBeInTheDocument();
    });

    it('should render small decimal amounts', () => {
      render(<CurrencyDisplay amount={0.99} />);

      expect(screen.getByText('$0.99')).toBeInTheDocument();
    });
  });

  describe('Formatting', () => {
    it('should format USD correctly', () => {
      render(<CurrencyDisplay amount={1234.56} currency="USD" />);

      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });

    it('should format EUR correctly', () => {
      mockUseI18n.formatCurrency = (amount: number) =>
        `€${amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`;

      render(<CurrencyDisplay amount={1234.56} currency="EUR" />);

      expect(screen.getByText(/€/)).toBeInTheDocument();
    });

    it('should format GBP correctly', () => {
      mockUseI18n.formatCurrency = (amount: number) =>
        `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`;

      render(<CurrencyDisplay amount={1234.56} currency="GBP" />);

      expect(screen.getByText(/£/)).toBeInTheDocument();
    });

    it('should format JPY without decimals', () => {
      mockUseI18n.formatCurrency = (amount: number) =>
        `¥${amount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;

      render(<CurrencyDisplay amount={1234.56} currency="JPY" />);

      expect(screen.getByText(/¥1,235/)).toBeInTheDocument();
    });

    it('should apply locale-specific formatting', () => {
      jest.spyOn(i18nHooks, 'useI18n').mockReturnValue({
        ...mockUseI18n,
        locale: 'de',
        formatCurrency: (amount: number) =>
          `${amount.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR'
          })}`,
      } as any);

      render(<CurrencyDisplay amount={1234.56} currency="EUR" />);

      // German format uses comma as decimal separator
      expect(screen.getByText(/1\.234,56/)).toBeInTheDocument();
    });

    it('should handle thousands separators correctly', () => {
      render(<CurrencyDisplay amount={1234567.89} />);

      expect(screen.getByText(/1,234,567\.89/)).toBeInTheDocument();
    });

    it('should round to 2 decimal places by default', () => {
      render(<CurrencyDisplay amount={1234.567} />);

      expect(screen.getByText(/1,234\.57/)).toBeInTheDocument();
    });

    it('should support custom decimal places', () => {
      render(<CurrencyDisplay amount={1234.567} decimals={3} />);

      expect(screen.getByText(/1,234\.567/)).toBeInTheDocument();
    });
  });

  describe('Currency Symbols', () => {
    it('should show currency symbol by default', () => {
      render(<CurrencyDisplay amount={100} />);

      expect(screen.getByText(/\$/)).toBeInTheDocument();
    });

    it('should hide currency symbol when showSymbol is false', () => {
      render(<CurrencyDisplay amount={100} showSymbol={false} />);

      expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
      expect(screen.getByText('100.00')).toBeInTheDocument();
    });

    it('should show currency code instead of symbol', () => {
      render(<CurrencyDisplay amount={100} showCode />);

      expect(screen.getByText(/USD/)).toBeInTheDocument();
    });

    it('should position symbol before amount for USD', () => {
      render(<CurrencyDisplay amount={100} currency="USD" />);

      const text = screen.getByText(/\$100/).textContent;
      expect(text).toMatch(/^\$/);
    });

    it('should position symbol after amount for EUR (some locales)', () => {
      jest.spyOn(i18nHooks, 'useI18n').mockReturnValue({
        ...mockUseI18n,
        locale: 'fr',
        formatCurrency: (amount: number) =>
          `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
      } as any);

      render(<CurrencyDisplay amount={100} currency="EUR" />);

      const text = screen.getByText(/€/).textContent;
      expect(text).toMatch(/€$/);
    });
  });

  describe('Conversion', () => {
    it('should show conversion option when enabled', () => {
      render(<CurrencyDisplay amount={100} allowConversion />);

      expect(screen.getByRole('button', { name: /convert/i })).toBeInTheDocument();
    });

    it('should not show conversion by default', () => {
      render(<CurrencyDisplay amount={100} />);

      expect(screen.queryByRole('button', { name: /convert/i })).not.toBeInTheDocument();
    });

    it('should open conversion dialog when clicked', async () => {
      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/convert currency/i)).toBeInTheDocument();
      });
    });

    it('should show available currencies in conversion dialog', async () => {
      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));

      await waitFor(() => {
        expect(screen.getByText('EUR')).toBeInTheDocument();
        expect(screen.getByText('GBP')).toBeInTheDocument();
        expect(screen.getByText('JPY')).toBeInTheDocument();
      });
    });

    it('should convert currency when selected', async () => {
      mockUseI18n.convertCurrency.mockResolvedValue({
        amount: 100,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 92.5,
        rate: 0.925,
      });

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      await waitFor(() => {
        expect(mockUseI18n.convertCurrency).toHaveBeenCalledWith({
          amount: 100,
          from: 'USD',
          to: 'EUR',
        });
      });
    });

    it('should display converted amount', async () => {
      mockUseI18n.convertCurrency.mockResolvedValue({
        amount: 100,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 92.5,
        rate: 0.925,
      });

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      await waitFor(() => {
        expect(screen.getByText(/92\.50/)).toBeInTheDocument();
      });
    });

    it('should show conversion rate', async () => {
      mockUseI18n.convertCurrency.mockResolvedValue({
        amount: 100,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 92.5,
        rate: 0.925,
      });

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion showRate />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      await waitFor(() => {
        expect(screen.getByText(/rate.*0\.925/i)).toBeInTheDocument();
      });
    });
  });

  describe('Compact Mode', () => {
    it('should display compact notation for large amounts', () => {
      render(<CurrencyDisplay amount={1500000} compact />);

      expect(screen.getByText(/1\.5M/)).toBeInTheDocument();
    });

    it('should display thousands as K', () => {
      render(<CurrencyDisplay amount={5000} compact />);

      expect(screen.getByText(/5K/)).toBeInTheDocument();
    });

    it('should display millions as M', () => {
      render(<CurrencyDisplay amount={2500000} compact />);

      expect(screen.getByText(/2\.5M/)).toBeInTheDocument();
    });

    it('should display billions as B', () => {
      render(<CurrencyDisplay amount={1000000000} compact />);

      expect(screen.getByText(/1B/)).toBeInTheDocument();
    });

    it('should not use compact notation for small amounts', () => {
      render(<CurrencyDisplay amount={500} compact />);

      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CurrencyDisplay amount={100} className="custom-class" />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should apply color for positive amounts', () => {
      render(<CurrencyDisplay amount={100} colorize />);

      const element = screen.getByText(/100/);
      expect(element).toHaveClass('text-green-600');
    });

    it('should apply color for negative amounts', () => {
      render(<CurrencyDisplay amount={-100} colorize />);

      const element = screen.getByText(/-100/);
      expect(element).toHaveClass('text-red-600');
    });

    it('should not apply color by default', () => {
      render(<CurrencyDisplay amount={100} />);

      const element = screen.getByText(/100/);
      expect(element).not.toHaveClass('text-green-600');
      expect(element).not.toHaveClass('text-red-600');
    });

    it('should apply size variants', () => {
      render(<CurrencyDisplay amount={100} size="lg" />);

      const element = screen.getByText(/100/);
      expect(element).toHaveClass('text-lg');
    });

    it('should apply bold styling', () => {
      render(<CurrencyDisplay amount={100} bold />);

      const element = screen.getByText(/100/);
      expect(element).toHaveClass('font-bold');
    });
  });

  describe('Loading States', () => {
    it('should show loading state during conversion', async () => {
      mockUseI18n.convertCurrency.mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100)),
      );

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should show skeleton while loading initial amount', () => {
      render(<CurrencyDisplay amount={100} loading />);

      expect(screen.getByTestId('currency-skeleton')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle conversion errors gracefully', async () => {
      mockUseI18n.convertCurrency.mockRejectedValue(
        new Error('Conversion failed'),
      );

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      await waitFor(() => {
        expect(screen.getByText(/conversion failed/i)).toBeInTheDocument();
      });
    });

    it('should display fallback for invalid amounts', () => {
      render(<CurrencyDisplay amount={NaN} />);

      expect(screen.getByText(/invalid amount/i)).toBeInTheDocument();
    });

    it('should handle undefined currency gracefully', () => {
      render(<CurrencyDisplay amount={100} currency={undefined} />);

      expect(screen.getByText(/100/)).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should show full amount on hover when compact', async () => {
      const user = userEvent.setup();
      render(<CurrencyDisplay amount={1500000} compact />);

      const element = screen.getByText(/1\.5M/);
      await user.hover(element);

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
        expect(screen.getByText('$1,500,000.00')).toBeInTheDocument();
      });
    });

    it('should show conversion rate in tooltip when enabled', async () => {
      const user = userEvent.setup();
      render(
        <CurrencyDisplay
          amount={100}
          originalAmount={108}
          originalCurrency="EUR"
          showTooltip
        />,
      );

      const element = screen.getByText(/100/);
      await user.hover(element);

      await waitFor(() => {
        expect(screen.getByText(/converted from/i)).toBeInTheDocument();
        expect(screen.getByText(/108.*EUR/)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      render(<CurrencyDisplay amount={100} currency="USD" />);

      expect(screen.getByLabelText(/100 US dollars/i)).toBeInTheDocument();
    });

    it('should announce currency changes to screen readers', async () => {
      mockUseI18n.convertCurrency.mockResolvedValue({
        amount: 100,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 92.5,
        rate: 0.925,
      });

      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      await user.click(screen.getByRole('button', { name: /convert/i }));
      await user.click(screen.getByText('EUR'));

      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/converted to.*EUR/i);
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      render(<CurrencyDisplay amount={100} allowConversion />);

      const button = screen.getByRole('button', { name: /convert/i });
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Comparison Mode', () => {
    it('should show comparison when provided', () => {
      render(
        <CurrencyDisplay
          amount={100}
          compareAmount={120}
          showComparison
        />,
      );

      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/120/)).toBeInTheDocument();
    });

    it('should show percentage difference', () => {
      render(
        <CurrencyDisplay
          amount={100}
          compareAmount={120}
          showComparison
          showDifference
        />,
      );

      expect(screen.getByText(/20%/)).toBeInTheDocument();
    });

    it('should indicate increase with up arrow', () => {
      render(
        <CurrencyDisplay
          amount={120}
          compareAmount={100}
          showComparison
          showTrend
        />,
      );

      expect(screen.getByTestId('trend-up-icon')).toBeInTheDocument();
    });

    it('should indicate decrease with down arrow', () => {
      render(
        <CurrencyDisplay
          amount={100}
          compareAmount={120}
          showComparison
          showTrend
        />,
      );

      expect(screen.getByTestId('trend-down-icon')).toBeInTheDocument();
    });
  });
});
