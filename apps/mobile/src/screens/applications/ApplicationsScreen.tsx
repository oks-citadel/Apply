import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, LoadingSpinner, StatusBadge } from '../../components/common';
import { applicationsApi } from '../../services/api';
import { theme } from '../../theme';
import { MainTabParamList } from '../../navigation/types';
import { Application, ApplicationStatus } from '../../types';

type ApplicationsScreenProps = NativeStackScreenProps<
  MainTabParamList,
  'Applications'
>;

const TABS: Array<{ key: ApplicationStatus | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export const ApplicationsScreen: React.FC<ApplicationsScreenProps> = ({
  navigation,
}) => {
  const [selectedTab, setSelectedTab] = useState<ApplicationStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const {
    data: applicationsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['applications', selectedTab, page],
    queryFn: () =>
      applicationsApi.getApplications({
        page,
        limit: 20,
        status: selectedTab === 'all' ? undefined : selectedTab,
      }),
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) =>
      applicationsApi.withdrawApplication(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      Alert.alert('Success', 'Application withdrawn successfully');
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
    setPage(1);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLoadMore = () => {
    if (
      applicationsData?.data.meta &&
      applicationsData.data.meta.page < applicationsData.data.meta.totalPages &&
      !isFetching
    ) {
      setPage((prev) => prev + 1);
    }
  };

  const handleApplicationPress = (application: Application) => {
    // Navigate to application details
    console.log('View application:', application.id);
  };

  const handleWithdraw = (application: Application) => {
    if (application.status === 'withdrawn') {
      Alert.alert('Info', 'Application already withdrawn');
      return;
    }

    Alert.alert(
      'Withdraw Application',
      `Are you sure you want to withdraw your application for ${application.job.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => withdrawMutation.mutate(application.id),
        },
      ]
    );
  };

  const renderApplicationCard = ({ item }: { item: Application }) => (
    <Card
      style={styles.applicationCard}
      onPress={() => handleApplicationPress(item)}
      elevation="sm"
    >
      <View style={styles.cardHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.companyLogoText}>
            {item.job.company.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.applicationInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.job.title}
          </Text>
          <Text style={styles.companyName}>{item.job.company}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.job.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📅</Text>
          <Text style={styles.detailText}>
            Applied {new Date(item.appliedAt).toLocaleDateString()}
          </Text>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <StatusBadge status={item.status} />

        {item.status !== 'withdrawn' && item.status !== 'rejected' && (
          <TouchableOpacity
            style={styles.withdrawButton}
            onPress={() => handleWithdraw(item)}
          >
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>No applications found</Text>
      <Text style={styles.emptySubtext}>
        {selectedTab === 'all'
          ? 'Start applying to jobs to see them here'
          : `No ${selectedTab} applications`}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    return <LoadingSpinner style={styles.loadingFooter} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TABS}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tab,
                selectedTab === item.key && styles.tabActive,
              ]}
              onPress={() => {
                setSelectedTab(item.key);
                setPage(1);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === item.key && styles.tabTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Applications List */}
      {isLoading && !refreshing ? (
        <LoadingSpinner fullScreen text="Loading applications..." />
      ) : (
        <FlatList
          data={applicationsData?.data.data || []}
          renderItem={renderApplicationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={renderEmptyList}
          ListFooterComponent={renderFooter}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.paper,
  },
  tabsContainer: {
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  tab: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    backgroundColor: theme.colors.transparent,
  },
  tabActive: {
    backgroundColor: theme.colors.primary[600],
  },
  tabText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
  },
  tabTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  applicationCard: {
    marginBottom: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  companyLogo: {
    width: 56,
    height: 56,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primary[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  companyLogoText: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary[600],
  },
  applicationInfo: {
    flex: 1,
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
  cardBody: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  detailIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  detailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[700],
  },
  notesContainer: {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.gray[50],
    borderRadius: theme.borderRadius.md,
  },
  notesLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[700],
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.gray[600],
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  withdrawButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  withdrawButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.error.main,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyText: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.semibold,
    color: theme.colors.gray[900],
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[600],
    textAlign: 'center',
  },
  loadingFooter: {
    paddingVertical: theme.spacing.lg,
  },
});
