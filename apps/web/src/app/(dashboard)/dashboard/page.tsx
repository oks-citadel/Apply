import { FileText, Briefcase, Send, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const metadata = {
  title: 'Dashboard - JobPilot AI',
  description: 'Your job search dashboard',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Welcome back! Here's your job search overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Resumes"
          value="5"
          icon={<FileText className="w-5 h-5" />}
          trend="+2 this month"
        />
        <StatCard
          title="Jobs Saved"
          value="23"
          icon={<Briefcase className="w-5 h-5" />}
          trend="+12 this week"
        />
        <StatCard
          title="Applications Sent"
          value="18"
          icon={<Send className="w-5 h-5" />}
          trend="+5 this week"
        />
        <StatCard
          title="Response Rate"
          value="22%"
          icon={<TrendingUp className="w-5 h-5" />}
          trend="+5% from last month"
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with your job search
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/dashboard/resumes">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <FileText className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Create Resume</div>
                  <div className="text-sm text-gray-500">Build a new resume</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/jobs">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Briefcase className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">Search Jobs</div>
                  <div className="text-sm text-gray-500">Find opportunities</div>
                </div>
              </Button>
            </Link>
            <Link href="/dashboard/applications">
              <Button variant="outline" className="w-full justify-start h-auto py-4">
                <Send className="w-5 h-5 mr-3" />
                <div className="text-left">
                  <div className="font-semibold">View Applications</div>
                  <div className="text-sm text-gray-500">Track your progress</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Applications</CardTitle>
            <CardDescription>Your latest job applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem
                title="Senior Frontend Developer"
                company="Tech Corp"
                status="Under Review"
                date="2 days ago"
              />
              <ActivityItem
                title="Full Stack Engineer"
                company="StartupXYZ"
                status="Interview Scheduled"
                date="5 days ago"
              />
              <ActivityItem
                title="React Developer"
                company="Digital Agency"
                status="Applied"
                date="1 week ago"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended Jobs</CardTitle>
            <CardDescription>Based on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <JobItem
                title="Software Engineer"
                company="Innovation Labs"
                location="Remote"
                salary="$120k - $150k"
              />
              <JobItem
                title="Frontend Developer"
                company="Design Studio"
                location="New York, NY"
                salary="$100k - $130k"
              />
              <JobItem
                title="Full Stack Developer"
                company="E-commerce Co"
                location="San Francisco, CA"
                salary="$130k - $160k"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</span>
          <div className="text-gray-400">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
        <p className="text-xs text-gray-500">{trend}</p>
      </CardContent>
    </Card>
  );
}

function ActivityItem({
  title,
  company,
  status,
  date,
}: {
  title: string;
  company: string;
  status: string;
  date: string;
}) {
  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
      </div>
      <div className="text-right">
        <span className="inline-block px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 rounded">
          {status}
        </span>
        <p className="text-xs text-gray-500 mt-1">{date}</p>
      </div>
    </div>
  );
}

function JobItem({
  title,
  company,
  location,
  salary,
}: {
  title: string;
  company: string;
  location: string;
  salary: string;
}) {
  return (
    <div className="flex items-start justify-between pb-4 border-b last:border-0">
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{company}</p>
        <p className="text-xs text-gray-500 mt-1">{location}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{salary}</p>
      </div>
    </div>
  );
}
