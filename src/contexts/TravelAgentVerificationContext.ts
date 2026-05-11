import { createContext, useContext } from 'react';

interface TravelAgentVerificationContextValue {
  isApproved: boolean;
  travelAgentStatus: string | null;
  openVerificationModal: () => void;
}

export const TravelAgentVerificationContext =
  createContext<TravelAgentVerificationContextValue>({
    isApproved: false,
    travelAgentStatus: null,
    openVerificationModal: () => {},
  });

export const useTravelAgentVerification = () =>
  useContext(TravelAgentVerificationContext);
