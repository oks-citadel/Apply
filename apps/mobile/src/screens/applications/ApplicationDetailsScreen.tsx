import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, LoadingSpinner, StatusBadge } from '../../components/common';
import { applicationsApi } from '../../services/api';
import { theme } from '../../theme';
import { ApplicationsStackParamList } from '../../navigation/types';

type ApplicationDetailsScreenProps = NativeStackScreenProps<
  ApplicationsStackParamList,
  'ApplicationDetails'
>;

export const ApplicationDetailsScreen: React.FC<ApplicationDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { applicationId } = route.params;
  const queryClient = useQueryClient();

  const {
    data: applicationData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationsApi.getApplicationById(applicationId),
  });

  const withdrawMutation = useMutation({
    mutationFn: (id: string) => applicationsApi.withdrawApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Success', 'Application withdrawn successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to withdraw application'
      );
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw this application? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => withdrawMutation.mutate(applicationId),
        },
      ]
    );
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) {
      return 'Not specified';
    }
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success.main;
      case 'rejected':
      case 'withdrawn':
        return theme.colors.error.main;
      case 'interview':
        return theme.colors.primary[600];
      case 'reviewing':
        return theme.colors.warning.main;
      default:
        return theme.colors.gray[500];
    }
  };

  const getTimelineEvents = (application: any) => {
    const events = [
      {
        title: 'Application Submitted',
        date: application.appliedAt,
        status: 'completed',
      },
    ];

    if (
      application.status === 'reviewing' ||
      application.status === 'interview' ||
      application.status === 'approved' ||
      application.status === 'rejected'
    ) {
      events.push({
        title: 'Under Review',
        date: application.updatedAt,
        status: 'completed',
      });
    }

    if (application.status === 'interview' || application.status === 'approved') {
      events.push({
        title: 'Interview Scheduled',
        date: application.updatedAt,
        status: 'completed',
      });
    }

    if (application.status === 'approved') {
      events.push({
        title: 'Approved',
        date: application.updatedAt,
        status: 'completed',
      });
    }

    if (application.status === 'rejected') {
      events.push({
        title: 'Rejected',
        date: application.updatedAt,
        status: 'completed',
      });
    }

    if (application.status === 'withdrawn') {
      events.push({
        title: 'Withdrawn',
        date: application.updatedAt,
        status: 'completed',
      });
    }

    return events;
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading application details..." />;
  }

  const application = applicationData?.data;

  if (!application) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Application not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const timelineEvents = getTimelineEvents(application);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Application Header */}
        <Card style={styles.headerCard} elevation="sm">
          <View style={styles.headerContent}>
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>
                {application.job.company.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.jobTitle}>{application.job.title}</Text>
              <Text style={styles.companyName}>{application.job.company}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{application.job.location}</Text>
              </View>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <StatusBadge status={application.status} />
          </View>
        </Card>

        {/* Application Info */}
        <Card style={styles.infoCard} elevation="sm">
          <Text style={styles.sectionTitle}>Application Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <View style={styles.infoValueContainer}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: getStatusColor(application.status) },
                ]}
              />
              <Text style={styles.infoValue}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Applied On</Text>
            <Text style={styles.infoValue}>
              {new Date(application.appliedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Updated</Text>
            <Text style={styles.infoValue}>
              {new Date(application.updatedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {application.resume && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Resume</Text>
              <Text style={styles.infoValue}>{application.resume.fileName}</Text>
            </View>
          )}
        </Card>

        {/* Job Summary */}
        <Card style={styles.jobSummaryCard} elevation="sm">
          <Text style={styles.sectionTitle}>Job Summary</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Employment Type</Text>
              <Text style={styles.detailValue}>
                {application.job.employmentType.charAt(0).toUpperCase() +
                  application.job.employmentType.slice(1)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Work Type</Text>
              <Text style={styles.detailValue}>
                {application.job.locationType.charAt(0).toUpperCase() +
                  application.job.locationType.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Salary Range</Text>
              <Text style={styles.detailValue}>
                {formatSalary(application.job.salary)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Timeline */}
        <Card style={styles.timelineCard} elevation="sm">
          <Text style={styles.sectionTitle}>Application Timeline</Text>

          {timelineEvents.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineIndicator}>
                <View
                  style={[
                    styles.timelineDot,
                    index === timelineEvents.length - 1 && styles.timelineDotActive,
                  ]}
                />
                {index < timelineEvents.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>{event.title}</Text>
                <Text style={styles.timelineDate}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Notes */}
        {application.notes && (
          <Card style={styles.notesCard} elevation="sm">
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notesText}>{application.notes}</Text>
          </Card>
        )}

        {/* Cover Letter */}
        {application.coverLetter && (
          <Card style={styles.coverLetterCard} elevation="sm">
            <Text style={styles.sectionTitle}>Cover Letter</Text>
            <Text style={styles.coverLetterText}>{application.coverLetter}</Text>
          </Card>
        )}

        {/* Company Contact (Placeholder) */}
        <Card style={styles.contactCard} elevation="sm">
          <Text style={styles.sectionTitle}>Company Contact</Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactIcon}>🏢</Text>
            <View style={styles.contactDetails}>
              <Text style={styles.contactName}>{application.job.company}</Text>
              <Text style={styles.contactText}>
                Check your email for contact information
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Withdraw Button */}
      {application.status !== 'withdrawn' &&
        application.status !== 'rejected' &&
        application.status !== 'approved' && (
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={[
                styles.withdrawButton,
                withdrawMutation.isPending && styles.withdrawButtonDisabled,
              ]}
              onPress={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              <Text style={styles.withdrawButtonText}>
                {withdrawMutation.isPending ? 'Withdrawing...' : 'Withdraw Application'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
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
  headerCard: {
    marginBottom: theme.spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  companyLogo: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  companyLogoText: {
    fontSize: theme.fontSize.xxl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  headerInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  companyName: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[600],
    marginBottom: theme.spacing.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  locationText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[700],
  },
  statusContainer: {
    alignItems: 'flex-start',
  },
  infoCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[100],
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    fontWeight: theme.fontWeight.medium,
  },
  infoValue: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[900],
    fontWeight: theme.fontWeight.semibold,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  jobSummaryCard: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    fontWeight: theme.fontWeight.semibold,
  },
  detailValue: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[900],
    fontWeight: theme.fontWeight.medium,
  },
  timelineCard: {
    marginBottom: theme.spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.gray[300],
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  timelineDotActive: {
    backgroundColor: theme.colors.primary[600],
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.gray[200],
    marginTop: theme.spacing.xs,
  },
  timelineContent: {
    flex: 1,
    paddingTop: -2,
  },
  timelineTitle: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  timelineDate: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  notesCard: {
    marginBottom: theme.spacing.md,
  },
  notesText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[700],
    lineHeight: 22,
  },
  coverLetterCard: {
    marginBottom: theme.spacing.md,
  },
  coverLetterText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[700],
    lineHeight: 24,
  },
  contactCard: {
    marginBottom: theme.spacing.md,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactIcon: {
    fontSize: 32,
    marginRight: theme.spacing.md,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  contactText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  bottomPadding: {
    height: theme.spacing.xl,
  },
  actionBar: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  withdrawButton: {
    height: 56,
    backgroundColor: theme.colors.error.main,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
  },
  withdrawButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.white,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.lg,
  },
  button: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
  },
  buttonText: {
    fontSize: theme.fontSize.md,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.white,
  },
});
