'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function TravelAgentForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (step !== 2) return;
    setTimer(60);
    setCanResend(false);
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          setCanResend(true);
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step]);

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/travel-agent/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        setError(data.message || 'Failed to send OTP');
      } else {
        setStep(2);
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/travel-agent/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        setError(data.message || 'Invalid OTP');
      } else {
        setStep(3);
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/travel-agent/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email, otp, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.status) {
        setError(data.message || 'Failed to reset password');
      } else {
        setStep(4);
        setTimeout(() => router.push('/travel-agent/login'), 2500);
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/travel-agent/login" className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-7 pt-7 pb-5 border-b border-gray-100 text-center">
              <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                {step === 1 && <Mail className="w-6 h-6 text-emerald-600" />}
                {step === 2 && <KeyRound className="w-6 h-6 text-emerald-600" />}
                {step === 3 && <Lock className="w-6 h-6 text-emerald-600" />}
                {step === 4 && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </div>
              <h1 className="text-xl font-bold text-gray-900">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Verify OTP'}
                {step === 3 && 'Set New Password'}
                {step === 4 && 'Password Reset!'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {step === 1 && 'Enter your registered email and we’ll send an OTP'}
                {step === 2 && `We sent a 6-digit OTP to ${email}`}
                {step === 3 && 'Choose a strong new password'}
                {step === 4 && 'Redirecting you to login…'}
              </p>
            </div>

            <div className="px-7 py-6">
              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  {error}
                </div>
              )}

              {step === 1 && (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@agency.com"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div className="relative">
                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 tracking-[0.5em] text-center font-bold"
                    />
                  </div>
                  <div className="text-center text-xs text-gray-500">
                    {canResend ? (
                      <button
                        type="button"
                        onClick={() => sendOtp()}
                        className="text-emerald-600 font-semibold hover:underline"
                      >
                        Resend OTP
                      </button>
                    ) : (
                      <span>Resend in {timer}s</span>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Verify <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={resetPassword} className="space-y-4">
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Reset Password <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}

              {step === 4 && (
                <div className="text-center py-6">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
