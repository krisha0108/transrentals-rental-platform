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
    filterKey = 'type',
  } = options;

  const [data, setData] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null, type: null });

  // Use refs to track mutable values without causing fetchData to be recreated
  const isFetchingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(initialPage);
  const dateFilterRef = useRef({ start: null, end: null, type: null });

  /**
   * Fetch data from API with pagination and filters
   * @param {number} pageNum - Page number to fetch
   * @param {boolean} isRefresh - Whether this is a refresh operation
   * @param {object} overrideDates - Optional date filter override { start, end }
   */
  const fetchData = useCallback(async (pageNum = 1, isRefresh = false, overrideDates = null) => {
    console.log('🔄 [useInfiniteScroll] fetchData called:', { pageNum, isRefresh });

    // Prevent duplicate calls
    if (isFetchingRef.current) {
      console.log('⏸️ [useInfiniteScroll] Already fetching, skipping...');
      return;
    }

    // Don't fetch if no more data (unless refreshing) — use ref to avoid stale closure
    if (!isRefresh && !hasMoreRef.current && pageNum > 1) {
      console.log('🛑 [useInfiniteScroll] No more data to fetch');
      return;
    }

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

      // Use override dates if provided, otherwise use ref (avoids stale closure)
      const effectiveDates = overrideDates || dateFilterRef.current;

      // Add date filters if present
      if (effectiveDates.start) {
        params.startDate = effectiveDates.start;
      }
      if (effectiveDates.end) {
        params.endDate = effectiveDates.end;
      }

      // Add type/status filter if provided
      if (type) {
        params[filterKey] = type;
      }

      // Fetch data
      console.log('📡 [useInfiniteScroll] Fetching with params:', params);
      const response = await fetchFunction(service, params);

      // Extract data from response (handle different response structures)
      const fetchedData = response.bookings ||
                         response.quotes ||
                         response.requests ||
                         response.quoteRequests ||
                         response.data ||
                         [];

      console.log(`✅ [useInfiniteScroll] Fetched ${fetchedData.length} items`);

      // Extract pagination info
      const pagination = response.pagination || {};
      const totalPages = pagination.totalPages || 1;
      const currentPage = pagination.page || pageNum;

      console.log('📊 [useInfiniteScroll] Pagination:', { currentPage, totalPages });

      // Update data
      if (isRefresh || pageNum === 1) {
        console.log('🔄 [useInfiniteScroll] Replacing data (refresh or page 1)');
        setData(fetchedData);
      } else {
        console.log('➕ [useInfiniteScroll] Appending data to existing');
        setData(prev => {
          console.log(`  Previous count: ${prev.length}, Adding: ${fetchedData.length}, New total: ${prev.length + fetchedData.length}`);
          return [...prev, ...fetchedData];
        });
      }

      // Update pagination state — update refs first so loadMore sees fresh values immediately
      const newHasMore = currentPage < totalPages;
      hasMoreRef.current = newHasMore;
      pageRef.current = currentPage;
      setPage(currentPage);
      setHasMore(newHasMore);
      console.log(`📄 [useInfiniteScroll] Updated state: page=${currentPage}, hasMore=${newHasMore}`);

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
  }, [fetchFunction, service, type, filterKey, pageSize]); // removed hasMore, dateFilter from deps — use refs instead

  /**
   * Load more data (called when user scrolls to end)
   */
  const loadMore = useCallback(() => {
    const curPage = pageRef.current;
    const curHasMore = hasMoreRef.current;
    console.log('📜 [useInfiniteScroll] loadMore triggered:', { currentPage: curPage, nextPage: curPage + 1, hasMore: curHasMore });

    if (!isFetchingRef.current && curHasMore) {
      console.log(`➡️ [useInfiniteScroll] Loading page ${curPage + 1}...`);
      fetchData(curPage + 1, false);
    } else {
      console.log('⏸️ [useInfiniteScroll] Skipping loadMore:', { isFetching: isFetchingRef.current, hasMore: curHasMore });
    }
  }, [fetchData]);

  /**
   * Refresh data (pull to refresh)
   */
  const refresh = useCallback(() => {
    pageRef.current = initialPage;
    hasMoreRef.current = true;
    setPage(initialPage);
    setHasMore(true);
    fetchData(initialPage, true);
  }, [fetchData, initialPage]);

  /**
   * Apply date filter and refresh data
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @param {string} filterType - Type of filter: 'today', 'yesterday', 'thisWeek', etc. or 'custom'
   */
  const applyDateFilter = useCallback((startDate, endDate, filterType = 'custom') => {
    console.log('📅 [useInfiniteScroll] Applying date filter:', { startDate, endDate, filterType });
    const newDateFilter = { start: startDate, end: endDate, type: filterType };
    dateFilterRef.current = newDateFilter;
    pageRef.current = initialPage;
    hasMoreRef.current = true;
    setDateFilter(newDateFilter);
    setPage(initialPage);
    setHasMore(true);
    setData([]);
    fetchData(initialPage, true, newDateFilter);
  }, [initialPage, fetchData]);

  /**
   * Clear date filter
   */
  const clearDateFilter = useCallback(() => {
    console.log('🗑️ [useInfiniteScroll] Clearing date filter');
    const emptyFilter = { start: null, end: null, type: null };
    dateFilterRef.current = emptyFilter;
    pageRef.current = initialPage;
    hasMoreRef.current = true;
    setDateFilter(emptyFilter);
    setPage(initialPage);
    setHasMore(true);
    setData([]);
    fetchData(initialPage, true, emptyFilter);
  }, [initialPage, fetchData]);

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
