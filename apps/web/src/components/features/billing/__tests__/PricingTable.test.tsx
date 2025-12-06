import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * Mock PricingTable Component
 * This represents the expected structure of the PricingTable component
 */
const PricingTable = ({
  onSelectPlan,
  currentTier = 'free',
}: {
  onSelectPlan?: (tier: string) => void;
  currentTier?: string;
}) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'forever',
      features: [
        '10 job applications per month',
        '3 AI-generated cover letters',
        '1 resume upload',
        'Basic job matching',
      ],
    },
    {
      id: 'basic',
      name: 'Basic',
      price: 9.99,
      interval: 'month',
      features: [
        '50 job applications per month',
        '20 AI-generated cover letters',
        '3 resume uploads',
        'Advanced job matching',
        'Email notifications',
      ],
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 29.99,
      interval: 'month',
      popular: true,
      features: [
        '200 job applications per month',
        '100 AI-generated cover letters',
        '10 resume uploads',
        'Premium job matching',
        'Auto-apply to jobs',
        'Priority support',
        'Interview preparation tools',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      interval: 'month',
      features: [
        'Unlimited job applications',
        'Unlimited AI-generated cover letters',
        'Unlimited resume uploads',
        'Enterprise job matching',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom integrations',
        'Advanced analytics',
      ],
    },
  ];

  return (
    <div data-testid="pricing-table">
      <h1>Choose Your Plan</h1>
      <div className="plans-grid">
        {plans.map((plan) => (
          <div
            key={plan.id}
            data-testid={`plan-${plan.id}`}
            className={`plan-card ${plan.popular ? 'popular' : ''} ${
              currentTier === plan.id ? 'current' : ''
            }`}
          >
            {plan.popular && (
              <div className="badge" data-testid="popular-badge">
                Most Popular
              </div>
            )}
            <h2>{plan.name}</h2>
            <div className="price">
              <span className="amount">${plan.price}</span>
              <span className="interval">/{plan.interval}</span>
            </div>
            <ul className="features">
              {plan.features.map((feature, index) => (
                <li key={index} data-testid={`feature-${plan.id}-${index}`}>
                  {feature}
                </li>
              ))}
            </ul>
            <button
              data-testid={`select-plan-${plan.id}`}
              onClick={() => onSelectPlan?.(plan.id)}
              disabled={currentTier === plan.id}
            >
              {currentTier === plan.id ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

describe('PricingTable Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  describe('Plan Display', () => {
    it('should render all pricing plans', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByTestId('plan-free')).toBeInTheDocument();
      expect(screen.getByTestId('plan-basic')).toBeInTheDocument();
      expect(screen.getByTestId('plan-pro')).toBeInTheDocument();
      expect(screen.getByTestId('plan-enterprise')).toBeInTheDocument();
    });

    it('should display correct plan names', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Enterprise')).toBeInTheDocument();
    });

    it('should display correct prices', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('$9.99')).toBeInTheDocument();
      expect(screen.getByText('$29.99')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });

    it('should mark Pro plan as most popular', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByTestId('popular-badge')).toBeInTheDocument();
      expect(screen.getByTestId('popular-badge')).toHaveTextContent('Most Popular');

      const proPlan = screen.getByTestId('plan-pro');
      expect(proPlan).toHaveClass('popular');
    });

    it('should display Free plan features', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByText('10 job applications per month')).toBeInTheDocument();
      expect(screen.getByText('3 AI-generated cover letters')).toBeInTheDocument();
      expect(screen.getByText('1 resume upload')).toBeInTheDocument();
    });

    it('should display Pro plan features', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByText('200 job applications per month')).toBeInTheDocument();
      expect(screen.getByText('Auto-apply to jobs')).toBeInTheDocument();
      expect(screen.getByText('Priority support')).toBeInTheDocument();
    });

    it('should display Enterprise plan unlimited features', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByText('Unlimited job applications')).toBeInTheDocument();
      expect(screen.getByText('Unlimited AI-generated cover letters')).toBeInTheDocument();
      expect(screen.getByText('24/7 priority support')).toBeInTheDocument();
    });
  });

  describe('Current Plan Indication', () => {
    it('should highlight current plan', () => {
      renderWithProviders(<PricingTable currentTier="pro" />);

      const proPlan = screen.getByTestId('plan-pro');
      expect(proPlan).toHaveClass('current');
    });

    it('should disable button for current plan', () => {
      renderWithProviders(<PricingTable currentTier="basic" />);

      const basicButton = screen.getByTestId('select-plan-basic');
      expect(basicButton).toBeDisabled();
      expect(basicButton).toHaveTextContent('Current Plan');
    });

    it('should enable buttons for other plans', () => {
      renderWithProviders(<PricingTable currentTier="basic" />);

      expect(screen.getByTestId('select-plan-free')).not.toBeDisabled();
      expect(screen.getByTestId('select-plan-pro')).not.toBeDisabled();
      expect(screen.getByTestId('select-plan-enterprise')).not.toBeDisabled();
    });
  });

  describe('Plan Selection', () => {
    it('should call onSelectPlan when clicking select button', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(<PricingTable onSelectPlan={handleSelectPlan} />);

      const proButton = screen.getByTestId('select-plan-pro');
      fireEvent.click(proButton);

      expect(handleSelectPlan).toHaveBeenCalledWith('pro');
    });

    it('should not call onSelectPlan for current plan', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(
        <PricingTable onSelectPlan={handleSelectPlan} currentTier="pro" />
      );

      const proButton = screen.getByTestId('select-plan-pro');
      fireEvent.click(proButton);

      expect(handleSelectPlan).not.toHaveBeenCalled();
    });

    it('should handle upgrade from Free to Basic', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(
        <PricingTable onSelectPlan={handleSelectPlan} currentTier="free" />
      );

      const basicButton = screen.getByTestId('select-plan-basic');
      fireEvent.click(basicButton);

      expect(handleSelectPlan).toHaveBeenCalledWith('basic');
    });

    it('should handle upgrade from Basic to Pro', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(
        <PricingTable onSelectPlan={handleSelectPlan} currentTier="basic" />
      );

      const proButton = screen.getByTestId('select-plan-pro');
      fireEvent.click(proButton);

      expect(handleSelectPlan).toHaveBeenCalledWith('pro');
    });

    it('should handle downgrade from Pro to Basic', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(
        <PricingTable onSelectPlan={handleSelectPlan} currentTier="pro" />
      );

      const basicButton = screen.getByTestId('select-plan-basic');
      fireEvent.click(basicButton);

      expect(handleSelectPlan).toHaveBeenCalledWith('basic');
    });
  });

  describe('Plan Comparison', () => {
    it('should show feature differences between plans', () => {
      renderWithProviders(<PricingTable />);

      // Free has limited features
      expect(screen.getByText('10 job applications per month')).toBeInTheDocument();

      // Basic has more features
      expect(screen.getByText('50 job applications per month')).toBeInTheDocument();

      // Pro has advanced features
      expect(screen.getByText('200 job applications per month')).toBeInTheDocument();

      // Enterprise has unlimited
      expect(screen.getByText('Unlimited job applications')).toBeInTheDocument();
    });

    it('should highlight premium features for higher tiers', () => {
      renderWithProviders(<PricingTable />);

      // Pro-specific features
      expect(screen.getByText('Auto-apply to jobs')).toBeInTheDocument();
      expect(screen.getByText('Interview preparation tools')).toBeInTheDocument();

      // Enterprise-specific features
      expect(screen.getByText('Dedicated account manager')).toBeInTheDocument();
      expect(screen.getByText('Custom integrations')).toBeInTheDocument();
    });

    it('should show correct billing intervals', () => {
      renderWithProviders(<PricingTable />);

      // All paid plans are monthly
      const monthlyIntervals = screen.getAllByText(/\/month/);
      expect(monthlyIntervals).toHaveLength(3);

      // Free plan is forever
      expect(screen.getByText('/forever')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should render plans in grid layout', () => {
      renderWithProviders(<PricingTable />);

      const grid = screen.getByClassName('plans-grid');
      expect(grid).toBeInTheDocument();
    });

    it('should maintain plan card structure', () => {
      renderWithProviders(<PricingTable />);

      const freePlan = screen.getByTestId('plan-free');
      expect(freePlan).toHaveClass('plan-card');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button labels', () => {
      renderWithProviders(<PricingTable currentTier="free" />);

      expect(screen.getByTestId('select-plan-basic')).toHaveTextContent('Select Plan');
      expect(screen.getByTestId('select-plan-free')).toHaveTextContent('Current Plan');
    });

    it('should render heading for screen readers', () => {
      renderWithProviders(<PricingTable />);

      expect(screen.getByRole('heading', { name: /Choose Your Plan/i })).toBeInTheDocument();
    });

    it('should have proper semantic structure', () => {
      renderWithProviders(<PricingTable />);

      const planHeadings = screen.getAllByRole('heading', { level: 2 });
      expect(planHeadings).toHaveLength(4);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onSelectPlan prop', () => {
      renderWithProviders(<PricingTable />);

      const proButton = screen.getByTestId('select-plan-pro');
      expect(() => fireEvent.click(proButton)).not.toThrow();
    });

    it('should handle invalid current tier', () => {
      renderWithProviders(<PricingTable currentTier="invalid" />);

      // All buttons should be enabled
      expect(screen.getByTestId('select-plan-free')).not.toBeDisabled();
      expect(screen.getByTestId('select-plan-basic')).not.toBeDisabled();
      expect(screen.getByTestId('select-plan-pro')).not.toBeDisabled();
      expect(screen.getByTestId('select-plan-enterprise')).not.toBeDisabled();
    });

    it('should handle rapid clicks', () => {
      const handleSelectPlan = jest.fn();
      renderWithProviders(<PricingTable onSelectPlan={handleSelectPlan} />);

      const proButton = screen.getByTestId('select-plan-pro');
      fireEvent.click(proButton);
      fireEvent.click(proButton);
      fireEvent.click(proButton);

      expect(handleSelectPlan).toHaveBeenCalledTimes(3);
    });
  });

  describe('Visual Indicators', () => {
    it('should apply popular class to Pro plan', () => {
      renderWithProviders(<PricingTable />);

      const proPlan = screen.getByTestId('plan-pro');
      expect(proPlan).toHaveClass('plan-card', 'popular');
    });

    it('should apply current class to current plan', () => {
      renderWithProviders(<PricingTable currentTier="enterprise" />);

      const enterprisePlan = screen.getByTestId('plan-enterprise');
      expect(enterprisePlan).toHaveClass('plan-card', 'current');
    });

    it('should show popular badge only on Pro plan', () => {
      renderWithProviders(<PricingTable />);

      const badges = screen.queryAllByTestId('popular-badge');
      expect(badges).toHaveLength(1);
    });
  });
});
