/**
 * AppContext — global state for TrustedContact and the most recent AnalysisResult.
 *
 * The provider loads initial values from AsyncStorage on mount so that data
 * persists across app restarts.
 *
 * Requirements: 9.3
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadRecentResult, loadTrustedContact } from '../lib/storage';
import { AnalysisResult, TrustedContact } from '../types';

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface AppContextValue {
  trustedContact: TrustedContact | null;
  setTrustedContact: (contact: TrustedContact | null) => void;
  recentResult: AnalysisResult | null;
  setRecentResult: (result: AnalysisResult | null) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AppContext = createContext<AppContextValue>({
  trustedContact: null,
  setTrustedContact: () => {},
  recentResult: null,
  setRecentResult: () => {},
});

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AppContextProviderProps {
  children: React.ReactNode;
}

export function AppContextProvider({ children }: AppContextProviderProps): React.JSX.Element {
  const [trustedContact, setTrustedContact] = useState<TrustedContact | null>(null);
  const [recentResult, setRecentResult] = useState<AnalysisResult | null>(null);

  // Load persisted values from AsyncStorage on mount
  useEffect(() => {
    let cancelled = false;

    async function loadPersistedState(): Promise<void> {
      const [contact, result] = await Promise.all([
        loadTrustedContact(),
        loadRecentResult(),
      ]);

      if (!cancelled) {
        if (contact !== null) setTrustedContact(contact);
        if (result !== null) setRecentResult(result);
      }
    }

    loadPersistedState();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppContext.Provider
      value={{ trustedContact, setTrustedContact, recentResult, setRecentResult }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the current AppContext value.
 * Must be used inside an `AppContextProvider`.
 */
export function useAppContext(): AppContextValue {
  return useContext(AppContext);
}
