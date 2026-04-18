'use client';

import { createContext, useContext } from 'react';

interface VendorVerificationContextType {
  isApproved: boolean;
  vendorStatus: string | null;
  /** Opens the "Complete verification" modal from any page */
  openVerificationModal: () => void;
}

export const VendorVerificationContext = createContext<VendorVerificationContextType>({
  isApproved: false,
  vendorStatus: null,
  openVerificationModal: () => {},
});

export function useVendorVerification() {
  return useContext(VendorVerificationContext);
}
