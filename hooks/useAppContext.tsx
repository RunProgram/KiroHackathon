/**
 * AppContext — global state for TrustedContact and the most recent AnalysisResult.
 *
 * The provider loads initial values from AsyncStorage on mount so that data
 * persists across app restarts.
 *
 * Requirements: 9.3
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

import { loadRecentResult, loadTrustedContacts } from '../lib/storage';
import { AnalysisResult, TrustedContact } from '../types';

interface AppContextValue {
  trustedContacts: TrustedContact[];
  setTrustedContacts: (contacts: TrustedContact[]) => void;
  // Keep singular for backward compat — returns first contact
  trustedContact: TrustedContact | null;
  setTrustedContact: (contact: TrustedContact | null) => void;
  recentResult: AnalysisResult | null;
  setRecentResult: (result: AnalysisResult | null) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const AppContext = createContext<AppContextValue>({
  trustedContacts: [],
  setTrustedContacts: () => {},
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
  const [trustedContacts, setTrustedContacts] = useState<TrustedContact[]>([]);
  const [recentResult, setRecentResult] = useState<AnalysisResult | null>(null);

  // Derived: first contact for backward compat
  const trustedContact = trustedContacts[0] ?? null;
  function setTrustedContact(contact: TrustedContact | null): void {
    if (contact === null) {
      setTrustedContacts([]);
    } else {
      setTrustedContacts((prev) => {
        const without = prev.filter((c) => c.id !== contact.id);
        return [contact, ...without];
      });
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const [contacts, result] = await Promise.all([
        loadTrustedContacts(),
        loadRecentResult(),
      ]);
      if (!cancelled) {
        if (contacts.length > 0) setTrustedContacts(contacts);
        if (result !== null) setRecentResult(result);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppContext.Provider
      value={{ trustedContacts, setTrustedContacts, trustedContact, setTrustedContact, recentResult, setRecentResult }}
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
