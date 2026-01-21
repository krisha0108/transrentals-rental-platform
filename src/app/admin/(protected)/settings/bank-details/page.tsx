'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CreditCard, Building2, QrCode, Check, X } from 'lucide-react';

interface BankDetail {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string | null;
  accountType: string;
  upiId: string | null;
  upiQrCode: string | null;
  isActive: boolean;
  isPrimary: boolean;
  displayOrder: number;
  serviceId: string | null;
  service: { id: string; name: string; slug: string } | null;
}

interface Service {
  id: string;
  name: string;
  slug: string;
}

export default function BankDetailsPage() {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BankDetail | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    accountType: 'SAVINGS',
    upiId: '',
    upiQrCode: '',
    isActive: true,
    isPrimary: false,
    displayOrder: 0,
    serviceId: '',
  });

  useEffect(() => {
    fetchBankDetails();
    fetchServices();
  }, []);

  const fetchBankDetails = async () => {
    try {
      const res = await fetch('/api/admin/bank-details');
      const data = await res.json();
      if (data.success) {
        setBankDetails(data.bankDetails);
      }
    } catch (error) {
      console.error('Failed to fetch bank details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/services?parentOnly=true');
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingItem
        ? `/api/admin/bank-details/${editingItem.id}`
        : '/api/admin/bank-details';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceId: formData.serviceId || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        fetchBankDetails();
        setShowModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const res = await fetch(`/api/admin/bank-details/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchBankDetails();
      } else {
        alert(data.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete bank details');
    }
  };

  const handleEdit = (item: BankDetail) => {
    setEditingItem(item);
    setFormData({
      accountHolderName: item.accountHolderName,
      accountNumber: item.accountNumber,
      ifscCode: item.ifscCode,
      bankName: item.bankName,
      branchName: item.branchName || '',
      accountType: item.accountType,
      upiId: item.upiId || '',
      upiQrCode: item.upiQrCode || '',
      isActive: item.isActive,
      isPrimary: item.isPrimary,
      displayOrder: item.displayOrder,
      serviceId: item.serviceId || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountType: 'SAVINGS',
      upiId: '',
      upiQrCode: '',
      isActive: true,
      isPrimary: false,
      displayOrder: 0,
      serviceId: '',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bank Details</h1>
          <p className="text-gray-600 mt-1">
            Manage bank accounts for customer payments
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Bank Account
        </button>
      </div>

      {/* Bank Details List */}
      <div className="grid gap-4">
        {bankDetails.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Bank Accounts</h3>
            <p className="mt-2 text-gray-500">Add bank account details for customer payments.</p>
          </div>
        ) : (
          bankDetails.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-lg border p-4 ${
                item.isPrimary ? 'border-blue-500 ring-1 ring-blue-500' : ''
              } ${!item.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{item.bankName}</h3>
                      {item.isPrimary && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                          Primary
                        </span>
                      )}
                      {!item.isActive && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600">{item.accountHolderName}</p>
                    <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      <div>
                        <span className="text-gray-500">Account:</span>{' '}
                        <span className="font-mono">{item.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">IFSC:</span>{' '}
                        <span className="font-mono">{item.ifscCode}</span>
                      </div>
                      {item.branchName && (
                        <div>
                          <span className="text-gray-500">Branch:</span> {item.branchName}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Type:</span> {item.accountType}
                      </div>
                      {item.upiId && (
                        <div className="col-span-2 flex items-center gap-1">
                          <QrCode size={14} className="text-gray-500" />
                          <span className="text-gray-500">UPI:</span>{' '}
                          <span className="font-mono">{item.upiId}</span>
                        </div>
                      )}
                    </div>
                    {item.service && (
                      <div className="mt-2">
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          {item.service.name}
                        </span>
                      </div>
                    )}
                    {!item.service && (
                      <div className="mt-2">
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          All Services
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit Bank Account' : 'Add Bank Account'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData({ ...formData, accountHolderName: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="State Bank of India"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Main Branch"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 font-mono"
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IFSC Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ifscCode}
                    onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                    className="w-full border rounded-lg px-3 py-2 font-mono uppercase"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="SAVINGS">Savings</option>
                  <option value="CURRENT">Current</option>
                </select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">UPI Details (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      UPI ID
                    </label>
                    <input
                      type="text"
                      value={formData.upiId}
                      onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 font-mono"
                      placeholder="yourname@upi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code URL
                    </label>
                    <input
                      type="text"
                      value={formData.upiQrCode}
                      onChange={(e) => setFormData({ ...formData, upiQrCode: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Settings</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service (Optional)
                  </label>
                  <select
                    value={formData.serviceId}
                    onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">All Services</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to use for all services
                  </p>
                </div>

                <div className="flex gap-6 mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPrimary}
                      onChange={(e) => setFormData({ ...formData, isPrimary: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">Primary Account</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingItem ? 'Update' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
