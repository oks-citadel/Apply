'use client';

import { Bell, User, Lock, CreditCard, Globe, Shield, Copy, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { ProfileForm } from '@/components/forms/ProfileForm';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useChangePassword,
  usePreferences,
  useUpdatePreferences,
  useSubscription,
  useCreateCheckoutSession,
  useUpdatePaymentMethod,
  useProfile,
} from '@/hooks/useUser';
import { useSetupMfa, useVerifyMfa, useDisableMfa } from '@/hooks/useAuth';

// Password change validation schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

// Preferences validation schema
const preferencesSchema = z.object({
  locations: z.string(),
  jobTypes: z.object({
    fullTime: z.boolean(),
    partTime: z.boolean(),
    contract: z.boolean(),
  }),
  minSalary: z.string(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-2">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'billing' && <BillingSettings />}
          {activeTab === 'preferences' && <PreferenceSettings />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Account</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationSettings() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();
  const [emailFrequency, setEmailFrequency] = useState<'immediate' | 'daily' | 'weekly'>(
    'daily'
  );

  const [notificationSettings, setNotificationSettings] = useState({
    applicationUpdates: true,
    newJobs: true,
    interviews: true,
    marketingEmails: false,
  });

  // Initialize state from preferences
  useState(() => {
    if (preferences) {
      setNotificationSettings({
        applicationUpdates: preferences.notifications.email.applicationUpdates,
        newJobs: preferences.notifications.email.newJobs,
        interviews: preferences.notifications.push.interviews,
        marketingEmails: preferences.notifications.email.marketingEmails,
      });
      setEmailFrequency(preferences.jobAlerts.frequency);
    }
  });

  const handleToggle = (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key],
    };
    setNotificationSettings(newSettings);

    // Save to backend
    updatePreferences.mutate({
      notifications: {
        email: {
          applicationUpdates: newSettings.applicationUpdates,
          newJobs: newSettings.newJobs,
          marketingEmails: newSettings.marketingEmails,
        },
        push: {
          applicationUpdates: newSettings.applicationUpdates,
          newJobs: newSettings.newJobs,
          interviews: newSettings.interviews,
        },
      },
    });
  };

  const handleFrequencyChange = (frequency: 'immediate' | 'daily' | 'weekly') => {
    setEmailFrequency(frequency);
    updatePreferences.mutate({
      jobAlerts: {
        frequency,
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Choose what notifications you want to receive</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <NotificationToggle
            title="Application Updates"
            description="Receive notifications when your application status changes"
            checked={notificationSettings.applicationUpdates}
            onChange={() => handleToggle('applicationUpdates')}
          />
          <NotificationToggle
            title="New Job Matches"
            description="Get notified about new jobs that match your profile"
            checked={notificationSettings.newJobs}
            onChange={() => handleToggle('newJobs')}
          />
          <NotificationToggle
            title="Interview Reminders"
            description="Reminders about upcoming interviews"
            checked={notificationSettings.interviews}
            onChange={() => handleToggle('interviews')}
          />
          <NotificationToggle
            title="Marketing Emails"
            description="Receive tips, guides, and product updates"
            checked={notificationSettings.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
          />
        </div>

        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            Email Frequency
          </h3>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="frequency"
                checked={emailFrequency === 'immediate'}
                onChange={() => handleFrequencyChange('immediate')}
                className="mr-2"
              />
              <span className="text-sm">Immediate - Get notified right away</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="frequency"
                checked={emailFrequency === 'daily'}
                onChange={() => handleFrequencyChange('daily')}
                className="mr-2"
              />
              <span className="text-sm">Daily - Receive a daily digest</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="frequency"
                checked={emailFrequency === 'weekly'}
                onChange={() => handleFrequencyChange('weekly')}
                className="mr-2"
              />
              <span className="text-sm">Weekly - Receive a weekly summary</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  const { data: profile } = useProfile();
  const changePassword = useChangePassword();
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onPasswordSubmit = async (data: PasswordFormData) => {
    await changePassword.mutateAsync({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    reset();
  };

  const handleEnable2FA = () => {
    if (profile?.mfaEnabled) {
      setShowDisable2FAModal(true);
    } else {
      setShow2FAModal(true);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              error={errors.currentPassword?.message}
              {...register('currentPassword')}
            />
            <Input
              label="New Password"
              type="password"
              error={errors.newPassword?.message}
              helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
              {...register('newPassword')}
            />
            <Input
              label="Confirm New Password"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield
                className={`w-5 h-5 ${
                  profile?.mfaEnabled ? 'text-green-600' : 'text-gray-400'
                }`}
              />
              <div>
                <p className="font-medium">
                  {profile?.mfaEnabled ? '2FA Enabled' : '2FA Disabled'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {profile?.mfaEnabled
                    ? 'Your account is protected with 2FA'
                    : 'Add an authenticator app for extra security'}
                </p>
              </div>
            </div>
            <Button variant={profile?.mfaEnabled ? 'outline' : 'default'} onClick={handleEnable2FA}>
              {profile?.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {show2FAModal && <TwoFactorSetupModal onClose={() => setShow2FAModal(false)} />}
      {showDisable2FAModal && (
        <TwoFactorDisableModal onClose={() => setShowDisable2FAModal(false)} />
      )}
    </div>
  );
}

function TwoFactorSetupModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const setupMfa = useSetupMfa();
  const verifyMfa = useVerifyMfa();

  const handleSetup = async () => {
    const result = await setupMfa.mutateAsync();
    setBackupCodes(result.backupCodes);
    setStep('verify');
  };

  const handleVerify = async () => {
    await verifyMfa.mutateAsync(verificationCode);
    setStep('backup');
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleComplete = () => {
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Enable Two-Factor Authentication"
      description={
        step === 'setup'
          ? 'Secure your account with 2FA'
          : step === 'verify'
          ? 'Scan the QR code with your authenticator app'
          : 'Save your backup codes'
      }
      size="lg"
    >
      {step === 'setup' && (
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Before you begin
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  You'll need an authenticator app like Google Authenticator, Authy, or 1Password to
                  scan the QR code.
                </p>
              </div>
            </div>
          </div>

          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSetup} disabled={setupMfa.isPending}>
              {setupMfa.isPending ? 'Setting up...' : 'Continue'}
            </Button>
          </ModalFooter>
        </div>
      )}

      {step === 'verify' && setupMfa.data && (
        <div className="space-y-4">
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <img src={setupMfa.data.qrCode} alt="QR Code" className="w-48 h-48" />
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Or enter this code manually:
            </p>
            <code className="block text-center font-mono text-lg">
              {setupMfa.data.secret}
            </code>
          </div>

          <Input
            label="Verification Code"
            placeholder="Enter 6-digit code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            helperText="Enter the 6-digit code from your authenticator app"
          />

          <ModalFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleVerify}
              disabled={verifyMfa.isPending || verificationCode.length !== 6}
            >
              {verifyMfa.isPending ? 'Verifying...' : 'Verify & Enable'}
            </Button>
          </ModalFooter>
        </div>
      )}

      {step === 'backup' && (
        <div className="space-y-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100">
                  Save these backup codes
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                  Store these codes in a safe place. You can use them to access your account if you
                  lose your device.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleCopyBackupCodes}
          >
            {copiedCodes ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Backup Codes
              </>
            )}
          </Button>

          <ModalFooter>
            <Button onClick={handleComplete} className="w-full">
              Done
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}

function TwoFactorDisableModal({ onClose }: { onClose: () => void }) {
  const [verificationCode, setVerificationCode] = useState('');
  const disableMfa = useDisableMfa();

  const handleDisable = async () => {
    await disableMfa.mutateAsync(verificationCode);
    onClose();
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="Disable Two-Factor Authentication"
      description="Enter your verification code to disable 2FA"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">Warning</h4>
              <p className="text-sm text-red-800 dark:text-red-200 mt-1">
                Disabling 2FA will make your account less secure.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
          helperText="Enter the code from your authenticator app"
        />

        <ModalFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDisable}
            disabled={disableMfa.isPending || verificationCode.length !== 6}
          >
            {disableMfa.isPending ? 'Disabling...' : 'Disable 2FA'}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function BillingSettings() {
  const { data: subscription, isLoading } = useSubscription();
  const createCheckout = useCreateCheckoutSession();
  const updatePaymentMethod = useUpdatePaymentMethod();

  const handleUpgrade = () => {
    createCheckout.mutate({ plan: 'pro', interval: 'month' });
  };

  const handleManageSubscription = () => {
    updatePaymentMethod.mutate();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPro = subscription?.plan === 'pro';
  const isActive = subscription?.status === 'active';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold capitalize">
                  {subscription?.plan || 'Free'} Plan
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isPro
                    ? 'Advanced features for power users'
                    : 'Basic features for job seekers'}
                </p>
                {subscription?.cancelAtPeriodEnd && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    Cancels on{' '}
                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  ${isPro ? '29' : '0'}
                </div>
                <div className="text-sm text-gray-600">per month</div>
              </div>
            </div>

            {subscription?.usage && (
              <div className="space-y-3 mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Resumes</span>
                    <span>
                      {subscription.usage.resumesUsed} /{' '}
                      {subscription.usage.resumesLimit === -1
                        ? 'Unlimited'
                        : subscription.usage.resumesLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          subscription.usage.resumesLimit === -1
                            ? 100
                            : (subscription.usage.resumesUsed /
                                subscription.usage.resumesLimit) *
                              100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Applications</span>
                    <span>
                      {subscription.usage.applicationsUsed} /{' '}
                      {subscription.usage.applicationsLimit === -1
                        ? 'Unlimited'
                        : subscription.usage.applicationsLimit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full"
                      style={{
                        width: `${
                          subscription.usage.applicationsLimit === -1
                            ? 100
                            : (subscription.usage.applicationsUsed /
                                subscription.usage.applicationsLimit) *
                              100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {!isPro && (
              <Button onClick={handleUpgrade} disabled={createCheckout.isPending}>
                {createCheckout.isPending ? 'Loading...' : 'Upgrade to Pro'}
              </Button>
            )}

            {isPro && isActive && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={updatePaymentMethod.isPending}
              >
                {updatePaymentMethod.isPending ? 'Loading...' : 'Manage Subscription'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isPro && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Manage your payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {subscription?.stripeCustomerId
                ? 'Payment method on file'
                : 'No payment method added'}
            </p>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={updatePaymentMethod.isPending}
            >
              {updatePaymentMethod.isPending
                ? 'Loading...'
                : subscription?.stripeCustomerId
                ? 'Update Payment Method'
                : 'Add Payment Method'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PreferenceSettings() {
  const { data: preferences, isLoading } = usePreferences();
  const updatePreferences = useUpdatePreferences();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      locations: preferences?.jobAlerts.filters.location?.join(', ') || '',
      jobTypes: {
        fullTime: preferences?.jobAlerts.filters.employmentType?.includes('full-time') || true,
        partTime: preferences?.jobAlerts.filters.employmentType?.includes('part-time') || false,
        contract: preferences?.jobAlerts.filters.employmentType?.includes('contract') || false,
      },
      minSalary: preferences?.jobAlerts.filters.salaryMin?.toString() || '',
    },
  });

  const onSubmit = async (data: PreferencesFormData) => {
    const employmentTypes: string[] = [];
    if (data.jobTypes.fullTime) employmentTypes.push('full-time');
    if (data.jobTypes.partTime) employmentTypes.push('part-time');
    if (data.jobTypes.contract) employmentTypes.push('contract');

    await updatePreferences.mutateAsync({
      jobAlerts: {
        filters: {
          location: data.locations.split(',').map((l) => l.trim()),
          employmentType: employmentTypes,
          salaryMin: data.minSalary ? parseInt(data.minSalary.replace(/\D/g, '')) : undefined,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Preferences</CardTitle>
        <CardDescription>Customize your application preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Input
            label="Preferred Job Locations"
            placeholder="e.g., San Francisco, Remote, New York"
            error={errors.locations?.message}
            helperText="Separate multiple locations with commas"
            {...register('locations')}
          />

          <div>
            <label className="block text-sm font-medium mb-2">Job Types</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" {...register('jobTypes.fullTime')} />
                <span className="text-sm">Full-time</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" {...register('jobTypes.partTime')} />
                <span className="text-sm">Part-time</span>
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" {...register('jobTypes.contract')} />
                <span className="text-sm">Contract</span>
              </label>
            </div>
          </div>

          <Input
            label="Minimum Salary Expectation"
            placeholder="e.g., 100000"
            error={errors.minSalary?.message}
            helperText="Enter amount in USD (numbers only)"
            {...register('minSalary')}
          />

          <Button type="submit" disabled={updatePreferences.isPending}>
            {updatePreferences.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function NotificationToggle({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer ml-4">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={onChange}
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
      </label>
    </div>
  );
}
