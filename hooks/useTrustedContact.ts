/**
 * useTrustedContact — hook for reading and managing the saved TrustedContact.
 *
 * Requirements: 6.1, 6.2, 6.4, 6.5
 */

import { saveTrustedContact } from '../lib/storage';
import { validatePhoneNumber } from '../lib/validation';
import { TrustedContact } from '../types';
import { useAppContext } from './useAppContext';

interface UseTrustedContactResult {
  /** The currently saved trusted contact, or null if none has been saved. */
  contact: TrustedContact | null;
  /**
   * Validates the contact's phone number, persists the contact to AsyncStorage,
   * and updates the context.
   *
   * @throws {Error} If the phone number is not a valid format.
   */
  saveContact: (contact: TrustedContact) => Promise<void>;
  /**
   * Clears the trusted contact from context (sets to null).
   * Does not delete from AsyncStorage for MVP.
   */
  clearContact: () => Promise<void>;
}

/**
 * Hook for reading and managing the saved TrustedContact.
 *
 * Must be used inside an `AppContextProvider`.
 */
export function useTrustedContact(): UseTrustedContactResult {
  const { trustedContact, setTrustedContact } = useAppContext();

  async function saveContact(contact: TrustedContact): Promise<void> {
    const validation = validatePhoneNumber(contact.phoneNumber);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    await saveTrustedContact(contact);
    setTrustedContact(contact);
  }

  async function clearContact(): Promise<void> {
    setTrustedContact(null);
  }

  return {
    contact: trustedContact,
    saveContact,
    clearContact,
  };
}
