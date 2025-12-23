'use client';

import { useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  DollarSign,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Gift,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Crown,
  Zap,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';

type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';
type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing';

interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  amount: number;
  currency: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  credits: number;
  createdAt: string;
}

const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-1',
    userId: 'user-1',
    userName: 'John Doe',
    userEmail: 'john.doe@example.com',
    tier: 'pro',
    status: 'active',
    currentPeriodStart: '2024-03-01',
    currentPeriodEnd: '2024-04-01',
    amount: 29,
    currency: 'USD',
    stripeCustomerId: 'cus_abc123',
    stripeSubscriptionId: 'sub_def456',
    credits: 150,
    createdAt: '2024-01-15',
  },
  {
    id: 'sub-2',
    userId: 'user-2',
    userName: 'Jane Smith',
    userEmail: 'jane.smith@example.com',
    tier: 'enterprise',
    status: 'active',
    currentPeriodStart: '2024-03-01',
    currentPeriodEnd: '2024-04-01',
    amount: 99,
    currency: 'USD',
    stripeCustomerId: 'cus_ghi789',
    stripeSubscriptionId: 'sub_jkl012',
    credits: 500,
    createdAt: '2024-02-01',
  },
  {
    id: 'sub-3',
    userId: 'user-3',
    userName: 'Bob Johnson',
    userEmail: 'bob.johnson@example.com',
    tier: 'basic',
    status: 'past_due',
    currentPeriodStart: '2024-02-15',
    currentPeriodEnd: '2024-03-15',
    amount: 9,
    currency: 'USD',
    stripeCustomerId: 'cus_mno345',
    stripeSubscriptionId: 'sub_pqr678',
    credits: 25,
    createdAt: '2024-01-20',
  },
  {
    id: 'sub-4',
    userId: 'user-4',
    userName: 'Alice Williams',
    userEmail: 'alice.williams@example.com',
    tier: 'pro',
    status: 'cancelled',
    currentPeriodStart: '2024-02-01',
    currentPeriodEnd: '2024-03-01',
    amount: 29,
    currency: 'USD',
    stripeCustomerId: 'cus_stu901',
    stripeSubscriptionId: 'sub_vwx234',
    credits: 0,
    createdAt: '2024-01-10',
  },
  {
    id: 'sub-5',
    userId: 'user-5',
    userName: 'Charlie Brown',
    userEmail: 'charlie.brown@example.com',
    tier: 'free',
    status: 'active',
    currentPeriodStart: '2024-03-18',
    currentPeriodEnd: '2024-04-18',
    amount: 0,
    currency: 'USD',
    credits: 5,
    createdAt: '2024-03-18',
  },
  {
    id: 'sub-6',
    userId: 'user-6',
    userName: 'Diana Prince',
    userEmail: 'diana.prince@example.com',
    tier: 'pro',
    status: 'trialing',
    currentPeriodStart: '2024-03-15',
    currentPeriodEnd: '2024-03-29',
    amount: 29,
    currency: 'USD',
    stripeCustomerId: 'cus_yza567',
    stripeSubscriptionId: 'sub_bcd890',
    credits: 100,
    createdAt: '2024-03-15',
  },
];

export default function SubscriptionsPage() {
  const [subscriptions] = useState<Subscription[]>(mockSubscriptions);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [showTierModal, setShowTierModal] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditReason, setCreditReason] = useState('');
  const itemsPerPage = 10;

  const getTierBadge = (tier: SubscriptionTier) => {
    const styles = {
      free: 'bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400',
      basic: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
      pro: 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400',
      enterprise: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
    };
    const icons = {
      free: null,
      basic: <Zap className="w-3 h-3 mr-1" />,
      pro: <Crown className="w-3 h-3 mr-1" />,
      enterprise: <Users className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}>
        {icons[tier]}
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const styles = {
      active: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400',
      past_due: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
      trialing: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400',
    };
    const icons = {
      active: <CheckCircle className="w-3 h-3 mr-1" />,
      cancelled: <XCircle className="w-3 h-3 mr-1" />,
      past_due: <AlertTriangle className="w-3 h-3 mr-1" />,
      trialing: <Clock className="w-3 h-3 mr-1" />,
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {icons[status]}
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </span>
    );
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'all' || sub.tier === tierFilter;
    const matchesStatus = statusFilter === 'all' || sub.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalMRR = subscriptions
    .filter((s) => s.status === 'active' || s.status === 'trialing')
    .reduce((sum, s) => sum + s.amount, 0);

  const activeSubscribers = subscriptions.filter((s) => s.status === 'active').length;
  const churnedThisMonth = subscriptions.filter((s) => s.status === 'cancelled').length;
  const trialingUsers = subscriptions.filter((s) => s.status === 'trialing').length;

  const handleApplyCredits = () => {
    if (selectedSubscription && creditAmount !== 0) {
      console.log(`Applying ${creditAmount} credits to ${selectedSubscription.userId}. Reason: ${creditReason}`);
      alert(`Successfully applied ${creditAmount} credits to ${selectedSubscription.userName}'s account`);
      setShowCreditsModal(false);
      setCreditAmount(0);
      setCreditReason('');
      setSelectedSubscription(null);
    }
  };

  const handleChangeTier = (newTier: SubscriptionTier) => {
    if (selectedSubscription) {
      console.log(`Changing ${selectedSubscription.userId} tier from ${selectedSubscription.tier} to ${newTier}`);
      alert(`Successfully changed ${selectedSubscription.userName}'s tier to ${newTier}`);
      setShowTierModal(false);
      setSelectedSubscription(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Subscriptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage user subscriptions, credits, and billing
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors">
          <RefreshCw className="w-4 h-4" />
          <span>Sync with Stripe</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Monthly Revenue (MRR)
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalMRR.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Subscribers
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {activeSubscribers}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Churned This Month
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {churnedThisMonth}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                In Trial
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {trialingUsers}
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or subscription ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
            />
          </div>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Tiers</option>
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="past_due">Past Due</option>
            <option value="trialing">Trialing</option>
          </select>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Credits
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period End
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {sub.userName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {sub.userEmail}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getTierBadge(sub.tier)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(sub.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${sub.amount}/{sub.amount > 0 ? 'mo' : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {sub.credits}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900 dark:text-white">
                      {format(new Date(sub.currentPeriodEnd), 'MMM dd, yyyy')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowCreditsModal(true);
                        }}
                        className="p-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 transition-colors"
                        title="Apply credits/refund"
                      >
                        <Gift className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedSubscription(sub);
                          setShowTierModal(true);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="Change tier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredSubscriptions.length)} of{' '}
              {filteredSubscriptions.length} subscriptions
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credits Modal */}
      {showCreditsModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowCreditsModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Apply Credits / Refund
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Modifying credits for: <strong>{selectedSubscription.userName}</strong>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Credit Amount (negative for refund)
                  </label>
                  <input
                    type="number"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Enter amount..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    placeholder="Enter reason for credit adjustment..."
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreditsModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyCredits}
                  disabled={creditAmount === 0 || !creditReason}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Credits
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tier Change Modal */}
      {showTierModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowTierModal(false)}
            />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Change Subscription Tier
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Current tier for <strong>{selectedSubscription.userName}</strong>:{' '}
                {getTierBadge(selectedSubscription.tier)}
              </p>
              <div className="space-y-3">
                {(['free', 'basic', 'pro', 'enterprise'] as SubscriptionTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleChangeTier(tier)}
                    disabled={tier === selectedSubscription.tier}
                    className={`w-full flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      tier === selectedSubscription.tier
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 cursor-not-allowed'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {tier === selectedSubscription.tier && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </span>
                    </div>
                    {tier !== 'free' && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        ${tier === 'basic' ? 9 : tier === 'pro' ? 29 : 99}/mo
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowTierModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
