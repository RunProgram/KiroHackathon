import AsyncStorage from '@react-native-async-storage/async-storage';

import { TrustedContact, AnalysisResult } from '../types';
import { STORAGE_KEYS } from '../constants/storage';

/**
 * Persists a TrustedContact to AsyncStorage.
 * Requirements: 6.2, 9.4
 */
export async function saveTrustedContact(contact: TrustedContact): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.TRUSTED_CONTACT, JSON.stringify(contact));
}

/**
 * Loads the saved TrustedContact from AsyncStorage.
 * Returns null if no contact has been saved or if a read error occurs.
 * Requirements: 6.2, 9.4
 */
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
