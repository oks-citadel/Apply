/**
 * Example React Hooks for API Integration
 *
 * This file provides examples of how to use the API layer with React hooks.
 * These patterns demonstrate best practices for error handling, loading states,
 * and data caching.
 *
 * Note: For production use, consider integrating with libraries like:
 * - React Query (TanStack Query) - for advanced caching and state management
 * - SWR - for stale-while-revalidate pattern
 * - Zustand/Redux - for global state management
 */

import { useState, useEffect, useCallback } from 'react';
import { ApiError, ErrorType, isErrorType } from './client';
import { cachedApiCall, apiCache } from './utils';

// Generic API hook state interface
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

/**
 * Basic API fetch hook
 * Example usage:
 *
 * const { data, loading, error, refetch } = useApi(
 *   () => jobsApi.searchJobs({ query: 'developer' }),
 *   { cache: true, cacheKey: 'jobs-developer' }
 * );
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  options: {
    cache?: boolean;
    cacheKey?: string;
    cacheTTL?: number;
    skip?: boolean; // Skip initial fetch
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  } = {}
) {
  const {
    cache = false,
    cacheKey,
    cacheTTL = 5 * 60 * 1000,
    skip = false,
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: !skip,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      let data: T;

      if (cache && cacheKey) {
        data = await cachedApiCall(cacheKey, fetcher, { ttl: cacheTTL });
      } else {
        data = await fetcher();
      }

      setState({ data, loading: false, error: null });

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (err) {
      const error = err instanceof ApiError ? err : new ApiError(
        err instanceof Error ? err.message : 'Unknown error',
        undefined,
        undefined,
        undefined,
        ErrorType.UNKNOWN
      );

      setState({ data: null, loading: false, error });

      if (onError) {
        onError(error);
      }

      return null;
    }
  }, [fetcher, cache, cacheKey, cacheTTL, onSuccess, onError]);

  useEffect(() => {
    if (!skip) {
      fetchData();
    }
  }, [skip]);

  return {
    ...state,
    refetch: fetchData,
    invalidate: () => {
      if (cacheKey) {
        apiCache.invalidate(cacheKey);
      }
    },
  };
}

/**
 * API mutation hook (for POST, PUT, DELETE operations)
 * Example usage:
 *
 * const { mutate, loading, error } = useMutation(
 *   (data) => resumesApi.createResume(data),
 *   {
 *     onSuccess: (resume) => console.log('Created:', resume),
 *     invalidateCache: ['resumes-list']
 *   }
 * );
 *
 * // Later in component
 * mutate({ title: 'My Resume', content: {...} });
 */
export function useMutation<TData, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ApiError, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
    invalidateCache?: string[]; // Cache keys to invalidate on success
  } = {}
) {
  const { onSuccess, onError, onSettled, invalidateCache = [] } = options;

  const [state, setState] = useState<{
    loading: boolean;
    error: ApiError | null;
  }>({
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState({ loading: true, error: null });

      try {
        const data = await mutationFn(variables);

        setState({ loading: false, error: null });

        // Invalidate cache entries
        invalidateCache.forEach(key => apiCache.invalidate(key));

        if (onSuccess) {
          onSuccess(data, variables);
        }

        if (onSettled) {
          onSettled(data, null, variables);
        }

        return data;
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(
          err instanceof Error ? err.message : 'Unknown error',
          undefined,
          undefined,
          undefined,
          ErrorType.UNKNOWN
        );

        setState({ loading: false, error });

        if (onError) {
          onError(error, variables);
        }

        if (onSettled) {
          onSettled(null, error, variables);
        }

        throw error;
      }
    },
    [mutationFn, onSuccess, onError, onSettled, invalidateCache]
  );

  return {
    mutate,
    ...state,
    reset: () => setState({ loading: false, error: null }),
  };
}

/**
 * Paginated API hook
 * Example usage:
 *
 * const { data, loading, error, page, nextPage, prevPage, hasMore } = usePagination(
 *   (page, limit) => jobsApi.searchJobs({ page, limit }),
 *   { limit: 20 }
 * );
 */
export function usePagination<T>(
  fetcher: (page: number, limit: number) => Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
  }>,
  options: {
    limit?: number;
    cache?: boolean;
    cacheKeyPrefix?: string;
  } = {}
) {
  const { limit = 20, cache = false, cacheKeyPrefix = 'pagination' } = options;

  const [page, setPage] = useState(1);
  const [state, setState] = useState<
    ApiState<{
      data: T[];
      total: number;
      page: number;
      limit: number;
    }>
  >({
    data: null,
    loading: true,
    error: null,
  });

  const fetchPage = useCallback(
    async (pageNum: number) => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      try {
        const cacheKey = cache ? `${cacheKeyPrefix}-${pageNum}-${limit}` : undefined;

        let result;
        if (cache && cacheKey) {
          result = await cachedApiCall(cacheKey, () => fetcher(pageNum, limit));
        } else {
          result = await fetcher(pageNum, limit);
        }

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof ApiError ? err : new ApiError(
          err instanceof Error ? err.message : 'Unknown error',
          undefined,
          undefined,
          undefined,
          ErrorType.UNKNOWN
        );

        setState({ data: null, loading: false, error });
        return null;
      }
    },
    [fetcher, limit, cache, cacheKeyPrefix]
  );

  useEffect(() => {
    fetchPage(page);
  }, [page, fetchPage]);

  const nextPage = useCallback(() => {
    if (state.data && page < Math.ceil(state.data.total / limit)) {
      setPage(p => p + 1);
    }
  }, [page, limit, state.data]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  return {
    ...state,
    page,
    nextPage,
    prevPage,
    goToPage,
    hasMore: state.data ? page < Math.ceil(state.data.total / limit) : false,
    hasPrev: page > 1,
    totalPages: state.data ? Math.ceil(state.data.total / limit) : 0,
    refetch: () => fetchPage(page),
  };
}

/**
 * Infinite scroll hook
 * Example usage:
 *
 * const { data, loading, error, loadMore, hasMore } = useInfiniteScroll(
 *   (page) => jobsApi.searchJobs({ page, limit: 20 })
 * );
 */
export function useInfiniteScroll<T>(
  fetcher: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number;
  } = {}
) {
  const { initialPage = 1 } = options;

  const [page, setPage] = useState(initialPage);
  const [allData, setAllData] = useState<T[]>([]);
  const [state, setState] = useState({
    loading: false,
    error: null as ApiError | null,
    hasMore: true,
  });

  const loadMore = useCallback(async () => {
    if (state.loading || !state.hasMore) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await fetcher(page);

      setAllData(prev => [...prev, ...result.data]);
      setState({ loading: false, error: null, hasMore: result.hasMore });
      setPage(p => p + 1);
    } catch (err) {
      const error = err instanceof ApiError ? err : new ApiError(
        err instanceof Error ? err.message : 'Unknown error',
        undefined,
        undefined,
        undefined,
        ErrorType.UNKNOWN
      );

      setState(prev => ({ ...prev, loading: false, error }));
    }
  }, [fetcher, page, state.loading, state.hasMore]);

  useEffect(() => {
    loadMore();
  }, []); // Only load initial data

  return {
    data: allData,
    ...state,
    loadMore,
    reset: () => {
      setPage(initialPage);
      setAllData([]);
      setState({ loading: false, error: null, hasMore: true });
    },
  };
}

/**
 * Example: Complete component using these hooks
 */
/*
import { useApi, useMutation } from '@/lib/api/hooks.example';
import { jobsApi, resumesApi } from '@/lib/api';

function JobSearchComponent() {
  // Fetch jobs with caching
  const { data: jobs, loading, error, refetch } = useApi(
    () => jobsApi.searchJobs({ query: 'developer', location: 'Remote' }),
    {
      cache: true,
      cacheKey: 'jobs-developer-remote',
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    }
  );

  // Save job mutation
  const { mutate: saveJob, loading: saving } = useMutation(
    (jobId: string) => jobsApi.saveJob(jobId),
    {
      onSuccess: () => {
        console.log('Job saved!');
        refetch(); // Refetch jobs to get updated saved status
      },
      onError: (error) => {
        console.error('Failed to save job:', error.message);
      },
      invalidateCache: ['saved-jobs'], // Invalidate saved jobs cache
    }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {jobs?.jobs.map(job => (
        <div key={job.id}>
          <h3>{job.title}</h3>
          <button onClick={() => saveJob(job.id)} disabled={saving}>
            Save Job
          </button>
        </div>
      ))}
    </div>
  );
}
*/
