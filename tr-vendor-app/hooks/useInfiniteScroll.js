import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for infinite scroll with pagination and date filtering
 * @param {Function} fetchFunction - API function to fetch data
 * @param {Object} options - Configuration options
 * @returns {Object} - State and handlers for infinite scroll
 */
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    pageSize = 20,
    service = null,
    type = null,
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });

  // Use ref to track if we're currently fetching to prevent duplicate calls
  const isFetchingRef = useRef(false);

  /**
   * Fetch data from API with pagination and filters
   */
  const fetchData = useCallback(async (pageNum = 1, isRefresh = false) => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;

    // Don't fetch if no more data (unless refreshing)
    if (!isRefresh && !hasMore && pageNum > 1) return;

    try {
      isFetchingRef.current = true;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      // Build params
      const params = {
        page: pageNum,
        limit: pageSize,
      };

      // Add date filters if present
      if (dateFilter.start) {
        params.startDate = dateFilter.start;
      }
      if (dateFilter.end) {
        params.endDate = dateFilter.end;
      }

      // Add type filter if provided (for quote requests: 'open', 'quoted', etc.)
      if (type) {
        params.type = type;
      }

      // Fetch data
      const response = await fetchFunction(service, params);

      // Extract data from response (handle different response structures)
      const fetchedData = response.bookings ||
                         response.quotes ||
                         response.requests ||
                         response.quoteRequests ||
                         response.data ||
                         [];

      // Extract pagination info
      const pagination = response.pagination || {};
      const totalPages = pagination.totalPages || 1;
      const currentPage = pagination.page || pageNum;

      // Update data
      if (isRefresh || pageNum === 1) {
        setData(fetchedData);
      } else {
        setData(prev => [...prev, ...fetchedData]);
      }

      // Update pagination state
      setPage(currentPage);
      setHasMore(currentPage < totalPages);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');

      // On error, don't clear data if it's a load more operation
      if (isRefresh || pageNum === 1) {
        setData([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFetchingRef.current = false;
    }
  }, [fetchFunction, service, type, pageSize, dateFilter, hasMore]);

  /**
   * Load more data (called when user scrolls to end)
   */
  const loadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      fetchData(page + 1, false);
    }
  }, [loading, refreshing, hasMore, page, fetchData]);

  /**
   * Refresh data (pull to refresh)
   */
  const refresh = useCallback(() => {
    setPage(initialPage);
    setHasMore(true);
    fetchData(initialPage, true);
  }, [fetchData, initialPage]);

  /**
   * Apply date filter and refresh data
   */
  const applyDateFilter = useCallback((startDate, endDate) => {
    setDateFilter({ start: startDate, end: endDate });
    setPage(initialPage);
    setHasMore(true);
    // fetchData will be called by useEffect when dateFilter changes
  }, [initialPage]);

  /**
   * Clear date filter
   */
  const clearDateFilter = useCallback(() => {
    setDateFilter({ start: null, end: null });
    setPage(initialPage);
    setHasMore(true);
  }, [initialPage]);

  /**
   * Initial load (called manually from useEffect in component)
   */
  const initialLoad = useCallback(() => {
    fetchData(initialPage, true);
  }, [fetchData, initialPage]);

  return {
    // Data
    data,
    loading,
    refreshing,
    hasMore,
    error,
    page,

    // Date filter
    dateFilter,
    applyDateFilter,
    clearDateFilter,

    // Handlers
    loadMore,
    refresh,
    initialLoad,

    // Manual control
    setData,
    fetchData,
  };
};

export default useInfiniteScroll;
