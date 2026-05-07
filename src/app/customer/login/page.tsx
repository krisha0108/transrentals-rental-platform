'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { Eye, EyeOff, Mail, Lock, Phone, User, ArrowLeft, Loader2, MapPin } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'verify-otp' | 'forgot-password' | 'reset-password';

const GOOGLE_CLIENT_ID = '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
        };
      };
    };
  }
}

export default function CustomerLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    otp: '',
  });

  const API_URL = '/api/customer/auth';

  const handleGoogleResponse = async (response: any) => {
    setIsGoogleLoading(true);
    setError('');
    try {
      const apiResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'google-login', idToken: response.credential }),
      });
      const data = await apiResponse.json();
      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => router.push('/customer/dashboard'), 1000);
      } else {
        setError(data.message || 'Google login failed. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch {
      setError('Network error during Google login. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  // Initialize Google Sign-In (no renderButton — we use a custom button + prompt())
  useEffect(() => {
    if (googleScriptLoaded && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
    }
  }, [googleScriptLoaded]);

  const handleGoogleButtonClick = () => {
    if (!window.google) return;
    setIsGoogleLoading(true);
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setIsGoogleLoading(false);
        setError('Google sign-in could not open. Please ensure you are signed into Google in your browser, or use email & password.');
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'login', email: formData.email, password: formData.password }),
      });
      const data = await response.json();
      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setSuccess('Login successful! Redirecting...');
        setTimeout(() => router.push('/customer/dashboard'), 1000);
      } else {
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
        }),
      });
      const data = await response.json();
      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => router.push('/customer/dashboard'), 1000);
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'verify-otp', email: formData.email, otp: formData.otp, name: formData.name }),
      });
      const data = await response.json();
      if (data.status === 'success' && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('customer', JSON.stringify(data.customers));
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => router.push('/customer/dashboard'), 1000);
      } else {
        setError(data.message || 'Invalid OTP. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email: formData.email }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess('OTP sent to your email!');
        setMode('reset-password');
      } else {
        setError(data.message || 'Email not found.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', email: formData.email, otp: formData.otp, password: formData.password }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setSuccess('Password reset successful! Please login.');
        setMode('login');
        setFormData({ ...formData, otp: '', password: '' });
      } else {
        setError(data.message || 'Failed to reset password.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable Google button — custom styled, no SDK renderButton
  const GoogleSignInButton = () => (
    <button
      type="button"
      onClick={handleGoogleButtonClick}
      disabled={isGoogleLoading || !googleScriptLoaded}
      className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors text-sm font-medium text-gray-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isGoogleLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
      ) : (
        <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 flex-shrink-0" style={{width: '18px', height: '18px'}}>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      <span>{isGoogleLoading ? 'Connecting...' : mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}</span>
    </button>
  );

  const renderForm = () => {
    switch (mode) {
      case 'login':
        return (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
                <Link href="/customer/forgot-password" className="text-xs text-[#09B368] hover:text-[#078F53] font-medium">Forgot?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm shadow-[#09B368]/30">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Signing in...</> : 'Sign In'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or continue with</span></div>
            </div>

            <GoogleSignInButton />

            <div className="pt-1 p-3 bg-[#09B368]/5 border border-[#09B368]/15 rounded-xl text-center">
              <p className="text-xs text-gray-600">
                Corporate account?{' '}
                <Link href="/customer/b2b-register" className="text-[#09B368] hover:text-[#078F53] font-semibold">Register as B2B →</Link>
              </p>
            </div>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="text" name="name" value={formData.name} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="Your full name" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength={6}
                  className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50 resize-none"
                  placeholder="House / Flat, Street, Landmark" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">City</label>
                <input type="text" name="city" value={formData.city} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="City" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">State</label>
                <input type="text" name="state" value={formData.state} onChange={handleChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="State" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Pincode</label>
                <input type="text" name="pincode" value={formData.pincode} onChange={handleChange} maxLength={6} pattern="[0-9]{6}"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                  placeholder="123456" />
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm shadow-[#09B368]/30">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
              <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or sign up with</span></div>
            </div>

            <GoogleSignInButton />

            <div className="pt-1 p-3 bg-[#09B368]/5 border border-[#09B368]/15 rounded-xl text-center">
              <p className="text-xs text-gray-600">
                Corporate account?{' '}
                <Link href="/customer/b2b-register" className="text-[#09B368] hover:text-[#078F53] font-semibold">Register as B2B →</Link>
              </p>
            </div>
          </form>
        );

      case 'verify-otp':
        return (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <p className="text-sm text-gray-500 text-center">OTP sent to <span className="font-semibold text-gray-800">{formData.email}</span></p>
            <input type="text" name="otp" value={formData.otp} onChange={handleChange} required maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-center text-2xl tracking-[0.5em] bg-gray-50/50"
              placeholder="——————" />
            <button type="submit" disabled={isLoading}
              className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</> : 'Verify OTP'}
            </button>
          </form>
        );

      case 'forgot-password':
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <p className="text-sm text-gray-500">Enter your email address and we'll send you an OTP to reset your password.</p>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                placeholder="your@email.com" />
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Sending OTP...</> : 'Send Reset OTP'}
            </button>
          </form>
        );

      case 'reset-password':
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-gray-500">Enter the OTP sent to <span className="font-semibold text-gray-800">{formData.email}</span></p>
            <input type="text" name="otp" value={formData.otp} onChange={handleChange} required maxLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-center text-2xl tracking-[0.5em] bg-gray-50/50"
              placeholder="——————" />
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength={6}
                className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                placeholder="New password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Resetting...</> : 'Reset Password'}
            </button>
          </form>
        );
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'login': return 'Welcome back';
      case 'register': return 'Create your account';
      case 'verify-otp': return 'Verify your email';
      case 'forgot-password': return 'Reset password';
      case 'reset-password': return 'Set new password';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'login': return 'Sign in to manage your bookings and trips';
      case 'register': return 'Join thousands of happy customers across India';
      case 'verify-otp': return 'Enter the 6-digit OTP sent to your email';
      case 'forgot-password': return "We'll send a reset code to your inbox";
      case 'reset-password': return 'Create a strong new password';
    }
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptLoaded(true)}
      />

      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{background: 'linear-gradient(140deg, #033D26 0%, #056040 30%, #078F53 65%, #09B368 100%)'}}>

        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)', transform: 'translate(-40%, -40%)'}} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%)', transform: 'translate(35%, 35%)'}} />
        <div className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full pointer-events-none opacity-30"
          style={{background: 'radial-gradient(ellipse, rgba(9,179,104,0.4) 0%, transparent 70%)', transform: 'translate(-50%, -50%)'}} />
        <div className="absolute inset-0 pointer-events-none"
          style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '56px 56px'}} />

          {/* Floating service pills — background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[
            { label: 'Bike Rentals', top: '12%', left: '4%', rotate: '-6deg' },
            { label: 'Bus Charter', top: '22%', right: '4%', rotate: '5deg' },
            { label: 'Car Rental', top: '48%', left: '3%', rotate: '4deg' },
            { label: 'Luxury Cars', bottom: '20%', right: '5%', rotate: '-4deg' },
            { label: 'Packers & Movers', bottom: '6%', left: '4%', rotate: '-3deg' },
            { label: 'Truck Hire', top: '42%', right: '3%', rotate: '-7deg' },
          ].map((pill) => (
            <div key={pill.label}
              style={{ top: pill.top, left: pill.left, right: pill.right, bottom: pill.bottom, transform: `rotate(${pill.rotate})` }}
              className="absolute flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3.5 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
              <span className="text-white/75 text-xs font-medium whitespace-nowrap">{pill.label}</span>
            </div>
          ))}
        </div>

        <div className="w-full max-w-[420px] relative z-10">

          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-7">
            <div className="w-11 h-11 bg-white/20 rounded-2xl overflow-hidden flex items-center justify-center border border-white/25 backdrop-blur-sm shadow-lg">
              <Image src="/assets/Logo-favicon.png" alt="TR" width={34} height={34} className="object-contain" />
            </div>
            <span className="text-[1.6rem] font-bold text-white tracking-tight leading-none">
              Trans<span className="text-white/60">Rentals</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden" style={{boxShadow: '0 25px 60px rgba(0,0,0,0.25)'}}>

            {/* Tab switcher — only for login / register */}
            {(mode === 'login' || mode === 'register') && (
              <div className="flex border-b border-gray-100">
                <button type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    mode === 'login'
                      ? 'border-[#09B368] text-[#09B368] bg-[#09B368]/[0.03]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}>
                  Sign In
                </button>
                <button type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                    mode === 'register'
                      ? 'border-[#09B368] text-[#09B368] bg-[#09B368]/[0.03]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}>
                  Register
                </button>
              </div>
            )}

            {/* Multi-step flow: back + title */}
            {!['login', 'register'].includes(mode) && (
              <div className="px-7 pt-6">
                <button type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors mb-5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Sign In
                </button>
                <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
                <p className="text-sm text-gray-500 mt-1">{getSubtitle()}</p>
              </div>
            )}

            {/* Form body */}
            <div className="px-7 pt-5 pb-6">
              {/* Subtitle for login / register */}
              {(mode === 'login' || mode === 'register') && (
                <p className="text-sm text-gray-500 mb-5">{getSubtitle()}</p>
              )}

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm leading-snug">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="mb-4 p-3 bg-[#09B368]/8 border border-[#09B368]/20 rounded-xl text-[#09B368] text-sm font-medium">
                  {success}
                </div>
              )}

              {renderForm()}
            </div>

            {/* Card footer */}
            <div className="border-t border-gray-50 px-7 py-4 flex items-center justify-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to Home
              </Link>
            </div>
          </div>

          <p className="text-white/30 text-xs text-center mt-6">© 2025 TransRentals. All rights reserved.</p>
        </div>
      </div>
    </>
  );
}
