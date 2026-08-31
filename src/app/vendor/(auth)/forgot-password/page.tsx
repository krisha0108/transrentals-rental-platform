'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function VendorForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Step 1
  const [email, setEmail] = useState('');

  // Step 2
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

  // OTP countdown timer
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
  const strengthLabel = strengthLevel <= 1 ? 'Very Weak' : strengthLevel === 2 ? 'Weak' : strengthLevel === 3 ? 'Fair' : strengthLevel === 4 ? 'Strong' : 'Very Strong';
  const strengthColor = strengthLevel <= 1 ? 'bg-red-500' : strengthLevel === 2 ? 'bg-orange-500' : strengthLevel === 3 ? 'bg-yellow-500' : strengthLevel === 4 ? 'bg-blue-500' : 'bg-green-500';
  const strengthTextColor = strengthLevel <= 1 ? 'text-red-600' : strengthLevel === 2 ? 'text-orange-600' : strengthLevel === 3 ? 'text-yellow-600' : strengthLevel === 4 ? 'text-blue-600' : 'text-green-600';

  // mask email for display
  const maskEmail = (e: string) => {
    const [user = '', domain = ''] = e.split('@');
    if (!user || !domain) return e;
    const left = user.slice(0, 2);
    const right = user.length > 2 ? user.slice(-1) : '';
    return `${left}${'*'.repeat(Math.max(1, user.length - 3))}${right}@${domain}`;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email: email.trim() }),
      });
      const data = await res.json();
      if (data.status) {
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

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send-otp', email: email.trim() }),
      });
      const data = await res.json();
      if (data.status) {
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

  const handleOtpChange = (value: string, index: number) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');
    if (digit && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
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
    const focusIdx = Math.min(pasted.length, 5);
    otpRefs[focusIdx].current?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const otpVal = otp.join('');
    if (otpVal.length < 6) { setError('Please enter the complete 6-digit OTP.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/vendor/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email: email.trim(), otp: otpVal }),
      });
      const data = await res.json();
      if (data.status) {
        setStep(3);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
        if (data.attemptsRemaining !== undefined) {
          setError(`${data.message} (${data.attemptsRemaining} attempt${data.attemptsRemaining !== 1 ? 's' : ''} remaining)`);
        }
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!password) { setError('Please enter a new password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/vendor/forgot-password', {
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
      if (data.status) {
        setStep(4);
        setSuccessMsg(data.message || 'Password reset successfully!');
      } else {
        setError(data.message || 'Failed to reset password. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            {step === 4 ? (
              <CheckCircle2 className="w-8 h-8 text-white" />
            ) : step === 3 ? (
              <Lock className="w-8 h-8 text-white" />
            ) : step === 2 ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <KeyRound className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'New Password'}
            {step === 4 && 'Password Reset!'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {step === 1 && "Enter your email and we'll send you a verification code"}
            {step === 2 && `Code sent to ${maskEmail(email)}`}
            {step === 3 && 'Create a strong new password for your account'}
            {step === 4 && successMsg}
          </p>
        </div>

        {/* Step indicator */}
        {step !== 4 && (
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all
                  ${step === s ? 'bg-blue-600 text-white shadow-md shadow-blue-200' :
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
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
            {error}
          </div>
        )}

        {/* ── STEP 1: Email ── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Sending OTP...</>
              ) : (
                <>Send OTP <ArrowRight className="w-4 h-4" /></>
              )}
            </button>

            <div className="text-center">
              <Link href="/vendor/login" className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </Link>
            </div>
          </form>
        )}

        {/* ── STEP 2: OTP ── */}
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
                    className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-xl focus:outline-none focus:border-blue-500 transition-all
                      ${digit ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-800'}`}
                    style={{ height: '52px' }}
                  />
                ))}
              </div>
            </div>

            {/* Timer / Resend */}
            <div className="text-center text-sm text-gray-500">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading}
                  className="text-blue-600 hover:underline font-medium flex items-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-4 h-4" /> Resend OTP
                </button>
              ) : (
                <span>Resend code in <span className="font-semibold text-blue-600">{timer}s</span></span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
              ) : (
                <>Verify OTP <ShieldCheck className="w-4 h-4" /></>
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); }}
                className="text-sm text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Change email
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: New Password ── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Strength bar */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all ${i <= strengthLevel ? strengthColor : 'bg-gray-100'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strengthTextColor}`}>{strengthLabel}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Confirm new password"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${confirmPassword && password !== confirmPassword ? 'border-red-300 focus:ring-red-400' : 'border-gray-200'}`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</>
              ) : (
                <>Reset Password <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>
        )}

        {/* ── STEP 4: Success ── */}
        {step === 4 && (
          <div className="text-center space-y-5">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <p className="text-gray-600 text-sm">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
            </div>
            <button
              onClick={() => router.push('/vendor/login')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
            >
              Go to Login <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        {step !== 4 && (
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Remembered your password?{' '}
              <Link href="/vendor/login" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
