import { apiClient } from '../apiClient';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  image?: string;
}

export interface AuthResponse {
  status?: string;
  message?: string;
  customer?: Customer;
  token?: string;
}

export const authService = {
  /**
   * Customer Login
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/login', {
      email,
      password,
    });

    if (response.token && response.customer) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('customer', JSON.stringify(response.customer));
    }

    return response;
  },

  /**
   * Send OTP for Registration
   */
  async sendOTP(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }): Promise<{ status?: string; message?: string }> {
    return apiClient.post('/send-otp', data);
  },

  /**
   * Verify OTP and Complete Registration
   */
  async verifyOTP(
    name: string,
    email: string,
    otp: string
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/verify-otp', {
      name,
      email,
      otp,
    });

    if (response.token && response.customer) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('customer', JSON.stringify(response.customer));
    }

    return response;
  },

  /**
   * Google Login
   */
  async googleLogin(token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/google-login', {
      token,
    });

    if (response.token && response.customer) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('customer', JSON.stringify(response.customer));
    }

    return response;
  },

  /**
   * Get Current Customer
   */
  getCurrentCustomer(): Customer | null {
    if (typeof window === 'undefined') return null;
    const customerData = localStorage.getItem('customer');
    return customerData ? JSON.parse(customerData) : null;
  },

  /**
   * Logout
   */
  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('customer');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },
};
