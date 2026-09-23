'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  User, Smartphone, Mail, IdCard, Lock, Eye, EyeOff, Loader2, ArrowRight,
  AlertCircle, RotateCcw, FileText, UploadCloud, X,
  Route, TrendingUp, CalendarClock, ShieldCheck,
} from 'lucide-react';
import DriverAuthStage from '../_components/DriverAuthStage';
import { AuthCard, CardHeading, Field, PrimaryButton } from '../_components/DriverAuthUI';

function DriverAvatar({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="8.2" r="3.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.6 20.2c.8-3.7 3.8-5.8 7.4-5.8s6.6 2.1 7.4 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.6 6.4c1.3-1.9 3.2-2.9 5.4-2.9s4.1 1 5.4 2.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function DriverRegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    licenseNumber: '',
    password: '',
    confirmPassword: '',
  });

  const set = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (error) setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Please enter your full name';
    if (!/^[6-9]\d{9}$/.test(form.phone)) return 'Please enter a valid 10-digit mobile number starting with 6-9';
    // The API requires an email, even though the reference marked it optional.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Please enter a valid email address';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (form.password !== form.confirmPassword) return 'Both passwords must match';
    if (!agreed) return 'Please accept the Terms & Conditions to continue';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }

    setIsLoading(true);
    setError('');
    try {
      const res = await fetch('/api/driver/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone,
          email: form.email.trim(),
          password: form.password,
          licenseNumber: form.licenseNumber.trim() || null,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(
          data?.error ||
            (res.status >= 500
              ? 'The server had a problem. Please try again in a moment.'
              : 'Registration failed. Please check your details and try again.'),
        );
      }
      if (data.token) localStorage.setItem('driver-token', data.token);

      // The account exists now, so the licence can be attached to it. A
      // failure here must not lose the account that was just created, so it
      // is reported and the driver carries on.
      if (licenseFile && data.token) {
        try {
          const fd = new FormData();
          fd.append('file', licenseFile);
          const up = await fetch('/api/driver/profile/license-document', {
            method: 'POST',
            headers: { Authorization: `Bearer ${data.token}` },
            body: fd,
          });
          if (!up.ok) {
            const problem = await up.json().catch(() => null);
            setError(
              (problem?.error || 'Your licence could not be uploaded') +
                '. Your account was created — you can upload it from your profile.',
            );
            setIsLoading(false);
            return;
          }
        } catch {
          setError('Your account was created, but the licence upload failed. You can upload it from your profile.');
          setIsLoading(false);
          return;
        }
      }

      router.push('/driver');
    } catch (err: any) {
      setError(
        err instanceof TypeError
          ? 'No internet connection. Check your network and try again.'
          : err?.message || 'Registration failed. Please try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  const eye = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      onClick={toggle}
      aria-label={shown ? 'Hide password' : 'Show password'}
      className="da-eye"
    >
      {shown ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
    </button>
  );

  return (
    <DriverAuthStage
      kicker="Join as a driver"
      titleTop="Be a part of"
      titleMain="TransRentals"
      blurb={
        <>
          Create your driver account in a minute and start taking trips from customers
          across the city — on <strong>your</strong> schedule.
        </>
      }
      featureLayout="column"
      features={[
        { icon: <Route className="h-[22px] w-[22px]" />, title: 'More Trips', body: 'A steady stream of bookings near you' },
        { icon: <TrendingUp className="h-[22px] w-[22px]" />, title: 'Better Earnings', body: 'Transparent fares, on-time payouts' },
        { icon: <CalendarClock className="h-[22px] w-[22px]" />, title: 'Full Flexibility', body: 'Go online whenever it suits you' },
        { icon: <ShieldCheck className="h-[22px] w-[22px]" />, title: 'Safety First', body: 'Verified customers and 24/7 support' },
      ]}
      tagline={['Join', 'Drive', 'Earn']}
      wide
      mirror
    >
      <AuthCard>
        <CardHeading
          icon={<DriverAvatar className="h-7 w-7" />}
          kicker="Create your account"
          title="Driver Sign Up"
          subtitle="Fill in your details to get started with TransRentals."
        />

        {error && (
          <div role="alert" className="da-alert mb-5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Paired rows, so the whole form is visible at once on a laptop
            screen rather than running off the bottom of the window. */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="name" label="Full Name" required
              icon={<User className="h-[18px] w-[18px]" />}
              value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="Enter your full name" autoComplete="name"
            />
            <Field
              id="phone" label="Mobile Number" required
              icon={<Smartphone className="h-[18px] w-[18px]" />}
              value={form.phone}
              onChange={(e) => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10 digit number"
              inputMode="numeric" autoComplete="tel"
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="email" label="Email ID" required
              icon={<Mail className="h-[18px] w-[18px]" />}
              type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              placeholder="Enter your email address"
              autoComplete="email" autoCapitalize="none" spellCheck={false}
            />
            <Field
              id="licenseNumber" label="Driver ID / Licence No."
              icon={<IdCard className="h-[18px] w-[18px]" />}
              value={form.licenseNumber}
              onChange={(e) => set('licenseNumber', e.target.value.toUpperCase())}
              placeholder="Licence number"
              autoCapitalize="characters"
            />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field
              id="password" label="Password" required
              icon={<Lock className="h-[18px] w-[18px]" />}
              type={showPassword ? 'text' : 'password'}
              value={form.password} onChange={(e) => set('password', e.target.value)}
              placeholder="Min 6 characters" autoComplete="new-password"
              suffix={eye(showPassword, () => setShowPassword((v) => !v))}
            />
            <Field
              id="confirmPassword" label="Confirm Password" required
              icon={<Lock className="h-[18px] w-[18px]" />}
              type={showConfirm ? 'text' : 'password'}
              value={form.confirmPassword} onChange={(e) => set('confirmPassword', e.target.value)}
              placeholder="Re-enter password" autoComplete="new-password"
              suffix={eye(showConfirm, () => setShowConfirm((v) => !v))}
            />
          </div>

          <div>
            <p className="da-upload-label">
              <FileText className="h-[18px] w-[18px] text-[#8C97B3]" />
              Upload Driving License
            </p>
            <label className={`da-upload${licenseFile ? ' is-set' : ''}`}>
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  // 5MB, which is what the box promises.
                  if (f && f.size > 5 * 1024 * 1024) {
                    setError('That file is larger than 5MB. Please choose a smaller one.');
                    e.target.value = '';
                    return;
                  }
                  setLicenseFile(f);
                  setError('');
                }}
              />
              {licenseFile ? (
                <>
                  <FileText className="h-6 w-6 shrink-0 text-[#15803D]" />
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[13.5px] font-semibold text-[#14203F]">{licenseFile.name}</span>
                    <span className="block text-[12px] text-[#8C97B3]">{(licenseFile.size / 1024).toFixed(0)} KB · click to replace</span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Remove file"
                    className="da-upload-x"
                    onClick={(e) => { e.preventDefault(); setLicenseFile(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLicenseFile(null); } }}
                  >
                    <X className="h-4 w-4" />
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-7 w-7 shrink-0 text-[#8C97B3]" />
                  <span className="text-left">
                    <span className="block text-[13.5px] text-[#5A6684]">
                      <b className="font-bold text-[#14203F]">Click to upload</b> or drag and drop
                    </span>
                    <span className="block text-[12px] text-[#98A2BA]">PDF, JPG, PNG (Max 5MB)</span>
                  </span>
                </>
              )}
            </label>
          </div>

          <label className="da-agree">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => { setAgreed(e.target.checked); setError(''); }}
              className="da-check"
            />
            <span>
              I agree to the{' '}
              <Link href="/terms-and-conditions" className="da-agree-link">Terms &amp; Conditions</Link>
              {' '}and{' '}
              <Link href="/privacy-policy" className="da-agree-link">Privacy Policy</Link>
            </span>
          </label>

          <PrimaryButton type="submit" loading={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
                Creating your account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-[18px] w-[18px]" />
              </>
            )}
          </PrimaryButton>
        </form>

        {/* One line rather than a second button: the sign-up form is long
            enough already, and this saves the window having to scroll. */}
        <p className="da-back">
          <RotateCcw className="h-4 w-4 text-[#15803D]" />
          Already have an account?
          <Link href="/driver/login" className="da-back-link">Login</Link>
        </p>

        <style
          dangerouslySetInnerHTML={{
            __html: `
              .da-upload-label {
                display: flex; align-items: center; gap: 9px;
                margin-bottom: 7px; padding-left: 2px;
                font-size: 12.5px; font-weight: 700; color: #26324F;
              }
              .da-upload {
                display: flex; align-items: center; justify-content: center; gap: 12px;
                border: 1.5px dashed #CBD4EA; border-radius: 14px;
                background: #FBFCFF; padding: 18px 16px; cursor: pointer;
                transition: border-color 0.2s ease, background 0.2s ease;
              }
              .da-upload:hover { border-color: #16A34A; background: #F3FAF5; }
              .da-upload:focus-within { border-color: #16A34A; box-shadow: 0 0 0 4px rgba(22,163,74,0.14); }
              .da-upload.is-set { border-style: solid; border-color: #BBE7CB; background: #F5FBF7; justify-content: flex-start; }
              .da-upload-x {
                display: grid; place-items: center; flex: 0 0 auto;
                width: 28px; height: 28px; border-radius: 8px; color: #8C97B3;
              }
              .da-upload-x:hover { background: #ECEFF9; color: #14203F; }

              .da-agree {
                display: flex; align-items: flex-start; gap: 10px;
                padding: 2px 2px 4px; cursor: pointer;
                font-size: 13px; color: #5A6684;
              }
              .da-check {
                width: 18px; height: 18px; margin-top: 1px; flex: 0 0 auto;
                accent-color: #16A34A; cursor: pointer;
              }
              .da-agree-link { color: #15803D; font-weight: 600; }
              .da-agree-link:hover { text-decoration: underline; }

              .da-back {
                display: flex; align-items: center; justify-content: center; gap: 8px;
                margin-top: 18px; padding-top: 16px; border-top: 1px solid #E8EEF0;
                font-size: 13.5px; color: #5A6684;
              }
              .da-back-link { color: #16A34A; font-weight: 700; }
              .da-back-link:hover { text-decoration: underline; }
            `,
          }}
        />
      </AuthCard>
    </DriverAuthStage>
  );
}
