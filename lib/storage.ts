import AsyncStorage from '@react-native-async-storage/async-storage';

import { TrustedContact, AnalysisResult } from '../types';
import { STORAGE_KEYS } from '../constants/storage';

// ---------------------------------------------------------------------------
// Trusted contacts (array, max 3)
// ---------------------------------------------------------------------------

export async function saveTrustedContacts(contacts: TrustedContact[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACTS, JSON.stringify(contacts));
}

export async function loadTrustedContacts(): Promise<TrustedContact[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACTS);
    if (raw === null) {
      // Migrate legacy single contact if present
      const legacy = await AsyncStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACT);
      if (legacy) {
        const old = JSON.parse(legacy) as Omit<TrustedContact, 'id'>;
        const migrated: TrustedContact[] = [{ ...old, id: 'legacy-1' }];
        await saveTrustedContacts(migrated);
        return migrated;
      }
      return [];
    }
    return JSON.parse(raw) as TrustedContact[];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Legacy single contact (kept for backward compat)
// ---------------------------------------------------------------------------

export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACT, JSON.stringify(contact));
}

export async function loadTrustedContact(): Promise<TrustedContact | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.TRUSTED_CONTACT);
    if (raw === null) return null;
    return JSON.parse(raw) as TrustedContact;
  } catch {
    return null;
  }
}

/**
 * Persists the most recent AnalysisResult to AsyncStorage.
 * Requirements: 5.11, 9.4
 */
export async function saveRecentResult(result: AnalysisResult): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.RECENT_RESULT, JSON.stringify(result));
}

/**
 * Loads the most recent AnalysisResult from AsyncStorage.
 * Returns null if no result has been saved or if a read error occurs.
 * Requirements: 9.4
 */
export async function loadRecentResult(): Promise<AnalysisResult | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_RESULT);
    if (raw === null) return null;
    return JSON.parse(raw) as AnalysisResult;
  } catch {
    return null;
  }
}
