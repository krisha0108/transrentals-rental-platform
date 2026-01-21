'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  IndianRupee,
  Car,
  MapPin,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCcw,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Zap,
  Target,
  Users
} from 'lucide-react';

interface RateData {
  id: string;
  vehicleType: string;
  category: string;
  yourRate: number;
  marketAvg: number;
  marketLow: number;
  marketHigh: number;
  competitorRates: { name: string; rate: number }[];
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
  lastUpdated: string;
  demand: 'high' | 'medium' | 'low';
}

interface RouteRate {
  id: string;
  from: string;
  to: string;
  distance: number;
  yourRate: number;
  marketRate: number;
  difference: number;
  bookings: number;
  trend: 'up' | 'down' | 'stable';
}

// Mock rate data
const vehicleRates: RateData[] = [
  {
    id: 'VR001',
    vehicleType: 'Hatchback',
    category: 'Self-Drive',
    yourRate: 1200,
    marketAvg: 1350,
    marketLow: 999,
    marketHigh: 1800,
    competitorRates: [
      { name: 'Zoomcar', rate: 1499 },
      { name: 'Revv', rate: 1299 },
      { name: 'MyChoize', rate: 1199 }
    ],
    trend: 'up',
    trendPercent: 5.2,
    lastUpdated: '2024-01-20',
    demand: 'high'
  },
  {
    id: 'VR002',
    vehicleType: 'Sedan',
    category: 'Self-Drive',
    yourRate: 1800,
    marketAvg: 1950,
    marketLow: 1499,
    marketHigh: 2500,
    competitorRates: [
      { name: 'Zoomcar', rate: 2199 },
      { name: 'Revv', rate: 1899 },
      { name: 'MyChoize', rate: 1749 }
    ],
    trend: 'stable',
    trendPercent: 0,
    lastUpdated: '2024-01-20',
    demand: 'medium'
  },
  {
    id: 'VR003',
    vehicleType: 'SUV',
    category: 'Self-Drive',
    yourRate: 2800,
    marketAvg: 2600,
    marketLow: 2199,
    marketHigh: 3500,
    competitorRates: [
      { name: 'Zoomcar', rate: 2999 },
      { name: 'Revv', rate: 2599 },
      { name: 'MyChoize', rate: 2399 }
    ],
    trend: 'down',
    trendPercent: -3.1,
    lastUpdated: '2024-01-20',
    demand: 'high'
  },
  {
    id: 'VR004',
    vehicleType: 'Innova/Ertiga',
    category: 'Chauffeur',
    yourRate: 14,
    marketAvg: 15,
    marketLow: 12,
    marketHigh: 18,
    competitorRates: [
      { name: 'Savaari', rate: 16 },
      { name: 'Ola Outstation', rate: 14 },
      { name: 'Local Operators', rate: 13 }
    ],
    trend: 'up',
    trendPercent: 8.3,
    lastUpdated: '2024-01-20',
    demand: 'high'
  },
  {
    id: 'VR005',
    vehicleType: 'Luxury Sedan',
    category: 'Chauffeur',
    yourRate: 25,
    marketAvg: 28,
    marketLow: 22,
    marketHigh: 35,
    competitorRates: [
      { name: 'Savaari', rate: 30 },
      { name: 'Carzonrent', rate: 28 },
      { name: 'Avis', rate: 32 }
    ],
    trend: 'stable',
    trendPercent: 1.2,
    lastUpdated: '2024-01-20',
    demand: 'low'
  },
  {
    id: 'VR006',
    vehicleType: 'Tempo Traveller',
    category: 'Group Travel',
    yourRate: 22,
    marketAvg: 20,
    marketLow: 16,
    marketHigh: 28,
    competitorRates: [
      { name: 'MakeMyTrip', rate: 24 },
      { name: 'Redbus', rate: 21 },
      { name: 'Local Operators', rate: 18 }
    ],
    trend: 'up',
    trendPercent: 4.5,
    lastUpdated: '2024-01-20',
    demand: 'medium'
  }
];

const routeRates: RouteRate[] = [
  { id: 'RR001', from: 'Bangalore', to: 'Mysore', distance: 150, yourRate: 3500, marketRate: 3800, difference: -7.9, bookings: 45, trend: 'up' },
  { id: 'RR002', from: 'Bangalore', to: 'Airport', distance: 42, yourRate: 1200, marketRate: 1100, difference: 9.1, bookings: 234, trend: 'stable' },
  { id: 'RR003', from: 'Bangalore', to: 'Coorg', distance: 265, yourRate: 6500, marketRate: 6200, difference: 4.8, bookings: 28, trend: 'down' },
  { id: 'RR004', from: 'Bangalore', to: 'Ooty', distance: 280, yourRate: 7000, marketRate: 7200, difference: -2.8, bookings: 32, trend: 'up' },
  { id: 'RR005', from: 'Bangalore', to: 'Pondicherry', distance: 310, yourRate: 7500, marketRate: 7800, difference: -3.8, bookings: 18, trend: 'stable' }
];

const demandConfig = {
  high: { label: 'High Demand', color: 'bg-green-100 text-green-700', icon: TrendingUp },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700', icon: Minus },
  low: { label: 'Low Demand', color: 'bg-red-100 text-red-700', icon: TrendingDown }
};

export default function RateComparisonPage() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'routes' | 'seasonal'>('vehicles');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRate, setExpandedRate] = useState<string | null>(null);

  const filteredVehicleRates = vehicleRates.filter(rate => {
    const matchesSearch = rate.vehicleType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || rate.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate insights
  const belowMarketCount = vehicleRates.filter(r => r.yourRate < r.marketAvg).length;
  const aboveMarketCount = vehicleRates.filter(r => r.yourRate > r.marketAvg).length;
  const avgDifference = vehicleRates.reduce((sum, r) => sum + ((r.yourRate - r.marketAvg) / r.marketAvg * 100), 0) / vehicleRates.length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rate Comparison</h1>
          <p className="text-gray-600 mt-1">Compare your rates with market competitors</p>
        </div>

        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCcw className="w-4 h-4" />
            Refresh Rates
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{belowMarketCount}</p>
              <p className="text-sm text-gray-500">Below Market</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{aboveMarketCount}</p>
              <p className="text-sm text-gray-500">Above Market</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{avgDifference.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Avg. Difference</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">Competitive</p>
              <p className="text-sm text-gray-500">Market Position</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {[
              { id: 'vehicles', label: 'Vehicle Rates', icon: Car },
              { id: 'routes', label: 'Route Rates', icon: MapPin },
              { id: 'seasonal', label: 'Seasonal Trends', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {activeTab === 'vehicles' && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="Self-Drive">Self-Drive</option>
                <option value="Chauffeur">Chauffeur</option>
                <option value="Group Travel">Group Travel</option>
              </select>
            )}
          </div>
        </div>

        {/* Vehicle Rates Tab */}
        {activeTab === 'vehicles' && (
          <div className="divide-y divide-gray-100">
            {filteredVehicleRates.map(rate => {
              const isExpanded = expandedRate === rate.id;
              const priceDiff = ((rate.yourRate - rate.marketAvg) / rate.marketAvg * 100);
              const isCompetitive = priceDiff <= 0;
              const DemandIcon = demandConfig[rate.demand].icon;

              return (
                <div key={rate.id} className="hover:bg-gray-50">
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedRate(isExpanded ? null : rate.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Car className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{rate.vehicleType}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{rate.category}</span>
                            <span className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${demandConfig[rate.demand].color}`}>
                              <DemandIcon className="w-3 h-3" />
                              {demandConfig[rate.demand].label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Your Rate</p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{rate.yourRate}{rate.category === 'Chauffeur' || rate.category === 'Group Travel' ? '/km' : '/day'}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-gray-500">Market Avg</p>
                          <p className="text-lg font-bold text-gray-900">
                            ₹{rate.marketAvg}{rate.category === 'Chauffeur' || rate.category === 'Group Travel' ? '/km' : '/day'}
                          </p>
                        </div>

                        <div className="text-right min-w-[100px]">
                          <p className="text-sm text-gray-500">Difference</p>
                          <div className={`flex items-center justify-end gap-1 ${isCompetitive ? 'text-green-600' : 'text-red-600'}`}>
                            {isCompetitive ? (
                              <ArrowDownRight className="w-4 h-4" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4" />
                            )}
                            <span className="font-bold">{Math.abs(priceDiff).toFixed(1)}%</span>
                          </div>
                        </div>

                        <div className={`flex items-center gap-1 ${
                          rate.trend === 'up' ? 'text-green-600' :
                          rate.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {rate.trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                           rate.trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
                           <Minus className="w-4 h-4" />}
                          <span className="text-sm font-medium">{rate.trendPercent > 0 ? '+' : ''}{rate.trendPercent}%</span>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                        {/* Price Range */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Market Price Range</h4>
                          <div className="relative pt-2">
                            <div className="h-2 bg-gray-200 rounded-full">
                              <div
                                className="absolute h-2 bg-gradient-to-r from-green-400 to-red-400 rounded-full"
                                style={{
                                  left: '0%',
                                  width: '100%'
                                }}
                              />
                              {/* Your rate marker */}
                              <div
                                className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                                style={{
                                  left: `${((rate.yourRate - rate.marketLow) / (rate.marketHigh - rate.marketLow)) * 100}%`
                                }}
                              >
                                <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow" />
                              </div>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-gray-500">
                              <span>₹{rate.marketLow} (Low)</span>
                              <span>₹{rate.marketHigh} (High)</span>
                            </div>
                          </div>
                        </div>

                        {/* Competitor Rates */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Competitor Rates</h4>
                          <div className="space-y-2">
                            {rate.competitorRates.map((comp, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{comp.name}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900">₹{comp.rate}</span>
                                  {comp.rate > rate.yourRate ? (
                                    <span className="text-xs text-green-600">+{((comp.rate - rate.yourRate) / rate.yourRate * 100).toFixed(0)}%</span>
                                  ) : (
                                    <span className="text-xs text-red-600">{((comp.rate - rate.yourRate) / rate.yourRate * 100).toFixed(0)}%</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className={`mt-4 p-3 rounded-lg flex items-start gap-3 ${
                        isCompetitive ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                      }`}>
                        {isCompetitive ? (
                          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className={`font-medium ${isCompetitive ? 'text-green-800' : 'text-yellow-800'}`}>
                            {isCompetitive ? 'Competitive Pricing' : 'Consider Adjusting'}
                          </p>
                          <p className={`text-sm ${isCompetitive ? 'text-green-600' : 'text-yellow-600'}`}>
                            {isCompetitive
                              ? `Your rate is ${Math.abs(priceDiff).toFixed(1)}% below market average. Good for attracting price-sensitive customers.`
                              : `Your rate is ${priceDiff.toFixed(1)}% above market average. Consider reducing to ₹${Math.round(rate.marketAvg)} to match competition.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Route Rates Tab */}
        {activeTab === 'routes' && (
          <div className="p-4">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Route</th>
                  <th className="pb-3 font-medium text-center">Distance</th>
                  <th className="pb-3 font-medium text-right">Your Rate</th>
                  <th className="pb-3 font-medium text-right">Market Rate</th>
                  <th className="pb-3 font-medium text-center">Difference</th>
                  <th className="pb-3 font-medium text-center">Bookings</th>
                  <th className="pb-3 font-medium text-center">Trend</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {routeRates.map(route => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{route.from}</span>
                        <span className="text-gray-400">→</span>
                        <span className="font-medium text-gray-900">{route.to}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center text-gray-600">{route.distance} km</td>
                    <td className="py-4 text-right font-medium text-gray-900">₹{route.yourRate.toLocaleString()}</td>
                    <td className="py-4 text-right text-gray-600">₹{route.marketRate.toLocaleString()}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium ${
                        route.difference < 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {route.difference < 0 ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {Math.abs(route.difference).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        {route.bookings}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {route.trend === 'up' ? (
                        <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />
                      ) : route.trend === 'down' ? (
                        <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Seasonal Trends Tab */}
        {activeTab === 'seasonal' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Peak Seasons */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Peak Demand Periods
                </h3>
                <div className="space-y-3">
                  {[
                    { period: 'Diwali Week', dates: 'Oct 28 - Nov 5', increase: '+45%' },
                    { period: 'Christmas & New Year', dates: 'Dec 20 - Jan 2', increase: '+60%' },
                    { period: 'Summer Holidays', dates: 'Apr 15 - Jun 15', increase: '+35%' },
                    { period: 'Long Weekends', dates: 'Various', increase: '+25%' }
                  ].map((season, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{season.period}</p>
                        <p className="text-sm text-gray-500">{season.dates}</p>
                      </div>
                      <span className="text-green-600 font-bold">{season.increase}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Off Seasons */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Low Demand Periods
                </h3>
                <div className="space-y-3">
                  {[
                    { period: 'Monsoon Season', dates: 'Jul 1 - Sep 15', decrease: '-30%' },
                    { period: 'Post Diwali', dates: 'Nov 10 - Dec 10', decrease: '-20%' },
                    { period: 'January Midweek', dates: 'Jan 5 - Jan 31', decrease: '-15%' },
                    { period: 'Exam Season', dates: 'Feb 15 - Apr 10', decrease: '-25%' }
                  ].map((season, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{season.period}</p>
                        <p className="text-sm text-gray-500">{season.dates}</p>
                      </div>
                      <span className="text-red-600 font-bold">{season.decrease}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Recommendations */}
              <div className="md:col-span-2 border border-blue-200 rounded-lg p-4 bg-blue-50">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Smart Pricing Recommendations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Dynamic Pricing</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Increase rates by 20-40% during peak seasons and weekends for higher revenue.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Off-Season Deals</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Offer 15-25% discounts during low demand periods to maintain fleet utilization.
                    </p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">Advance Booking</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Offer 10% early-bird discount for bookings made 7+ days in advance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
