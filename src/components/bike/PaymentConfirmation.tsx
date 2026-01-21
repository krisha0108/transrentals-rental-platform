'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Copy,
  CheckCircle,
  QrCode,
  Upload,
  Building2,
  Phone,
  AlertCircle,
  Loader2,
  IndianRupee,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BankAccount {
  id: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName: string | null;
  accountType: string;
  upiId: string | null;
  upiQrCode: string | null;
  isPrimary: boolean;
}

// Helper to check if a string is a valid URL
function isValidUrl(str: string | null | undefined): boolean {
  if (!str) return false;
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

// Generate UPI QR code URL from UPI ID
function generateUpiQrCodeUrl(upiId: string, amount: number, payeeName: string): string {
  // UPI payment URL format
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR`;
  // Use QR Server API to generate QR code
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;
}

interface PaymentConfirmationProps {
  bookingId: string;
  bookingNumber: string;
  amount: number;
  serviceSlug?: string;
  onPaymentConfirmed?: () => void;
}

export function PaymentConfirmation({
  bookingId,
  bookingNumber,
  amount,
  serviceSlug = 'bike-rental',
  onPaymentConfirmed,
}: PaymentConfirmationProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [primaryAccount, setPrimaryAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showConfirmForm, setShowConfirmForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    paymentReference: '',
    paymentProof: '',
    paymentMethod: 'BANK_TRANSFER',
  });

  useEffect(() => {
    fetchBankDetails();
  }, [serviceSlug]);

  const fetchBankDetails = async () => {
    try {
      const res = await fetch(`/api/payment-details?service=${serviceSlug}`);
      const data = await res.json();
      if (data.success) {
        setBankAccounts(data.allAccounts || []);
        setPrimaryAccount(data.primaryAccount);
      }
    } catch (err) {
      console.error('Failed to fetch bank details:', err);
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentReference: formData.paymentReference,
          paymentProof: formData.paymentProof,
          paymentMethod: formData.paymentMethod,
          amount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        onPaymentConfirmed?.();
      } else {
        setError(data.error || 'Failed to confirm payment');
      }
    } catch (err) {
      console.error('Payment confirmation error:', err);
      setError('Failed to confirm payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h3>
        <p className="text-gray-600 mb-4">
          Your payment confirmation has been submitted. We will verify it and update your booking shortly.
        </p>
        <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-700">
          <AlertCircle className="w-4 h-4 inline-block mr-2" />
          Payment verification usually takes 15-30 minutes during business hours.
        </div>
      </motion.div>
    );
  }

  if (!primaryAccount && bankAccounts.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Details Unavailable</h3>
        <p className="text-gray-600">
          Payment details are currently not available. Please contact support.
        </p>
      </div>
    );
  }

  const account = primaryAccount || bankAccounts[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="w-6 h-6" />
          <h2 className="text-xl font-bold">Complete Your Payment</h2>
        </div>
        <p className="text-emerald-100">
          Make the advance payment to confirm your booking #{bookingNumber}
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Amount to Pay */}
        <div className="bg-emerald-50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount to Pay</span>
            <div className="flex items-center text-2xl font-bold text-emerald-600">
              <IndianRupee className="w-6 h-6" />
              {amount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* UPI Section */}
        {account.upiId && (
          <UpiPaymentSection
            upiId={account.upiId}
            upiQrCode={account.upiQrCode}
            accountHolderName={account.accountHolderName}
            amount={amount}
            copied={copied}
            onCopy={(text, field) => copyToClipboard(text, field)}
          />
        )}

        {/* Bank Details Section */}
        <div className="border rounded-xl p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Bank Transfer Details
          </h3>
          <div className="space-y-3">
            <DetailRow
              label="Bank Name"
              value={account.bankName}
              onCopy={() => copyToClipboard(account.bankName, 'bank')}
              copied={copied === 'bank'}
            />
            <DetailRow
              label="Account Holder"
              value={account.accountHolderName}
              onCopy={() => copyToClipboard(account.accountHolderName, 'holder')}
              copied={copied === 'holder'}
            />
            <DetailRow
              label="Account Number"
              value={account.accountNumber}
              onCopy={() => copyToClipboard(account.accountNumber, 'account')}
              copied={copied === 'account'}
              mono
            />
            <DetailRow
              label="IFSC Code"
              value={account.ifscCode}
              onCopy={() => copyToClipboard(account.ifscCode, 'ifsc')}
              copied={copied === 'ifsc'}
              mono
            />
            {account.branchName && (
              <DetailRow
                label="Branch"
                value={account.branchName}
                onCopy={() => copyToClipboard(account.branchName!, 'branch')}
                copied={copied === 'branch'}
              />
            )}
            <DetailRow
              label="Account Type"
              value={account.accountType}
              onCopy={() => copyToClipboard(account.accountType, 'type')}
              copied={copied === 'type'}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-amber-50 rounded-xl p-4">
          <h4 className="font-semibold text-amber-800 mb-2">Important Instructions:</h4>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>1. Transfer exactly {amount.toLocaleString()} to the above account</li>
            <li>2. Use booking number <strong>#{bookingNumber}</strong> as payment reference</li>
            <li>3. After payment, click &quot;I Have Made Payment&quot; below</li>
            <li>4. Enter your transaction reference/UTR number</li>
            <li>5. Our team will verify and confirm your booking</li>
          </ul>
        </div>

        {/* Confirm Payment Button */}
        {!showConfirmForm ? (
          <Button
            onClick={() => setShowConfirmForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-bold"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            I Have Made Payment
          </Button>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmitPayment}
            className="space-y-4 border-t pt-4"
          >
            <h3 className="font-semibold text-gray-900">Confirm Your Payment</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS/IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="CASH">Cash Deposit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Reference / UTR Number *
              </label>
              <input
                type="text"
                required
                value={formData.paymentReference}
                onChange={(e) => setFormData({ ...formData, paymentReference: e.target.value })}
                placeholder="Enter your transaction ID or UTR number"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Screenshot URL (Optional)
              </label>
              <input
                type="text"
                value={formData.paymentProof}
                onChange={(e) => setFormData({ ...formData, paymentProof: e.target.value })}
                placeholder="Paste screenshot URL (from Google Drive, Imgur, etc.)"
                className="w-full border rounded-lg px-3 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload your screenshot to a cloud service and paste the link here
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowConfirmForm(false)}
                className="flex-1"
                disabled={submitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Confirm Payment'
                )}
              </Button>
            </div>
          </motion.form>
        )}

        {/* Support Contact */}
        <div className="text-center text-sm text-gray-500">
          <p>Need help with payment?</p>
          <a href="tel:+919876543210" className="flex items-center justify-center gap-1 text-emerald-600 font-medium mt-1">
            <Phone className="w-4 h-4" />
            Call +91 98765 43210
          </a>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  value,
  onCopy,
  copied,
  mono = false,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button
          onClick={onCopy}
          className="p-1 hover:bg-gray-100 rounded transition"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

// UPI Payment Section with auto-generated QR code
function UpiPaymentSection({
  upiId,
  upiQrCode,
  accountHolderName,
  amount,
  copied,
  onCopy,
}: {
  upiId: string;
  upiQrCode: string | null;
  accountHolderName: string;
  amount: number;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  // Generate QR code URL - use provided URL if valid, otherwise auto-generate
  const qrCodeUrl = useMemo(() => {
    if (isValidUrl(upiQrCode)) {
      return upiQrCode!;
    }
    // Auto-generate QR code from UPI ID
    return generateUpiQrCodeUrl(upiId, amount, accountHolderName);
  }, [upiId, upiQrCode, amount, accountHolderName]);

  return (
    <div className="border rounded-xl p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-purple-600" />
        Pay via UPI
      </h3>
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="bg-white p-3 rounded-lg border shadow-sm">
          {/* Using img tag instead of next/image for external QR API */}
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            width={180}
            height={180}
            className="rounded"
          />
        </div>
        <div className="flex-1 text-center md:text-left">
          <p className="text-sm text-gray-500 mb-2">Scan QR code or use UPI ID:</p>
          <div className="flex items-center justify-center md:justify-start gap-2 bg-gray-100 rounded-lg px-4 py-3">
            <span className="font-mono font-semibold text-gray-900">{upiId}</span>
            <button
              onClick={() => onCopy(upiId, 'upi')}
              className="p-1 hover:bg-gray-200 rounded transition"
            >
              {copied === 'upi' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Amount: ₹{amount.toLocaleString()} • Payee: {accountHolderName}
          </p>
        </div>
      </div>
    </div>
  );
}
