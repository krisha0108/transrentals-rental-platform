// utils/isTravelAgent.js
// Phase 7 — Detect whether the currently logged-in customer is actually a
// Travel Agent who logged in via /api/customer/auth (which creates a shadow
// customer with `linkedTravelAgentId` set — see
// src/app/api/customer/auth/route.ts:153 + ensureShadowCustomer:181).
//
// All booking-create screens read the `customer` blob from AsyncStorage to
// build their requestData. This helper just inspects that same blob and tells
// you whether the user is acting as a Travel Agent — so the UI can show the
// Personal/Company toggle and the payload can be tagged accordingly.
//
// Usage:
//   const { isTravelAgent, travelAgentId } = await getTravelAgentContext();
//   if (isTravelAgent) { ... }
//
// Or via the React hook:
//   const { isTravelAgent, travelAgentId, loading } = useTravelAgent();
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Read the cached customer object from AsyncStorage (best-effort, never throws).
 * @returns {Promise<object|null>}
 */
export async function getCachedCustomer() {
  try {
    const raw = await AsyncStorage.getItem("customer");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Inspect the cached customer to determine TA context.
 *
 * @returns {Promise<{
 *   isTravelAgent: boolean,
 *   travelAgentId: string | null,
 *   customer: object | null,
 * }>}
 */
export async function getTravelAgentContext() {
  const customer = await getCachedCustomer();
  const linkedId = customer?.linkedTravelAgentId || null;
  return {
    isTravelAgent: !!linkedId,
    travelAgentId: linkedId,
    customer,
  };
}

/** Synchronous variant for code that already has the customer object in hand. */
export function isTravelAgentCustomer(customer) {
  return !!customer?.linkedTravelAgentId;
}

/**
 * React hook — re-checks on screen focus is the caller's responsibility
 * (use it inside a useFocusEffect / addListener('focus') if you need that).
 *
 *   const { isTravelAgent, travelAgentId, loading, refresh } = useTravelAgent();
 */
export function useTravelAgent() {
  const [state, setState] = useState({
    isTravelAgent: false,
    travelAgentId: null,
    customer: null,
    loading: true,
  });

  const refresh = async () => {
    const ctx = await getTravelAgentContext();
    setState({ ...ctx, loading: false });
  };

  useEffect(() => { refresh(); }, []);

  return { ...state, refresh };
}

export default {
  getCachedCustomer,
  getTravelAgentContext,
  isTravelAgentCustomer,
  useTravelAgent,
};
