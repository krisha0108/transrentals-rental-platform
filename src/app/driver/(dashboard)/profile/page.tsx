'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Phone,
  Mail,
  CreditCard,
  Car,
  Calendar,
  Building,
  LogOut,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  status: string;
  vendor?: {
    id: string;
    businessName: string;
    businessPhone?: string;
  };
}

export default function DriverProfilePage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/driver/auth/me');
      const data = await response.json();

      if (data.success) {
        setDriver(data.driver);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm('Are you sure you want to logout?')) return;

    try {
      await fetch('/api/driver/auth/logout', { method: 'POST' });
      localStorage.removeItem('driver-token');
      router.push('/driver/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load profile</p>
      </div>
    );
  }

  // Check license expiry
  const isLicenseExpired = driver.licenseExpiry
    ? new Date(driver.licenseExpiry) < new Date()
    : false;

  const isLicenseExpiringSoon = driver.licenseExpiry
    ? new Date(driver.licenseExpiry) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">View your profile information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-3xl font-bold">
            {driver.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{driver.name}</h2>
            <p className="text-emerald-100">{driver.phone}</p>
            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
              driver.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'
            }`}>
              {driver.status}
            </span>
          </div>
        </div>
      </div>

      {/* License Warning */}
      {(isLicenseExpired || isLicenseExpiringSoon) && (
        <div className={`p-4 rounded-xl flex items-start gap-3 ${
          isLicenseExpired ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
        }`}>
          <AlertCircle className={`w-5 h-5 mt-0.5 ${
            isLicenseExpired ? 'text-red-600' : 'text-amber-600'
          }`} />
          <div>
            <p className={`font-medium ${isLicenseExpired ? 'text-red-700' : 'text-amber-700'}`}>
              {isLicenseExpired ? 'License Expired!' : 'License Expiring Soon'}
            </p>
            <p className={`text-sm ${isLicenseExpired ? 'text-red-600' : 'text-amber-600'}`}>
              {isLicenseExpired
                ? 'Your driving license has expired. Please renew it immediately.'
                : 'Your driving license will expire soon. Please renew it.'}
            </p>
          </div>
        </div>
      )}

      {/* Contact Info */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-bold text-gray-900 mb-4">Contact Information</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone Number</p>
              <p className="font-medium">{driver.phone}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="font-medium">{driver.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* License Details */}
      {driver.licenseNumber && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold text-gray-900 mb-4">Driving License</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">License Number</p>
                <p className="font-medium">{driver.licenseNumber}</p>
              </div>
            </div>

            {driver.licenseType && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Car className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">License Type</p>
                  <p className="font-medium">{driver.licenseType}</p>
                </div>
              </div>
            )}

            {driver.licenseExpiry && (
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isLicenseExpired ? 'bg-red-100' : isLicenseExpiringSoon ? 'bg-amber-100' : 'bg-blue-100'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    isLicenseExpired ? 'text-red-600' : isLicenseExpiringSoon ? 'text-amber-600' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expiry Date</p>
                  <p className={`font-medium ${
                    isLicenseExpired ? 'text-red-600' : isLicenseExpiringSoon ? 'text-amber-600' : ''
                  }`}>
                    {new Date(driver.licenseExpiry).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vendor Info */}
      {driver.vendor && (
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Company Name</p>
              <p className="font-medium">{driver.vendor.businessName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full py-4 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-red-100"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </div>
  );
}
