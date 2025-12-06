'use client';

import { useState } from 'react';
import { ArrowLeft, DollarSign, TrendingUp, Lightbulb, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import { useSalaryPrediction } from '@/hooks/useAI';

export default function SalaryAssistantPage() {
  const salaryPrediction = useSalaryPrediction();

  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [skills, setSkills] = useState('');
  const [education, setEducation] = useState('');
  const [industry, setIndustry] = useState('');

  const handleAnalyze = async () => {
    if (!jobTitle || !location || !experienceYears) {
      return;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

    salaryPrediction.mutate({
      jobTitle,
      location,
      experienceYears: parseInt(experienceYears),
      skills: skillsArray,
      education: education || undefined,
      industry: industry || undefined,
    });
  };

  const data = salaryPrediction.data;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/ai-tools">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to AI Tools
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Salary Negotiation Assistant
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Get salary insights and negotiation tips based on your profile
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Enter your job details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Job Title *"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Software Engineer"
              />

              <Input
                label="Location *"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., San Francisco, CA"
              />

              <Input
                label="Years of Experience *"
                type="number"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                placeholder="e.g., 5"
                min="0"
                max="50"
              />

              <div>
                <label className="block text-sm font-medium mb-2">Skills</label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800"
                  placeholder="e.g., React, Node.js, Python, AWS (comma-separated)"
                />
              </div>

              <Input
                label="Education (Optional)"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                placeholder="e.g., Bachelor's in Computer Science"
              />

              <Input
                label="Industry (Optional)"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., Technology, Finance"
              />

              <Button
                onClick={handleAnalyze}
                disabled={!jobTitle || !location || !experienceYears || salaryPrediction.isPending}
                className="w-full"
              >
                {salaryPrediction.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Get Salary Insights
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-2 space-y-6">
          {salaryPrediction.isError && (
            <Card className="border-red-200 dark:border-red-800">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100">Error</h3>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {(salaryPrediction.error as Error)?.message || 'Failed to get salary insights. Please try again.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {salaryPrediction.isSuccess && data && (
            <>
              {/* Salary Range */}
              <Card>
                <CardHeader>
                  <CardTitle>Predicted Salary Range</CardTitle>
                  <CardDescription>Based on your profile and market data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.salaryRange?.low ? formatCurrency(data.salaryRange.low) : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                      <div className="text-sm text-primary-600 dark:text-primary-400 mb-1">Median</div>
                      <div className="text-3xl font-bold text-primary-700 dark:text-primary-300">
                        {data.salaryRange?.median ? formatCurrency(data.salaryRange.median) : 'N/A'}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">High</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.salaryRange?.high ? formatCurrency(data.salaryRange.high) : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {data.confidence && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Confidence Level</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                          <div
                            className="h-2 bg-primary-600 rounded-full"
                            style={{ width: `${data.confidence}%` }}
                          />
                        </div>
                        <span className="font-medium">{data.confidence}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Market Insights */}
              {data.marketInsights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                      Market Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {data.marketInsights.demand && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Market Demand
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.marketInsights.demand}
                        </p>
                      </div>
                    )}
                    {data.marketInsights.growth && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          Growth Trend
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {data.marketInsights.growth}
                        </p>
                      </div>
                    )}
                    {data.marketInsights.topCompanies && data.marketInsights.topCompanies.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Top Hiring Companies
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {data.marketInsights.topCompanies.map((company: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-full"
                            >
                              {company}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Negotiation Tips */}
              {data.negotiationTips && data.negotiationTips.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
                      Negotiation Tips
                    </CardTitle>
                    <CardDescription>
                      Strategies to maximize your compensation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {data.negotiationTips.map((tip: string, idx: number) => (
                        <li key={idx} className="flex items-start">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold mr-3">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300 pt-0.5">
                            {tip}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Factors Affecting Salary */}
              {data.factors && data.factors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Factors Affecting Your Salary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.factors.map((factor: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {factor.name}
                          </span>
                          <div className="flex items-center">
                            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2">
                              <div
                                className="h-2 bg-primary-600 rounded-full"
                                style={{ width: `${factor.impact}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12 text-right">
                              {factor.impact > 0 ? '+' : ''}{factor.impact}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!salaryPrediction.isSuccess && !salaryPrediction.isError && !salaryPrediction.isPending && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your job details to get salary insights and negotiation tips</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
