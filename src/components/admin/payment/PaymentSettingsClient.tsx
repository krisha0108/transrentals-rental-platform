'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateGlobalPaymentSettings, updateServicePaymentConfig } from '@/app/actions/payment-settings';
import { Service } from '@/lib/api/services';
import { Loader2, Save, Edit2, AlertCircle, RefreshCw } from 'lucide-react';

interface PaymentSettings {
    id: string;
    defaultGst: number;
    defaultPlatformFee: number;
    defaultAdvance: number;
    defaultSecurityDeposit: number;
}

interface ServiceConfig {
    serviceId: string;
    gst: number | null;
    platformFee: number | null;
    advancePercentage: number | null;
    securityDeposit: number | null;
    minBookingDays: number | null;
    maxBookingDays: number | null;
}

interface Props {
    globalSettings: PaymentSettings | null;
    services: any[]; // Using any[] because of Type mismatch between API Service (number id) and DB Service (string id)
    serviceConfigs: ServiceConfig[];
    fetchError?: string;
}

export function PaymentSettingsClient({ globalSettings, services, serviceConfigs, fetchError }: Props) {
    const router = useRouter();
    const [isGlobalSaving, setIsGlobalSaving] = useState(false);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [isServiceSaving, setIsServiceSaving] = useState(false);

    async function handleGlobalSubmit(formData: FormData) {
        setIsGlobalSaving(true);
        try {
            await updateGlobalPaymentSettings(formData);
            router.refresh();
        } catch (error) {
            console.error(error);
            alert('Failed to save global settings');
        } finally {
            setIsGlobalSaving(false);
        }
    }

    async function handleServiceSubmit(formData: FormData) {
        setIsServiceSaving(true);
        try {
            await updateServicePaymentConfig(formData);
            router.refresh();
            setEditingServiceId(null);
        } catch (error) {
            console.error(error);
            alert('Failed to save service settings');
        } finally {
            setIsServiceSaving(false);
        }
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto">

            {/* GLOBAL SETTINGS CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-blue-600" />
                    Global Payment Defaults
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    These values will be applied to all services unless overridden specifically below.
                </p>

                <form action={handleGlobalSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">GST %</label>
                        <div className="relative">
                            <input
                                name="defaultGst"
                                type="number"
                                step="0.01"
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                defaultValue={globalSettings?.defaultGst ?? 18}
                                required
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Platform Fee</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                            <input
                                name="defaultPlatformFee"
                                type="number"
                                step="1"
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 pl-7 pr-3 py-2 border"
                                defaultValue={globalSettings?.defaultPlatformFee ?? 99}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Advance Payment</label>
                        <div className="relative">
                            <input
                                name="defaultAdvance"
                                type="number"
                                step="0.01"
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 px-3 py-2 border"
                                defaultValue={globalSettings?.defaultAdvance ?? 20}
                                required
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Security Deposit</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-400 text-sm">₹</span>
                            <input
                                name="defaultSecurityDeposit"
                                type="number"
                                step="500"
                                className="w-full rounded-lg border-gray-300 focus:ring-blue-500 focus:border-blue-500 pl-7 pr-3 py-2 border"
                                defaultValue={globalSettings?.defaultSecurityDeposit ?? 2000}
                                required
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isGlobalSaving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-70"
                        >
                            {isGlobalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Defaults
                        </button>
                    </div>
                </form>
            </div>

            {/* SERVICE OVERRIDES LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-purple-600" />
                        Service-Level Overrides
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Customize fees for specific services. Leave fields empty to inherit Global Defaults.
                    </p>
                </div>

                <div className="divide-y divide-gray-100">
                    {services.map((service) => {
                        const config = serviceConfigs.find(c => c.serviceId === service.id);
                        const isEditing = editingServiceId === service.id;

                        // Format for display (showing 'Global' or value)
                        const displayVal = (val: number | null, suffix: string, defaultVal?: number) => {
                            if (val === null || val === undefined) return <span className="text-gray-400 text-xs italic">Inherit ({defaultVal}{suffix})</span>;
                            return <span className="font-semibold text-gray-700">{val}{suffix}</span>;
                        };

                        if (isEditing) {
                            return (
                                <div key={service.id} className="p-6 bg-blue-50/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg text-blue-800">{service.name}</h3>
                                        <button
                                            onClick={() => setEditingServiceId(null)}
                                            className="text-gray-500 hover:text-gray-700 text-sm"
                                        >
                                            Cancel
                                        </button>
                                    </div>

                                    <form action={handleServiceSubmit} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <input type="hidden" name="serviceId" value={service.id} />
                                        <input type="hidden" name="serviceName" value={service.name} />

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">GST %</label>
                                            <input name="gst" type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md" defaultValue={config?.gst ?? ''} placeholder="Global" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Platform Fee (₹)</label>
                                            <input name="platformFee" type="number" step="1" className="w-full text-sm border-gray-300 rounded-md" defaultValue={config?.platformFee ?? ''} placeholder="Global" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Advance %</label>
                                            <input name="advancePercentage" type="number" step="0.01" className="w-full text-sm border-gray-300 rounded-md" defaultValue={config?.advancePercentage ?? ''} placeholder="Global" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Security Dep (₹)</label>
                                            <input name="securityDeposit" type="number" step="100" className="w-full text-sm border-gray-300 rounded-md" defaultValue={config?.securityDeposit ?? ''} placeholder="Global" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Min Days</label>
                                            <input name="minBookingDays" type="number" className="w-full text-sm border-gray-300 rounded-md" defaultValue={config?.minBookingDays ?? ''} placeholder="Global" />
                                        </div>

                                        <div className="flex items-end">
                                            <button
                                                type="submit"
                                                disabled={isServiceSaving}
                                                className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                                            >
                                                {isServiceSaving ? '...' : 'Save'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            );
                        }

                        return (
                            <div key={service.id} className="p-6 hover:bg-gray-50 transition group">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="min-w-[200px]">
                                        <h3 className="font-semibold text-gray-800">{service.name}</h3>
                                        <p className="text-xs text-gray-400 mt-1">ID: {service.id}</p>
                                    </div>

                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">GST</p>
                                            {displayVal(config?.gst ?? null, '%', globalSettings?.defaultGst)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Platform Fee</p>
                                            {displayVal(config?.platformFee ?? null, '₹', globalSettings?.defaultPlatformFee)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Advance</p>
                                            {displayVal(config?.advancePercentage ?? null, '%', globalSettings?.defaultAdvance)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Security Dep</p>
                                            {displayVal(config?.securityDeposit ?? null, '₹', globalSettings?.defaultSecurityDeposit)}
                                        </div>
                                    </div>

                                    <div>
                                        <button
                                            onClick={() => setEditingServiceId(service.id)}
                                            className="opacity-0 group-hover:opacity-100 px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-white hover:border-blue-300 hover:text-blue-600 transition"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {services.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            {fetchError ? (
                                <p className="text-red-500 mt-2">Error: {fetchError}</p>
                            ) : (
                                <p>No services found. Check API connection.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
