'use client';

import { useState } from 'react';
import { Download, Shield, CheckCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { submitPrivacyRequest } from '@/lib/api/gdpr';

type RequestType = 'do-not-sell' | 'know' | 'delete' | 'correct' | 'limit';

export default function DoNotSellPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    state: '',
    requestType: 'do-not-sell' as RequestType,
    verificationMethod: 'email',
    additionalInfo: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await submitPrivacyRequest({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        state: formData.state,
        requestType: formData.requestType,
        additionalInfo: formData.additionalInfo || undefined,
      });

      setRequestId(response.requestId);
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while submitting your request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Do Not Sell My Personal Information
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              CCPA/CPRA Consumer Privacy Rights | Last Updated: December 14, 2024
            </p>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors print:hidden"
          >
            <Download className="w-4 h-4" />
            <span>Print/Save PDF</span>
          </button>
        </div>

        {/* Important Notice */}
        <div className="mt-6 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600 p-6 rounded-r-lg">
          <div className="flex items-start space-x-3">
            <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Important Notice About Your Privacy
              </h2>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  We Do NOT Sell Your Personal Information
                </p>
                <p>
                  ApplyForUs does not and will not sell your personal information to third parties. This page
                  explains your rights under California and other state privacy laws and provides a mechanism
                  to exercise those rights if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What This Means */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          What Does "Sell" Mean Under Privacy Laws?
        </h2>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">CCPA/CPRA Definition</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Under California law, "selling" personal information means sharing it with third parties for
              monetary or other valuable consideration. This includes some data sharing practices that many
              people wouldn't traditionally consider a "sale."
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What We DO NOT Do</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>We do not sell your resume, contact information, or job search data to recruiters or employers</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>We do not sell your personal information to data brokers or marketing companies</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>We do not receive payment for sharing your information with third parties</span>
              </li>
              <li className="flex items-start">
                <CheckCircle className="w-4 h-4 mr-2 mt-0.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span>We do not participate in cross-context behavioral advertising that constitutes a "sale"</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">What We DO</h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  <strong>With Your Consent:</strong> When you apply for jobs through our platform, we share
                  your application materials (resume, cover letter) with the employers you choose to apply to.
                  This is not a "sale" - it's the core service you're using.
                </span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  <strong>Service Providers:</strong> We share information with service providers who help us
                  operate the platform (cloud hosting, payment processing, analytics). These are not "sales"
                  under CCPA.
                </span>
              </li>
              <li className="flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  <strong>Analytics:</strong> We use analytics tools (like Google Analytics) that may use cookies.
                  You can control these through our Cookie Preference Center.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Your Privacy Rights */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Your California Privacy Rights
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), California
          residents have the following rights:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Know</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Request information about personal data we collect, use, and share about you.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Delete</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Request deletion of your personal information, subject to certain exceptions.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Opt-Out</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Opt-out of the sale or sharing of personal information (we don't sell your data).
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Correct</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Request correction of inaccurate personal information.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Limit</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Limit use and disclosure of sensitive personal information.
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Right to Non-Discrimination</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Exercise your rights without facing discrimination.
            </p>
          </div>
        </div>
      </div>

      {/* Other State Privacy Laws */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Other State Privacy Laws
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Similar rights are available to residents of other states with comprehensive privacy laws:
        </p>

        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Virginia (VCDPA)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Virginia Consumer Data Protection Act provides similar opt-out rights for targeted advertising
                and sale of personal data.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Colorado (CPA)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Colorado Privacy Act provides opt-out rights for targeted advertising and sale of personal data.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Connecticut (CTDPA)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Connecticut Data Privacy Act provides similar consumer privacy rights.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Utah (UCPA)</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Utah Consumer Privacy Act provides opt-out rights for targeted advertising and sale of personal data.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Request Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Submit a Privacy Request
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Use this form to exercise your privacy rights. We will respond to verified requests within the
          timeframes required by applicable law (typically 45 days).
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="email@example.com"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                This must match the email associated with your ApplyForUs account
              </p>
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                State/Region *
              </label>
              <select
                id="state"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select your state/region</option>
                <option value="CA">California</option>
                <option value="VA">Virginia</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="UT">Utah</option>
                <option value="other-us">Other US State</option>
                <option value="eu">European Union</option>
                <option value="uk">United Kingdom</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Request Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type of Request *
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="requestType"
                    value="do-not-sell"
                    checked={formData.requestType === 'do-not-sell'}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Do Not Sell My Personal Information</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Opt-out of any sale or sharing of personal information (Note: We don't sell your data)
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="requestType"
                    value="know"
                    checked={formData.requestType === 'know'}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Right to Know</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Request information about personal data collected about you
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="requestType"
                    value="delete"
                    checked={formData.requestType === 'delete'}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Right to Delete</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Request deletion of your personal information
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="requestType"
                    value="correct"
                    checked={formData.requestType === 'correct'}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Right to Correct</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Request correction of inaccurate personal information
                    </div>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="requestType"
                    value="limit"
                    checked={formData.requestType === 'limit'}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Limit Use of Sensitive Information</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Limit use and disclosure of sensitive personal information
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Additional Information (Optional)
              </label>
              <textarea
                id="additionalInfo"
                rows={4}
                value={formData.additionalInfo}
                onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Please provide any additional details about your request..."
              />
            </div>

            {/* Verification Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Verification Required
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                To protect your privacy, we will need to verify your identity before processing your request.
                We may contact you via email or phone to complete verification. This typically takes 1-3 business days.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">
                      Error Submitting Request
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Privacy Request'
                )}
              </button>
              <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
                We will respond within 45 days as required by law
              </p>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Request Submitted Successfully
            </h3>
            {requestId && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 font-mono">
                Request ID: {requestId}
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We've received your privacy request. You will receive a confirmation email shortly at{' '}
              <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              We will contact you within 1-3 business days to verify your identity and process your request.
              Our response will be provided within 45 days as required by law.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setRequestId(null);
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  state: '',
                  requestType: 'do-not-sell',
                  verificationMethod: 'email',
                  additionalInfo: '',
                });
              }}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        )}
      </div>

      {/* Alternative Contact Methods */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Alternative Ways to Submit a Request
        </h2>

        <p className="text-gray-700 dark:text-gray-300 mb-6">
          If you prefer not to use the online form, you can submit your privacy request through these methods:
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Send your request to:
            </p>
            <a
              href="mailto:privacy@applyforus.com"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              privacy@applyforus.com
            </a>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Support Portal</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              Contact our privacy team:
            </p>
            <a
              href="https://applyforus.com/support?topic=privacy"
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Contact Support
            </a>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Response within 24-48 hours
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Mail</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              ApplyForUs, Inc.<br />
              Attn: Privacy Team<br />
              [Physical Address to be added]
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">In-App</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Visit your account settings and navigate to:
              <br />
              <span className="font-mono text-xs">Settings → Privacy → Privacy Requests</span>
            </p>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Authorized Agent</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            You may designate an authorized agent to make a request on your behalf. The agent must provide
            proof of authorization (signed permission) and we may still need to verify your identity directly.
          </p>
        </div>
      </div>

      {/* Additional Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 print:shadow-none">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              How long does it take to process my request?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We will respond to verified requests within 45 days. If we need more time, we will notify you
              and may take up to 90 days total.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Is there a fee to submit a request?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              No, submitting privacy requests is free. However, if requests are manifestly unfounded or
              excessive, we may charge a reasonable fee or refuse the request.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Can you deny my request?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              We may deny requests in certain circumstances, such as when we need to retain information for
              legal obligations or to complete transactions. We will explain our reasoning if we deny a request.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              What if I'm not satisfied with your response?
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              You have the right to appeal our decision or file a complaint with your state attorney general
              or the California Privacy Protection Agency.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            <strong>Related Documents:</strong>
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <a href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
              </a>
            </li>
            <li>
              <a href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                Terms of Service
              </a>
            </li>
            <li>
              <a href="/cookies" className="text-primary-600 dark:text-primary-400 hover:underline">
                Cookie Policy
              </a>
            </li>
          </ul>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Last Updated: December 14, 2024<br />
            © {new Date().getFullYear()} ApplyForUs, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
