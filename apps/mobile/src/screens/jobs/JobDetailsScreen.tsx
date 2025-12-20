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
import { Card, LoadingSpinner } from '../../components/common';
import { jobsApi, applicationsApi } from '../../services/api';
import { theme } from '../../theme';
import { JobsStackParamList } from '../../navigation/types';

type JobDetailsScreenProps = NativeStackScreenProps<JobsStackParamList, 'JobDetails'>;

export const JobDetailsScreen: React.FC<JobDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { jobId } = route.params;
  const queryClient = useQueryClient();
  const [isSaved, setIsSaved] = useState(false);

  const {
    data: jobData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getJobById(jobId),
  });

  const saveJobMutation = useMutation({
    mutationFn: () => jobsApi.saveJob(jobId),
    onSuccess: () => {
      setIsSaved(true);
      Alert.alert('Success', 'Job saved successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save job');
    },
  });

  const unsaveJobMutation = useMutation({
    mutationFn: () => jobsApi.unsaveJob(jobId),
    onSuccess: () => {
      setIsSaved(false);
      Alert.alert('Success', 'Job removed from saved');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to remove saved job');
    },
  });

  const applyMutation = useMutation({
    mutationFn: (jobId: string) => applicationsApi.createApplication({ jobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Success', 'Application submitted successfully', [
        {
          text: 'View Applications',
          onPress: () => navigation.navigate('JobsList'),
        },
        { text: 'OK' },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to submit application'
      );
    },
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleSaveToggle = () => {
    if (isSaved) {
      unsaveJobMutation.mutate();
    } else {
      saveJobMutation.mutate();
    }
  };

  const handleApply = () => {
    Alert.alert('Apply to Job', 'Are you sure you want to apply to this position?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Apply',
        onPress: () => applyMutation.mutate(jobId),
      },
    ]);
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) {
      return 'Not specified';
    }
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  if (isLoading && !refreshing) {
    return <LoadingSpinner fullScreen text="Loading job details..." />;
  }

  const job = jobData?.data;

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Job Header */}
        <Card style={styles.headerCard} elevation="sm">
          <View style={styles.headerContent}>
            <View style={styles.companyLogo}>
              <Text style={styles.companyLogoText}>
                {job.company.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.companyName}>{job.company}</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationIcon}>📍</Text>
                <Text style={styles.locationText}>{job.location}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Job Details */}
        <Card style={styles.detailsCard} elevation="sm">
          <Text style={styles.sectionTitle}>Job Details</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Employment Type</Text>
              <Text style={styles.detailValue}>
                {job.employmentType.charAt(0).toUpperCase() + job.employmentType.slice(1)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Work Type</Text>
              <Text style={styles.detailValue}>
                {job.locationType.charAt(0).toUpperCase() + job.locationType.slice(1)}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Salary Range</Text>
              <Text style={styles.detailValue}>{formatSalary(job.salary)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Posted</Text>
              <Text style={styles.detailValue}>
                {new Date(job.postedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {job.applicationCount > 0 && (
            <View style={styles.applicantsInfo}>
              <Text style={styles.applicantsIcon}>👥</Text>
              <Text style={styles.applicantsText}>
                {job.applicationCount} applicant{job.applicationCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </Card>

        {/* Description */}
        <Card style={styles.sectionCard} elevation="sm">
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>
        </Card>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <Text style={styles.sectionTitle}>Requirements</Text>
            {job.requirements.map((requirement, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listItemText}>{requirement}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <Card style={styles.sectionCard} elevation="sm">
            <Text style={styles.sectionTitle}>Benefits</Text>
            {job.benefits.map((benefit, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.bullet}>✓</Text>
                <Text style={styles.listItemText}>{benefit}</Text>
              </View>
            ))}
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveToggle}
          disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
        >
          <Text style={styles.saveButtonIcon}>{isSaved ? '❤️' : '🤍'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.applyButton,
            applyMutation.isPending && styles.applyButtonDisabled,
          ]}
          onPress={handleApply}
          disabled={applyMutation.isPending}
        >
          <Text style={styles.applyButtonText}>
            {applyMutation.isPending ? 'Applying...' : 'Apply Now'}
          </Text>
        </TouchableOpacity>
      </View>
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
  detailsCard: {
    marginBottom: theme.spacing.md,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.gray[900],
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
  applicantsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  applicantsIcon: {
    fontSize: 16,
    marginRight: theme.spacing.xs,
  },
  applicantsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
  },
  descriptionText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[700],
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  bullet: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary[600],
    marginRight: theme.spacing.md,
    fontWeight: theme.fontWeight.bold,
  },
  listItemText: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[700],
    lineHeight: 22,
  },
  bottomPadding: {
    height: theme.spacing.xl,
  },
  actionBar: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
    gap: theme.spacing.md,
  },
  saveButton: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonIcon: {
    fontSize: 24,
  },
  applyButton: {
    flex: 1,
    height: 56,
    backgroundColor: theme.colors.primary[600],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    backgroundColor: theme.colors.gray[400],
  },
  applyButtonText: {
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
