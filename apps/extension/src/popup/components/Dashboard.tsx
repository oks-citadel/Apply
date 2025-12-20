import React, { useEffect } from 'react';
import { useExtensionStore } from '../store';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { formatRelativeTime } from '@shared/utils';
import { STATUS_DISPLAY } from '@shared/constants';
import LoadingSpinner from './LoadingSpinner';
import QuickApply from './QuickApply';

const Dashboard: React.FC = () => {
  const {
    stats,
    recentApplications,
    activeResume,
    setCurrentView,
    loadStats,
    loadRecentApplications,
  } = useExtensionStore();

  useEffect(() => {
    loadStats();
    loadRecentApplications();
  }, [loadStats, loadRecentApplications]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<FileText size={20} />}
          label="Total Applied"
          value={stats.totalApplications}
          color="blue"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="This Week"
          value={stats.applicationsThisWeek}
          color="green"
        />
        <StatCard
          icon={<CheckCircle size={20} />}
          label="Response Rate"
          value={`${Math.round(stats.responseRate * 100)}%`}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Interview Rate"
          value={`${Math.round(stats.interviewRate * 100)}%`}
          color="orange"
        />
      </div>

      {/* Active Resume */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Active Resume</h3>
          <button
            onClick={() => setCurrentView('resume-selector')}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            Change
          </button>
        </div>
        {activeResume ? (
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FileText className="text-primary-600" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {activeResume.name}
              </p>
              <p className="text-xs text-gray-500">
                {activeResume.experience.length} experiences •{' '}
                {activeResume.education.length} education
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No resume selected</p>
        )}
      </div>

      {/* Quick Apply */}
      <QuickApply />

      {/* Recent Applications */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Recent Applications
        </h3>

        {recentApplications.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No applications yet
          </p>
        ) : (
          <div className="space-y-2">
            {recentApplications.slice(0, 5).map((application) => (
              <ApplicationItem key={application.id} application={application} />
            ))}

            {recentApplications.length > 5 && (
              <button className="w-full text-xs text-primary-600 hover:text-primary-700 font-medium py-2 flex items-center justify-center">
                View all applications
                <ChevronRight size={14} className="ml-1" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="card">
      <div className="flex items-start space-x-3">
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

interface ApplicationItemProps {
  application: any;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({ application }) => {
  const statusInfo = STATUS_DISPLAY[application.status as keyof typeof STATUS_DISPLAY];

  return (
    <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {application.jobId}
        </p>
        <p className="text-xs text-gray-500">
          {formatRelativeTime(application.appliedAt)}
        </p>
      </div>
      <span className={`status-badge status-${application.status}`}>
        {statusInfo.label}
      </span>
    </div>
  );
};

export default Dashboard;
