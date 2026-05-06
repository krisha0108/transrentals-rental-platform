'use client';

import { useState, useEffect, useCallback } from 'react';
import { MapPin, BarChart3, RefreshCw, TrendingUp } from 'lucide-react';

const FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'All Time', value: 'all' },
];

const SERVICE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  'Bus Rental':       { bg: 'bg-blue-50',   text: 'text-blue-700',   bar: 'bg-blue-500' },
  'Luxury Cars':      { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  'Packers & Movers': { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
  'Truck Rental':     { bg: 'bg-yellow-50', text: 'text-yellow-700', bar: 'bg-yellow-500' },
  'Equipment':        { bg: 'bg-red-50',    text: 'text-red-700',    bar: 'bg-red-500' },
  'Bike Rental':      { bg: 'bg-teal-50',   text: 'text-teal-700',   bar: 'bg-teal-500' },
  'Self Drive':       { bg: 'bg-green-50',  text: 'text-green-700',  bar: 'bg-green-500' },
};

interface CityEntry {
  city: string;
  total: number;
  byService: Record<string, number>;
}

interface ServiceEntry {
  total: number;
  topCity: string;
  cities: { city: string; count: number }[];
}

interface ApiResponse {
  topCities: CityEntry[];
  byService: Record<string, ServiceEntry>;
  filter: string;
}

export default function QuoteRequestCityAnalytics() {
  const [filter, setFilter] = useState('all');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch_data = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/quote-city-stats?filter=${f}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch_data(filter); }, [filter, fetch_data]);

  const maxCityTotal = data?.topCities?.[0]?.total || 1;
  const services = data ? Object.entries(data.byService).sort((a, b) => b[1].total - a[1].total) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Quote Requests by City</h2>
            <p className="text-xs text-gray-500">Cities &amp; services driving the most inquiries</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filter === f.value
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading...</div>
      ) : !data || data.topCities.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
          <BarChart3 className="w-10 h-10 mb-2 opacity-40" />
          <p className="text-sm">No quote data for this period</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Left — Top Cities */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-700">Top Cities</h3>
              <span className="ml-auto text-xs text-gray-400">Top {data.topCities.length}</span>
            </div>
            <div className="space-y-2.5">
              {data.topCities.map((entry, i) => (
                <div key={entry.city}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-yellow-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-gray-700' :
                        i === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{entry.city}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{entry.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 ml-7">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.round((entry.total / maxCityTotal) * 100)}%` }}
                    />
                  </div>
                  {/* mini service pills */}
                  {Object.keys(entry.byService).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 ml-7">
                      {Object.entries(entry.byService)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([svc, cnt]) => {
                          const c = SERVICE_COLORS[svc] || { bg: 'bg-gray-100', text: 'text-gray-600' };
                          return (
                            <span key={svc} className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${c.bg} ${c.text}`}>
                              {svc.replace('Packers & Movers', 'P&M')}: {cnt}
                            </span>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Right — By Service */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-700">By Service</h3>
            </div>
            <div className="space-y-3">
              {services.map(([svc, info]) => {
                const c = SERVICE_COLORS[svc] || { bg: 'bg-gray-50', text: 'text-gray-700', bar: 'bg-gray-400' };
                const maxSvc = services[0]?.[1].total || 1;
                return (
                  <div key={svc}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
                        {svc}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        {info.topCity && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{info.topCity}
                          </span>
                        )}
                        <span className="font-semibold text-gray-900">{info.total}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className={`${c.bar} h-1.5 rounded-full transition-all duration-500`}
                        style={{ width: `${Math.round((info.total / maxSvc) * 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
