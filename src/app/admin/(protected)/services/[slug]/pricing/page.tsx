'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  DollarSign,
  Save,
  AlertCircle,
  Loader2,
  Car,
  Bike,
  Bus,
  Truck,
  Package,
  Wrench,
  Crown,
  CarTaxiFront,
  Plus,
  Trash2,
  Info,
  Percent,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react';
import { FLOW_TYPE_CONFIG, DURATION_OPTIONS, TRIP_TYPES } from '@/lib/constants/booking-services';
import { Button } from '@/components/ui/button';

interface PricingRule {
  id: string;
  name: string;
  type: 'BASE' | 'DURATION' | 'TRIP_TYPE' | 'SURGE' | 'DISCOUNT';
  value: number;
  unit: 'FIXED' | 'PERCENT';
  conditions?: string;
  isActive: boolean;
}

const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Car,
  Bike,
  CarTaxiFront,
  Crown,
  Bus,
  Truck,
  Package,
  Wrench,
};

interface ServiceData {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  flowType?: string;
}

export default function ServicePricingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [service, setService] = useState<ServiceData | null>(null);
  const [serviceLoading, setServiceLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Pricing state
  const [basePricing, setBasePricing] = useState({
    minPrice: 500,
    maxPrice: 50000,
    displayFormat: 'Per Day',
    commission: 15,
  });

  const [additionalCharges, setAdditionalCharges] = useState({
    extraKmRate: 5,
    nightCharges: 200,
    securityDeposit: 2000,
    cleaningFee: 300,
    lateFee: 500,
  });

  const [pricingRules, setPricingRules] = useState<PricingRule[]>([
    { id: '1', name: 'Weekend Surge', type: 'SURGE', value: 20, unit: 'PERCENT', conditions: 'Sat-Sun', isActive: true },
    { id: '2', name: 'Weekly Discount', type: 'DISCOUNT', value: 10, unit: 'PERCENT', conditions: '7+ days', isActive: true },
    { id: '3', name: 'Monthly Discount', type: 'DISCOUNT', value: 20, unit: 'PERCENT', conditions: '30+ days', isActive: true },
    { id: '4', name: 'Peak Season Surge', type: 'SURGE', value: 30, unit: 'PERCENT', conditions: 'Dec 20 - Jan 5', isActive: false },
  ]);

  const ServiceIcon = service ? IconMap[service.icon || ''] || Car : Car;

  // Fetch service from database
  useEffect(() => {
    const fetchService = async () => {
      try {
        const res = await fetch(`/api/admin/services?slug=${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setService(data[0]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch service:', error);
      } finally {
        setServiceLoading(false);
      }
    };
    fetchService();
  }, [slug]);

  useEffect(() => {
    const fetchPricing = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/services/${slug}/pricing`);
        if (res.ok) {
          const data = await res.json();
          if (data.pricing) {
            setBasePricing(data.pricing.basePricing);
            setAdditionalCharges(data.pricing.additionalCharges);
            if (data.pricing.pricingRules?.length > 0) {
              setPricingRules(data.pricing.pricingRules);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPricing();
    }
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${slug}/pricing`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basePricing,
          additionalCharges,
          pricingRules,
        }),
      });

      if (res.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save pricing:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = (id: string) => {
    setPricingRules((prev) =>
      prev.map((rule) => (rule.id === id ? { ...rule, isActive: !rule.isActive } : rule))
    );
    setHasChanges(true);
  };

  const deleteRule = (id: string) => {
    setPricingRules((prev) => prev.filter((rule) => rule.id !== id));
    setHasChanges(true);
  };

  if (serviceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="space-y-6">
        <Link href="/admin/services" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </Link>
        <div className="bg-white rounded-xl p-12 text-center border">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Service Not Found</h3>
          <p className="text-gray-500">The service &quot;{slug}&quot; does not exist.</p>
        </div>
      </div>
    );
  }

  const flowConfig = FLOW_TYPE_CONFIG[service.flowType || 'BROWSE_FIRST'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link
            href={`/admin/services/${slug}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {service.name}
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pricing Configuration</h1>
              <p className="text-gray-600">{service.name}</p>
            </div>
          </div>
        </div>
        <Button
          disabled={!hasChanges || saving}
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Flow Type Info */}
      <div className={`rounded-lg p-4 ${flowConfig.color} flex items-center gap-3`}>
        <Info className="w-5 h-5" />
        <div>
          <span className="font-medium">{flowConfig.label}</span>
          <span className="mx-2">-</span>
          <span>{flowConfig.description}</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl p-12 border flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Base Pricing */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Base Pricing</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Price (₹)</label>
                  <input
                    type="number"
                    value={basePricing.minPrice}
                    onChange={(e) => {
                      setBasePricing({ ...basePricing, minPrice: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Price (₹)</label>
                  <input
                    type="number"
                    value={basePricing.maxPrice}
                    onChange={(e) => {
                      setBasePricing({ ...basePricing, maxPrice: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Display Format</label>
                <select
                  value={basePricing.displayFormat}
                  onChange={(e) => {
                    setBasePricing({ ...basePricing, displayFormat: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {DURATION_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.label}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Commission (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={basePricing.commission}
                    onChange={(e) => {
                      setBasePricing({ ...basePricing, commission: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Additional Charges */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Charges</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extra KM Rate (₹)</label>
                  <input
                    type="number"
                    value={additionalCharges.extraKmRate}
                    onChange={(e) => {
                      setAdditionalCharges({ ...additionalCharges, extraKmRate: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Night Charges (₹)</label>
                  <input
                    type="number"
                    value={additionalCharges.nightCharges}
                    onChange={(e) => {
                      setAdditionalCharges({ ...additionalCharges, nightCharges: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Security Deposit (₹)</label>
                  <input
                    type="number"
                    value={additionalCharges.securityDeposit}
                    onChange={(e) => {
                      setAdditionalCharges({ ...additionalCharges, securityDeposit: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cleaning Fee (₹)</label>
                  <input
                    type="number"
                    value={additionalCharges.cleaningFee}
                    onChange={(e) => {
                      setAdditionalCharges({ ...additionalCharges, cleaningFee: Number(e.target.value) });
                      setHasChanges(true);
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Late Return Fee (₹/hour)</label>
                <input
                  type="number"
                  value={additionalCharges.lateFee}
                  onChange={(e) => {
                    setAdditionalCharges({ ...additionalCharges, lateFee: Number(e.target.value) });
                    setHasChanges(true);
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing Rules */}
          <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Pricing Rules</h3>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>
            <div className="space-y-3">
              {pricingRules.map((rule) => (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    rule.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        rule.type === 'SURGE'
                          ? 'bg-red-100 text-red-600'
                          : rule.type === 'DISCOUNT'
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {rule.type === 'SURGE' ? (
                        <Clock className="w-5 h-5" />
                      ) : rule.type === 'DISCOUNT' ? (
                        <Percent className="w-5 h-5" />
                      ) : (
                        <DollarSign className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{rule.name}</p>
                      <p className="text-sm text-gray-500">
                        {rule.type === 'SURGE' ? '+' : '-'}
                        {rule.value}
                        {rule.unit === 'PERCENT' ? '%' : '₹'} | {rule.conditions}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => toggleRule(rule.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trip Type Pricing (if applicable) */}
          {service.flowType === 'TRIP_FIRST' && (
            <div className="bg-white rounded-xl shadow-sm border p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Type Pricing Multipliers</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {TRIP_TYPES.map((tripType) => (
                  <div key={tripType.id} className="p-4 border rounded-lg">
                    <p className="font-medium text-gray-900 text-sm mb-1">{tripType.name}</p>
                    <div className="relative">
                      <input
                        type="number"
                        defaultValue={1}
                        step={0.1}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
