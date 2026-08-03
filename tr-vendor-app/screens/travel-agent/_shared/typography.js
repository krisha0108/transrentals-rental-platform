// screens/travel-agent/_shared/typography.js
// Single source of truth for the Travel Agent app's display typeface.
//
// The TA design language (set by TravelAgentDashboardScreen) is serif-first:
// every piece of on-screen text uses DISPLAY. The two deliberate exceptions
// are monospace runs — URLs, capture-link slugs, transaction ids, ticket
// numbers — which stay monospace so characters stay unambiguous.
import { Platform } from "react-native";

export const DISPLAY = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });
