import React from 'react';
import { View } from 'react-native';
import { useVendorActivityHeartbeat } from './useVendorActivityHeartbeat';

// Wraps the whole app so every touch anywhere in the tree marks the vendor
// "active" for the heartbeat below. onStartShouldSetResponderCapture fires
// during the capture phase (top-down, before any child becomes the
// responder) and returning `false` means this View never claims the
// responder itself — so it's purely observational and can't block or steal
// a tap, swipe, or gesture-handler interaction underneath it.
export default function VendorActivityTracker({ children }) {
  const { markActive } = useVendorActivityHeartbeat();
  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        markActive();
        return false;
      }}
    >
      {children}
    </View>
  );
}
