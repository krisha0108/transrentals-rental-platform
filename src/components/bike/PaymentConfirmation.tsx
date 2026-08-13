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
  ChevronDown,
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
  /**
   * Optional secondary control rendered in the same row as "I Have Made
   * Payment" (e.g. "Back to online payment"). Without it the primary button
   * spans the row on its own, so existing callers are unaffected.
   */
  secondaryAction?: React.ReactNode;
}

export function PaymentConfirmation({
  bookingId,
  bookingNumber,
  amount,
  serviceSlug = 'bike-rental',
  onPaymentConfirmed,
  secondaryAction,
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
    // No header or card chrome of its own — every caller (BookingPayment,
    // embedded or not) already wraps this panel in a bordered card, and a
    // second border here just draws a box inside a box.
    //
    // data-manual-payment lets a parent restyle itself when this (much taller)
    // panel is on screen, via CSS :has() — no extra state anywhere.
    <div className="overflow-hidden" data-manual-payment>
      <div className="p-4 space-y-3.5">
        {/* Amount to Pay */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#C8F1DF] bg-[#E9FAF2] px-5 py-3">
          <span className="text-[13.5px] font-semibold text-[#056B3E]">Amount to Pay</span>
          <span className="flex items-center text-xl font-extrabold tabular-nums text-[#056B3E]">
            <IndianRupee className="w-[18px] h-[18px]" />
            {amount.toLocaleString()}
          </span>
        </div>

        {/* UPI and bank details sit side by side so the panel stays short */}
        <div className="grid items-start gap-3.5 lg:grid-cols-2">
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
        <div className="h-full rounded-xl border border-gray-100 bg-[#FCFDFC] p-5">
          <h3 className="mb-2 flex items-center gap-2 text-[15px] font-extrabold text-gray-900">
            <Building2 className="w-[18px] h-[18px] text-[#056B3E]" />
            Bank Transfer Details
          </h3>
          <div>
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

        </div>

        {/* Instructions — reference material, not something to re-read before
            every transfer, so it starts collapsed. */}
        <details className="group rounded-xl border border-amber-200 bg-amber-50">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-3 text-[13.5px] font-bold text-amber-800">
            Important Instructions
            <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <ul className="space-y-1.5 px-5 pb-4 text-[13px] leading-relaxed text-amber-700">
            <li>1. Transfer exactly {amount.toLocaleString()} to the above account</li>
            <li>2. Use booking number <strong>#{bookingNumber}</strong> as payment reference</li>
            <li>3. After payment, click &quot;I Have Made Payment&quot; below</li>
            <li>4. Enter your transaction reference/UTR number</li>
            <li>5. Our team will verify and confirm your booking</li>
          </ul>
        </details>

        {/* Confirm Payment Button */}
        {!showConfirmForm ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            {secondaryAction}
            <Button
              onClick={() => setShowConfirmForm(true)}
              className="flex-1 rounded-xl bg-[#09B368] py-3.5 text-[14px] font-bold text-white hover:bg-[#078F53]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              I Have Made Payment
            </Button>
          </div>
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
                placeholder="+91 9737965551"
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
    <div className="flex items-start justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <span className="flex-shrink-0 pt-px text-[13px] text-gray-500">{label}</span>
      <div className="flex min-w-0 items-start gap-1.5">
        {/* break-all rather than truncate: account numbers and IFSC codes are
            useless if the customer can only see half of them. */}
        <span className={`break-all text-right text-[14px] font-bold leading-snug text-gray-900 ${mono ? 'font-mono' : ''}`}>{value}</span>
        <button
          onClick={onCopy}
          className="flex-shrink-0 rounded p-1 transition hover:bg-gray-100"
        >
          {copied ? (
            <CheckCircle className="w-4 h-4 text-[#09B368]" />
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
    <div className="h-full rounded-xl border border-gray-100 bg-[#FCFDFC] p-5">
      <h3 className="mb-3.5 flex items-center gap-2 text-[15px] font-extrabold text-gray-900">
        <QrCode className="w-[18px] h-[18px] text-[#056B3E]" />
        Pay via UPI
      </h3>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="flex-shrink-0 rounded-xl border border-gray-100 bg-white p-2.5 shadow-sm">
          {/* Using img tag instead of next/image for external QR API */}
          <img
            src={qrCodeUrl}
            alt="UPI QR Code"
            width={152}
            height={152}
            className="rounded"
          />
        </div>
        <div className="min-w-0 flex-1 self-stretch">
          <p className="mb-2 text-[13px] text-gray-500">Scan the QR or use this UPI ID</p>
          {/* break-all, not truncate — a UPI ID the customer cannot read in
              full is worse than one that wraps onto two lines. */}
          <div className="flex items-start gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2.5">
            <span className="min-w-0 flex-1 break-all font-mono text-[14px] font-bold leading-snug text-gray-900">{upiId}</span>
            <button
              onClick={() => onCopy(upiId, 'upi')}
              className="mt-px flex-shrink-0 rounded p-1 transition hover:bg-gray-100"
            >
              {copied === 'upi' ? (
                <CheckCircle className="w-[18px] h-[18px] text-[#09B368]" />
              ) : (
                <Copy className="w-[18px] h-[18px] text-gray-400" />
              )}
            </button>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
            ₹{amount.toLocaleString()} to {accountHolderName}
          </p>
        </div>
      </div>
    </div>
  );
}
