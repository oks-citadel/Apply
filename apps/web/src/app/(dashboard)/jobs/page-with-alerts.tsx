'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, MapPin, Briefcase, DollarSign, Bookmark, ExternalLink, Loader2, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { useJobs, useSaveJob, useUnsaveJob } from '@/hooks/useJobs';
import { useDebounce } from '@/hooks/useDebounce';
import { QuickAlertModal } from '@/components/features/alerts/QuickAlertModal';

export default function JobsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'relevant' | 'salary'>('recent');
  const [page, setPage] = useState(1);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data, isLoading, isFetching } = useJobs({
    query: debouncedSearch,
    location: location || undefined,
    employmentType: jobType ? [jobType as 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary'] : undefined,
    page,
    limit: 10,
  });

  const saveJob = useSaveJob();
  const unsaveJob = useUnsaveJob();

  const jobs = data?.jobs || [];
  const totalJobs = data?.total || 0;
  const hasMore = data?.hasMore || false;

  const handleSaveToggle = useCallback((jobId: string, isSaved: boolean) => {
    if (isSaved) {
      unsaveJob.mutate(jobId);
    } else {
      saveJob.mutate({ jobId });
    }
  }, [saveJob, unsaveJob]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setLocation('');
    setJobType('');
    setPage(1);
  };

  const handleCreateAlert = () => {
    setShowAlertModal(true);
  };

  const formatSalary = (min?: number, max?: number): string => {
    if (!min && !max) return 'Competitive';
    const formatNum = (n: number) => {
      if (n >= 1000) return `$${Math.round(n / 1000)}k`;
      return `$${n}`;
    };
    if (min && max) return `${formatNum(min)} - ${formatNum(max)}`;
    if (min) return `From ${formatNum(min)}`;
    if (max) return `Up to ${formatNum(max)}`;
    return 'Competitive';
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Job Search
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Find and save job opportunities that match your skills
          </p>
        </div>
        <Link href="/jobs/alerts">
          <Button variant="outline">
            <Bell className="w-4 h-4 mr-2" />
            My Alerts
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by title, keyword, or company"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Locations</option>
                <option value="remote">Remote</option>
                <option value="San Francisco">San Francisco</option>
                <option value="New York">New York</option>
                <option value="Los Angeles">Los Angeles</option>
                <option value="Austin">Austin</option>
                <option value="Seattle">Seattle</option>
              </Select>
              <Select
                value={jobType}
                onChange={(e) => {
                  setJobType(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleCreateAlert}>
                <Bell className="w-4 h-4 mr-2" />
                Create Alert for This Search
              </Button>
              <Button variant="outline" size="sm">
                Filter by Salary
              </Button>
              <Button variant="outline" size="sm">
                Experience Level
              </Button>
              <Button variant="outline" size="sm">
                Company Size
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-600"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isLoading ? 'Loading...' : `Showing ${jobs.length} of ${totalJobs} jobs`}
          </p>
          <Select
            className="w-48"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          >
            <option value="recent">Most Recent</option>
            <option value="relevant">Most Relevant</option>
            <option value="salary">Highest Salary</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-4">No jobs found matching your criteria</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear filters and try again
                </Button>
                <Button onClick={handleCreateAlert}>
                  <Bell className="w-4 h-4 mr-2" />
                  Create Alert
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job: any) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={job.isSaved ? 'text-primary-600' : ''}
                        onClick={() => handleSaveToggle(job.id, job.isSaved)}
                        disabled={saveJob.isPending || unsaveJob.isPending}
                      >
                        <Bookmark className={`w-5 h-5 ${job.isSaved ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {job.location || 'Location not specified'}
                      </div>
                      <div className="flex items-center">
                        <Briefcase className="w-4 h-4 mr-1" />
                        {job.employmentType || job.type || 'Full-time'}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {job.description || 'No description available'}
                    </p>

                    {(job.skills?.length > 0 || job.tags?.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(job.skills || job.tags || []).slice(0, 5).map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                        {(job.skills || job.tags || []).length > 5 && (
                          <Badge variant="outline">
                            +{(job.skills || job.tags).length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        Posted {formatDate(job.postedAt || job.createdAt)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/jobs/${job.id}`)}
                        >
                          Apply Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Jobs'
            )}
          </Button>
        </div>
      )}

      {/* Quick Alert Modal */}
      <QuickAlertModal
        open={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        defaultKeywords={searchQuery}
        defaultLocation={location}
      />
    </div>
  );
}
