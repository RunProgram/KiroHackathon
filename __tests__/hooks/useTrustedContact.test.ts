/**
 * Unit tests for useTrustedContact hook.
 *
 * Requirements: 6.2, 6.4
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import { AppContextProvider } from '../../hooks/useAppContext';
import { useTrustedContact } from '../../hooks/useTrustedContact';
import { TrustedContact } from '../../types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render the hook inside the AppContextProvider. */
function renderUseTrustedContact() {
  return renderHook(() => useTrustedContact(), {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(AppContextProvider, null, children),
  });
}

const validContact: TrustedContact = {
  name: 'Jane Doe',
  phoneNumber: '+15551234567',
  relationship: 'Daughter',
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Default: no contact stored in AsyncStorage
  mockGetItem.mockResolvedValue(null);
  mockSetItem.mockResolvedValue(undefined);
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTrustedContact — initial state', () => {
  it('returns null contact when nothing is stored', async () => {
    const { result } = renderUseTrustedContact();

    // Wait for the provider's useEffect to finish loading from AsyncStorage
    await act(async () => {});

    expect(result.current.contact).toBeNull();
  });
});

describe('useTrustedContact — saveContact', () => {
  it('persists a valid contact to AsyncStorage and updates context', async () => {
    const { result } = renderUseTrustedContact();
    await act(async () => {});

    await act(async () => {
      await result.current.saveContact(validContact);
    });

    expect(mockSetItem).toHaveBeenCalledWith(
      'trustpause:trusted_contact',
      JSON.stringify(validContact)
    );
    expect(result.current.contact).toEqual(validContact);
  });

  it('save/load round-trip: saved contact is reflected in context', async () => {
    // Simulate AsyncStorage returning the stored value on load
    let stored: string | null = null;
    mockSetItem.mockImplementation(async (_key, value) => {
      stored = value;
    });
    mockGetItem.mockImplementation(async () => stored);

    const { result } = renderUseTrustedContact();
    await act(async () => {});

    await act(async () => {
      await result.current.saveContact(validContact);
    });

    expect(result.current.contact).toEqual(validContact);
  });

  it('throws an error when the phone number is invalid', async () => {
    const { result } = renderUseTrustedContact();
    await act(async () => {});

    const invalidContact: TrustedContact = {
      name: 'Bob',
      phoneNumber: 'not-a-phone',
      relationship: 'Son',
    };

    await expect(
      act(async () => {
        await result.current.saveContact(invalidContact);
      })
    ).rejects.toThrow('Invalid phone number format.');
  });

  it('does not call AsyncStorage when the phone number is invalid', async () => {
    const { result } = renderUseTrustedContact();
    await act(async () => {});

    const invalidContact: TrustedContact = {
      name: 'Bob',
      phoneNumber: '12345',
      relationship: 'Son',
    };

    try {
      await act(async () => {
        await result.current.saveContact(invalidContact);
      });
    } catch {
      // expected
    }

    expect(mockSetItem).not.toHaveBeenCalled();
  });

  it('does not update context when the phone number is invalid', async () => {
    const { result } = renderUseTrustedContact();
    await act(async () => {});

    const invalidContact: TrustedContact = {
      name: 'Bob',
      phoneNumber: 'bad',
      relationship: 'Son',
    };

    try {
      await act(async () => {
        await result.current.saveContact(invalidContact);
      });
    } catch {
      // expected
    }

    expect(result.current.contact).toBeNull();
  });
});

describe('useTrustedContact — clearContact', () => {
  it('sets contact to null in context', async () => {
    const { result } = renderUseTrustedContact();
    await act(async () => {});

    // First save a valid contact
    await act(async () => {
      await result.current.saveContact(validContact);
    });
    expect(result.current.contact).toEqual(validContact);

    // Then clear it
    await act(async () => {
      await result.current.clearContact();
    });
    expect(result.current.contact).toBeNull();
  });
});
