import Razorpay from 'razorpay';

// Initialize Razorpay instance
// Use test keys for development, replace with live keys in production
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
});

export default razorpayInstance;

// Razorpay configuration constants
export const RAZORPAY_CONFIG = {
  currency: 'INR',
  name: 'TransRentals',
  description: 'Bike Rental Payment',
  prefill: {
    name: '',
    email: '',
    contact: '',
  },
  notes: {
    platform: 'TransRentals',
  },
};

// Payment status constants
export const PAYMENT_STATUS = {
  CREATED: 'created',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

// Verify Razorpay signature
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const crypto = require('crypto');
  const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret';

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body.toString())
    .digest('hex');

  return expectedSignature === signature;
}
