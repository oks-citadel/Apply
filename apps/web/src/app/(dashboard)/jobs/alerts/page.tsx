'use client';

import { useState } from 'react';
import { Plus, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { AlertForm } from '@/components/features/alerts/AlertForm';
import { AlertListItem } from '@/components/features/alerts/AlertListItem';
import {
  useJobAlerts,
  useCreateJobAlert,
  useUpdateJobAlert,
  useDeleteJobAlert,
  useToggleJobAlert,
} from '@/hooks/useJobAlerts';
import type { JobAlert } from '@/types/alert';

export default function JobAlertsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);

  const { data, isLoading } = useJobAlerts();
  const createAlert = useCreateJobAlert();
  const updateAlert = useUpdateJobAlert();
  const deleteAlert = useDeleteJobAlert();
  const toggleAlert = useToggleJobAlert();

  const alerts = data?.alerts || [];
  const activeAlerts = alerts.filter((alert) => alert.isActive);
  const pausedAlerts = alerts.filter((alert) => !alert.isActive);

  const handleCreateAlert = () => {
    setEditingAlert(null);
    setShowForm(true);
  };

  const handleEditAlert = (alert: JobAlert) => {
    setEditingAlert(alert);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleSubmit = async (data: any) => {
    if (editingAlert) {
      await updateAlert.mutateAsync({ id: editingAlert.id, data });
    } else {
      await createAlert.mutateAsync(data);
    }
    setShowForm(false);
    setEditingAlert(null);
  };

  const handleDeleteAlert = (id: string) => {
    deleteAlert.mutate(id);
  };

  const handleToggleAlert = (id: string, isActive: boolean) => {
    toggleAlert.mutate({ id, isActive });
  };

  if (showForm) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {editingAlert ? 'Edit Job Alert' : 'Create Job Alert'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {editingAlert
              ? 'Update your job alert preferences'
              : 'Set up a new alert to get notified about relevant jobs'}
          </p>
        </div>

        <AlertForm
          alert={editingAlert || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
          isLoading={createAlert.isPending || updateAlert.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Job Alerts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your job alerts and notification preferences
          </p>
        </div>
        <Button onClick={handleCreateAlert}>
          <Plus className="w-4 h-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Stats */}
      {alerts.length > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Total Alerts
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {alerts.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Alerts
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {activeAlerts.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Paused Alerts
                  </p>
                  <p className="text-3xl font-bold text-gray-600 dark:text-gray-400 mt-2">
                    {pausedAlerts.length}
                  </p>
                </div>
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-12 h-12" />}
          title="No job alerts yet"
          description="Create your first job alert to get notified about relevant opportunities"
          action={
            <Button onClick={handleCreateAlert}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Alert
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Active Alerts */}
          {activeAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Active Alerts ({activeAlerts.length})
              </h2>
              <div className="space-y-4">
                {activeAlerts.map((alert) => (
                  <AlertListItem
                    key={alert.id}
                    alert={alert}
                    onEdit={handleEditAlert}
                    onDelete={handleDeleteAlert}
                    onToggle={handleToggleAlert}
                    isDeleting={deleteAlert.isPending}
                    isToggling={toggleAlert.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paused Alerts */}
          {pausedAlerts.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Paused Alerts ({pausedAlerts.length})
              </h2>
              <div className="space-y-4">
                {pausedAlerts.map((alert) => (
                  <AlertListItem
                    key={alert.id}
                    alert={alert}
                    onEdit={handleEditAlert}
                    onDelete={handleDeleteAlert}
                    onToggle={handleToggleAlert}
                    isDeleting={deleteAlert.isPending}
                    isToggling={toggleAlert.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      {alerts.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-start">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  How Job Alerts Work
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  We'll check for new jobs matching your criteria and send you notifications based on
                  your preferred frequency. You can pause or edit alerts at any time. Make sure to
                  enable email notifications in your account settings to receive alerts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
