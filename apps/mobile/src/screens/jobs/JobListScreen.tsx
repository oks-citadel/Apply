import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Card, LoadingSpinner } from '../../components/common';
import { jobsApi } from '../../services/api';
import { theme } from '../../theme';
import { MainTabParamList } from '../../navigation/types';
import { Job, EmploymentType, LocationType } from '../../types';

type JobListScreenProps = NativeStackScreenProps<MainTabParamList, 'Jobs'>;

const EMPLOYMENT_TYPES: EmploymentType[] = ['full-time', 'part-time', 'contract', 'internship'];
const LOCATION_TYPES: LocationType[] = ['remote', 'hybrid', 'onsite'];

export const JobListScreen: React.FC<JobListScreenProps> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState<EmploymentType | null>(null);
  const [selectedLocationType, setSelectedLocationType] = useState<LocationType | null>(null);
  const [page, setPage] = useState(1);

  const {
    data: jobsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['jobs', page, searchQuery, selectedEmploymentType, selectedLocationType],
    queryFn: () =>
      jobsApi.getJobs({
        page,
        limit: 20,
        search: searchQuery || undefined,
        employmentType: selectedEmploymentType || undefined,
        locationType: selectedLocationType || undefined,
      }),
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
      jobsData?.data.meta &&
      jobsData.data.meta.page < jobsData.data.meta.totalPages &&
      !isFetching
    ) {
      setPage((prev) => prev + 1);
    }
  };

  const handleJobPress = (job: Job) => {
    // Navigate to job details
    console.log('View job:', job.id);
  };

  const formatSalary = (salary?: { min: number; max: number; currency: string }) => {
    if (!salary) return null;
    return `${salary.currency} ${salary.min.toLocaleString()} - ${salary.max.toLocaleString()}`;
  };

  const renderJobCard = ({ item }: { item: Job }) => (
    <Card style={styles.jobCard} onPress={() => handleJobPress(item)} elevation="sm">
      <View style={styles.jobHeader}>
        {item.companyLogo ? (
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>
              {item.company.charAt(0).toUpperCase()}
            </Text>
          </View>
        ) : (
          <View style={styles.companyLogo}>
            <Text style={styles.companyLogoText}>
              {item.company.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.companyName}>{item.company}</Text>
        </View>
      </View>

      <View style={styles.jobDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>📍</Text>
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailIcon}>💼</Text>
          <Text style={styles.detailText}>
            {item.employmentType.charAt(0).toUpperCase() + item.employmentType.slice(1)}
          </Text>
        </View>

        {item.salary && (
          <View style={styles.detailRow}>
            <Text style={styles.detailIcon}>💰</Text>
            <Text style={styles.detailText}>{formatSalary(item.salary)}</Text>
          </View>
        )}
      </View>

      <View style={styles.jobFooter}>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.locationType}</Text>
          </View>
        </View>
        <Text style={styles.postedDate}>
          {new Date(item.postedAt).toLocaleDateString()}
        </Text>
      </View>
    </Card>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No jobs found</Text>
      <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
    </View>
  );

  const renderFooter = () => {
    if (!isFetching) return null;
    return <LoadingSpinner style={styles.loadingFooter} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={theme.colors.gray[400]}
          />
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={EMPLOYMENT_TYPES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedEmploymentType === item && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedEmploymentType(
                  selectedEmploymentType === item ? null : item
                )
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedEmploymentType === item && styles.filterChipTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={LOCATION_TYPES}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedLocationType === item && styles.filterChipActive,
              ]}
              onPress={() =>
                setSelectedLocationType(selectedLocationType === item ? null : item)
              }
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedLocationType === item && styles.filterChipTextActive,
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Job List */}
      {isLoading && !refreshing ? (
        <LoadingSpinner fullScreen text="Loading jobs..." />
      ) : (
        <FlatList
          data={jobsData?.data.data || []}
          renderItem={renderJobCard}
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
  searchContainer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[100],
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.gray[900],
    paddingVertical: theme.spacing.md,
  },
  filtersContainer: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.gray[200],
  },
  filterChip: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.gray[100],
    marginRight: theme.spacing.sm,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary[600],
  },
  filterChipText: {
    fontSize: theme.fontSize.sm,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.gray[700],
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  jobCard: {
    marginBottom: theme.spacing.md,
  },
  jobHeader: {
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
  jobInfo: {
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
  jobDetails: {
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
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.gray[200],
  },
  badges: {
    flexDirection: 'row',
  },
  badge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary[50],
    marginRight: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.medium,
    color: theme.colors.primary[700],
    textTransform: 'capitalize',
  },
  postedDate: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.gray[500],
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
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
