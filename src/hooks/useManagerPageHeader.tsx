'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface ManagerPageHeaderValue {
  title: string;
  subtitle?: string;
}

interface ManagerPageHeaderContextValue {
  header: ManagerPageHeaderValue | null;
  setHeader: (header: ManagerPageHeaderValue | null) => void;
}

const ManagerPageHeaderContext = createContext<ManagerPageHeaderContextValue | null>(null);

// Provided once by the manager layout — holds whichever page's title/subtitle
// is currently registered, so it can render in the shared sticky top bar
// instead of every page repeating its own header block.
export function ManagerPageHeaderProvider({ children }: { children: React.ReactNode }) {
  const [header, setHeader] = useState<ManagerPageHeaderValue | null>(null);
  const value = useMemo(() => ({ header, setHeader }), [header]);
  return <ManagerPageHeaderContext.Provider value={value}>{children}</ManagerPageHeaderContext.Provider>;
}

export function useManagerPageHeaderContext() {
  const ctx = useContext(ManagerPageHeaderContext);
  if (!ctx) throw new Error('useManagerPageHeaderContext must be used within ManagerPageHeaderProvider');
  return ctx;
}

// Call once per manager page to put its title (and optional subtitle) into
// the shared sticky top bar instead of rendering a local header block.
// Registers on mount, clears on unmount so navigating to a page that hasn't
// adopted this yet doesn't leave a stale title showing.
export function useManagerPageHeader(title: string, subtitle?: string) {
  const { setHeader } = useManagerPageHeaderContext();
  useEffect(() => {
    setHeader({ title, subtitle });
    return () => setHeader(null);
  }, [setHeader, title, subtitle]);
}
