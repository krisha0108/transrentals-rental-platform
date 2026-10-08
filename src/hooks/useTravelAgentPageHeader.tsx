'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface TravelAgentPageHeaderValue {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  // Rendered immediately left of the title — used by detail pages for a Back
  // button, so the whole header sits in the sticky bar rather than in a second
  // row below it.
  leading?: React.ReactNode;
}

// Mirrors useManagerPageHeader's split-context design: pages only need the
// setter (a useState setter never changes identity), while only the top bar
// needs the actual value. One context would re-render every page consuming
// it whenever any page's header changed.
const TAHeaderValueContext = createContext<TravelAgentPageHeaderValue | null>(null);
const TAHeaderSetterContext = createContext<((header: TravelAgentPageHeaderValue | null) => void) | null>(null);

// Provided once by the travel-agent layout — holds whichever page's
// title/subtitle is currently registered, so it renders in the shared sticky
// top bar instead of every page repeating its own header block.
export function TravelAgentPageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<TravelAgentPageHeaderValue | null>(null);
  return (
    <TAHeaderSetterContext.Provider value={setHeader}>
      <TAHeaderValueContext.Provider value={header}>
        {children}
      </TAHeaderValueContext.Provider>
    </TAHeaderSetterContext.Provider>
  );
}

// Used by the top bar to read the currently-registered header.
export function useTravelAgentPageHeaderContext() {
  const header = useContext(TAHeaderValueContext);
  const setHeader = useContext(TAHeaderSetterContext);
  if (!setHeader) throw new Error('useTravelAgentPageHeaderContext must be used within TravelAgentPageHeaderProvider');
  return { header, setHeader };
}

// Call once per travel-agent page to put its title (and optional
// subtitle/action/leading) into the shared sticky top bar instead of
// rendering a local header block. Registers on mount and on every subsequent
// render (so a live `action` node stays in sync), clears on unmount so
// navigating to a page that hasn't adopted this yet doesn't leave a stale
// title showing.
export function useTravelAgentPageHeader(
  title: string,
  subtitle?: string,
  action?: React.ReactNode,
  leading?: React.ReactNode,
) {
  const setHeader = useContext(TAHeaderSetterContext);
  if (!setHeader) throw new Error('useTravelAgentPageHeader must be used within TravelAgentPageHeaderProvider');
  useEffect(() => {
    setHeader({ title, subtitle, action, leading });
    return () => setHeader(null);
  });
}
