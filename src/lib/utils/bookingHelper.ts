export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  password?: string;
}

export interface BookingSubmissionResult {
  success: boolean;
  message: string;
  booking_id?: number | string;
  customer_id?: number | string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  redirect_to?: string;
}

/**
 * Helper to handle booking submission with customer data collection
 * This function:
 * 1. Gets or creates customer
 * 2. Submits booking to backend
 * 3. Returns result with redirect info
 */
export async function submitBookingWithCustomer(
  customerInfo: CustomerInfo,
  bookingData: any,
  bookingType: string
): Promise<BookingSubmissionResult> {
  try {
    // SIMPLIFIED: Use unified booking API endpoint
    // All bookings now go through a single endpoint for easier backend integration
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bookingType,
        customerInfo,
        bookingData,
      }),
    });

    const result = await response.json();

    // Store customer info temporarily if new customer
    if (result.success && result.customer_id === 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('temp_customer', JSON.stringify(customerInfo));
      }
    }

    return result;
  } catch (error) {
    console.error('Booking submission error:', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to submit booking. Please try again.',
    };
  }
}
