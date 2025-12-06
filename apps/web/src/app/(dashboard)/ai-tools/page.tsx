'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Sparkles,
  FileText,
  MessageSquare,
  TrendingUp,
  DollarSign,
  ArrowRight,
} from 'lucide-react';

const aiTools = [
  {
    name: 'Resume Optimization',
    description: 'Analyze and optimize your resume content for better ATS scores',
    icon: FileText,
    href: '/ai-tools/resume-optimizer',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  {
    name: 'Cover Letter Generator',
    description: 'Generate customized cover letters based on job descriptions',
    icon: Sparkles,
    href: '/ai-tools/cover-letter-generator',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
  {
    name: 'Interview Prep',
    description: 'Get interview questions and tips based on job role',
    icon: MessageSquare,
    href: '/ai-tools/interview-prep',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  {
    name: 'Skills Gap Analysis',
    description: 'Identify missing skills based on target job requirements',
    icon: TrendingUp,
    href: '/ai-tools/skills-gap',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
  },
  {
    name: 'Salary Negotiation Assistant',
    description: 'Get salary insights and negotiation tips',
    icon: DollarSign,
    href: '/ai-tools/salary-assistant',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
];

export default function AIToolsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          AI Tools
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Leverage AI-powered tools to enhance your job search and career development
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {aiTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.name} href={tool.href}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 ${tool.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    <span>{tool.name}</span>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How AI Tools Work</CardTitle>
          <CardDescription>
            Our AI-powered tools help you optimize your job search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                1
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Provide Your Information
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Input your resume, job descriptions, or career goals
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                2
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  AI Analysis
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our AI analyzes your data and generates personalized insights
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold">
                3
              </div>
              <div className="ml-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Get Results
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive actionable recommendations and optimized content
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
