/**
 * useTrustedContact — hook for managing up to 3 trusted contacts.
 */

import { saveTrustedContacts } from '../lib/storage';
import { validatePhoneNumber } from '../lib/validation';
import { TrustedContact } from '../types';
import { useAppContext } from './useAppContext';

export const MAX_TRUSTED_CONTACTS = 3;

export function useTrustedContact() {
  const { trustedContacts, setTrustedContacts, trustedContact } = useAppContext();

  async function saveContact(contact: TrustedContact): Promise<void> {
    const validation = validatePhoneNumber(contact.phoneNumber);
    if (!validation.valid) throw new Error(validation.error);

    const existing = trustedContacts.findIndex((c) => c.id === contact.id);
    let updated: TrustedContact[];
    if (existing >= 0) {
      // Update in place
      updated = trustedContacts.map((c) => (c.id === contact.id ? contact : c));
    } else {
      if (trustedContacts.length >= MAX_TRUSTED_CONTACTS) {
        throw new Error(`You can only save up to ${MAX_TRUSTED_CONTACTS} trusted contacts.`);
      }
      updated = [...trustedContacts, contact];
    }

    await saveTrustedContacts(updated);
    setTrustedContacts(updated);
  }

  async function removeContact(id: string): Promise<void> {
    const updated = trustedContacts.filter((c) => c.id !== id);
    await saveTrustedContacts(updated);
    setTrustedContacts(updated);
  }

  async function clearContact(): Promise<void> {
    await saveTrustedContacts([]);
    setTrustedContacts([]);
  }

  return {
    contact: trustedContact,           // first contact (backward compat)
    contacts: trustedContacts,         // all contacts
    saveContact,
    removeContact,
    clearContact,
  };
}
