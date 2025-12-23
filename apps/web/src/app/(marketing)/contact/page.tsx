'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, AlertCircle, MessageSquare, Clock, Building } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'general',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In production, this would send to your backend
    setSubmitStatus('success');
    setIsSubmitting(false);
    setFormData({ name: '', email: '', subject: '', category: 'general', message: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Get in <span className="text-primary-600">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Email Us</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">For general inquiries</p>
                <a
                  href="mailto:support@applyforus.com"
                  className="text-primary-600 dark:text-primary-400 hover:underline"
                >
                  support@applyforus.com
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Response Time</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">We typically respond within</p>
                <span className="text-green-600 dark:text-green-400 font-medium">24 hours</span>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Enterprise</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">For business inquiries</p>
                <a
                  href="mailto:enterprise@applyforus.com"
                  className="text-purple-600 dark:text-purple-400 hover:underline"
                >
                  enterprise@applyforus.com
                </a>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Send us a message
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Fill out the form below and our team will get back to you as soon as possible.
                Whether you have a question about features, pricing, or anything else, we're here to help.
              </p>

              {submitStatus === 'success' && (
                <div className="flex items-start gap-3 p-4 mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900 dark:text-green-100">Message sent!</h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Thank you for reaching out. We'll get back to you within 24 hours.
                    </p>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900 dark:text-red-100">Failed to send</h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Something went wrong. Please try again or email us directly.
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    disabled={isSubmitting}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Input
                    label="Subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    required
                    disabled={isSubmitting}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="enterprise">Enterprise Sales</option>
                      <option value="partnership">Partnership</option>
                      <option value="feedback">Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={6}
                    placeholder="Tell us more about your inquiry..."
                    required
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white resize-none"
                  />
                </div>

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* FAQ Preview */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Check out some common questions before reaching out.
              </p>

              <div className="space-y-4">
                {[
                  {
                    q: 'How does the AI job matching work?',
                    a: 'Our AI analyzes your resume, skills, and preferences to match you with relevant job opportunities from our database of thousands of positions.',
                  },
                  {
                    q: 'Can I cancel my subscription anytime?',
                    a: 'Yes! You can cancel your subscription at any time from your account settings. Your access continues until the end of your billing period.',
                  },
                  {
                    q: 'Is my data secure?',
                    a: 'Absolutely. We use industry-standard encryption and never share your personal information with employers without your explicit consent.',
                  },
                  {
                    q: 'Do you offer refunds?',
                    a: 'We offer a 14-day money-back guarantee on all paid plans. If you\'re not satisfied, contact our support team for a full refund.',
                  },
                ].map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{faq.q}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{faq.a}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
