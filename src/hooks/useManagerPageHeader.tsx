'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ManagerPageHeaderValue {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  // Rendered immediately left of the title — used by detail pages for a Back
  // button, so the whole header sits in the sticky bar rather than in a second
  // row below it.
  leading?: React.ReactNode;
}

// Split into two contexts on purpose: pages calling useManagerPageHeader()
// only need `setHeader` (stable — a useState setter never changes identity),
// while only the top bar needs the actual `header` value. If both were one
// context, every page consuming it (just to reach `setHeader`) would
// re-render whenever ANY page's header value changed — and since the
// register-on-every-render effect below calls setHeader every render, that
// re-render would immediately trigger the effect again, forever. Splitting
// them means updating `header` only re-renders the top bar, not the page.
const ManagerHeaderValueContext = createContext<ManagerPageHeaderValue | null>(null);
const ManagerHeaderSetterContext = createContext<((header: ManagerPageHeaderValue | null) => void) | null>(null);

// Provided once by the manager layout — holds whichever page's title/subtitle
// is currently registered, so it can render in the shared sticky top bar
// instead of every page repeating its own header block.
export function ManagerPageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<ManagerPageHeaderValue | null>(null);
  return (
    <ManagerHeaderSetterContext.Provider value={setHeader}>
      <ManagerHeaderValueContext.Provider value={header}>
        {children}
      </ManagerHeaderValueContext.Provider>
    </ManagerHeaderSetterContext.Provider>
  );
}

// Used by the top bar to read the currently-registered header.
export function useManagerPageHeaderContext() {
  const header = useContext(ManagerHeaderValueContext);
  const setHeader = useContext(ManagerHeaderSetterContext);
  if (!setHeader) throw new Error('useManagerPageHeaderContext must be used within ManagerPageHeaderProvider');
  return { header, setHeader };
}

// Call once per manager page to put its title (and optional subtitle/action)
// into the shared sticky top bar instead of rendering a local header block.
// Registers on mount and on every subsequent render (so a live `action` node
// — e.g. a Refresh button whose spinner/disabled state changes — stays in
// sync), clears on unmount so navigating to a page that hasn't adopted this
// yet doesn't leave a stale title showing. Safe to run every render because
// this only subscribes to the setter context, which never changes identity.
export function useManagerPageHeader(
  title: string,
  subtitle?: string,
  action?: React.ReactNode,
  leading?: React.ReactNode,
) {
  const setHeader = useContext(ManagerHeaderSetterContext);
  if (!setHeader) throw new Error('useManagerPageHeader must be used within ManagerPageHeaderProvider');
  useEffect(() => {
    setHeader({ title, subtitle, action, leading });
    return () => setHeader(null);
  });
}
