export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum SubscriptionPlan {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
  UNPAID = 'unpaid',
}

export interface PlanFeatures {
  plan: SubscriptionPlan;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: PlanFeature[];
  limits: PlanLimits;
}

export interface PlanFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PlanLimits {
  applicationsPerDay: number;
  resumeUploads: number;
  aiAnalysisPerMonth: number;
  autoApplyEnabled: boolean;
  prioritySupport: boolean;
  customBranding: boolean;
}

export interface Invoice {
  id: string;
  userId: string;
  stripeInvoiceId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  paidAt?: Date;
  dueDate: Date;
  invoiceUrl: string;
  pdfUrl: string;
  createdAt: Date;
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

export interface PaymentMethod {
  id: string;
  stripePaymentMethodId: string;
  type: 'card' | 'bank_account';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
  createdAt: Date;
}

export interface UsageRecord {
  userId: string;
  period: string; // YYYY-MM
  applicationsSubmitted: number;
  aiAnalysisUsed: number;
  resumesUploaded: number;
  autoApplyUsed: number;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface BillingPortalSession {
  url: string;
}
