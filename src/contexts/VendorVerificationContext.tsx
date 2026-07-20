'use client';

import { createContext, useContext } from 'react';

interface VendorVerificationContextType {
  isApproved: boolean;
  vendorStatus: string | null;
  hasAddress: boolean;
  /** Opens the "Complete verification" modal from any page */
  openVerificationModal: () => void;
}

export const VendorVerificationContext = createContext<VendorVerificationContextType>({
  isApproved: false,
  vendorStatus: null,
  hasAddress: true,
  openVerificationModal: () => {},
});

export function useVendorVerification() {
  return useContext(VendorVerificationContext);
}
