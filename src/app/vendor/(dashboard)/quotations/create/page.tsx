'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  Calendar,
  Save,
  Send,
  Calculator,
} from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

const services = [
  'Bus Rental',
  'Tempo Traveller',
  'Self-Drive Cars',
  'Chauffeur Service',
  'Luxury Cars',
  'Packers & Movers',
  'Truck & Logistics',
  'Equipment Rental',
  'Bike Rental',
];

const serviceTemplates: Record<string, LineItem[]> = {
  'Bus Rental': [
    { id: '1', description: '45 Seater AC Bus', qty: 1, rate: 18000, amount: 18000 },
    { id: '2', description: 'Driver Bata', qty: 1, rate: 500, amount: 500 },
    { id: '3', description: 'Toll Charges', qty: 1, rate: 0, amount: 0 },
  ],
  'Packers & Movers': [
    { id: '1', description: 'Household Shifting', qty: 1, rate: 0, amount: 0 },
    { id: '2', description: 'Packing Material', qty: 1, rate: 5000, amount: 5000 },
    { id: '3', description: 'Loading/Unloading', qty: 1, rate: 3000, amount: 3000 },
    { id: '4', description: 'Insurance', qty: 1, rate: 0, amount: 0 },
  ],
  'Truck & Logistics': [
    { id: '1', description: 'Container Truck', qty: 1, rate: 0, amount: 0 },
    { id: '2', description: 'Loading Charges', qty: 1, rate: 3000, amount: 3000 },
    { id: '3', description: 'Unloading Charges', qty: 1, rate: 3000, amount: 3000 },
  ],
  'Equipment Rental': [
    { id: '1', description: 'Equipment Rental (per day)', qty: 1, rate: 0, amount: 0 },
    { id: '2', description: 'Operator Charges', qty: 1, rate: 800, amount: 800 },
    { id: '3', description: 'Fuel/Diesel', qty: 1, rate: 0, amount: 0 },
    { id: '4', description: 'Transportation to Site', qty: 1, rate: 5000, amount: 5000 },
  ],
};

export default function CreateQuotationPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerAddress: '',
    service: '',
    validDays: 7,
    notes: '',
    termsAndConditions: `1. This quotation is valid for the period mentioned above.
2. 50% advance payment required at the time of booking.
3. Balance payment due before service completion.
4. Prices are inclusive of GST unless otherwise mentioned.
5. Cancellation policy: Full refund if cancelled 48+ hours before, 50% refund if cancelled within 48 hours.`,
  });

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', description: '', qty: 1, rate: 0, amount: 0 },
  ]);

  const [gstRate, setGstRate] = useState(18);
  const [includeGst, setIncludeGst] = useState(true);

  const handleServiceChange = (service: string) => {
    setFormData({ ...formData, service });
    if (serviceTemplates[service]) {
      setItems(serviceTemplates[service].map((item, idx) => ({
        ...item,
        id: String(idx + 1),
      })));
    }
  };

  const addItem = () => {
    const newId = String(items.length + 1);
    setItems([...items, { id: newId, description: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof LineItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'rate') {
          updated.amount = Number(updated.qty) * Number(updated.rate);
        }
        return updated;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const gstAmount = includeGst ? Math.round(subtotal * gstRate / 100) : 0;
  const total = subtotal + gstAmount;

  const handleSubmit = async (action: 'save' | 'send') => {
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    router.push('/vendor/quotations?created=' + action);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/vendor/quotations"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Quotation</h1>
          <p className="text-gray-600">Generate a professional quote for your customer</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Customer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+91 9737965551"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Address
                </label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                  placeholder="Customer address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Service & Validity */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <select
                  value={formData.service}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service</option>
                  {services.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Valid For (Days)
                </label>
                <input
                  type="number"
                  value={formData.validDays}
                  onChange={(e) => setFormData({ ...formData, validDays: Number(e.target.value) })}
                  min={1}
                  max={30}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Line Items</h2>
              <button
                onClick={addItem}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>

            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 pb-2 border-b">
                <div className="col-span-5">Description</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Rate (₹)</div>
                <div className="col-span-2 text-right">Amount</div>
                <div className="col-span-1"></div>
              </div>

              {/* Items */}
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Item description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                      min={1}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                      min={0}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-right"
                    />
                  </div>
                  <div className="col-span-2 text-right font-medium text-gray-900">
                    ₹{item.amount.toLocaleString()}
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 hover:bg-red-100 rounded-lg transition text-red-500"
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* GST Toggle */}
            <div className="mt-4 pt-4 border-t flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGst}
                  onChange={(e) => setIncludeGst(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include GST</span>
              </label>
              {includeGst && (
                <select
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                >
                  <option value={5}>5% GST</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST</option>
                  <option value={28}>28% GST</option>
                </select>
              )}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Notes & Terms</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Any specific details about this quotation..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terms & Conditions</label>
                <textarea
                  value={formData.termsAndConditions}
                  onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Quote Summary
            </h2>

            {/* Quote Preview */}
            <div className="space-y-3 mb-6">
              {formData.customerName && (
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium text-gray-900">{formData.customerName}</p>
                </div>
              )}
              {formData.service && (
                <div>
                  <p className="text-sm text-gray-500">Service</p>
                  <p className="font-medium text-gray-900">{formData.service}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Valid Until</p>
                <p className="font-medium text-gray-900">
                  {new Date(Date.now() + formData.validDays * 86400000).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>
              {includeGst && (
                <div className="flex justify-between text-gray-600">
                  <span>GST ({gstRate}%)</span>
                  <span>₹{gstAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 mt-6 pt-4 border-t">
              <button
                onClick={() => handleSubmit('save')}
                disabled={isSubmitting || !formData.customerName || !formData.customerPhone || !formData.service}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit('send')}
                disabled={isSubmitting || !formData.customerName || !formData.customerPhone || !formData.service}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Create & Send
                  </>
                )}
              </button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 mt-4 text-center">
              Quote will be sent via WhatsApp with PDF attachment
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
