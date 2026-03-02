'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Loader2,
    Search,
    TrendingUp,
    Award,
    BarChart3,
    AlertCircle,
    RefreshCcw,
    ChevronRight
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface VendorPerformance {
    id: string;
    businessName: string;
    status: string;
    totalQuotes: number;
    acceptedQuotes: number;
    acceptanceRate: number;
}

export default function VendorPerformancePage() {
    const [data, setData] = useState<VendorPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const { showToast } = useToast();

    const fetchPerformance = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('/api/manager/vendor-performance');
            const result = await response.json();

            if (result.data) {
                setData(result.data);
            } else if (result.error) {
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: result.error
                });
            }
        } catch (error) {
            console.error('Error fetching performance:', error);
            showToast({
                type: 'error',
                title: 'Error',
                message: 'Failed to load performance data'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    const filteredData = data.filter(v =>
        v.businessName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        avgRate: data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.acceptanceRate, 0) / data.length) : 0,
        totalQuotes: data.reduce((acc, curr) => acc + curr.totalQuotes, 0),
        topVendor: data.length > 0 ? data[0].businessName : 'N/A'
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Crunching the numbers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-7 h-7 text-green-600" />
                        Vendor Performance
                    </h1>
                    <p className="text-gray-500 mt-1">Track and analyze quote acceptance rates. Click a vendor to see their booking history.</p>
                </div>
                <button
                    onClick={fetchPerformance}
                    disabled={refreshing}
                    className="flex items-center justify-center h-10 px-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition shadow-sm disabled:opacity-50 font-medium"
                >
                    <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    Refresh Stats
                </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-lg group-hover:scale-110 transition-transform">
                            <BarChart3 className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Avg. Acceptance Rate</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.avgRate}%</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-lg group-hover:scale-110 transition-transform">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Quotes</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats.totalQuotes.toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 rounded-lg group-hover:scale-110 transition-transform">
                            <Award className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Top Performing Vendor</p>
                            <h3 className="text-2xl font-bold text-gray-900 truncate max-w-[150px]">{stats.topVendor}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search vendor by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-green-500/20 transition outline-none"
                    />
                </div>
            </div>

            {/* Performance Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Vendor Business Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">Submitted</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider text-center">Accepted</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Acceptance Rate</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredData.length > 0 ? (
                                filteredData.map((vendor) => (
                                    <tr
                                        key={vendor.id}
                                        className="hover:bg-green-50/50 transition cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                <div className="font-semibold text-gray-900 group-hover:text-green-700 transition-colors uppercase">{vendor.businessName}</div>
                                                <div className="text-xs text-gray-400 mt-0.5 font-mono">ID: {vendor.id}</div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                {vendor.totalQuotes}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-green-600">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                {vendor.acceptedQuotes}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 min-w-[200px]">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-700 ease-out rounded-full ${vendor.acceptanceRate > 70 ? 'bg-green-500' :
                                                                vendor.acceptanceRate > 40 ? 'bg-amber-500' : 'bg-red-500'
                                                                }`}
                                                            style={{ width: `${vendor.acceptanceRate}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700 min-w-[40px]">{vendor.acceptanceRate}%</span>
                                                </div>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${vendor.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                                    vendor.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {vendor.status}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/manager/vendor-performance/${vendor.id}`} className="block">
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-500 transition-colors" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle className="w-12 h-12 text-gray-200 mb-2" />
                                            <p>No vendors found matching your search.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
