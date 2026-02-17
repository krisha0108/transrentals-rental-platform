'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function CustomerForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [email, setEmail] = useState('');

  // Step 2 — OTP (client-side only, sent with reset-password call)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Step 3
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP countdown
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { setCanResend(true); clearInterval(id); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, timer]);

  // Password strength
  const getStrength = (pwd: string) => {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/\d/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  };
  const strengthLevel = getStrength(password);
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][strengthLevel] || '';
  const strengthColor = strengthLevel <= 1 ? 'bg-red-500' : strengthLevel === 2 ? 'bg-orange-500' : strengthLevel === 3 ? 'bg-yellow-500' : strengthLevel === 4 ? 'bg-blue-500' : 'bg-green-500';
  const strengthTextColor = strengthLevel <= 1 ? 'text-red-600' : strengthLevel === 2 ? 'text-orange-600' : strengthLevel === 3 ? 'text-yellow-600' : strengthLevel === 4 ? 'text-blue-600' : 'text-green-600';

  const maskEmail = (e: string) => {
    const [user = '', domain = ''] = e.split('@');
    if (!user || !domain) return e;
    const left = user.slice(0, 2);
    const right = user.length > 2 ? user.slice(-1) : '';
    return `${left}${'*'.repeat(Math.max(1, user.length - 3))}${right}@${domain}`;
  };

  // Step 1 — Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email: email.trim() }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStep(2);
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email: email.trim() }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      } else {
        setError(data.message || 'Failed to resend OTP.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // OTP box handlers
  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newOtp = [...otp];
    pasted.split('').forEach((ch, i) => { if (i < 6) newOtp[i] = ch; });
    setOtp(newOtp);
    otpRefs[Math.min(pasted.length, 5)].current?.focus();
  };

  // Step 2 — Verify OTP (client-side only)
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otp.join('').length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setStep(3);
  };

  // Step 3 — Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          email: email.trim(),
          otp: otp.join(''),
          password,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setStep(4);
      } else {
        // OTP was invalid — go back to OTP step
        setError(data.message || 'Reset failed. Please try again.');
        if (data.message?.toLowerCase().includes('otp') || data.message?.toLowerCase().includes('expired')) {
          setStep(2);
          setOtp(['', '', '', '', '', '']);
          setTimeout(() => otpRefs[0].current?.focus(), 100);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/Logo-favicon.png"
              alt="TR"
              width={48}
              height={48}
              className="w-10 h-10 border border-gray-200 rounded-md"
            />
            <div className="flex flex-col items-start">
              <Image
                src="/assets/logo-trans.png"
                alt="TransRentals"
                width={140}
                height={28}
                className="h-5 md:h-7 w-auto"
                priority
              />
              <span className="text-xs text-gray-500 hidden md:block">Vehicle Rental Marketplace</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center
              bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-200">
              {step === 4 ? <CheckCircle2 className="w-7 h-7 text-white" /> :
               step === 3 ? <Lock className="w-7 h-7 text-white" /> :
               step === 2 ? <ShieldCheck className="w-7 h-7 text-white" /> :
               <KeyRound className="w-7 h-7 text-white" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {step === 1 && 'Forgot Password'}
              {step === 2 && 'Verify OTP'}
              {step === 3 && 'New Password'}
              {step === 4 && 'All Done!'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {step === 1 && "Enter your email and we'll send you a verification code"}
              {step === 2 && `Code sent to ${maskEmail(email)}`}
              {step === 3 && 'Create a strong new password for your account'}
              {step === 4 && 'Your password has been reset successfully'}
            </p>
          </div>

          {/* Step indicator */}
          {step !== 4 && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all
                    ${step === s ? 'bg-green-600 text-white shadow shadow-green-200' :
                      step > s ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {step > s ? '✓' : s}
                  </div>
                  {s < 3 && (
                    <div className={`flex-1 h-1 rounded-full transition-all ${step > s ? 'bg-green-400' : 'bg-gray-100'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </button>

              <div className="text-center">
                <Link href="/customer/login" className="text-sm text-green-600 hover:text-green-700 flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Back to Login
                </Link>
              </div>
            </form>
          )}

          {/* ── STEP 2: OTP boxes ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                  Enter 6-digit verification code
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={otpRefs[i]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, i)}
                      onKeyDown={(e) => handleOtpKeyDown(e, i)}
                      className={`w-11 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-green-500 transition-all
                        ${digit ? 'border-green-400 bg-green-50 text-green-700' : 'border-gray-300 bg-white text-gray-800'}`}
                      style={{ height: '52px' }}
                    />
                  ))}
                </div>
              </div>

              {/* Resend timer */}
              <div className="text-center text-sm text-gray-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" /> Resend OTP
                  </button>
                ) : (
                  <span>Resend code in <span className="font-semibold text-green-600">{timer}s</span></span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length < 6}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Verify OTP
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); }}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-4 w-4" /> Change email
                </button>
              </div>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* Strength bar */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strengthLevel ? strengthColor : 'bg-gray-100'}`} />
                      ))}
                    </div>
                    <p className={`text-xs font-medium ${strengthTextColor}`}>{strengthLabel}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Confirm new password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none
                      ${confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="text-center space-y-5">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <p className="text-gray-600 text-sm">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push('/customer/login')}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
