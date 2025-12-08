'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Bell, Edit2, Trash2, MapPin, DollarSign, Briefcase, Calendar } from 'lucide-react';
import type { JobAlert } from '@/types/alert';

interface AlertListItemProps {
  alert: JobAlert;
  onEdit: (alert: JobAlert) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
}

export function AlertListItem({
  alert,
  onEdit,
  onDelete,
  onToggle,
  isDeleting,
  isToggling,
}: AlertListItemProps) {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    onDelete(alert.id);
    setShowConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const frequencyLabels = {
    instant: 'Instant',
    daily: 'Daily',
    weekly: 'Weekly',
  };

  return (
    <Card className={!alert.isActive ? 'opacity-60' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {alert.name}
              </h3>
              {alert.isActive ? (
                <Badge variant="success" className="text-xs">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Paused
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {/* Job Title */}
              {alert.jobTitle && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Briefcase className="w-4 h-4 mr-2" />
                  <span>{alert.jobTitle}</span>
                </div>
              )}

              {/* Keywords */}
              {alert.keywords && alert.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alert.keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Location */}
              {(alert.location || alert.isRemote) && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span>
                    {alert.location}
                    {alert.location && alert.isRemote && ' or '}
                    {alert.isRemote && 'Remote'}
                  </span>
                </div>
              )}

              {/* Salary Range */}
              {(alert.salaryMin || alert.salaryMax) && (
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span>
                    {alert.salaryMin && alert.salaryMax
                      ? `$${alert.salaryMin.toLocaleString()} - $${alert.salaryMax.toLocaleString()}`
                      : alert.salaryMin
                      ? `From $${alert.salaryMin.toLocaleString()}`
                      : `Up to $${alert.salaryMax?.toLocaleString()}`}
                  </span>
                </div>
              )}

              {/* Employment Type */}
              {alert.employmentType && alert.employmentType.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alert.employmentType.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {type.split('-').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Experience Level */}
              {alert.experienceLevel && alert.experienceLevel.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alert.experienceLevel.map((level, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Notification Settings */}
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 pt-2">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2" />
                  <span>{frequencyLabels[alert.notificationFrequency]}</span>
                </div>
                {alert.lastTriggered && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Last triggered: {formatDate(alert.lastTriggered)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-3 ml-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={alert.isActive}
                onCheckedChange={(checked) => onToggle(alert.id, checked)}
                disabled={isToggling}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(alert)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showConfirmDelete && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200 mb-3">
              Are you sure you want to delete this alert? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDelete}
                className="text-gray-700 dark:text-gray-300"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-red-600 text-white hover:bg-red-700 border-red-600"
              >
                {isDeleting ? 'Deleting...' : 'Delete Alert'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
