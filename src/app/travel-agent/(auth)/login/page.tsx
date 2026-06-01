'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  CheckCircle,
  Plane,
  Star,
  Zap,
  Users,
} from 'lucide-react';

const PERKS = [
  { icon: Plane, text: 'List unlimited tours & properties', color: 'text-emerald-500' },
  { icon: Users, text: 'Capture leads with shareable links', color: 'text-blue-500' },
  { icon: Zap, text: 'Convert leads → bookings in one click', color: 'text-amber-500' },
  { icon: Star, text: 'Manage everything from one dashboard', color: 'text-purple-500' },
];

export default function TravelAgentLoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('travel-agent-credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });
      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin'
            ? 'Incorrect email or password. Please try again.'
            : result.error,
        );
      } else if (result?.ok) {
        router.push('/travel-agent/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 flex flex-col">
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-sm font-semibold text-gray-700">Signing you in…</p>
            <p className="text-xs text-gray-400">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* ── Top nav ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/assets/Logo-favicon.png" alt="TransRentals" className="h-8 w-8" />
            <img src="/assets/logo-trans.png" alt="TransRentals" className="h-7 hidden sm:block" />
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400 hidden sm:inline">New travel agent?</span>
            <Link
              href="/travel-agent/register"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-full transition-colors"
            >
              Register Free
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 mb-4">
                <CheckCircle className="w-3.5 h-3.5" />
                Built for Travel Agencies
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mt-2">
                Welcome back to your<br />
                <span className="text-emerald-600">Travel Agent Dashboard</span>
              </h2>
              <p className="text-gray-500 mt-3 text-sm leading-relaxed">
                Manage your leads, tours, properties and bookings — all in one place.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {PERKS.map(({ icon: Icon, text, color }) => (
                <div
                  key={text}
                  className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                    <Icon className={`w-4 h-4 ${color}`} />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-7 pt-7 pb-5 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
                <p className="text-sm text-gray-500 mt-1">Enter your registered email and password</p>
              </div>

              <div className="px-7 py-6">
                {error && (
                  <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@agency.com"
                        autoComplete="email"
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-semibold text-gray-700">Password</label>
                      <Link
                        href="/travel-agent/forgot-password"
                        className="text-xs text-emerald-600 hover:underline font-medium"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                        className="w-full pl-10 pr-11 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-600">Keep me signed in</span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-emerald-100 mt-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Signing in…
                      </>
                    ) : (
                      <>
                        Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-5">
                  Don&apos;t have an account?{' '}
                  <Link
                    href="/travel-agent/register"
                    className="text-emerald-600 font-semibold hover:underline"
                  >
                    Register as a travel agent — it&apos;s free
                  </Link>
                </p>
              </div>

              <div className="px-7 pb-6">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-emerald-800 mb-2.5 uppercase tracking-wide">
                    New here? Here&apos;s what&apos;s next
                  </p>
                  <ol className="space-y-1.5">
                    {[
                      'Complete your agency profile',
                      'Upload KYC documents',
                      'Add your tours, properties & leads',
                      'Get verified and go fully live',
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-emerald-700">
                        <span className="w-4 h-4 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-5 mt-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3" /> SSL Secured
              </span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Data Protected
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-400" /> Free to join
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
