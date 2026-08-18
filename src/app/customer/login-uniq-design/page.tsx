'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Mail, Lock, Phone, User, ArrowLeft, Loader2, MapPin, Check,
  CarFront, Truck, Package, MapPinned, BusFront, Bike,
} from 'lucide-react';

type AuthMode = 'login' | 'register' | 'verify-otp' | 'forgot-password' | 'reset-password';

const GOOGLE_CLIENT_ID = '365663447950-o996ep372bp2ejippsphe3ktjpen221e.apps.googleusercontent.com';

function pointOnCircleXY(angleDeg: number, radiusPercent: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 50 + radiusPercent * Math.sin(rad), y: 50 - radiusPercent * Math.cos(rad) };
}

// Matches the photo layout baked into login-vehicle-ring.png: car/truck up top,
// packers-movers/outstation on the right, bus/bike on the left-bottom.
const RING_LABELS = [
  { key: 'car', label: 'Car Rental', Icon: CarFront, mid: -30 },
  { key: 'truck', label: 'Truck Hire', Icon: Truck, mid: 30 },
  { key: 'movers', label: 'Packers & Movers', Icon: Package, mid: 90 },
  { key: 'outstation', label: 'Outstation', Icon: MapPinned, mid: 150 },
  { key: 'bus', label: 'Bus Charter', Icon: BusFront, mid: 210 },
  { key: 'bike', label: 'Bike Rentals', Icon: Bike, mid: 270 },
];

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

function CustomerLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Pre-filled when arriving from the contact-form success popup, so an
  // existing customer only has to type their password, and a new one only
  // has to set one — name/email/phone are already carried over.
  const [formData, setFormData] = useState({
    name: searchParams.get('name') || '',
    email: searchParams.get('email') || '',
    phone: searchParams.get('phone') || '',
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

  // Initialize Google Sign-In + render the button after script loads
  useEffect(() => {
    if (!googleScriptLoaded || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: false,
    });

    // Small delay so the container div is definitely in the DOM
    setTimeout(() => {
      const el = document.getElementById('google-signin-btn');
      if (el && window.google) {
        window.google.accounts.id.renderButton(el, {
          type: 'standard',
          size: 'large',
          theme: 'outline',
          text: mode === 'register' ? 'signup_with' : 'continue_with',
          shape: 'rectangular',
          width: Math.min(el.offsetWidth || 360, 400),
        });
      }
    }, 100);
  }, [googleScriptLoaded, mode]);

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

      // Travel-agent fallback: same credentials matched a travel_agents row.
      // The API has already set the NextAuth TA session cookie AND issued a
      // shadow-customer JWT so customer-side booking flows treat us as logged in.
      if (data.status === 'success' && data.userType === 'travel_agent') {
        if (data.token && data.customers) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('token', data.token);
          localStorage.setItem('customer', JSON.stringify(data.customers));
        }
        setSuccess('Welcome back! Redirecting to your dashboard...');
        setTimeout(() => {
          window.location.href = data.redirect || '/customer/dashboard';
        }, 800);
        return;
      }

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

  // Google's renderButton renders a real clickable button (popup flow, not One Tap).
  // We wrap it in a div that fills the full width of the form.
  const GoogleSignInButton = () => (
    <div className="w-full flex justify-center">
      {!googleScriptLoaded && (
        <div className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-gray-200 rounded-xl bg-white text-sm font-medium text-gray-400 shadow-sm cursor-not-allowed select-none">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading Google Sign-In...</span>
        </div>
      )}
      <div
        id="google-signin-btn"
        className={googleScriptLoaded ? 'block' : 'hidden'}
        style={{ width: '100%' }}
      />
    </div>
  );

  const goToRegisterStep2 = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError('Please fill in all fields to continue.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setRegisterStep(2);
  };

  const goToRegisterStep3 = () => {
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setError('');
    setRegisterStep(3);
  };

  const REGISTER_STEPS = [
    { n: 1, label: 'Account' },
    { n: 2, label: 'Security' },
    { n: 3, label: 'Address' },
  ] as const;

  const RegisterProgress = () => (
    <div className="flex items-center mb-5">
      {REGISTER_STEPS.map((step, idx) => (
        <div key={step.n} className={`flex items-center ${idx < REGISTER_STEPS.length - 1 ? 'flex-1' : ''}`}>
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                registerStep === step.n
                  ? 'bg-[#09B368] text-white'
                  : registerStep > step.n
                  ? 'bg-[#09B368]/15 text-[#09B368]'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {registerStep > step.n ? <Check className="h-3.5 w-3.5" /> : step.n}
            </div>
            <span className={`text-[10px] font-medium whitespace-nowrap ${registerStep >= step.n ? 'text-gray-700' : 'text-gray-400'}`}>
              {step.label}
            </span>
          </div>
          {idx < REGISTER_STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1.5 -mt-4 transition-colors ${registerStep > step.n ? 'bg-[#09B368]/40' : 'bg-gray-100'}`} />
          )}
        </div>
      ))}
    </div>
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
                  autoFocus={!!searchParams.get('email')}
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

            <div className="pt-1 p-3 bg-[#09B368]/5 border border-[#09B368]/15 rounded-xl text-center space-y-1">
              <p className="text-xs text-gray-600">
                Corporate account?{' '}
                <Link href="/customer/b2b-register" className="text-[#09B368] hover:text-[#078F53] font-semibold">Register as B2B →</Link>
              </p>
              <p className="text-[11px] text-gray-500">
                Travel agent? Use your agent email &amp; password — we&apos;ll send you to your dashboard.
              </p>
            </div>
          </form>
        );

      case 'register':
        return (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <RegisterProgress />

            {registerStep === 1 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required autoFocus
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

                <button type="button" onClick={goToRegisterStep2}
                  className="w-full bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm shadow-[#09B368]/30">
                  Continue
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100" /></div>
                  <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400">or sign up with</span></div>
                </div>

                <GoogleSignInButton />
              </>
            )}

            {registerStep === 2 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} required minLength={6}
                      autoFocus
                      className="w-full pl-10 pr-11 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#09B368]/25 focus:border-[#09B368] focus:outline-none text-sm bg-gray-50/50"
                      placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1.5">Use at least 6 characters. Mix in a number for a stronger password.</p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setError(''); setRegisterStep(1); }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                    Back
                  </button>
                  <button type="button" onClick={goToRegisterStep3}
                    className="flex-1 bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors flex items-center justify-center gap-2 text-sm shadow-sm shadow-[#09B368]/30">
                    Continue
                  </button>
                </div>
              </>
            )}

            {registerStep === 3 && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Address <span className="normal-case text-gray-400 font-normal">(optional)</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
                    <textarea name="address" value={formData.address} onChange={handleChange} rows={2} autoFocus
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

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setError(''); setRegisterStep(2); }}
                    className="px-4 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors text-sm">
                    Back
                  </button>
                  <button type="submit" disabled={isLoading}
                    className="flex-1 bg-[#09B368] text-white py-2.5 rounded-xl font-semibold hover:bg-[#078F53] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm shadow-[#09B368]/30">
                    {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />Creating account...</> : 'Create Account'}
                  </button>
                </div>

                <div className="pt-1 p-3 bg-[#09B368]/5 border border-[#09B368]/15 rounded-xl text-center">
                  <p className="text-xs text-gray-600">
                    Corporate account?{' '}
                    <Link href="/customer/b2b-register" className="text-[#09B368] hover:text-[#078F53] font-semibold">Register as B2B →</Link>
                  </p>
                </div>
              </>
            )}
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

  const arrivedWithEmail = !!searchParams.get('email');

  const getSubtitle = () => {
    switch (mode) {
      case 'login':
        return arrivedWithEmail
          ? 'We found your account — just enter your password to continue'
          : 'Sign in to manage your bookings and trips';
      case 'register':
        return arrivedWithEmail
          ? "We've filled in your details — just set a password to finish"
          : 'Join thousands of happy customers across India';
      case 'verify-otp': return 'Enter the 6-digit OTP sent to your email';
      case 'forgot-password': return "We'll send a reset code to your inbox";
      case 'reset-password': return 'Create a strong new password';
    }
  };

  const contentKey = mode === 'register' ? `register-${registerStep}` : mode;

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptLoaded(true)}
      />

      <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#04090c] py-10">

        {/* Background — full-bleed dark tech cityscape with a static glow-ring frame */}
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: "url('/images/sections/login-hero-bg.png')" }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/25 pointer-events-none z-0" />

        {/* Vehicle-photo ring — one flat image, spun smoothly and continuously. Sized big enough to
            bleed off-screen for scale, while the label pills sit on their own smaller, always-on-screen ring. */}
        <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none z-[1]">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(108vh,1300px)] h-[min(108vh,1300px)]">
            <motion.div
              className="absolute inset-0 rounded-full overflow-hidden ring-2 ring-emerald-400/40"
              style={{ boxShadow: '0 0 180px rgba(9,179,104,0.4)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
            >
              <img
                src="/images/sections/login-vehicle-ring.png"
                alt=""
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>

          {/* Fixed label pills — their own smaller ring, always fully on-screen */}
          <div className="relative w-[min(76vh,740px)] h-[min(76vh,740px)]">
            {RING_LABELS.map((seg) => {
              const { x, y } = pointOnCircleXY(seg.mid, 58);
              return (
                <div key={seg.key}
                  className="absolute flex items-center gap-1.5 bg-white/8 backdrop-blur-md border border-white/15 rounded-full px-3.5 py-2 shadow-lg"
                  style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}>
                  <seg.Icon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-white/85 text-[11px] font-medium whitespace-nowrap">{seg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 w-full max-w-[400px] mx-4"
        >
          {/* Gentle continuous float — nested so it doesn't fight the entrance animation above */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            {/* Rotating glow frame */}
            <motion.div
              className="absolute -inset-3 rounded-[1.75rem] blur-md opacity-70 pointer-events-none"
              style={{ background: 'conic-gradient(from 0deg, rgba(16,185,129,0.7), transparent 25%, transparent 50%, rgba(16,185,129,0.7) 75%, transparent 100%)' }}
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />
            {/* Soft pulsing halo */}
            <div className="absolute -inset-8 rounded-full bg-emerald-400/10 blur-3xl animate-pulse pointer-events-none" />

          {/* Card */}
          <motion.div layout className="relative bg-white/85 backdrop-blur-2xl border border-white/40 rounded-2xl shadow-2xl overflow-hidden" style={{boxShadow: '0 25px 70px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.5)'}}>

            {/* Tab switcher — only for login / register */}
            {(mode === 'login' || mode === 'register') && (
              <div className="flex border-b border-gray-100 relative">
                <button type="button"
                  onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
                    mode === 'login'
                      ? 'text-[#09B368] bg-[#09B368]/[0.03]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}>
                  Sign In
                  {mode === 'login' && (
                    <motion.div layoutId="authTabUnderline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#09B368]" />
                  )}
                </button>
                <button type="button"
                  onClick={() => { setMode('register'); setError(''); setSuccess(''); setRegisterStep(1); }}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors relative ${
                    mode === 'register'
                      ? 'text-[#09B368] bg-[#09B368]/[0.03]'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }`}>
                  Register
                  {mode === 'register' && (
                    <motion.div layoutId="authTabUnderline" className="absolute left-0 right-0 -bottom-px h-0.5 bg-[#09B368]" />
                  )}
                </button>
              </div>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -14 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
              >
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
              </motion.div>
            </AnimatePresence>

            {/* Card footer */}
            <div className="border-t border-gray-50 px-7 py-4 flex items-center justify-center">
              <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Back to Home
              </Link>
            </div>
          </motion.div>
          </motion.div>

          <p className="text-white/40 text-xs text-center mt-6">© 2025 TransRentals. All rights reserved.</p>
        </motion.div>
      </div>
    </>
  );
}

function LoginPageFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(140deg, #033D26 0%, #056040 30%, #078F53 65%, #09B368 100%)' }}>
      <Loader2 className="h-8 w-8 text-white animate-spin" />
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <CustomerLoginPageContent />
    </Suspense>
  );
}
