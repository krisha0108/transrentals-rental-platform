  // app/hooks/useSocialFeed.js
  import { useEffect, useState, useCallback } from 'react';
  import { api } from '../lib/api';

  export function useSocialFeed(tab = 'following') {
    const [data, setData] = useState([]);
    const [after, setAfter] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchFeed = useCallback(async (reset=false) => {
      try {
        if (loading) return;
        if (reset) { setAfter(null); setData([]); }
        setLoading(true);
        const res = await api.get('vendor/social/feed', { params: { tab, after: reset ? null : after }});
        const rows = res.data.data.map((r) => r); // already in resource format
        setData((prev) => reset ? rows : [...prev, ...rows]);
        setAfter(res.data.paging?.next_after ?? null);
      } finally {
        setLoading(false);
      }
    }, [tab, after, loading]);

    useEffect(() => { fetchFeed(true); }, [tab]);

    const refresh = async () => { setRefreshing(true); await fetchFeed(true); setRefreshing(false); };
    const loadMore = async () => { if (after) await fetchFeed(false); };

    return { data, loading, refreshing, refresh, loadMore, setData };
  }
