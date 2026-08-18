'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
    <div className="min-h-screen w-full relative overflow-hidden flex items-center justify-center py-6 px-4 lg:px-6">
      {/* Single full-bleed background image, shared across the whole page */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/sections/forgot-password-bg2.png')" }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Logo — always top-left, independent of vertical centering below */}
      <div className="hidden lg:flex absolute top-8 left-6 xl:left-10 z-20 items-center gap-2.5">
        <Image src="/assets/Logo-favicon.png" alt="TransRentals" width={38} height={38} className="rounded-xl shrink-0" />
        <Image src="/assets/logo-tr-1.png" alt="TransRentals" width={160} height={30} className="object-contain h-6 w-auto" />
      </div>

      <div className="relative z-10 w-full max-w-[1600px] flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-0">

        {/* ── Left: brand content — sits directly on the shared bg image ── */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="hidden lg:flex flex-col flex-1 py-6 pr-10 xl:pr-16 text-left lg:-mt-64 lg:-ml-10"
        >
          <p className="mt-10 text-[#09B368] font-bold text-base">
            {step === 4 ? "You're all set!" : "We've got your back!"}
          </p>
          <h1 className="mt-2 text-6xl xl:text-7xl font-black text-gray-900 leading-[1.08]">
            {step === 4 ? <>Password<br />Updated!</> : <>Reset &amp;<br />Reconnect</>}
          </h1>
          <p className="mt-5 text-gray-600 text-base max-w-md leading-relaxed">
            {step === 1 && "No worries! Enter your registered email and we'll send you a verification code to reset your password securely."}
            {step === 2 && `OTP sent to ${maskEmail(email)}. Check your inbox and enter the 6-digit code.`}
            {step === 3 && 'Almost there! Create a strong new password to keep your account secure.'}
            {step === 4 && 'Your account is secure again. You can now sign in with your new password.'}
          </p>

        </motion.div>

        {/* Mobile-only compact header (left branding is desktop-only) */}
        <div className="flex lg:hidden flex-col items-start text-left pt-2">
          <div className="flex items-center gap-2">
            <Image src="/assets/Logo-favicon.png" alt="TransRentals" width={34} height={34} className="rounded-lg shrink-0" />
            <Image src="/assets/logo-tr-1.png" alt="TransRentals" width={150} height={28} className="object-contain h-5 w-auto" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900 leading-tight">
            Reset &amp; <span className="text-[#09B368]">Reconnect</span>
          </h1>
        </div>

        {/* ── Right: form card, floating on the same bg image ── */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="relative flex-1 lg:max-w-[460px] py-10"
        >
          {/* Soft ambient glow breathing behind the card */}
          <motion.div
            className="absolute -inset-3 rounded-[2.5rem] bg-[#09B368]/15 blur-3xl pointer-events-none"
            animate={{ opacity: [0.4, 0.75, 0.4] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl overflow-hidden border border-white/60"
            style={{ boxShadow: '0 30px 70px rgba(3,61,38,0.18), inset 0 1px 0 rgba(255,255,255,0.6)' }}>

            <div className="px-8 pt-9 pb-2">

              {/* Icon badge */}
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-[#09B368]/10" />
                <div className="relative w-full h-full rounded-full flex items-center justify-center">
                  {step === 4 ? <CheckCircle2 className="w-7 h-7 text-[#09B368]" /> :
                   step === 3 ? <Lock className="w-7 h-7 text-[#09B368]" /> :
                   step === 2 ? <ShieldCheck className="w-7 h-7 text-[#09B368]" /> :
                   <Mail className="w-7 h-7 text-[#09B368]" />}
                </div>
                {step === 1 && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#09B368] flex items-center justify-center ring-4 ring-white">
                    <Lock className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 && <>Forgot <span className="text-[#09B368]">Password?</span></>}
                  {step === 2 && <>Verify <span className="text-[#09B368]">OTP</span></>}
                  {step === 3 && <>New <span className="text-[#09B368]">Password</span></>}
                  {step === 4 && <>All <span className="text-[#09B368]">Done!</span></>}
                </h2>
                <p className="text-gray-500 text-sm mt-1.5">
                  {step === 1 && "Enter your email and we'll send you a verification code."}
                  {step === 2 && `Code sent to ${maskEmail(email)}`}
                  {step === 3 && 'Create a strong new password for your account'}
                  {step === 4 && 'Your password has been reset successfully'}
                </p>
              </div>

              {/* Step indicator — shown with the form, not on the brand panel */}
              {step !== 4 && (
                <div className="flex items-center gap-2 mb-6">
                  {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                      <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all
                        ${step === s ? 'bg-[#09B368] text-white' :
                          step > s ? 'bg-[#09B368]/80 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        {step > s ? '✓' : s}
                      </div>
                      {s < 3 && (
                        <div className={`flex-1 h-0.5 rounded-full transition-all ${step > s ? 'bg-[#09B368]/50' : 'bg-gray-100'}`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}

              {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-5 text-sm">
              {error}
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/20 focus:border-[#09B368] focus:outline-none transition-colors"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#09B368] text-white py-3 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </button>

              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                <div className="relative flex justify-center text-xs"><span className="px-3 bg-white/90 text-gray-400 font-medium">OR</span></div>
              </div>

              <div className="text-center">
                <Link href="/customer/login" className="text-sm text-[#09B368] hover:text-[#078F53] font-medium flex items-center justify-center gap-1">
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
                      className={`w-11 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all
                        ${digit ? 'border-[#09B368] bg-[#09B368]/5 text-[#09B368]' : 'border-gray-200 bg-white text-gray-800 focus:border-[#09B368]'}`}
                      style={{ height: '52px' }}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-sm text-gray-500">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-[#09B368] hover:text-[#078F53] font-medium flex items-center gap-1 mx-auto"
                  >
                    <RefreshCw className="h-4 w-4" /> Resend OTP
                  </button>
                ) : (
                  <span>Resend code in <span className="font-semibold text-[#09B368]">{timer}s</span></span>
                )}
              </div>

              <button
                type="submit"
                disabled={otp.join('').length < 6}
                className="w-full bg-[#09B368] text-white py-3 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Verify OTP
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); }}
                  className="text-sm text-[#09B368] hover:text-[#078F53] flex items-center justify-center gap-1 mx-auto"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/20 focus:border-[#09B368] focus:outline-none transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    placeholder="Confirm new password"
                    className={`w-full pl-10 pr-12 py-3 border rounded-xl focus:ring-2 focus:ring-[#09B368]/20 focus:border-[#09B368] focus:outline-none transition-colors
                      ${confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-200'}`}
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
                className="w-full bg-[#09B368] text-white py-3 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </form>
          )}

          {/* ── STEP 4: Success ── */}
          {step === 4 && (
            <div className="text-center space-y-5 pb-2">
              <div className="w-20 h-20 bg-[#09B368]/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-[#09B368]" />
              </div>
              <p className="text-gray-600 text-sm">
                Your password has been updated. You can now sign in with your new password.
              </p>
              <button
                onClick={() => router.push('/customer/login')}
                className="w-full bg-[#09B368] text-white py-3 rounded-xl font-semibold hover:bg-[#078F53] transition-colors flex items-center justify-center gap-2"
              >
                Go to Login
              </button>
            </div>
          )}
            </div>

            {/* Trust footer */}
            <div className="border-t border-gray-100 px-8 py-4 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#09B368]" />
              <span className="text-xs font-medium text-gray-500">Your data is safe with us</span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-4">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
              <ArrowLeft className="h-3 w-3" /> Back to Home
            </Link>
            <span className="text-gray-300 text-xs">•</span>
            <p className="text-gray-400 text-xs">© 2025 TransRentals. All rights reserved.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
