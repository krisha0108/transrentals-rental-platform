'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Car,
  IndianRupee,
  Save,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  Briefcase,
  Building2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';

const ROLES = [
  { value: 'DRIVER', label: 'Driver' },
  { value: 'HELPER', label: 'Helper' },
  { value: 'MECHANIC', label: 'Mechanic' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'OFFICE_STAFF', label: 'Office Staff' },
];

const LICENSE_TYPES = [
  { value: 'LMV', label: 'LMV (Light Motor Vehicle)' },
  { value: 'LMV-TR', label: 'LMV-TR (LMV + Transport)' },
  { value: 'HMV', label: 'HMV (Heavy Motor Vehicle)' },
  { value: 'HGMV', label: 'HGMV (Heavy Goods Motor Vehicle)' },
  { value: 'HPMV', label: 'HPMV (Heavy Passenger Motor Vehicle)' },
  { value: 'MCWG', label: 'MCWG (Motorcycle with Gear)' },
  { value: 'MCWOG', label: 'MCWOG (Motorcycle without Gear)' },
];

const inputCls =
  'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm';
const labelCls =
  'block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide';

export default function AddStaffPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Info
    name: '',
    phone: '',
    email: '',
    password: '', // Login password for driver app
    address: '',
    city: '',
    state: '',
    pincode: '',
    dateOfBirth: '',
    joiningDate: new Date().toISOString().split('T')[0],

    // Role & Status
    role: 'DRIVER',
    status: 'ACTIVE',

    // Documents
    aadharNumber: '',
    panNumber: '',

    // License (for drivers)
    licenseNumber: '',
    licenseType: '',
    licenseExpiry: '',

    // Bank Details
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',

    // Employment
    salary: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }

      // For drivers, email and password are required for app login
      if (formData.role === 'DRIVER') {
        if (!formData.email.trim()) {
          throw new Error('Email is required for drivers (needed for app login)');
        }
        if (!formData.password.trim()) {
          throw new Error('Password is required for drivers (needed for app login)');
        }
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }
      }

      // Prepare data
      const submitData = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : 0,
        dateOfBirth: formData.dateOfBirth || null,
        joiningDate: formData.joiningDate || null,
        licenseExpiry: formData.licenseExpiry || null,
      };

      const response = await fetch('/api/vendor/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to add staff');
      }

      // Redirect to staff list
      router.push('/vendor/staff');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDriver = formData.role === 'DRIVER';

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 -m-4 sm:-m-6 p-4 sm:p-6">
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes float-rev {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(15px) translateX(-10px); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-rev { animation: float-rev 10s ease-in-out infinite; }
        .animate-fade-up { animation: fade-up 0.5s ease-out both; }
        .animate-pop-in { animation: pop-in 0.4s ease-out both; }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease infinite;
        }
      `}</style>

      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Gradient Banner Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 animate-gradient-x shadow-xl animate-fade-up">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-float-slow"></div>
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-emerald-300/20 rounded-full blur-3xl animate-float-rev"></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-emerald-300/20 rounded-full blur-2xl animate-float-slow"></div>

          <div className="relative px-6 py-6 sm:px-8 sm:py-8 flex items-center gap-4">
            <Link
              href="/vendor/staff"
              className="p-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl border border-white/20 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
              <UserPlus className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span className="text-xs font-semibold text-emerald-100 uppercase tracking-widest">Staff Management</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white truncate">Add New Staff</h1>
              <p className="text-sm text-emerald-100 mt-0.5">Add a new employee to your team</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-medium animate-pop-in shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '60ms' }}>
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <User className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>
                  Email Address {isDriver && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter email address"
                  required={isDriver}
                />
                {isDriver && (
                  <p className="text-xs text-gray-500 mt-1.5">Used for driver app login</p>
                )}
              </div>
              {isDriver && (
                <div>
                  <label className={labelCls}>
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none text-sm"
                      placeholder="Min 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Driver will use this to login to the app</p>
                </div>
              )}
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className={inputCls}
                  placeholder="Enter full address"
                />
              </div>
              <div>
                <label className={labelCls}>City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter city"
                />
              </div>
              <div>
                <label className={labelCls}>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter state"
                />
              </div>
            </div>
          </div>

          {/* Role & Employment */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <Briefcase className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Role & Employment</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={inputCls}
                >
                  {ROLES.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="ON_LEAVE">On Leave</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Joining Date</label>
                <input
                  type="date"
                  name="joiningDate"
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Monthly Salary (₹)</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter salary amount"
                />
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                <CreditCard className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Identity Documents</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Aadhar Number</label>
                <input
                  type="text"
                  name="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="XXXX-XXXX-XXXX"
                  maxLength={14}
                />
              </div>
              <div>
                <label className={labelCls}>PAN Number</label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
            </div>
          </div>

          {/* License Details (for drivers) */}
          {isDriver && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '240ms' }}>
              <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                  <Car className="w-4.5 h-4.5 text-white" />
                </div>
                <h2 className="text-base font-bold text-gray-900">Driving License</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>License Number</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    className={inputCls}
                    placeholder="MH0220220012345"
                  />
                </div>
                <div>
                  <label className={labelCls}>License Type</label>
                  <select
                    name="licenseType"
                    value={formData.licenseType}
                    onChange={handleChange}
                    className={inputCls}
                  >
                    <option value="">Select type</option>
                    {LICENSE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>License Expiry</label>
                  <input
                    type="date"
                    name="licenseExpiry"
                    value={formData.licenseExpiry}
                    onChange={handleChange}
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bank Details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                <Building2 className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Bank Details</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Bank Name</label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter account holder name"
                />
              </div>
              <div>
                <label className={labelCls}>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className={labelCls}>IFSC Code</label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter IFSC code"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: '360ms' }}>
            <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/30 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-md">
                <Phone className="w-4.5 h-4.5 text-white" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Emergency Contact</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter emergency contact name"
                />
              </div>
              <div>
                <label className={labelCls}>Contact Phone</label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  value={formData.emergencyPhone}
                  onChange={handleChange}
                  className={inputCls}
                  placeholder="Enter emergency contact phone"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end animate-fade-up" style={{ animationDelay: '420ms' }}>
            <Link
              href="/vendor/staff"
              className="px-6 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all text-center shadow-sm"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Add Staff
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
