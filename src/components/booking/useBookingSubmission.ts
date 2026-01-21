import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { submitBookingWithCustomer } from '@/lib/utils/bookingHelper';
import { trackFormSubmission } from '@/components/analytics/VisitorTracker';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export function useBookingSubmission(bookingType: string, formName?: string) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const formStartTimeRef = useRef<number>(Date.now());

  // Reset form start time when component mounts
  useEffect(() => {
    formStartTimeRef.current = Date.now();
  }, []);

  const submitBooking = async (
    customerInfo: CustomerInfo,
    bookingData: Record<string, unknown>
  ) => {
    setIsSubmitting(true);
    setError(null);

    // Calculate time to fill
    const timeToFill = Math.round((Date.now() - formStartTimeRef.current) / 1000);

    try {
      const result = await submitBookingWithCustomer(
        customerInfo,
        bookingData,
        bookingType
      );

      if (result.success) {
        // Track successful form submission
        await trackFormSubmission({
          formType: 'BOOKING',
          formName: formName || `${bookingType}BookingForm`,
          pagePath: pathname,
          pageTitle: document.title,
          serviceType: bookingType,
          pickupLocation: (bookingData.pickup_location as string) || (bookingData.pickupLocation as string) || undefined,
          dropLocation: (bookingData.drop_location as string) || (bookingData.dropLocation as string) || undefined,
          status: 'SUBMITTED',
          timeToFill,
        });

        // Store booking ID for dashboard
        if (typeof window !== 'undefined') {
          localStorage.setItem('last_booking_id', result.booking_id?.toString() || '');

          // Auto-login the customer after successful booking
          // Store customer data in localStorage for session persistence
          if (result.customer) {
            localStorage.setItem('customer', JSON.stringify(result.customer));
            // Generate a simple session token for local auth
            const sessionToken = `tr_${result.customer.id}_${Date.now()}`;
            localStorage.setItem('auth_token', sessionToken);
            localStorage.setItem('token', sessionToken);
          }
        }

        // Redirect to dashboard
        router.push(result.redirect_to || '/customer/dashboard');
      } else {
        // Track failed submission
        await trackFormSubmission({
          formType: 'BOOKING',
          formName: formName || `${bookingType}BookingForm`,
          pagePath: pathname,
          pageTitle: document.title,
          serviceType: bookingType,
          status: 'FAILED',
          errorMessage: result.message,
          timeToFill,
        });
        setError(result.message);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit booking';

      // Track error
      await trackFormSubmission({
        formType: 'BOOKING',
        formName: formName || `${bookingType}BookingForm`,
        pagePath: pathname,
        pageTitle: document.title,
        serviceType: bookingType,
        status: 'FAILED',
        errorMessage,
        timeToFill,
      });

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Track when form is started (first interaction)
  const trackFormStart = async () => {
    await trackFormSubmission({
      formType: 'BOOKING',
      formName: formName || `${bookingType}BookingForm`,
      pagePath: pathname,
      pageTitle: document.title,
      serviceType: bookingType,
      status: 'PENDING',
      timeToFill: 0,
    });
  };

  return {
    isSubmitting,
    error,
    submitBooking,
    setError,
    trackFormStart,
  };
}
