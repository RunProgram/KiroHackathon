import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  saveTrustedContact,
  loadTrustedContact,
  saveRecentResult,
  loadRecentResult,
} from '../../lib/storage';
import { TrustedContact, AnalysisResult } from '../../types';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
}));

const mockSetItem = AsyncStorage.setItem as jest.MockedFunction<typeof AsyncStorage.setItem>;
const mockGetItem = AsyncStorage.getItem as jest.MockedFunction<typeof AsyncStorage.getItem>;

const sampleContact: TrustedContact = {
  name: 'Jane Doe',
  phoneNumber: '+15551234567',
  relationship: 'Daughter',
};

const sampleResult: AnalysisResult = {
  riskLevel: 'High Risk',
  scamType: 'bank_impersonation',
  redFlags: ['urgency', 'impersonation_bank'],
  doNow: ['Hang up immediately', 'Call your bank directly'],
  doNotDo: ['Do not give out your account number'],
  safeResponseScript: 'I need to verify this with my bank. I will call them directly.',
  caregiverRecommended: true,
  analyzedAt: '2024-01-01T00:00:00.000Z',
  inputSummary: 'This is the bank calling about suspicious activity on your account.',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── saveTrustedContact / loadTrustedContact ──────────────────────────────────

describe('saveTrustedContact', () => {
  it('serializes the contact and writes it to AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);

    await saveTrustedContact(sampleContact);

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith(
      'trustpause:trusted_contact',
      JSON.stringify(sampleContact),
    );
  });
});

describe('loadTrustedContact', () => {
  it('returns the deserialized contact when one is stored', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify(sampleContact));

    const result = await loadTrustedContact();

    expect(result).toEqual(sampleContact);
  });

  it('returns null when no contact has been saved', async () => {
    mockGetItem.mockResolvedValueOnce(null);

    const result = await loadTrustedContact();

    expect(result).toBeNull();
  });

  it('returns null when AsyncStorage throws', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Storage unavailable'));

    const result = await loadTrustedContact();

    expect(result).toBeNull();
  });

  it('round-trips a TrustedContact through save then load', async () => {
    // Capture what was written so the load mock can return it
    let stored: string | null = null;
    mockSetItem.mockImplementationOnce(async (_key, value) => {
      stored = value;
    });
    mockGetItem.mockImplementationOnce(async () => stored);

    await saveTrustedContact(sampleContact);
    const loaded = await loadTrustedContact();

    expect(loaded).toEqual(sampleContact);
  });
});

// ─── saveRecentResult / loadRecentResult ─────────────────────────────────────

describe('saveRecentResult', () => {
  it('serializes the result and writes it to AsyncStorage', async () => {
    mockSetItem.mockResolvedValueOnce(undefined);

    await saveRecentResult(sampleResult);

    expect(mockSetItem).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith(
      'trustpause:recent_result',
      JSON.stringify(sampleResult),
    );
  });
});

describe('loadRecentResult', () => {
  it('returns the deserialized result when one is stored', async () => {
    mockGetItem.mockResolvedValueOnce(JSON.stringify(sampleResult));

    const result = await loadRecentResult();

    expect(result).toEqual(sampleResult);
  });

  it('returns null when no result has been saved', async () => {
    mockGetItem.mockResolvedValueOnce(null);

    const result = await loadRecentResult();

    expect(result).toBeNull();
  });

  it('returns null when AsyncStorage throws', async () => {
    mockGetItem.mockRejectedValueOnce(new Error('Disk full'));

    const result = await loadRecentResult();

    expect(result).toBeNull();
  });

  it('round-trips an AnalysisResult through save then load', async () => {
    let stored: string | null = null;
    mockSetItem.mockImplementationOnce(async (_key, value) => {
      stored = value;
    });
    mockGetItem.mockImplementationOnce(async () => stored);

    await saveRecentResult(sampleResult);
    const loaded = await loadRecentResult();

    expect(loaded).toEqual(sampleResult);
  });
});
