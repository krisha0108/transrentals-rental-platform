// @ts-nocheck
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, RefreshCw, BarChart3, Navigation, ChevronDown, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

const CITY_COORDS: Record<string, [number, number]> = {
  Mumbai: [19.076, 72.8777], Delhi: [28.7041, 77.1025], 'New Delhi': [28.6139, 77.209],
  Bangalore: [12.9716, 77.5946], Bengaluru: [12.9716, 77.5946], Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707], Kolkata: [22.5726, 88.3639], Pune: [18.5204, 73.8567],
  Ahmedabad: [23.0225, 72.5714], Jaipur: [26.9124, 75.7873], Surat: [21.1702, 72.8311],
  Lucknow: [26.8467, 80.9462], Kanpur: [26.4499, 80.3319], Nagpur: [21.1458, 79.0882],
  Indore: [22.7196, 75.8577], Bhopal: [23.2599, 77.4126], Patna: [25.5941, 85.1376],
  Chandigarh: [30.7333, 76.7794], Coimbatore: [11.0168, 76.9558], Kochi: [9.9312, 76.2673],
  Visakhapatnam: [17.6868, 83.3009], Guwahati: [26.1445, 91.7362], Bhubaneswar: [20.2961, 85.8245],
  Agra: [27.1767, 78.0081], Vadodara: [22.3072, 73.209], Srinagar: [34.0837, 74.7973],
  Ranchi: [23.3441, 85.3096], Gurugram: [28.4595, 77.0266], Gurgaon: [28.4595, 77.0266],
  Noida: [28.5355, 77.391], Faridabad: [28.4089, 77.3178], Meerut: [28.9845, 77.7064],
  Varanasi: [25.3176, 82.9739], Ludhiana: [30.901, 75.8573], Amritsar: [31.634, 74.8723],
  Rajkot: [22.3039, 70.8022], Nashik: [19.9975, 73.7898], Aurangabad: [19.8762, 75.3433],
  Thane: [19.2183, 72.9781], Vijayawada: [16.5062, 80.648], Jodhpur: [26.2389, 73.0243],
  Udaipur: [24.5854, 73.7125], Mysuru: [12.2958, 76.6394], Mangaluru: [12.9141, 74.856],
  Thiruvananthapuram: [8.5241, 76.9366], Kozhikode: [11.2588, 75.7804], Madurai: [9.9252, 78.1198],
  Tiruchirappalli: [10.7905, 78.7047], Salem: [11.6643, 78.146], Raipur: [21.2514, 81.6296],
  Dehradun: [30.3165, 78.0322], Shimla: [31.1048, 77.1734], Jammu: [32.7357, 74.857],
  Prayagraj: [25.4358, 81.8463], Allahabad: [25.4358, 81.8463], Jalandhar: [31.326, 75.5762],
  Solapur: [17.6805, 75.9064], Guntur: [16.2991, 80.4365], Kota: [25.2138, 75.8648],
  Hubli: [15.3647, 75.124], Thrissur: [10.5276, 76.2144], Shillong: [25.5788, 91.8933],
};

const DATE_FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Month', value: 'thisMonth' },
  { label: 'Last Month', value: 'lastMonth' },
  { label: 'All Time', value: 'all' },
];

const SERVICE_COLORS: Record<string, string> = {
  'Bus Rental': '#3b82f6', 'Luxury Cars': '#a855f7', 'Packers & Movers': '#f97316',
  'Truck Rental': '#eab308', Equipment: '#ef4444', 'Bike Rental': '#14b8a6', 'Self Drive': '#22c55e',
  'Car Rental': '#ec4899',
};
const SERVICE_BG: Record<string, string> = {
  'Bus Rental': 'bg-blue-50 text-blue-700', 'Luxury Cars': 'bg-purple-50 text-purple-700',
  'Packers & Movers': 'bg-orange-50 text-orange-700', 'Truck Rental': 'bg-yellow-50 text-yellow-700',
  Equipment: 'bg-red-50 text-red-700', 'Bike Rental': 'bg-teal-50 text-teal-700',
  'Self Drive': 'bg-green-50 text-green-700', 'Car Rental': 'bg-pink-50 text-pink-700',
};

function findCoords(cityName: string): [number, number] | null {
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === cityName.toLowerCase());
  return key ? CITY_COORDS[key] : null;
}

interface CityEntry { city: string; total: number; byService: Record<string, number>; }
interface ServiceEntry { total: number; topCity: string; cities: { city: string; count: number }[]; }
interface ApiData { topCities: CityEntry[]; byService: Record<string, ServiceEntry>; }

function LeafletMap({ cities, selectedCity, selectedService, onHover, onCityClick }: {
  cities: (CityEntry & { coords: [number, number] })[];
  selectedCity: string;
  selectedService: string;
  onHover: (city: CityEntry | null) => void;
  onCityClick: (city: string) => void;
}) {
  const mapRef = useRef<any>(null);
  const circlesRef = useRef<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

    const indiaBounds = L.latLngBounds(L.latLng(6.4, 68.1), L.latLng(37.6, 97.5));
    const map = L.map(containerRef.current, {
      center: [22.5, 82.5], zoom: 5, minZoom: 4, maxZoom: 13,
      zoomControl: true, scrollWheelZoom: true, attributionControl: true,
      maxBounds: indiaBounds, maxBoundsViscosity: 0.85,
    });

    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      subdomains: '0123', maxZoom: 20, attribution: '&copy; Google Maps',
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Pan to selected city
  useEffect(() => {
    if (!mapRef.current || !selectedCity) return;
    const coords = findCoords(selectedCity);
    if (coords) mapRef.current.flyTo(coords, 7, { duration: 1 });
  }, [selectedCity]);

  // Redraw circles when data or filters change
  useEffect(() => {
    const L = require('leaflet');
    const map = mapRef.current;
    if (!map) return;

    circlesRef.current.forEach(c => c.remove());
    circlesRef.current = [];

    // filter cities by selected service
    const visibleCities = selectedService
      ? cities.filter(e => (e.byService[selectedService] || 0) > 0)
      : cities;

    visibleCities.forEach(entry => {
      const isSelected = selectedCity === entry.city;
      const dotColor = isSelected ? '#15803d' : '#16a34a';
      const count = selectedService ? (entry.byService[selectedService] || 0) : entry.total;

      const circle = L.circleMarker(entry.coords, {
        radius: 8,
        fillColor: dotColor,
        color: '#fff',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: isSelected ? 1 : 0.82,
      }).addTo(map);

      circle.on('mouseover', function () {
        this.setStyle({ fillColor: '#15803d', fillOpacity: 1, weight: 2.5 });
        this.bindTooltip(
          `<div style="font-family:Inter,sans-serif;min-width:130px">
            <div style="font-weight:700;font-size:13px;color:#14532d;margin-bottom:2px">${entry.city}</div>
            <div style="font-size:11px;color:#166534;font-weight:600">${count} quote${count !== 1 ? 's' : ''}${selectedService ? ` · ${selectedService}` : ''}</div>
          </div>`,
          { sticky: true, opacity: 1, className: 'city-tooltip' }
        ).openTooltip();
        onHover(entry);
      });

      circle.on('mouseout', function () {
        this.setStyle({ fillColor: isSelected ? '#15803d' : '#16a34a', fillOpacity: isSelected ? 1 : 0.82, weight: isSelected ? 3 : 2 });
        this.closeTooltip();
        onHover(null);
      });

      circle.on('click', () => onCityClick(entry.city));
      circlesRef.current.push(circle);
    });
  }, [cities, selectedCity, selectedService, onHover, onCityClick]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}

// Searchable dropdown
function SearchableSelect({ label, value, options, onChange, accentColor }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; accentColor: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  function select(o: string) {
    onChange(o); setOpen(false); setSearch('');
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation(); onChange(''); setOpen(false); setSearch('');
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(v => !v); setSearch(''); }}
        className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-medium border rounded-lg bg-white transition-all focus:outline-none"
        style={{
          borderColor: value ? accentColor : '#e5e7eb',
          color: value ? accentColor : '#6b7280',
          minWidth: 110,
        }}
      >
        <span className="flex-1 text-left truncate">{value || label}</span>
        {value
          ? <X className="w-3 h-3 flex-shrink-0 hover:opacity-70" onClick={clear} style={{ color: accentColor }} />
          : <ChevronDown className="w-3 h-3 flex-shrink-0 text-gray-400" />
        }
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-[2000] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          style={{ minWidth: 180 }}>
          {/* search input */}
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-green-400"
            />
          </div>
          {/* options list */}
          <div className="overflow-y-auto" style={{ maxHeight: 200 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No results</div>
            ) : filtered.map(o => (
              <button
                key={o}
                onClick={() => select(o)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2"
                style={{ color: o === value ? accentColor : '#374151', fontWeight: o === value ? 700 : 400 }}
              >
                {o === value && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />}
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function IndiaCityMap() {
  const [dateFilter, setDateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('');
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCity, setHoveredCity] = useState<CityEntry | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchData = useCallback(async (f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard/quote-city-stats?filter=${f}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(dateFilter); }, [dateFilter, fetchData]);

  const mappedCities = (data?.topCities ?? [])
    .map(e => ({ ...e, coords: findCoords(e.city) }))
    .filter(e => e.coords !== null) as (CityEntry & { coords: [number, number] })[];

  const allCityNames = mappedCities.map(c => c.city);
  const allServiceNames = data ? Object.keys(data.byService) : [];
  const services = data ? Object.entries(data.byService).sort((a, b) => b[1].total - a[1].total) : [];
  const totalAllServices = services.reduce((s, [, v]) => s + v.total, 0);

  // active city entry (from filter or hover)
  const activeCityEntry = cityFilter
    ? mappedCities.find(c => c.city === cityFilter) || null
    : hoveredCity;

  // right panel data
  const rightPanelCity = activeCityEntry;
  const rightPanelRows = rightPanelCity
    ? Object.entries(rightPanelCity.byService)
        .filter(([svc]) => !serviceFilter || svc === serviceFilter)
        .sort((a, b) => b[1] - a[1])
    : null;

  // total for right panel city (scoped to service filter)
  const rightPanelTotal = rightPanelRows ? rightPanelRows.reduce((s, [, v]) => s + v, 0) : 0;

  // default panel: service-level, optionally filtered
  const defaultRows = serviceFilter
    ? services.filter(([svc]) => svc === serviceFilter)
    : services;

  const handleCityClick = useCallback((city: string) => {
    setCityFilter(prev => prev === city ? '' : city);
  }, []);

  const hasActiveFilter = !!cityFilter || !!serviceFilter;

  return (
    <>
      <style>{`
        .leaflet-container { font-family: Inter, sans-serif; }
        .city-tooltip { background:#fff; border:1px solid #bbf7d0; border-radius:10px; box-shadow:0 6px 24px rgba(0,0,0,0.13); padding:8px 12px; }
        .city-tooltip::before,.leaflet-tooltip::before { display:none !important; }
        .leaflet-control-attribution { font-size:9px !important; background:rgba(255,255,255,0.7) !important; }
        .leaflet-control-zoom a { border-radius:6px !important; }
      `}</style>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* ── Header ── */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-white to-green-50/30">
          {/* top row */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                <Navigation className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Quote Requests — City Map</h2>
                <p className="text-[11px] text-gray-400">Click a dot or use filters to drill down</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {loading && <RefreshCw className="w-3.5 h-3.5 text-green-500 animate-spin" />}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
                {DATE_FILTERS.map(f => (
                  <button key={f.value} onClick={() => setDateFilter(f.value)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${dateFilter === f.value ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* filter row */}
          <div className="flex items-center gap-3 px-6 pb-3">
            <span className="text-[11px] text-gray-400 font-medium">Filter:</span>
            <SearchableSelect
              label="All Cities"
              value={cityFilter}
              options={allCityNames}
              onChange={setCityFilter}
              accentColor="#16a34a"
            />
            <SearchableSelect
              label="All Services"
              value={serviceFilter}
              options={allServiceNames}
              onChange={setServiceFilter}
              accentColor={serviceFilter ? (SERVICE_COLORS[serviceFilter] || '#6b7280') : '#16a34a'}
            />
            {hasActiveFilter && (
              <button
                onClick={() => { setCityFilter(''); setServiceFilter(''); }}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-red-500 transition-colors ml-1"
              >
                <X className="w-3 h-3" /> Clear all
              </button>
            )}
            {/* active filter pills */}
            <div className="flex items-center gap-1.5 ml-auto">
              {cityFilter && (
                <span className="flex items-center gap-1 text-[11px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5 font-semibold">
                  <MapPin className="w-2.5 h-2.5" /> {cityFilter}
                </span>
              )}
              {serviceFilter && (
                <span className="flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 font-semibold border"
                  style={{ backgroundColor: SERVICE_COLORS[serviceFilter] + '15', color: SERVICE_COLORS[serviceFilter], borderColor: SERVICE_COLORS[serviceFilter] + '40' }}>
                  {serviceFilter}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col lg:flex-row" style={{ minHeight: 460 }}>
          {/* Map — 40% */}
          <div className="relative w-full lg:w-[40%]" style={{ minHeight: 400 }}>
            {mounted && (
              <LeafletMap
                cities={mappedCities}
                selectedCity={cityFilter}
                selectedService={serviceFilter}
                onHover={setHoveredCity}
                onCityClick={handleCityClick}
              />
            )}
          </div>

          {/* Right panel — 60% */}
          <div className="w-full lg:w-[60%] border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">

            {rightPanelCity ? (
              /* ── City detail view ── */
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-green-50/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
                      <MapPin className="w-3 h-3 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider leading-none">
                        {serviceFilter ? `${serviceFilter} · ` : ''}City Breakdown
                      </p>
                      <h3 className="text-sm font-bold text-gray-900">{rightPanelCity.city}</h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-extrabold text-green-700">{rightPanelTotal}</span>
                    <p className="text-[10px] text-gray-400 leading-none">quotes</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {rightPanelRows!.length === 0 ? (
                    <div className="flex items-center justify-center h-20 text-sm text-gray-400">No data for this combination</div>
                  ) : rightPanelRows!.map(([svc, cnt]) => {
                    const pct = rightPanelTotal ? Math.round((cnt / rightPanelTotal) * 100) : 0;
                    const color = SERVICE_COLORS[svc] || '#6b7280';
                    return (
                      <div key={svc} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-sm font-medium text-gray-700 flex-1 min-w-0 truncate">{svc}</span>
                        <div className="w-28 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[60px] justify-end">
                          <span className="text-sm font-bold text-gray-900">{cnt}</span>
                          <span className="text-[11px] text-gray-400">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {cityFilter && (
                  <div className="px-5 py-2.5 border-t border-gray-100 bg-gray-50/50">
                    <button onClick={() => setCityFilter('')} className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                      <X className="w-3 h-3" /> Clear city filter
                    </button>
                  </div>
                )}
              </div>

            ) : (
              /* ── Default / service view ── */
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-white">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-bold text-gray-900">
                      {serviceFilter ? serviceFilter : 'By Service'}
                    </span>
                    {!serviceFilter && <span className="text-xs text-gray-400">— all cities</span>}
                  </div>
                  <span className="text-base font-extrabold text-green-700">
                    {serviceFilter
                      ? (data?.byService[serviceFilter]?.total ?? 0)
                      : totalAllServices}
                    <span className="text-xs font-normal text-gray-400 ml-1">total</span>
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {defaultRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10">
                      <BarChart3 className="w-8 h-8 mb-2 opacity-30" />
                      <p className="text-sm">No data for this period</p>
                    </div>
                  ) : serviceFilter ? (
                    /* service selected → show top cities for that service */
                    (data?.byService[serviceFilter]?.cities ?? [])
                      .slice(0, 10)
                      .map((c, idx) => {
                        const svcTotal = data?.byService[serviceFilter]?.total || 1;
                        const pct = Math.round((c.count / svcTotal) * 100);
                        const color = SERVICE_COLORS[serviceFilter] || '#6b7280';
                        return (
                          <div key={c.city} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setCityFilter(c.city)}>
                            <span className="text-[11px] font-bold text-gray-300 w-4 flex-shrink-0">#{idx + 1}</span>
                            <MapPin className="w-3 h-3 flex-shrink-0" style={{ color }} />
                            <span className="text-sm font-semibold text-gray-800 flex-1 truncate">{c.city}</span>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                              <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[56px] justify-end">
                              <span className="text-sm font-bold text-gray-900">{c.count}</span>
                              <span className="text-[11px] text-gray-400">{pct}%</span>
                            </div>
                          </div>
                        );
                      })
                  ) : (
                    /* default → all services */
                    defaultRows.map(([svc, info], idx) => {
                      const pct = totalAllServices ? Math.round((info.total / totalAllServices) * 100) : 0;
                      const color = SERVICE_COLORS[svc] || '#6b7280';
                      return (
                        <div key={svc}
                          className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => setServiceFilter(svc)}>
                          <span className="text-[11px] font-bold text-gray-300 w-4 flex-shrink-0">#{idx + 1}</span>
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{svc}</p>
                            {info.topCity && (
                              <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-2.5 h-2.5 flex-shrink-0" /> {info.topCity}
                              </p>
                            )}
                          </div>
                          <div className="w-24 bg-gray-100 rounded-full h-1.5 flex-shrink-0">
                            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 min-w-[56px] justify-end">
                            <span className="text-sm font-bold text-gray-900">{info.total}</span>
                            <span className="text-[11px] text-gray-400">{pct}%</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="px-5 py-2.5 border-t border-gray-100">
                  <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    {serviceFilter ? 'Click a city row to drill down' : 'Click a service row or map dot to drill down'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
