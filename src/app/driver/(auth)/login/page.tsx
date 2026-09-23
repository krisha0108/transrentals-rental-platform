'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle,
  Headphones, ShieldCheck, BellRing, Wallet, Navigation,
} from 'lucide-react';
import DriverAuthStage from '../_components/DriverAuthStage';
import { AuthCard, CardHeading, PlainField, PrimaryButton } from '../_components/DriverAuthUI';

function DriverAvatar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.6 20.2c.8-3.7 3.8-5.8 7.4-5.8s6.6 2.1 7.4 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.6 6.4c1.3-1.9 3.2-2.9 5.4-2.9s4.1 1 5.4 2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function DriverLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/driver/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        // Name the actual problem. "Login failed" told a driver with no signal
        // exactly as much as it told one who had mistyped their password.
        throw new Error(
          data?.error ||
            (response.status === 401
              ? 'That email or password is not right. Please check and try again.'
              : response.status >= 500
                ? 'The server had a problem. Please try again in a moment.'
                : 'Login failed. Please try again.'),
        );
      }

      if (data.token) localStorage.setItem('driver-token', data.token);
      if (data.driver) localStorage.setItem('driver', JSON.stringify(data.driver));

      router.push('/driver/dashboard');
    } catch (err: any) {
      setError(
        err instanceof TypeError
          ? 'No internet connection. Check your network and try again.'
          : err?.message || 'Login failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DriverAuthStage
      titleTop="Welcome Back,"
      titleMain="Driver"
      blurb={
        <>
          Your journey matters. Sign in to pick up <strong>new trips</strong>, follow your{' '}
          <strong>earnings</strong> day by day, and keep moving with TransRentals.
        </>
      }
      features={[
        { icon: <BellRing className="h-[22px] w-[22px]" />, title: 'Trip Alerts', body: 'New bookings the moment they land' },
        { icon: <Wallet className="h-[22px] w-[22px]" />, title: 'Earnings', body: 'Every trip and payout, tracked' },
        { icon: <Navigation className="h-[22px] w-[22px]" />, title: 'Navigation', body: 'Pickup to drop, the shorter way' },
        { icon: <Headphones className="h-[22px] w-[22px]" />, title: '24/7 Support', body: 'A real person, any hour' },
      ]}
      tagline={['Drive', 'Earn', 'Grow']}
    >
      <AuthCard>
        <CardHeading
          stacked
          icon={<DriverAvatar className="h-7 w-7" />}
          title="Driver Login"
          subtitle="Sign in to your TransRentals driver account"
        />

        {error && (
          <div role="alert" className="da-alert mb-5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <PlainField
            id="identifier"
            icon={<User className="h-[18px] w-[18px]" />}
            type="text"
            value={identifier}
            onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
            placeholder="Email or Driver ID"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="next"
            required
          />

          <PlainField
            id="password"
            icon={<Lock className="h-[18px] w-[18px]" />}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            placeholder="Password"
            autoComplete="current-password"
            enterKeyHint="go"
            required
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="da-eye"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            }
          />

          <div className="flex justify-end">
            <Link
              href="/driver/forgot-password"
              className="text-[13.5px] font-semibold text-[#15803D] transition hover:text-[#0d5c2c]"
            >
              Forgot Password?
            </Link>
          </div>

          <PrimaryButton type="submit" loading={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
                Signing in…
              </>
            ) : (
              <>
                Login
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </PrimaryButton>
        </form>

        <div className="my-7 flex items-center gap-4">
          <span className="h-px flex-1 bg-[#E3E8F4]" />
          <span className="text-[12px] font-semibold text-[#98A2BA]">OR</span>
          <span className="h-px flex-1 bg-[#E3E8F4]" />
        </div>

        <Link href="/driver/register" className="da-soft">
          New to TransRentals?
          <strong>Register as Driver</strong>
          <ArrowRight className="da-soft-arrow h-4 w-4 text-[#15803D]" />
        </Link>

        <div className="da-strip mt-4">
          <span>
            <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
            Secure Login
          </span>
          <span>
            <Headphones className="h-[18px] w-[18px] shrink-0" />
            24/7 Driver Support
          </span>
        </div>
      </AuthCard>
    </DriverAuthStage>
  );
}
