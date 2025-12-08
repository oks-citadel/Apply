import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingSpinner, StatusBadge } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { dashboardApi } from '../../services/api';
import { theme } from '../../theme';
import { MainTabParamList } from '../../navigation/types';
import { Application } from '../../types';

type DashboardScreenProps = NativeStackScreenProps<MainTabParamList, 'Dashboard'>;

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const { user } = useAuthStore();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const {
    data: recentApplications,
    isLoading: applicationsLoading,
    refetch: refetchApplications,
  } = useQuery({
    queryKey: ['recent-applications'],
    queryFn: () => dashboardApi.getRecentApplications(5),
  });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchApplications()]);
    setRefreshing(false);
  }, [refetchStats, refetchApplications]);

  const handleSearchJobs = () => {
    navigation.navigate('Jobs');
  };

  const handleViewApplications = () => {
    navigation.navigate('Applications');
  };

  const handleViewApplication = (applicationId: string) => {
    // Navigate to application details
    // This would require adding the detail screen to the navigation
    console.log('View application:', applicationId);
  };

  if (statsLoading || applicationsLoading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            Hello, {user?.firstName || 'there'}!
          </Text>
          <Text style={styles.subtitle}>Here's your job application overview</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} elevation="sm">
            <Text style={styles.statValue}>{stats?.data.totalApplications || 0}</Text>
            <Text style={styles.statLabel}>Total Applications</Text>
          </Card>

          <Card style={styles.statCard} elevation="sm">
            <Text style={[styles.statValue, { color: theme.colors.warning.main }]}>
              {stats?.data.pendingApplications || 0}
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </Card>

          <Card style={styles.statCard} elevation="sm">
            <Text style={[styles.statValue, { color: theme.colors.success.main }]}>
              {stats?.data.approvedApplications || 0}
            </Text>
            <Text style={styles.statLabel}>Approved</Text>
          </Card>

          <Card style={styles.statCard} elevation="sm">
            <Text style={[styles.statValue, { color: theme.colors.primary[600] }]}>
              {stats?.data.interviewScheduled || 0}
            </Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleSearchJobs}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>🔍</Text>
              </View>
              <Text style={styles.actionLabel}>Search Jobs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={handleViewApplications}
            >
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>📝</Text>
              </View>
              <Text style={styles.actionLabel}>My Applications</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Applications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Applications</Text>
            <TouchableOpacity onPress={handleViewApplications}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentApplications?.data && recentApplications.data.length > 0 ? (
            recentApplications.data.map((application: Application) => (
              <Card
                key={application.id}
                style={styles.applicationCard}
                onPress={() => handleViewApplication(application.id)}
                elevation="sm"
              >
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationInfo}>
                    <Text style={styles.jobTitle}>{application.job.title}</Text>
                    <Text style={styles.companyName}>{application.job.company}</Text>
                  </View>
                  <StatusBadge status={application.status} />
                </View>
                <View style={styles.applicationFooter}>
                  <Text style={styles.applicationDate}>
                    Applied {new Date(application.appliedAt).toLocaleDateString()}
                  </Text>
                  <Text style={styles.location}>{application.job.location}</Text>
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No recent applications</Text>
              <Text style={styles.emptySubtext}>
                Start applying to jobs to see them here
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[600],
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    width: '48%',
    margin: theme.spacing.xs,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
  },
  viewAllText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary[600],
    fontWeight: theme.fontWeight.semibold,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  actionIconText: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[900],
    textAlign: 'center',
  },
  applicationCard: {
    marginBottom: theme.spacing.md,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  applicationInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  jobTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  companyName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  applicationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  location: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  emptyCard: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
});
